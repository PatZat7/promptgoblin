# Per-Platform Recommendation Tagging

Tag each Prompt Goblin recommendation with the answer-engine lane it serves —
`chatgpt`, `google_aio`, or `both` — so the client report and the AI-prompt
artifact can present fixes in two strategy lanes instead of one undifferentiated
queue.

## Goal

ChatGPT and Google AI Overviews (AIO) reward different things and are not the
same game:

- **ChatGPT lane** wins on *freshness*, clean *structure*, and a
  *direct-answer-in-the-first-50-words*. Its citation set is largely
  independent of classic Google ranking.
- **Google AIO lane** wins on *authority / E-E-A-T* and on *already ranking on
  Google Page 1* — AIO overwhelmingly pulls from URLs that already rank, so the
  prerequisite is "rank first, then get summarized."

Because the two lanes need different work, the report and the AI prompt should
group recs by lane. This spec adds a single `engine_lane` tag to each
`Recommendation`, derived deterministically from the gap `kind` (and, where
cheap, the gap `detail`/`query`), then teaches the two renderers to show the
lanes. It changes **no scoring, no gap detection, and no rec count** — so
`GOLDEN_CASES` and the eval rubric stay green.

The lane is an *editorial routing* tag, not a measured claim. It says "this kind
of fix tends to matter more for ChatGPT vs. AIO," never "this fix will earn you a
citation on engine X."

### Rationale framing (kept honest, not hard-coded as fact)

The backlog rationale ("ChatGPT drives ~87% of AI referral traffic; ~80% of its
citations don't rank in Google's top 100") is the *motivation* for splitting
lanes. It MUST NOT be printed in the client report or AI prompt as a Prompt
Goblin measurement — it is third-party industry context, not a number we
measured. If any such figure is surfaced at all, it lives in code comments /
this spec only, or is attributed to its source as context. The renderers print
lane *labels and strategy guidance*, never a traffic-share statistic dressed up
as our finding. (Honest-broker: never fabricate metrics/citations.)

## Files touched (exact paths + which repo)

All paths in the **`pipeline`** repo (a separate git repo nested at
`promptgoblin/pipeline/`; gate: `graph-keeper`).

| Path | Change |
|---|---|
| `pipeline/goblin/state.py` | Add `engine_lane: str` field to the `Recommendation` TypedDict; document the lane vocabulary. |
| `pipeline/goblin/nodes/recommend.py` | Add lane constants + `_lane_for(gap)` helper; set `engine_lane` on every `Recommendation`; (optional) one log line counting lanes. |
| `pipeline/goblin/nodes/ship_pr.py` | In `_render_markdown` and `_render_ai_prompt`, group the approved fixes into two lanes (ChatGPT / Google AIO) with a short strategy header per lane; `both`-tagged items appear under each. JSON sidecar already serializes the whole `Recommendation`, so `engine_lane` flows through automatically — add an explicit per-lane index list for diffability. |
| `pipeline/tests/test_recommend_lanes.py` | **New** test module: lane-tagging unit tests (see Unit-test plan). |
| `pipeline/tests/test_smoke.py` | Add one assertion that every rec carries a valid `engine_lane`; assert lane grouping appears in the rendered markdown. |

No web/functions/supabase changes. No deploy. Nothing auto-sends.

## Design

### 1. New field on `Recommendation` (`state.py`)

Extend the existing TypedDict (currently `id, title, kind, rationale, impact,
effort, score, snippet, approved`) with one field:

```python
class Recommendation(TypedDict):
    id: str
    title: str
    kind: str            # citation | schema | content | seo | a11y | community
    rationale: str
    impact: int
    effort: int
    score: float
    snippet: str
    approved: bool
    # NEW — answer-engine lane this fix primarily serves. EDITORIAL routing
    # only (which engine this *kind* of fix tends to help), never a measured
    # or promised citation outcome:
    #   "chatgpt"    — freshness / structure / direct-answer-first
    #   "google_aio" — authority / E-E-A-T / needs Google Page-1 rank first
    #   "both"       — helps both lanes (hygiene that unblocks either)
    engine_lane: str
```

`Recommendation` is a plain `TypedDict`, so adding a key is backward-compatible
at runtime; only the constructor in `recommend.py` writes it. (Keep it required
in the type — every code path that builds a `Recommendation` is in
`recommend.py`, so there is exactly one writer.)

### 2. Lane derivation (`recommend.py`)

Add module-level constants and a small pure helper, mirroring the existing
`_EFFORT` / `_IMPACT` dict + `_snippet_for` pattern:

```python
# Answer-engine lanes. EDITORIAL routing only — which engine a fix-kind tends to
# serve — never a measured or promised citation outcome.
LANE_CHATGPT = "chatgpt"
LANE_GOOGLE_AIO = "google_aio"
LANE_BOTH = "both"
_VALID_LANES = frozenset({LANE_CHATGPT, LANE_GOOGLE_AIO, LANE_BOTH})

# Default lane per gap kind. Rationale, kind by kind:
#  content   -> BOTH: an answer-first explainer with structure feeds ChatGPT's
#               direct-answer preference AND, once it ranks, AIO's summary pool.
#  citation  -> BOTH: earning brand mentions/3rd-party sources is the universal
#               lever; it moves ChatGPT and (via authority) AIO alike.
#  community -> CHATGPT: Reddit/Quora/G2/Wikipedia are disproportionately the
#               sources ChatGPT cites; this is the strongest ChatGPT-lane lever.
#  schema    -> BOTH: hygiene that unblocks crawlers for either engine. (NOT a
#               citation lever for either — see honest-broker note.)
#  seo       -> GOOGLE_AIO: title/meta/canonical/H1 are classic ranking signals;
#               AIO needs Page-1 rank first, so SEO hygiene is the AIO precursor.
#  a11y      -> BOTH: structure/landmarks/headings/alt aid machine parsing for
#               either engine (and are correctness/compliance value regardless).
_LANE_BY_KIND = {
    "content": LANE_BOTH,
    "citation": LANE_BOTH,
    "community": LANE_CHATGPT,
    "schema": LANE_BOTH,
    "seo": LANE_GOOGLE_AIO,
    "a11y": LANE_BOTH,
}


def _lane_for(gap: Gap) -> str:
    """Return the engine lane ('chatgpt'|'google_aio'|'both') for a gap.

    Deterministic, pure, and defensive: unknown kinds fall back to 'both'
    (never silently drop a rec from a lane). A future caller could refine this
    by inspecting gap['detail'] (e.g. a 'freshness'/'updated' SEO sub-finding ->
    chatgpt), but the kind-level map is the stable default.
    """
    lane = _LANE_BY_KIND.get(gap.get("kind", ""), LANE_BOTH)
    # Cheap detail-level refinement, additive and conservative:
    detail = (gap.get("detail") or "").lower()
    if gap.get("kind") == "seo" and ("freshness" in detail or "last-modified" in detail
                                     or "stale" in detail or "updated" in detail):
        # Freshness signals favor ChatGPT, but they still help ranking -> BOTH.
        lane = LANE_BOTH
    return lane if lane in _VALID_LANES else LANE_BOTH
```

In the `recommend()` loop, set the field when constructing each
`Recommendation`:

```python
recs.append(
    Recommendation(
        id=f"FIX-{i:03d}",
        ...
        approved=False,
        engine_lane=_lane_for(gap),
    )
)
```

Optionally extend the existing log line with a lane tally, e.g.
`recommend: ranked N fix(es); lanes chatgpt=a google_aio=b both=c; top score=...`
(append-only string; tests assert on `recommendations`, not log text).

**Why kind-driven, not a new model call:** the derivation must be deterministic
(mock mode is the eval substrate) and must not add a network dependency or a
node. The gap `kind` already encodes the discipline; the lane is a fixed
editorial mapping of discipline → engine emphasis.

**Crucially: still exactly one rec per gap.** A `both` rec is ONE rec that
appears in BOTH lane *views*; we never duplicate the rec into two list entries.
This preserves the eval invariant `len(recommendations) >= len(gaps)` (see
`no_fabrication` metric (d)) and keeps `FIX-NNN` ids stable and unique.

### 3. Two-lane rendering (`ship_pr.py`)

Add `_by_lane(recs) -> dict[str, list]` as a **module-level function in
`ship_pr.py`** (a top-level `def`, not a nested closure or method), so it is
importable as `ship_pr._by_lane` for the unit test and reusable by both
renderers and the JSON sidecar. It is a tiny pure helper:

```python
def _by_lane(recs: list) -> dict[str, list]:
    """Group recs into lane views. 'both' items appear under BOTH lanes,
    de-duped by id within each lane."""
    lanes = {"chatgpt": [], "google_aio": []}
    seen = {"chatgpt": set(), "google_aio": set()}
    for r in recs:
        lane = r.get("engine_lane", "both")
        rid = r.get("id")
        if lane in ("chatgpt", "both") and rid not in seen["chatgpt"]:
            lanes["chatgpt"].append(r)
            seen["chatgpt"].add(rid)
        if lane in ("google_aio", "both") and rid not in seen["google_aio"]:
            lanes["google_aio"].append(r)
            seen["google_aio"].add(rid)
    return lanes
```

**Markdown (`_render_markdown`):** the previous flat `## Approved Fix Queue`
listing (one undifferentiated rec list) is **replaced** by the two-lane layout
below. Keep the `(X of Y)` count on the heading, then render the two lanes from
`_by_lane(approved)`. Exact output outline:

```
## Approved Fix Queue (X of Y)
### ChatGPT lane — freshness, structure, direct-answer-first
### Google AIO lane — authority, E-E-A-T, Page-1 rank first
```

- `## Approved Fix Queue (X of Y)` — the existing summary heading, count
  preserved (X = approved, Y = total recs); the flat rec list that used to sit
  directly under it is gone, replaced by the two `###` lane subsections.
- `### ChatGPT lane — freshness, structure, direct-answer-first`
  - one-line honest strategy note (e.g. "Win on a clean, answer-first page and
    genuine community mentions; ChatGPT's citations are largely independent of
    Google rank.")
- `### Google AIO lane — authority, E-E-A-T, Page-1 rank first`
  - one-line honest strategy note (e.g. "AIO summarizes pages that already rank,
    so technical-SEO hygiene + authority are the precursors. Rank, then get
    summarized.")

**Where `both`-tagged recs render — decision: render in BOTH lanes, de-duped by
`id`.** A `both` rec is one `Recommendation`; it appears under *both* the ChatGPT
and Google AIO `###` headers (it is genuinely relevant to each), but the same
`id` is never listed twice *within* a single lane — `_by_lane` de-dupes per lane
by `id`. So across the whole queue a `both` id shows exactly twice (once per
lane), and a single-lane id shows exactly once. (Not chosen: a separate shared
"both" header — rejected so each lane reads as a complete, self-contained
strategy list.)

Each lane lists the same per-rec detail block already used today (id · title,
kind/impact/effort/score, why, snippet). A `both` item carries a small marker in
each lane (e.g. `(also serves Google AIO)` under ChatGPT / `(also serves
ChatGPT)` under Google AIO) so the reader knows it is one fix surfaced in two
lanes, not two separate fixes. An empty lane reads `_No fixes in this lane._` —
never fabricated filler.

**AI prompt (`_render_ai_prompt`):** the same two-lane split, but as plain text
suitable for pasting into ChatGPT/Claude. Add a short LANES section explaining
the two strategies in one sentence each, then enumerate `chatgpt`-lane fixes,
then `google_aio`-lane fixes. Both existing honest caveats MUST survive the lane
rewrite **verbatim** (byte-for-byte; the lane split must not paraphrase or drop
them). The two strings to preserve, exactly:

> Schema, SEO, and accessibility items are crawlability hygiene — they help
> machines parse the page but do NOT guarantee AI citations. The real citation
> levers are brand mentions and Bing rank, measured over a re-run loop.

and the closing line:

> No citation number is guaranteed. We measure the delta.

(Honest-broker: schema/SEO/a11y stay HYGIENE not a citation lever; the refund
guarantees the work, not a number.)

**JSON sidecar (`report`):** the JSON report carries **BOTH** of these, side by
side — they are complementary, not a replacement of one by the other:

1. **`approved_fixes`** — the existing list of full serialized `Recommendation`
   objects, where **each fix now includes an `engine_lane` field** (`"chatgpt"` |
   `"google_aio"` | `"both"`). This rides along automatically because the sidecar
   already serializes the whole `Recommendation` (no schema bump needed *for the
   field itself*).
2. **`fix_lanes`** — a **new** per-lane id index for diff-friendliness, mapping
   each lane to the list of fix ids in it (a `both` id appears in both arrays):

```python
"fix_lanes": {
    "chatgpt":    [r["id"] for r in _by_lane(approved)["chatgpt"]],
    "google_aio": [r["id"] for r in _by_lane(approved)["google_aio"]],
},
```

So a reader can either walk `approved_fixes[*].engine_lane` (per-fix source of
truth) or read `fix_lanes` (the precomputed per-lane id index); both must be
present and consistent.

Bump `snapshot_schema` from `1` to `2` (the JSON contract grew). Confirm
`rescan`/report-diff readers treat unknown/added keys tolerantly (they read
defensively today); a higher `snapshot_schema` is the signal.

### Data shapes (summary)

- `Recommendation.engine_lane: str` ∈ `{"chatgpt","google_aio","both"}`.
- `report["approved_fixes"]: [Recommendation]` — each serialized fix now carries
  an `engine_lane` field (per-fix source of truth).
- `report["fix_lanes"]: {"chatgpt": [str], "google_aio": [str]}` — new per-lane
  id index (fix ids; a `both` id appears in both arrays). Carried *in addition
  to* `approved_fixes`, not instead of it.
- `report["snapshot_schema"]: 2`.

## Acceptance criteria

- [ ] `Recommendation` TypedDict has `engine_lane: str`, documented with the
      3-value vocabulary and the "editorial, not measured" caveat.
- [ ] Every `Recommendation` produced by `recommend()` has an `engine_lane` in
      `{"chatgpt","google_aio","both"}` (no `None`, no other value).
- [ ] Lane is derived deterministically from gap `kind` (mock runs reproducible);
      unknown kind → `both` (never dropped from a lane).
- [ ] Rec **count is unchanged**: exactly one `Recommendation` per gap; no rec is
      duplicated to appear in two lanes. `len(recommendations)` for the canonical
      `example.com` golden case is identical before/after this change.
- [ ] Scores, ordering, ids, titles, impact, effort, snippets are byte-identical
      to pre-change output (the tag is additive). `test_deterministic_in_mock_mode`
      still passes.
- [ ] All four eval metrics still pass on every `GOLDEN_CASE`
      (`citation_precision`, `gap_recall`, `heal_convergence`, `no_fabrication`);
      in particular `no_fabrication` (d) `n_recs >= n_gaps` still holds.
- [ ] `_render_markdown` shows a ChatGPT lane and a Google AIO lane, each with an
      honest one-line strategy note; `both` items are marked as shared, not
      double-counted; empty lanes read as empty, not faked.
- [ ] `_render_ai_prompt` shows the two lanes in pasteable text and keeps the
      existing hygiene/no-guarantee caveats verbatim.
- [ ] JSON sidecar carries `engine_lane` per fix and a `fix_lanes` index;
      `snapshot_schema == 2`.
- [ ] Full pipeline (`186` existing pytest tests + the new module) is green;
      `python -m goblin.eval` gate (`heal-loop converges`,
      `verify strands converge (per-discipline)`) stays green.
- [ ] `graph-keeper` review passed (required gate for any `pipeline/goblin/`
      change).

## Unit-test plan

New module `pipeline/tests/test_recommend_lanes.py` (mirrors the
`tests/test_*` + `goblin.*` import style already in the repo; build `Gap`/
state dicts directly, call the node, assert on returned dict — same shape as
`test_seo_audit.py` / smoke tests). Exact cases:

1. **`test_every_rec_has_valid_lane`** — build a state with one gap of each kind
   (`schema, content, citation, seo, a11y, community`), run `recommend()`,
   assert every rec's `engine_lane ∈ {"chatgpt","google_aio","both"}`.
2. **`test_lane_by_kind_mapping`** — assert the fixed map per kind:
   `seo → google_aio`, `community → chatgpt`,
   `content/citation/schema/a11y → both`. (Pin the editorial contract.)
3. **`test_unknown_kind_defaults_to_both`** — a `Gap` with `kind="weird"` →
   rec `engine_lane == "both"` (defensive default; never dropped from a lane).
4. **`test_lane_for_is_pure_and_deterministic`** — call `_lane_for(gap)` twice on
   the same gap → identical; no exception on a gap missing `detail`.
5. **`test_rec_count_unchanged`** — N gaps in → exactly N recs out (strict 1:1,
   one rec per gap). Assert `len(state["recommendations"]) == len(state["gaps"])`
   (exact equality, not just `>=`); a `both` tag is a view, not a copy, so it
   creates NO extra rec. This strict 1:1 check also guards the
   `no_fabrication` `n_recs >= n_gaps` invariant (equality implies it).
6. **`test_tag_does_not_change_score_or_order`** — run `recommend()` on a fixed
   multi-gap state; assert `[r["id"] for r ...]`, `[r["score"] ...]`,
   `[r["title"] ...]` match a captured pre-change baseline (the tag is additive,
   nothing else moves).
7. **`test_by_lane_both_appears_in_both`** — unit-test `ship_pr._by_lane`: a
   `both`-tagged rec is present in BOTH lane lists; a `chatgpt`-only rec is in
   exactly one. Count of distinct ids across lanes == count of recs (no loss).
8. **`test_markdown_renders_two_lanes`** — run a small full state through
   `_render_markdown`, assert both lane headers and the strategy notes are in the
   output, and that a `both` item's id appears under both headers with the
   "also serves" marker.
9. **`test_ai_prompt_keeps_honest_caveats`** — assert `_render_ai_prompt` output
   still contains BOTH honest caveat strings verbatim (regression guard against
   the lane rewrite stripping or paraphrasing honesty copy). Assert both exact
   substrings are present:
   - the hygiene caveat: `"Schema, SEO, and accessibility items are
     crawlability hygiene — they help machines parse the page but do NOT
     guarantee AI citations. The real citation levers are brand mentions and Bing
     rank, measured over a re-run loop."`
   - the closing line: `"No citation number is guaranteed. We measure the
     delta."`
10. **`test_json_sidecar_has_fix_lanes_and_schema_2`** — run `ship_pr()` (mock),
    load the JSON, assert each `approved_fixes[i]` has `engine_lane`, that
    `fix_lanes` has both keys, and `snapshot_schema == 2`.

Augment `tests/test_smoke.py`:

11. extend `test_recommendations_ranked_desc` (or add `test_recs_lane_tagged`)
    to assert every rec in a real mock run has a valid `engine_lane`.
12. extend `test_report_files_written` to assert the markdown contains both lane
    headers and the JSON has `fix_lanes` + `snapshot_schema == 2`.

Eval gate (must stay green, run after):
`python -m goblin.eval` over `GOLDEN_CASES` — confirms `citation_precision`,
`gap_recall`, `heal_convergence`, `no_fabrication` all pass post-change. The
key risk is `no_fabrication` (d) (`n_recs >= n_gaps`): the "one rec per gap, lane
is a view not a copy" rule keeps it satisfied — assert this explicitly in
case 5.

**UI / Playwright / screenshot:** This change is pipeline-only. The two "lanes"
are sections of a **Markdown/JSON/text report artifact**, not a web page — there
is no browser surface to screenshot here, so no Playwright run is in scope. If a
later spec surfaces these lanes on the marketing site (`web/`), that work — and
its Playwright + axe screenshots — belongs to that spec, not this one.

> CRT/grain headless-hang caveat (carried forward for the future web spec, not
> needed here): the site's CRT/grain visual effects can hang headless Chromium
> in Playwright screenshot runs. The deterministic fallback is to assert on the
> rendered DOM / serialized report text (as this spec's tests do) and to disable
> the CRT/grain layer (or use the reduced-motion path) before any screenshot,
> rather than block CI on a hanging headless render.

## Prerequisites / blocked-on

- **None blocking.** Everything is implementable and testable fully offline in
  mock mode — no Supabase, no API keys, no `doctl`, no deploy, no live network.
  The gap `kind` is already present in deterministic mock state.
- **Gate (not a blocker, a requirement):** `graph-keeper` must review the
  `pipeline/goblin/` diff before merge.
- **Sequencing:** independent of other backlog items; can land standalone. If a
  "surface lanes on the marketing site" spec is later authored, it depends on
  THIS spec (it consumes `engine_lane` / `fix_lanes`), not vice-versa.

## Honest-broker notes

- **Lanes are editorial routing, never a promise.** `engine_lane` says which
  engine a *kind* of fix tends to help; it is NOT a measured citation outcome
  and the copy must never imply "do this → get cited on ChatGPT/AIO."
- **No fabricated metrics.** The ~87% / ~80% rationale figures are third-party
  industry context motivating the split. They must NOT be printed as Prompt
  Goblin findings. Keep them in code comments / this spec, or attribute to source
  if ever surfaced — never as "we measured."
- **Schema + llms.txt stay HYGIENE.** `schema` is tagged `both` because it
  unblocks crawlers for either engine, but the rendered strategy note must keep
  the existing "hygiene, not a citation lever" framing. Do not let the lane label
  reframe schema/llms.txt as a citation lever for ChatGPT or AIO.
- **WAF / unreadable / JS-rendered sites are never scored 0.** This change does
  not touch scoring or the SPA/WAF blind-spot flagging; it only tags recs that
  already exist. A blocked/unreadable site that produced few gaps simply yields
  few lane entries — the blind-spot flag elsewhere is untouched.
- **Never tell a service/gov site it's "missing Product schema."** Lane tagging
  does not change which schema types are recommended; it inherits the existing
  gap detection, which already respects Service/Offer/OfferCatalog. No new schema
  assertions are introduced.
- **Nothing auto-deploys / auto-sends.** Recs stay human-gated through
  `human_review`; community items stay human-post-only with disclosure required.
  This change adds a label; it does not change approval, posting, or deploy.
- **Mock/demo reads as illustrative.** Mock-mode reports remain labelled `mock`
  (`no_fabrication` (a)); the lane sections inherit that labelling — never shown
  as a real, live result.
- **The refund guarantees the work, not a number.** Lane copy must not promise a
  citation count per lane; keep the "no citation number is guaranteed. We measure
  the delta." closing line.

## Out of scope

- Surfacing the two lanes anywhere on the marketing site (`web/`) or in the scan
  functions (`functions/`) — separate spec, separate gate (integrity-reviewer for
  prospect-facing copy).
- Per-engine *measurement* of citation movement by lane (that is the existing
  `visibility_by_engine` measurement loop, not this tagging task).
- Changing scoring, gap detection, the `kind` taxonomy, snippet generation, or
  the heal/verify loops.
- Adding an LLM call to classify lanes (deterministic kind-map only; no new
  network dependency or node).
- Splitting a single gap into two recs to live in two lanes (explicitly avoided —
  would break the `n_recs >= n_gaps` eval invariant and inflate the fix count).
- A new gap `kind` for freshness/E-E-A-T (the lane is derived from existing
  kinds; introducing kinds is a separate detection task).
