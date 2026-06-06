-- 0009_harden_function_search_path.sql
-- LIVE-SAFE hardening: pin the trigger function's search_path so it can't be
-- hijacked via a mutable search_path (Supabase advisor 0011). now() resolves via
-- pg_catalog, which Postgres always searches implicitly, so behaviour is unchanged.
alter function public.set_updated_at() set search_path = '';
