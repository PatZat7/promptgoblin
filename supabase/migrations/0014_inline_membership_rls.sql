-- 0014_inline_membership_rls.sql
--
-- Follow-up to 0013: remove SECURITY DEFINER helper functions from the exposed
-- schema and inline the membership predicates directly inside RLS policies.

drop policy if exists clients_select_own on public.clients;
create policy clients_select_own on public.clients for select
  using (
    owner_user_id = auth.uid()
    or exists (
      select 1
      from public.client_memberships cm
      where cm.client_id = clients.id
        and cm.user_id = auth.uid()
    )
  );

drop policy if exists competitors_select_own on public.competitors;
create policy competitors_select_own on public.competitors for select
  using (
    owner_user_id = auth.uid()
    or exists (
      select 1
      from public.client_memberships cm
      where cm.client_id = competitors.client_id
        and cm.user_id = auth.uid()
    )
  );

drop policy if exists runs_select_own on public.runs;
create policy runs_select_own on public.runs for select
  using (
    owner_user_id = auth.uid()
    or exists (
      select 1
      from public.client_memberships cm
      where cm.client_id = runs.client_id
        and cm.user_id = auth.uid()
    )
  );

drop policy if exists citations_select_own on public.citations;
create policy citations_select_own on public.citations for select
  using (
    owner_user_id = auth.uid()
    or exists (
      select 1
      from public.runs r
      join public.client_memberships cm on cm.client_id = r.client_id
      where r.id = citations.run_id
        and cm.user_id = auth.uid()
    )
  );

drop policy if exists competitor_citations_select_own on public.competitor_citations;
create policy competitor_citations_select_own on public.competitor_citations for select
  using (
    owner_user_id = auth.uid()
    or exists (
      select 1
      from public.runs r
      join public.client_memberships cm on cm.client_id = r.client_id
      where r.id = competitor_citations.run_id
        and cm.user_id = auth.uid()
    )
  );

drop policy if exists crawl_pages_select_own on public.crawl_pages;
create policy crawl_pages_select_own on public.crawl_pages for select
  using (
    owner_user_id = auth.uid()
    or exists (
      select 1
      from public.runs r
      join public.client_memberships cm on cm.client_id = r.client_id
      where r.id = crawl_pages.run_id
        and cm.user_id = auth.uid()
    )
  );

drop policy if exists page_chunks_select_own on public.page_chunks;
create policy page_chunks_select_own on public.page_chunks for select
  using (
    owner_user_id = auth.uid()
    or exists (
      select 1
      from public.runs r
      join public.client_memberships cm on cm.client_id = r.client_id
      where r.id = page_chunks.run_id
        and cm.user_id = auth.uid()
    )
  );

drop policy if exists recommendations_select_own on public.recommendations;
create policy recommendations_select_own on public.recommendations for select
  using (
    owner_user_id = auth.uid()
    or exists (
      select 1
      from public.runs r
      join public.client_memberships cm on cm.client_id = r.client_id
      where r.id = recommendations.run_id
        and cm.user_id = auth.uid()
    )
  );

drop policy if exists verification_results_select_own on public.verification_results;
create policy verification_results_select_own on public.verification_results for select
  using (
    owner_user_id = auth.uid()
    or exists (
      select 1
      from public.runs r
      join public.client_memberships cm on cm.client_id = r.client_id
      where r.id = verification_results.run_id
        and cm.user_id = auth.uid()
    )
  );

drop policy if exists run_artifacts_select_own on public.run_artifacts;
create policy run_artifacts_select_own on public.run_artifacts for select
  using (
    owner_user_id = auth.uid()
    or exists (
      select 1
      from public.client_memberships cm
      where cm.client_id = run_artifacts.client_id
        and cm.user_id = auth.uid()
    )
  );

drop policy if exists scan_proof_read_own on storage.objects;
create policy scan_proof_read_own on storage.objects for select
  using (
    bucket_id = 'scan-proof'
    and exists (
      select 1
      from public.run_artifacts ra
      join public.client_memberships cm on cm.client_id = ra.client_id
      where ra.storage_path = storage.objects.name
        and (
          ra.owner_user_id = auth.uid()
          or cm.user_id = auth.uid()
        )
    )
  );

revoke execute on function public.current_user_can_access_client(uuid) from public, anon, authenticated;
revoke execute on function public.current_user_can_review_client(uuid) from public, anon, authenticated;
drop function if exists public.current_user_can_access_client(uuid);
drop function if exists public.current_user_can_review_client(uuid);
