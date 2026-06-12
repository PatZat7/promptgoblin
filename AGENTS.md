# Prompt Goblin — project guide

Solo **AEO/GEO + technical-SEO + WCAG 2.1 AA / Section 508 accessibility** shop. A **Next.js 16 marketing site** (`web/` — App Router · React 19 · TS · Tailwind v4; **Node/SSR**, **live on promptgoblin.io** via DO App Platform deploy-on-push), DigitalOcean serverless scan functions (`functions/`), and a Python **LangGraph self-healing RAG pipeline** (`pipeline/`) that measures answer-engine citation gaps and ships human-reviewed fixes. _(The old Babel-in-browser SPA `app.jsx`/`index.html`/`styles.css` was retired at the `web/` cutover. Static export (`output:'export'`) removed 2026-06-08 to enable SSR auth, cookies, and RLS.)_

## Honest-broker code (binds every session AND every subagent — non-negotiable)

- Never fabricate metrics, clients, testimonials, or citations. No number that wasn't measured.
- **Schema is hygiene, not a citation lever.** Never promise citations from schema/markup. Real levers: brand mentions + Bing rank, measured over a re-run loop.
- An unreadable / JS-rendered (SPA) site is **never scored 0** — flag the SPA static-fetch blind spot instead. (We caught this on our own site.)
- Never tell a service or government site it's "missing Product schema" — they correctly use Service / Offer / OfferCatalog.
- **Nothing auto-deploys.** Every change is human-reviewed and human-gated.
- Mock / skip / demo paths are never reported as real passes; illustrative UI must read as illustrative.
- The refund guarantees the *work*, never a citation number.
- **Secrets** — canonical source is **Doppler** (project `prompt-goblin`). Load via `doppler run -- <cmd>`, or regenerate the gitignored dotenv cache with `pwsh scripts/doppler-pull-env.ps1` (works for desktop-app/Cowork sessions + Next.js builds). Key inventory + setup: **`docs/doppler-secrets.md`**. If a key seems missing, run the pull script and re-check before reporting it absent. Never commit or paste `sk_live_` / `sk-ant-` / `pplx-` / `AQ.` / `lsv2_` / `dop_v1_`; never commit `.env*` or `.env.master`. (DO token + WORKDAY_PASSWORD have leaked before — rotate them.)

## Copy priority (sales first, honesty as guardrail)

- Prospect-facing copy should prioritize getting the sale with short, simple, direct lines. Lead with the pain, the outcome, and the CTA; cut caveats, methodology, and defensive explanation unless they are needed to avoid a specific false claim.
- Integrity review is a veto, not the voice. It blocks fabricated numbers, unsupported guarantees, schema-as-citation overclaims, mock-as-real claims, and wrong technical findings. It should not make copy longer, softer, or more academic just to sound careful.
- Prefer concrete conversion copy over exhaustive precision. If a claim can be made simply without becoming false, make it simply.

## The agent team (`.claude/agents/`)

Orchestration is the **main thread + `PLAN.md`** — subagents are stateless specialists you dispatch, not a standing crew. There is **no "planner" subagent**: the planner role is the main thread keeping `PLAN.md` current.

| Agent | Use it for |
|---|---|
| `copywriter` | site / DM / email copy in the goblin voice |
| `design-system` | CSS, layout, responsive/mobile, design tokens |
| `qa` | Playwright e2e + axe-core a11y + pytest; a11y/WCAG specialist |
| `researcher` | industry / competitor / AEO research (read-only, fan-out-safe) |
| `implementer` | general code (site, functions, glue) |
| `stack-auditor` | deps + secret-leak + dead-code audit (read-only) |
| `graph-keeper` | **required** reviewer for `pipeline/goblin/` changes |
| `integrity-reviewer` | **required** gate for every outbound artifact |

**Gates:** route any `pipeline/goblin/` change through `graph-keeper`; route anything a prospect will read through `integrity-reviewer`.

> Note: these are *project-scoped* — they load when Codex runs from this directory. In a session rooted elsewhere, dispatch the same roles via the Agent tool with the matching prompt.

## Multi-agent orchestration — READ `COORDINATION.md` FIRST

Three agents share this repo: **Codex (you) · Claude · Hermes**. The lanes, live status board, handoff protocol, and merge gate live in **`COORDINATION.md`** (repo root) — load it before claiming work, alongside `PLAN.md` (execution contract) and `DOCS_PLAN.md` (docs authority).

- **You (Codex) hold the integrator + implementation seat:** you merge to `PLAN.md` and `main`; you implement `functions/` · `web/` · `pipeline/goblin/` · build glue; you integrate Hermes-authored `supabase/migrations/`.
- **`main` is deploy-on-push — a bad merge ships live. Run the full gate checklist in `COORDINATION.md` before every merge** (pipeline pytest + eval; web test + build; functions test; `graph-keeper` on `pipeline/goblin/`; `integrity-reviewer` on outbound copy; honest-broker invariants; mock/demo paths labeled).
- **Claude** proposes specs + reviews (never merges); **Hermes** owns the vault + authors migration SQL (never merges). Before integrating, check `feedback/claude/` + `feedback/hermes/`; record your accept/reject/defer decisions in `feedback/codex/`. Silence ≠ approval.
- **Per-turn sync:** run `node scripts/coordination-watch.js --agent codex` at the start of each task — it prints only what Claude/Hermes changed (status-board rows + feedback notes) since your last run, so you don't re-read everything.

## Verification

- `pipeline/`: 186 pytest tests + an eval gate (`heal-loop converges` + `verify strands converge (per-discipline)`) must stay green.
- Site: axe-core 100/100, 0 contrast violations (AA 4.5:1 small text; `--muted` 0.80 / `--faint` 0.74).

See **`PLAN.md`** for current status and the work queue.
