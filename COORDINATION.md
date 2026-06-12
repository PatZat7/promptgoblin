# Prompt Goblin — COORDINATION (multi-agent orchestration)

> How the agents work the repo without stomping each other. This file is the **visibility board** — glance here to see who's doing what.
> Canonical copy lives here (repo root). Hermes mirrors a pointer from the vault MOC. Last touched: 2026-06-12.

## The one rule

**One owner per path. One integrator per merge.** PLAN.md is the execution contract; this file is the live status of who's executing it.

> **2026-06-12 (owner call): the Codex handoff lane is RETIRED** — the spec→Codex handoff didn't work in practice. **Claude is the standing integrator AND implementer**: it writes specs, implements them directly, runs the gate checklist, merges, and stamps `PLAN.md`. The 2026-06-06 "Claude as sole integrator" override is now the permanent model, not an override. Hermes's vault/migration-authoring lane is unchanged.

## Per-session worktree isolation (added 2026-06-06)

Multiple sessions sharing **one** working tree on `main` will silently destroy each other's *uncommitted* work — a destructive `git checkout`/`reset --hard`/`stash` in one session wipes another's edits with no warning. This bit us 2026-06-06 (a WAF timeout fix was lost mid-session, then recovered by re-applying + committing). Rules:

1. **Commit early, commit often.** Only committed objects survive another session's git ops. Never leave substantial work uncommitted on a shared tree.
2. **One worktree per concurrent session** before starting parallel work:
   ```powershell
   git worktree add ../pg-<task> -b <fix|feat>/<task>   # own checkout + index + branch
   git worktree list                                     # audit active trees
   git worktree remove ../pg-<task>                      # when merged
   ```
   A destructive git op in one worktree cannot touch another's uncommitted work.
3. **Stage by explicit path, never `git add -A`/`.`,** when the shared tree may hold another session's files — commit only your own paths.

## Roster + lanes (updated 2026-06-12 by owner)

| Agent | Seat | Owns (writes here) | Reviews (no merge) | Does NOT touch |
|---|---|---|---|---|
| **Claude** | **Integrator + spec + implementation** | merges to `PLAN.md` + `main`; `specs/`, `DOCS_PLAN.md`; implements `functions/`, `web/`, `pipeline/goblin/` code, build glue, `supabase/migrations/` (integrates Hermes's authored SQL) | architecture, honest-broker on outbound copy, Supabase schema review | — |
| **Hermes** | Vault / strategy / migration authoring | `ObsidianVault/` (research, GTM, strategy, MOCs), authors `supabase/migrations/*.sql` (Claude integrates) | roadmap order, market/positioning, commercial value | repo code merges; PLAN.md merges |
| ~~Codex~~ | **Retired 2026-06-12** (was: integrator + implementation) | — | — | everything (lane closed; historical notes in `feedback/codex/` remain for reference) |

**Required gate-reviewers (regardless of who implements):**
- `graph-keeper` — **required** before any `pipeline/goblin/` change merges.
- `integrity-reviewer` — **required** before any prospect/client-facing artifact ships.

## Live status board

> Each agent updates its own row before starting a task. Integrator reconciles. `git branch -a` = active work; PLAN.md ✅+hash = done work.

| Agent | Current task | Branch | Status | Updated |
|---|---|---|---|---|
| Claude | Long-tail page-targets spec (`specs/longtail-page-targets.md`) + Codex-lane retirement doc sweep. GSC + Bing WMT confirmed done by owner. | `main` | in-progress | 2026-06-12 |
| Hermes | vault mirror + GTM angles (vault lane unchanged) | external vault | in-progress | 2026-06-06 |

## Context preflight

Before any agent claims work, it loads the same minimum context so reviews do not drift:

| Agent | Must read first | Then read when relevant |
|---|---|---|
| **Claude** | `AGENTS.md`, `PLAN.md`, `COORDINATION.md`, `DOCS_PLAN.md`, `.claude/agents/promptgoblin-expert.md`, current `git status` for repo + `pipeline/` | `web/AGENTS.md` for web changes; `pipeline/README.md` + `pipeline/goblin/graph.py` for pipeline changes; `functions/README.md` for DO Functions changes; dashboard section of `PLAN.md` for Supabase/API specs |
| **Hermes** | `PLAN.md`, `COORDINATION.md`, vault MOC / `Prompt Goblin - *.md` research notes | repo `DOCS_PLAN.md` for docs strategy; dashboard/vector sections before authoring migration SQL |

**Connection check:** if an agent cannot see one of its required context files, it must stop and report the missing file instead of proceeding from memory.

**Vault note:** this repo does not currently contain an `ObsidianVault/` directory. Hermes owns the external vault mirror and sends repo-bound artifacts back as review notes or migration SQL for Codex to integrate.

## Work protocol (handoff lane retired 2026-06-12)

1. **Claim** — agent stamps its row in the status board (task + branch + `in-progress`).
2. **Work** — on a branch in its lane. Specs land in `specs/`; code on `fix/*` or `feat/*`; strategy in the vault.
3. **Integrate** — Claude runs the **full gate checklist** (below), dispatches required reviewers (`graph-keeper`, `integrity-reviewer`), then merges — or parks the branch with notes if a gate is red.
4. **Record** — Claude stamps PLAN.md with ✅ + commit hash and clears the status row.

## Feedback loop

Hermes review notes land in `feedback/hermes/`; Claude records integration decisions in `feedback/claude/`. Before integrating anything Hermes-authored, Claude checks for new notes:

```powershell
Get-ChildItem feedback\hermes -File | Sort-Object LastWriteTime -Descending
```

For each note, Claude records one of: `accepted` · `needs-clarification` · `rejected` (with honest-broker/scope reason) · `deferred`. No agent should assume silence means approval. (`feedback/codex/` is retained read-only as the historical record of the retired lane.)

## Coordination watcher (per-turn diffs)

`scripts/coordination-watch.js` prints a compact "what the *other* agents changed since your last turn" digest (status-board rows + `feedback/` notes), so nobody re-reads everything each turn. Deterministic, no LLM, silent when idle.
- **Claude:** runs automatically via a `UserPromptSubmit` hook (`.claude/settings.json`).
- **Hermes:** run `node scripts/coordination-watch.js --agent hermes` at the start of each task.
- Per-agent snapshots live in `.coordination-watch/` (gitignored).

## Gate checklist (Claude, the integrator, runs before any merge to `main`)

> This is the **agent pre-merge** gate. The **CI/CD** pipeline (GitHub Actions on every PR/push, deploy steps, CodeRabbit) is documented separately in **`CI.md`** — keep the two in sync.

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
- Cross-cutting change (touches multiple lanes) → Claude writes the spec + sequences the implementation; Hermes confirms it's still the right commercial priority.
- Disagreement the agents can't resolve → escalate to the owner. The owner has final say on everything.

## Source-of-truth split

- **Repo** = anything gated/executable: code, `specs/`, `supabase/migrations/`, `PLAN.md`, `DOCS_PLAN.md`, this file.
- **Vault** (external — `C:\Users\atpat\Documents\ObsidianVault`, NOT a repo subdir; see the Vault note above) = anything strategic: market intel, GTM, positioning, research, MOCs.
- Sync direction: strategy flows vault → PLAN.md (Hermes proposes, Claude integrates); execution status flows PLAN.md → vault mirror (Hermes reflects).
- **Feedback inbox** (`feedback/`) = review notes and integration decisions when Claude/Hermes are not operating in the same live thread.

## Active work streams (from PLAN.md backlog)

Sequenced; each gated before the next where dependent. Claude specs, implements, and integrates throughout; Hermes owns runbooks/strategy; required reviewers per the gate checklist:

1. **Visual regression + scan proof tooling** — Playwright MCP screenshot harness + baseline/diff storage (`web/tests/visual/`) and per-run scan artifacts (`web/public/scan-proof/<runId>/`) (Hermes owns the runbook).
2. **Pipeline features** — graph-keeper reviews every `pipeline/goblin/` diff. Remaining order: citation verification layer live-verify + dashboard surfacing.
3. **Own-site AEO/SEO** — `specs/longtail-page-targets.md` (brand-query rescue + long-tail pages; GSC/Bing WMT verified 2026-06-12).
4. **Dashboard** — shipped + live; remaining items tracked in PLAN.md (approval UI, run-your-own-scan, auto Tier-2 on account creation).
5. **Docs** — `DOCS_PLAN.md` work (Claude drafts → integrity-reviewer → Claude integrates), parallel to everything.
