-- 0013_client_memberships.sql
--
-- Adds explicit dashboard seats so one tenant can have multiple auth users:
--   - admin seats (approval UI + scan launches)
--   - member seats (scan launches only, or view-only)
--
-- LIVE-SAFE:
--   - adds one new table plus read helper functions
--   - widens READ policies only; dashboard writes remain locked by 0011
--   - backfills every existing client owner as an admin seat

create table if not exists public.client_memberships (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.clients(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  role          text not null check (role in ('admin','member')),
  scan_tier     text not null default 'tier3'
                 check (scan_tier in ('none','tier1','tier2','tier3')),
  can_run_scans boolean not null default false,
  can_review    boolean not null default false,
  created_at    timestamptz not null default now(),
  unique (client_id, user_id)
);

create index if not exists client_memberships_user_idx
  on public.client_memberships (user_id);
create index if not exists client_memberships_client_idx
  on public.client_memberships (client_id);

alter table public.client_memberships enable row level security;
alter table public.client_memberships force row level security;

create or replace function public.current_user_can_access_client(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.client_memberships cm
    where cm.client_id = target_client_id
      and cm.user_id = auth.uid()
  );
$$;

create or replace function public.current_user_can_review_client(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.client_memberships cm
    where cm.client_id = target_client_id
      and cm.user_id = auth.uid()
      and cm.can_review = true
  );
$$;

grant execute on function public.current_user_can_access_client(uuid) to authenticated;
grant execute on function public.current_user_can_review_client(uuid) to authenticated;

create policy client_memberships_select_own on public.client_memberships for select
  using (user_id = auth.uid());

insert into public.client_memberships (client_id, user_id, role, scan_tier, can_run_scans, can_review)
select
  c.id,
  c.owner_user_id,
  'admin',
  'tier3',
  true,
  true
from public.clients c
on conflict (client_id, user_id) do update
set role = excluded.role,
    scan_tier = excluded.scan_tier,
    can_run_scans = excluded.can_run_scans,
    can_review = excluded.can_review;

drop policy if exists clients_select_own on public.clients;
create policy clients_select_own on public.clients for select
  using (
    owner_user_id = auth.uid()
    or public.current_user_can_access_client(id)
  );

drop policy if exists competitors_select_own on public.competitors;
create policy competitors_select_own on public.competitors for select
  using (
    owner_user_id = auth.uid()
    or public.current_user_can_access_client(client_id)
  );

drop policy if exists runs_select_own on public.runs;
create policy runs_select_own on public.runs for select
  using (
    owner_user_id = auth.uid()
    or public.current_user_can_access_client(client_id)
  );

drop policy if exists citations_select_own on public.citations;
create policy citations_select_own on public.citations for select
  using (
    owner_user_id = auth.uid()
    or exists (
      select 1
      from public.runs r
      where r.id = citations.run_id
        and public.current_user_can_access_client(r.client_id)
    )
  );

drop policy if exists competitor_citations_select_own on public.competitor_citations;
create policy competitor_citations_select_own on public.competitor_citations for select
  using (
    owner_user_id = auth.uid()
    or exists (
      select 1
      from public.runs r
      where r.id = competitor_citations.run_id
        and public.current_user_can_access_client(r.client_id)
    )
  );

drop policy if exists crawl_pages_select_own on public.crawl_pages;
create policy crawl_pages_select_own on public.crawl_pages for select
  using (
    owner_user_id = auth.uid()
    or exists (
      select 1
      from public.runs r
      where r.id = crawl_pages.run_id
        and public.current_user_can_access_client(r.client_id)
    )
  );

drop policy if exists page_chunks_select_own on public.page_chunks;
create policy page_chunks_select_own on public.page_chunks for select
  using (
    owner_user_id = auth.uid()
    or exists (
      select 1
      from public.runs r
      where r.id = page_chunks.run_id
        and public.current_user_can_access_client(r.client_id)
    )
  );

drop policy if exists recommendations_select_own on public.recommendations;
create policy recommendations_select_own on public.recommendations for select
  using (
    owner_user_id = auth.uid()
    or exists (
      select 1
      from public.runs r
      where r.id = recommendations.run_id
        and public.current_user_can_access_client(r.client_id)
    )
  );

drop policy if exists verification_results_select_own on public.verification_results;
create policy verification_results_select_own on public.verification_results for select
  using (
    owner_user_id = auth.uid()
    or exists (
      select 1
      from public.runs r
      where r.id = verification_results.run_id
        and public.current_user_can_access_client(r.client_id)
    )
  );

drop policy if exists run_artifacts_select_own on public.run_artifacts;
create policy run_artifacts_select_own on public.run_artifacts for select
  using (
    owner_user_id = auth.uid()
    or public.current_user_can_access_client(client_id)
  );

drop policy if exists scan_proof_read_own on storage.objects;
create policy scan_proof_read_own on storage.objects for select
  using (
    bucket_id = 'scan-proof'
    and exists (
      select 1
      from public.run_artifacts ra
      where ra.storage_path = storage.objects.name
        and (
          ra.owner_user_id = auth.uid()
          or public.current_user_can_access_client(ra.client_id)
        )
    )
  );
