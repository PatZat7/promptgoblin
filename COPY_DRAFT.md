# Site copy — audit + proposed edits (DRAFT)

**Status:** draft only. **Do not apply until the mobile UI fix lands** (avoids clobbering edits in `app.jsx` / `styles.css`), then apply the approved items.
**Author:** copywriter · **Gate:** integrity-reviewer verdict at the bottom.
**Goal:** make the copy a clicked-through cold-DM prospect reads *consistent* with the DM that brought them (citation-gap-led, schema softened), and close the honest-broker gaps before any send.

The current copy is strong and already honest (the dogfood "0% cited", "schema is hygiene", "nothing auto-deploys" lines are exactly right). This is targeted surgery, not a rewrite.

---

## P1 — fix before sending leads (credibility / honesty)

### 1. Live Scan demo reads as a real result (`scanScript`, ~line 1210)
The idle terminal shows specific-looking numbers that a prospect can mistake for measured data:
- `competitor detected: 4 mentions · avg position 2.3`
- `↳ retrieving citation graph (n=2,481 sources)`

It *is* labelled "sample" in the panel header and side note — good — but the numbers are precise enough to misread. They're also the first thing a DM'd prospect sees, and our DM led with a *real* citation gap.

**Proposed (make it unmistakably illustrative + lead with the real lever, demote schema):**
> before: `competitor detected: 4 mentions · avg position 2.3`
> after:  `competitor cited · you're not — [sample output]`

> before: `↳ retrieving citation graph (n=2,481 sources)`
> after:  `↳ retrieving citation graph [illustrative]`

> reorder the issue block so the **citation gap** is the HIGH finding and `missing Organization + Service schema` drops to MED — matches "schema is hygiene, not the lever" everywhere else on the page.

*Rationale: the one spot on the site where a number could be read as fabricated. Cheap to neutralize; keeps the whole page consistent with the DMs.*

### 2. Dead "Scrolls" links (`SCROLLS`, ~line 956)
Three field notes (N.01–N.03) link to `href="#"`. A prospect who clicks gets nothing — worse than not linking.

**Proposed:** either (a) mark them `coming soon` and remove the anchor, or (b) ship even one real post (the "Schema is hygiene, not a citation lever" essay basically already exists as your positioning — it'd convert). Recommend (b) for N.02; (a) for the rest.

*Rationale: a cold lead clicking a dead link on first visit is a credibility leak.*

### 3. Verify the Telemetry stats are measured (`STATS`, ~line 513)
`100% Schema valid · this site` and `180ms Median TTFB · this site` are presented as fact under a "dogfooded" label.
- Schema-valid: confirm the JS-rendered JSON-LD actually validates (we know it renders client-side — make sure "valid" is from a real validator run, not assumed).
- `180ms TTFB`: confirm this is a real recent measurement. If not measured, soften to a non-numeric claim or drop it.

*Rationale: these are the only hard self-metrics on the page; if a prospect checks and they're off, it undercuts the "we measure straight" pitch. (No change proposed yet — flagged for you to confirm/measure.)*

---

## P2 — polish (consistency / conversion)

### 4. Capacity number is inconsistent
- IndexNow "now": `Open — taking 3 clients · Q3 26`
- Contact panel bar: `Q3–Q4 2026 open`

**Proposed:** pick one. Suggest `taking 3 clients · Q3–Q4 26` in both. *(Scarcity + consistency.)*

### 5. "30+ tasks" in Scout (`TIERS`, ~line 1747)
`Ranked fix queue · 30+ tasks` — the dogfood case study shows "12 fixes queued" for our own small site. 30+ is plausible for a client audit but make sure it's defensible.
**Proposed (safer):** `Ranked fix queue · scored by impact × effort` (drop the count, or keep "30+" only if a typical audit really yields that).

### 6. Hero ↔ DM hook alignment (optional, strong)
The DMs open on "the engines cite your competitor, not you." The hero leads on "AI search visibility & technical SEO." Consider a sub-line that mirrors the DM's hook for continuity, e.g. under the hero note:
> `When someone asks an AI for the best in your category — does it name you, or your competitor? We measure that, then close the gap.`

*Rationale: message-match between the DM and the landing view lifts conversion; it's also just true to the product.*

---

## Already strong — leave alone
- Hero: "Get found by robots. Stay usable by humans." ✓
- Services (ii)/(iii): "schema is hygiene… levers are brand mentions + Bing rank." ✓ (this is the honest core — keep verbatim)
- Work §01 dogfood "0% cited" + method cards marked "illustrative, not a client result." ✓
- Pricing guarantee: "on the work, not the algorithm… we won't promise a citation number (nobody honestly can)." ✓ (best line on the site)
- Quotes/house rules. ✓

---

## integrity-reviewer verdict
**REVISE** — three P1 items gate a send:
1. Neutralize the Live Scan demo numbers (#1) — current state risks reading as a fabricated result.
2. Kill or fill the dead Scrolls links (#2).
3. Confirm the two Telemetry numbers are measured (#3); soften if not.

P2 items are APPROVE-on-sight (no honesty risk). None of the proposed rewrites introduce an unmeasured claim. Re-review #6's new sub-line if added (it's a promise of measurement — fine, since we do measure it).
