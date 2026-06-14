-- 0018_leads_apollo_people.sql
-- Make leads_queue PEOPLE-centric so it can hold Apollo contacts (many people per
-- company). Adds Apollo identifiers + the reference fields Apollo returns
-- (email / phone / headline / location / photo). Drops the (owner, domain)
-- uniqueness — several contacts can share one company domain — and dedups per
-- Apollo person instead.
--
-- Honest-broker: email/phone are LICENSED Apollo reference data, stored for the
-- operator to act on BY HAND. Nothing in the app auto-sends or contacts anyone.
-- The hygiene score is still NULL-not-0 and is company-domain scoped.
-- Additive + idempotent; safe to re-run.

alter table leads_queue
  add column if not exists apollo_contact_id text,
  add column if not exists apollo_person_id  text,
  add column if not exists email             text,
  add column if not exists email_status      text,
  add column if not exists phone             text,
  add column if not exists headline          text,
  add column if not exists location          text,
  add column if not exists photo_url         text;

-- People CRM: a domain can repeat (several contacts at one company), so the old
-- one-row-per-domain uniqueness no longer applies. Drop it by definition match
-- (constraint name is auto-generated), tolerant of it already being gone.
do $$
declare c text;
begin
  select conname into c
    from pg_constraint
   where conrelid = 'leads_queue'::regclass
     and contype = 'u'
     and pg_get_constraintdef(oid) ilike '%(owner_user_id, domain)%';
  if c is not null then
    execute format('alter table leads_queue drop constraint %I', c);
  end if;
end $$;

-- Idempotent Apollo (re-)import: one row per (owner, apollo person).
create unique index if not exists leads_queue_owner_apollo_person_idx
  on leads_queue (owner_user_id, apollo_person_id)
  where apollo_person_id is not null;

create index if not exists leads_queue_email_idx
  on leads_queue (owner_user_id, email)
  where email is not null;
