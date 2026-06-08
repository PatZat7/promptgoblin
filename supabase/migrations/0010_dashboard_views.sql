-- 0010_dashboard_views.sql
-- (renumbered from 0009 — live 0009 is 0009_harden_function_search_path.sql,
--  already in the project ledger; this views migration follows it.)
-- Dashboard read views. security_invoker = true so RLS is enforced through
-- the view (the view never widens access beyond the per-table policies in
-- 0008_rls_policies.sql). Querying these views as an authenticated user
-- returns exactly the same rows the underlying table policies permit.
--
-- LIVE-SAFE: depends only on tables already created by 0002–0005 migrations.

-- ── v_run_summary ─────────────────────────────────────────────────────────────
-- One row per approved run; includes client domain for display.
create or replace view public.v_run_summary
  with (security_invoker = true)
as
select
  r.id,
  r.client_id,
  r.created_at,
  r.mode,
  r.visibility,
  r.visibility_score,
  r.confidence,
  r.low_confidence,
  r.blind_spot,
  r.is_sample,
  r.approved,
  r.status,
  c.domain,
  c.name  as client_name
from public.runs r
join public.clients c on c.id = r.client_id
where r.approved = true;

-- ── v_run_platform_breakdown ──────────────────────────────────────────────────
-- Per-run, per-platform visibility share extracted from graph_snapshot.
-- visibility_by_engine is a top-level key in graph_snapshot jsonb.
create or replace view public.v_run_platform_breakdown
  with (security_invoker = true)
as
select
  r.id as run_id,
  r.client_id,
  r.visibility,
  (r.graph_snapshot -> 'visibility_by_engine') as visibility_by_engine
from public.runs r
where r.approved = true;

-- ── v_run_integrity ───────────────────────────────────────────────────────────
-- Pre-aggregated verified/unverifiable/fabricated counts per run.
create or replace view public.v_run_integrity
  with (security_invoker = true)
as
select
  vr.run_id,
  count(*) filter (where vr.status = 'verified')                                       as verified,
  count(*) filter (where vr.status in ('unverifiable', 'skipped'))                     as unverifiable,
  count(*) filter (where vr.status in ('failed', 'regressed'))                         as fabricated
from public.verification_results vr
join public.runs r on r.id = vr.run_id
where r.approved = true
group by vr.run_id;

-- ── v_fix_queue ───────────────────────────────────────────────────────────────
-- Recommendations for a run, HIGH→LOW by score.
-- NOTE: snippet is intentionally included here so the server-side accessor
-- (listFixes in dashboard-api.ts) can read it, apply the lock check, and
-- strip it before serialising to the client. The view itself does NOT strip
-- snippets — the accessor is the enforcement point.
create or replace view public.v_fix_queue
  with (security_invoker = true)
as
select
  rec.id,
  rec.run_id,
  rec.fix_id,
  rec.title,
  rec.kind,
  rec.engine_lane,
  rec.priority,
  rec.impact,
  rec.effort,
  rec.score,
  rec.rationale,
  rec.snippet,
  rec.status,
  rec.human_reviewed,
  rec.is_sample
from public.recommendations rec
join public.runs r on r.id = rec.run_id
where r.approved = true
order by rec.score desc, rec.impact desc, rec.effort asc;
