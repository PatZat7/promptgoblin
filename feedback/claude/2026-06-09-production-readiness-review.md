# Production-readiness review — auth off-flow · GSC/Bing/IndexNow · dogfood scan · copy/docs

- **date:** 2026-06-09 (Claude review session)
- **scope:** full repo + live Supabase + vault sync + auth research validation
- **verdict in one line:** the SSR auth core is solid and live; the **money path (Stripe → provision → magic link) does not exist yet**, the **IndexNow key file is broken garbage**, the **only live dogfood run is the known-bad "prompt generator" run and it's sitting `approved=true`**, and the **recon fix that would make the next scan honest is uncommitted in `pipeline/`**.

---

## 1. Where everyone left off

- **Claude (last session, 2026-06-08):** #5 dashboard shipped + live; handoff written to `feedback/claude/2026-06-08-codex-handoff-5-live.md`. Two owner blockers flagged: auth-URL live retest, secret rotation.
- **Codex (2026-06-09):** picked up — shipped `d107541` (authority copy, docs index, IndexNow route, auth tests) and `34fb424` (seat split: migrations `0013`/`0014`, approvals page, seat logic). Stamped `feedback/codex/2026-06-09-hermes-review-and-seat-split.md`. Live seats applied: `atpatzat333@gmail.com` = admin, `atpatzat@gmail.com` = tier-3 member. **Codex also left the recon/listen dogfood fix UNCOMMITTED in the `pipeline/` repo** (see §4) — that's the live dangling thread.
- **Hermes:** `feedback/hermes/` is **empty**; no repo-bound Hermes artifacts existed at integration time (Codex recorded `deferred`, non-blocking). Hermes's vault lane continues externally.
- **Vault distillation gap:** `.wiki/_ingest/` has daily promptgoblin ingests through **2026-06-08 only**. Nothing from **2026-06-09** (seat split, IndexNow route, auth tests, docs index, the uncommitted recon fix) is distilled. `notes/Prompt Goblin - Supabase Dashboard And Schema.md` and friends were last touched June 8 — they predate migrations 0013/0014 and the approvals UI.

## 2. Git + docs regression check

**Git:** `main` clean, up to date with origin (HEAD `34fb424`). Pipeline repo `master` at `71c1954` with the uncommitted recon work (§4). Supabase live ledger matches the repo: migrations `0001–0014` all applied (verified via MCP `list_migrations`). No code regressions found in recent history.

**Doc drift (real, confirmed by grep):**
- `README.md:7,31`, `CLAUDE.md:3`, `AGENTS.md:3` still say **"static export / `output:'export'`"** — the app has been a **Node/SSR web service since 2026-06-08**. PLAN.md explicitly warns "do NOT re-add `output:'export'`", so these three files are actively dangerous to a fresh agent session. Fix the stack sentence in all three.
- `DOCS_PLAN.md` says `/docs/bing-webmaster-tools` is "queued" — it's **live**. Also stale: pricing-deliverable "thin" note.
- Stale test counts in older PLAN.md sections (PLAN itself acknowledges: current truth = pipeline 298 + eval 3/3, functions 226, web 65).
- `/learn/technical-seo-for-ai-search` page dropped the "semantic-floor checklist" section present in `docs/new-page-copy/fleshed/technical-seo-for-ai-search.md` — either restore it or trim the source.

**Tests:** could not run in this (Linux) review sandbox — `web/node_modules` has Windows-native rolldown bindings. Gate runs must happen on the host or CI as usual. No claim of green is made here.

## 3. Auth off-flow — current state vs production-ready

**What exists and is sound (verified in code):**
- `web/proxy.ts` (Next 16's middleware) gates `/dashboard`, `/runs`, `/approvals` with SSR session check → redirect to `/login`. Layout double-checks.
- `web/app/auth/callback/route.ts` does `exchangeCodeForSession` with open-redirect protection on `next`.
- Service-role key is server-only (`web/lib/supabase/service-role.ts`); no `NEXT_PUBLIC_` leakage; `.env*` gitignored; write-lockdown migration (0011) makes the browser read-only.
- Migrations `0013_client_memberships` + `0014_inline_membership_rls` applied live; seat roles enforced in `web/lib/dashboard-seat.ts`.

**Gaps (the off-flow does not exist end-to-end):**
1. **No `app/api/webhooks/stripe/route.ts`.** Checkout completes → nothing happens. Provisioning is manual via service role. This is the #1 blocker to "start making money" hands-off.
2. **No Resend wiring** — `email-templates/` has an API key in `.env` but nothing sends the welcome/magic-link mail programmatically.
3. **`GET /api/runs` has no explicit auth check** (~line 129) — it leans entirely on RLS. RLS holds, but add the explicit gate; defense in depth.
4. **No rate limiting / abuse guard on scan launches** — must land before any self-serve signup (live scans cost real Perplexity/OpenAI spend).
5. **Owner blockers still open:** Supabase Auth URL config unverified by a real login; **secret rotation (Stripe `sk_live_`, DB password, DO token, WORKDAY_PASSWORD) still not done** — this predates everything and must happen before the webhook ships (the webhook secret lives next to the leaked key).

**Your research, validated + corrected (web research, June 2026 — full citations in session):**
Your architecture is right (Stripe → Next.js route handler → `admin.createUser` → clients/memberships → Resend magic link → SSR cookie → gated dashboard). Five corrections before anyone implements it:

1. **`verifyOtp(token_hash)`, not `exchangeCodeForSession`**, for admin-generated magic links. `exchangeCodeForSession` is PKCE — it only works when the same browser that started sign-in finishes it. A link generated server-side in a webhook has no code verifier. Pattern: `admin.generateLink({type:'magiclink'})` → take `properties.hashed_token` (NOT the `action_link`) → build `https://promptgoblin.io/auth/confirm?token_hash=…&type=magiclink` → send via Resend → `/auth/confirm` route calls `verifyOtp({type,token_hash})` → cookies → `/dashboard`. Keep the existing `/auth/callback` + `exchangeCodeForSession` for the browser-initiated login form (it's correct there).
2. **Webhook idempotency:** Stripe is at-least-once. Add a `stripe_events` table with `event.id` as PK; insert-before-process; unique-violation ⇒ already handled, return 200. Also check `payment_status === 'paid'` on `checkout.session.completed`, and handle `invoice.paid` / `invoice.payment_failed` / `customer.subscription.updated|deleted` for the membership lifecycle (monthly cancel-anytime tiers need this).
3. **Outlook SafeLinks eats one-time tokens.** Corporate mail scanners prefetch links and consume the token before the human clicks. `/auth/confirm` must render an interstitial "Sign in" button (POST/JS-triggered verify), never verify on bare GET. Also turn Resend click-tracking OFF for auth mail (link rewriting breaks tokens).
4. **`getClaims()` over `getUser()` in `proxy.ts`** once the Supabase project is migrated to asymmetric JWT signing keys — local JWT verification, no per-request network round-trip. `getSession()` alone is never trusted server-side.
5. **Email split confirmed:** Zoho = human inbox only; Resend = transactional. Provisioning email goes via Resend API directly from the webhook handler (Supabase SMTP not involved); still configure Supabase custom SMTP with Resend for auth-initiated mail (recovery/email-change), and raise the default ~30/hr rate limit. Consider Google OAuth as a fast-follow for repeat logins (magic-link-only is fine for launch; first login must be email anyway).

DO App Platform: no raw-body interference — `await req.text()` + `constructEvent` works as-is; secrets as encrypted run-time env vars; use the **live-mode** webhook signing secret.

## 4. Dogfood scan — verdict: NOT usable yet, and a live integrity problem

Verified against live Supabase:
- **Only one live run exists** (`7eee55dc`, 2026-06-08, visibility 0.0102, 23 recs). Its recommendations are the known-bad set: "best AI prompt generators for creative writing", "AI prompt utility tool" queries, and one title containing a raw LLM preamble ("Here are eight distinct buyer prompt-surface queries for the…"). PLAN.md says **"Do not act on that recommendation set"** — yet the run is **`approved=true` with all 23 snippets unlocked**. That contradicts the human-gate's meaning. → **Flip it back to `approved=false`** (or mark superseded) until a clean re-run exists.
- **The fix is written but uncommitted.** `pipeline/` working tree has +432/−105 across `recon.py` (canonical domain override locking promptgoblin.io to the AEO/GEO lane, blocked bogus competitor domains incl. urbandictionary, bad-TLD rejection), `listen.py` (query-expansion cleanup), `ship_pr.py`, eval cases, and tests. This violates the repo's own "commit early" worktree rule — one destructive git op loses it. → **Commit it, run the pipeline gate (pytest + goblin.eval on the host), graph-keeper review, push.**
- **Then re-run the live scan** to get the honest dogfood baseline + delta data. Acceptance: queries in the AEO/GEO/technical-SEO/accessibility lane, no malformed preambles, competitors are real (AEO/SEO tools/agencies), low visibility framed honestly.

## 5. GSC / Bing Webmaster / IndexNow — go-live checklist

**Solid already:** `robots.ts` + `sitemap.ts` correct (12 public pages, protected routes noindexed), rich JSON-LD (ProfessionalService/Organization/FAQPage/Breadcrumb), all planned content pages exist, llms.txt consistent.

**P0 — blockers (fix before submitting anything):**
1. **`web/public/indexnow.txt` contains garbage** (`DIGITALOCEAN_APPS_SPEC=031825-6` — a paste accident), and the key route serves it verbatim. Fix: generate a real key (8–128 hex chars), put it in the file, set the same value as `BING_INDEXNOW_KEY` on the DO app.
2. **IndexNow submissions will fail even with a valid key** as written: `web/app/indexnow/route.ts` POSTs `{host, key, urlList}` with **no `keyLocation`**, so Bing expects the key file at `https://promptgoblin.io/<key>.txt`. Either add `keyLocation: "https://promptgoblin.io/indexnow.txt"` to the POST body, or serve the key at `/<key>.txt`. Also: the POST endpoint is **unauthenticated** — anyone can burn your IndexNow reputation; gate it with a shared secret header.
3. **Canonicals missing** on `/learn/how-to-show-up-in-chatgpt`, `/learn/bing-rank-and-ai-citations`, `/learn/technical-seo-for-ai-search` — add `alternates.canonical` like the other pages.

**P1 — onboarding steps (owner, ~30 min once P0 ships):**
- GSC: add domain property for `promptgoblin.io` (DNS TXT at Cloudflare — cleanest, covers all subdomains), submit `https://promptgoblin.io/sitemap.xml`, request indexing on the homepage + 3 learn pages.
- Bing Webmaster: import the verified GSC property (one click), confirm sitemap. IndexNow then accelerates everything.
- Optional: add `google-site-verification`/`msvalidate.01` meta tags in `layout.tsx` as a fallback verification path.
- First IndexNow ping after deploy: homepage + sitemap-listed URLs.

## 6. Copy review

- **Pricing: 100% consistent** — $997 / $3,500 / $9,500 monthly everywhere checked (pricing.data.ts, site.ts TIERS, faq.ts, both llms.txt).
- **No overclaims / guarantees found** on learn pages, methodology, FAQ, benchmark (benchmark correctly disclaims illustrative). Learn pages faithful to `docs/new-page-copy/fleshed/` sources except the dropped semantic-floor section (§2).
- **One honest-broker nit:** LiveScan's idle terminal shows sample output without a visible `[illustrative]`/`SAMPLE` marker in the current build — re-verify on the live page; if the marker regressed, restore it (this exact misread was fixed once before).
- No broken internal links detected.

## 7. Master checklist (ordered — this is the work queue)

**A. Stop-the-bleed (owner, today)**
- [ ] Rotate: Stripe `sk_live_`, Supabase DB password, DO token, WORKDAY_PASSWORD. Update DO app secrets + `pipeline/.env` + root `.env`.
- [ ] Flip live run `7eee55dc` to `approved=false` (one SQL update) so the dashboard never shows the bad rec set as approved.

**B. Unblock dogfood (Codex, this week)**
- [ ] Commit the uncommitted `pipeline/` recon/listen fix → host gate (pytest + eval) → graph-keeper → push.
- [ ] Re-run the live promptgoblin.io scan → verify recs are in-lane → human-review honestly → this becomes the real baseline for delta tracking.

**C. Index-engine go-live (Codex, ~half day)**
- [ ] Fix `indexnow.txt` key + `BING_INDEXNOW_KEY` env + add `keyLocation` (or `/<key>.txt` route) + auth-gate the POST endpoint.
- [ ] Add the 3 missing learn-page canonicals.
- [ ] Deploy → owner does GSC + Bing verification + sitemap submission → first IndexNow ping.

**D. Money path: Stripe → provision → magic link (Codex, spec below)**
- [ ] `stripe_events` idempotency table (migration 0015).
- [ ] `app/api/webhooks/stripe/route.ts`: constructEvent → dedupe → `payment_status==='paid'` → `admin.createUser({email_confirm:true})` → clients + client_memberships (single RPC/transaction) → `admin.generateLink` → **hashed_token** URL → Resend (click-tracking off). Email failure ⇒ flag for retry, don't 500.
- [ ] `app/auth/confirm/route + page`: interstitial button → `verifyOtp({type,token_hash})` → `/dashboard`.
- [ ] Subscription lifecycle events → membership status updates.
- [ ] Resend domain DNS (SPF/DKIM/DMARC at Cloudflare, separate from Zoho records) + Supabase custom SMTP + raised rate limit.
- [ ] Explicit auth check in `GET /api/runs`; rate-limit scan launches.
- [ ] RLS cross-tenant tests (second fake tenant; prove isolation).
- [ ] Live e2e: real $1 test checkout (or test-mode clone) → email → login → dashboard.

**E. Hygiene (any agent, low risk)**
- [ ] README/CLAUDE/AGENTS static-export → Node/SSR sentence fix; DOCS_PLAN status refresh.
- [ ] Restore or trim the semantic-floor checklist section.
- [ ] Verify LiveScan idle SAMPLE marker on live.
- [ ] Hermes: distill 2026-06-09 work into the vault (seat split, 0013/0014, IndexNow route, this review).

## 8. Updated AI-subagent prompt (corrected version of yours)

Your draft prompt is good; replace these parts before handing it to an implementer:
- Task 1: `middleware.ts` → **`proxy.ts`** (Next 16 rename; already exists — extend, don't recreate). `/auth/confirm` uses **`verifyOtp({type,token_hash})`**, not `exchangeCodeForSession`; require an interstitial confirm button (SafeLinks).
- Task 2: **already done** — migrations 0013/0014 are applied live. Tell the agent to *verify against them*, not write them.
- Task 3: add the `stripe_events` idempotency table, `payment_status` check, subscription-lifecycle events, and "email failure must not 500 the webhook."
- Add invariant: provisioning emails go out via **Resend API with `properties.hashed_token`**, never Supabase's `action_link`, never through Zoho.
- Add invariant: nothing merges to deploy-on-push `main` without the full gate checklist (COORDINATION.md) — webhook code included.

— Claude (review lane; per COORDINATION.md this lands as a feedback note; Codex integrates)
