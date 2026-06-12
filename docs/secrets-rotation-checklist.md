# Secrets Rotation Checklist

> **Canonical source is now Doppler** (project `prompt-goblin`) — see [doppler-secrets.md](doppler-secrets.md).
> `.env.master` and the local `.env` files are a **generated cache**, not the source. Rotate in
> Doppler, then re-pull. **Never** paste a real secret value into chat, a commit, a PR, or a log — key NAMES only.

## How rotation works

1. Regenerate the key in the provider dashboard (links below).
2. Set the new value in **Doppler** (dashboard, or `doppler secrets set KEY`).
3. Regenerate the local cache: `pwsh scripts/doppler-pull-env.ps1` (bash: `scripts/doppler-pull-env.sh`).
   This pulls Doppler → `.env.master` → fans out to the three local `.env` files.
4. For anything used in production (web + functions), also set the new value in the
   **DigitalOcean App Platform → App → Settings → Environment Variables**, then redeploy.
5. Verify, then destroy the old key in the provider.

The pull → sync writes `<file>.bak` backups so a bad refresh can be rolled back instantly.

> Legacy path (Doppler unavailable): edit `.env.master` directly and run `scripts/sync-envs.*`. The
> downstream fan-out is identical — Doppler just sits above `.env.master` as the source of record.

## Priority — rotate these FIRST (flagged as exposed in CLAUDE.md / PLAN.md)

| Key | Why urgent | Regenerate at |
|---|---|---|
| `STRIPE_SECRET_KEY` / `STRIPE_LIVE_SECRET_KEY` | `sk_live_…` has leaked before | Stripe → Developers → API keys → Roll |
| `DO_KEY` | DigitalOcean token has leaked before | DigitalOcean → API → Tokens → Regenerate |
| `SUPABASE_SERVICE_ROLE_KEY` | bypasses RLS; used by web + pipeline | Supabase → Project Settings → API → service_role → Reset |

> CLAUDE.md also names `WORKDAY_PASSWORD` as previously leaked. It is **not** present in any
> of the three project `.env` files scanned — rotate it wherever it actually lives (personal
> credential store), it is out of scope for this repo's sync.

## Full key → where-to-rotate map

### Infra
| Key | Target file(s) | Regenerate at |
|---|---|---|
| `DO_KEY` | root `.env` | DigitalOcean → API → Tokens/Keys |
| `SCRAPFLY` + `SCRAPFLY_KEY` | root `.env` | scrapfly.io → Dashboard → API Keys |

> ⚠️ **Cleanup:** root `.env` defines `SCRAPFLY` but `functions/` reads `SCRAPFLY_KEY`. The
> template + sync emit **both** names (same value) so nothing breaks. Unify the code to one
> name, then drop the other from the template.

### Payment — Stripe (dashboard.stripe.com → Developers)
| Key | Target file(s) | Notes |
|---|---|---|
| `STRIPE_SECRET_KEY` | root `.env`, `web/.env.local` | live `sk_live_…` |
| `STRIPE_PUBLIC_KEY` | root `.env` | live `pk_live_…` |
| `STRIPE_LIVE_SECRET_KEY` | root `.env` | explicit live duplicate (see cleanup) |
| `STRIPE_LIVE_PUBLIC_KEY` | root `.env` | explicit live duplicate |
| `STRIPE_WEBHOOK_SECRET` | `web/.env.local` | Webhooks → endpoint → Signing secret |

> ⚠️ **Cleanup:** root `.env` carries both `STRIPE_SECRET_KEY` and `STRIPE_LIVE_SECRET_KEY`
> (plus public variants). Decide which the code actually consumes and retire the duplicate.

### Email — Resend (resend.com → API Keys)
| Key | Target file(s) | Notes |
|---|---|---|
| `RESEND_API_KEY` | `web/.env.local` | also used by `email-templates/` tooling |
| `RESEND_FROM_EMAIL` | `web/.env.local` | config: `Prompt Goblin <goblins@promptgoblin.io>` |

### Database + Auth — Supabase & Clerk
| Key | Target file(s) | Regenerate at |
|---|---|---|
| `SUPABASE_URL` | pipeline `.env`; web as `NEXT_PUBLIC_SUPABASE_URL` | not a secret (project URL) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `web/.env.local` | Supabase → Settings → API → anon |
| `SUPABASE_SERVICE_ROLE_KEY` | `web/.env.local`, pipeline `.env` | Supabase → Settings → API → service_role |
| `CLERK_SECRET_KEY` | `web/.env.local` | dashboard.clerk.com → API Keys |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `web/.env.local` | Clerk → API Keys (public) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `…SIGN_UP_URL` / `…FALLBACK_REDIRECT_URL` ×2 | `web/.env.local` | config, not secrets |

> ℹ️ The site uses **both** Clerk (`CLERK_*`) and Supabase Auth (the Stripe webhook calls
> `admin.createUser` + `generateLink`). Confirm which is the live auth path before rotating —
> if Clerk is dormant, drop its keys from the template to shrink the surface.

### AI / LLM — pipeline `.env`
| Key | Regenerate at |
|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |
| `OPENAI_API_KEY` | platform.openai.com → API keys |
| `PERPLEXITY_API_KEY` | perplexity.ai → Settings → API (also used by `functions/`) |
| `GEMINI_API_KEY` / `GEMINI_API_KEY_2` | aistudio.google.com → Get API key |
| `LANGSMITH_API_KEY` | smith.langchain.com → Settings → API Keys |

### Analytics — PostHog
| Key | Target file(s) | Regenerate at |
|---|---|---|
| `POSTHOG_PERSONAL_API_KEY` | pipeline `.env` | PostHog → Settings → Personal API Keys |
| `POSTHOG_PROJECT_ID` / `POSTHOG_HOST` | pipeline `.env` | config (not secrets) |
| `NEXT_PUBLIC_POSTHOG_KEY` | `web/.env.local` | PostHog → Project Settings (public project key) |

### Site / SEO config (mostly non-secret)
| Key | Target file(s) | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` / `SITE_URL` | `web/.env.local` | `https://promptgoblin.io` |
| `BING_INDEXNOW_KEY` | `web/.env.local` | must match `web/public/indexnow.txt` |
| `GOBLIN_SUPABASE_ENABLED` / `…CLIENT_ID` / `…OWNER_USER_ID` / `GOBLIN_TRACE` | pipeline `.env` | config |

### Test fixtures (web e2e — not production secrets)
`E2E_FIXTURE_USER_EMAIL`, `E2E_FIXTURE_USER_ID`, `TEST_SESSION_COOKIE`, `TEST_WAF_RUN_ID` → `web/.env.local`.

## DigitalOcean App Platform env (production)

The live site (`web/`) and serverless `functions/` read their secrets from the **DO App env**,
not from local files. After rotating, update these in DO and redeploy:
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`,
`SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_POSTHOG_KEY`, `BING_INDEXNOW_KEY`,
and (functions) `SCRAPFLY_KEY`, `PERPLEXITY_API_KEY`.

## After every rotation
- [ ] `.env.master` updated (new value)
- [ ] `scripts/sync-envs.*` run; the 3 local `.env` files regenerated
- [ ] DO App env updated for production keys; app redeployed
- [ ] Old key destroyed in the provider
- [ ] Smoke test: `$1` Stripe checkout e2e, a Resend send, a pipeline scan
- [ ] Confirm no secret value landed in git, chat, or a log (NAMES only)
