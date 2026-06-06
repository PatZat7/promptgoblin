# Supabase + pgvector Schema (migrations, RLS, seed fixtures)

Concrete SQL migrations that turn the vault plan
(`ObsidianVault/research/Prompt Goblin - Supabase + Vector DB Plan.md`) into a
real, testable Supabase schema for the approved **Next.js + Supabase** dashboard
on `app.promptgoblin.io`. This spec authors the migrations, the per-client RLS,
illustrative-only seed fixtures, and the RLS isolation tests **now**; running and
verifying them is **blocked** on provisioning a Supabase project (author now,
test later).

## Goal

Persist what the LangGraph pipeline already produces — runs, citations,
competitor citations, crawled pages, embedded page chunks, recommendations,
verification results, and scan-proof artifacts — in Postgres + pgvector, scoped
so **each client reads only its own rows**. Three non-negotiables:

1. **Tenant isolation by `owner_user_id`.** Row-Level Security must make it
   impossible for client A's authenticated session to read client B's rows
   (clients, runs, citations, chunks, artifacts, everything downstream). Proven
   by tests, not asserted.
2. **Schema faithfully mirrors the pipeline data model** in
   `pipeline/goblin/state.py` (`Citation`, `Gap`, `Recommendation`,
   `verifications`) and the finalized `report` snapshot in
   `pipeline/goblin/nodes/ship_pr.py`, so the existing rescan JSON drops in with
   minimal transform. Match existing names (`visibility`, `gaps`, `confidence`,
   `low_confidence`, `snapshot_schema`, `is_client`, `engine_lane`).
3. **Honest-broker by construction.** Every seed row is explicitly marked
   `is_sample = true`; sample metrics are illustrative and can never be queried
   as a real client result. The `run_artifacts` contract from
   `feedback/claude/2026-06-06-visual-gate-spec-reply-claude.md` is folded in
   verbatim (private bucket, signed URLs, `method`/`is_sample` honesty flags).

This spec is **schema + policies + fixtures + tests only**. It does not write the
ETL that loads pipeline output into these tables, the dashboard UI, or any
embedding/retrieval code — those are downstream specs that consume this schema.

## Files touched (exact paths + which repo)

A **new `supabase` repo** (the backlog target repo; does not yet exist in this
workspace). It is a standalone Supabase project scaffold (`supabase init`
layout), kept separate from `promptgoblin/` so migrations version independently
of the site and the pipeline. All paths below are repo-root-relative to that new
`supabase` repo.

| Path | Change |
|---|---|
| `supabase/config.toml` | Supabase CLI project config (project_id placeholder, `db.major_version = 15`, local ports). Created by `supabase init`; commit it. |
| `migrations/0001_extensions.sql` | `create extension if not exists vector;` + `"uuid-ossp"`; pin `vector` ≥ 0.7 in a comment. |
| `migrations/0002_core_tables.sql` | `clients`, `competitors`, `runs`, `citations`, `competitor_citations`. |
| `migrations/0003_crawl_and_vectors.sql` | `crawl_pages`, `page_chunks` (`embedding vector(1536)`), and the `ivfflat` index. |
| `migrations/0004_recs_and_verification.sql` | `recommendations`, `verification_results`. |
| `migrations/0005_run_artifacts.sql` | `run_artifacts` (scan-proof contract) + the private `scan-proof` storage bucket registration. |
| `migrations/0006_updated_at_triggers.sql` | `set_updated_at()` trigger fn + triggers on `clients`. |
| `migrations/0007_rls_enable.sql` | `alter table … enable row level security` + `force row level security` on every table. |
| `migrations/0008_rls_policies.sql` | The per-client `select`/`insert`/`update`/`delete` policies (owner-scoped) for every table, including the storage-objects policy for the `scan-proof` bucket. |
| `seed.sql` | Two illustrative tenants + one sample run each, **every metric row `is_sample = true`**. Loaded by `supabase db reset` for local dev only. |
| `tests/rls/00_setup.sql` | pgTAP install + helper to impersonate a given `auth.uid()` via `request.jwt.claims`. |
| `tests/rls/01_tenant_isolation_test.sql` | pgTAP: client A cannot read/update/delete client B's rows across all tables. |
| `tests/rls/02_sample_flag_test.sql` | pgTAP: every seed metric row carries `is_sample = true`; no seed row reads as real. |
| `tests/rls/03_storage_isolation_test.sql` | pgTAP: `scan-proof` storage objects are readable only by the owning client. |
| `README.md` | How to run `supabase start`, `supabase db reset`, and `supabase test db` locally; blocked-on note for the hosted project. |
| `.github/workflows/db-tests.yml` | CI: spin up local Supabase, `db reset`, run `supabase test db` (the RLS gate). |

**No changes to `promptgoblin/` (web, functions, pipeline).** This is a new repo.
The pipeline-side ETL that writes into these tables, and the dashboard reads, are
explicitly out of scope and will reference this schema, not modify it.

## Design

### Extensions (`0001`)
```sql
create extension if not exists "uuid-ossp";
create extension if not exists vector;   -- pgvector >= 0.7 (Supabase ships it)
```
Use `gen_random_uuid()` (pgcrypto, built into Postgres 13+ / Supabase) for PKs —
matches the vault plan's `default gen_random_uuid()`.

### Tenancy model
Supabase Auth owns identity. The tenancy key is **`clients.owner_user_id uuid
references auth.users(id)`** (one auth user owns one or more client rows; the MVP
assumes 1:1 but the schema allows 1:many). **Every descendant table carries a
denormalized `owner_user_id`** (not just a `client_id` FK) so RLS policies are a
single indexed predicate — `owner_user_id = auth.uid()` — and never require a
recursive join through `runs → clients` inside the policy (which is slow and
error-prone). `client_id` / `run_id` FKs stay for referential integrity; the
denormalized `owner_user_id` is the RLS scope column and is `not null`.

A trigger (`0006`) is **not** used to populate `owner_user_id` on inserts — the
ETL writer sets it explicitly from the parent. RLS `with check` enforces that a
writer can only insert rows whose `owner_user_id = auth.uid()` (see policies).

### Core tables (`0002`)

**`clients`** — mirrors vault plan; `tier` and `icp_segment` constrained.
```sql
create table clients (
  id            uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  slug          text unique not null,
  name          text not null,
  domain        text unique not null,
  icp_segment   text,                       -- e.g. 'saas','gov','service' (free-form; not enum-locked)
  tier          text check (tier in ('free','starter','retainer')),
  is_sample     boolean not null default false,   -- illustrative tenant flag
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on clients (owner_user_id);
```

**`competitors`** — `discovery_confidence` mirrors the recon node's
`competitor_confidence` vocabulary (`low|medium|high|operator`); `auto_discovered`
distinguishes a research inference from an operator-supplied competitor.
```sql
create table competitors (
  id                  uuid primary key default gen_random_uuid(),
  client_id           uuid not null references clients(id) on delete cascade,
  owner_user_id       uuid not null references auth.users(id) on delete cascade,
  domain              text not null,
  display_name        text,
  auto_discovered     boolean not null default false,
  discovery_confidence text check (discovery_confidence in ('low','medium','high','operator')),
  source_note         text,                 -- honest "verify this inference" framing
  is_sample           boolean not null default false,
  created_at          timestamptz not null default now(),
  unique (client_id, domain)
);
create index on competitors (owner_user_id);
```

**`runs`** — one row per scan. `graph_snapshot jsonb` stores the **entire**
finalized `report` dict from `ship_pr.py` verbatim (the rescan contract); the
promoted scalar/jsonb columns are denormalized copies for indexing/dashboards.
Field names match the snapshot exactly.
```sql
create table runs (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references clients(id) on delete cascade,
  owner_user_id    uuid not null references auth.users(id) on delete cascade,
  graph_snapshot   jsonb not null,          -- full ship_pr report (snapshot_schema-versioned)
  snapshot_schema  int not null default 1,  -- mirrors report["snapshot_schema"]
  mode             text not null check (mode in ('mock','live')),   -- report["mode"]
  visibility_score numeric,                 -- client share-of-citations 0..1 (NULL if unscored)
  visibility       jsonb,                   -- domain -> share map (report["visibility"])
  citation_gaps    jsonb,                   -- gaps[kind='citation']
  schema_gaps      jsonb,                   -- gaps[kind='schema']
  stack_profile    jsonb,                   -- tech_stack dict
  a11y_issues      jsonb,                   -- gaps[kind='a11y']
  recs             jsonb,                   -- recommendations (full)
  confidence       text not null default 'high' check (confidence in ('high','low')),
  low_confidence   boolean not null default false,
  blind_spot       text,                    -- honest blocked/SPA/WAF flag; NULL if none
  approved         boolean not null default false,   -- any fix approved by a human
  status           text not null default 'pending'
                     check (status in ('pending','running','needs_review','complete','failed')),
  is_sample        boolean not null default false,
  created_by       uuid references auth.users(id),
  created_at       timestamptz not null default now()
);
create index on runs (owner_user_id);
create index on runs (client_id, created_at desc);
```
`visibility_score` is **nullable on purpose**: a WAF-blocked / JS-rendered /
unreadable site is **never scored 0** — it gets `visibility_score = NULL` and a
human-readable `blind_spot` string (honest-broker; the pipeline already flags the
SPA static-fetch blind spot). A `check` that forbade NULL would force a fake 0.

**`citations`** — mirrors the `Citation` TypedDict + vault columns. `is_client`
comes straight from `Citation.is_client`; `position`/`rank` and `platform`/
`engine` are reconciled to the vault names with the pipeline value mapped in.
```sql
create table citations (
  id            uuid primary key default gen_random_uuid(),
  run_id        uuid not null references runs(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  source_url    text,
  source_title  text,
  source_domain text,                       -- Citation.domain (normalized, no www.)
  platform      text,                       -- Citation.engine: chatgpt|claude|gemini|perplexity
  query_text    text,                       -- Citation.query
  position      int,                        -- Citation.rank (1 = first)
  snippet       text,
  is_client     boolean not null default false,  -- Citation.is_client
  engine_lane   text check (engine_lane in ('chatgpt','google_aio','both')),  -- editorial routing only
  verified      boolean not null default false,
  retrieved_at  timestamptz not null default now()
);
create index on citations (owner_user_id);
create index on citations (run_id);
```

**`competitor_citations`** — vault plan as-is, plus `owner_user_id`.
```sql
create table competitor_citations (
  id                   uuid primary key default gen_random_uuid(),
  run_id               uuid not null references runs(id) on delete cascade,
  owner_user_id        uuid not null references auth.users(id) on delete cascade,
  target_competitor_id uuid references competitors(id) on delete set null,
  source_url           text,
  platform             text,
  query_text           text,
  position             int,
  snippet              text,
  retrieved_at         timestamptz not null default now()
);
create index on competitor_citations (owner_user_id);
create index on competitor_citations (run_id);
```

### Crawl + vectors (`0003`)

**`crawl_pages`** — one row per fetched URL. `status_code` records WAF blocks
(403/429/503) **honestly**; `rendered_text` may be empty for a JS-only SPA — that
is the blind spot to flag, never a 0 score.
```sql
create table crawl_pages (
  id             uuid primary key default gen_random_uuid(),
  run_id         uuid not null references runs(id) on delete cascade,
  owner_user_id  uuid not null references auth.users(id) on delete cascade,
  url            text not null,
  normalized_url text,
  content_type   text,
  status_code    int,                       -- 403/429/503 = blocked, recorded honestly
  content_hash   text,
  raw_html       text,
  rendered_text  text,                      -- may be '' for JS-rendered SPA (blind spot, not 0)
  schema_found   jsonb,                     -- JSON-LD @type values (mirrors state.schema_found)
  fetched_at     timestamptz not null default now(),
  unique (run_id, url)
);
create index on crawl_pages (owner_user_id);
```
(Vault had a bare `url unique`; scoping uniqueness to `(run_id, url)` lets the
same URL recur across runs — required for the rescan/measurement loop.)

**`page_chunks`** — embedded RAG corpus. `vector(1536)` matches the vault plan
(OpenAI `text-embedding-3-small` / Voyage-compatible width). The vault note's
garbled `-window_function_topk` line is dropped (it was a stray artifact).
```sql
create table page_chunks (
  id            uuid primary key default gen_random_uuid(),
  run_id        uuid not null references runs(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  source_url    text,
  source_type   text check (source_type in ('client','competitor','research','upload','sitemap','cms')),
  chunk_index   int not null,
  content       text not null,
  token_count   int,
  hash          text,
  embedding     vector(1536),
  metadata      jsonb,
  fetched_at    timestamptz not null default now()
);
create index on page_chunks (owner_user_id);
create index on page_chunks (run_id);
create index page_chunks_embedding_idx
  on page_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);
```
**ivfflat caveat (documented in the migration):** an ivfflat index must be built
*after* rows exist to pick good centroids, and `lists = 100` suits ~10k–1M rows.
For an empty/seed DB the index is created anyway (valid, just unselective);
`README.md` notes a `reindex` step once real volume lands, and flags HNSW as the
future upgrade. The RLS predicate (`owner_user_id = auth.uid()`) still applies to
every vector query — a similarity search can **never** cross tenants.

### Recommendations + verification (`0004`)

**`recommendations`** — mirrors the `Recommendation` TypedDict
(`id/title/kind/rationale/impact/effort/score/snippet/approved`) plus
`engine_lane` (from the per-platform-rec-tagging spec) and the vault's
`priority/status/human_reviewed/stack_specific`. `kind` allows the full pipeline
vocabulary (`citation|schema|content|seo|a11y|community`), not just the 3 the
docstring lists.
```sql
create table recommendations (
  id             uuid primary key default gen_random_uuid(),
  run_id         uuid not null references runs(id) on delete cascade,
  owner_user_id  uuid not null references auth.users(id) on delete cascade,
  fix_id         text,                      -- pipeline 'FIX-001' id (stable, human-facing)
  title          text,
  kind           text check (kind in ('citation','schema','content','seo','a11y','community')),
  engine_lane    text check (engine_lane in ('chatgpt','google_aio','both')),
  priority       text check (priority in ('low','medium','high')),
  impact         int check (impact between 1 and 5),
  effort         int check (effort between 1 and 5),
  score          numeric,
  stack_specific boolean not null default false,
  snippet        text,
  rationale      text,
  status         text not null default 'proposed'
                   check (status in ('proposed','approved','rejected','shipped','verified','unverified')),
  human_reviewed boolean not null default false,   -- nothing auto-approves
  is_sample      boolean not null default false,
  created_at     timestamptz not null default now()
);
create index on recommendations (owner_user_id);
create index on recommendations (run_id);
```

**`verification_results`** — mirrors the `verifications` state list
(`fix_id/kind/status/verdict/detail/method`). `method` and the status vocabulary
are taken from `state.py`'s LOOP-2 contract.
```sql
create table verification_results (
  id                uuid primary key default gen_random_uuid(),
  run_id            uuid not null references runs(id) on delete cascade,
  owner_user_id     uuid not null references auth.users(id) on delete cascade,
  recommendation_id uuid references recommendations(id) on delete set null,
  method            text check (method in ('playwright_mcp','axe_core','static_fetch','deterministic_fallback','manual')),
  status            text check (status in ('verified','failed','unverifiable','skipped','regressed')),
  passed            boolean,
  verdict           text,                   -- human label
  detail            text,
  evidence          jsonb,
  is_sample         boolean not null default false,
  created_at        timestamptz not null default now()
);
create index on verification_results (owner_user_id);
create index on verification_results (run_id);
```

### Run artifacts / scan-proof (`0005`)

Folds in the contract from
`feedback/claude/2026-06-06-visual-gate-spec-reply-claude.md` **verbatim**, plus
`owner_user_id` for the RLS predicate. Screenshots live in a **private** Supabase
Storage bucket `scan-proof`; this table holds only the bucket-relative path,
never a public URL. The dashboard fetches via short-TTL signed URLs.
```sql
create table run_artifacts (
  id            uuid primary key default gen_random_uuid(),
  run_id        uuid not null references runs(id) on delete cascade,
  client_id     uuid not null references clients(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,   -- RLS scope
  stage         text check (stage in ('before','after','results')),
  viewport      int  check (viewport in (1440,768,375)),
  storage_path  text not null,             -- '<clientId>/<runId>/<stage>@<viewport>.png' — NEVER a public URL
  method        text check (method in ('playwright_mcp','deterministic_fallback')),
  is_sample     boolean not null default false,   -- true until a real run exists
  captured_at   timestamptz not null default now(),
  unique (run_id, stage, viewport)
);
create index on run_artifacts (owner_user_id);
```
Bucket registration (private, not public):
```sql
insert into storage.buckets (id, name, public)
values ('scan-proof', 'scan-proof', false)
on conflict (id) do nothing;
```
A `deterministic_fallback` row is **not a screenshot** — the dashboard must
render it as "layout-verified, capture skipped (reason)", never as visual proof.
An `is_sample = true` artifact must render with a `[sample]` chip and never read
as a real client result.

### `updated_at` trigger (`0006`)
```sql
create or replace function set_updated_at() returns trigger
  language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
create trigger clients_set_updated_at before update on clients
  for each row execute function set_updated_at();
```
(Only `clients` has `updated_at`; other tables are append-mostly. Add more
triggers if a table later gains `updated_at`.)

### RLS enable + force (`0007`)
For **every** table: `enable row level security` **and** `force row level
security` (so even the table owner role obeys policies — defense in depth). The
`service_role` key (used only by the trusted ETL writer, server-side, never in
the browser) bypasses RLS by design; the **anon** and **authenticated** roles
never do.

### RLS policies (`0008`)

One uniform predicate per table — `owner_user_id = auth.uid()` — applied to
`select`, and `with check (owner_user_id = auth.uid())` on `insert`/`update`.
Example for `runs` (every other table is identical modulo name):
```sql
create policy runs_select_own on runs for select
  using (owner_user_id = auth.uid());
create policy runs_insert_own on runs for insert
  with check (owner_user_id = auth.uid());
create policy runs_update_own on runs for update
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());
create policy runs_delete_own on runs for delete
  using (owner_user_id = auth.uid());
```
`clients` self-scopes on its own `owner_user_id` column directly. Storage objects
in the `scan-proof` bucket are scoped by deriving the client/owner from the path
prefix and joining to a row the caller owns:
```sql
create policy scan_proof_read_own on storage.objects for select
  using (
    bucket_id = 'scan-proof'
    and exists (
      select 1 from run_artifacts ra
      where ra.storage_path = storage.objects.name
        and ra.owner_user_id = auth.uid()
    )
  );
```
No public/anon `select` policy exists on any table → with RLS forced and no
permissive policy, the anon role reads nothing. This is the privacy floor.

### Seed fixtures (`seed.sql`)
- **Two illustrative tenants**, `acme-sample` (owner uuid `…aaaa`) and
  `globex-sample` (owner uuid `…bbbb`), inserted into `auth.users` first (local
  dev only), then `clients` with **`is_sample = true`** and a `name` like
  `"ACME (sample tenant)"`.
- One sample `runs` row per tenant with `is_sample = true`, `mode = 'mock'`,
  `confidence = 'high'`, a small fabricated-but-clearly-sample `visibility` map,
  and `graph_snapshot` set to a trimmed mock report whose `"mode": "mock"`.
- A handful of `citations`, `competitor_citations`, `recommendations`,
  `verification_results`, and **one `run_artifacts` row with
  `method = 'deterministic_fallback'`, `is_sample = true`** — never a real
  screenshot path.
- **Every metric-bearing seed row sets `is_sample = true`.** A `02_sample_flag`
  test enforces this so a fixture can never leak as a real result.
- `seed.sql` runs only via `supabase db reset` on a **local** stack — it is never
  applied to the hosted project (guarded by the README + CI scoping).

## Acceptance criteria

- [ ] `supabase db reset` on a local stack applies `0001`–`0008` + `seed.sql`
      with **zero errors** (migrations are idempotent enough to re-run on a fresh
      DB).
- [ ] All ten vault tables exist with the columns above; `page_chunks.embedding`
      is `vector(1536)` and the `ivfflat (… vector_cosine_ops) lists=100` index
      is present.
- [ ] `run_artifacts` matches the visual-gate reply contract exactly (`stage`,
      `viewport ∈ {1440,768,375}`, `storage_path`, `method`, `is_sample`,
      `unique(run_id,stage,viewport)`) and the `scan-proof` bucket is registered
      **private** (`public = false`).
- [ ] Every table has `enable` **and** `force row level security`; every table
      has owner-scoped `select/insert/update/delete` policies; **no** anon/public
      `select` policy exists anywhere.
- [ ] `visibility_score` is nullable and no `check` forces a non-null/zero score
      (WAF/SPA/unreadable site is never scored 0 — `NULL` + `blind_spot`).
- [ ] `recommendations.human_reviewed` defaults `false` and `status` defaults
      `proposed`; nothing in the schema auto-approves or auto-ships.
- [ ] Every seed metric row has `is_sample = true`; the sample `run_artifacts`
      row uses `deterministic_fallback`, not a fake screenshot.
- [ ] `supabase test db` runs all pgTAP suites green: **tenant isolation**,
      **sample-flag**, **storage isolation**.
- [ ] CI workflow `db-tests.yml` runs the same suite on push and fails the build
      on any RLS leak.
- [ ] Field names match the pipeline (`is_client`, `engine_lane`, `confidence`,
      `low_confidence`, `snapshot_schema`, `mode`, `visibility`) — verified by a
      reviewer against `state.py` + `ship_pr.py`.
- [ ] Schema-review + RLS-tests gate signed off before merge.

## Unit-test plan

Tests are **pgTAP** suites run by `supabase test db` (the Supabase-native DB test
runner), driven against a **local** Supabase stack. The RLS suite impersonates an
authenticated user by setting `request.jwt.claims` / `request.jwt.claim.sub`
(what `auth.uid()` reads) inside a transaction, then asserting visible row counts.

**`01_tenant_isolation_test.sql`** (the core gate — one client cannot read
another's rows):
1. `test_clientA_sees_only_own_clients` — set `auth.uid()` = owner A; `select
   count(*) from clients` returns only A's client(s), and selecting B's
   `client_id` returns 0 rows.
2. `test_clientA_cannot_read_B_runs` — as A, `select * from runs where
   owner_user_id = <B>` → 0 rows; as B → ≥1.
3. `test_isolation_across_all_descendants` — parametrized over `citations`,
   `competitor_citations`, `crawl_pages`, `page_chunks`, `recommendations`,
   `verification_results`, `competitors`, `run_artifacts`: as A, each returns 0
   of B's rows.
4. `test_vector_search_cannot_cross_tenant` — as A, run an ivfflat similarity
   query (`order by embedding <=> $probe limit 50`) and assert **every** returned
   row has `owner_user_id = A` (RLS applies to vector queries too).
5. `test_clientA_cannot_insert_as_B` — as A, `insert into runs (… owner_user_id
   = <B> …)` → blocked by the `with check` (0 rows / RLS error).
6. `test_clientA_cannot_update_or_delete_B` — as A, `update`/`delete` targeting
   B's rows affects 0 rows.
7. `test_anon_reads_nothing` — with no JWT (anon role), every table returns 0
   rows (no permissive policy exists).
8. `test_service_role_bypasses_for_etl` — as `service_role`, all rows visible
   (the trusted server-side writer path works; this role is never shipped to the
   browser).

**`02_sample_flag_test.sql`** (honest-broker by construction):
9. `test_all_seed_metric_rows_are_sample` — assert `is_sample = true` on every
   seeded `clients/runs/citations/competitor_citations/recommendations/
   verification_results/run_artifacts` row (`select count(*) where is_sample =
   false` = 0 for seeded ids).
10. `test_seed_runs_are_mock_mode` — every seed `runs.mode = 'mock'` and the
    `graph_snapshot->>'mode' = 'mock'`.
11. `test_seed_artifact_is_fallback_not_screenshot` — the seeded `run_artifacts`
    row has `method = 'deterministic_fallback'` and `is_sample = true`.
12. `test_visibility_score_nullable_not_zero` — insert a "blocked" run with
    `visibility_score = NULL` + a `blind_spot` string succeeds (proves the
    never-score-0 path is representable, not forced to 0).

**`03_storage_isolation_test.sql`** (scan-proof privacy):
13. `test_scan_proof_bucket_is_private` — `select public from storage.buckets
    where id = 'scan-proof'` = `false`.
14. `test_clientA_cannot_read_B_artifact_object` — as A, the storage.objects
    `select` policy returns 0 rows for an object path owned by B.

**UI / Playwright / screenshot plan.** This spec ships **no UI** — it is SQL
migrations, policies, fixtures, and DB tests. There is no browser surface to
screenshot here, so **no Playwright run is in scope for this spec**. The
dashboard that *renders* `run_artifacts` thumbnails (signed URLs, `[sample]`
chips, "run the scan to see real proof" empty state) is a separate
`specs/dashboard-mvp.md` and owns its own Playwright + axe screenshot gate.

> **CRT/grain headless-hang caveat (carried forward for that future dashboard
> spec, not needed here):** the site's CRT/grain visual effects can hang headless
> Chromium during Playwright screenshot runs. The deterministic fallback is to
> assert on the rendered DOM / serialized data and disable the CRT/grain layer
> (or take the `prefers-reduced-motion` path) before any screenshot, rather than
> block CI on a hanging headless render. For *this* spec the equivalent
> deterministic fallback **is** the pgTAP DB test suite — it proves isolation
> without any browser at all.

## Prerequisites / blocked-on

- **BLOCKED (owner resources) — author now, test later.** Running and verifying
  the migrations needs a Supabase project:
  - A provisioned Supabase project (hosted) **or** the Supabase CLI + Docker for
    a local stack (`supabase start`). The migrations and tests are authored and
    committed now; `supabase db reset` + `supabase test db` are run once either
    is available.
  - Supabase project ref + DB password / `service_role` key for the hosted
    apply (gitignored `.env`; never committed — honest-broker secrets rule).
  - The `vector` and `uuid-ossp` extensions enabled on the project (Supabase
    ships both; enabled by `0001`).
- **Depends on (contracts, already authored):**
  - `feedback/claude/2026-06-06-visual-gate-spec-reply-claude.md` — the
    `run_artifacts` + private-bucket + signed-URL contract (folded in).
  - `pipeline/goblin/state.py` + `pipeline/goblin/nodes/ship_pr.py` — the data
    model + `report` snapshot the columns mirror.
  - `specs/per-platform-rec-tagging.md` — the `engine_lane` vocabulary.
- **Downstream (separate specs, not blockers):** the ETL writer that loads
  pipeline output into these tables; `specs/dashboard-mvp.md` (the reader UI +
  its Playwright gate). This spec defines the schema both consume.
- **Gate before merge:** schema review + RLS tests (both must pass).

## Honest-broker notes

- **No fabricated metrics / clients / citations.** Seed fixtures are the only
  data this spec creates and **every** seed metric row is `is_sample = true`,
  named "(sample tenant)", and `mode = 'mock'`. The `02_sample_flag` suite makes
  it a test failure for a seed row to read as a real result.
- **A blocked / JS-rendered / WAF-blocked site is never scored 0.**
  `runs.visibility_score` is nullable; the schema stores `NULL` + a human-readable
  `blind_spot` for unreadable sites. `crawl_pages.status_code` records 403/429/503
  honestly and `rendered_text` may be empty for an SPA — that is a flagged blind
  spot, never a 0. A test asserts the NULL path is representable.
- **Schema (and llms.txt) are HYGIENE, never a promised citation lever.** The
  schema columns (`schema_found`, `schema_gaps`, `recommendations.kind='schema'`)
  store hygiene findings; nothing in this DB asserts a schema/markup change earns
  a citation. `engine_lane` is editorial routing only (per its source spec),
  stored, never a promised outcome.
- **Never tell a service/gov site it's "missing Product schema."** This schema
  stores whatever the pipeline produced; the pipeline already respects
  Service/Offer/OfferCatalog. `icp_segment` is free-form (e.g. `'gov'`,
  `'service'`) and not used to inject a Product-schema recommendation — no schema
  assertions are generated here.
- **Nothing auto-deploys / auto-sends.** `recommendations.human_reviewed`
  defaults `false`; `status` defaults `proposed`; `runs.approved` defaults
  `false`. The schema cannot represent an auto-approved or auto-shipped fix
  without an explicit human-set flag. Migrations themselves are human-reviewed and
  human-applied (no auto-apply to the hosted project).
- **Mock / sample reads as illustrative.** `is_sample` + `mode='mock'` +
  `[sample]`-chip rendering (enforced by the dashboard spec) keep fixtures from
  ever masquerading as a real pass. `run_artifacts` seed rows use
  `deterministic_fallback`, never a fake screenshot.
- **Privacy is the floor.** Per-client scan proof lives in a **private** bucket,
  served only by short-TTL signed URLs gated by the same RLS as the run rows —
  never `web/public/`. Forced RLS + no anon policy means a leak is a test failure,
  not a config oversight.
- **The refund guarantees the work, not a number.** No column in this schema
  stores or implies a guaranteed citation count; `visibility_score` is a measured
  share-of-citations snapshot (nullable), not a promise.

## Out of scope

- The **ETL writer** that maps `ship_pr` report JSON / state lists into these
  rows (separate pipeline-side spec; gate: `graph-keeper`).
- The **dashboard UI** that reads these tables (run history, citation scorecard,
  fix queue, eval badge, signed-URL artifact thumbnails) — `specs/dashboard-mvp.md`,
  with its own Playwright + axe gate.
- **Embedding generation / chunking / retrieval** code (which model, chunk size,
  what to embed) — this spec only provisions the `page_chunks` store + index.
- **`research_sources` / `research_quotes`** (in the vault plan but not in this
  backlog item's table list) — defer to a research-cache spec.
- **Auth flows** (signup, magic link, session) — owned by the dashboard spec;
  this spec only references `auth.users` and `auth.uid()`.
- **HNSW index migration, partitioning, and ivfflat `reindex` at scale** —
  noted in `README.md` as a follow-up once real row volume exists.
- **Multi-user-per-client teams / role hierarchies** — MVP assumes a single
  `owner_user_id`; team RBAC is a later spec.
