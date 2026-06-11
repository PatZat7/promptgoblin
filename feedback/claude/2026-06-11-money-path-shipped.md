# Money path shipped — review → harden → audit → merge (2026-06-11)

- **date:** 2026-06-11 (Claude session)
- **scope:** committed + hardened the Stripe money path, gated it through two review rounds + a multi-agent pre-merge audit, applied migration 0015 live, and **merged to `main` (deployed)**.
- **result:** `origin/main` = `f1d3cae` (deploy `d1d1b28e`, DEPLOY_ON_PUSH). Branch `fix/indexnow-canonicals` rebased onto the PR-#2 merge and fast-forwarded to main.

## What shipped (8 commits on top of PR #2)

1. `feat(auth): Stripe webhook -> provision -> magic-link money path` — `web/app/api/webhooks/stripe/route.ts` (idempotent `stripe_events` ledger · `payment_status==='paid'` · `admin.createUser` · `provision_stripe_checkout_client` RPC · `generateLink` hashed_token · Resend best-effort) + `/auth/confirm` SafeLinks interstitial (`verifyOtp`) + `/api/runs` explicit auth gate + migration `0015_stripe_events`.
2. `feat(seo): Bing site verification` — msvalidate meta + `web/public/BingSiteAuth.xml`.
3. `docs: static-export->Node/SSR drift fix` + DOCS_PLAN + semantic-floor restore.
4. `docs: master TODO board`.
5. `fix(auth): harden Stripe webhook (C1/H1/H2/M1)` — see review rounds below.
6. `feat(seo): IndexNow deploy automation` — fixed the silent-400 CI ping (was `{host}` no urlList → 400 masked by `|| echo skipped`); added `npm run indexnow:submit` + 4 tests.
7. `fix(a11y): pre-merge audit WCAG fixes` — confirm-page error contrast + focus rings + duplicate-`<main>` on 3 learn pages.
8. `docs: stamp 2026-06-11 state` (PLAN, TODO).

## Review rounds (all blockers fixed before merge)

**Round 1 — pre-commit (integrity-reviewer + security pass), verdict DO-NOT-SHIP → fixed:**
- **C1 (CRITICAL, was live-exploitable):** magic-link origin only from `NEXT_PUBLIC_SITE_URL`/`getSiteOrigin()`; removed the `new URL(request.url).origin` host-header fallback (token phishing). Added the var to `.do/app.yaml`.
- **H1:** welcome-email failure → event `processed` + `clients.welcome_email_status='failed'` (not customer loss); industry-standard best-effort + self-serve `/login`.
- **H2:** stale-`processing` reclaim (`STALE_PROCESSING_MS`) + 409 on active duplicate.
- **M1:** provision RPC raises `DOMAIN_OWNED_BY_OTHER_USER` → `PermanentWebhookError` (no cross-tenant seat grant).
- **M3/L1:** generic confirm error; escaped email HTML; hedged SafeLinks copy.

**Round 2 — multi-agent pre-merge audit (4 dimensions × adversarial verify, 6 agents), verdict ship:false (2 HIGH) → fixed:**
- **HIGH (correctness):** the IndexNow CI work (deploy.yml fix + submit script + tests) was uncommitted (concurrent Codex work in the shared tree) and would NOT have shipped — committed it.
- **HIGH (a11y):** `/auth/confirm` error text was hard-coded `#dc2626` (3.7–4.1:1, FAILS AA in all 4 palettes) → `var(--fg)` on `var(--panel)` (~15:1, browser-verified) with a `--fire` border.
- Security dimension: **all four C1/H1/H2/M1 fixes verified genuinely present**; webhook itself solid (raw-body constructEvent, service-role unreachable without signature, parameterized RPC, escaped email, no open redirect). Honest-broker: **clean** (no overclaims; pricing consistent).

## Live DB (Supabase MCP)

- **Migration `0015_stripe_events` APPLIED LIVE + verified** — billing + `welcome_email_status` columns on `clients`; service-role-only `stripe_events` (RLS forced, deny-all by design); RPC `revoke public/anon/authenticated` + `grant service_role`. No new advisor RLS gaps.
- **Dogfood bad-run integrity issue already clear** — `runs` where `approved is true` = **0** (nothing to flip).

## ⚠️ New findings (flagged, not auto-fixed)

- **`runs` table polluted: 1441 rows** — `goblin.eval`/pytest write to the live dogfood client because `GOBLIN_SUPABASE_ENABLED=true`. My gate run alone added ~21. Needs eval/test isolation + cleanup before the dashboard run-history is trustworthy. (TODO **I-06**.)
- **Live `BING_INDEXNOW_KEY=031825-6` is garbage** (leftover from the old broken indexnow.txt) and PASSES the route's regex, so it overrides the real served key `11a3e594ef174a13e7c628f18bba15e2` → Bing key-mismatch → IndexNow rejects. Owner: set the env to the real key or delete it so the route serves the file. (TODO **I-07**.)

## Owner-gated before the money path is usable (NOT done)

- Rotate secrets (Stripe `sk_live_`, DB password, DO token, WORKDAY_PASSWORD).
- DO env: `NEXT_PUBLIC_SITE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (live), `RESEND_API_KEY`, `RESEND_FROM_EMAIL`; fix `BING_INDEXNOW_KEY`. (Apply `.do/app.yaml` spec.)
- **Stripe Payment Links must collect `domain`** (metadata/custom field) — checkout without it permanently fails by design (M1).
- Resend domain DNS (SPF/DKIM/DMARC) + **click-tracking OFF** for auth mail.
- Register the Stripe webhook endpoint (`/api/webhooks/stripe`, live signing secret).
- Verify the Bing GUID `540C5A89…` is the owner's real BWT token, then click Verify + submit sitemap in BWT/GSC.
- Live $1 test checkout → email → confirm → dashboard.

## Deferred (non-blocking, in backlog)

- **MEDIUM (security):** `/indexnow` POST is unauthenticated (own-host-limited, so low damage). Add a shared-secret `x-indexnow-token` gate before relying on it in the open.
- **MEDIUM (correctness):** subscription lifecycle matches only on `stripe_subscription_id`; a cancel can no-op if that column was never set — also reconcile by `stripe_customer_id`.
- NITs: persistent-alert (done), `indexnow.txt` route 500→404 on missing file, lockfile dev→devOptional flip (expected).

## Verification receipts

- web: **vitest 86/86 · build green (24 routes)** (on the rebased HEAD).
- pipeline: **305 pytest · eval 3/3 (mean 1.000)** — recon fix `024737d` independently re-confirmed.
- visual: error-box computed contrast ~15:1; `/auth/confirm` (both states), 3 learn pages, home — 0 console errors, desktop + mobile screenshots captured.
- deploy: `d1d1b28e` BUILDING from `f1d3cae` at hand-off.

— Claude (acting integrator under the 2026-06-06 sole-integrator override + explicit owner go-ahead).
