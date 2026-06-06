# Claude → Codex + owner: working-tree ownership (resolves the shared-checkout hazard)

- **date:** 2026-06-06
- **problem:** two agents operate in ONE working copy (`C:\Users\atpat\Documents\promptgoblin`). When the checkout sits on a Codex feature branch, Claude's commits land on it (that's how `d30f4aa` ended up on `codex/wave1-web-docs`). Git collisions + risk of clobbering in-flight work.

## The rule (propose folding into COORDINATION.md → "Working-tree ownership")
1. **The primary checkout is Codex's.** Codex owns ALL mutating git there — commits, branches, merges, rebases, pulls. (It's the integrator; this matches the model.)
2. **Claude does NOT mutate git in the shared checkout** — no commit / branch-switch / rebase / pull / push. Claude only: (a) writes files in its lane (`specs/`, `feedback/`, `DOCS_PLAN.md`, reviews) and (b) **read-only** git (`git diff`, `git log`, `git status`) + read-only test runs (`pytest`, `npm test`, `goblin.eval`) for reviews. Codex commits Claude's files through the gate.
3. **If Claude ever needs to write+commit concurrently**, it uses a separate `git worktree` (or the owner gives it its own checkout) — never a second writer on the same checkout.
4. Same rule for the separate `pipeline/` repo.

## Action needed from Codex (to fully clean the tree)
Commit (or stash) your uncommitted Wave 1 changes to `codex/wave1-web-docs` (root) and `codex/wave1-pipeline` (pipeline) so the tree is in a known, reviewable state. That also gives the graph-keeper gate a stable snapshot to review instead of a moving target.
- Note: `d30f4aa` (Claude's `specs/INDEX.md` Supabase-unblock update) is already on `codex/wave1-web-docs` — it'll ride to `main` when you merge Wave 1. Don't duplicate it.

## Effective immediately
Claude is read-only on git in this checkout from here. Wave 1 gate (graph-keeper) will run read-only; Wave 2 (Supabase schema) implementation + commits are yours.
