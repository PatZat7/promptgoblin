# Doppler — secrets source of truth

**Doppler is the canonical store for every Prompt Goblin secret.** Local `.env*` files are a
**generated cache** — never the source. This is what fixes the recurring "Claude can't find the
API key" problem: there is now one place to look, one command to refresh, and a documented
loader that every agent reads (`CLAUDE.md` / `AGENTS.md`).

```
        ┌─────────────┐  doppler-pull-env   ┌────────────┐  sync-envs   ┌──────────────────────┐
        │  Doppler    │ ──────────────────▶ │ .env.master│ ───────────▶ │ .env                 │
        │ (canonical) │                     │  (cache)   │              │ web/.env.local       │
        └─────────────┘                     └────────────┘              │ pipeline/.env        │
              │  doppler run -- <cmd>  (terminal: inject straight into the process, no files)   │
              └────────────────────────────────────────────────────────▶ (any command)         │
   Production (DigitalOcean App env) is set SEPARATELY — see "Production" below. Doppler never
   pushes to prod automatically; nothing here can break the live site.
```

> Secret hygiene is unchanged: **never** paste a real value into chat, a commit, a PR, or a log —
> key NAMES only. `.env`, `.env.local`, `.env.master`, and `*.bak` stay gitignored forever.

---

## 1. One-time setup

```powershell
# Install the CLI (Windows)
winget install Doppler.doppler        # then restart the shell so `doppler` is on PATH

# Authenticate (opens a browser)
doppler login

# Create the project + select it for this repo
doppler setup                         # pick/create project "prompt-goblin", config "dev"
```

Suggested project/config layout (solo, pre-launch):

| Config | Purpose | Who reads it |
|---|---|---|
| `dev` | local development + agents (Claude/Codex) | you + agents on this machine |
| `prd` | production values mirrored to DigitalOcean | reference/record for the live app |

> `stg`/`preview` is optional — add it only if you start running a separate staging deploy.

## 2. Import your existing keys (one time)

You already have working values across five `.env` files. Don't retype them — assemble + push:

```powershell
# Assemble .env.master from existing local files (prints NAMES + source file only)
pwsh scripts/doppler-import-from-env.ps1

# Review .env.master (one file, gitignored), then push everything into Doppler 'dev'
pwsh scripts/doppler-import-from-env.ps1 -Upload
#   ...or manually:  doppler secrets upload .env.master

# Confirm (names only, no values)
doppler secrets --only-names
```

After this, Doppler holds the truth. You can delete `.env.master` (it will be regenerated on pull).

## 2b. Verify the round-trip (do BEFORE trusting the new path)

`scripts/verify-envs.ps1` proves the Doppler round-trip didn't drop or mangle any key. It is
**value-blind** (SHA-256 of the quote-normalized value — never prints a secret).

```powershell
# 1. BEFORE any Doppler change, while the local .env files are known-good:
pwsh scripts/verify-envs.ps1 -Snapshot     # writes .env.verify-baseline.json (gitignored)

# 2. ...do the Doppler import + pull + sync...

# 3. Confirm nothing changed (this is your go/no-go gate):
pwsh scripts/verify-envs.ps1               # OK / CHANGED / MISSING / EMPTY per key; exit 1 on regression
```

Quotes are normalized, so a value that was `"abc"` locally and `abc` after Doppler reads as **OK**
(functionally identical — `dotenv` strips quotes anyway). Expect the 4 `E2E_FIXTURE_*` to show as
`CHANGED` (empty → REPLACE_ME) — harmless. A real key showing `MISSING`/`CHANGED` = stop, do not commit.

Optional live validity check (uses your real keys against free read-only endpoints):
```powershell
pwsh scripts/verify-envs.ps1 -Live
```
`OK` = key valid; `PRESENT` = valid format, scope-limited (e.g. send-only Resend key);
`SKIP` = no safe free probe (Perplexity, LangSmith) or new-format Supabase `sb_` keys
(validate those via the app or the Supabase MCP, not HTTP).

## 3. Daily use

**Terminal sessions — inject straight into the process (no files needed):**
```powershell
doppler run -- npm run dev            # Next.js (web/)
doppler run -- python -m goblin ...   # pipeline
doppler run -- claude                 # launch Claude with all keys in its env
doppler run -- codex
```

**Desktop-app / Cowork Claude, or a fresh checkout — regenerate the dotenv cache:**
```powershell
pwsh scripts/doppler-pull-env.ps1     # Doppler -> .env.master -> .env / web/.env.local / pipeline/.env
# (bash/WSL:  bash scripts/doppler-pull-env.sh)
```
Use this whenever an agent or build that reads files (not `doppler run`) needs the keys. It is the
fallback that makes Doppler work even when there is no shell to prefix with `doppler run`.

> **If a key seems missing, run the pull script and re-check before declaring it absent.**
> 90% of "I can't find the key" is just a stale or un-generated local cache.

## 4. Rotation

1. Update the value in **Doppler** (dashboard or `doppler secrets set KEY`).
2. Regenerate the local cache: `pwsh scripts/doppler-pull-env.ps1`.
3. For production keys, mirror the new value into the **DigitalOcean App env** and redeploy (below).
4. Destroy the old key in the provider.

Full key → provider map lives in [secrets-rotation-checklist.md](secrets-rotation-checklist.md).

## 5. Production (DigitalOcean App Platform)

The live `web/` + `functions/` read secrets from the **DO App env**, NOT from these files or from
Doppler directly. To keep production safe, this stays **manual and human-gated**:

- Set/rotate prod values in **DO → App → Settings → Environment Variables**, then redeploy.
- Keep the `prd` Doppler config as the system-of-record so you always know the current prod values.
- (Optional, later) enable Doppler's DigitalOcean integration to sync `prd` → DO automatically.
  Until you deliberately turn that on, **nothing in this repo can change production.**

Production keys to mirror (from the rotation checklist): `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `SUPABASE_SERVICE_ROLE_KEY`,
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`,
`NEXT_PUBLIC_POSTHOG_KEY`, `BING_INDEXNOW_KEY`, and (functions) `SCRAPFLY_KEY`, `PERPLEXITY_API_KEY`.

## 6. Agents (Claude / Codex)

- `CLAUDE.md` and `AGENTS.md` point every session at this doc and at the pull script.
- For a terminal-launched agent: `doppler run -- claude` is cleanest (keys live only in the process).
- For desktop-app / Cowork: run `pwsh scripts/doppler-pull-env.ps1` once at the start of a work
  session so file-reading and `dotenv`/`python-dotenv` code finds everything.
- A non-interactive agent that must not hit a browser login can use a Doppler **service token**
  (`DOPPLER_TOKEN`, read-only, scoped to the `dev` config) instead of `doppler login`.

## Files in this system

| Path | Role |
|---|---|
| Doppler (cloud) | **source of truth** |
| `scripts/doppler-pull-env.ps1` / `.sh` | Doppler → `.env.master` → fan out |
| `scripts/doppler-import-from-env.ps1` | one-time: existing `.env` files → Doppler |
| `scripts/sync-envs.ps1` / `.sh` | `.env.master` → the 3 downstream `.env` files |
| `.env.master.template` | documented key inventory (names only, no values) |
| `.env.master` | generated cache (gitignored) |
| `secrets-rotation-checklist.md` | per-key provider + rotation steps |
