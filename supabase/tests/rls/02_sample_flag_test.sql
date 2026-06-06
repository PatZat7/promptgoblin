-- tests/rls/02_sample_flag_test.sql
-- Honest-broker gate: every seed metric row has is_sample = true.
-- No seed row can masquerade as a real client result.
-- Runs as superuser (bypasses RLS to inspect all rows).
-- Requires: _docker_stubs.sql + 0001-0008 + seed.sql applied first.

begin;

-- Sample-flag tests inspect all rows as superuser (postgres role bypasses RLS).
-- This is correct: we're checking the data itself, not RLS filtering.
-- The superuser path is the ETL/service_role equivalent in plain Postgres.
reset request.jwt.claim.sub;

-- ── Test 1: all seeded clients are is_sample = true ───────────────────────────
select assert_eq(
  'seed_clients_all_sample',
  0::bigint,
  (select count(*)::bigint from clients where is_sample = false)
);

-- ── Test 2: all seeded runs are is_sample = true ──────────────────────────────
select assert_eq(
  'seed_runs_all_sample',
  0::bigint,
  (select count(*)::bigint from runs where is_sample = false)
);

-- ── Test 3: all seed runs have mode = 'mock' ──────────────────────────────────
select assert_eq(
  'seed_runs_all_mock_mode',
  0::bigint,
  (select count(*)::bigint from runs where mode <> 'mock')
);

-- ── Test 4: graph_snapshot.mode = 'mock' for all seed runs ───────────────────
select assert_eq(
  'seed_runs_snapshot_mode_mock',
  0::bigint,
  (select count(*)::bigint from runs where graph_snapshot->>'mode' <> 'mock')
);

-- ── Test 5: all seed recommendations are is_sample = true ────────────────────
select assert_eq(
  'seed_recommendations_all_sample',
  0::bigint,
  (select count(*)::bigint from recommendations where is_sample = false)
);

-- ── Test 6: seed artifact uses deterministic_fallback and is_sample = true ───
select assert_eq(
  'seed_artifact_is_fallback',
  0::bigint,
  (select count(*)::bigint from run_artifacts
   where method <> 'deterministic_fallback' or is_sample = false)
);

-- ── Test 7: visibility_score = NULL is representable (WAF/SPA blind spot) ────
-- The blocked run for Tenant B has visibility_score = NULL + blind_spot text.
select assert_eq(
  'waf_blocked_run_score_is_null',
  1::bigint,
  (select count(*)::bigint from runs
   where visibility_score is null and blind_spot is not null)
);

-- ── Test 8: insert a NULL-score "blocked" run succeeds (proves the path) ─────
do $$
begin
  insert into runs (client_id, owner_user_id, graph_snapshot, mode,
                    visibility_score, blind_spot, is_sample)
  values (
    'a1000000-0000-0000-0000-000000000001',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '{"mode":"mock"}', 'mock',
    null,
    'WAF test: 403 returned — visibility_score must be NULL, never forced to 0',
    true
  );
  perform assert_true('null_score_insert_succeeds', true);
  -- roll back just this insert
  raise exception 'rollback_null_score_test';
exception
  when others then
    if sqlerrm = 'rollback_null_score_test' then
      raise notice 'PASS [null_score_insert_succeeds]';
    else
      raise;
    end if;
end;
$$;

rollback;
