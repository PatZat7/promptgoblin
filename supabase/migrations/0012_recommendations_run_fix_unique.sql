-- 0012_recommendations_run_fix_unique.sql
--
-- Required before enabling the pipeline Supabase writer (#5,
-- goblin/supabase_writer.py). The writer upserts recommendations with
--   on_conflict = (run_id, fix_id)
-- so a re-shipped run updates the same fix row instead of duplicating it. That
-- needs a UNIQUE constraint on (run_id, fix_id), which the original schema did
-- not declare (recommendations had only its id primary key). Without this the
-- upsert raises and the writer honestly skips — writing nothing.
--
-- ADDITIVE + LIVE-SAFE: a fix_id is unique within a run by construction
-- (FIX-001, FIX-002, …), so no existing row violates this. Apply alongside the
-- first `GOBLIN_SUPABASE_ENABLED=true` enablement.

alter table public.recommendations
  add constraint recommendations_run_fix_unique unique (run_id, fix_id);
