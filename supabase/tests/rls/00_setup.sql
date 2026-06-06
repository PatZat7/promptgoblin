-- tests/rls/00_setup.sql
-- RLS test harness setup.
-- Impersonates auth.uid() by setting request.jwt.claim.sub via SET LOCAL.
-- Compatible with plain Postgres (no pgTAP, no Supabase CLI required for Docker verify).
--
-- Usage in tests: SET LOCAL request.jwt.claim.sub = '<uuid>';
-- auth.uid() (from _docker_stubs.sql) reads this setting.

-- Assertion helper: raises an exception if the condition is false.
create or replace function assert_eq(label text, expected bigint, actual bigint)
returns void language plpgsql as $$
begin
  if expected <> actual then
    raise exception 'FAIL [%]: expected % got %', label, expected, actual;
  end if;
  raise notice 'PASS [%]', label;
end;
$$;

create or replace function assert_true(label text, cond boolean)
returns void language plpgsql as $$
begin
  if not cond then
    raise exception 'FAIL [%]: condition was false', label;
  end if;
  raise notice 'PASS [%]', label;
end;
$$;

-- Grant execute to the authenticated test role so assertions work inside SET ROLE blocks.
grant execute on function assert_eq(text, bigint, bigint) to authenticated;
grant execute on function assert_true(text, boolean)      to authenticated;
