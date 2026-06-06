# Topical-authority proxy (`topical_depth`) in `seo_audit`

## Goal

Topical authority is the single strongest citation predictor in our internal
notes (premise: ~r=0.41 against citation outcomes), while the classic backlink/DA
metrics we *don't* measure explain <4% of variance. Today the pipeline measures
**zero** of it. This spec adds an **offline, deterministic, structural proxy** for
topical depth — computed from the HTML we already fetch once — and folds it into
recommendation priority.

The proxy emits one of `topical_depth: "low" | "medium" | "high"` plus the raw
sub-signals, and nudges (never dictates) the rank of content/citation fixes. It is
labelled everywhere as a **STRUCTURAL SIGNAL**, never a citation guarantee:
structure (entity coverage, heading depth, page focus) is *correlated with* sites
that get cited; it does not *cause* a citation. Real citation levers remain brand
mentions + Bing rank, measured over a re-run loop — this proxy never claims
otherwise.

Critically, this is **not** a new graph node. The depth computation rides on the
HTML `seo_audit` already has, mirroring how `stack_detect` consumes the same
cached `client_html`. Keeping it in (or beside) `seo_audit` avoids a third fetch
and a new spine edge.

## Files touched (exact paths + which repo)

All paths are in the **`pipeline`** repo (its own git repo, toplevel
`C:\Users\atpat\Documents\promptgoblin\pipeline`; it lives *under* the
promptgoblin working tree but is a separate repository — commit/PR there).

| Path | Repo | Change |
|---|---|---|
| `pipeline/goblin/nodes/seo_audit.py` | pipeline | Add pure `analyze_topical_depth(html) -> dict`; call it from `seo_audit()`; emit `topical_depth` (+ sub-signals) on the returned state update. Add an honest "could not measure" path when HTML is absent/SPA/blocked. |
| `pipeline/goblin/state.py` | pipeline | Add three optional `VisibilityState` keys: `topical_depth: str`, `topical_signals: dict`, `topical_note: str`. Document them in the docstring block (the `seo_audit ->` line). No change to `new_state()` (keys are optional, `total=False`). |
| `pipeline/goblin/nodes/recommend.py` | pipeline | Read `state["topical_depth"]`; apply a small, **bounded** priority multiplier to `content` + `citation` recommendations only (the kinds topical depth actually informs). Append an honest one-line rationale tag. Never reweight `seo`/`a11y`/`schema`. |
| `pipeline/tests/test_seo_audit.py` | pipeline | Add the topical-depth unit cases (see Unit-test plan). |
| `pipeline/tests/test_recommend.py` | pipeline | New file (none exists today) covering the bounded reweight + the no-signal passthrough. |
| `pipeline/requirements.txt` | pipeline | **Comment only** — document that the optional keyed NER path needs `spacy` (or an API key) and that the default path uses the already-present `beautifulsoup4`. No new hard dependency. |

Explicitly **not** touched: `graph.py` (no new node, no new edge), `ship_pr.py`
(report rendering can pick up `topical_depth` in a follow-up spec — out of scope
here), `_fetch.py` (reuses the existing fetch + cache contract).

## Design

### 1. Pure core: `analyze_topical_depth(html: str) -> dict`

Lives in `seo_audit.py` alongside `analyze_seo`, `_analyze_head`,
`_analyze_weight` — same "pure function, HTML in / dict out, unit-testable
offline, no network" pattern the module already established. Regex/parse-only,
deterministic, no randomness, no clock, no env reads.

Returns the shape (named to match the `stack_detect` precedent — `confidence`,
`signals`, `note`):

```python
{
  "depth": "low" | "medium" | "high",
  "score": float,                 # 0.0..1.0 composite, rounded to 3 dp
  "signals": {
    "connected_entities": int,    # distinct capitalized multi-token entities reused >=2x
    "heading_count": int,         # <h2>..<h4> count (h1 handled by analyze_seo)
    "heading_depth_ratio": float, # headings per ~500 visible-text words
    "visible_words": int,
    "page_type": "single_topic" | "hub" | "thin" | "unknown",
  },
  "method": "structural-offline" | "ner-keyed",  # honest provenance
  "note": str,                    # human-readable, STRUCTURAL-SIGNAL framed
}
```

**Sub-signal 1 — connected named-entity count (offline default).**
No paid NER. Heuristic, deterministic:
- Extract visible text (strip `<script>/<style>/<template>`, drop tags). Reuse the
  same body-text extraction we add for word-count; if `beautifulsoup4` is present
  use `BeautifulSoup(...).get_text(" ")` (already a dependency — see
  `schema_audit._extract_jsonld_types`), else a regex tag-strip fallback so the
  function never hard-fails on a bare interpreter (mirrors the dotenv/import-guard
  ethos in `config.py`).
- Candidate entities = capitalized multi-token spans (e.g. `Prompt Goblin`,
  `Core Web Vitals`) and Title-Case tokens, excluding a stoplist of sentence-start
  noise and nav chrome.
- **"Connected"** = a candidate that appears **>= 2 times** across the page (a topic
  the page actually develops, not a one-off mention). Count distinct connected
  entities. This is the cheap structural stand-in for "the page covers an entity
  cluster", which is what topical authority looks like in markup.

**Sub-signal 2 — heading-to-content depth ratio.**
- `heading_count` = `<h2>`..`<h4>` (h1 is already an `analyze_seo` signal; don't
  double-count). Add compiled regexes next to the existing `_RE_H1`.
- `visible_words` = whitespace-token count of the extracted visible text.
- `heading_depth_ratio = heading_count / max(1, visible_words / 500)`.
  A well-developed long page has several section headings per ~500 words; a thin
  page has ~0. Clamp to a sane max so a heading-spam page can't game it.

**Sub-signal 3 — single-topic-page vs hub heuristic.**
- `hub` if the page is dominated by links to other pages relative to prose:
  `link_count / max(1, visible_words)` above a threshold AND low
  `heading_depth_ratio` (a directory/landing/hub, not a developed article).
- `single_topic` if it has real prose (`visible_words` over a floor), a healthy
  `heading_depth_ratio`, and a connected-entity cluster — the shape of a page that
  *develops one subject in depth*.
- `thin` if `visible_words` is below the prose floor.
- `unknown` otherwise.
Hub vs single-topic matters because topical authority is built from **deep
single-topic pages linked under a coherent hub** — a homepage that's all links
scores structurally shallow even if the site overall is authoritative; the note
says exactly that so we never mislabel a legitimate hub as "bad".

**Composite -> band.** `score` is a fixed, documented weighted blend of the three
normalized sub-signals (entities, depth ratio, page-type bonus). Bands by fixed
thresholds (e.g. `score < 0.34 -> low`, `< 0.67 -> medium`, else `high`) — pure
constants, no learned weights (we have no labelled training set in-repo; the
r=0.41 figure is an internal research *premise*, not a fitted model — the spec
must not pretend otherwise). Thresholds live as module constants for easy tuning.

### 2. Optional keyed NER path (degrade honestly)

Default path is `method="structural-offline"` and needs **no key, no new
dependency**. If (and only if) a real NER backend is configured — gated exactly
like `gemini_enabled` / `render_fallback` in `config.py` (a new
`Settings.topical_ner` flag from `GOBLIN_TOPICAL_NER`, default OFF) AND the
backend import succeeds — `connected_entities` is recomputed via real NER and
`method` flips to `"ner-keyed"`. Any failure (flag off, import missing, backend
error) silently falls back to the offline heuristic and keeps
`method="structural-offline"`. No fabricated upgrade: the report can show which
method actually ran. This mirrors the existing "present-but-unusable key must not
masquerade as live" rule (the Gemini guard).

### 3. Wiring into `seo_audit()`

`seo_audit()` already returns `{"gaps", "log", (client_html, client_fetch_note)}`.
Extend it:
- After computing `findings`, call `analyze_topical_depth(html)` when `html` is
  truthy.
- Add `topical_depth`, `topical_signals`, `topical_note` to the returned `out`.
- **Honest no-measure path:** when `html` is falsy (fetch failed / WAF block) OR
  the page is SPA-ish (reuse `schema_audit._looks_like_spa`), set
  `topical_depth="unknown"`, `method`-style `note` that says *"could not measure
  topical depth — page unreadable / JS-rendered (static-fetch blind spot)"*, and
  **do not** emit a gap or a 0. This is the core honest-broker rule: an
  unreadable/SPA/blocked page is **never scored 0** — it's flagged as a blind
  spot (same posture as the existing `_LIMITS` block and the "could not read" SEO
  gap).
- Mock mode: the existing `_MOCK_HTML` thin fixture deterministically yields
  `topical_depth="thin"`/`"low"` — a stable value for the eval gate. Keep it that
  way (no network, zero keys).

A `topical_depth` **gap** (`Gap(kind="seo", ...)`) is emitted **only** for the
`low`+readable case, at **low severity (2)**, worded as structural advice
("Page develops few connected entities and shallow heading depth — a deeper,
single-topic treatment is a structural signal correlated with citations, not a
guarantee."). `medium`/`high`/`unknown` emit no gap. This keeps the existing
seo-gap contract intact and avoids nagging already-deep pages.

### 4. Wiring into `recommend()`

`recommend()` currently computes
`score = (impact**2 / effort) * (severity/5.0)`. Add a **bounded** topical
multiplier read from `state.get("topical_depth")`:

```python
_TOPICAL_MULT = {"low": 1.15, "medium": 1.0, "high": 0.92}  # bounded, documented
# applied ONLY to kind in {"content", "citation"} — the kinds depth informs.
```

- `low` topical depth -> slightly **raise** content/citation fixes (the page needs
  depth most).
- `high` -> slightly **lower** them (depth is already there; spend effort
  elsewhere).
- `unknown`/`medium`/absent -> multiplier `1.0` (true no-op; backward-compatible
  for older states with no `topical_depth` key — `state.get(...)` returns `None`).
- Multiplier is clamped to `[0.9, 1.2]` so it can **re-order ties, never override**
  a genuinely higher-severity fix. Append `" (topical_depth=low)"`-style tag to
  the rec `rationale` only when the multiplier != 1.0, so the human reviewer sees
  why the order shifted. Never silently reweight.
- `seo`/`a11y`/`schema` recs are untouched (depth is a content/citation signal,
  not a hygiene signal).

### Naming / pattern conformance
- Pure-core fn named `analyze_topical_depth` (matches `analyze_seo`).
- Module constants `_RE_H2_H4`, `_RE_LINK`, `_TOPICAL_*`, `_DEPTH_THRESHOLDS`
  (leading-underscore, compiled-at-import — matches `_RE_*` in the module).
- Dict keys `confidence`-style (`depth`, `signals`, `note`, `method`) match
  `stack_detect`'s result shape.
- Settings flag `topical_ner` from `GOBLIN_TOPICAL_NER` matches the
  `gemini_enabled`/`render_fallback` env-flag convention.

## Acceptance criteria

- [ ] `analyze_topical_depth(html)` is pure, deterministic, network-free; same
      HTML in -> identical dict out across runs.
- [ ] Returns `depth in {"low","medium","high"}` for readable pages and
      `"unknown"` for empty/SPA input.
- [ ] Emits the three sub-signals (`connected_entities`, `heading_depth_ratio`,
      `page_type`) with the documented shapes.
- [ ] A deep, single-topic, multi-heading page scores `high`; the thin
      `_MOCK_HTML`/`_HTML_THIN` fixture scores `low`/`thin`; a link-dominated page
      classifies `hub`.
- [ ] `seo_audit()` adds `topical_depth`/`topical_signals`/`topical_note` to its
      update and **still** returns the existing `gaps`/`log`/`client_html` keys
      unchanged (no regression in existing `test_seo_audit.py`).
- [ ] Unreadable / SPA / WAF-blocked page -> `topical_depth="unknown"`, an honest
      "could not measure / static-fetch blind spot" note, **no gap, never a 0**.
- [ ] A topical gap is emitted **only** for `low`+readable, at severity 2, worded
      as a STRUCTURAL SIGNAL (contains "not a guarantee" / "correlated").
- [ ] `recommend()` multiplier is bounded to `[0.9, 1.2]`, applied only to
      `content`/`citation`, no-ops on missing/`medium`/`unknown`, and tags the
      rationale when it fires.
- [ ] Optional NER path is OFF by default; with the flag off the method is always
      `"structural-offline"`; a missing/broken backend degrades silently without
      changing default output.
- [ ] No new **hard** dependency in `requirements.txt`; `--mock` still runs on the
      core deps with zero keys.
- [ ] Full suite green: existing 264 pytest tests + the new cases; the eval gate
      (`heal-loop converges` + `verify strands converge (per-discipline)` in
      `tests/test_eval.py`) stays green and byte-stable in mock mode.
- [ ] `graph-keeper` review passed (this changes `pipeline/goblin/` nodes).

## Unit-test plan

Exact cases (pytest, offline, no network — mirror `test_seo_audit.py` /
`test_stack_detect.py` style: small inline HTML fixtures, monkeypatch the shared
fetch for the live path).

**`tests/test_seo_audit.py` (extend):**
1. `test_topical_deep_page_scores_high` — inline HTML: long prose, 4+ `<h2>/<h3>`,
   one repeated multi-token entity cluster -> `depth == "high"`,
   `page_type == "single_topic"`, `connected_entities >= 2`.
2. `test_topical_thin_page_scores_low` — reuse `_HTML_THIN` -> `depth == "low"`,
   `page_type == "thin"`.
3. `test_topical_hub_page_classified_hub` — many `<a href>` links, little prose ->
   `page_type == "hub"` and the note explains hub vs single-topic (no "bad page"
   wording).
4. `test_topical_depth_is_deterministic` — call twice on the same HTML, assert dict
   equality (guards against set-ordering / dict-iteration nondeterminism feeding
   the eval gate).
5. `test_topical_unreadable_is_unknown_never_zero` — `analyze_topical_depth("")`
   and an SPA shell (`<div id="root"></div>`) -> `depth == "unknown"`,
   `score == 0.0` is **not** treated as a finding; note mentions "blind spot".
6. `test_seo_audit_emits_topical_keys` — mock-mode `seo_audit()` update contains
   `topical_depth`/`topical_signals`/`topical_note`; existing
   `gaps`/`log`/`client_html` assertions still hold.
7. `test_topical_gap_only_when_low_and_readable` — readable low page emits exactly
   one extra `kind=="seo"` gap whose detail contains "not a guarantee"; a `high`
   page emits none; an `unknown` (unreadable) page emits none.
8. `test_topical_note_is_honest` — note for any band never contains the words
   "guarantee", "will be cited", "ranks you"; low-band note contains "structural"
   and "correlated".
9. `test_topical_ner_flag_off_is_structural` — with `Settings(topical_ner=False)`
   (default), `method == "structural-offline"`; assert a deliberately broken NER
   import path (monkeypatched to raise) still returns the offline result with
   `method == "structural-offline"` (degrade-honestly).

**`tests/test_recommend.py` (new file):**
10. `test_topical_low_boosts_content_citation` — two states identical except
    `topical_depth` `"medium"` vs `"low"`; the content/citation rec `score` is
    strictly higher under `"low"`, and `seo`/`a11y` rec scores are **unchanged**.
11. `test_topical_high_dampens_content` — `"high"` lowers content/citation score
    vs `"medium"` (within the clamp).
12. `test_topical_absent_is_noop` — a state with **no** `topical_depth` key yields
    byte-identical recommendations to the current behavior (backward-compat /
    older-state safety).
13. `test_topical_multiplier_is_bounded` — construct a case where an unbounded
    multiplier *would* flip a high-severity seo fix below a content fix; assert the
    clamp keeps the higher-severity fix on top (multiplier re-orders ties only).
14. `test_topical_tag_appended_when_fired` — when the multiplier != 1.0 the rec
    `rationale` contains `"topical_depth="`; when 1.0 it does not.

**Eval-gate regression (existing `tests/test_eval.py`):** run the full
`--mock` graph and assert the heal-loop + per-discipline verify-strand
convergence still passes and report output is byte-stable. Topical depth in mock
mode is a fixed value, so it must not perturb the deterministic eval.

**UI / Playwright / screenshot:** **N/A for this spec** — `topical_depth` is a
pipeline state field with no rendered UI surface in this change (report rendering
in `ship_pr` is out of scope). No Playwright run, no screenshots, so the
**CRT/grain headless-hang caveat does not bite here**. For the record, if a later
spec surfaces this in the marketing-site report UI, that work must use the
deterministic eval/inspect fallback (DOM/text assertions via
`mcp__Claude_Preview__preview_inspect`) instead of CRT/grain animated
screenshots, which hang headless Chromium — Playwright pixel-screenshots of the
animated terminal are the known hang and must be avoided there.

## Prerequisites / blocked-on

- **None blocking.** The default path is offline, deterministic, key-free, and
  uses only already-present deps (`beautifulsoup4`, stdlib `re`). It is fully
  implementable **and** testable today with zero owner resources — no Supabase, no
  API key, no `doctl`, no deploy.
- **Optional, non-blocking:** the keyed NER upgrade (`spacy` model or a NER API
  key) is a *future enhancement* behind `GOBLIN_TOPICAL_NER` (default OFF). Its
  absence does not block this spec — the offline heuristic ships and is tested as
  the real default.
- **Gate:** `graph-keeper` review required before merge (touches
  `pipeline/goblin/` nodes — `seo_audit.py`, `recommend.py`, `state.py`).
- No other spec is a hard dependency. A follow-up "surface topical_depth in the
  report/ship_pr + marketing site" spec is the natural next step but is out of
  scope here.

## Honest-broker notes

- **Structural signal, never a citation guarantee.** Every emitted note/gap/tag
  frames `topical_depth` as *correlated structure*, not a lever that earns
  citations. The r=0.41 premise is an internal research correlation, not a fitted
  model and not a published number — the spec must never surface "r=0.41" or any
  un-measured figure to a prospect, and never promise a citation from depth.
- **Schema + llms.txt stay hygiene.** This feature does not change that; it does
  not let depth (or anything structural) be sold as a guaranteed citation lever.
- **Unreadable / SPA / WAF-blocked = never 0.** The no-measure path returns
  `"unknown"` + an explicit static-fetch-blind-spot note, never a 0 or a fake
  "shallow" verdict (the rule we caught on our own SPA site).
- **Never tell a service/gov site it's "missing Product"** — unaffected here (no
  schema logic touched), but the topical-gap copy is generic ("develop the topic
  in depth") and never prescribes commerce structure.
- **Hub pages are not penalized as "bad."** A legitimate hub/homepage that's
  link-dense is *classified* `hub` with a neutral, accurate note — not scored as a
  failing page. Topical authority is a *site-shape* story (deep pages under a hub),
  and the copy says so.
- **Nothing auto-deploys / auto-sends.** This only changes recommendation
  *ordering* and adds a state field; every fix still flows through `human_review`
  and is human-gated. The multiplier is bounded so it can never silently override
  a reviewer's severity ordering.
- **Mock/demo reads as illustrative.** Mock-mode topical depth is a fixed fixture
  value, clearly a deterministic test value, never reported as a real measurement
  of a real client.
- **Refund guarantees the work, not a number.** Nothing here attaches a promised
  topical-depth or citation number to the engagement.

## Out of scope

- Surfacing `topical_depth` in `ship_pr` report markdown/JSON or on the marketing
  site (follow-up spec).
- The keyed NER backend implementation itself (spacy model wiring / NER API
  client) — this spec only defines the OFF-by-default flag + the degrade-honestly
  contract.
- Any cross-page / whole-site crawl of topical authority (this proxy is
  single-page, on the one HTML we already fetch — multi-page topical-cluster
  analysis is a separate, larger effort).
- Fitting real weights/thresholds from a labelled citation dataset (we have none
  in-repo; thresholds are documented constants, explicitly not a trained model).
- Changing `_fetch.py`, the graph spine, or adding a new node.
- Browser-rendered topical analysis (the render fallback may *feed* better HTML in
  when enabled, but no new browser logic is added here).
