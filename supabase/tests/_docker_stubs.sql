-- tests/_docker_stubs.sql
-- DOCKER TEST HARNESS ONLY — NEVER apply to a real Supabase project.
--
-- Real Supabase provides:
--   • auth schema + auth.users + auth.uid()
--   • storage schema + storage.buckets + storage.objects
--
-- This file recreates minimal stubs of those for a plain pgvector/pgvector:pg16
-- container so the migrations (0001–0008) and RLS tests can run without a full
-- Supabase stack. It is applied FIRST, before any numbered migration.
--
-- auth.uid() here reads request.jwt.claim.sub (same mechanism as real Supabase).

-- ── auth schema ───────────────────────────────────────────────────────────────
create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key
);

create or replace function auth.uid()
returns uuid
language sql stable
as $$
  select nullif(
    current_setting('request.jwt.claim.sub', true),
    ''
  )::uuid;
$$;

-- ── storage schema ────────────────────────────────────────────────────────────
create schema if not exists storage;

create table if not exists storage.buckets (
  id     text primary key,
  name   text not null,
  public boolean not null default false
);

create table if not exists storage.objects (
  id         uuid primary key default gen_random_uuid(),
  bucket_id  text references storage.buckets(id),
  name       text not null,
  owner      uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket_id, name)
);

-- Enable RLS on storage.objects so the scan_proof_read_own policy is enforced.
-- Real Supabase already has this; the stub must mirror it for Docker tests.
alter table storage.objects enable row level security;
alter table storage.objects force row level security;

-- ── Docker test role ─────────────────────────────────────────────────────────
-- Create a non-superuser 'authenticated' role so RLS is enforced during tests.
-- On a real Supabase project, the 'authenticated' role already exists.
-- NOTE: table-level grants are applied AFTER migrations in _docker_post_migration_grants.sql
-- (grants on tables that don't exist yet are a no-op).
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end;
$$;
grant usage on schema public  to authenticated;
grant usage on schema storage to authenticated;
grant usage on schema auth    to authenticated;
grant select, insert, update, delete on storage.objects to authenticated;
grant select                         on storage.buckets to authenticated;
grant execute on function auth.uid() to authenticated;
