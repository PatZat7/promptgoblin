-- 0004_recs_and_verification.sql
-- LIVE-SAFE: no auth/storage schema creation here.

create table if not exists recommendations (
  id             uuid primary key default gen_random_uuid(),
  run_id         uuid not null references runs(id) on delete cascade,
  owner_user_id  uuid not null references auth.users(id) on delete cascade,
  fix_id         text,
  title          text,
  kind           text check (kind in ('citation','schema','content','seo','a11y','community')),
  engine_lane    text check (engine_lane in ('chatgpt','google_aio','both')),
  priority       text check (priority in ('low','medium','high')),
  impact         int check (impact between 1 and 5),
  effort         int check (effort between 1 and 5),
  score          numeric,
  stack_specific boolean not null default false,
  snippet        text,
  rationale      text,
  status         text not null default 'proposed'
                   check (status in ('proposed','approved','rejected','shipped','verified','unverified')),
  human_reviewed boolean not null default false,  -- nothing auto-approves
  is_sample      boolean not null default false,
  created_at     timestamptz not null default now()
);
create index if not exists recommendations_owner_idx on recommendations (owner_user_id);
create index if not exists recommendations_run_idx on recommendations (run_id);

create table if not exists verification_results (
  id                uuid primary key default gen_random_uuid(),
  run_id            uuid not null references runs(id) on delete cascade,
  owner_user_id     uuid not null references auth.users(id) on delete cascade,
  recommendation_id uuid references recommendations(id) on delete set null,
  method            text check (method in ('playwright_mcp','axe_core','static_fetch','deterministic_fallback','manual')),
  status            text check (status in ('verified','failed','unverifiable','skipped','regressed')),
  passed            boolean,
  verdict           text,
  detail            text,
  evidence          jsonb,
  is_sample         boolean not null default false,
  created_at        timestamptz not null default now()
);
create index if not exists verification_results_owner_idx on verification_results (owner_user_id);
create index if not exists verification_results_run_idx on verification_results (run_id);
