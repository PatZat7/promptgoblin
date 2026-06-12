# Long-tail batch 1 takeover integration

Date: 2026-06-12
Branch: `feat/longtail-batch1`

## Context

Owner asked Codex to take over after the branch failed build on the new long-tail page set. `COORDINATION.md` says the Codex lane is retired and Claude is the standing integrator, so this note records the explicit owner-directed exception.

## Accepted / Fixed

- Fixed missing `llmsTxtImplementationJsonLd()` export and wired it to the page-specific FAQ source.
- Added `/learn/eeat-for-ai-search`, `/learn/entity-clarity-for-ai`, and `/learn/llms-txt-implementation` to both `llms.txt` files.
- Fixed shared pricing navigation from `/pricing` to `/#pricing` in footer and HUD nav, with regression coverage.
- Added keyboard focus/labels to horizontally scrollable code examples.

## Review / Gate Evidence

- `integrity-reviewer`: APPROVE.
- `cd web && npm test`: 107 tests passed.
- `cd web && npm run lint`: exit 0.
- `cd web && npm run build`: exit 0; 30 routes generated.
- Local production smoke on the three new pages: SSR article content present, JSON-LD present, absolute canonical present, no internal-link 404s.
- Axe-core: 0 violations for all three new pages on desktop and mobile.

## Deferred / Not Claimed

- No pipeline or functions changes; graph-keeper and functions gates not applicable.
- IndexNow submission is post-deploy only and must be logged in `PLAN.md` after the live deploy is verified.
