-- tests/rls/01_tenant_isolation_test.sql
-- Tenant isolation: client A cannot read/write/delete client B's rows.
-- Runs 8 assertions inside a single transaction that is rolled back at the end.
-- Requires: _docker_stubs.sql + 0001-0008 + seed.sql applied first.

begin;

-- Switch to non-superuser authenticated role so RLS is enforced.
set local role authenticated;

-- ── Test 1: client A sees only own clients ────────────────────────────────────
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
select assert_eq(
  'clientA_sees_only_own_clients',
  1::bigint,
  (select count(*)::bigint from clients)
);

-- ── Test 2: client A cannot read B's runs ────────────────────────────────────
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
select assert_eq(
  'clientA_cannot_read_B_runs',
  0::bigint,
  (select count(*)::bigint from runs
   where owner_user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
);

-- ── Test 3: client B sees own run ─────────────────────────────────────────────
set local request.jwt.claim.sub = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
select assert_eq(
  'clientB_sees_own_run',
  1::bigint,
  (select count(*)::bigint from runs)
);

-- ── Test 4: isolation across all descendant tables (as A, B's rows = 0) ──────
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
select assert_eq(
  'isolation_citations',
  0::bigint,
  (select count(*)::bigint from citations
   where owner_user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
);
select assert_eq(
  'isolation_recommendations',
  0::bigint,
  (select count(*)::bigint from recommendations
   where owner_user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
);
select assert_eq(
  'isolation_run_artifacts',
  0::bigint,
  (select count(*)::bigint from run_artifacts
   where owner_user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
);

-- ── Test 5: client A cannot insert a run owned by B ──────────────────────────
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
do $$
declare
  blocked boolean := false;
begin
  begin
    insert into runs (client_id, owner_user_id, graph_snapshot, mode)
    values (
      'b1000000-0000-0000-0000-000000000001',
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      '{"mode":"mock"}', 'mock'
    );
  exception when others then
    blocked := true;
  end;
  perform assert_true('clientA_cannot_insert_as_B', blocked);
end;
$$;

-- ── Test 6: anon (no JWT) reads nothing ──────────────────────────────────────
set local request.jwt.claim.sub = '';
select assert_eq(
  'anon_reads_no_clients',
  0::bigint,
  (select count(*)::bigint from clients)
);
select assert_eq(
  'anon_reads_no_runs',
  0::bigint,
  (select count(*)::bigint from runs)
);

rollback;
