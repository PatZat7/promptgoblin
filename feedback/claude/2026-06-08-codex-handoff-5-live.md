# Handoff — Claude → Codex: #5 dashboard is LIVE; connectors + state

- **date:** 2026-06-08
- **tl;dr:** #5 (client dashboard MVP) shipped end-to-end and is **live on promptgoblin.io** with **real data**. Pipeline → `supabase_writer` → Supabase → RLS views → dashboard is validated against a live run. Two **owner-only** blockers remain (auth URL retest + secret rotation). This note is your pickup: state, the exact connectors/MCPs you'll need, the env/secret map, and the open queue.

---

## 1. Where we are

**Done + merged + deployed (solo-integrator push, owner-gated):**
- **Web cutover** — `web/` is now a **Node/SSR web service** on DO App Platform (was static-export). `.do/app.yaml` rewritten static_sites → services (`npm run start`, `http_port 8080`, node-js slug). Zero-downtime cutover succeeded.
- **Dashboard MVP** — run history, citation scorecard, integrity tally, fix queue. Honest-broker treatment gated on `isSample || mode!=="live"`; locked snippets stripped server-side until human review.
- **Supabase schema** (live, migrations applied via Supabase MCP):
  - `0010_dashboard_views.sql` — `v_run_summary` / `v_run_platform_breakdown` / `v_run_integrity` / `v_fix_queue`, all `security_invoker=true`.
  - `0011_dashboard_write_lockdown.sql` — drops authenticated INSERT/UPDATE/DELETE on all tables (writes are **service-role only** — protects the human-review gate).
  - `0012_recommendations_run_fix_unique.sql` — `unique (run_id, fix_id)` (writer upsert `on_conflict`).
- **Pipeline writer** (`pipeline/` repo `master`, commit `71c1954`) — `goblin/supabase_writer.py` upserts runs from `ship_pr`; lazy/guarded so `--mock` + offline stay no-op. graph-keeper **APPROVED**. Validated: **298 pytest passed, eval 3/3 (mean 1.000)**.
- **Live data proof** — live run `7eee55dc`: visibility **0.0102 (1.02%**, honest-low for a new site), **23 recs**. `v_run_summary` surfaces it; `v_fix_queue` shows 23 HIGH→LOW. **All 23 snippets unlocked** (`human_reviewed=true`, `status=approved`) — verified `{"total":23,"unlocked":23,"has_snippet":23}`.

**Honest-broker invariants baked in (hold the line):** runs land `approved=False` (not client-visible until a human flips it) · `status='needs_review'` (the live `runs_status_check` enum is `pending|running|needs_review|complete|failed` — **not** `pending_review`, which silently rolled back every upsert; that was the bug fixed in `71c1954`) · snippets land `human_reviewed=False` (locked) · `is_sample=(mode=="mock")` · `visibility_score` is measured-or-`None`, **never 0**.

---

## 2. Connectors / MCPs you will need

| Connector | What for | How it's wired | Notes |
|---|---|---|---|
| **Supabase MCP** | Data-plane SQL: `execute_sql`, `apply_migration`, `list_migrations`, `get_advisors`, `list_tables`. **Source of truth for the dashboard.** | Already in repo **`.mcp.json`** → `https://mcp.supabase.com/mcp?project_ref=teeztxhrolhmmibxnnxi`. You inherit it automatically. | Project **`teeztxhrolhmmibxnnxi`** ("PatZat7's Project"), `us-east-1`, PG 17, ACTIVE_HEALTHY. This is **control + data plane via OAuth** — distinct from the service-role key the pipeline writer uses. Migrations: author SQL → `apply_migration` (don't hand-edit live tables). |
| **DigitalOcean MCP** | App Platform deploy/redeploy (`apps-*`), Functions (`functions-*`). | Needs a DO token in your MCP config (control-plane). | **App `promptgoblin` = `b2fc9d71-4cf8-41b0-ad84-696043cd2def`** (professional tier, nyc, https://promptgoblin.io). `deploy_on_push` is the normal path; if a deploy grabs a stale commit, force `doctl apps create-deployment <id>` (or `apps-create-app-from-spec`) to fetch fresh. **DO keeps last-good on a failed build = zero-downtime.** |
| **Chrome MCP** (`mcp__claude-in-chrome__*`) | Login/auth retest on the live site; inspect the magic-link callback + network calls. | Browser extension must be connected. | Needed to **verify the auth-URL fix** (see blocker #1) — watch the redirect land on `promptgoblin.io/auth/callback?code=…`, not localhost. |
| **Claude Preview MCP** (`mcp__Claude_Preview__*`) | Preview-first build verification before a live cutover (the topology we used for #5). | Spins a local preview of `web/`. | Use it to catch `npm ci` lockfile desync **before** DO does — DO runs strict `npm ci`; a local `npm run build` passing is **not** sufficient. Run `npm ci` (exit 0) before merge. |

**Not MCPs but you'll need them:** the GitHub remotes — **two repos**: root `github.com/PatZat7/promptgoblin` (`main`) and the **separate pipeline repo** `github.com/PatZat7/pipeline` (`master`). The pipeline is its own git root at `pipeline/`, not a submodule — commit/push it independently.

---

## 3. Env / secret map (4 files, gitignored — consolidated this push)

| File | Holds | Consumed by |
|---|---|---|
| `pipeline/.env` | `GOBLIN_SUPABASE_ENABLED=true`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (`sb_secret_…`), `GOBLIN_SUPABASE_CLIENT_ID=3dbea6df-4319-40e8-86a1-fdc27c30049c`, `GOBLIN_SUPABASE_OWNER_USER_ID=586f4b35-11a0-4c54-a0ab-595f0f6d53d7`, **GEMINI keys** (moved here) | `goblin/config.py` → `supabase_writer.upsert_run` |
| `web/.env.local` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Next.js SSR + `@supabase/ssr` |
| `email-templates/.env` | `RESEND_API_KEY` (moved here) | email templates |
| `.env` (root) | `SCRAPFLY_*` + Stripe (`sk_live_…`, **rotation-pending**) | functions / scan path |

**DO App env:** `NEXT_PUBLIC_*` are inline in `.do/app.yaml`; `SUPABASE_SERVICE_ROLE_KEY` is set **out-of-band** as an encrypted DO app secret (not in the committed spec). If you redeploy from spec, confirm the service-role secret survives.

---

## 4. Owner-only blockers (you cannot automate these — flag to owner)

1. **Supabase Auth URL config** — owner says it's set; **unverified until a successful login.** Required values (Supabase → Authentication → URL Configuration): Site URL `https://promptgoblin.io`; Redirect URLs `https://promptgoblin.io/auth/callback`, `https://promptgoblin.io/**`, `http://localhost:3010/auth/callback`. App code (`web/app/auth/callback/route.ts` + `LoginForm.tsx`) is already correct — if a magic link still lands on localhost, the dashboard config didn't save. **Retest via Chrome MCP** once owner triggers a fresh link.
2. **Rotate exposed secrets** — `sk_live_` Stripe key + the Supabase DB password (both leaked previously). DO token + `WORKDAY_PASSWORD` have leaked historically too — rotate.

---

## 5. Open queue (not started)

- **Auto Tier-2 scan on account creation** — run a Tier-2 scan whenever an account is created (so a new client's dashboard is pre-populated). Queued in `PLAN.md`. Design hook: account-creation event → enqueue Tier-2 scan → pipeline → `supabase_writer` (already idempotent via deterministic `uuid5` run_id; respects the same honest gates — lands `approved=False`, snippets locked). Spec is Claude's lane; implementation is yours.

---

## 6. Gate reminders (unchanged)

- `pipeline/goblin/` diff → **graph-keeper APPROVE** before merge.
- Any prospect/client-facing copy → **integrity-reviewer APPROVE**.
- Pipeline green = `pytest -q` **and** `goblin.eval` both pass. Web = `npm test` + **`npm ci`** + `npm run build` (+ axe/Playwright if UI changed).
- **Deploy-on-push ships live** — branch + owner-gate; nothing auto-deploys. Mock/sample paths must read as illustrative, never as earned passes.
