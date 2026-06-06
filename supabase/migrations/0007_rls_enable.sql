-- 0007_rls_enable.sql
-- LIVE-SAFE: enables and forces RLS on every application table.
-- force row level security means even the table-owner role obeys policies.
-- service_role bypasses RLS by Supabase design (trusted server-side ETL writer only,
-- never shipped to the browser). anon and authenticated roles never bypass.

alter table clients              enable row level security;
alter table clients              force row level security;

alter table competitors          enable row level security;
alter table competitors          force row level security;

alter table runs                 enable row level security;
alter table runs                 force row level security;

alter table citations            enable row level security;
alter table citations            force row level security;

alter table competitor_citations enable row level security;
alter table competitor_citations force row level security;

alter table crawl_pages          enable row level security;
alter table crawl_pages          force row level security;

alter table page_chunks          enable row level security;
alter table page_chunks          force row level security;

alter table recommendations      enable row level security;
alter table recommendations      force row level security;

alter table verification_results enable row level security;
alter table verification_results force row level security;

alter table run_artifacts        enable row level security;
alter table run_artifacts        force row level security;
