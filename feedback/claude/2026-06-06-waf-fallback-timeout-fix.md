# Spec: WAF/Scrapfly fallback "never works" — timeout + deploy fix (NOT a new feature)

**Author:** Claude (spec lane) · **For:** Codex (functions/ delivery) · **Date:** 2026-06-06
**Gate:** functions delivery → Codex implements + stamps PLAN.md. Outbound copy unaffected.

## TL;DR
The Scrapfly residential-proxy ASP fallback for WAF-blocked sites **already exists and works**.
Live-tested 2026-06-06: `walgreens.com` via `asp=true` returns HTTP 200 + 567 KB real HTML in ~15s.
The scan "looks like it never works" on heavy Akamai sites because of a **timeout squeeze** and a
possible **undeployed key** — not a missing capability. Do NOT build new scraping.

## Evidence
- `example.com` (no asp): OK 4s.
- `walgreens.com` (asp=true, render_js): OK 15s, upstream 200, success=true, 567,669 bytes.
- First Walgreens probe timed out at 90s (cold residential proxy) → confirms high variance.
- `functions/packages/scan/tier1/index.js`: `SCRAPFLY_TIMEOUT_MS = 15000`; ASP fetch aborts at 15s.
- `functions/project.yml`: tier1 action `timeout: 20000`.
- `.deployed/versions.json`: tier1/tier2 last at v0.0.15 — env contents at deploy time unknown.
- `SCRAPFLY_KEY` IS present in local `.env` (scp-…, 41 chars). Deployed-namespace presence UNVERIFIED.

## Root causes (in priority order)
1. **Key possibly not on the DO namespace.** If added to `.env` after the v0.0.15 deploy, prod has no
   key → `fetchViaScrapfly` returns null immediately → every WAF site returns `blocked_by_waf`.
   ACTION: verify `SCRAPFLY_KEY` on the namespace; redeploy tier1 if absent. (Most likely prod cause.)
2. **Timeout squeeze.** Heavy Akamai sites need the full ~15s for the ASP round trip, which equals
   `SCRAPFLY_TIMEOUT_MS`, and the whole action must also finish the initial failed fetch + robots +
   llms inside `timeout: 20000`. The ASP call gets aborted ~1s too early.

## Proposed change (functions/)
- `tier1/index.js`: `SCRAPFLY_TIMEOUT_MS` 15000 → **30000**.
- `project.yml`: tier1 `timeout` 20000 → **45000** (confirm DO web-action max allows it; current default
  is well under platform ceiling).
- On `botWalled`, skip/parallelize robots+llms so they don't compete with the ASP fetch for the budget
  (currently robots/llms run after the ASP fallback resolves — verify ordering doesn't double-spend time).
- Keep the honest `blocked_by_waf` return for the case where ASP genuinely fails — unchanged.

## Honest-broker guardrails (unchanged, do not regress)
- Self-identifying `PromptGoblinScanBot` token stays.
- `blocked_by_waf` is never scored 0 — flagged honestly.
- No new claim that schema/markup drives citations.

## Follow-up (not this PR)
- Consider Scrapfly **async mode** (submit + poll/webhook) so a 30s+ heavy fetch doesn't block the
  synchronous web action / make the user wait. Bigger change; the timeout bump is the immediate fix.
- Owner action item (business, not code): the cold-scrape-via-stealth posture was confirmed as the
  accepted path; a brief CFAA/ToS legal check before scaling is advised (logged, not blocking).
