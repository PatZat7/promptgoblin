-- 0002_core_tables.sql
-- LIVE-SAFE: references auth.users(id) which Supabase already provides.
-- Does NOT create auth schema, auth.uid(), or auth.users — those exist in Supabase.

create table if not exists clients (
  id            uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  slug          text unique not null,
  name          text not null,
  domain        text unique not null,
  icp_segment   text,
  tier          text check (tier in ('free','starter','retainer')),
  is_sample     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists clients_owner_idx on clients (owner_user_id);

create table if not exists competitors (
  id                   uuid primary key default gen_random_uuid(),
  client_id            uuid not null references clients(id) on delete cascade,
  owner_user_id        uuid not null references auth.users(id) on delete cascade,
  domain               text not null,
  display_name         text,
  auto_discovered      boolean not null default false,
  discovery_confidence text check (discovery_confidence in ('low','medium','high','operator')),
  source_note          text,
  is_sample            boolean not null default false,
  created_at           timestamptz not null default now(),
  unique (client_id, domain)
);
create index if not exists competitors_owner_idx on competitors (owner_user_id);

create table if not exists runs (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references clients(id) on delete cascade,
  owner_user_id    uuid not null references auth.users(id) on delete cascade,
  graph_snapshot   jsonb not null,
  snapshot_schema  int not null default 1,
  mode             text not null check (mode in ('mock','live')),
  visibility_score numeric,   -- NULL for WAF/SPA/unreadable; never forced to 0
  visibility       jsonb,
  citation_gaps    jsonb,
  schema_gaps      jsonb,
  stack_profile    jsonb,
  a11y_issues      jsonb,
  recs             jsonb,
  confidence       text not null default 'high' check (confidence in ('high','low')),
  low_confidence   boolean not null default false,
  blind_spot       text,      -- human-readable WAF/SPA block note; NULL if none
  approved         boolean not null default false,
  status           text not null default 'pending'
                     check (status in ('pending','running','needs_review','complete','failed')),
  is_sample        boolean not null default false,
  created_by       uuid references auth.users(id),
  created_at       timestamptz not null default now()
);
create index if not exists runs_owner_idx on runs (owner_user_id);
create index if not exists runs_client_created_idx on runs (client_id, created_at desc);

create table if not exists citations (
  id            uuid primary key default gen_random_uuid(),
  run_id        uuid not null references runs(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  source_url    text,
  source_title  text,
  source_domain text,
  platform      text,
  query_text    text,
  position      int,
  snippet       text,
  is_client     boolean not null default false,
  engine_lane   text check (engine_lane in ('chatgpt','google_aio','both')),
  verified      boolean not null default false,
  retrieved_at  timestamptz not null default now()
);
create index if not exists citations_owner_idx on citations (owner_user_id);
create index if not exists citations_run_idx on citations (run_id);

create table if not exists competitor_citations (
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
create index if not exists competitor_citations_owner_idx on competitor_citations (owner_user_id);
create index if not exists competitor_citations_run_idx on competitor_citations (run_id);
