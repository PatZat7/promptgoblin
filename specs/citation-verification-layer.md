# Citation Verification Layer

> Backlog item: `citation-verification-layer` · Repos: **multi** (pipeline + functions + web + supabase) · Gate: **graph-keeper + integrity-reviewer**

## Goal

Today both citation paths — the pipeline's `retrieve` node and the Tier-2 serverless teaser — record whatever URLs an answer engine *claims* it cited, and treat them as real. That is exactly the failure mode the market is panicking about: independent investigations have found roughly half of AI-generated citations are hallucinated, the rate rose sharply from 2023 into 2026, and the courts have issued 200+ sanctions over fabricated citations. Recording an engine's claimed source as fact, unchecked, is dishonest by our own honest-broker code.

Add a **`verify_citations` step that runs AFTER citation capture** in both paths. For every cited URL it:

1. Issues an HTTP `HEAD` (then `GET` fallback) to confirm the URL resolves.
2. Normalizes to a **canonical URL** (follow redirects, strip tracking params, read `rel=canonical` / `og:url`) so a redirect to the same content counts as verified, not fabricated.
3. Performs a **content/snippet match** — confirms the page body plausibly supports the claim (the brand/query terms or the engine's quoted snippet actually appear).
4. Optionally cross-checks **indexed-source evidence** (Bing presence) when a key is configured.
5. Annotates each citation `verified` | `unverifiable` | `fabricated`.

`fabricated` and `unverifiable` citations **lower run confidence** and are **surfaced in the dashboard and the AI-prompt artifact**. A new Supabase enum + columns persist the verdict. The eval gains a hard honesty invariant: **no unverified citation is ever rendered as proven.** This is the sharpest differentiator Prompt Goblin can ship — we don't just *count* citations, we *check whether they exist*.

This is the largest spec in the backlog; it touches all four repos. It is intentionally split so the pipeline lane (offline-testable, the eval gate) can land first, and the live-network pieces (functions deploy, Supabase, Bing key) follow behind owner resources.

---

## Files touched (exact paths + which repo)

### pipeline (sibling git repo under `pipeline/`) — the primary lane
- **NEW** `pipeline/goblin/nodes/verify_citations.py` — the new node. Pure-deterministic in `--mock`; a hardened, bounded HTTP verifier in live mode.
- **NEW** `pipeline/goblin/verify_url.py` — network helper: HEAD/GET fetch, canonical normalization, snippet match. SSRF-guarded. Module-level `httpx` so tests can patch it (mirrors `nodes/_fetch.py`).
- `pipeline/goblin/state.py` — extend the `Citation` TypedDict with verification fields; add `citation_verification` summary + `low_citation_confidence` to `VisibilityState`; default them in `new_state`.
- `pipeline/goblin/nodes/citation_diff.py` — exclude `fabricated` citations from the share-of-citations math (a hallucinated URL is not a real citation and must not inflate or deflate visibility); count them in the log.
- `pipeline/goblin/nodes/grade_retrieval.py` — fold a `citation_verifiability` sub-score into the existing weighted rubric; a run thick with fabricated/unverifiable citations must not earn a high-confidence PASS.
- `pipeline/goblin/graph.py` — splice `verify_citations` onto the spine between `retrieve` and `citation_diff` (both the LangGraph wiring and the `_NODE_SEQUENCE` fallback). It rides the same `RetryPolicy` rationale as `retrieve` (network node).
- `pipeline/goblin/nodes/__init__.py` — export `verify_citations`.
- `pipeline/goblin/nodes/ship_pr.py` — render a "Citation Verification" section in the markdown report; carry verdict fields into the JSON snapshot; add the verification caveat to the AI-prompt artifact (`_render_ai_prompt`) so a pasted prompt never presents an unverified citation as proven.
- `pipeline/goblin/config.py` — add `verify_citations_enabled` (default ON in live, auto-skipped in mock), `verify_timeout`, `bing_search_api_key` (indexed-source evidence; absent ⇒ that check honestly skipped, never failed).
- `pipeline/goblin/eval/metrics.py` — add a `citation_verification_honesty` metric to `ALL_METRICS`.
- `pipeline/goblin/eval/cases.py` — add verification expectations to `GoldenCase` (fabricated count must be flagged, never silently dropped).
- **NEW** `pipeline/tests/test_verify_citations.py` — node + helper unit tests (verified / canonical-redirect / blocked-but-unverifiable / fabricated), all keyless + offline via stubbed `httpx`.
- `pipeline/tests/test_heal_loop.py` and `pipeline/tests/test_eval.py` — extend so the new sub-score + metric stay green (eval gate).

### functions (DigitalOcean serverless) — the live teaser lane
- **NEW** `functions/lib/verify-citations.js` — shared verifier (`verifyCitation`, `verifyCitations`, `normalizeCanonical`, `snippetMatch`). Zero deps, global `fetch`, reuses `util.toUrl` / `assertPublicHost` SSRF guards.
- `functions/packages/scan/tier2/lib/` — vendor a copy of `verify-citations.js` (tier2 bundles its own `lib/`, per `build-sync.js`); wire `build-sync.js` to sync it.
- `functions/packages/scan/tier2/lib/perplexity.js` — after `askOne` returns `sources`, verify each source; attach `verifiedSources: [{url, canonicalUrl, status, verdict, evidence}]` to each result; recompute `clientCited` against **verified** client URLs only.
- `functions/packages/scan/tier2/index.js` — thread the verification summary into both the comparative and auto teaser responses (`teaser.verification` + per-source verdicts).
- `functions/packages/scan/tier2/lib/voice.js` — `tier2Summary` mentions any fabricated/unverifiable citations in honest goblin voice.
- `functions/.env.example` + `functions/project.yml` — document optional `BING_SEARCH_API_KEY` (indexed-source evidence); absent ⇒ that sub-check is skipped, never a fabricated pass.
- **NEW** `functions/test/verify-citations.test.js` — keyless/offline tests (stubbed fetch), mirroring `scan-tier2-auto.test.js` style.
- `functions/test/scan-tier2-auto.test.js` — extend: teaser response now carries verdicts; assert no fabricated source is reported as `clientCited`.

### web (Next.js static export) — the dashboard lane
- `web/lib/scan-api.ts` — extend `TeaserResponse` / `CitationTeaserData` result types with `verifiedSources` + a `verification` summary; add a `CitationVerdict` union type.
- `web/components/sections/LiveScan/scan-report.ts` — `citationVerdictCopy(verdict)` → integrity-reviewer-approved badge label/tone (verified = ok/lime, unverifiable = warn/amber, fabricated = bad/red). No fabricated number in copy.
- `web/components/sections/LiveScan/ScanResult.tsx` (and/or `web/components/sections/Hero/HeroScan.tsx` where the teaser renders) — render a per-citation verdict badge; show the "N of M citations verified" summary; an unverified citation is visually + textually NOT a proven one.
- `web/components/sections/LiveScan/LiveScan.module.css` — badge styles (reuse existing ok/warn/bad tones).
- `web/__tests__/scan-report.test.ts` — unit-test `citationVerdictCopy` (no score leakage; fabricated reads as caution/negative, never green).
- `web/e2e/homepage.spec.ts` — Playwright assertion that a fabricated/unverifiable citation never renders with the verified (lime) badge.

### supabase
- **NEW** `supabase/migrations/<timestamp>_citation_status.sql` — `citation_status` enum + columns on the citations table (see Design). `supabase/migrations/` exists but is currently empty; this is the first migration.

---

## Design

### Verdict vocabulary (single source of truth across all four repos)

```
verified      — URL resolves (2xx/3xx→2xx) AND content/snippet match passed.
unverifiable  — URL could not be checked for a non-falsifying reason:
                WAF/403/429/503 block, timeout, network error, or a live engine
                we simply couldn't re-fetch. NOT proof of fabrication.
fabricated    — URL definitively does not exist: DNS NXDOMAIN, a hard 404/410,
                or a 200 whose content contradicts the claim (snippet absent AND
                the page is an unrelated/parked/error page).
```

Honest-broker mapping (binds the whole feature): **`unverifiable` is never reported as either proven or fabricated.** A blocked/timed-out source is a reachability outcome, exactly like the Tier-1 WAF rule that an unreadable site is never scored 0. Only a *definitive* non-existence is `fabricated`.

### pipeline — `verify_url.py` (network helper)

```python
# Mirrors nodes/_fetch.py: module-level httpx (patchable in tests), browser-like
# UA, SSRF-safe, never raises — degrades to ("unverifiable", note).
import httpx

_TRACKING_PARAMS = {"utm_source","utm_medium","utm_campaign","utm_term",
                    "utm_content","gclid","fbclid","ref","mc_cid","mc_eid"}

def normalize_canonical(url: str, *, final_url: str = "", html: str = "") -> str:
    """Strip tracking params, lowercase host, drop fragment; prefer rel=canonical
    / og:url from html, else the post-redirect final_url, else the cleaned url."""

def snippet_match(html: str, *, terms: list[str], quoted_snippet: str = "") -> bool:
    """Case/space-insensitive plausibility check. Returns True iff the
    `snippet_match` rule below is satisfied. Single source of truth — the JS
    `snippetMatch` in functions implements the SAME rule, byte-for-byte in
    behavior. Operates on extracted page TEXT only; the caller has already
    confirmed the body is readable (an unparseable 200 is `unverifiable`
    upstream and never reaches this function)."""

def verify_one(url: str, *, terms: list[str], quoted_snippet: str = "",
               timeout: float = 10.0, settings=None) -> dict:
    """Returns {url, canonical_url, status, verdict, evidence, checked_at}.
    HEAD first; GET fallback on 405/no-body/needs-content. SSRF guard via an
    assert_public_host check before any fetch (DNS-rebind safe). Never raises.

    Honest-broker invariant: a 200 whose content is UNPARSEABLE — WAF-obfuscated,
    or JS-rendered with no meaningful body — is `unverifiable`, NEVER `fabricated`.
    We could not read the page, which is a reachability/readability outcome, not
    proof the URL is bogus. This mirrors the Tier-1 rule that an unreadable /
    JS-rendered (SPA) / WAF-blocked site is never scored 0. `fabricated` is
    reserved for definitive non-existence (404/410/NXDOMAIN) or a *readable* 200
    whose content actively contradicts the claim."""
```

Verdict decision tree in `verify_one`:
- host fails SSRF/public-resolution check → `unverifiable` (`evidence="non-public or unresolvable host"`).
- DNS NXDOMAIN → `fabricated` (`evidence="domain does not resolve"`).
- 404/410 → `fabricated`.
- 401/403/406/409/429/503 (reuse the functions' `BOT_PROTECTION_STATUSES` set) or timeout/conn-error → `unverifiable` (`evidence="blocked/unreachable (HTTP 403)"`).
- 2xx but the **content is unparseable** — WAF-obfuscated, or JS-rendered with no meaningful body (no extractable text) → `unverifiable` (`evidence="resolves but body unreadable (WAF-obfuscated / JS-rendered)"`). **NEVER `fabricated`**: we could not read the page, exactly like the Tier-1 rule that an unreadable / JS-rendered (SPA) / WAF-blocked site is never scored 0. This branch is evaluated BEFORE any `snippet_match` test, because snippet matching against an unreadable body is meaningless.
- 2xx (after redirects), body readable + `snippet_match` true → `verified`.
- 2xx, body readable, `snippet_match` false AND page looks parked/empty/unrelated → `fabricated` (`evidence="page exists but does not support the claim"`).
- 2xx, body readable, snippet false, but page is substantive → `unverifiable` (we can't *disprove* it cheaply; honest under-claim) + `evidence="resolves; claim not confirmed in body"`.
- optional Bing indexed-source check (`settings.bing_search_api_key`): if the canonical URL/host is indexed, *upgrade* an `unverifiable` to a softer note (records `indexed: true`) — it never converts `fabricated` → `verified`, and its absence is recorded `indexed: null`, never a failure.

### snippet-match rule (single source of truth — pipeline `snippet_match` AND functions `snippetMatch`)

Both implementations MUST apply this exact rule so a citation gets the same verdict in either path. It runs only on **readable extracted page text** (an unparseable 200 is already `unverifiable` and never reaches here).

Normalization (applied to page text, the quoted snippet, and every key term before comparison):
- lowercase;
- collapse all runs of whitespace (incl. newlines/tabs/`&nbsp;`) to a single space;
- trim leading/trailing space.

`snippet_match` returns **True** iff EITHER condition holds:
1. **Exact snippet present** — a non-empty `quoted_snippet`, after normalization, appears as a contiguous substring of the normalized page text; OR
2. **Key-term quorum** — at least **2 of 3** key terms (`brand`, `query`, `competitor`) are present in the normalized page text. Each term is matched after the same normalization; an empty/absent term does not count toward the 2. (If fewer than 2 non-empty key terms exist for the claim, condition 2 cannot be satisfied — fall through to the quoted-snippet condition only.)

Otherwise `snippet_match` returns **False**, which routes the verdict to `unverifiable` ("resolves; claim not confirmed in body") for a substantive page, NOT to `fabricated` — `fabricated` requires the additional parked/empty/unrelated signal from the decision tree above.

### pipeline — `verify_citations` node

```python
def verify_citations(state: VisibilityState, *, settings=None) -> dict:
    # mock OR verify disabled OR no citations -> deterministic skip:
    #   stamp every citation verdict="unverifiable", evidence="mock: not network-checked"
    #   (reads as illustrative, NEVER as a real pass), summary marks checked=False.
    # live -> verify each DISTINCT canonical URL once (cache by canonical), map
    #   the verdict back onto every Citation; bounded total work + per-URL timeout.
```

It writes back the **annotated `citations`** plus a `citation_verification` summary:

```python
{"checked": True, "n": 42, "verified": 30, "unverifiable": 9, "fabricated": 3,
 "fabricated_rate": 0.071, "engines": {"perplexity": {...}}, "sample_fabricated": [...]}
```

and sets `low_citation_confidence = (fabricated or unverifiable share over threshold)`.

`Citation` TypedDict gains (defaulted so partial/older states stay valid):
```python
verdict: str          # "verified" | "unverifiable" | "fabricated"
canonical_url: str    # normalized URL (redirect/tracking-stripped)
verify_evidence: str  # human-readable reason
verify_status: int    # observed HTTP status (0 if none)
```

### pipeline — graph splice

`_NODE_SEQUENCE` becomes `... retrieve → verify_citations → citation_diff → grade_retrieval ...`. `verify_citations` gets the same `RetryPolicy(max_attempts=retrieve_max_retries+1)` treatment as `retrieve` (it's network-bound). The heal loop's back-edge already terminates at `retrieve`; since `verify_citations` sits *after* retrieve on the spine, a re-retrieve naturally re-verifies — no new loop, no new termination proof needed.

### pipeline — `citation_diff` + `grade_retrieval` changes
- `citation_diff`: filter `c["verdict"] != "fabricated"` before counting share-of-citations and before per-query gap detection. A fabricated "competitor cited here" must NOT manufacture a gap, and a fabricated client citation must NOT mask one. Log the count excluded.
- `grade_retrieval`: add sub-score `citation_verifiability = verified / max(1, verified + fabricated)` (unverifiable is neutral — neither rewarded nor punished, matching the honest-broker stance). Re-weight: `realness 0.25, verifiability 0.20, source_sufficiency 0.20, gap_measured 0.20, engine_diversity 0.15` (sum 1.0). A wall of fabricated citations now drags the grade below threshold → triggers the existing heal loop or an honest low-confidence proceed.

### functions — live teaser

`verifyCitation(url, {terms, quotedSnippet, fetchImpl})` mirrors `verify_one` in JS: HEAD→GET via global `fetch`, `toUrl`+`assertPublicHost` SSRF guard, same verdict tree, never throws. `perplexity.js#askOne` runs sources through `verifyCitations`, attaches `verifiedSources`, and recomputes `clientCited`/`competitorCited` against **verified** matches only (a fabricated self-citation must never read as "you're cited"). Bounded: cap verifications per teaser (e.g. ≤ 8 distinct URLs) to stay inside the 25s function timeout; over-cap URLs are stamped `unverifiable` with `evidence="not checked (teaser cap)"`.

### supabase migration

```sql
create type citation_status as enum ('verified', 'unverifiable', 'fabricated');

alter table public.citations
  add column verdict        citation_status not null default 'unverifiable',
  add column canonical_url  text,
  add column verify_evidence text,
  add column verify_status   smallint,
  add column verified_at     timestamptz;

create index citations_verdict_idx on public.citations (verdict);
comment on column public.citations.verdict is
  'Citation-verification verdict. unverifiable is the safe default: a row is never presumed proven (verified) or fabricated without a check.';
```

> The `citations` table does not yet exist in `supabase/migrations/` (the dir is empty). If a base citations-table migration is not already created by a prior spec, this migration includes a guarded `create table if not exists public.citations (...)` with the columns implied by the `Citation` shape before the `alter`. Default `unverifiable` enforces the honesty invariant at the storage layer: an unchecked row is never proven.

### web dashboard

`citationVerdictCopy(verdict)` returns `{ key: "ok"|"warn"|"bad", label, line }` reusing the existing tone vocabulary (`ok` lime, `warn` amber, `bad` red) and the existing no-numeric-score copy discipline from `scanFailureCopy`. The teaser/result renders, per cited source, the URL + a verdict badge, plus a summary line "N of M citations verified · K fabricated". Mock/sample data is labelled illustrative. The honest-broker constraint is enforced in copy: `unverifiable` reads "couldn't verify" (caution), never "verified"; `fabricated` reads "source not found" (negative), never a score.

---

## Acceptance criteria (checklist)

- [ ] `verify_citations` node exists, is spliced `retrieve → verify_citations → citation_diff` in BOTH the LangGraph graph and the `_NODE_SEQUENCE` fallback, and runs under a `RetryPolicy`.
- [ ] In `--mock` the node is deterministic, network-free, and stamps every citation `unverifiable` with mock evidence (illustrative, never a real `verified`).
- [ ] Each `Citation` carries `verdict` ∈ {verified, unverifiable, fabricated}, `canonical_url`, `verify_evidence`, `verify_status`; `new_state` defaults them.
- [ ] Canonical normalization: a tracking-param/redirect variant of a real URL verifies as `verified` (not fabricated).
- [ ] A blocked/timeout/403/429/503 source is `unverifiable` — NEVER `fabricated` and NEVER `verified` (WAF-block honesty parity).
- [ ] A 404/410/NXDOMAIN, or a 200 page that contradicts the claim, is `fabricated`.
- [ ] `citation_diff` excludes `fabricated` citations from share-of-citations and from gap detection; the exclusion is logged.
- [ ] `grade_retrieval` includes `citation_verifiability`; a fabricated-heavy run cannot earn a high-confidence PASS and instead heals or proceeds low-confidence.
- [ ] `ship_pr` markdown report has a "Citation Verification" section; the JSON snapshot carries the per-citation verdicts + the summary; the AI-prompt artifact states the verification caveat (no unverified citation presented as proven).
- [ ] `low_citation_confidence` set when fabricated/unverifiable share crosses threshold; carried into report + confidence badge.
- [ ] Tier-2 function attaches `verifiedSources` + verdicts to both comparative and auto teaser responses; `clientCited` is computed against verified client URLs only.
- [ ] Tier-2 verification is bounded (≤ cap distinct URLs, per-URL timeout) so the function stays within its 25s budget; over-cap URLs are honestly `unverifiable`.
- [ ] Supabase migration adds the `citation_status` enum + columns; default verdict is `unverifiable`.
- [ ] Web: each cited source renders a verdict badge; `unverifiable`/`fabricated` never render with the verified (lime) tone or a numeric score; mock/sample reads as illustrative.
- [ ] Eval: new `citation_verification_honesty` metric in `ALL_METRICS`; the existing 186 pytest tests + eval gate (heal-loop converges, per-discipline verify converges) stay green.
- [ ] No secret (`pplx-`, `BING_*`, etc.) is ever echoed in any response, log, or artifact.

## Unit-test plan (exact test cases)

### pipeline — `tests/test_verify_citations.py` (keyless, offline; stub module-level `httpx`)
- `test_verified_simple` — HEAD 200 + body contains query/brand terms → `verdict=="verified"`.
- `test_verified_canonical_redirect` — request URL has `?utm_source=x`, server 301→clean URL, body matches → `verified` and `canonical_url` is the tracking-stripped/redirected URL (the **canonical-redirect** case).
- `test_verified_rel_canonical` — 200 page whose `<link rel="canonical">` differs from the requested URL → `canonical_url` reflects rel=canonical.
- `test_unverifiable_blocked` — server returns 403 (and a 429 variant, 503 variant) → `verdict=="unverifiable"`, NOT fabricated (the **blocked-but-unverifiable** case).
- `test_unverifiable_timeout` — `httpx` raises `TimeoutException` → `unverifiable`, never raises out of the node.
- `test_fabricated_404` — HEAD/GET 404 (and a 410 variant) → `verdict=="fabricated"`.
- `test_fabricated_nxdomain` — DNS resolution fails / connect error to a non-existent host → `fabricated`.
- `test_fabricated_content_mismatch` — 200 but body is an unrelated parked page, snippet absent → `fabricated`.
- `test_unverifiable_unconfirmed_substantive` — 200 substantive page, snippet not found → `unverifiable` (honest under-claim, not fabricated).
- `test_ssrf_guard` — a citation URL resolving to a private/loopback IP → `unverifiable`, never fetched.
- `test_mock_skip_is_unverifiable` — node in mock mode stamps all `unverifiable` + mock evidence, makes zero network calls, summary `checked=False`.
- `test_distinct_url_cached` — duplicate citation URLs across queries verified once (call count assertion).
- `test_node_writes_back_and_summary` — annotated `citations` + `citation_verification` summary + `low_citation_confidence` set on a fabricated-heavy fixture.
- `test_never_echoes_key` — with a dummy `bing_search_api_key` set, no response/log field contains the key string.

### pipeline — extend existing
- `test_citation_diff.py` (or `test_smoke.py`): a fabricated citation does NOT contribute to `visibility` and does NOT create a citation gap.
- `test_heal_loop.py`: a fabricated-heavy retrieval lowers the grade below threshold and triggers a bounded heal (or an honest low-confidence proceed) — converges within budget.
- `test_eval.py`: `citation_verification_honesty` is in `ALL_METRICS` and passes on the golden cases; a synthetic state with a `verified` verdict on a citation whose evidence admits a block FAILS the metric (no unverified-as-proven).

### functions — `test/verify-citations.test.js` (keyless, offline; stubbed `fetch`)
- verified, canonical-redirect (301 + utm strip), blocked-but-unverifiable (403/429/503), fabricated (404/410/NXDOMAIN), content-mismatch → fabricated, ssrf-guard → unverifiable.
- `verifyCitations` over a mixed list returns correct per-URL verdicts + a summary; never throws; never echoes a key.
- extend `scan-tier2-auto.test.js`: teaser response carries `verifiedSources`; a fabricated self-citation does NOT set `clientCited`.

### web — Vitest (`__tests__/scan-report.test.ts`)
- `citationVerdictCopy("verified")` → tone `ok`, no `\d+\s*/\s*100`, no "score: N".
- `citationVerdictCopy("unverifiable")` → tone `warn`; copy never contains "verified".
- `citationVerdictCopy("fabricated")` → tone `bad`; copy reads negative; never green; no numeric score.

### web — Playwright + screenshot plan (`e2e/homepage.spec.ts`)
- Drive the teaser with a mocked function response containing one `verified`, one `unverifiable`, one `fabricated` source (route-intercept the Tier-2 fetch). Assert: verified badge has the lime/ok class; the fabricated/unverifiable badges do NOT have the verified class; the "N of M verified" summary text is present. Capture a screenshot of the verdict list.
- **CRT/grain headless-hang caveat:** the site's persistent CRT/grain overlay (`.grain`, animated canvases in `GoblinMesh`/`HeroScan`) can hang or flake a headless Playwright run and bloat screenshot diffs. Mitigation, in order: (1) force `prefers-reduced-motion: reduce` and disable the grain/CRT layer for the run (the site already ships a reduced-motion path per `web/AGENTS.md`); (2) `await` network-idle + the verdict badge selector before asserting/screenshotting rather than a fixed sleep. **Deterministic fallback if headless still hangs:** rely on the Vitest `citationVerdictCopy` unit tests as the gating assertion and inspect a single non-animated screenshot manually (or via `preview_inspect`/DOM-class assertion), exactly as the repo's existing `_qa_gate.mjs` / `_verify.mjs` screenshot scripts do — the badge *class/verdict* (DOM-level, deterministic) is the source of truth, not pixel diffing the animated canvas.

---

## Prerequisites / blocked-on

**Implementable + fully unit-testable now (no owner resources): the entire pipeline lane and the functions/web *code* + their offline tests.** All pipeline tests, function tests, and web Vitest tests run keyless/offline against stubbed `httpx`/`fetch`, so the eval gate and CI can go green without any credential.

Blocked-on owner resources for *live verification + deploy + persistence* (these gate the live behavior and the Supabase migration, not the code or its unit tests):
- **Supabase project + a base `citations` table** (and `doctl`/Supabase CLI to apply the migration). The migration file can be written + reviewed now; applying it needs the project. The migration assumes a `public.citations` table — if no prior spec creates it, this spec's migration guards a `create table if not exists`.
- **DigitalOcean Functions deploy** (`doctl`, the namespace, `functions/.env`) to ship the Tier-2 verifier live. Code + offline tests don't need it.
- **`PERPLEXITY_API_KEY`** — already required for any live Tier-2 run; the verifier piggybacks on the existing live path. Absent ⇒ Tier-2 still honestly degrades.
- **`BING_SEARCH_API_KEY`** (optional, indexed-source evidence). Absent ⇒ that sub-check is skipped and recorded `indexed: null`, never a failure. Not required for any test.
- Other specs: none hard-required; this lands cleanly on the current spine. If a separate "supabase-citations-base" spec lands first, this migration `alter`s its table instead of creating one.

Because the **live network + deploy + Supabase persistence cannot be implemented AND tested end-to-end without owner credentials and infrastructure**, this item is **blocked = true**. (The offline pipeline lane is the part that can merge first behind the graph-keeper + integrity-reviewer gate.)

## Honest-broker notes

- **`unverifiable` is the load-bearing honesty primitive.** A WAF-blocked / timed-out / rate-limited source is `unverifiable`, never `fabricated` and never `verified` — identical to the rule that an unreadable/JS-rendered/WAF-blocked *site* is never scored 0. Only definitive non-existence (404/410/NXDOMAIN, or a 200 that contradicts the claim) is `fabricated`. Default verdict everywhere (state, migration, mock) is `unverifiable`.
- **No unverified citation is ever rendered as proven** — enforced in three places: the storage default, the eval metric, and the dashboard/AI-prompt copy. This is the new eval invariant.
- **Schema + llms.txt stay hygiene, never citation levers.** This feature verifies *engine* citations; it does not promise that fixing schema produces citations. No metric is fabricated; we count and check real URLs only.
- **Nothing auto-deploys / auto-sends.** The migration, the function deploy, and any live run are human-gated (graph-keeper for `pipeline/goblin/`, integrity-reviewer for anything a prospect reads). The verifier only *reads* public URLs (HEAD/GET) — it never posts, submits, or mutates anything.
- **Mock/sample paths read as illustrative.** Mock verification stamps `unverifiable` + explicit mock evidence; the dashboard labels sample data illustrative. A mock verdict is never shown as a real `verified`.
- **The refund still guarantees the work, never a number.** Verification makes our citation count *honest*; it does not promise any particular fabricated-rate or citation count for the client.
- **No secrets in artifacts.** `BING_SEARCH_API_KEY` / `PERPLEXITY_API_KEY` are never echoed; verification evidence strings are sanitized (status + reason only).
- **Service/gov sites:** verification is content-agnostic — it checks whether a cited URL exists and supports the claim. It never tells a service/gov site it's "missing Product schema" (that logic is untouched).

## Out of scope

- Verifying citations *inside the client's own published content* (this layer verifies the URLs *answer engines* cite, not the client's outbound links).
- Re-writing or auto-correcting a fabricated citation (we annotate + surface; a human decides).
- A full crawl / archive of cited pages (single bounded HEAD/GET per distinct canonical URL; no recursive fetch, no rendering — JS-rendered pages that 200 but need a browser are `unverifiable`, consistent with the SPA blind-spot rule).
- Screenshot/visual-regression of the animated CRT/grain layer (deterministic DOM-class assertions are the gate; see the headless-hang caveat).
- Bing/Google *ranking* signals beyond a boolean indexed-source presence check (ranking is the measurement-loop's job, not the verifier's).
- Persisting full page bodies of cited sources (we store the verdict + canonical URL + short evidence string only).
- A standing background re-verification cron (one-shot per scan run; periodic re-verification is a future item).
