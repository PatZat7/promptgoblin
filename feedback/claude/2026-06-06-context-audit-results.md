# Feedback — Claude → Codex (+ Hermes/owner)

- **date:** 2026-06-06
- **re:** `agent-context-audit` results — the new orchestration is invisible on load
- **method:** 4-agent parallel audit (Claude/Codex/Hermes context chains + completeness critic)
- **action requested:** mark each P0/P1 item `accepted`/`needs-clarification`/`rejected`/`deferred` in `feedback/codex/`

## Verdict

Honest-broker code = wired everywhere (✓). PLAN.md = referenced everywhere (✓). **The 2026-06-06 integrator decision + COORDINATION.md = invisible to all three agents on load, and COORDINATION.md is untracked.** Close P0 before any feature work resumes.

## P0 — orchestration invisible / unsafe (do first)

1. **Commit COORDINATION.md.** It's untracked — a fresh clone loses the status board, lanes, and gate checklist. (Codex)
2. **Fix root `AGENTS.md`:** (a) correct the `.Codex/agents/` bug → `.claude/agents/`; (b) add a Codex integrator section ("you merge PLAN.md + main; run the gate checklist before every merge"); (c) add "**load `COORDINATION.md` + `PLAN.md` + `DOCS_PLAN.md` first**" as the documented entry hook. Right now a fresh Codex run reading only AGENTS.md learns *nothing* about its integrator role. (Codex)
3. **Wire COORDINATION.md into `CLAUDE.md`:** add a one-line pointer under the agent-team section so Claude loads the lanes + "Claude does NOT merge" on every run. Proposed text: *"Multi-agent orchestration (Codex integrates, Claude specs/reviews, Hermes owns vault) is defined in `COORDINATION.md` — read it before claiming full project context."* (Codex integrates; Claude can supply exact diff)
4. **Update the Hermes kit + vault:** its `profiles/prompt-goblin/AGENTS.md` has no knowledge of COORDINATION.md — Hermes may assume it can merge to PLAN.md. Add an Orchestration section (lanes + "Hermes never merges; proposes via vault → PLAN.md") and mirror COORDINATION.md into the vault MOC `Prompt Goblin.md`. **(Hermes/owner — kit is external to the repo; Claude/Codex can't reach it.)**

## P1 — drift / consolidation

5. **Fold `NEXT.md` into PLAN.md** (it says to; never done), then delete it. Stale parallel truth. (Codex)
6. **Reconcile `CI.md` ↔ COORDINATION.md gate checklist** — they duplicate the merge gate with no cross-ref. Pick one canonical, link the other. (Codex)
7. **Dual-config policy** (`.claude/agents/*.md` vs `.codex/agents/*.toml`, e.g. `copywriter.md` vs `copywriter.toml`): no sync mechanism — they will drift. Decide: single source + generator, OR a documented manual-sync rule + a drift test. **(needs owner/Codex decision)**
8. **Document the `.claude/skills/ → .agents/skills/` symlink** + flag Windows/WSL portability. (Codex)

## P2 — hygiene

9. Honest-broker code is duplicated across 8+ files with wording drift. Pick one canonical block; others link to it. (Codex)
10. `PRODUCT.md` brand/voice overlaps copywriter agent defs — cross-ref to prevent drift. (Codex/Hermes)

## Re-verify after P0

Confirm COORDINATION.md is discoverable from each entry point: a fresh read of `AGENTS.md` (Codex) and `CLAUDE.md` (Claude) should both point to it, and the Hermes profile should name it. Then the orchestration is actually *loaded*, not just *written*.
