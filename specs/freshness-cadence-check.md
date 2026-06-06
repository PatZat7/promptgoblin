# Freshness cadence check

Add a **content-freshness signal** to both the JS Tier-1 web scan
(`functions/lib/hygiene.js`) and the Python pipeline mirror
(`pipeline/goblin/nodes/seo_audit.py`). Parse the dates a page (and its sitemap)
advertise — `<meta name="revised">`, `<time datetime>`, and sitemap `<lastmod>` —
derive a single **content-age** number, and flag `FRESHNESS_STALE` when the
freshest signal is older than 30 days. Severity is calibrated by inferred ICP
segment (finance = highest), because cited finance content is, in practice,
re-published well inside a 30-day window.

This is a **hygiene / structural** signal, in the same family as schema and
`llms.txt`. It is **NOT** a promised citation lever and the copy must never imply
"update your dates → get cited."

## Goal

- Emit an honest, reproducible **content-age** measurement from already-fetched
  inputs (no new always-on network dependency in the pure core).
- Flag `FRESHNESS_STALE` only when we can actually read a date *and* it is
  >30 days old. **Absence of a date is a separate, lower-severity finding**
  (`FRESHNESS_UNKNOWN`) — never scored as "stale," never scored 0.
- Calibrate `FRESHNESS_STALE` severity by inferred ICP segment: finance gets the
  highest weight; everything else gets a baseline weight.
- Keep the JS scan and the Python node in lockstep (same regexes, same
  thresholds, same severity table, same honest framing) exactly as the existing
  `analyzeHead` / `analyze_seo` ports already do.

## Files touched (exact paths + which repo)

| Path | Repo | Change |
|---|---|---|
| `functions/lib/hygiene.js` | **promptgoblin** (`functions`) | Add `analyzeFreshness(html, sitemapText, now)`, `inferIcpSegment(html, url)`, freshness findings + `freshness` block in `buildHygieneReport`; add a new optional `sitemapText` input; export the two new functions. |
| `functions/test/scan.test.js` | **promptgoblin** (`functions`) | Add freshness + ICP-severity assertions to the existing `node:assert` runner. |
| `pipeline/goblin/nodes/seo_audit.py` | **pipeline** (sibling git repo under `pipeline/`) | Mirror: `_analyze_freshness`, `_infer_icp_segment`, compiled `_RE_*` for the three date sources, freshness findings appended to `analyze_seo`, optional sitemap fetch in the node body. |
| `pipeline/tests/test_seo_audit.py` | **pipeline** | Mirror the JS freshness/ICP test cases as pytest. |

No UI files are touched. The scan report already flows to the Hero teaser via
`web/lib/scan-api.ts`; surfacing the new field in the UI is **out of scope** for
this spec (see Out of scope).

## Design

### 1. Date extraction (the three sources)

All regex-based, no DOM dependency — matching the existing `firstMatch` /
`extractJsonLdTypes` style in `hygiene.js` and the compiled `_RE_*` constants in
`seo_audit.py`.

**a) `<meta name="revised">`** (also accept the common `last-modified` meta alias):
```
/<meta[^>]+name=["'](?:revised|last-modified)["'][^>]+content=["']([^"']*)["']/i
```
**Fixed attribute-order assumption (explicit):** this regex requires `name`
**before** `content` within the tag — exactly mirroring `analyzeHead`'s existing
`<meta name="description" … content="…">` extraction, which makes the same
`name`-then-`content` ordering assumption. The reverse order
(`content="…" … name="revised"`) is **not** matched by design, to stay
byte-for-byte consistent with `analyzeHead` / `analyze_seo`. Do not "improve" the
ordering here without changing `analyzeHead` in the same PR; the mirror parity is
the contract.

**b) `<time datetime="...">`** — collect *all* matches, keep the newest valid one:
```
/<time[^>]+datetime=["']([^"']*)["']/gi
```

**c) sitemap `<lastmod>`** — parsed from sitemap XML text (not the page HTML):
```
/<lastmod>\s*([^<]+?)\s*<\/lastmod>/gi
```

**Date-parse tolerance (exact, ISO-8601 only — no natural-language dates).**
Accepted input forms, each captured string parsed with `Date.parse` (JS) /
`datetime.fromisoformat` (Python):
- `2026-05-20` (date only)
- `2026-05-20T14:30:00Z` (full ISO-8601 with `T` separator and `Z`/offset)
- `2026-05-20 14:30:00` (space separator instead of `T`)

The space-separated form is handled by normalizing a single space between the
date and time to `T` before parsing (`datetime.fromisoformat` accepts it natively
on 3.11+; the JS path replaces the first space with `T` for `Date.parse`). **No
natural-language dates** are supported — strings like `"May 20, 2026"`,
`"yesterday"`, `"2 days ago"`, or locale formats (`20/05/2026`) are **not**
parsed; no `dateparser`/`moment`/`Date(string)` locale heuristics are introduced.

**Anything unparseable → contributes nothing, and if NO signal parses anywhere
the page is `FRESHNESS_UNKNOWN`** (never `FRESHNESS_STALE`, never a 0 score).
Unparseable values are skipped: not treated as `now`, not treated as stale. We
only keep dates that are **not in the future** (a future `<lastmod>` is a data
error, ignored with a low-severity note rather than counted as "fresh"). A page
whose only date strings are all unparseable is therefore indistinguishable from a
page with no dates at all → `FRESHNESS_UNKNOWN`.

### 2. `freshness` data shape (carried on the report, JS)

`buildHygieneReport` returns its existing object **unchanged** plus one new
top-level `freshness` block, a **sibling** of `coreWebVitalsProxies` (not nested
under it). Concrete return-object shape (existing keys elided with `…`, exact
sibling placement shown):

```js
{
  url: "https://example.com/",
  hygieneScore: 82,
  findings: [ /* …existing findings… + the new freshness finding(s)… */ ],
  schema: { /* …unchanged… */ },
  head: { /* …unchanged… */ },
  crawlability: { /* …unchanged… */ },
  coreWebVitalsProxies: {
    // …existing CWV-proxy fields, unchanged…
  },
  // NEW — sibling of coreWebVitalsProxies, same nesting level:
  freshness: {
    // ISO date of the FRESHEST signal we could read, or null if none readable
    mostRecent: "2026-05-20" | null,
    // integer days between mostRecent and `now`, or null
    ageDays: 17 | null,
    // which source won: "meta-revised" | "time-datetime" | "sitemap-lastmod" | null
    source: "time-datetime" | null,
    // every readable signal, for transparency in the report (deduped, sorted desc)
    signals: [
      { source: "time-datetime",  date: "2026-05-20" },
      { source: "sitemap-lastmod", date: "2026-04-02" }
    ],
    // inferred ICP segment that calibrated severity (honest: an INFERENCE)
    icpSegment: "finance" | "general",
    // true only when NO readable date was found anywhere
    unknown: false,
    // honesty caveat travels WITH the data
    note: "Content age is a structural/hygiene signal, not a citation guarantee. " +
          "Freshness is inferred from page/sitemap-declared dates, which can be " +
          "stale, missing, or templated — treat as directional."
  }
}
```

Python mirror (`seo_audit.py`) uses snake_case keys
(`most_recent`, `age_days`, `icp_segment`, …) consistent with `_analyze_head`'s
existing `title_length` / `meta_description` style.

### 3. ICP segment inference (`inferIcpSegment` / `_infer_icp_segment`)

There is **no ICP/segment field on the scan input or on `VisibilityState`**
today (confirmed: only `is_gov_domain` exists in `schema_audit.py`). So finance
must be *inferred*, and the inference must be labeled as such — never asserted as
fact.

**Precedence: there is no short-circuit — evaluate all three checks; ANY hit
wins.** "Priority order" below is only the order findings/logs cite the reason,
not an early-return. Pseudocode (identical in JS + Python):
```
schema_hit  = any finance @type in extractJsonLdTypes(html)      # check 1
host_hit    = any token in FINANCE_HOST_TOKENS is substring of host  # check 2
keyword_hit = finance-keyword count in (title + meta desc) >= 2   # check 3
segment = 'finance' if (schema_hit or host_hit or keyword_hit) else 'general'
```
All three are computed every call (cheap, regex-only) so the logged reason can
name which signal(s) fired; the verdict is the boolean OR. Checks, in the order
reasons are reported:
1. **Finance schema @types** present on the page (reuse `extractJsonLdTypes` /
   `schema_found`): `FinancialService`, `BankOrCreditUnion`, `InsuranceAgency`,
   `Bank`, `AccountingService`.
2. **Finance TLD/host tokens** — case-insensitive substring match against the
   lowercased host. This is **one single shared list**, used **VERBATIM** (same
   tokens, same order, same lowercase) in both `hygiene.js` and `seo_audit.py`;
   it is the freshness analog of the existing mirrored constants and must not
   drift between repos:
   ```
   ["bank", "creditunion", "capital", "invest", "insurance",
    "wealth", "lending", "mortgage", "finance", "fintech"]
   ```
   JS: `const FINANCE_HOST_TOKENS = [...]`. Python:
   `FINANCE_HOST_TOKENS = [...]` (identical contents). A host matches if it
   contains any token as a substring (e.g. `firstbank.example`,
   `acme-fintech.io`). Keep the list small + audited; adding/removing a token is
   a two-repo change in the same PR.
3. **Finance keyword density** in the title/meta description: ≥2 of
   {`APR`, `interest rate`, `mortgage`, `loan`, `portfolio`, `FDIC`, `brokerage`,
   `annuity`, `401(k)`}.

`icpSegment` is recorded on `freshness.icpSegment` and the finding text says
"inferred finance content" — not "you are a finance company."

> Rationale captured honestly: finance is weighted highest because **observed**
> cited finance answers are typically updated within 30 days; this is a stated
> editorial prior, not a measured per-client metric. Do not present it as one.

### 4. Findings (JS `{severity, area, detail}`; Python `{severity, detail}`)

Append inside the existing `findings`/`add(...)` block, after the `cwv` group.

| Condition | Code | Area | Severity (general) | Severity (finance) | Detail (honest) |
|---|---|---|---|---|---|
| `ageDays != null && ageDays > 30` | `FRESHNESS_STALE` | `freshness` | 3 | 4 | `Freshest declared date is {ageDays} days old (> 30). Inferred {segment} content; refresh cadence is a hygiene signal, not a citation guarantee.` |
| `unknown == true` | `FRESHNESS_UNKNOWN` | `freshness` | 2 | 2 | `No machine-readable content date (no <meta name="revised">, <time datetime>, or sitemap <lastmod>). Engines and readers can't tell how current this is.` |
| future date seen | (folded into note) | `freshness` | 1 | 1 | `A declared date is in the future — likely a templating bug.` (emit at most once) |

- `area` is the existing `findings[].area` discriminator (`"schema"`, `"head"`,
  `"crawlability"`, `"cwv"`, …). Add `"freshness"`.
- A machine-stable `code` field is **added to freshness findings only** so tests
  and the pipeline can assert on `FRESHNESS_STALE` without matching prose. To stay
  backward-compatible, existing findings keep their current shape; the freshness
  finding is `{severity, area, detail, code}` (extra key is additive).
- Severity stays within the existing 1–5 scale and feeds the existing
  `penalty = severity * 3` hygiene-score dock unchanged.

### 5. Wiring `sitemapText` without a new always-on fetch

The pure core stays pure: `buildHygieneReport` gains one **optional** input:

**Exact signature change** (one new optional key, `sitemapText`, appended to the
existing options object — no positional args, no reorder):
```js
buildHygieneReport({ url, html, contentBytes, robotsText, llmsText, sitemapText })
// sitemapText defaults to null/undefined — when absent, sitemap <lastmod> is
// simply skipped and only page-level dates are used (still fully testable offline).
// `now` is NOT a buildHygieneReport arg; the report path constructs a single
// `now = new Date()` internally and forwards it to analyzeFreshness(...). Tests
// that need determinism call analyzeFreshness(html, sitemapText, now) directly
// with a fixed `now` (see §6).
```

The DO function **handler** (the fetcher that wraps `buildHygieneReport`, not in
scope to rewrite here) may pass sitemap text it already discovers via
`analyzeRobots(...).sitemap`. The spec only requires the *core* to accept and use
`sitemapText` when provided; fetching it live is a handler concern gated the same
way as the existing robots/llms fetches (best-effort, failure = `sitemapText:
null`, never an error/0).

**Pipeline**: `seo_audit` already caches `client_html`. For sitemap, reuse the
`_fetch.fetch_html` helper to best-effort GET `<sitemap-url>` discovered from
robots (or `/sitemap.xml`); on any failure pass `sitemap_text=None`. Mock mode
uses a deterministic fixture sitemap so a known `FRESHNESS_STALE` is always
present (mirrors `_MOCK_HTML`). The mock fixture date is fixed and clearly
illustrative.

**Exact `_MOCK_SITEMAP` fixture** (module-level in `seo_audit.py`, alongside
`_MOCK_HTML`). The `lastmod` is hard-pinned to `2025-01-01`, which is `> 30`
days before any plausible `now`, so `FRESHNESS_STALE` is deterministic regardless
of the test clock. The comment marks it illustrative — it is sample data, never a
measured client result:
```python
# ILLUSTRATIVE sample sitemap — fixed stale date so FRESHNESS_STALE is
# deterministic in mock mode. NOT a real client measurement.
_MOCK_SITEMAP = (
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    "  <url>\n"
    "    <loc>https://example.com/</loc>\n"
    "    <lastmod>2025-01-01</lastmod>\n"
    "  </url>\n"
    "</urlset>\n"
)
```
Mock-mode `analyze_seo` passes `_MOCK_SITEMAP` as `sitemap_text` together with a
fixed `now` (see §6) so the stale gap is byte-stable across runs. (If the JS
side adds a mock path it uses the same XML string verbatim.)

### 6. Determinism / `now` injection

Both `analyzeFreshness(html, sitemapText, now)` and `_analyze_freshness(html,
sitemap_text, now)` take an injectable `now` (default = current time). Tests pass
a fixed `now` so age math is deterministic and not time-bomb-flaky. `buildHygiene
Report` / `seo_audit` mock path pass a fixed `now` too.

### 7. Exports

Add to `module.exports` in `hygiene.js`: `analyzeFreshness`, `inferIcpSegment`.
`seo_audit.py` exposes `analyze_seo` (already public) plus module-level
`_analyze_freshness` / `_infer_icp_segment` (underscored, consistent with
`_analyze_head`).

## Acceptance criteria

- [ ] `analyzeFreshness` reads `<meta name="revised">`, `<time datetime>`, and
      sitemap `<lastmod>`, picks the newest valid (non-future) date, and reports
      `mostRecent`, `ageDays`, `source`, and a transparent `signals[]`.
- [ ] `FRESHNESS_STALE` fires **only** when a date is readable AND `ageDays > 30`.
- [ ] A page with no readable date yields `FRESHNESS_UNKNOWN` (sev 2), never
      `FRESHNESS_STALE`, never a 0 score — consistent with the "unreadable is
      never 0" rule.
- [ ] Inferred-finance pages get `FRESHNESS_STALE` severity 4; general pages get
      severity 3; the finding text labels finance as **inferred**.
- [ ] `freshness.note` (and the pipeline log/gap detail) states freshness is a
      hygiene/structural signal, **not** a citation guarantee.
- [ ] Future-dated signals are ignored for age (not counted as fresh) and noted at
      sev 1, at most once.
- [ ] `seo_audit.py` mirrors the JS thresholds, severity table, codes, and honesty
      framing 1:1 (same way `analyze_seo` already mirrors `analyzeHead`).
- [ ] `buildHygieneReport` accepts the new optional `sitemapText` and behaves
      identically (no new finding) when it is absent.
- [ ] `now` is injectable; all date math is deterministic in tests.
- [ ] Existing `functions` `npm test` and pipeline pytest suites still pass
      (no regression in the 186 pipeline tests or the JS check counts).
- [ ] Mock/fixture freshness data reads as illustrative, never as a real client
      pass.

## Unit-test plan

### `functions/test/scan.test.js` (node `assert`, no framework — append `ok(...)` checks)

Use a fixed `now` (e.g. `new Date("2026-06-06T00:00:00Z")`) so ages are stable.

1. **Fresh page** — `<time datetime="2026-05-20">` (17 days old) → no
   `FRESHNESS_STALE` finding; `freshness.ageDays === 17`;
   `freshness.source === "time-datetime"`.
2. **Stale general page** — `<meta name="revised" content="2025-01-01">` →
   one `FRESHNESS_STALE`, `area==="freshness"`, `code==="FRESHNESS_STALE"`,
   severity `3`; `icpSegment === "general"`.
3. **Stale finance page** — same stale date + a `FinancialService` JSON-LD block
   (or host `bank.example`) → `FRESHNESS_STALE` severity `4`;
   `freshness.icpSegment === "finance"`; detail contains "inferred".
4. **Unknown** — no date anywhere → `FRESHNESS_UNKNOWN` (sev 2), and **no**
   `FRESHNESS_STALE`; `freshness.unknown === true`, `ageDays === null`.
5. **Sitemap wins** — page `<time>` older than sitemap `<lastmod>` passed via
   `sitemapText` → `source === "sitemap-lastmod"` and the newer date drives age.
6. **Future date ignored** — `<time datetime="2099-01-01">` plus a real older
   readable date → age uses the older date; future-date note present at sev 1;
   no false "fresh."
7. **No `sitemapText` = no change** — re-run case 1 without `sitemapText`; same
   verdict (proves optionality / purity).
8. **Honesty** — `freshness.note` matches `/not a citation guarantee/i`; the
   `FRESHNESS_STALE` detail does **not** match `/get(s)? you cited/i`.

### `pipeline/tests/test_seo_audit.py` (pytest — mirror 1:1)

- `test_freshness_fresh_no_finding`, `test_freshness_stale_general_sev3`,
  `test_freshness_stale_finance_sev4`, `test_freshness_unknown_sev2`,
  `test_freshness_sitemap_lastmod_wins`, `test_freshness_future_date_ignored`.
- `test_seo_audit_freshness_in_mock_mode_deterministic` — mock fixture yields a
  stable `FRESHNESS_*` gap across two runs (extend the existing
  `test_seo_audit_mock_mode_deterministic` pattern; pass a fixed `now`).
- `test_freshness_segment_inferred_not_asserted` — finance gap detail contains
  "inferred", and a `.gov`/service page is **not** mislabeled finance.
- Use `monkeypatch` for any sitemap fetch (same approach as the existing
  `html_from_state` / `fetch_html` monkeypatch tests) — **no real network**.

### UI / Playwright

This change adds no UI. **No Playwright run is required for this spec.**
If a follow-up surfaces `freshness` in the Hero teaser, that follow-up's
screenshot step must heed the **CRT/grain headless-hang caveat**: the site's
CRT-scanline / film-grain background animation can hang or flake a headless
Playwright capture (long-running rAF / GPU compositing never going idle). The
deterministic fallback is to assert on the rendered scan-result **DOM/JSON**
(e.g. via `preview_inspect` / `preview_eval` against the report object) rather
than a pixel screenshot, and to disable the grain/CRT layer (e.g. a
`prefers-reduced-motion` / `?nograin` test hook) before any screenshot.

## Prerequisites / blocked-on

- **None blocking.** Both targets are pure, offline-testable functions; all tests
  run with **zero keys and zero network** (the repo ethos — JS test banner
  "zero keys, zero network"; pipeline tests monkeypatch fetch).
- The live **sitemap fetch** in the DO handler and in the pipeline node uses the
  *already-existing* fetch helpers (`_fetch.fetch_html`; the handler's robots/llms
  fetch path). No new credential, no new dependency.
- **No deploy is in scope** and nothing auto-deploys — DO `doctl` deploy of the
  function is a separate, human-gated step (not required to implement or test).
- Cross-repo: the pipeline lives in a **sibling git repo** under `pipeline/`; the
  two edits land as two commits/PRs but must ship together to keep the mirror in
  lockstep.

## Honest-broker notes

- **Freshness is hygiene, not a citation lever.** Every surface (the `freshness.
  note`, the finding detail, the pipeline gap detail, the log line) must say so.
  Never imply "refresh your dates → get cited." Real levers remain brand mentions
  + Bing rank, measured over the re-run loop — unchanged.
- **Inferred segment ≠ asserted fact.** Finance is *inferred* from public
  signals and is fallible (a templated date, a marketing blog on a bank domain).
  The finding says "inferred {segment}"; we never tell a client what industry
  they are.
- **Unreadable / dateless ≠ stale ≠ 0.** A WAF-blocked or JS-rendered page that
  we couldn't read keeps the existing "could not read" / blind-spot handling; a
  readable page with no date is `FRESHNESS_UNKNOWN`, not stale. Never score 0 for
  a missing date.
- **No new claim about service/gov sites.** This change adds no
  Product-schema-style misfire; gov/service detection is untouched and finance
  inference must not fire on a `.gov`/service page (covered by a test).
- **Mock data is illustrative.** The mock fixture's fixed stale date and any
  sample freshness output must read as illustrative, never as a measured client
  result.
- **The 30-day finance prior is an editorial stance, not a measured per-client
  number.** Document it as such; do not present "<30 days" as a guaranteed
  citation outcome or a refund-backed number. The refund guarantees the *work*.

## Out of scope

- Surfacing `freshness` in the Hero teaser / `web/` UI (separate follow-up; see
  the Playwright/CRT caveat above for when it happens).
- Fetching or parsing multi-file sitemap **index** files (nested `<sitemap>` →
  `<loc>` → child sitemaps); v1 reads `<lastmod>` from the single sitemap text it
  is given. Note as a known limitation.
- A first-class ICP/segment **input field** on the scan API or `VisibilityState`
  (would remove the need to infer finance) — a larger schema change, deferred.
- Recommending specific re-publish cadences or auto-editing dates — out of scope
  and would violate the "nothing auto-deploys / hygiene-not-a-lever" rules.
- Per-engine or field-data freshness measurement (we read declared dates only,
  never crawl history or render timing).
