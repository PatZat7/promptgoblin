# third-party-platform-presence — ICP-keyed platform-presence audit

A new audit node, `platforms_audit`, that maps the client's ICP segment to the
third-party review/listing platforms answer engines actually lean on for that
segment (B2B SaaS → G2 / Capterra / TrustRadius / Gartner Peer Insights;
finance → NerdWallet / comparison aggregators; e-commerce → Amazon brand
presence), checks whether the client appears to have a presence on the relevant
tier, and flags absence as a HIGH-severity citation gap so `recommend` folds it
into the ranked fix queue.

Presence is an **inference, never asserted fact** — every finding carries a
confidence and a verify note, exactly mirroring how `recon` frames
auto-identified competitors. The ICP segment is itself inferred by `recon` into a
new `company_profile.icp_segment` field that this node keys off.

---

## Goal

- Give the pipeline a real, segment-aware citation lever beyond schema/community:
  whether the client is *present* on the high-citation third-party platforms for
  its buyer category, since those listings (G2, Capterra, NerdWallet, Amazon,
  etc.) are where answer engines source "best X" / comparison answers.
- Infer an `icp_segment` in `recon` (keyless/HTML-derived in mock/offline mode;
  live-research-derived when a provider key is present) and write it onto
  `company_profile.icp_segment` with a confidence + source, so `platforms_audit`
  (and any future node) can branch on it.
- Emit `kind="citation"` HIGH-severity gaps for missing presence on the relevant
  platform tier, *clearly framed as unverified inferences*, so they flow through
  the existing `recommend` → `human_review` → `ship_pr` machinery unchanged.
- Stay 100% honest-broker: presence checks are inferences with a verify note;
  nothing is scored 0 for an unreadable/blocked site; nothing auto-deploys or
  auto-contacts a platform; mock results read as illustrative.

---

## Files touched (exact paths + which repo)

All paths in the **pipeline** repo (sibling git repo at
`C:\Users\atpat\Documents\promptgoblin\pipeline`, root `pipeline/`):

| Path | Change |
|---|---|
| `pipeline/goblin/nodes/platforms_audit.py` | **NEW** — the node + the ICP→platform catalog + presence-inference helpers. |
| `pipeline/goblin/nodes/recon.py` | infer `icp_segment` and add it to the `company_profile` dict (new keys: `icp_segment`, `icp_confidence`, `icp_source`). |
| `pipeline/goblin/nodes/__init__.py` | export `platforms_audit` (import + `__all__`). |
| `pipeline/goblin/graph.py` | register `platforms_audit` and splice it into `_NODE_SEQUENCE` (after `community_audit`, before `recommend`). |
| `pipeline/goblin/state.py` | document the new `company_profile.icp_segment` keys in the `company_profile` docstring; (optional) add a `PlatformPresence` `TypedDict` for the structured finding and a `platform_presence: list[PlatformPresence]` channel + default it in `new_state`. |
| `pipeline/tests/test_platforms_audit.py` | **NEW** — unit tests for the catalog, ICP routing, presence inference, gap emission, and the honesty invariants. |
| `pipeline/tests/test_recon.py` | extend — assert `recon` emits `icp_segment` + confidence + source on `company_profile`. |
| `pipeline/goblin/eval/cases.py` | extend the golden expectations so the existing case(s) tolerate the new node (no new mandatory gap kind unless the mock fixture is set up to deterministically miss a platform; see Honest-broker notes). |

No web/functions/supabase files are touched. This is a pipeline-only change.

---

## Design

### 1. `recon` infers `icp_segment`

`recon` already derives `topic` + `summary` from the homepage shell (keyless) or
a live research call. Add an ICP-segment classification that reuses those same
signals — **no extra fetch, no extra network call**.

New module-level constant + helper in `recon.py`:

```python
# Coarse ICP-segment keyword priors. Ordered: first match wins. These are
# inference priors over the homepage topic/summary, NOT asserted classifications.
_ICP_SEGMENTS: list[tuple[str, tuple[str, ...]]] = [
    ("b2b_saas",   ("saas", "platform", "software", "api", "dashboard",
                    "workflow", "crm", "analytics", "devops", "b2b")),
    ("finance",    ("bank", "loan", "mortgage", "credit", "insurance",
                    "invest", "fintech", "payment", "lending", "tax")),
    ("ecommerce",  ("shop", "store", "buy", "cart", "product", "dtc",
                    "retail", "shopify", "ecommerce", "checkout")),
    ("local_service", ("clinic", "dentist", "law", "agency", "repair",
                       "plumb", "salon", "near me", "appointment")),
    ("gov",        ("gov", "agency", "department", "municipal", "public")),
]
_ICP_DEFAULT = "general"


def _infer_icp_segment(topic: str, summary: str, domain: str) -> tuple[str, str]:
    """Infer (segment, confidence) from already-derived recon signals.

    Pure function over text recon already has — never fetches, never raises.
    Returns ("general", "low") when nothing matches (honest "unknown", not a guess).
    Gov TLDs short-circuit to ("gov", "high") via schema_audit.is_gov_domain.
    """
```

- Gov reuse: call `schema_audit.is_gov_domain(domain)` (already exists) so a
  `.gov`/`.mil` host is classed `gov` with `high` confidence regardless of copy.
- Confidence: `"high"` for a gov-TLD short-circuit; `"medium"` when ≥2 keyword
  hits agree on one segment; `"low"` for a single weak hit or the `general`
  default. The **source** mirrors recon's existing competitor-source vocabulary:
  `"research (live)"` when the live research text drove it, `"html (inferred)"`
  when derived from the homepage shell, `"mock (illustrative)"` in mock mode,
  `"gov TLD"` for the short-circuit, `"none (no signal)"` for the default.
- In mock mode `recon` returns a deterministic illustrative segment
  (`"b2b_saas"`, `confidence="low"`, `source="mock (illustrative)"`) so the
  offline demo/eval is coherent with the existing mock competitor pair.

`recon`'s `profile` dict gains three keys (added next to the existing
`competitor_confidence` / `competitor_source`):

```python
profile["icp_segment"]    = icp_segment      # "b2b_saas"|"finance"|"ecommerce"|"local_service"|"gov"|"general"
profile["icp_confidence"] = icp_conf         # "high"|"medium"|"low"
profile["icp_source"]     = icp_src          # honest provenance string
```

The existing `recon` log line is extended with `· icp=<segment> (<conf>)`.

### 2. `platforms_audit` node

New file `pipeline/goblin/nodes/platforms_audit.py`. Signature matches every
other node: `def platforms_audit(state, *, settings: Settings | None = None) -> dict`.

**ICP → platform-tier catalog** (research-grounded coarse priors, the same style
as `community_audit._PLATFORMS`; `citation_weight` 1 = strongest lever):

```python
# segment -> ordered list of the third-party platforms answer engines lean on
# for that buyer category. citation_weight: lower = stronger citation lever.
# These are public-study priors, NOT asserted client metrics.
_PLATFORM_TIERS: dict[str, list[dict[str, object]]] = {
    "b2b_saas": [
        {"platform": "g2",                  "citation_weight": 1, "host": "g2.com",            "why": "..."},
        {"platform": "capterra",            "citation_weight": 2, "host": "capterra.com",      "why": "..."},
        {"platform": "trustradius",         "citation_weight": 2, "host": "trustradius.com",   "why": "..."},
        {"platform": "gartner_peerinsights","citation_weight": 2, "host": "gartner.com",       "why": "..."},
    ],
    "finance": [
        {"platform": "nerdwallet",          "citation_weight": 1, "host": "nerdwallet.com",    "why": "..."},
        {"platform": "bankrate",            "citation_weight": 2, "host": "bankrate.com",      "why": "..."},
        {"platform": "investopedia",        "citation_weight": 2, "host": "investopedia.com",  "why": "..."},
    ],
    "ecommerce": [
        {"platform": "amazon",              "citation_weight": 1, "host": "amazon.com",        "why": "Amazon brand/product presence is the dominant commerce citation surface."},
        {"platform": "trustpilot",          "citation_weight": 2, "host": "trustpilot.com",    "why": "..."},
    ],
    # local_service / gov / general -> [] (no third-party review tier applies;
    # see Honest-broker notes: a service/gov site is NOT told it's missing a
    # commercial-review listing).
}
```

`local_service`, `gov`, and `general` map to an **empty tier** → the node emits
**no presence gap** and logs an honest "no third-party review tier applies for
this segment" line. (Directly parallels schema_audit never telling a service/gov
site it's "missing Product schema".)

**Presence inference** (`_infer_presence`): the honest core. Presence is checked
by *signal*, never asserted:

- **Live signal (best effort, off by default in tests):** reuse the citations
  already in `state["citations"]` from the `retrieve` step. If the client domain
  is cited *on the same surface as* a platform host (i.e. a citation whose
  `domain` endswith the platform `host`) for any buyer query, that's a weak
  positive presence signal. This needs **no new network call** — it reads state.
- **Live optional fetch (guarded, `pragma: no cover`):** a future live mode can
  probe `https://<host>/.../<brand>` for a listing; the stub falls back to the
  state-signal path so the node is fully testable offline. Any HTTP-blocked /
  unreadable probe → `presence="unknown"` (NEVER `present=False` scored as a
  clean miss — the blind-spot rule).
- **Result per platform** is one of: `"present"` (signal found),
  `"absent"` (no signal AND the segment-tier platform is a known high-citation
  surface), or `"unknown"` (could not determine — blocked/SPA/no signal in a way
  we can't disambiguate). Only `"absent"` produces a gap; `"unknown"` produces a
  *verify note*, not a gap.

**`PlatformPresence` shape** (new `TypedDict` in `state.py`, or a plain dict
documented inline — prefer the TypedDict to match `CommunityOpportunity`):

```python
class PlatformPresence(TypedDict):
    platform: str            # "g2" | "capterra" | "nerdwallet" | "amazon" | ...
    host: str                # canonical host, e.g. "g2.com"
    segment: str             # the icp_segment this tier belongs to
    presence: str            # "present" | "absent" | "unknown"
    confidence: str          # "low" | "medium" | "high"  (inference confidence)
    citation_weight: int     # 1 = strongest lever
    why: str                 # why this platform matters for AI citations
    verify_note: str         # the exact "this is an inference — verify" sentence
    severity: int            # 1..5 (absent on a weight-1 platform -> 4/HIGH)
```

**Gap emission:** for each `presence == "absent"` platform, append a
`Gap(kind="citation", ...)` so `recommend` ranks it with the existing
citation effort/impact weights (no change to `recommend` needed). Severity:
`5 - citation_weight` clamped to `[1,5]` → weight-1 platforms (G2, NerdWallet,
Amazon) = **4 (HIGH)**, weight-2 = 3. The `detail` string **must** carry the
verify framing verbatim, e.g.:

> `Inferred absence from G2 (g2.com), a top AI-citation surface for B2B SaaS
> 'best X' / comparison answers. INFERENCE (confidence: low) — verify the
> client has no G2 listing before relying on this. Earn a presence: claim/build
> the listing + gather verified reviews. (Listing presence is a real citation
> lever; schema/llms.txt are hygiene, not levers.)`

`competitors` on the gap is left `[]` (we don't fabricate which competitor wins
the listing unless `state["citations"]` actually shows a competitor cited on that
host — in which case we may populate it from real data).

**Node return:** `{"platform_presence": [...], "gaps": gaps, "log": log}` —
exactly the `community_audit` shape (append to `state["gaps"]`, append a log
line, plus the new structured channel for the report/UI).

**Mock mode:** deterministic illustrative output keyed off the mock
`icp_segment="b2b_saas"`: G2 inferred `absent` (low confidence), the rest
`unknown`, so the offline demo always shows exactly one illustrative HIGH gap +
clearly-illustrative unknowns. Logged as `[mock fixture (illustrative)]`.

### 3. Graph wiring

In `graph.py`, add `("platforms_audit", nodes.platforms_audit)` to
`_NODE_SEQUENCE` **between** `("community_audit", ...)` and
`("recommend", ...)`. Because `platforms_audit` is a plain spine node (not a
splice point), the existing `zip`-based linear-edge builder and the fallback
driver wire it automatically — no router or conditional-edge change. Update the
module docstring's wiring diagram + `nodes/__init__.py` docstring order list.

### 4. State

- Extend the `company_profile` docstring in `state.py` to document
  `icp_segment` / `icp_confidence` / `icp_source`.
- Add `PlatformPresence` TypedDict + `platform_presence: list[PlatformPresence]`
  to `VisibilityState`, and default `platform_presence=[]` in `new_state`.

---

## Acceptance criteria

- [ ] `recon` returns `company_profile["icp_segment"]` (one of the documented
      enum values) plus `icp_confidence` and `icp_source` on every path
      (mock, keyless-HTML, live).
- [ ] `recon` mock mode is deterministic: `icp_segment="b2b_saas"`,
      `icp_confidence="low"`, `icp_source="mock (illustrative)"`.
- [ ] A `.gov`/`.mil` domain is classed `icp_segment="gov"` with `high`
      confidence regardless of homepage copy (reuses `schema_audit.is_gov_domain`).
- [ ] `platforms_audit` is registered in `graph.py` `_NODE_SEQUENCE` between
      `community_audit` and `recommend`, and runs in both the LangGraph and
      fallback engines (covered by an end-to-end mock run).
- [ ] For `icp_segment="b2b_saas"`, the node consults the G2/Capterra/
      TrustRadius/Gartner tier; for `finance`, the NerdWallet tier; for
      `ecommerce`, the Amazon tier.
- [ ] `local_service`, `gov`, and `general` segments emit **zero** presence gaps
      and an honest "no third-party review tier applies" log line.
- [ ] Every `presence == "absent"` finding emits a `Gap(kind="citation")` whose
      `severity` is 4 for a `citation_weight==1` platform (HIGH), and whose
      `detail` contains the words "INFERENCE" and "verify".
- [ ] No finding is ever `present`/`absent` asserted as fact: every
      `PlatformPresence` carries a non-empty `verify_note`, and `unknown`
      findings produce a verify note but **no gap**.
- [ ] A blocked/unreadable/SPA presence probe yields `presence="unknown"`,
      never `"absent"` and never a 0/clean pass (blind-spot rule).
- [ ] The new gaps flow through `recommend` unchanged (they are `kind="citation"`
      and rank with the existing citation impact/effort weights).
- [ ] `graph-keeper` review passes (required gate for `pipeline/goblin/` changes).
- [ ] Existing suite stays green: the full pytest suite (currently 186 tests) +
      the eval gate (`heal-loop converges` + `verify strands converge
      per-discipline`) remain passing after the new node + cases update.

---

## Unit-test plan

New `pipeline/tests/test_platforms_audit.py` — all offline/deterministic
(mock mode), mirroring `test_community_audit.py` structure (helper-level units +
node-level invariants). Exact cases:

1. **`test_icp_routes_b2b_saas_to_g2_tier`** — build state with
   `company_profile={"icp_segment": "b2b_saas", ...}`; assert the node's chosen
   tier hosts include `g2.com`, `capterra.com`, `trustradius.com`, `gartner.com`.
2. **`test_icp_routes_finance_to_nerdwallet_tier`** — segment `finance` →
   `nerdwallet.com` present in tier; G2 absent from tier.
3. **`test_icp_routes_ecommerce_to_amazon_tier`** — segment `ecommerce` →
   `amazon.com` in tier.
4. **`test_service_and_gov_and_general_emit_no_presence_gap`** — for each of
   `local_service`, `gov`, `general`: `out["gaps"]` gains **no** `kind="citation"`
   presence gap, and the log line says no tier applies. (Parallels the
   schema_audit "never tell a service/gov site it's missing Product" guarantee.)
5. **`test_absent_platform_emits_high_citation_gap`** — mock b2b_saas →
   exactly one `kind="citation"` gap with `severity==4`; its `detail` contains
   "INFERENCE" and "verify".
6. **`test_every_presence_carries_verify_note`** — iterate
   `out["platform_presence"]`; assert each has a non-empty `verify_note` and a
   `presence` in `{"present","absent","unknown"}`.
7. **`test_unknown_presence_emits_no_gap`** — feed a state where a platform
   resolves to `unknown`; assert it appears in `platform_presence` with a verify
   note but contributes **no** gap.
8. **`test_blocked_probe_is_unknown_not_absent`** — simulate an
   unreadable/SPA/blocked probe (monkeypatch the live-probe helper to return the
   blocked sentinel); assert `presence=="unknown"`, never `"absent"`, never 0.
9. **`test_present_signal_from_state_citations`** — put a citation whose
   `domain` endswith `g2.com` and `is_client=True` into `state["citations"]`;
   assert that platform resolves to `presence=="present"` and emits no gap.
10. **`test_node_returns_community_audit_shape`** — `out` has
    `platform_presence`, `gaps`, `log`; gaps are appended (existing gaps
    preserved); a `platforms_audit:` log line is present.
11. **`test_mock_output_reads_as_illustrative`** — mock log line contains
    "illustrative"/"mock"; mock findings never assert a real client metric.

Extend `pipeline/tests/test_recon.py`:

12. **`test_recon_emits_icp_segment`** — `recon(_mock_state())["company_profile"]`
    has `icp_segment=="b2b_saas"`, `icp_confidence=="low"`,
    `icp_source=="mock (illustrative)"`.
13. **`test_recon_gov_domain_icp`** — keyless-live settings + a `.gov` domain →
    `company_profile["icp_segment"]=="gov"`, `icp_confidence=="high"`.

Eval/graph integration:

14. Extend `pipeline/goblin/eval/cases.py` only as needed so the existing golden
    case(s) still pass with the node present (it must not break
    `expect_gap_kinds`; the new gaps are `kind="citation"`, an already-expected
    kind). Re-run the eval gate to confirm `heal-loop converges` and the
    per-discipline verify strands still converge.

**Run command:** `python -m pytest pipeline/tests/test_platforms_audit.py
pipeline/tests/test_recon.py -q` from the pipeline repo root, then the full
`python -m pytest` + `python -m goblin.eval` gate.

**UI / Playwright / screenshot plan:** **N/A — this is a backend pipeline node
with no UI surface.** It writes a `platform_presence` list + `citation` gaps into
the report JSON/markdown via the existing `ship_pr` machinery; there is no new
rendered component in `web/`. Therefore no Playwright/axe screenshot pass is
required for this change. (Caveat noted for completeness: the project's CRT/grain
hero animation makes headless Playwright screenshot runs hang, so the standing
fallback for any *future* UI rendering of these findings is the deterministic
eval/inspect path — assert on the report JSON, not a headless screenshot. That
fallback is not needed here since no UI is added.)

---

## Prerequisites / blocked-on

- **None blocking.** The entire node + the ICP inference are implementable and
  fully testable **offline in mock/keyless mode** — no API keys, no Supabase, no
  `doctl`, no deploy. The state-citation presence signal reuses data already in
  `state`.
- The **live** presence-probe path (optional HTTP probe of a platform host for a
  brand listing) is a `pragma: no cover` stub that degrades to the offline
  state-signal path; turning it on later would benefit from (not require) a
  Perplexity/web-search key for stronger live signal, but that is out of scope
  for the testable deliverable.
- Required gate before merge: **`graph-keeper`** (mandatory reviewer for any
  `pipeline/goblin/` change).

---

## Honest-broker notes

- **Presence is an inference, never asserted fact.** Every `PlatformPresence`
  carries a `confidence` + a `verify_note`; gap `detail` strings say "INFERENCE
  (confidence: …) — verify …". This is the exact pattern `recon` already uses for
  auto-identified competitors ("auto-identified — verify before relying on them").
- **`icp_segment` is itself an inference** with confidence + source; a `general`
  default with `low` confidence is the honest "unknown", never a forced guess.
- **No 0-scoring of unreadable/blocked sites.** A blocked/SPA/unreadable presence
  probe → `presence="unknown"` (a flagged blind spot), never a clean `absent`
  pass.
- **Service / gov sites are not told they're "missing" a commercial review
  listing.** `local_service`/`gov`/`general` segments have an empty tier and emit
  no presence gap — the direct analogue of never telling a service/gov site it's
  "missing Product schema".
- **Listing presence is a real lever; schema/llms.txt are hygiene.** The gap copy
  explicitly states presence on G2/NerdWallet/Amazon is a citation lever while
  schema/llms.txt are hygiene, keeping the brand's wedge intact.
- **Nothing auto-deploys or auto-contacts a platform.** The node only *flags*
  absence and drafts the remediation as a ranked recommendation a human reviews;
  there is no code path that claims a listing, posts a review, or contacts a
  platform. (No astroturfing — earning a listing must be genuine, like
  `community_audit`'s human-post-only constraint.)
- **Mock/demo output reads as illustrative.** Mock findings are logged
  `[mock fixture (illustrative)]` and never present a fabricated client metric.
- **No fabricated competitors on the gap** — `competitors` is populated only from
  real `state["citations"]` evidence, otherwise left empty.

---

## Out of scope

- Live HTTP probing of platform hosts for real listing detection (stubbed,
  `pragma: no cover`; offline state-signal path is the testable deliverable).
- Actually claiming/creating any G2/Capterra/NerdWallet/Amazon listing, or
  drafting platform review content (that would be a separate
  `community_audit`-style drafting node, human-post-only).
- A dedicated `web/` UI component to render `platform_presence` (findings ride
  the existing report JSON/markdown; a UI surface is a separate spec).
- ML/LLM-based ICP classification — this spec uses deterministic keyword priors
  in mock/offline mode and an optional live-research signal; a trained classifier
  is future work.
- Per-platform competitor benchmarking (which rival wins each listing) beyond
  what `state["citations"]` already evidences.
