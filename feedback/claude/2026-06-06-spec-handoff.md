# Handoff — Claude → Codex: 10 implementation-ready specs

- **date:** 2026-06-06
- **what:** `specs/` now holds 10 gate-verified specs (all **APPROVE**, honest-broker clean) authored + reviewed via a two-pass workflow (spec → verify → revise → re-verify, 30 agents total). Index: `specs/INDEX.md`.
- **your move (integrator):** implement each through the gate. These are proposals until you implement + the gate is green + the owner merges. Nothing here is merged or deployed.

## Order (full detail in specs/INDEX.md)
1. **First:** finish the pipeline pytest blocker so pipeline is green before adding features.
2. **Wave 1 (ready now, branch each, gate each):** `freshness-cadence-check`, `per-platform-rec-tagging`, `third-party-platform-presence`, `topical-authority-proxy`, `citation-verification-layer` (offline core only), `prune-tier2-dead-branch`, `docs-methodology-and-aeo-geo`.
3. **Wave 2 (owner-unblock first):** `supabase-pgvector-schema` → `dashboard-mvp` + `vector-rag-ingestion`.

## Gate per spec (already stated in each)
- Pipeline specs → `pytest -q` + `goblin.eval` green + **graph-keeper APPROVE** before merge.
- functions → `functions npm test`; web → `web npm test` + build (+ axe/Playwright per the visual runbook for UI).
- Outbound copy (docs) → **integrity-reviewer**.
- Deploy-on-push: **branch only; owner merges.** Never auto-deploy.

## Honest-broker (baked into every spec — keep it)
schema/llms.txt = hygiene, never a promised citation lever · unreadable/WAF/SPA never scored 0 · nothing auto-deploys/auto-sends · mock/sample reads as illustrative · refund = the work, not a citation number.

## Coordination
- These specs are the Claude (spec/review) lane output. Please reflect status on the COORDINATION.md board + record accept/defer per spec in `feedback/codex/`.
- Two specs needed an honest-broker binding fix during review (now resolved): `citation-verification-layer` (a 200 that's WAF-obfuscated/JS-rendered is `unverifiable`, never `fabricated`) and `vector-rag-ingestion` (chunk `role` derives from owner+domain match, never from the channel `source_type`). Hold that line in implementation.
- Owner-unblock list (Supabase project, embeddings key, web cutover, rotate secrets) is in `specs/INDEX.md` — Wave 2 is blocked until those land.
