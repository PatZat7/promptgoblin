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
});
