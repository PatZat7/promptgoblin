-- 0017_leads_queue.sql
-- Outbound-lead CRM for first-sale outreach. LOCAL + MANUAL workflow only:
--   1. leads are ingested from a local file (web/scripts/import-local-leads.mjs),
--   2. enriched by a REAL Tier-1 hygiene scan (web/scripts/process-leads.mjs),
--   3. a LinkedIn DM DRAFT is generated for HUMAN review + MANUAL send.
-- Nothing here auto-sends. No email is fired from this table. No browser
-- automation drives any third-party platform.
--
-- Honest-broker notes (binds this table + both scripts):
--   - Tier-1 returns a HYGIENE score (table-stakes parse/crawl health), NOT an
--     "AI visibility score" and NOT a citation guarantee. It is stored as
--     hygiene_score and must be described as hygiene in any draft. The proven
--     citation levers (brand mentions + Bing rank) are NOT measured here.
--   - A page we cannot read (WAF / timeout / non-public / unreachable) is NEVER
--     scored 0. hygiene_score stays NULL and scan_status records the honest
--     outcome. The draft generator refuses to invent a "visibility drop-off".
--   - Standard owner-scoped RLS (owner_user_id = auth.uid()). The scripts write
--     with the service_role key, which bypasses RLS by design — same trusted
--     server-side path as every other writer (seed-e2e-fixture, the pipeline).
--
-- LIVE-SAFE: references auth.users(id) which Supabase already provides. Reuses
-- the existing set_updated_at() function from 0006. Additive — no existing
-- table is touched.

create table if not exists leads_queue (
  id              uuid primary key default gen_random_uuid(),
  owner_user_id   uuid not null references auth.users(id) on delete cascade,

  -- ── identity ────────────────────────────────────────────────────────────────
  -- ICP: B2B SaaS, ~$2–20M ARR, marketing-led, 10–100 employees, visible competitor.
  company_name    text not null,
  domain          text not null,           -- normalized: lowercase, no scheme/www/path
  contact_name    text,
  contact_title   text,
  linkedin_url    text,                     -- profile YOU open + paste the draft into, by hand
  competitor      text,                     -- a visible category competitor, if known
  icp_segment     text,
  source          text,                     -- where the lead came from (manual list, referral…)

  -- ── lifecycle ───────────────────────────────────────────────────────────────
  -- The pipeline models the real, MANUAL LinkedIn motion:
  --   new → scanned → drafted → connect_sent → connected → contacted → replied → won/lost
  -- Every transition past 'drafted' is a human action taken by hand off-platform.
  -- No status here is ever set by browser automation driving LinkedIn.
  status          text not null default 'new'
                    check (status in (
                      'new',           -- ingested, not yet scanned
                      'scanning',      -- scan in flight (transient)
                      'scanned',       -- real hygiene scan stored
                      'scan_failed',   -- honest failure (WAF/timeout/unreachable/non-public)
                      'drafted',       -- connect note + DM draft generated, awaiting human send
                      'connect_sent',  -- YOU sent the ≤300-char connection request by hand
                      'connected',     -- they accepted the connection request
                      'contacted',     -- YOU sent the full DM by hand
                      'replied',
                      'won',
                      'lost',
                      'skip'
                    )),

  -- ── REAL Tier-1 hygiene results (never fabricated; NULL when unread) ──────────
  hygiene_score   int check (hygiene_score between 0 and 100),  -- NULL on any non-ok scan
  scan_status     text check (scan_status in (
                      'ok','blocked_by_waf','unreachable','non_public','timeout','error'
                    )),
  scan_summary    text,                     -- the goblin-voiced one-liner the scan returns
  scan_report     jsonb,                    -- full Tier-1 envelope, kept for audit
  scanned_at      timestamptz,

  -- ── HUMAN-reviewed outreach (drafted here, sent manually elsewhere) ──────────
  -- connect_note: the short (≤300-char) connection-request opener — the cold
  --   opener for 3rd-degree leads who can only be reached via Connect.
  -- linkedin_dm_draft: the full post-accept follow-up DM.
  -- Both are DRAFTS built from REAL findings. Nothing here is ever auto-sent;
  -- the CRM only stores text a human copies, pastes, and sends by hand.
  connect_note      text,                   -- ≤300-char connection-request opener (cold)
  linkedin_dm_draft text,                   -- full DM; generated from REAL findings, never auto-sent
  drafted_at        timestamptz,
  connect_sent_at   timestamptz,            -- set by hand once YOU send the connection request
  connected_at      timestamptz,            -- set by hand once they accept
  contacted_at      timestamptz,            -- set by hand once YOU send the full DM
  replied_at        timestamptz,            -- set by hand once they reply
  last_activity_at  timestamptz,            -- bumped on any manual status/field change (recency sort)
  next_followup_at  timestamptz,            -- optional self-reminder; nothing fires from it
  priority          smallint not null default 0 check (priority between 0 and 3), -- 0 normal … 3 hot
  tags              text[] not null default '{}',  -- freeform labels (segment, source, etc.)
  notes             text,

  is_sample       boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (owner_user_id, domain)            -- one row per domain per owner; re-import is idempotent
);

create index if not exists leads_queue_owner_idx  on leads_queue (owner_user_id);
create index if not exists leads_queue_status_idx  on leads_queue (owner_user_id, status);
-- Recency sort for the CRM list (newest activity first, NULLs last).
create index if not exists leads_queue_activity_idx on leads_queue (owner_user_id, last_activity_at desc nulls last);
-- Follow-up reminders that are due.
create index if not exists leads_queue_followup_idx on leads_queue (owner_user_id, next_followup_at)
  where next_followup_at is not null;

-- updated_at trigger (reuses set_updated_at() from 0006)
drop trigger if exists leads_queue_set_updated_at on leads_queue;
create trigger leads_queue_set_updated_at
  before update on leads_queue
  for each row execute function set_updated_at();

-- ── RLS: owner-scoped, matches every other table. service_role bypasses by design ──
alter table leads_queue enable row level security;
alter table leads_queue force  row level security;

create policy leads_queue_select_own on leads_queue for select
  using (owner_user_id = auth.uid());
create policy leads_queue_insert_own on leads_queue for insert
  with check (owner_user_id = auth.uid());
create policy leads_queue_update_own on leads_queue for update
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());
create policy leads_queue_delete_own on leads_queue for delete
  using (owner_user_id = auth.uid());
