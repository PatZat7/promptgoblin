-- 0003_crawl_and_vectors.sql
-- LIVE-SAFE: no auth/storage schema creation here.

create table if not exists crawl_pages (
  id             uuid primary key default gen_random_uuid(),
  run_id         uuid not null references runs(id) on delete cascade,
  owner_user_id  uuid not null references auth.users(id) on delete cascade,
  url            text not null,
  normalized_url text,
  content_type   text,
  status_code    int,       -- 403/429/503 = blocked, recorded honestly (never auto-zero score)
  content_hash   text,
  raw_html       text,
  rendered_text  text,      -- may be '' for JS-rendered SPA (blind spot flag, not 0 score)
  schema_found   jsonb,
  fetched_at     timestamptz not null default now(),
  unique (run_id, url)
);
create index if not exists crawl_pages_owner_idx on crawl_pages (owner_user_id);

create table if not exists page_chunks (
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
create index if not exists page_chunks_owner_idx on page_chunks (owner_user_id);
create index if not exists page_chunks_run_idx on page_chunks (run_id);

-- ivfflat index: built on empty table at migration time (valid but unselective until rows exist).
-- After reaching ~10k rows: REINDEX INDEX page_chunks_embedding_idx;
-- Future: migrate to HNSW once pgvector 0.8+ is available on Supabase.
-- NOTE: RLS (owner_user_id = auth.uid()) applies to every vector similarity query — no cross-tenant leakage.
create index if not exists page_chunks_embedding_idx
  on page_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);
