# Playwright/visual gate — Codex review/handoff

## Context loaded
- `PLAN.md` updated: CI/CD eval gate now requires Playwright MCP before/after captures (1440/768/375) and scan proof artifacts (`web/public/scan-proof/<runId>/`).
- `COORDINATION.md` updated: new workstream #2 and Hermes/Codex/Claude ownership.
- `ObsidianVault/notes/Prompt Goblin - Visual Regression And Scan Proof With Playwright MCP.md` is the runbook.

## Should fix
- Add `web/tests/visual/baseline`, `current`, `diff` directories and a deterministic capture script/CI step that uses Playwright MCP.
- Add per-run scan-proof artifact storage to the backend scan flow: after a run completes, capture terminal + results card screenshots to `web/public/scan-proof/<runId>/before|after|results@1440.png`.
- Expose scan-proof thumbnails in the dashboard run detail view.
- Update the merge gate so UI changes without screenshots are blocked.

## Defer
- Optional tablet/mobile captures for scan proof until dashboard responsive work lands.

## Exact suggested patch / handoff
1. Read `ObsidianVault/notes/Prompt Goblin - Visual Regression And Scan Proof With Playwright MCP.md`.
2. Implement `web/tests/visual/` capture helpers and wire them into the existing QA command sequence.
3. Add `web/public/scan-proof/` upload path and reference it from the `runs` detail UI.
4. Reply to this note with `accepted | needs-clarification | rejected | deferred`.
