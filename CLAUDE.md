# Prompt Goblin — project guide

Solo **AEO/GEO + technical-SEO + WCAG 2.1 AA / Section 508 accessibility** shop. A marketing SPA (`app.jsx` + `index.html` + `styles.css` — Babel-in-browser React, no build step), DigitalOcean serverless scan functions (`functions/`), and a Python **LangGraph self-healing RAG pipeline** (`pipeline/`) that measures answer-engine citation gaps and ships human-reviewed fixes.

## Honest-broker code (binds every session AND every subagent — non-negotiable)
- Never fabricate metrics, clients, testimonials, or citations. No number that wasn't measured.
- **Schema is hygiene, not a citation lever.** Never promise citations from schema/markup. Real levers: brand mentions + Bing rank, measured over a re-run loop.
- An unreadable / JS-rendered (SPA) site is **never scored 0** — flag the SPA static-fetch blind spot instead. (We caught this on our own site.)
- Never tell a service or government site it's "missing Product schema" — they correctly use Service / Offer / OfferCatalog.
- **Nothing auto-deploys.** Every change is human-reviewed and human-gated.
- Mock / skip / demo paths are never reported as real passes; illustrative UI must read as illustrative.
- The refund guarantees the *work*, never a citation number.
- **Secrets** live in a gitignored `.env` only — never commit or paste `sk_live_` / `sk-ant-` / `pplx-` / `AQ.` / `lsv2_` / `dop_v1_`. (DO token + WORKDAY_PASSWORD have leaked before — rotate them.)

## The agent team (`.claude/agents/`)
Orchestration is the **main thread + `PLAN.md`** — subagents are stateless specialists you dispatch, not a standing crew. There is **no "planner" subagent**: the planner role is the main thread keeping `PLAN.md` current.

| Agent | Use it for |
|---|---|
| `promptgoblin-expert` | project-state + WAF-reality authority (Hermes); consult on scan-path / pipeline / live-site questions and any "did this regress?" claim before acting |
| `copywriter` | site / DM / email copy in the goblin voice |
| `design-system` | CSS, layout, responsive/mobile, design tokens |
| `qa` | Playwright e2e + axe-core a11y + pytest; a11y/WCAG specialist |
| `researcher` | industry / competitor / AEO research (read-only, fan-out-safe) |
| `implementer` | general code (site, functions, glue) |
| `stack-auditor` | deps + secret-leak + dead-code audit (read-only) |
| `graph-keeper` | **required** reviewer for `pipeline/goblin/` changes |
| `integrity-reviewer` | **required** gate for every outbound artifact |

**Gates:** route any `pipeline/goblin/` change through `graph-keeper`; route anything a prospect will read through `integrity-reviewer`.

> Note: these are *project-scoped* — they load when Claude runs from this directory. In a session rooted elsewhere, dispatch the same roles via the Agent tool with the matching prompt.

## Verification
- `pipeline/`: 186 pytest tests + an eval gate (`heal-loop converges` + `verify strands converge (per-discipline)`) must stay green.
- Site: axe-core 100/100, 0 contrast violations (AA 4.5:1 small text; `--muted` 0.80 / `--faint` 0.74).

See **`PLAN.md`** for current status and the work queue.
