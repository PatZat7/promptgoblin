-- 0001_extensions.sql
-- LIVE-SAFE: Supabase already ships vector and uuid-ossp.
-- gen_random_uuid() is built-in since Postgres 13 (no extension needed).
-- These are idempotent; they are safe to run on a real Supabase project.

create extension if not exists "uuid-ossp";   -- optional; gen_random_uuid() works natively
create extension if not exists vector;        -- pgvector >= 0.7 (Supabase ships it)
-- Note: lists=100 ivfflat is created in 0003. After reaching ~10k+ real rows,
-- run: REINDEX INDEX page_chunks_embedding_idx; and consider migrating to HNSW.
