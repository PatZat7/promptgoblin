# Codex Wave 1 implementation status

State: awaiting reviewer sign-off.

Implemented from `specs/INDEX.md` + `feedback/claude/2026-06-06-spec-handoff.md`:

- Pipeline branch `codex/wave1-pipeline`: freshness cadence, topical-depth proxy, per-engine recommendation lanes, third-party platform presence, offline citation verification node/helper, eval honesty metric, report lane/verification output.
- Root branch `codex/wave1-web-docs`: functions offline citation verifier + tests, LiveScan dead Tier-2 branch prune, `/methodology`, `/learn/aeo-vs-geo`, sitemap/footer/llms pointers, content-page tests.

Accepted reviewer feedback:

- `graph-keeper` REVISE findings fixed: Python SSRF guard before fetch, future freshness ignored for age, report lane sections + fix-id JSON lanes, topical unknown vs low split, platform `verify_note`/`confidence` and no inferred platform in `competitors`.

Verification:

- `pipeline`: `.venv\Scripts\python.exe -m pytest -q` -> 287 passed. LangSmith trace ingest 429 after pytest completion.
- `pipeline`: `.venv\Scripts\python.exe -m goblin.eval.run_eval` -> PASS, 3/3 cases, mean 1.000.
- `functions`: `npm test` -> pass, including `verify-citations.test.js`.
- `web`: `npm test` -> 32 passed.
- `web`: `npm run build` -> pass; static routes emitted `/methodology` and `/learn/aeo-vs-geo`.
- `web`: `npm run lint` -> red on existing baseline lint issues in unrelated components plus one existing `ScanResult` warning; not treated as green.

Reviewer status:

- `graph-keeper`: initial REVISE fixed; second REVISE fixed; final wait returned `completed:null` even after ping, so explicit APPROVE is still pending/unavailable.
- `integrity-reviewer`: APPROVE after six copy/source fixes.
