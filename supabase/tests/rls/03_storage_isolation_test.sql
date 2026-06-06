-- tests/rls/03_storage_isolation_test.sql
-- Storage isolation: scan-proof bucket is private; client A cannot read B's artifact objects.
-- Requires: _docker_stubs.sql + 0001-0008 + seed.sql applied first.

begin;

-- Test 1 and bucket insert run as superuser (postgres) to bypass RLS.
-- Test 2 switches to authenticated role to enforce RLS.
reset request.jwt.claim.sub;

-- ── Test 1: scan-proof bucket is private ─────────────────────────────────────
select assert_true(
  'scan_proof_bucket_is_private',
  (select public = false from storage.buckets where id = 'scan-proof')
);

-- Insert a storage.objects row for Tenant B's artifact to test cross-tenant isolation.
insert into storage.objects (bucket_id, name, owner)
values (
  'scan-proof',
  'b1000000-0000-0000-0000-000000000001/b2000000-0000-0000-0000-000000000001/before@1440.png',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
) on conflict (bucket_id, name) do nothing;

-- ── Test 2: client A cannot read B's storage object via the RLS policy ────────
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
select assert_eq(
  'clientA_cannot_read_B_storage_object',
  0::bigint,
  (select count(*)::bigint from storage.objects
   where bucket_id = 'scan-proof'
     and name = 'b1000000-0000-0000-0000-000000000001/b2000000-0000-0000-0000-000000000001/before@1440.png')
);

rollback;
