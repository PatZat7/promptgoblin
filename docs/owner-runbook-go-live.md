# Owner runbook — go live + start outreach

> The code is built and gated. Everything left is an **owner action** outside the repo
> (secrets, DNS, dashboard config, one live test, one dogfood run). Do these in order —
> later steps depend on earlier ones. Check each box as you go.
>
> **Key identifiers**
> - DigitalOcean app id: `b2fc9d71-4cf8-41b0-ad84-696043cd2def` (spec: `.do/app.yaml`)
> - Supabase project: `teeztxhrolhmmibxnnxi` (`db.teeztxhrolhmmibxnnxi.supabase.co`)
> - Sender identity: `goblins@promptgoblin.io`
> - Live site: `https://promptgoblin.io` (DO deploy-on-push from `main`)

---

## 0. Rotate the leaked secrets — **do this first** 🔴

These have leaked before and must be rotated before any new deploy:

- [ ] **Stripe** — roll the `sk_live_…` secret key (Stripe Dashboard → Developers → API keys → roll). Update everywhere it's stored.
- [ ] **Supabase DB password** — reset (Supabase → Project Settings → Database → reset password). Update any connection string that uses it.
- [ ] Confirm no `sk_live_` / `dop_v1_` / DB password is committed anywhere (only the gitignored `.env` may hold them).

---

## 1. Set the missing DigitalOcean env vars

The live app currently has only `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `BING_INDEXNOW_KEY`. The money path **and** the new scan-email
route are dead at runtime until these are added as **app-level SECRETs**:

- [ ] `STRIPE_SECRET_KEY` — the newly-rotated `sk_live_…`
- [ ] `STRIPE_WEBHOOK_SECRET` — from Stripe → Developers → Webhooks → your endpoint (`https://promptgoblin.io/api/webhooks/stripe`) → signing secret
- [ ] `NEXT_PUBLIC_SITE_URL` = `https://promptgoblin.io` (the webhook builds magic links from this — wrong/missing value was the C1 phishing risk)
- [ ] `RESEND_API_KEY` — from step 2
- [ ] `RESEND_FROM_EMAIL` = `Prompt Goblin <goblins@promptgoblin.io>`

Apply via the committed spec (recommended, keeps it reproducible):
```bash
doctl apps update b2fc9d71-4cf8-41b0-ad84-696043cd2def --spec .do/app.yaml
```
or set each in the DO dashboard → App → Settings → App-Level Environment Variables (type: SECRET).

> Setting env triggers a redeploy. That's fine — it's the same code already on `main`.

---

## 2. Resend account + sending-domain DNS

- [ ] Create a **Resend** account; create an API key → that's `RESEND_API_KEY` (step 1).
- [ ] Add + **verify the `promptgoblin.io` sending domain** in Resend.
- [ ] At **Cloudflare DNS**, add the SPF / DKIM / DMARC records Resend gives you. These sit
      alongside the existing Zoho records (no conflict — Zoho is for inbox, Resend is for
      transactional send).
- [ ] **Turn OFF Resend click-tracking** for this domain (it rewrites magic-link URLs, which
      breaks auth links).
- [ ] Whitelist redirect URLs in Supabase → Auth → URL Config:
      `https://promptgoblin.io/auth/callback` and `http://localhost:3010/auth/callback`.

---

## 3. Supabase custom SMTP (depends on step 2)

So password-recovery / email-change / re-requested magic links also send from your domain
(not Supabase's shared sender at ~30/hr):

- [ ] Supabase → Project Settings → Auth → SMTP → enable **Custom SMTP**:
      host `smtp.resend.com`, your Resend SMTP creds, sender `goblins@promptgoblin.io`.
- [ ] Raise the auth email **rate limit** above the default.

---

## 4. Stripe Payment Links — collect the domain

The provisioning RPC needs the customer's domain to create their `clients` row:

- [ ] On each live Payment Link (Scout $997 / Warband $3,500 / Warlord $9,500), add a
      **custom field** that collects `domain` (the site we'll scan). Without it, the M1
      cross-tenant guard blocks provisioning.

---

## 4b. Create the $99 "Goblin Watch" tier + friends-&-family codes

The browser route into Stripe is blocked (dashboard is walled off to automation), so
this is a one-command script — the secret key is read from the env, never stored.

- [ ] With your freshly-rotated live key, run:
      ```powershell
      $env:STRIPE_SECRET_KEY = "sk_live_…"; node web/scripts/create-watch-product.mjs
      ```
      (add `--dry-run` first to preview). It creates: the **Goblin Watch** product,
      a **$99/mo** price, a **Payment Link** (promo codes ON + a required `domain`
      field + `metadata.plan=watch`), and two promo codes — **FRIENDS0** (free) and
      **FRIENDS1** ($1).
- [ ] Copy the printed Payment Link into
      `web/components/sections/Pricing/pricing.data.ts` → `STRIPE_LINKS.watch`
      (until set, the Watch CTA falls back to the contact form, and the scan email
      funnels to `/#pricing`).
- [ ] Friends & family: share the link + code **FRIENDS0** (free) or **FRIENDS1** ($1).
- [ ] ✅ Already done for you: migration **0016_watch_provisioning** is applied live —
      a Watch checkout provisions a read-only monitoring seat (no on-demand scans);
      Scout/Warband/Warlord keep full access. The webhook maps `plan=watch` → tier1.
- [ ] Fulfilment: the weekly Watch report is produced by the pipeline monitor —
      `python -m goblin.cli monitor --domain <client>` on a weekly schedule
      (needs `BING_SEARCH_API_KEY`; see `docs/pipeline-monitoring.md`). Human-reviewed
      before each send.

---

## 5. Review + merge the staged branch

All the new fleet work (3-levers section, deepened learn pages, branded welcome email,
honest scan-email CTA, modal login, onboarding, scan-email route, teaser honesty fix, etc.)
sits on **`fix/scan-citation-label`**, gated but **not pushed**.

- [ ] Review the diff. Merging to `main` **deploys it live** (deploy-on-push).
- [ ] Merge → confirm the DO deploy goes green → spot-check `https://promptgoblin.io`.

---

## 6. Live $1 end-to-end test (proves #1–3 of the checklist)

- [ ] Temporarily set a Payment Link to ~$1 (or use a real $997 buy and refund).
- [ ] Buy with a fresh email. Then verify, in order:
  - [ ] Stripe webhook fired 200 (Stripe → Webhooks → recent deliveries)
  - [ ] An `auth.users` row + a `clients` row were created (Supabase)
  - [ ] The **branded** welcome email arrived from `goblins@promptgoblin.io` with a working magic link
  - [ ] The magic link logs you into `/dashboard`
  - [ ] `clients.welcome_email_status = 'sent'`

---

## 7. Submit sitemaps (lever 2 — repo is already wired)

`BingSiteAuth.xml` + the `msvalidate` meta tag are already deployed; sitemap is at
`https://promptgoblin.io/sitemap.xml`.

- [ ] **Bing Webmaster Tools** — add/verify `promptgoblin.io`, submit the sitemap.
- [ ] **Google Search Console** — add/verify the property, submit the sitemap.
- [ ] (IndexNow now auto-fires on every content publish via `.github/workflows/indexnow.yml` —
      no manual step needed, but you can run it on demand from the Actions tab.)

> Honest framing: submission shortens time-to-crawl. It is **not** indexing and **not** a
> citation guarantee. Don't let any client-facing copy imply otherwise.

---

## 8. Dogfood re-run + honest approve — **the proof artifact** ⭐

This is the one thing that lets "proven by our own scan" appear in a DM. The bad early run
is gone (table purged); the I-06 guard means runs no longer get polluted.

- [ ] From `pipeline/`, run a **live** scan of `promptgoblin.io` with the writer enabled
      (env already wired per PLAN: `GOBLIN_SUPABASE_ENABLED=true`, client `promptgoblin.io`,
      owner `atpatzat@gmail.com`; needs the live LLM/Perplexity keys):
      ```bash
      .venv\Scripts\python.exe -m goblin.cli run --domain promptgoblin.io
      ```
- [ ] Open `/approvals` on the dashboard. **Read the recommendations honestly.** Only approve
      if they improve a real lever (brand mentions / Bing rank / extractable content). A low
      citation share should read as a low score — do not approve a flattering-but-false run.
- [ ] Approve → it becomes the dashboard's first real, client-visible run and your case study.
- [ ] (Optional) start the new monitoring loop to build a delta over time:
      `.venv\Scripts\python.exe -m goblin.cli monitor --domain promptgoblin.io`
      on a weekly schedule (Task Scheduler / cron).

---

## 9. THEN start outreach

With #8 approved you have a true "we measured our own gap and here's the delta" story.
Now the guest-posting + social outreach in `pipeline/sales/` has something honest to point at:

- [ ] Claim G2 / Capterra / Clutch profiles (third-party presence = lever-1 signal).
- [ ] Run the outreach drafts (`pipeline/sales/dms_to_send.md`) — every artifact is
      human-reviewed before it sends (honest-broker).
- [ ] Use the deepened `/learn/*` pages as the link targets in guest posts.

---

### Quick status legend
🔴 blocker · ⭐ the proof artifact · everything else is sequential plumbing.
The repo side is done and gated; this list is entirely yours.
