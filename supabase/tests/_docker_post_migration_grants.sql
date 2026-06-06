-- tests/_docker_post_migration_grants.sql
-- DOCKER TEST HARNESS ONLY — NEVER apply to a real Supabase project.
--
-- Applied AFTER all migrations so that table grants cover tables that now exist.
-- Grants the 'authenticated' role SELECT/INSERT/UPDATE/DELETE on every public table
-- so RLS tests can run as a non-superuser (RLS is enforced for non-superuser roles).

grant select, insert, update, delete on all tables in schema public to authenticated;
