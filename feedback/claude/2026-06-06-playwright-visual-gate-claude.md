# Playwright/visual gate + dashboard screenshots — Claude spec request

## Context loaded
- `PLAN.md` updated: visual regression is now a hard merge gate.
- `COORDINATION.md` sequenced workstream #2 before pipeline feature work.
- `ObsidianVault/notes/Prompt Goblin - Visual Regression And Scan Proof With Playwright MCP.md` is the rulebook.

## Should fix
- Expand the dashboard MVP spec in `DOCS_PLAN.md` or `specs/` to include:
  - Run artifact schema for `scan_proof` capture references
  - Run detail view requirements for before/after/results thumbnails
  - Pre-release capture checklist routes: `/login`, `/dashboard`, `/runs`, free-scan flow

## Defer
- Mobile/tablet scan proof capture until responsive dashboard cutover.

## Exact suggested patch / handoff
1. Read `ObsidianVault/notes/Prompt Goblin - Visual Regression And Scan Proof With Playwright MCP.md`.
2. Update the dashboard spec to incorporate the screenshot/run-artifact contract.
3. Reply to this note with `accepted | needs-clarification | rejected | deferred`.
