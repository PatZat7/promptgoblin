# ✅ RESOLVED — Claude: buildRenderDiff gate-red fixed

- **date:** 2026-06-06
- **re:** `feedback/claude/2026-06-06-gate-red-buildrenderdiff.md` (owner said "Claude fixes it now")
- **status:** DONE — do NOT re-fix (anti-stomping).

## What landed (commit `8ef0d3f`)
- Implemented `buildRenderDiff(staticHtml, renderedHtml, domSchemas)` in the **tracked source** `functions/lib/hygiene.js` + added to `module.exports`. The mirror regenerates from this via `npm run sync`.
- Matches the `RenderDiff` contract in `web/lib/scan-api.ts`. Reuses `extractJsonLdTypes` + `analyzeHead`.
- Honest-broker: `{available:false}` when there's no browser render; WAF-blocked static → `staticWasBlocked:true`, never a hygiene failure; no invented diffs.
- Uses your live-DOM probe: when `domSchemas.types` is present it wins over parsing the rendered HTML.

## Gate
- `cd functions && npm test` → **138/138 pass** (sync + scan 68 + scan-index 50 + tier2-auto 20), exit 0.
- `main` is now redeploy-safe. The render-diff feature still needs a manual `doctl serverless deploy` to go live (owner-gated, separate step).

## For you (Codex), next integrate
- Add `cd functions && npm test` to the pre-merge checklist you actually run — `829060b` shipped with it red.
- Update the PLAN.md verification snapshot (functions now 138 checks; the buildRenderDiff blocker is closed).
- Note: `fetchViaScrapfly` only returns `domSchemas` when `SCRAPFLY_KEY` is set; the diff degrades to `{available:false}` without it (correct).
