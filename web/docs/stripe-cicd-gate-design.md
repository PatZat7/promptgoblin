# Stripe CI/CD deploy gate — recommended design

> Researched + adversarially fact-checked against primary Stripe / DigitalOcean /
> GitHub docs (2026-06-13). Claims that failed verification were dropped or
> caveated — see "Corrections" at the end.

## TL;DR

You have two good Stripe test assets already (17 signed-payload webhook unit tests;
a live `$0` per-tier e2e harness at `web/scripts/e2e/live-e2e.mjs`) and **zero gate**
between `git push main` and a DigitalOcean deploy (`.do/app.yaml` → `deploy_on_push: true`).
The fix is not "prove Stripe is live before deploy" — that's partly circular. Two gates:

1. **PRE-DEPLOY (CI, test mode, blocking):** prove the *new code's* Stripe logic before
   it ships — the 17 webhook tests **plus** a test-mode end-to-end check. This blocks.
2. **POST-DEPLOY (live, once, alerting):** prove the *live keys/endpoint/provisioning*
   actually work after it ships — the existing `$0` harness against the live URL with
   cleanup, alerting (not blocking) on failure.

Single highest-value change: set `deploy_on_push: false` and move the deploy into
GitHub Actions behind the test jobs via `needs:`. That turns existing CI into a real
gate and finally honors the repo's "nothing auto-deploys" principle.

## 1. Stripe's recommended approach (verified, with doc URLs)

- **Test mode, always — live-mode testing with real cards is contractually prohibited.**
  "The Stripe Services Agreement prohibits testing in live mode using real payment method
  details." — https://docs.stripe.com/testing . A sandbox + test keys is the designated
  build/test env (https://docs.stripe.com/test-mode).
- **Frontend automation is actively blocked.** "Stripe Checkout or the Payment Element
  have security measures in place that prevent automated testing." — https://docs.stripe.com/automated-testing .
  Real API calls in test are fine but should be **infrequent** (rate limits; sandbox is
  25 req/sec vs 100 live — https://docs.stripe.com/rate-limits).
- **Test Clocks** for subscription lifecycle without waiting real time (test-mode only):
  https://docs.stripe.com/api/test_clocks . Advancing a cycle fires
  `invoice.upcoming → created → finalized → paid|payment_failed → customer.subscription.updated`;
  past the retry window → `customer.subscription.deleted` (induce failure with card
  `4000 0000 0000 0341`). Advance is **async** — poll `retrieve` until `status: ready`,
  never fixed-sleep. Limits: 3 customers/clock, 3 subs/customer, ≤2 cycles/advance,
  auto-delete after 30 days (https://docs.stripe.com/billing/testing/test-clocks/api-advanced-usage).
- **Stripe CLI** for webhooks: `stripe trigger checkout.session.completed` (supported),
  `stripe listen --forward-to <url>` (no Dashboard endpoint needed) + `--print-secret`
  (clean to script). CI auth via `STRIPE_API_KEY` env — never `stripe login` (interactive
  auth fails in CI). No official Stripe GitHub Action exists (issue #699 open); install via
  `npm i -g @stripe/cli` or the `stripe/stripe-cli` Docker image.
- **Stripe's stated most-reliable webhook test = real test subscriptions handling real
  events**, not synthetic CLI events ("…create actual test subscriptions and handle the
  corresponding events." — https://docs.stripe.com/billing/testing). Signed-payload unit
  tests (our 17) are a valid *handler-isolation* technique but are NOT "Stripe's documented
  CI recommendation" — don't claim that.
- **Skip `stripe-mock`** (stateless, no webhooks/subscriptions/clocks — wrong tool).
- **Verdict on live charges in a gate: no.** The `$0`-coupon harness avoids the real-card
  prohibition (no card via `payment_method_collection:if_required` + 100%-off coupon) but
  still creates real subs/rows/emails on live infra + quota → unsuitable as a blocking
  per-push gate; belongs post-deploy, run sparingly.

## 2. Framing correction

| Question | Proves | Environment | Timing |
|---|---|---|---|
| Does the **new code's** Stripe logic work? | signature, idempotency, plan→tier, lifecycle, provisioning | **test mode** | **pre-deploy** (blocking) |
| Do the **live keys/endpoint/provisioning** work in prod? | live secret matches, DO env injects keys, prod DB/email reachable, TLS | **live** | **post-deploy** (alerting) |

"Prove live before deploy" is circular: live keys + live endpoint + prod DB are *deploy-time*
facts, not code facts — you can't validate the live endpoint against the **new** code until
it's **deployed**. So split: test-mode gate pre-deploy; live smoke post-deploy.

## 3. Concrete design for THIS repo

### 3a. PRE-DEPLOY gate (CI, test mode, blocking)
1. `functions` unit tests — already blocking, keep.
2. `web-unit` (vitest, incl. the 17 webhook tests, + `next build` typecheck) — already
   blocking, keep.
3. **NEW — test-mode webhook integration job:** start the app, `npm i -g @stripe/cli`,
   `STRIPE_API_KEY=$STRIPE_TEST_SECRET_KEY`, `WEBHOOK=$(stripe listen --print-secret)` →
   pass as `STRIPE_WEBHOOK_SECRET_TEST` (handler already supports it),
   `stripe listen --forward-to localhost:8080/api/webhooks/stripe &`,
   `stripe trigger checkout.session.completed` → assert 200 + provisioning side-effect.
4. **NEW (scheduled, not per-push) — test-mode `$0` e2e:** reuse `live-e2e.mjs` with the
   **test** key + test coupon `rvo3bQgU` + a test/preview URL. Nightly (Checkout
   anti-automation + sandbox rate limits make per-push unwise).
5. **Optional Tier-3 — test-clock lifecycle suite:** create clock → customer w/ `pm_card_visa`
   → sub on a test price → advance → assert `active` → swap to `4000…0341` → advance →
   assert `past_due` → advance → assert canceled → cleanup. Runs against a reachable
   test-mode endpoint (the live DO URL accepts `STRIPE_WEBHOOK_SECRET_TEST`), so nightly.

Minimum viable gate = items 1–3.

### 3b. How to actually make CI gate the deploy
**Recommended: `deploy_on_push: false` + deploy from GitHub Actions gated by `needs:`.**
- Set `deploy_on_push: false` under `services[].github` in `.do/app.yaml`; apply with
  `doctl apps update b2fc9d71-4cf8-41b0-ad84-696043cd2def --spec .do/app.yaml`.
- Add a `deploy` job: `needs: [functions, web-unit, webhook-integration]`,
  `if: github.ref == 'refs/heads/main' && github.event_name == 'push'`, using the
  **official `digitalocean/app_action/deploy@v2`** (token `DIGITALOCEAN_ACCESS_TOKEN`).
  Prefer it over `doctl apps create-deployment --wait` — that returns **exit 0 even when
  the deploy fails** (doctl #1071), useless as a CI signal.
- Why `needs:` over alternatives: required-status-checks/branch-protection availability on
  a **private Free** repo is uncertain (verify before relying); Environments required-reviewers
  for private repos need **Enterprise**. The `needs:` chain works on any plan/visibility and
  is the only fully-automated free-compatible gate. If the repo goes public or upgrades,
  add branch protection on top so the gate can't be bypassed by a direct push.

**Honest-broker posture (pick one):**
- **Automated-but-gated (recommended):** keep auto-deploy on `main` *but only through a green
  gate*. Document "nothing auto-deploys *ungated*." Matches current behavior, zero friction.
- **Fully manual:** `deploy` job becomes `workflow_dispatch` with a typed `"deploy"` confirm
  (mirrors the existing `deploy.yml` functions pattern). Strictest reading; one click/release.

Either way, `deploy_on_push: false` is step one (else you double-deploy).

### 3c. POST-DEPLOY live smoke (existing `$0` harness)
- `smoke` job, `needs: [deploy]`, runs `live-e2e.mjs` once against `https://promptgoblin.io`
  with `NO_LOGIN=1` (Gmail login can't run in CI), live `STRIPE_KEY`, `COUPON_ID=2gX7MsjX`,
  prod Supabase creds; the harness's teardown cancels the sub + deletes client/user/ledger rows.
- Cheap pre-check first: `POST /v2/core/event_destinations/{id}/ping` proves live endpoint
  reachability + TLS + 200 in ~2s with zero side effects (https://docs.stripe.com/api/v2/event-destinations/ping).
- On failure: alert (GitHub issue / Slack) and optionally roll back — **no `doctl apps rollback`**;
  use `POST /v2/apps/{app_id}/rollback` with the prior `deployment_id`
  (from `GET /v2/apps/{app_id}/deployments`).
- NOT a per-push blocking step: real subs/rows/emails + live quota; once-per-deploy (or nightly).
- Live webhook retries run up to **3 days** w/ backoff — a single green smoke isn't proof of
  delivery health; Workbench → Event deliveries is the source of truth (https://docs.stripe.com/workbench/webhooks).

## 4. Phased implementation plan
- **Phase 0 — close the gate (highest value):** `deploy_on_push:false` + `deploy` job
  `needs:[functions, web-unit]` via `app_action/deploy@v2`. Existing tests now actually gate.
  No new Stripe surface, no live risk.
- **Phase 1 — test-mode webhook integration job** (3a-3), added to `deploy` `needs:`.
- **Phase 2 — post-deploy live smoke** (`needs:[deploy]`) + `ping` pre-check + `if:failure()`
  alert/rollback.
- **Phase 3 — depth (scheduled):** nightly test-mode `$0` e2e + test-clock lifecycle suite.
- **Phase 4 — hardening:** branch-protection required checks once plan/visibility allows.

### Secrets / setup the owner must provide (Claude cannot add Actions secrets)
- `DIGITALOCEAN_ACCESS_TOKEN` — exists (used by `deploy.yml`); **verify it has Apps read+write**
  (functions deploy may only have Serverless scope; `app_action` deploy + rollback need Apps write).
- `STRIPE_TEST_SECRET_KEY` (the harness's `STRIPE_KEY` in CI) — test secret from Doppler `dev`.
  Never put a live key in CI for the pre-deploy jobs.
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — test/dev values for Phase 1/3; prod values
  only on the Phase 2 post-deploy job.
- Phase 2 live smoke: live `STRIPE_KEY` (Doppler `prd` `STRIPE_LIVE_SECRET_KEY`) + `COUPON_ID=2gX7MsjX`,
  scoped to that one job.
- (Optional) `STRIPE_LIVE_WEBHOOK_DEST_ID` for the `ping` pre-check (from `GET /v2/core/event_destinations`).

## 5. Tradeoffs + caveats
- Closing the gate *improves* honest-broker alignment (today the site auto-deploys ungated).
- Test-mode CI is free but rate-limited (25 req/s) — keep `$0`/clock suites scheduled, not per-push.
- Checkout has anti-automation measures → Playwright on hosted Checkout can be brittle; test-clock
  `advance` is async (poll, don't sleep); `stripe listen` needs a long-running process + reachable URL.
- The live smoke pollutes prod (real subs/rows/emails) — rely on teardown, keep `goblinqa-` domains,
  consider suppressing the welcome email in the smoke path.
- Gmail-login can't run in CI → `NO_LOGIN=1` for the smoke (asserts checkout→provision; defers login).
- Rollback is API-only; live webhook delivery retries up to 3 days, so watch Workbench after deploy.

## Corrections (claims that failed verification — do not repeat)
- ❌ "Stripe recommends signed-payload unit tests for CI" — Stripe's docs say the opposite
  (prefer real test subscriptions). Our 17 tests are valid handler-isolation, not a Stripe-blessed
  CI pattern.
- ❌ "Stripe Sandboxes give per-PR isolation out of the box" — not documented; you'd build it.
- ⚠️ "GitHub Free private repos can't use branch protection at all" — too absolute; verify against
  current GitHub pricing before relying.
- ⚠️ HMAC-SHA256 + 5-min replay tolerance — almost certainly true (SDK behavior) but not confirmed
  on the cited signature page in this pass.
