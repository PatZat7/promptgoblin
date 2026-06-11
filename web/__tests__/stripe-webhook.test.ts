import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = join(__dirname, "..", "..");

function readRepoFile(path: string) {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("Stripe checkout provisioning", () => {
  it("ships the billing/idempotency migration and provisioning RPC", () => {
    const migrationPath = join(
      repoRoot,
      "supabase/migrations/0015_stripe_events.sql",
    );
    expect(existsSync(migrationPath)).toBe(true);

    const migration = readFileSync(migrationPath, "utf8");
    expect(migration).toContain("create table if not exists public.stripe_events");
    expect(migration).toContain("status in ('processing','processed','failed','ignored')");
    expect(migration).toContain("stripe_customer_id");
    expect(migration).toContain("stripe_subscription_id");
    expect(migration).toContain("create or replace function public.provision_stripe_checkout_client");
    expect(migration).toContain("on conflict (client_id, user_id) do update");
  });

  it("verifies Stripe signatures and uses insert-before-process idempotency", () => {
    const route = readRepoFile("web/app/api/webhooks/stripe/route.ts");

    expect(route).toContain("stripe.webhooks.constructEvent");
    expect(route).toContain("stripe-signature");
    expect(route).toContain("function claimEvent");
    expect(route).toContain(".from(\"stripe_events\").insert");
    expect(route).toContain("checkout.session.completed");
    expect(route).toContain("invoice.payment_failed");
    expect(route).toContain("customer.subscription.deleted");
  });

  it("uses hashed magic-link tokens behind a click interstitial", () => {
    const route = readRepoFile("web/app/api/webhooks/stripe/route.ts");
    const confirmPage = readRepoFile("web/app/auth/confirm/page.tsx");
    const confirmClient = readRepoFile("web/app/auth/confirm/ConfirmClient.tsx");
    const verifyRoute = readRepoFile("web/app/auth/confirm/verify/route.ts");

    expect(route).toContain("properties?.hashed_token");
    expect(route).not.toContain("action_link");
    expect(confirmPage).toContain("ConfirmClient");
    expect(confirmClient).toContain("/auth/confirm/verify");
    expect(verifyRoute).toContain("verifyOtp");
    expect(verifyRoute).toContain("token_hash");
  });

  it("documents required server-only webhook environment", () => {
    const envExample = readRepoFile("web/.env.example");
    const packageJson = JSON.parse(readRepoFile("web/package.json"));

    expect(envExample).toContain("STRIPE_SECRET_KEY=");
    expect(envExample).toContain("STRIPE_WEBHOOK_SECRET=");
    expect(envExample).toContain("RESEND_API_KEY=");
    expect(packageJson.dependencies).toHaveProperty("stripe");
  });

  // Regression locks for the 2026-06-09 security review (C1/H1/H2/M1).
  it("derives the magic-link origin from config, never the request host (C1)", () => {
    const route = readRepoFile("web/app/api/webhooks/stripe/route.ts");
    const appSpec = readRepoFile(".do/app.yaml");

    // No Host-header-derived origin — that would let a forged Host phish the token.
    expect(route).not.toContain("new URL(request.url).origin");
    expect(route).toContain("function getSiteOrigin");
    expect(route).toContain("NEXT_PUBLIC_SITE_URL");
    // The deployed app must actually set it, or provisioning refuses to send.
    expect(appSpec).toContain("NEXT_PUBLIC_SITE_URL");
  });

  it("treats welcome-email failure as best-effort, not customer loss (H1)", () => {
    const route = readRepoFile("web/app/api/webhooks/stripe/route.ts");
    const migration = readRepoFile("supabase/migrations/0015_stripe_events.sql");

    // Email failure is recorded, not silently swallowed, and the event is still
    // marked processed (Stripe must not retry a completed provision).
    expect(route).toContain("welcome_email_status");
    expect(route).toContain('markEvent(supabase, event, "processed", result.warning)');
    expect(migration).toContain("welcome_email_status");
  });

  it("reclaims orphaned processing rows instead of dropping them (H2)", () => {
    const route = readRepoFile("web/app/api/webhooks/stripe/route.ts");
    expect(route).toContain("STALE_PROCESSING_MS");
    // Active duplicate => non-2xx so Stripe retries (not a 200 that drops it).
    expect(route).toContain("status: 409");
  });

  it("refuses to grant a seat on a domain owned by another tenant (M1)", () => {
    const route = readRepoFile("web/app/api/webhooks/stripe/route.ts");
    const migration = readRepoFile("supabase/migrations/0015_stripe_events.sql");
    expect(migration).toContain("DOMAIN_OWNED_BY_OTHER_USER");
    expect(migration).toContain("raise exception");
    expect(route).toContain("DOMAIN_OWNED_BY_OTHER_USER");
  });
});
