# DRAFT for review — Tier-2 "✓ cited" overstates AEO visibility (honest-broker)

- **date:** 2026-06-11 (Claude) · **status:** PROPOSAL — needs owner + integrity-reviewer sign-off before any copy ships.
- **what's already fixed (shipped-ready, separate):** the "cited instead" vs "✓ cited" contradiction (label now `also cited:` when `clientCited`) and the dropped tech-stack note. This note is ONLY about issue #3.

## The problem

The free Tier-2 teaser (`functions/lib/perplexity.js` `runTeaserAuto` / `buildQueriesAuto`) asks **brand-anchored** queries:
1. `What do reviewers say about {brand}?`
2. `What are the best alternatives to {brand}?`

`clientCited = true` if the brand's own domain appears in the citations of **either**. Verified live for ninjatrader.com: `clientCited:true`, `citedDomains:[tradingview, quantvps, trustpilot]`.

**Why that overstates:** asking an answer engine about a brand *by name* naturally surfaces that brand's own site. Query 1 is near-trivial (a site being cited for its own name is table stakes). So "you: ✓ cited · full Scout report: 50 prompts × 4 engines" reads as *"you have broad AI visibility"* when all we proved is *"the engine cites your site when asked about you by name."* That's exactly the kind of unmeasured implication the honest-broker code forbids ("never misrepresent what we can do"). The metric that matters for AEO is **category/non-brand** queries (e.g. "best futures trading platform"), where ninjatrader's real gap lives.

## Option A (recommended now — copy only, low-risk)

Scope the claim honestly. Keep the brand-query measurement but stop implying it's category visibility.

- `clientCited` true:
  - row: `you: ✓ cited for your brand` (instead of bare `✓ cited`)
  - note: `cited when buyers ask for you by name — table stakes. The Scout audit tests the category queries buyers actually ask (where {citedDomains} currently win), which is the gap worth closing.`
- `clientCited` false: keep current honest framing ("not cited yet — that's the opening…").

This makes the free teaser honest without new backend work. Route the exact strings through integrity-reviewer.

## Option B (stronger, follow-up — backend)

Run ONE **category** query in the auto teaser instead of (or alongside) the brand queries, so `clientCited` reflects real AEO visibility:
- Infer the category from the Tier-1 `head.title` / `<h1>` (already fetched) or the recon `company_profile` (pipeline path) — e.g. ninjatrader → "best futures trading platform".
- Then "✓ cited" means cited for a query a buyer would actually type. Far more honest + more compelling when it's a gap.
- Cost: needs a category-inference step + an integrity pass on the inferred query (don't assert a wrong category as fact).

## Recommendation

Ship **Option A** with #1/#2 once integrity-reviewer approves the copy; queue **Option B** as the real fix. Do not present brand-name self-citation as AEO visibility.

— Claude (review lane)
