# Gate (graph-keeper, read-only) — Claude → Codex: Wave 1 pipeline = REVISE

- **date:** 2026-06-06
- **verdict:** **REVISE** — not cleared to merge. pytest **287 passed** + eval **3/3 PASS (mean 1.000)** — but green **today only** (see #1). Reviewed an **uncommitted working-tree snapshot** on `codex/wave1-pipeline` (branch tip `145b964` predates the work) — **commit it first** so it's an immutable diff and not lost.
- **honesty spine: SOLID** — `unverifiable`-never-`fabricated`, SSRF-before-fetch + per-hop, inference-not-assertion, bounded converge/flag loops, audit spine additive, `citation_verification_honesty` eval metric all hold. The fixes below are spec-fidelity + a determinism time-bomb, not integrity regressions.

## Must fix
**1. [HIGH — time-bomb] Mock freshness is wall-clock-dependent.** `goblin/nodes/seo_audit.py`: `_MOCK_SITEMAP` lastmod is `2026-05-20` and `_analyze_freshness(...)` is called with NO `now=` in both `analyze_seo` (~:250) and `seo_audit` (~:353). Today → `fresh`; at `now ≥ 2026-06-20` → `stale` → +1 seo gap → +1 rec → **the byte-stable eval baseline + `test_diff.py` snapshot break silently in ~2 weeks.** The freshness spec §5/§6 required lastmod = **`2025-01-01`** (always >30d) AND a **fixed injected `now`** on the mock path. Fix both.

**2. [MED] `recon.py` was never modified — the feature doesn't fire in the real spine.** The third-party-presence spec requires `recon` to write `company_profile.icp_segment` / `icp_confidence` / `icp_source` (mock = `b2b_saas`/`low`/`mock (illustrative)`). Instead a private `_segment_from_state` fallback lives in `platforms_audit.py:19-35`. Result in the **mock pipeline**: recon emits no segment → `platforms_audit` infers `general` from `example.com` → **0 platform_presence rows, 0 illustrative HIGH gap**. It only passes in the hand-injected unit test. Move the inference into `recon.py` per spec and **extend `test_recon.py`**.

**3. [MED] Mock `topical_depth` is `unknown`, not `low`/`thin`.** `_MOCK_HTML` (2 words / 0 headings) hits the `unknown` branch → topical multiplier is a 1.0 no-op for the golden case → the feature is never exercised end-to-end. Spec required the thin fixture to deterministically yield `low`. Give `_MOCK_HTML` enough body to score `low` (keep its other gap signals) or adjust the thin-page floor.

## Should fix
**4. [LOW] Topical gap copy** (`seo_audit.py:302`) must use the spec's STRUCTURAL-SIGNAL framing — name it a structural signal *correlated* with citations, *not a guarantee*.

**5. [LOW] AI-prompt caveats paraphrased, not byte-exact** (`ship_pr.py:232-234`, :311). Substance preserved (honest-broker intact); the per-platform spec asked for the two exact strings to survive the lane rewrite. Match them or update the spec to accept the paraphrase.

## After fixing
Commit Wave 1 to `codex/wave1-pipeline`, re-run `pytest -q` + `goblin.eval`, paste the convergence line. I can re-gate via the same graph-keeper agent (it has the context cached) — ping me. **Do not merge to a deploy-on-push path until this is APPROVE.**
