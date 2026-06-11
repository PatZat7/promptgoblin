# Prompt Goblin — project guide

Solo **AEO/GEO + technical-SEO + WCAG 2.1 AA / Section 508 accessibility** shop. A **Next.js 16 marketing site** (`web/` — App Router · React 19 · TS · Tailwind v4; **Node/SSR**, **live on promptgoblin.io** via DO App Platform deploy-on-push), DigitalOcean serverless scan functions (`functions/`), and a Python **LangGraph self-healing RAG pipeline** (`pipeline/`) that measures answer-engine citation gaps and ships human-reviewed fixes. _(The old Babel-in-browser SPA `app.jsx`/`index.html`/`styles.css` was retired at the `web/` cutover. Static export (`output:'export'`) removed 2026-06-08 to enable SSR auth, cookies, and RLS.)_

## Honest-broker code (binds every session AND every subagent — non-negotiable)

**Scope — the one line we never cross: never misrepresent what we can do, and never charge for value we don't deliver.** That's it. This code governs *what we tell customers and what we ship them* — not *how we collect public data*. Lawful collection of publicly available pages — including proxy / stealth / residential-IP fetch to read a site behind a WAF (e.g. Scrapfly ASP) — is fine and is **not** an honest-broker concern. We're reading public pages, not doing anything malicious. Don't moralize the scraping method; do hold the line on honest claims and honest delivery.

- Never fabricate metrics, clients, testimonials, or citations. No number that wasn't measured.
- **Schema is hygiene, not a citation lever.** Never promise citations from schema/markup. Real levers: brand mentions + Bing rank, measured over a re-run loop.
- A page we couldn't read is **never scored 0** — try the stealth/render fallback first; if it still fails, flag the blind spot honestly rather than inventing a verdict.
- Never tell a service or government site it's "missing Product schema" — they correctly use Service / Offer / OfferCatalog.
- **Nothing auto-deploys.** Every change is human-reviewed and human-gated.
- Mock / skip / demo paths are never reported as real passes; illustrative UI must read as illustrative.
- The refund guarantees the *work*, never a citation number.
- **Secrets** live in a gitignored `.env` only — never commit or paste `sk_live_` / `sk-ant-` / `pplx-` / `AQ.` / `lsv2_` / `dop_v1_`. (DO token + WORKDAY_PASSWORD have leaked before — rotate them.)

## The agent team (`.claude/agents/`)

Orchestration is the **main thread + `PLAN.md`** — subagents are stateless specialists you dispatch, not a standing crew. There is **no "planner" subagent**: the planner role is the main thread keeping `PLAN.md` current.

**Multi-agent orchestration (read `COORDINATION.md` first):** three agents share this repo — **Claude (you): specs + review**; **Codex: integrator** (merges `PLAN.md` + `main`, runs the gate checklist); **Hermes: vault + migration SQL**. Lanes, the live status board, the handoff protocol, and the merge gate are in **`COORDINATION.md`**. In multi-agent mode **you (Claude) do NOT merge to `main` and do NOT implement `functions/`/`web/`/pipeline delivery code — you write specs + reviews and hand them to Codex** via `feedback/claude/`; Codex is the one who stamps `PLAN.md` on integration. Docs authority: `DOCS_PLAN.md`.

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