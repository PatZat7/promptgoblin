-- 0015_stripe_events.sql
-- Stripe checkout provisioning + webhook idempotency.
--
-- LIVE-SAFE:
--   - Adds nullable billing columns to clients.
--   - Adds a service-role-only event ledger for at-least-once Stripe delivery.
--   - Adds one RPC that upserts the client + first admin membership in a single
--     database transaction after Supabase Auth has created/located the user.

alter table public.clients
  add column if not exists billing_email text,
  add column if not exists billing_plan text
    check (billing_plan is null or billing_plan in ('scout','warband','warlord')),
  add column if not exists subscription_status text not null default 'manual'
    check (subscription_status in (
      'manual',
      'active',
      'trialing',
      'past_due',
      'canceled',
      'unpaid',
      'incomplete',
      'incomplete_expired',
      'paused'
    )),
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_price_id text;

create unique index if not exists clients_stripe_customer_uidx
  on public.clients (stripe_customer_id)
  where stripe_customer_id is not null;

create unique index if not exists clients_stripe_subscription_uidx
  on public.clients (stripe_subscription_id)
  where stripe_subscription_id is not null;

create unique index if not exists clients_stripe_checkout_session_uidx
  on public.clients (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create table if not exists public.stripe_events (
  id              text primary key,
  event_type      text not null,
  payload         jsonb not null,
  status          text not null default 'processing'
                  check (status in ('processing','processed','failed','ignored')),
  error_message   text,
  retry_count     int not null default 0,
  last_attempt_at timestamptz not null default now(),
  processed_at    timestamptz
);

create index if not exists stripe_events_type_idx
  on public.stripe_events (event_type);
create index if not exists stripe_events_status_idx
  on public.stripe_events (status);
create index if not exists stripe_events_processed_idx
  on public.stripe_events (processed_at desc);

alter table public.stripe_events enable row level security;
alter table public.stripe_events force row level security;

create or replace function public.provision_stripe_checkout_client(
  p_owner_user_id uuid,
  p_domain text,
  p_name text,
  p_slug text,
  p_tier text,
  p_billing_plan text,
  p_billing_email text,
  p_stripe_customer_id text,
  p_stripe_subscription_id text,
  p_stripe_checkout_session_id text,
  p_stripe_price_id text,
  p_subscription_status text,
  p_scan_tier text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid;
begin
  insert into public.clients (
    owner_user_id,
    slug,
    name,
    domain,
    tier,
    is_sample,
    billing_email,
    billing_plan,
    stripe_customer_id,
    stripe_subscription_id,
    stripe_checkout_session_id,
    stripe_price_id,
    subscription_status
  )
  values (
    p_owner_user_id,
    p_slug,
    p_name,
    p_domain,
    p_tier,
    false,
    p_billing_email,
    p_billing_plan,
    p_stripe_customer_id,
    p_stripe_subscription_id,
    p_stripe_checkout_session_id,
    p_stripe_price_id,
    p_subscription_status
  )
  on conflict (domain) do update
  set
    name = coalesce(nullif(excluded.name, ''), public.clients.name),
    tier = excluded.tier,
    is_sample = false,
    billing_email = excluded.billing_email,
    billing_plan = excluded.billing_plan,
    stripe_customer_id = coalesce(excluded.stripe_customer_id, public.clients.stripe_customer_id),
    stripe_subscription_id = coalesce(excluded.stripe_subscription_id, public.clients.stripe_subscription_id),
    stripe_checkout_session_id = coalesce(excluded.stripe_checkout_session_id, public.clients.stripe_checkout_session_id),
    stripe_price_id = coalesce(excluded.stripe_price_id, public.clients.stripe_price_id),
    subscription_status = excluded.subscription_status,
    updated_at = now()
  returning id into v_client_id;

  insert into public.client_memberships (
    client_id,
    user_id,
    role,
    scan_tier,
    can_run_scans,
    can_review
  )
  values (
    v_client_id,
    p_owner_user_id,
    'admin',
    p_scan_tier,
    true,
    true
  )
  on conflict (client_id, user_id) do update
  set
    role = 'admin',
    scan_tier = excluded.scan_tier,
    can_run_scans = true,
    can_review = true;

  return v_client_id;
end;
$$;

revoke execute on function public.provision_stripe_checkout_client(
  uuid, text, text, text, text, text, text, text, text, text, text, text, text
) from public, anon, authenticated;
grant execute on function public.provision_stripe_checkout_client(
  uuid, text, text, text, text, text, text, text, text, text, text, text, text
) to service_role;
