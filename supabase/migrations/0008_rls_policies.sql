-- 0008_rls_policies.sql
-- LIVE-SAFE:
--   - Uses auth.uid() which Supabase already provides. Does NOT define auth.uid() here.
--   - All policies use owner_user_id = auth.uid() — a single indexed predicate, no recursive join.
--   - No anon/public SELECT policy exists anywhere — anon role reads nothing (privacy floor).
--   - storage.objects policy uses real Supabase storage.objects (Supabase provides it).

-- ── clients ──────────────────────────────────────────────────────────────────
create policy clients_select_own on clients for select
  using (owner_user_id = auth.uid());
create policy clients_insert_own on clients for insert
  with check (owner_user_id = auth.uid());
create policy clients_update_own on clients for update
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());
create policy clients_delete_own on clients for delete
  using (owner_user_id = auth.uid());

-- ── competitors ───────────────────────────────────────────────────────────────
create policy competitors_select_own on competitors for select
  using (owner_user_id = auth.uid());
create policy competitors_insert_own on competitors for insert
  with check (owner_user_id = auth.uid());
create policy competitors_update_own on competitors for update
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());
create policy competitors_delete_own on competitors for delete
  using (owner_user_id = auth.uid());

-- ── runs ──────────────────────────────────────────────────────────────────────
create policy runs_select_own on runs for select
  using (owner_user_id = auth.uid());
create policy runs_insert_own on runs for insert
  with check (owner_user_id = auth.uid());
create policy runs_update_own on runs for update
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());
create policy runs_delete_own on runs for delete
  using (owner_user_id = auth.uid());

-- ── citations ─────────────────────────────────────────────────────────────────
create policy citations_select_own on citations for select
  using (owner_user_id = auth.uid());
create policy citations_insert_own on citations for insert
  with check (owner_user_id = auth.uid());
create policy citations_update_own on citations for update
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());
create policy citations_delete_own on citations for delete
  using (owner_user_id = auth.uid());

-- ── competitor_citations ──────────────────────────────────────────────────────
create policy competitor_citations_select_own on competitor_citations for select
  using (owner_user_id = auth.uid());
create policy competitor_citations_insert_own on competitor_citations for insert
  with check (owner_user_id = auth.uid());
create policy competitor_citations_update_own on competitor_citations for update
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());
create policy competitor_citations_delete_own on competitor_citations for delete
  using (owner_user_id = auth.uid());

-- ── crawl_pages ───────────────────────────────────────────────────────────────
create policy crawl_pages_select_own on crawl_pages for select
  using (owner_user_id = auth.uid());
create policy crawl_pages_insert_own on crawl_pages for insert
  with check (owner_user_id = auth.uid());
create policy crawl_pages_update_own on crawl_pages for update
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());
create policy crawl_pages_delete_own on crawl_pages for delete
  using (owner_user_id = auth.uid());

-- ── page_chunks ───────────────────────────────────────────────────────────────
create policy page_chunks_select_own on page_chunks for select
  using (owner_user_id = auth.uid());
create policy page_chunks_insert_own on page_chunks for insert
  with check (owner_user_id = auth.uid());
create policy page_chunks_update_own on page_chunks for update
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());
create policy page_chunks_delete_own on page_chunks for delete
  using (owner_user_id = auth.uid());

-- ── recommendations ───────────────────────────────────────────────────────────
create policy recommendations_select_own on recommendations for select
  using (owner_user_id = auth.uid());
create policy recommendations_insert_own on recommendations for insert
  with check (owner_user_id = auth.uid());
create policy recommendations_update_own on recommendations for update
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());
create policy recommendations_delete_own on recommendations for delete
  using (owner_user_id = auth.uid());

-- ── verification_results ──────────────────────────────────────────────────────
create policy verification_results_select_own on verification_results for select
  using (owner_user_id = auth.uid());
create policy verification_results_insert_own on verification_results for insert
  with check (owner_user_id = auth.uid());
create policy verification_results_update_own on verification_results for update
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());
create policy verification_results_delete_own on verification_results for delete
  using (owner_user_id = auth.uid());

-- ── run_artifacts ─────────────────────────────────────────────────────────────
create policy run_artifacts_select_own on run_artifacts for select
  using (owner_user_id = auth.uid());
create policy run_artifacts_insert_own on run_artifacts for insert
  with check (owner_user_id = auth.uid());
create policy run_artifacts_update_own on run_artifacts for update
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());
create policy run_artifacts_delete_own on run_artifacts for delete
  using (owner_user_id = auth.uid());

-- ── storage.objects (scan-proof bucket) ──────────────────────────────────────
-- Supabase provides storage.objects; this policy gates reads by bucket + run_artifacts ownership.
-- No public/anon policy — anon role cannot read any storage object in this bucket.
create policy scan_proof_read_own on storage.objects for select
  using (
    bucket_id = 'scan-proof'
    and exists (
      select 1 from run_artifacts ra
      where ra.storage_path = storage.objects.name
        and ra.owner_user_id = auth.uid()
    )
  );
