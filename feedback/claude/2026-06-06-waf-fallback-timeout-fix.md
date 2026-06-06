# WAF/Scrapfly fallback "never works" — timeout fix (IMPLEMENTED, not a spec)

**Author:** Claude · **Date:** 2026-06-06 · Codex bypassed per owner; implemented directly.

## TL;DR
The Scrapfly residential-proxy ASP fallback for WAF-blocked sites **already existed and works**.
Live-tested 2026-06-06: `walgreens.com` via `asp=true` returned HTTP 200 + 567 KB real HTML in ~15s.
The scan "looked like it never works" on heavy Akamai sites because of a **timeout squeeze** — not a
missing capability. Fix = bump timeouts. No new scraping built.

## Evidence
- `example.com` (no asp): OK 4s. `walgreens.com` (asp=true): OK 15s, 567,669 bytes; one earlier run
  timed out at 90s → high variance.
- Deployed tier1 (v0.0.15) HAS `SCRAPFLY_KEY` set (encrypted param, aes-256-v2) — key was NOT the issue.
- Code `SCRAPFLY_TIMEOUT_MS=15000`; action `timeout=20000` → ASP fetch aborted ~1s early on heavy sites.

## Changes (functions/)
- `tier1/index.js`: added `SCRAPFLY_ASP_TIMEOUT_MS=30000`; `fetchViaScrapfly` takes a `timeoutMs` opt;
  WAF-bypass call passes the 30s budget. Opportunistic render on open sites stays at 15s.
- `project.yml`: tier1 `timeout` 20000 → 45000.
- Tests: `npm test` green (scan, scan-index, tier2-auto, verify-citations).

## Honest-broker (unchanged)
Self-identifying bot token kept; `blocked_by_waf` still flagged, never scored 0.
CLAUDE.md honest-broker scope narrowed (owner decision): governs honest claims + delivery, not
lawful data-collection method.

## Deploy (human-gated — NOT done)
`doctl serverless deploy functions` → bumps tier1 to v0.0.16. Then re-scan walgreens.com to confirm.

## Follow-up
Consider Scrapfly async mode so a 30s+ heavy fetch doesn't block the synchronous web action.
