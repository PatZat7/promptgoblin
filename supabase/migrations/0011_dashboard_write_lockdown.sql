-- 0011_dashboard_write_lockdown.sql
--
-- ⚠️ HOLD — alters LIVE-applied RLS policies. Requires schema review + owner
--    sign-off BEFORE `apply_migration`. Do NOT auto-apply.
--
-- WHY: 0008_rls_policies.sql granted the `authenticated` role full CRUD
-- (insert/update/delete + select) on every application table. For the dashboard
-- MVP that is a HONEST-BROKER hole: the browser holds only the anon key under
-- the user's JWT, and the update policy would let a logged-in client run
--   update recommendations set human_reviewed = true
-- — self-unlocking a fix snippet the human-review gate is supposed to hold. It
-- would equally let a client flip runs.approved (the client-visibility gate) or
-- mutate verification_results. The dashboard is READ-ONLY by contract; every
-- legitimate write is done by the pipeline writer with the service_role key,
-- which bypasses RLS by Supabase design.
--
-- WHAT: drop the per-table INSERT/UPDATE/DELETE policies for `authenticated`,
-- leaving each table's `*_select_own` policy intact. After this migration the
-- anon/authenticated roles can READ their own rows and write NOTHING; service_role
-- (server-only, never shipped to the browser) remains the sole writer.
--
-- SCOPE: MVP provisioning is manual (owner creates `clients` rows via service
-- role; self-signup is off), so no authenticated-role write path is lost.
-- REVERSIBLE: re-running 0008's create-policy statements restores prior behavior.

-- clients
drop policy if exists clients_insert_own              on clients;
drop policy if exists clients_update_own              on clients;
drop policy if exists clients_delete_own              on clients;
-- competitors
drop policy if exists competitors_insert_own          on competitors;
drop policy if exists competitors_update_own          on competitors;
drop policy if exists competitors_delete_own          on competitors;
-- runs
drop policy if exists runs_insert_own                 on runs;
drop policy if exists runs_update_own                 on runs;
drop policy if exists runs_delete_own                 on runs;
-- citations
drop policy if exists citations_insert_own            on citations;
drop policy if exists citations_update_own            on citations;
drop policy if exists citations_delete_own            on citations;
-- competitor_citations
drop policy if exists competitor_citations_insert_own on competitor_citations;
drop policy if exists competitor_citations_update_own on competitor_citations;
drop policy if exists competitor_citations_delete_own on competitor_citations;
-- crawl_pages
drop policy if exists crawl_pages_insert_own          on crawl_pages;
drop policy if exists crawl_pages_update_own          on crawl_pages;
drop policy if exists crawl_pages_delete_own          on crawl_pages;
-- page_chunks
drop policy if exists page_chunks_insert_own          on page_chunks;
drop policy if exists page_chunks_update_own          on page_chunks;
drop policy if exists page_chunks_delete_own          on page_chunks;
-- recommendations  (the human_reviewed lock lives here)
drop policy if exists recommendations_insert_own      on recommendations;
drop policy if exists recommendations_update_own      on recommendations;
drop policy if exists recommendations_delete_own      on recommendations;
-- verification_results
drop policy if exists verification_results_insert_own on verification_results;
drop policy if exists verification_results_update_own on verification_results;
drop policy if exists verification_results_delete_own on verification_results;
-- run_artifacts
drop policy if exists run_artifacts_insert_own        on run_artifacts;
drop policy if exists run_artifacts_update_own        on run_artifacts;
drop policy if exists run_artifacts_delete_own        on run_artifacts;
