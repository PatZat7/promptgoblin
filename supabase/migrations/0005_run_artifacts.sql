-- 0005_run_artifacts.sql
-- LIVE-SAFE:
--   - Does NOT create storage schema or storage.buckets/objects tables.
--   - Supabase already provides the storage schema, storage.buckets, and storage.objects.
--   - The bucket INSERT is idempotent (ON CONFLICT DO NOTHING) and works on real Supabase
--     AND on Docker with the stub (tests/_docker_stubs.sql).
--   - storage_path stores only bucket-relative path, NEVER a public URL.
--     Dashboard fetches via short-TTL signed URLs (gated by RLS on this table + storage.objects policy).

create table if not exists run_artifacts (
  id            uuid primary key default gen_random_uuid(),
  run_id        uuid not null references runs(id) on delete cascade,
  client_id     uuid not null references clients(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  stage         text check (stage in ('before','after','results')),
  viewport      int  check (viewport in (1440,768,375)),
  storage_path  text not null,   -- '<clientId>/<runId>/<stage>@<viewport>.png' — never a public URL
  method        text check (method in ('playwright_mcp','deterministic_fallback')),
  is_sample     boolean not null default false,
  captured_at   timestamptz not null default now(),
  unique (run_id, stage, viewport)
);
create index if not exists run_artifacts_owner_idx on run_artifacts (owner_user_id);

-- Register the scan-proof storage bucket as PRIVATE.
-- Works on real Supabase (storage schema already exists) and on Docker (stub provides storage.buckets).
-- ON CONFLICT DO NOTHING makes this idempotent/re-runnable.
insert into storage.buckets (id, name, public)
values ('scan-proof', 'scan-proof', false)
on conflict (id) do nothing;
