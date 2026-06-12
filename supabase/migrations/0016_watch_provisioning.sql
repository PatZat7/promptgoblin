-- 0016_watch_provisioning.sql
--
-- The $99 "Goblin Watch" tier is a MONITORING seat: it receives the weekly
-- citation-visibility report but must NOT get on-demand scan powers (those cost
-- real API spend and belong to Scout+). The original provision RPC hardcoded
-- `can_run_scans = true` / `can_review = true` for every plan, so a Watch buyer
-- would silently inherit Scout's capabilities — an honest-broker + margin leak.
--
-- Fix: gate can_run_scans / can_review on the scan tier. tier2/tier3 (Scout,
-- Warband, Warlord) keep full access exactly as before; tier1 (Watch) and none
-- get a read-only monitoring seat. Backward-compatible: every existing paid
-- plan maps to tier3, so their seats are unchanged on the next provision/renew.
--
-- SECURITY DEFINER + fixed search_path preserved verbatim from the prior def.

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
set search_path to 'public'
as $function$
declare
  v_client_id uuid;
  v_existing_owner uuid;
  -- Monitoring tiers (tier1/none) are read-only; only tier2/tier3 may launch
  -- scans or review fixes.
  v_full_access boolean := p_scan_tier in ('tier2', 'tier3');
begin
  select owner_user_id into v_existing_owner
    from public.clients
    where domain = p_domain;

  if v_existing_owner is not null and v_existing_owner <> p_owner_user_id then
    raise exception 'DOMAIN_OWNED_BY_OTHER_USER'
      using errcode = 'P0001';
  end if;

  insert into public.clients (
    owner_user_id, slug, name, domain, tier, is_sample,
    billing_email, billing_plan, stripe_customer_id, stripe_subscription_id,
    stripe_checkout_session_id, stripe_price_id, subscription_status
  )
  values (
    p_owner_user_id, p_slug, p_name, p_domain, p_tier, false,
    p_billing_email, p_billing_plan, p_stripe_customer_id, p_stripe_subscription_id,
    p_stripe_checkout_session_id, p_stripe_price_id, p_subscription_status
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
    client_id, user_id, role, scan_tier, can_run_scans, can_review
  )
  values (
    v_client_id, p_owner_user_id, 'admin', p_scan_tier, v_full_access, v_full_access
  )
  on conflict (client_id, user_id) do update
  set
    role = 'admin',
    scan_tier = excluded.scan_tier,
    can_run_scans = excluded.can_run_scans,
    can_review = excluded.can_review;

  return v_client_id;
end;
$function$;
