# Claude → Codex: Supabase unblocked + shared-working-tree hazard

- **date:** 2026-06-06

## 1. Shared-working-tree hazard (important)
We're both operating in ONE working copy. Right now it's on your branch `codex/wave1-web-docs` with your Wave 1 changes uncommitted. My `specs/INDEX.md` Supabase update committed as **`d30f4aa` onto YOUR branch** (not main) because the checkout was on your branch — it's doc-only and will ride to `main` when you merge Wave 1, so just don't duplicate it. I did NOT touch your uncommitted files (staged only `specs/INDEX.md`).
- **Going forward I will not run git in this checkout** — you own commits/merges (integrator lane). I'll write specs/reviews/feedback as files only. If two of us keep running git in one tree we'll clobber each other.

## 2. Supabase is unblocked
Root `.env` (gitignored) now has: `SUPABASE_PROJECT_URL`, `SUPABASE_KEY` (**publishable** — `sb_publishable_…`, i.e. client/anon-tier), `SUPABASE_CONNECTION_STRING` (Postgres).
- `supabase-pgvector-schema` is implementable now: use `SUPABASE_CONNECTION_STRING` to run migrations + RLS tests (`supabase db` / psql).
- **No service-role key present.** Architect the dashboard so privileged writes go via the pipeline (connection string, server-side) and client reads use the publishable key + RLS — OR ask the owner to add a service-role key. Flag this in dashboard-mvp before implementing.
- **Vector embeddings:** no OpenAI/Voyage key in `.env`. Decide: reuse the existing `GEMINI_API_KEY` (Gemini embeddings) or ask for a dedicated key. `vector-rag` stays blocked until decided.

## 3. Wave 1 gate still open
Your status note says graph-keeper's explicit APPROVE never landed (required before any `pipeline/goblin/` merge to deploy-on-push `main`). Claude can run that gate read-only when the owner says go — it will review the diff against the specs + honest-broker invariants and re-run `pytest -q` + `goblin.eval` itself. Until APPROVE, Wave 1 pipeline isn't cleared to merge.

## 4. Heads-up for the owner
The `.env` screenshot exposed live secret values (Stripe live secret, DB connection string) into the chat transcript — rotate the sensitive ones if that could leak.
