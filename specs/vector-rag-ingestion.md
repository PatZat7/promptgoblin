# Vector RAG ingestion

Make the `pgvector` store from **`supabase-pgvector-schema`** actually *useful* to
a scan: acquire raw page content (with an honest per-attempt status), normalize it
into clean text + provenance, chunk + embed it (one fixed model that matches the
schema's `vector(1536)`, upserted by content hash so rescans never duplicate),
**retrieve** the most-relevant client / competitor / source chunks for each
visibility gap, and surface those chunks **with provenance** in both the report and
the paste-ready AI prompt. A refresh cadence expires stale content per segment and
**never** lets a stale chunk be used without a `cached` label.

This is the *consumer* of the `supabase-pgvector-schema` spec (which owns the
table DDL + migrations). This spec owns the **acquire → normalize → chunk/embed →
retrieve → refresh** code path that reads and writes those tables. It mirrors the
existing pipeline ethos: a small pure core that is offline-testable with **zero
keys, zero network**, plus a thin live layer that degrades honestly.

Retrieval is a **grounding aid for already-measured gaps** — it gives a human (and
the client's AI) the real source text behind a gap. It is **not** a new citation
lever and never produces or implies a citation number.

## Goal

- **Acquire**: record every crawl attempt as a row in `crawl_pages` with an honest
  `source_type` (`static_http | browser_render | sitemap_export |
  search_console_export | bing_export | client_upload | cms_api`) and a truthful
  `status` (`ok | blocked | unreachable | manual_needed`). A WAF block or
  SPA/JS-rendered blind spot is `blocked` / `manual_needed`, **never** silently
  dropped and **never** stored as empty-but-`ok`.
- **Normalize**: from a stored `ok` page derive `title`, `meta_description`,
  `headings[]`, `body_text`, and `json_ld[]`, plus provenance (url, source_type,
  fetched_at, http_status). No DOM dependency — reuse the regex extractors already
  in `recon.py` / `hygiene.js`.
- **Chunk + embed**: split normalized text into bounded chunks, embed each with a
  **single fixed model** (`text-embedding-3-small`, 1536-dim → matches the schema's
  `vector(1536)`), and **upsert by content hash** so an unchanged chunk on a rescan
  updates `last_seen_at` instead of inserting a duplicate.
- **Retrieve**: for each `Gap`, fetch the top-k relevant chunks across the client,
  its competitors, and known sources, each carrying full provenance. Attach them to
  the gap and into the report + AI prompt.
- **Refresh cadence**: expire chunks whose page is older than a per-segment TTL;
  a retrieval that can only return expired content returns it **labeled `cached`
  (with the staleness age)**, never silently.
- Keep the whole pure core deterministic and testable with **no Supabase, no
  embeddings key, no network** (a fake store + a deterministic fake embedder).

## Files touched (exact paths + which repo)

> Cross-repo (`multi`). The pipeline is a **sibling git repo** under `pipeline/`;
> the marketing-site repo is `promptgoblin` (root) with the DO functions in
> `functions/`. The table DDL itself is owned by **`supabase-pgvector-schema`** and
> is **not** redefined here.

| Path | Repo | Change |
|---|---|---|
| `pipeline/goblin/rag/__init__.py` | **pipeline** | New `rag` package (sibling of `nodes/`). |
| `pipeline/goblin/rag/store.py` | **pipeline** | `VectorStore` protocol + `SupabaseVectorStore` (live, lazy `supabase`/`httpx`) + `InMemoryVectorStore` (deterministic, test/mock). CRUD over `crawl_pages` + `page_chunks`. |
| `pipeline/goblin/rag/acquire.py` | **pipeline** | `acquire_page(url, *, source_type, store, settings)` → upserts a `crawl_pages` row with honest `status`. Reuses `_fetch.fetch_html` / `maybe_render`; wraps the non-HTTP `source_type`s (uploads/exports) as record-only ingests. |
| `pipeline/goblin/rag/normalize.py` | **pipeline** | `normalize_page(html, url) -> NormalizedPage` (title/meta/headings/body/json_ld + provenance). Pure, regex-based, no network. |
| `pipeline/goblin/rag/chunk.py` | **pipeline** | `chunk_text(normalized) -> list[Chunk]` + `content_hash(text)` (sha256). Deterministic, bounded chunk size/overlap. |
| `pipeline/goblin/rag/embed.py` | **pipeline** | `Embedder` protocol; `OpenAIEmbedder` (model pinned `text-embedding-3-small`, dim 1536) + `HashEmbedder` (deterministic 1536-dim fake for tests/mock). `EMBED_MODEL` / `EMBED_DIM` constants asserted against `vector(1536)`. |
| `pipeline/goblin/rag/ingest.py` | **pipeline** | `ingest_page(url, *, source_type, store, embedder, settings)` orchestrator: acquire → normalize → chunk → embed → upsert-by-hash. Returns an honest `IngestResult` (`status`, counts, skips). |
| `pipeline/goblin/rag/retrieve_chunks.py` | **pipeline** | `retrieve_for_gap(gap, *, store, embedder, settings) -> list[RetrievedChunk]` with provenance + `cached`/staleness labeling. |
| `pipeline/goblin/rag/refresh.py` | **pipeline** | `expire_stale(store, *, now, settings)` (per-segment TTL) + `_ttl_days_for_segment`. |
| `pipeline/goblin/config.py` | **pipeline** | Add settings: `supabase_url`, `supabase_service_key`, `embeddings_api_key`, `rag_enabled` (default OFF), `rag_top_k`, `rag_chunk_chars`, `rag_chunk_overlap`, per-segment TTL defaults. All env-driven, empty == disabled. |
| `pipeline/goblin/state.py` | **pipeline** | Add a `RetrievedChunk` TypedDict and an optional `gap["evidence"]` convention (list of `RetrievedChunk`); document the `rag_*` state keys (additive, `total=False`). |
| `pipeline/goblin/nodes/recommend.py` | **pipeline** | When `settings.rag_enabled`, attach `retrieve_for_gap(...)` evidence to each gap before snippet generation (best-effort; absent store → unchanged behavior). |
| `pipeline/goblin/nodes/ship_pr.py` | **pipeline** | `_render_markdown` + `_render_ai_prompt` render an **Evidence / sources** block per fix with provenance + any `cached (Nd old)` label. |
| `pipeline/.env.example` | **pipeline** | Document `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `EMBEDDINGS_API_KEY`, `GOBLIN_RAG_ENABLED`, and the RAG tunables. No real secret committed. |
| `pipeline/requirements.txt` | **pipeline** | Add `supabase>=2.0` (or raw `httpx` PostgREST — see Design) and `openai>=1.0` under the existing **optional, lazy-imported** block. |
| `pipeline/tests/test_rag_*.py` | **pipeline** | New pytest files (one per module, see Unit-test plan). |
| `supabase/migrations/0005_crawl_acquisition_fields.sql` | **supabase** | **Additive** migration layered on `0003` (see §0): add `crawl_pages.source_type` + `crawl_pages.acquire_status` (4-value), normalized columns (`title`, `meta_description`, `headings`, `body_text`, `json_ld`, `segment`, `last_seen_at`); add `page_chunks.content_sha256` + `last_seen_at` + `expired` + `embed_model` + `segment`, the `unique(content_sha256, owner_user_id)` upsert key, and the `match_page_chunks` similarity RPC. **Owned jointly with `supabase-pgvector-schema` — must be co-reviewed.** |
| `functions/lib/rag-source-type.js` | **promptgoblin** (`functions`) | Tiny shared constants module exporting the canonical `SOURCE_TYPES` + `ACQUIRE_STATUS` enums so the JS scan path and Tier-1 acquisition use the **exact same** vocabulary as the Python side. (No write to Supabase from the function in v1 — see Out of scope.) |
| `functions/test/scan.test.js` | **promptgoblin** (`functions`) | Assert the JS enum constants match the Python canonical list (drift guard). |

No marketing-SPA (`web/`, `app.jsx`) UI is added in this spec (see Out of scope).

## Design

### 0. Where this sits (and the reconciliation with `supabase-pgvector-schema`)

`supabase-pgvector-schema` (migration `0003_crawl_and_vectors.sql`) **already
exists** and is the source of truth for the base tables. It provisions:

```sql
crawl_pages(id, run_id, owner_user_id, url, normalized_url, content_type,
            status_code, content_hash, raw_html, rendered_text, schema_found jsonb,
            fetched_at, unique(run_id, url))
page_chunks(id, run_id, owner_user_id, source_url,
            source_type text check (source_type in
              ('client','competitor','research','upload','sitemap','cms')),
            chunk_index, content, token_count, hash, embedding vector(1536),
            metadata jsonb, fetched_at)
-- ivfflat index: page_chunks_embedding_idx (vector_cosine_ops, lists=100)
-- RLS: owner_user_id = auth.uid() on every row/query (multi-tenant safe)
```

**Two reconciliations this spec must own** (the backlog task's requested vocabulary
diverges from what `0003` shipped — flag this in schema review, do not silently
pick one):

1. **`source_type` vocabulary.** The task asks for an *acquisition-channel* set
   (`static_http | browser_render | sitemap_export | search_console_export |
   bing_export | client_upload | cms_api`), but `0003` put a *role/origin* set on
   `page_chunks` (`client | competitor | research | upload | sitemap | cms`). These
   answer **different questions** — "how did we fetch it" vs "whose content is it."
   Resolution: keep the existing `page_chunks.source_type` (role) **unchanged**, and
   add the acquisition channel as a **new column `crawl_pages.source_type`** with the
   7-value channel check. The retrieval `role` (client/competitor/source) is derived
   at retrieval time from **`owner_user_id` + domain match** (client's domain →
   `client`; a listed competitor domain → `competitor`; else → `source`) — **never**
   from the `crawl_pages.source_type` *channel* vocabulary (see §6). The
   channel/provenance comes from `crawl_pages.source_type` and travels separately.
   The legacy `page_chunks.source_type` *role* column may be stamped at ingest as a
   hint (mapping `research → "source"` for the report label), but it is **recomputed**
   per scan from owner + domain because a domain's role is scan-relative.
2. **Honest acquisition status.** `0003` records only `status_code` (int). The task
   needs `ok | blocked | unreachable | manual_needed`. Resolution: add
   `crawl_pages.acquire_status` (4-value check) **derived from** `status_code` +
   body-readability, so the int stays the raw record and the enum is the honest
   verdict. (Named `acquire_status` — not `status` — to avoid colliding with the
   `runs.status` / `recommendations.status` vocabularies already in the schema.)

The **additive** migration `0005_crawl_acquisition_fields.sql` (owned here,
co-reviewed with the schema spec) adds, **without altering `0003`'s existing
columns or the RLS predicate**:

```sql
alter table crawl_pages
  add column source_type text check (source_type in
    ('static_http','browser_render','sitemap_export','search_console_export',
     'bing_export','client_upload','cms_api')),
  add column acquire_status text check (acquire_status in
    ('ok','blocked','unreachable','manual_needed')),
  add column segment text,                         -- inferred ICP segment (nullable)
  add column title text, add column meta_description text,
  add column headings jsonb, add column body_text text, add column json_ld jsonb,
  add column last_seen_at timestamptz default now();

alter table page_chunks
  add column content_sha256 text,                  -- upsert key (= chunk.content hash)
  add column embed_model text,                     -- pinned model stamp
  add column segment text,
  add column last_seen_at timestamptz default now(),
  add column expired boolean not null default false;

-- rescans never duplicate: upsert on (content_sha256, owner_user_id) keeps RLS-safe
create unique index page_chunks_hash_owner_idx
  on page_chunks (content_sha256, owner_user_id);

-- similarity RPC (RLS-respecting): cosine top-k over a tenant's chunks
create function match_page_chunks(
  query_embedding vector(1536), match_domains text[], match_count int,
  include_expired boolean) returns setof page_chunks ...;  -- SECURITY INVOKER
```

All column adds are nullable / defaulted, so `0003`-shaped rows stay valid and the
schema-spec acceptance criteria are unaffected.

### 1. Store abstraction (`rag/store.py`)

A `VectorStore` Protocol with two impls so the core is testable offline (mirrors the
`MockClient` / real-client split in `llm_clients.py`):

```python
class VectorStore(Protocol):
    def upsert_page(self, page: CrawlPage, *, run_id, owner_user_id) -> str: ...  # page_id
    def upsert_chunks(self, chunks: list[ChunkRow]) -> int: ... # upsert-by-hash; returns #inserted
    def touch_chunks(self, hashes: list[str], *, owner_user_id, now) -> int: ...  # bump last_seen_at
    def search(self, query_embedding: list[float], *, domains: list[str],
               top_k: int, include_expired: bool) -> list[ChunkRow]: ...
    def expire_older_than(self, cutoff_by_segment: dict[str, datetime], now) -> int: ...
```

- `SupabaseVectorStore`: lazy-imports `supabase` (or calls PostgREST/`rpc` via
  `httpx`, same lazy-guard style as the provider SDKs). `search` calls the
  `match_page_chunks` RPC (added in `0005`, see §0) ordered by cosine distance; the
  RPC is `SECURITY INVOKER` so the RLS predicate (`owner_user_id = auth.uid()`)
  still scopes results to the tenant — a similarity search can never cross tenants.
  Upserts pass `run_id` + `owner_user_id` (both required by the `0003` schema).
  Never raises into the graph — on any error it logs an honest note and returns
  `[]` / a `manual_needed`-style degrade.
- `InMemoryVectorStore`: dicts keyed by `(content_sha256, owner_user_id)`; `search`
  does brute-force cosine over stored vectors, filtered to the requested domains.
  Fully deterministic, **no network, no RLS engine** (it simulates tenant scoping by
  the owner key), used by every test and by `--mock`.

### 2. Acquire (`rag/acquire.py`)

`acquire_page(url, *, source_type, store, settings, now, html=None) -> CrawlPage`:

- **HTTP source types** (`static_http`, `browser_render`): reuse
  `_fetch.fetch_html` (and `maybe_render` when `source_type == browser_render` and
  `settings.render_fallback`). The **actual `_fetch.fetch_html` contract** (verified
  against `pipeline/goblin/nodes/_fetch.py`) is:

  ```python
  fetch_html(domain: str, timeout: float = 15.0) -> tuple[str | None, str]
  # returns (html, note)
  #   (html_str, "fetched https://host (200)")  on a 200 with a non-empty body
  #   (None,     "could not read <domain> (all hosts tried: ...)")  otherwise —
  #     network error, WAF block, non-200 status, OR empty body. Never raises;
  #     it tries the apex host then www.<apex> before returning (None, note).
  ```

  `fetch_html` returns **`html: str | None`** (None — *not* `""` — signals
  unreadable) and a human-readable **`note: str`**; it does **not** surface the raw
  HTTP code, so `acquire_page` records `status_code=200` only on the `(html, note)`
  success branch and otherwise derives the honest verdict from the `None` + note.
  Map outcomes to an **honest `acquire_status`** (the raw `status_code` int from
  `0003` is recorded where known):
  - `(html, note)` with non-empty `html` → `acquire_status="ok"`, `status_code=200`,
    note = the `_fetch` note.
  - `(None, note)` where the note/transport indicates a WAF/403/429/503/
    Cloudflare-challenge block → `acquire_status="blocked"`, `status_code` = the real
    code when known (else null), note = the `_fetch` note verbatim. **Never** stored
    as `ok` with empty body; **never** scored 0.
  - `(None, note)` from a network error / all hosts failing →
    `acquire_status="unreachable"`, note = the `_fetch` note.
  - `(html, note)` 200 but body is SPA-empty (`body_text==""` after `normalize_page`,
    see orchestration below) → `acquire_status="manual_needed"` with note
    "JS-rendered/SPA — static fetch blind spot; needs browser_render or
    client_upload." (The same blind-spot honesty we caught on our own site.)
- **Export / upload source types** (`sitemap_export`, `search_console_export`,
  `bing_export`, `client_upload`, `cms_api`): the caller passes the already-obtained
  `html`/text/records; `acquire_page` records it `acquire_status="ok"` (or
  `manual_needed` if empty) and stamps `source_type` so provenance shows it came
  from a human-supplied export, not a live crawl. These never fabricate a fetch.
- **Orchestration inside `acquire_page` (SPA-empty detection happens here).** After a
  successful `(html, note)` 200 body, `acquire_page` calls **`normalize_page` inside
  acquire** (not later in `ingest`) purely to compute `body_text` and decide the
  honest status:
  - if `normalize_page(html, url, ...).body_text` is non-empty → `acquire_status="ok"`
    and `acquire_page` returns the `CrawlPage` carrying the normalized fields so
    `ingest` does **not** re-normalize.
  - if `body_text` is empty (SPA shell — JS-rendered, static fetch blind spot) →
    `acquire_status="manual_needed"` with the blind-spot note, and **no chunks are
    created** (ingest returns early on a non-`ok` status per §5 step 1). The page
    is still upserted as a durable `manual_needed` record; it is **never** stored as
    empty-but-`ok` and **never** scored 0.

  This keeps SPA-empty detection authoritative in one place: `acquire_status` is the
  honest verdict, and `ingest` trusts it rather than re-deciding readability.
- Always upserts the `crawl_pages` row scoped by `(run_id, url)` per `0003` (so a
  blocked/unreachable/manual_needed attempt is a durable, auditable record), sets
  `fetched_at = now`, bumps `last_seen_at`.

### 3. Normalize (`rag/normalize.py`)

`normalize_page(html, url, *, source_type, http_status, fetched_at) ->
NormalizedPage` — pure, regex-based, reusing the proven extractors:

- `title` via `recon._RE_TITLE`; `meta_description` via `recon._RE_META_DESC`;
  headings via an `<h1..h6>` regex; `body_text` = tag-stripped + whitespace-
  collapsed text (cap length); `json_ld` via the existing JSON-LD extraction
  (`hygiene.js extractJsonLdTypes` analogue / a `<script type=application/ld+json>`
  regex + `json.loads` guard).
- `NormalizedPage` carries **provenance**: `{url, domain, source_type, http_status,
  fetched_at}`. Provenance travels with every downstream chunk.
- Empty/SPA body → returns a normalized page with `body_text=""` so the caller flips
  `acquire` status to `manual_needed`. **Never** invents text.

### 4. Chunk + embed (`rag/chunk.py`, `rag/embed.py`)

- `chunk_text`: deterministic fixed-size windows (`rag_chunk_chars`, default ~1200
  chars; `rag_chunk_overlap` default ~150), split on paragraph/sentence boundaries
  where possible. Each `Chunk` = `{chunk_index, content, content_sha256}`.
- `content_hash(text) = sha256(text.strip().lower-normalized)` — written to
  `page_chunks.content_sha256`, the upsert key (alongside `0003`'s legacy `hash`
  column, kept populated for backward-compat).
- `EMBED_MODEL = "text-embedding-3-small"`, `EMBED_DIM = 1536`. A module constant +
  an `assert EMBED_DIM == 1536` so a model swap that breaks `vector(1536)` fails
  loudly at import, not silently at insert.
- `OpenAIEmbedder` lazy-imports `openai`, embeds in batches, pins the model, and
  stamps `embed_model` on every chunk row (so a future model change is detectable
  and re-embeddable). `HashEmbedder` maps text → a deterministic 1536-float vector
  (seeded by the content hash) for tests/mock — clearly a fake, never presented as a
  real embedding.

### 5. Ingest orchestrator (`rag/ingest.py`)

`ingest_page(...) -> IngestResult`:
1. `acquire_page` → if status != `ok`, return early with that honest status (the
   `crawl_pages` row still persisted). No chunks for a blocked / unreachable /
   manual_needed (SPA-empty) page — `acquire_page` has already run `normalize_page`
   internally to make that call, so an empty-body SPA never reaches chunking.
2. Reuse the normalized fields `acquire_page` already produced (`ok` implies
   `body_text` is non-empty) → `chunk_text` → `content_hash` each chunk. (No second
   `normalize_page` call: acquire is the single place that normalizes + judges
   readability.)
3. For each chunk hash already present (same `domain`): `touch_chunks` (bump
   `last_seen_at`, mark `expired=false`) instead of re-embedding — **rescans don't
   duplicate and don't re-spend embedding credits**.
4. Embed only the new/changed chunks; `upsert_chunks`.
5. `IngestResult = {url, status, chunks_total, chunks_new, chunks_touched,
   chunks_skipped, note}` — all real counts, no fabrication.

### 6. Retrieve (`rag/retrieve_chunks.py`)

`retrieve_for_gap(gap, *, store, embedder, settings, now) -> list[RetrievedChunk]`:

- Build the query string from the gap: `gap["query"]` (+ `gap["detail"]` for
  non-query-scoped kinds). Embed it once.
- `domains = [client] + gap["competitors"] + known_source_domains` so a gap returns
  the client's own relevant text **and** the competitor/source text that wins the
  surface (the "what they have that we don't" evidence).
- **`RetrievedChunk.role` derivation (honest-broker binding — load-bearing).** `role`
  answers **"whose content is this"** and is derived **only** from
  `owner_user_id` + **domain match against the gap context**, computed at retrieval
  time:
  - `chunk.domain == client_domain` (the scan's subject for this `owner_user_id`)
    → `role = "client"`.
  - `chunk.domain ∈ gap["competitors"]` (a competitor domain) → `role = "competitor"`.
  - otherwise (any known-source / research / export domain that is neither the client
    nor a listed competitor) → `role = "source"`.

  `role` is **NEVER** derived from `crawl_pages.source_type` — that column is the
  acquisition **channel** vocabulary (`static_http | browser_render | sitemap_export
  | search_console_export | bing_export | client_upload | cms_api`) and answers
  **"how did we fetch it,"** a different question entirely. Channel never implies
  whose content it is (e.g. a `client_upload` *channel* could carry a competitor's
  page the client supplied; a `static_http` fetch could be the client's own site).
  Conflating the two is the exact mismatch §0 reconciliation #1 exists to prevent.
  The legacy `page_chunks.source_type` *role* column (`client | competitor | research
  → source`) from `0003` may be stamped at ingest as a **hint**, but the
  retrieval-time `role` is **recomputed** from owner + domain and is authoritative
  (the stored hint is never trusted blind, since a domain's role is scan-relative —
  the same source domain is `competitor` for one client and `source` for another).
  `role` is **ALWAYS** populated and **unambiguous** — there is no `null`/unknown
  branch: a chunk whose domain matches neither client nor any listed competitor
  deterministically falls through to `"source"`.
- Channel/provenance comes from the joined `crawl_pages.source_type` and is carried
  **separately** on the result as `source_type` — it is shown as provenance, never
  used to compute `role`.
- `store.search(..., top_k=settings.rag_top_k, include_expired=False)`. If that
  returns **nothing** but expired rows exist, re-search with `include_expired=True`
  and tag each result `cached=True` + `stale_age_days`.
- `RetrievedChunk = {content, score, domain, role: client|competitor|source, url,
  source_type, fetched_at, cached: bool, stale_age_days: int|None}` — where `role`
  is the owner+domain-derived role above and `source_type` is the **channel**
  (provenance only, never the role source).
- Attach to `gap["evidence"]`. Never invents a citation; evidence is *source text we
  actually stored*, with where + when it came from.

### 7. Refresh cadence (`rag/refresh.py`)

- `_ttl_days_for_segment(segment)` — per-segment TTL (e.g. finance shortest, then
  news, then general default longest), env-overridable. Same **inferred-segment**
  honesty as the freshness spec: segment is inferred, never asserted.
- `expire_stale(store, *, now, settings)`: marks chunks whose `fetched_at <
  now - ttl(segment)` as `expired=true` (does **not** delete — provenance is kept;
  a re-ingest revives them). Returns the count expired.
- Hard rule wired into retrieval: **expired content is never returned unlabeled.**
  Any path that surfaces an expired chunk sets `cached=True` and the age, and the
  report/AI-prompt print `cached (Nd old)`.

### 8. Wiring into the existing graph

- `recommend.py`: behind `if settings.rag_enabled:`, after gaps are built and before
  `_snippet_for`, call `retrieve_for_gap` per gap and stash `gap["evidence"]`.
  Best-effort: any store error → log note, leave `evidence=[]`, behavior otherwise
  identical (the eval gate path with `rag_enabled=False` stays **byte-identical**).
- `ship_pr.py`: `_render_markdown` adds an "Evidence / sources" sub-block per fix;
  `_render_ai_prompt` adds, under each `FIX`, a `SOURCES (verify before relying):`
  list of `role · url · source_type · fetched_at [· cached Nd old]`. The AI-prompt
  context paragraph keeps the existing honest line ("hygiene … do NOT guarantee AI
  citations") unchanged — evidence is grounding, not a promise.

### 9. JS-side vocabulary parity (`functions/lib/rag-source-type.js`)

The DO scan functions don't write Supabase in v1, but the scan **does** classify its
own fetch outcome (ok / blocked_by_waf / could-not-read). Export canonical
`SOURCE_TYPES` (the 7-value channel set) and `ACQUIRE_STATUS` constants so when the
function later persists a `crawl_pages` row the vocabulary already matches Python +
the `0005` check constraints 1:1. A `scan.test.js` case asserts the JS arrays equal
the Python canonical list (drift guard, copied as a literal in the test).

## Acceptance criteria

- [ ] `acquire_page` writes a `crawl_pages` row for **every** outcome with an
      `acquire_status` in `{ok, blocked, unreachable, manual_needed}` and the correct
      `source_type` from the 7-value channel set; a WAF block is `blocked` (not `ok`,
      not dropped, **never scored 0**); an SPA/empty-body 200 is `manual_needed` with
      the blind-spot note.
- [ ] The `0005` migration is **purely additive** — every `0003` column and the RLS
      predicate are unchanged, and a `0003`-shaped row stays valid (the
      `supabase-pgvector-schema` acceptance criteria still pass).
- [ ] `normalize_page` extracts title/meta/headings/body/json_ld + provenance from
      real HTML, returns empty `body_text` (not invented text) for an SPA shell.
- [ ] `chunk_text` is deterministic; `content_hash` is stable across runs;
      re-ingesting unchanged content yields `chunks_new == 0` and
      `chunks_touched == chunks_total` (no duplicate rows).
- [ ] `EMBED_DIM == 1536` and `EMBED_MODEL == "text-embedding-3-small"`; a chunk row
      stores `embed_model`; an import-time assert guards the `vector(1536)` match.
- [ ] `retrieve_for_gap` returns top-k chunks across client + competitors + sources,
      each with provenance (`url`, `source_type`, `fetched_at`, `role`); ranking is
      deterministic with the `HashEmbedder` + `InMemoryVectorStore`.
- [ ] `RetrievedChunk.role` is **always populated and unambiguous** (one of
      `client | competitor | source`, no `null`/unknown) and is derived **only** from
      `owner_user_id` + domain match (client domain → `client`; listed competitor
      domain → `competitor`; else → `source`) — **never** from the
      `crawl_pages.source_type` *channel* vocabulary
      (`static_http | browser_render | …`). A test proves a chunk acquired via a
      `client_upload`/`browser_render` channel still gets the correct owner+domain
      `role` (role is never confused with channel/`source_type`).
- [ ] When only expired chunks match, results are returned **labeled** `cached=True`
      with a real `stale_age_days`; a fresh-only search never returns expired rows.
- [ ] `expire_stale` flags (not deletes) chunks past their per-segment TTL; segment
      is inferred and the note says so.
- [ ] With `rag_enabled=False`, the pipeline output (gaps, recommendations, report,
      AI prompt) is **byte-identical** to today — the 186 pytest + eval gate stay
      green.
- [ ] With `rag_enabled=True` + `InMemoryVectorStore` + `HashEmbedder`, gaps gain a
      non-empty `evidence[]` and `ship_pr` renders provenance + any `cached` label.
- [ ] The report/AI-prompt evidence block **never** asserts a citation number and
      keeps the existing "hygiene is not a proven citation lever" line.
- [ ] JS `SOURCE_TYPES` / `ACQUIRE_STATUS` equal the Python canonical lists and the
      `0005` check-constraint values (drift-guard test passes).
- [ ] All new core tests run with **zero keys, zero network, no Supabase**.

## Unit-test plan

All pipeline tests use `InMemoryVectorStore` + `HashEmbedder` + a fixed `now` →
deterministic, no network, no keys (the repo ethos). Live `SupabaseVectorStore` /
`OpenAIEmbedder` paths are exercised only via monkeypatched fakes (same approach as
the existing `html_from_state` / `fetch_html` monkeypatch tests).

### `pipeline/tests/test_rag_acquire.py`
- `test_acquire_ok_200` — patched `fetch_html` returns `(html, "fetched … (200)")` →
  row `acquire_status=="ok"`, `status_code==200`, `source_type=="static_http"`.
- `test_acquire_waf_blocked_not_ok_not_zero` — patch `_fetch.fetch_html` to return
  `(None, "could not read example.com … blocked")` (the real `(html: str|None,
  note: str)` contract, `None` body) → `acquire_status=="blocked"`, body empty,
  **no score written / never 0**, the `_fetch` note preserved verbatim, and a durable
  `crawl_pages` row still upserted (not dropped, not empty-but-`ok`).
- `test_acquire_unreachable` — patched `fetch_html` returns `(None, "could not read
  …")` from an all-hosts-fail/network error → `acquire_status=="unreachable"`.
- `test_acquire_spa_empty_body_manual_needed` — patched `fetch_html` returns
  `(html, note)` for an SPA shell so `acquire_page`'s internal `normalize_page`
  yields `body_text==""` → `acquire_status=="manual_needed"`, blind-spot note present,
  **0 chunks created** (verified via the orchestrator), row persisted.
- `test_acquire_client_upload_records_provenance` — `source_type="client_upload"`
  with caller-supplied text → `ok`, provenance shows `client_upload` not a crawl.
- `test_acquire_browser_render_uses_render_fallback` — `source_type=
  "browser_render"` with `render_fallback=True` patched `maybe_render`.

### `pipeline/tests/test_rag_normalize.py`
- `test_normalize_extracts_all_fields` — real HTML fixture → title/meta/headings/
  body/json_ld + provenance all correct.
- `test_normalize_spa_shell_empty_body` — SPA shell → `body_text==""`, no invented
  text.
- `test_normalize_jsonld_malformed_guarded` — broken JSON-LD doesn't raise.

### `pipeline/tests/test_rag_chunk.py`
- `test_chunk_deterministic` — same input twice → identical chunks + hashes.
- `test_content_hash_stable_and_normalized` — whitespace/case variants → same hash.
- `test_chunk_overlap_and_bounds` — chunk sizes within `rag_chunk_chars` + overlap.

### `pipeline/tests/test_rag_embed.py`
- `test_embed_dim_is_1536` and `test_embed_model_pinned`.
- `test_hash_embedder_deterministic` — same text → identical vector across runs.
- `test_import_time_dim_assert` — guard fires if `EMBED_DIM != 1536`.

### `pipeline/tests/test_rag_ingest.py`
- `test_ingest_upsert_by_hash_no_duplicates` — ingest twice → second run
  `chunks_new==0`, `chunks_touched==chunks_total`, store size unchanged.
- `test_ingest_changed_content_reembeds_changed_only` — edit one chunk → only that
  chunk is new.
- `test_ingest_blocked_page_writes_no_chunks` — blocked acquire → 0 chunks, row
  persisted `acquire_status="blocked"`.

### `pipeline/tests/test_rag_retrieve.py`
- `test_retrieve_for_gap_ranks_relevant_chunks` — seeded store → deterministic top-k
  with `HashEmbedder`.
- `test_retrieve_includes_client_competitor_source_roles`.
- `test_retrieve_role_from_owner_domain_not_channel` — seed chunks whose
  `crawl_pages.source_type` *channel* (e.g. `client_upload`, `browser_render`,
  `static_http`) is deliberately **mismatched** to the owner+domain role (a
  competitor's page ingested via `client_upload`; the client's own page via
  `static_http`). Assert `role` is computed from `owner_user_id` + domain match
  (client domain → `client`, listed competitor domain → `competitor`, else
  `source`) and is **never** equal to / inferred from the channel `source_type`.
  Also assert `role` is always one of the 3 values (never `null`/unknown).
- `test_retrieve_fresh_excludes_expired`.
- `test_retrieve_falls_back_to_cached_labeled` — only-expired match → results
  `cached==True` with a real `stale_age_days`.

### `pipeline/tests/test_rag_refresh.py`
- `test_expire_stale_per_segment_ttl` — finance shorter TTL than general; correct
  rows flipped `expired`.
- `test_expire_does_not_delete` — expired rows still present, revivable on re-ingest.
- `test_segment_inferred_note` — note states segment is inferred, not asserted.

### `pipeline/tests/test_rag_wiring.py`
- `test_rag_disabled_is_byte_identical` — run the recommend/ship_pr path with
  `rag_enabled=False` and assert report + AI prompt match the pre-change golden
  (protects the eval gate).
- `test_rag_enabled_attaches_evidence` — gaps get `evidence[]`; `ship_pr` renders
  provenance.
- `test_ai_prompt_no_citation_number` — rendered AI prompt matches **no**
  `/\d+\s*citations?/i` claim and still contains the "not a proven citation lever"
  line.
- `test_cached_label_rendered` — an expired-only evidence chunk renders `cached`
  + age in both markdown and AI prompt.

### `supabase/migrations/0005` (applied to a throwaway Postgres+pgvector in CI, or
deferred to the live-path integration test when no DB is available)
- `test_0005_additive_only` — apply `0003` then `0005`; assert every `0003` column
  still exists with its original type and a `0003`-shaped insert still succeeds
  (additivity guard). Runs only when a Postgres+pgvector test container is present;
  otherwise skipped with an honest skip reason (not a silent pass).

### `functions/test/scan.test.js` (node `assert`, zero keys/network)
- `test source_type/acquire_status enums match python canonical` — JS
  `SOURCE_TYPES` / `ACQUIRE_STATUS` equal a literal copy of the Python lists and the
  `0005` check-constraint values (drift guard).

### UI / Playwright
- **This spec adds no `web/` UI**, so no Playwright run is required.
- **CRT/grain headless-hang caveat (for any future UI follow-up):** the marketing
  site's CRT-scanline / film-grain background animation can hang or flake a headless
  Playwright capture (a never-idle rAF / GPU compositing loop). If a follow-up
  surfaces RAG evidence in the SPA, the deterministic fallback is to assert on the
  rendered **DOM/JSON** (via `preview_inspect` / `preview_eval` against the report
  object) rather than a pixel screenshot, and to disable the grain/CRT layer (a
  `prefers-reduced-motion` / `?nograin` test hook) **before** any screenshot.

## Prerequisites / blocked-on

- **`supabase-pgvector-schema` spec exists** (`specs/supabase-pgvector-schema.md`,
  migration `0003_crawl_and_vectors.sql`) and is the source of truth for the base
  `crawl_pages` / `page_chunks` tables + the ivfflat index + RLS. This spec **layers
  on it** via the additive `0005` migration (§0) — it does **not** redefine the base
  tables.
- **HARD GATE — `supabase-pgvector-schema` co-reviewer must sign off on the §0
  reconciliation BEFORE any Python implementation begins.** No `pipeline/goblin/rag/`
  code is written until the schema co-reviewer has explicitly signed off on the §0
  reconciliation — specifically (a) **channel-vs-role `source_type`** (new
  `crawl_pages.source_type` *channel* column added, existing `page_chunks.source_type`
  *role* column kept unchanged, and retrieval `role` derived from owner+domain, never
  from channel — see §6) and (b) the **`acquire_status` column** (4-value enum derived
  from `status_code` + body-readability, named to avoid colliding with `runs.status` /
  `recommendations.status`). This sign-off is a prerequisite, not a parallel task: a
  schema reconciliation rejected after implementation would force a rewrite of the
  store/acquire/retrieve contracts.
- **Where the `0005` migration is DEFINED.** The full `0005_crawl_acquisition_fields.sql`
  DDL is **defined in this spec (§0)** so the `supabase-pgvector-schema` reviewer can
  pull it verbatim into the `supabase` repo's `supabase/migrations/` during review;
  the migration **file itself lives in the `supabase` repo** (path
  `supabase/migrations/0005_crawl_acquisition_fields.sql`, see Files-touched). This
  spec owns the *content* + the reconciliation rationale; the schema repo owns the
  *committed file* and its application. The two must not diverge — schema review
  reconciles the §0 DDL against the committed file as part of sign-off.
- **BLOCKED — owner resources required to implement AND test the live path:**
  - **The additive `0005_crawl_acquisition_fields.sql` migration must be
    co-reviewed + applied** with the schema owner (it adds `crawl_pages.source_type`
    + `acquire_status` + normalized columns, the `page_chunks` upsert/expiry/embed
    columns, the `unique(content_sha256, owner_user_id)` index, and the
    `match_page_chunks` RPC). The §0 reconciliation (channel vs role `source_type`;
    `acquire_status` vs raw `status_code`) is the **first thing schema review must
    sign off** (the hard gate above — it precedes Python implementation).
  - A **Supabase project** with `pgvector` enabled + `SUPABASE_URL` /
    `SUPABASE_SERVICE_KEY` (owner-provisioned) to apply `0005` and run the live
    integration test.
  - An **embeddings API key** (`EMBEDDINGS_API_KEY`, OpenAI `text-embedding-3-small`).
- **NOT blocked:** the entire pure core (acquire-status mapping via patched fetch,
  normalize, chunk, hash, `HashEmbedder`, `InMemoryVectorStore`, retrieve, refresh,
  wiring) is implementable + fully unit-testable **today with zero keys, zero
  network, no Supabase**. Only the live `SupabaseVectorStore` + `OpenAIEmbedder`
  integration test is gated on the credentials above.
- **No deploy in scope.** Nothing auto-deploys; provisioning Supabase, setting keys
  on the DO Functions namespace, and any migration apply are separate, human-gated
  steps (`doctl` / Supabase dashboard) — not required to implement or unit-test.
- **Cross-repo:** pipeline edits land in the sibling `pipeline/` git repo; the two
  `functions/` files land in `promptgoblin`. Two PRs, shipped together for the enum
  drift-guard to be meaningful.
- **Gate:** `pipeline/goblin/` changes route through **graph-keeper**, and the table
  contract goes through **schema review** (with `supabase-pgvector-schema`).

## Honest-broker notes

- **RAG retrieval is grounding, not a citation lever.** It surfaces the real source
  text behind an already-measured gap so a human (and the client's AI) can act. It
  never produces, implies, or backstops a citation number. The report/AI-prompt keep
  the existing "hygiene removes barriers but does NOT guarantee AI citations; real
  levers are brand mentions + Bing rank" framing verbatim.
- **An unreadable / JS-rendered / WAF-blocked page is NEVER scored 0.** It is stored
  as `blocked` / `unreachable` / `manual_needed` with a truthful note (the same
  blind-spot we caught on our own site), surfaced as a flagged limitation — never an
  empty-but-`ok` row and never a fabricated pass.
- **Provenance is mandatory.** Every retrieved chunk carries where (url +
  source_type) and when (`fetched_at`) it came from; export/upload sources are
  labeled as human-supplied, never dressed up as a live crawl.
- **Stale = labeled, never silent.** Expired content is only ever returned tagged
  `cached (Nd old)`; a default (fresh-only) retrieval excludes it. Expiry marks, it
  does not delete — provenance is preserved.
- **Segment is inferred, not asserted.** Per-segment TTL uses an inferred segment
  (same stance as the freshness spec); we never tell a client what industry they are
  and never tell a service/gov site it's "missing Product schema."
- **No fabricated metrics or sources.** `HashEmbedder` / `InMemoryVectorStore` /
  mock fixtures are clearly illustrative and never reported as real embeddings,
  real retrievals, or real client passes.
- **Nothing auto-deploys / auto-sends.** Ingestion, expiry, and evidence attachment
  are read/write to our own store and into a human-reviewed report; no client site is
  touched and no message is sent. The refund guarantees the **work**, never a
  citation number.

## Out of scope

- The **base** `crawl_pages` / `page_chunks` DDL (`0003`), the ivfflat index, and
  the RLS policies — owned by **`supabase-pgvector-schema`**. This spec only adds the
  **additive `0005`** columns/constraints/RPC it consumes (§0).
- **Writing `crawl_pages` from the DO scan functions** — v1 only adds the shared
  enum module for vocabulary parity; the function persisting rows to Supabase is a
  follow-up (it needs the service key on the DO namespace and its own gating).
- Surfacing RAG evidence in the marketing **SPA / Hero teaser** (`web/`, `app.jsx`)
  — separate UI follow-up; see the CRT/grain Playwright caveat above for when it
  happens.
- **Multi-vector / hybrid (BM25 + vector) retrieval, reranking, and HyDE** — v1 is a
  single dense-vector cosine top-k. Note as a known limitation.
- **Re-embedding on model change / migration tooling** — `embed_model` is stored so a
  swap is *detectable*, but the backfill job is deferred.
- **Crawl scheduling / a standing ingestion worker** — v1 ingests on-demand within a
  scan run; a cron/queue-driven crawler is future work.
- **Search Console / Bing / CMS export *parsers*** — v1 defines the `source_type`s
  and records caller-supplied text/records; the format-specific parsers for those
  exports are a follow-up.
