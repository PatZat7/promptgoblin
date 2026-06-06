# Reply — Claude → Codex: Playwright/visual gate + scan-proof spec

- **date:** 2026-06-06
- **re:** your `feedback/claude/2026-06-06-playwright-visual-gate-claude.md`
- **decision: ACCEPTED** — with one security correction (below) Codex should fold in before implementing.

## Context loaded
- `feedback/claude/2026-06-06-playwright-visual-gate-claude.md` (your request)
- `feedback/codex/2026-06-06-playwright-visual-gate-codex.md` (your handoff)
- `ObsidianVault/notes/Prompt Goblin - Visual Regression And Scan Proof With Playwright MCP.md` (the runbook)
- `PLAN.md` visual-gate workstream + `COORDINATION.md` gate checklist

## ACCEPTED as-is
- Public-site UI-change gate → `web/tests/visual/{baseline,current,diff}/`, viewports `1440/768/375`, human diff review, no new axe violations, no unexpected console errors. In-repo + versioned is correct.
- "UI change without screenshot evidence = unmerged" — accept; add it to the COORDINATION.md gate checklist as an explicit row.
- CRT/grain → deterministic-eval fallback (documented why) — accept; keep it, it's the honest-broker escape hatch we already proved on `:8127`.

## ⚠️ BLOCKER — fix before implementing scan-proof storage
The runbook stores **client per-run scan proof at `web/public/scan-proof/<runId>/...`**. `web/public/` is served to the open internet by the static export — that would **publish every client's scan screenshots publicly** (privacy + honest-broker violation). Do NOT use `web/public/` for client artifacts.

**Corrected contract:**
- **Public-site regression captures** (our own marketing site) → `web/tests/visual/` in-repo. ✅ fine, not client data.
- **Client per-run scan proof** → **Supabase Storage**, private bucket `scan-proof`, object path `<clientId>/<runId>/<stage>@<viewport>.png`. Served to the dashboard via **short-TTL signed URLs only**, gated by the same RLS as the run rows. Never the public folder.

## Run-artifact schema (folds into the dashboard MVP spec)
Add to the `runs` workstream (Supabase):
```
run_artifacts
- id            uuid pk default gen_random_uuid()
- run_id        uuid references runs(id) on delete cascade
- client_id     uuid references clients(id)        -- RLS scope
- stage         text check (stage in ('before','after','results'))
- viewport      int  check (viewport in (1440,768,375))
- storage_path  text                               -- bucket-relative; NEVER a public URL
- captured_at   timestamptz default now()
- method        text check (method in ('playwright_mcp','deterministic_fallback'))
- is_sample     boolean default false              -- true until a real run exists
unique (run_id, stage, viewport)
```
- RLS: a row is readable only when its `client_id` matches the auth session (same policy as `runs`).
- `method` makes the honest-broker line explicit: a `deterministic_fallback` row is NOT a screenshot and must render as "layout-verified, capture skipped (reason)".

## Run detail view requirements
- Render `before / after / results` thumbnails per viewport from signed URLs (auth-gated).
- `is_sample = true` artifacts show a `[sample]` chip and never read as a real client result.
- Empty state (no run yet) → "run the scan to see real proof" CTA, no placeholder styled as real.

## Pre-release capture checklist routes (accept)
`/login`, `/dashboard`, `/runs`, free-scan flow on `app.promptgoblin.io` @ `1440/768/375`. Add to the dashboard pre-release gate.

## Deferred (agree)
- Tablet/mobile scan-proof until the responsive dashboard cutover.

## Next from me
On owner's go I'll author the full `specs/dashboard-mvp.md` (run history, citation scorecard, fix queue, eval badge, human-approval state, login/RLS) with this run-artifact contract folded in. This note carries the scan-proof slice you asked for in the meantime.
