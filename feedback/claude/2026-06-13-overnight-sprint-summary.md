# Overnight sprint summary — 2026-06-13 (autonomous run)

> Autonomous 3am run. **All changes are uncommitted working-tree edits — nothing committed,
> pushed, merged, or deployed.** No secret values were written or logged (key NAMES only).
> The outreach graph stopped at its human-review gate (nothing sent). Owner reviews before
> anything ships.

## Honest-broker / gating stance (read first)

The task asked me to "use the browser to get past any owner gating" and to "attempt" the
recommended next actions. **I did not bypass any auth, approval, or human-review gate** —
doing so contradicts the non-negotiable honest-broker code (human-gated, nothing auto-ships)
and basic security. I performed the *safe* attemptable actions (mock pipeline run, live
read-only smoke test) and **left every gated/irreversible action for the owner** (deploy,
secret rotation, DM sends, dogfood approval, DO env). Those are listed at the bottom.

## What shipped to the working tree (file paths)

### Task 1 — Marquee ticker copy
- `web/components/sections/Marquee/Marquee.tsx` — replaced 11 words with 12 marketing-forward
  AEO terms; kept `llms.txt`, `JSON-LD`, `RAG-ready`, goblin `Visible AF`; added buyer-outcome
  terms (`AI search visibility`, `cited by ChatGPT`, `show up in Perplexity`, `answer-engine
  ready`) + the full brand tagline split (`get found by robots` / `stay usable by humans`).
- Verified NOT live yet (the live homepage marquee still shows the old words — confirms no auto-deploy).

### Task 2 — Welcome email icon + CTA button
- `web/app/api/webhooks/stripe/route.ts` — welcome-email HTML: icon `<img>` now points to a
  transparent-background lime logo (was `promptgoblinlogo.png`, a 1254×1254 **opaque** raster
  that email clients matte to a white/black box); CTA button changed from solid lime fill
  (`bgcolor="#a3e635"`) to **transparent background + 2px lime `#a7ee39` border + lime text**.
- `web/public/email-logo.png` — NEW asset: rendered from `assetgen/goblin-logo-currentcolor.svg`
  to a 192×192 transparent PNG in brand lime `#a7ee39` (verified transparent corners + lime fill;
  previewed composited on the `#111310` email card — clean, no box).
- ⚠️ The email `<img>` uses the absolute URL `https://promptgoblin.io/email-logo.png`; it
  resolves only **after the next deploy** ships `web/public/email-logo.png`. Ship together.
- ⚠️ Brand-lime inconsistency noted: the email elsewhere uses `#a3e635` (lime-400); canonical
  brand lime is `#a7ee39`. I used `#a7ee39` for the changed elements per spec; a sitewide
  reconciliation is a separate owner call.

### Task 3 — Marketing campaign
- `marketing/one-liners.md` — 22 channel-tagged one-liners (DM / X / LinkedIn / email subject /
  ad / tagline). Honest-broker header: positioning only, no fabricated metrics; real $997 price.
- `assetgen/social-tiktok.html` (1080×1920), `social-instagram-feed.html` (1080×1080),
  `social-instagram-story.html` (1080×1920), `social-linkedin.html` (1200×628),
  `social-facebook.html` (1200×628) — each adapts the shimmer orb (alpha capped 0.30–0.32,
  subtle), ≤3-word headline, `promptgoblin.io` URL, export-instructions comment, local brand
  fonts (JetBrains Mono + Silkscreen).
- `marketing/social-copy.md` — per-platform captions drawn from the one-liners.
- `marketing/video-brief.md` — 15–18s looping spot brief (concept, timeline, overlays, H.264
  1080×1920 30fps export specs).
- ⚠️ Static PNG/MP4 export not produced: the sandbox could not download a headless Chromium
  (Playwright CDN not allow-listed). The HTML is structurally validated (canvas + headline +
  URL + fonts resolve). **Owner exports** via the in-file DevTools "Capture node screenshot"
  instructions, or I can capture them via the Chrome extension on request.

### Task 4 — Outreach drafts (nothing sent)
- Ran `goblin.cli outreach-graph --mock` → **paused at `[interrupt: human_review]`,
  "nothing sent"** (engine: fallback). The never-send invariant held with zero API spend.
- `pipeline/sales/dms_draft_2026-06-13.md` — fresh DM hook variants for the vetted Tier-1 leads
  (Trigger.dev, Simple Analytics, GoHighLevel, cal.com) + 2 expansion leads, each leading with
  the citation gap, marked DRAFTS / human-gated, with a freshness caveat (gap data is from
  2026-06-02 — re-scan before sending).
- Note: `pipeline/` is gitignored in this repo (separate deployable), so this draft lives
  outside this repo's git history by design.

### Task 5 — Secrets consolidation (NAMES ONLY — no values written anywhere)
- `.env.master.template` — every key across the 3 `.env` files (+ code-referenced production
  keys) grouped by section (infra / payment / email / db+auth / AI-LLM / analytics / site /
  test), all `=REPLACE_ME`, with rotate-where comments.
- `scripts/sync-envs.sh` (bash, portable) + `scripts/sync-envs.ps1` (PowerShell) — fan
  `.env.master` out to root `.env`, `web/.env.local`, `pipeline/.env`; back up each target to
  `.bak`; print NAMES + status only (never values); warn on REPLACE_ME/missing.
- `.gitignore` — added explicit `.env.master`, `.env.master.template`, `.env.master.bak`
  (already covered by `.env.*`; explicit as defense-in-depth).
- `docs/secrets-rotation-checklist.md` — every key → where to regenerate → sync command; priority
  list for the previously-leaked keys (`STRIPE_LIVE_SECRET_KEY`, `DO_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
- **Verified** `sync-envs.sh` in an isolated `/tmp` copy with fake values: correct subsets
  (root 7 / web 21 / pipeline 15), `SUPABASE_URL`→`NEXT_PUBLIC_SUPABASE_URL` remap works,
  REPLACE_ME warnings surface, **zero value-echoes**. The real `.env` files were untouched.
- ⚠️ Two cleanups surfaced: (1) root `.env` uses `SCRAPFLY` but `functions/` reads
  `SCRAPFLY_KEY`; (2) root `.env` duplicates Stripe keys (`STRIPE_SECRET_KEY` +
  `STRIPE_LIVE_SECRET_KEY`). Template emits both names so nothing breaks; unify in code later.
  Also: the site uses **both** Clerk and Supabase Auth keys — confirm which is live and drop the
  dormant set to shrink the secret surface.

### Task 6 — Checkout-flow unit tests
- Baseline recorded: **86 vitest cases** across 8 files in `web/__tests__/`.
- `web/__tests__/checkout-flow.test.ts` — NEW, 5 cases in the repo's established source-assertion
  / regression-lock style (reads the real handler + migration + verify route, pins the guards):
  idempotency (duplicate event → 200, no re-provision), non-paid rejection
  (`payment_status !== 'paid'` → ignored, no side effects; guard precedes `provisionClient`),
  email-failure resilience (best-effort, marked `processed`), invalid token
  (`/auth/confirm/verify` → 400, no session), cross-tenant isolation (`DOMAIN_OWNED_BY_OTHER_USER`
  raised by the RPC). New total: **91**.
- **Verified all 5 tests' assertions pass** against the real source via a standalone Node check
  (26 assertions, 0 fail after I fixed one false assertion the check caught). The formal
  `vitest run` could NOT execute in-sandbox (vitest 4's rolldown Linux native binding is absent —
  node_modules was installed on Windows). **Owner/CI must run `cd web && npm test`** on the
  Windows/CI env (prior baseline there: green) to confirm 91/91.
- Live smoke test (read-only, no payment initiated): `promptgoblin.io` 200; pricing CTAs link to
  the live Stripe Payment Links matching displayed prices (Scout `…go06`, Warband `…go07`,
  Warlord `…go08`); `/auth/confirm` reachable and correctly renders "Invalid Link → request a new
  link" for a missing token (`noindex`).

## Verification (Task 8)
- No secret VALUES written/logged anywhere — confirmed (sync scripts print names only; template
  is all REPLACE_ME; env reads extracted names via field-split).
- No `git` commit/push/merge; no deploy; no `functions` redeploy. All edits are working-tree only.
- Only CODE touched is `web/` (Marquee strings, email HTML strings, new test file). Existing tests
  don't reference the changed lines → no regression expected. Pipeline code untouched (Task 4 was
  a mock run + a gitignored markdown draft), so the pipeline pytest suite is not implicated.

## Recommended next actions (owner-gated — I did NOT do these)
1. **Review + run web tests:** `cd web && npm test` → confirm 91/91, then review the Marquee +
   email diffs.
2. **Deploy** (deploy-on-push) once satisfied — this is the only way the marquee, email fix, and
   `email-logo.png` go live. They ship together in one push.
3. **Rotate the leaked secrets** (`STRIPE_LIVE_SECRET_KEY`, `DO_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
   via `docs/secrets-rotation-checklist.md`; then `.env.master` → `scripts/sync-envs.*` → DO env.
4. **Export the social assets** to PNG (DevTools node screenshot per file) + cut the video.
5. **Send DMs** — review `pipeline/sales/dms_draft_2026-06-13.md`, verify names on LinkedIn,
   **re-scan each lead** (gap data is ~10 days stale), send 5–8 by hand. Never auto-sent.
6. Optional code cleanups: unify `SCRAPFLY`/`SCRAPFLY_KEY`, de-dupe Stripe keys, resolve
   Clerk-vs-Supabase-Auth, reconcile email lime `#a3e635` → `#a7ee39`.
