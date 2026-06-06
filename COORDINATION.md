# Prompt Goblin — COORDINATION (multi-agent orchestration)

> How three agents work the repo without stomping each other. This file is the **visibility board** — glance here to see who's doing what.
> Canonical copy lives here (repo root). Hermes mirrors a pointer from the vault MOC. Last touched: 2026-06-06.

## The one rule

**One owner per path. One integrator per merge.** Agents *propose and review*; the integrator *merges*. PLAN.md is the execution contract; this file is the live status of who's executing it.

## Roster + lanes (decided 2026-06-06 by owner)

| Agent | Seat | Owns (writes here) | Reviews (no merge) | Does NOT touch |
|---|---|---|---|---|
| **Codex** | **Integrator + implementation** | merges to `PLAN.md` + `main`; implements `functions/`, `web/`, `pipeline/goblin/` code, build glue, `supabase/migrations/` (integrates Hermes's authored SQL) | — | — |
| **Claude** | Architecture / spec / honest-broker review | `DOCS_PLAN.md`, `specs/` (specs it authors), review outputs | any `pipeline/goblin/` spec, architecture, honest-broker on outbound copy, Supabase schema review | merges to `main` (never) |
| **Hermes** | Vault / strategy / migration authoring | `ObsidianVault/` (research, GTM, strategy, MOCs), authors `supabase/migrations/*.sql` (Codex integrates) | roadmap order, market/positioning, commercial value | repo code merges; PLAN.md merges |

**Required gate-reviewers (regardless of who implements):**
- `graph-keeper` — **required** before any `pipeline/goblin/` change merges.
- `integrity-reviewer` — **required** before any prospect/client-facing artifact ships.

## Live status board

> Each agent updates its own row before starting a task. Integrator reconciles. `git branch -a` = active work; PLAN.md ✅+hash = done work.

| Agent | Current task | Branch | Status | Updated |
|---|---|---|---|---|
| Codex | (1) integrate this file → (2) fix pytest blocker (`test_schema_audit.py::test_fetch_degrades_gracefully_on_network_error`) | `fix/pipeline-pytest-contract` | in-progress | 2026-06-06 |
| Claude | author specs: freshness-cadence node + Supabase schema review | `specs/` (no-merge) | queued | 2026-06-06 |
| Hermes | vault mirror of this file + GTM angles draft from Reddit/community signal | vault-only | in-progress | 2026-06-06 |
| Hermes | Playwright/visual gate runbook + vault note + coordination updates | vault-only | in-progress | 2026-06-06 |

## Context preflight

Before any agent claims work, it loads the same minimum context so reviews do not drift:

| Agent | Must read first | Then read when relevant |
|---|---|---|
| **Codex** | `AGENTS.md`, `PLAN.md`, `COORDINATION.md`, `DOCS_PLAN.md`, current `git status` for repo + `pipeline/` | `web/AGENTS.md` for web changes; `pipeline/README.md` + `pipeline/goblin/graph.py` for pipeline changes; `functions/README.md` for DO Functions changes |
| **Claude** | `AGENTS.md`, `PLAN.md`, `COORDINATION.md`, `DOCS_PLAN.md`, `.claude/agents/promptgoblin-expert.md` | target files for the spec under review; `pipeline/README.md` for graph specs; dashboard section of `PLAN.md` for Supabase/API specs |
| **Hermes** | `PLAN.md`, `COORDINATION.md`, vault MOC / `Prompt Goblin - *.md` research notes | repo `DOCS_PLAN.md` for docs strategy; dashboard/vector sections before authoring migration SQL |

**Connection check:** if an agent cannot see one of its required context files, it must stop and report the missing file instead of proceeding from memory.

**Vault note:** this repo does not currently contain an `ObsidianVault/` directory. Hermes owns the external vault mirror and sends repo-bound artifacts back as review notes or migration SQL for Codex to integrate.

## Handoff protocol

1. **Claim** — agent stamps its row in the status board (task + branch + `in-progress`).
2. **Work** — on a branch in its lane. Specs land in `specs/`; code on `fix/*` or `feat/*`; strategy in the vault.
3. **Signal** — when done, agent updates its row to `awaiting-integration` with the commit/branch ref, spec path, vault pointer, or review note path.
4. **Review inbox** — Claude/Hermes feedback lands in `feedback/claude/` or `feedback/hermes/` as a short Markdown note. Codex writes integration decisions or returned change requests to `feedback/codex/`.
5. **Integrate** — Codex pulls the branch, reads the relevant feedback notes, runs the **full gate checklist** (below), dispatches required reviewers, then merges or returns it `needs-changes` with notes.
6. **Record** — Codex stamps PLAN.md with ✅ + commit hash and clears the status row.

## Feedback loop

Codex must check for new Claude/Hermes notes before any integration step:

```powershell
Get-ChildItem feedback\claude,feedback\hermes -File | Sort-Object LastWriteTime -Descending
```

For each note, Codex records one of:

- `accepted` — incorporated into `PLAN.md`, a spec, migration, or code.
- `needs-clarification` — blocked by ambiguity; ask the originating agent/owner.
- `rejected` — not aligned with honest-broker constraints, scope, or implementation reality; reason recorded in `feedback/codex/`.
- `deferred` — valid but intentionally later; added to backlog or left with rationale.

No agent should assume silence means approval. If Claude or Hermes reviewed something, their feedback must be visible in `feedback/` or pasted into the active thread before Codex treats it as part of the execution contract.

## Gate checklist (Codex runs before any merge to `main`)

Deploy-on-push: a bad merge ships live. No merge unless all that apply are green:

- [ ] **Pipeline** (if `pipeline/` touched): `cd pipeline && .venv\Scripts\python.exe -m pytest -q` **and** `.venv\Scripts\python.exe -m goblin.eval` both pass
- [ ] **Web** (if `web/` touched): `cd web && npm test && npm run build` pass; axe/browser check if UI changed
- [ ] **Functions** (if `functions/` touched): `cd functions && npm test` passes
- [ ] **graph-keeper** APPROVE on any `pipeline/goblin/` diff
- [ ] **integrity-reviewer** APPROVE on any outbound copy
- [ ] Honest-broker invariants intact (no fabricated metrics; schema=hygiene; nothing auto-deploys/auto-sends; WAF handling promises no bypass)
- [ ] Mock/skipped/demo paths reported as such, never as real passes

## Conflict rule

- Two agents needing the same file → the **owner** edits; the other opens a review note. Owner reconciles.
- Cross-cutting change (touches multiple lanes) → Claude writes the spec, Codex sequences the implementation, Hermes confirms it's still the right commercial priority.
- Disagreement the agents can't resolve → escalate to the owner. The owner has final say on everything.

## Source-of-truth split

- **Repo** = anything gated/executable: code, `specs/`, `supabase/migrations/`, `PLAN.md`, `DOCS_PLAN.md`, this file.
- **Vault** (external — `C:\Users\atpat\Documents\ObsidianVault`, NOT a repo subdir; see the Vault note above) = anything strategic: market intel, GTM, positioning, research, MOCs.
- Sync direction: strategy flows vault → PLAN.md (Hermes proposes, Codex integrates); execution status flows PLAN.md → vault mirror (Hermes reflects).
- **Feedback inbox** (`feedback/`) = review notes and integration decisions when Claude/Hermes are not operating in the same live thread.

## Active work streams (from PLAN.md backlog)

Sequenced; each gated before the next where dependent:

1. **Unblock** — pytest contract fix (Codex). Blocks every "pipeline green" claim.
2. **Visual regression + scan proof tooling** — add Playwright MCP screenshot harness + baseline/diff storage (`web/tests/visual/`) and per-run scan artifacts (`web/public/scan-proof/<runId>/`) (Codex integrates; Hermes owns the runbook; Claude owns the spec).
3. **Pipeline features** — Claude specs → Codex implements → graph-keeper reviews. Order: freshness check → per-platform rec tagging → third-party presence check → topical authority proxy → citation verification layer.
4. **Dashboard** — `web/` cutover (owner-gated deploy) → Supabase provision + migrations (Hermes authors, Codex integrates) → login/auth + RLS → dashboard shell. Claude specs the API contracts + RLS rules.
5. **Docs** — `DOCS_PLAN.md` work (Claude drafts → integrity-reviewer → Codex integrates), parallel to everything.
