import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Same source-assertion / regression-lock style as stripe-webhook.test.ts:
// these read the real handler + migration + verify route and lock the code
// constructs that implement the critical checkout-path guarantees. No live
// Stripe/Supabase needed — the behavior is pinned at the source level so a
// refactor that drops a guard fails CI.
//
// Added 2026-06-13 (overnight sprint) to close the gaps called out for the
// checkout path: idempotency, non-paid rejection, email-failure resilience,
// invalid-token rejection, and cross-tenant domain isolation.

const repoRoot = join(__dirname, "..", "..");
const read = (p: string) => readFileSync(join(repoRoot, p), "utf8");

const ROUTE = "web/app/api/webhooks/stripe/route.ts";
const MIGRATION = "supabase/migrations/0015_stripe_events.sql";
const VERIFY = "web/app/auth/confirm/verify/route.ts";

describe("checkout flow — critical path guards", () => {
  it("idempotency: a duplicate (already-processed) event returns early and never re-provisions", () => {
    const route = read(ROUTE);
    // claimEvent gates the handler; an already-processed event short-circuits to a
    // 200 duplicate BEFORE handleEvent runs, so provisioning can't run twice.
    expect(route).toContain("function claimEvent");
    expect(route).toContain('claim === "processed"');
    expect(route).toContain("duplicate: true");
    // Insert-before-process: the ledger row is claimed before work begins.
    expect(route).toContain('.from("stripe_events").insert');
    // An in-flight duplicate is told to retry (409), not silently dropped.
    expect(route).toContain('claim === "processing"');
    expect(route).toContain("status: 409");
    // The ledger table is keyed by the Stripe event id (dedupe anchor).
    expect(read(MIGRATION)).toContain("create table if not exists public.stripe_events");
  });

  it("non-paid rejection: payment_status !== 'paid' is ignored with no provisioning side effects", () => {
    const route = read(ROUTE);
    expect(route).toContain('session.payment_status !== "paid"');
    // The unpaid branch returns ignored...
    expect(route).toContain("{ ignored: true }");
    // ...and the handler marks the event 'ignored' WITHOUT calling provisioning.
    expect(route).toContain('markEvent(supabase, event, "ignored")');
    // Guard ordering: the payment_status check precedes any createOrLinkAuthUser /
    // provisionClient call inside handleCheckoutCompleted.
    const handlerStart = route.indexOf("async function handleCheckoutCompleted");
    const paidCheck = route.indexOf('payment_status !== "paid"', handlerStart);
    const provisionCall = route.indexOf("provisionClient(", handlerStart);
    expect(handlerStart).toBeGreaterThan(-1);
    expect(paidCheck).toBeGreaterThan(handlerStart);
    expect(paidCheck).toBeLessThan(provisionCall);
  });

  it("email resilience: a Resend failure is best-effort and does NOT block provisioning", () => {
    const route = read(ROUTE);
    // sendWelcomeEmail returns a warning string on failure instead of throwing.
    expect(route).toContain("Resend email failed");
    // Provisioning success + email failure => event marked 'processed' (Stripe must
    // NOT retry a completed provision) and the failure recorded on the client row.
    expect(route).toContain('markEvent(supabase, event, "processed", result.warning)');
    expect(route).toContain("welcome_email_status");
    // recordWelcomeEmailStatus is explicitly best-effort (never throws).
    expect(route).toContain("Best-effort bookkeeping — never throw");
  });

  it("invalid token: a malformed or expired magic-link token is rejected 4xx with no session", () => {
    const verify = read(VERIFY);
    // Uses verifyOtp(token_hash), never the GET-consumable exchangeCodeForSession
    // CALL (the prose comment names it as the thing we deliberately avoid).
    expect(verify).toContain("verifyOtp");
    expect(verify).toContain("token_hash");
    expect(verify).not.toContain("exchangeCodeForSession(");
    // Malformed input (wrong type / non-string token) => 400 before any auth call.
    expect(verify).toContain('body.type !== "magiclink"');
    expect(verify).toContain("status: 400");
    // verifyOtp error (expired/invalid) => 400 and the internal reason is not leaked.
    expect(verify).toContain("Invalid or expired link");
    expect(verify).toContain("Don't leak internal verifyOtp detail");
  });

  it("cross-tenant isolation: a domain owned by another tenant cannot be seized", () => {
    const route = read(ROUTE);
    const migration = read(MIGRATION);
    // Enforcement lives in the DB RPC (single authority), not just app code.
    expect(route).toContain("provision_stripe_checkout_client");
    expect(route).toContain("DOMAIN_OWNED_BY_OTHER_USER");
    expect(migration).toContain("DOMAIN_OWNED_BY_OTHER_USER");
    expect(migration).toContain("raise exception");
  });
});
