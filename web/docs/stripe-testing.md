# Stripe payment-gateway testing

How we verify the billing path. Three layers: automated behavioral tests (CI),
local end-to-end with the Stripe CLI, and a manual pre-launch checklist.

## 1. Automated tests (CI — `npm test`)

| File | What it does |
|---|---|
| `__tests__/stripe-webhook.behavior.test.ts` | **Behavioral** — executes the real `POST` handler with genuinely Stripe-signed payloads + an in-memory Supabase fake. Covers signature rejection, paid/unpaid checkout, idempotency (duplicate + in-flight 409), Resend best-effort, cross-tenant refusal, subscription lifecycle. |
| `__tests__/stripe-webhook.test.ts` | Source regression-locks — tripwires that fail if a security guard is deleted. Not a behavior test; keep as a backstop. |
| `__tests__/checkout-flow.test.ts` | Source regression-locks for the checkout path guards. |

Run: `npm test` (vitest). The behavioral suite needs no network or real keys —
signatures are real HMAC via the Stripe SDK; only the DB and Resend are faked.

## 2. Local end-to-end (Stripe CLI)

Tests the live handler against real Stripe-generated events. Requires the
[Stripe CLI](https://stripe.com/docs/stripe-cli) and test-mode keys (Doppler:
`doppler run -- ...` or the pulled dotenv cache).

```bash
# terminal 1 — run the site
cd web && npm run dev            # http://localhost:3010

# terminal 2 — forward live test-mode events to the local handler.
# This prints a whsec_… — set STRIPE_WEBHOOK_SECRET to it for this session.
stripe listen --forward-to localhost:3010/api/webhooks/stripe

# terminal 3 — fire events
stripe trigger checkout.session.completed
stripe trigger invoice.paid
stripe trigger invoice.payment_failed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
```

Verify in terminal 1 / Supabase: a `stripe_events` row lands in `processed`,
a `clients` row is provisioned, and `welcome_email_status` is set. Re-fire the
same event (`stripe events resend <evt_id>`) and confirm it returns
`duplicate: true` and does **not** re-provision.

> Note: `stripe trigger` uses generic fixture payloads — they won't carry our
> `metadata.domain` / `metadata.plan`. For a realistic provision, drive a real
> test-mode Checkout (layer 3) or pass a custom fixture
> (`stripe trigger checkout.session.completed --add checkout_session:metadata.domain=acme.com`).

## 3. Manual pre-launch checklist (test mode)

Do a real test-mode purchase for **each plan** before going live. Use Stripe
[test cards](https://stripe.com/docs/testing): `4242 4242 4242 4242` (success),
`4000 0000 0000 0002` (decline), `4000 0000 0000 9995` (insufficient funds),
`4000 0027 6000 3184` (3DS required).

For each of **watch / scout / warband / warlord**:

- [ ] Complete Checkout with `4242…` and the plan's payment link.
- [ ] `stripe_events` row → `processed`; `clients` row created with correct
      `billing_plan`, `tier`, `scan_tier` (watch→tier1, others→tier3).
- [ ] Welcome email arrives; magic link → click interstitial → dashboard access.
- [ ] Dashboard shows the right plan + scan entitlement.
- [ ] Decline card (`…0002`) → no account provisioned, no welcome email.
- [ ] 3DS card (`…3184`) → auth challenge completes, then provisions.
- [ ] Cancel the subscription in the Stripe dashboard → client row flips to
      `canceled` (via `customer.subscription.deleted`).
- [ ] Simulate a failed renewal → client flips to `past_due`.

Edge cases to confirm once (not per-plan):

- [ ] Duplicate webhook delivery does not double-provision.
- [ ] Checkout for a domain already owned by another account is refused and
      flagged for manual review (ledger `failed`), no cross-tenant access.
- [ ] Webhook with a bad signature returns 400.

When the live keys are swapped in, re-confirm the production webhook endpoint
secret matches `STRIPE_WEBHOOK_SECRET` in Doppler `prd`.
