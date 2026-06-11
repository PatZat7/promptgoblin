import "server-only";

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SupabaseAdmin = ReturnType<typeof createServiceRoleSupabase>;
type BillingPlan = "scout" | "warband" | "warlord";
type ScanTier = "tier2" | "tier3";
type LegacyClientTier = "starter" | "retainer";
type EventStatus = "processing" | "processed" | "failed" | "ignored";

type StripeEventRow = {
  id: string;
  status: EventStatus;
  retry_count: number | null;
  error_message: string | null;
};

type ProvisionResult = {
  clientId?: string;
  ignored?: boolean;
  warning?: string;
};

class PermanentWebhookError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PermanentWebhookError";
  }
}

const PLAN_TO_LEGACY_TIER: Record<BillingPlan, LegacyClientTier> = {
  scout: "starter",
  warband: "retainer",
  warlord: "retainer",
};

const PLAN_TO_SCAN_TIER: Record<BillingPlan, ScanTier> = {
  scout: "tier3",
  warband: "tier3",
  warlord: "tier3",
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function getStripe(): { stripe: Stripe; webhookSecret: string } {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) {
    throw new Error("STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are required.");
  }

  return {
    stripe: new Stripe(secretKey, { typescript: true }),
    webhookSecret,
  };
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function normalizeDomain(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const raw = value.trim().toLowerCase();
  if (!raw) return null;

  let hostname = raw;
  try {
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    hostname = url.hostname;
  } catch {
    hostname = raw.split("/")[0] ?? "";
  }

  hostname = hostname.replace(/^www\./, "").replace(/\.$/, "");
  if (!/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/.test(hostname)) return null;
  return hostname;
}

function slugFromDomain(domain: string): string {
  return domain
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function nameFromDomain(domain: string): string {
  const first = domain.split(".")[0] ?? domain;
  return first
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || domain;
}

function normalizeBillingPlan(value: unknown): BillingPlan {
  const plan = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (plan === "warband" || plan === "warlord" || plan === "scout") return plan;
  return "scout";
}

function normalizeScanTier(value: unknown, plan: BillingPlan): ScanTier {
  const tier = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (tier === "tier2" || tier === "tier3") return tier;
  return PLAN_TO_SCAN_TIER[plan];
}

function asStripeId(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    return typeof id === "string" && id.trim() ? id.trim() : null;
  }
  return null;
}

function customFieldValue(
  session: Stripe.Checkout.Session,
  keys: string[],
): string | null {
  const fields = session.custom_fields ?? [];
  for (const field of fields) {
    if (!keys.includes(field.key)) continue;
    const value =
      field.text?.value ??
      field.dropdown?.value ??
      field.numeric?.value?.toString() ??
      null;
    if (value) return value;
  }
  return null;
}

function checkoutEmail(session: Stripe.Checkout.Session): string | null {
  return normalizeEmail(
    session.customer_details?.email ??
      session.customer_email ??
      session.metadata?.email ??
      null,
  );
}

function checkoutDomain(session: Stripe.Checkout.Session): string | null {
  return normalizeDomain(
    session.metadata?.domain ??
      session.metadata?.client_domain ??
      session.metadata?.company_domain ??
      customFieldValue(session, ["domain", "website", "company_domain", "url"]),
  );
}

function checkoutPlan(session: Stripe.Checkout.Session): BillingPlan {
  return normalizeBillingPlan(
    session.metadata?.plan ??
      session.metadata?.tier ??
      customFieldValue(session, ["plan", "tier"]),
  );
}

function checkoutPriceId(session: Stripe.Checkout.Session): string | null {
  return (
    session.metadata?.price_id ??
    session.metadata?.stripe_price_id ??
    null
  );
}

function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  return asStripeId(
    (invoice as Stripe.Invoice & { subscription?: unknown }).subscription,
  );
}

function statusFromSubscription(status: Stripe.Subscription.Status): string {
  const allowed = new Set([
    "active",
    "trialing",
    "past_due",
    "canceled",
    "unpaid",
    "incomplete",
    "incomplete_expired",
    "paused",
  ]);
  return allowed.has(status) ? status : "past_due";
}

async function claimEvent(
  supabase: SupabaseAdmin,
  event: Stripe.Event,
): Promise<"claimed" | "processed" | "processing"> {
  const payload = event as unknown as Record<string, unknown>;
  const { error: insertError } = await supabase.from("stripe_events").insert({
    id: event.id,
    event_type: event.type,
    payload,
    status: "processing",
    error_message: null,
    retry_count: 0,
    last_attempt_at: new Date().toISOString(),
  });

  if (!insertError) return "claimed";

  if (insertError.code !== "23505") {
    throw new Error(`Failed to claim Stripe event: ${insertError.message}`);
  }

  const { data, error } = await supabase
    .from("stripe_events")
    .select("id, status, retry_count, error_message")
    .eq("id", event.id)
    .maybeSingle();

  if (error || !data) {
    throw new Error(`Failed to read duplicate Stripe event: ${error?.message}`);
  }

  const row = data as StripeEventRow;
  if (row.status === "processed" || row.status === "ignored") return "processed";
  if (row.status === "processing") return "processing";

  const { error: updateError } = await supabase
    .from("stripe_events")
    .update({
      payload,
      status: "processing",
      error_message: null,
      retry_count: (row.retry_count ?? 0) + 1,
      last_attempt_at: new Date().toISOString(),
    })
    .eq("id", event.id);

  if (updateError) {
    throw new Error(`Failed to re-claim failed Stripe event: ${updateError.message}`);
  }

  return "claimed";
}

async function markEvent(
  supabase: SupabaseAdmin,
  event: Stripe.Event,
  status: EventStatus,
  errorMessage: string | null = null,
) {
  const { error } = await supabase
    .from("stripe_events")
    .update({
      status,
      error_message: errorMessage,
      processed_at: status === "processed" || status === "ignored" ? new Date().toISOString() : null,
      last_attempt_at: new Date().toISOString(),
    })
    .eq("id", event.id);

  if (error) {
    throw new Error(`Failed to update Stripe event ledger: ${error.message}`);
  }
}

async function createOrLinkAuthUser(
  supabase: SupabaseAdmin,
  email: string,
  metadata: Record<string, string>,
) {
  const { data: createData, error: createError } =
    await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: metadata,
    });

  let userId = createData.user?.id ?? null;
  const duplicateUser =
    createError?.message.toLowerCase().includes("already") ||
    createError?.message.toLowerCase().includes("registered") ||
    createError?.message.toLowerCase().includes("exists");

  if (createError && !duplicateUser) {
    throw new Error(`Failed to create Supabase user: ${createError.message}`);
  }

  const { data: linkData, error: linkError } =
    await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

  if (linkError) {
    throw new Error(`Failed to generate magic link: ${linkError.message}`);
  }

  userId = userId ?? linkData.user?.id ?? null;
  const hashedToken = linkData.properties?.hashed_token ?? null;
  if (!userId || !hashedToken) {
    throw new Error("Supabase did not return a user id and hashed_token.");
  }

  await supabase.auth.admin.updateUserById(userId, {
    user_metadata: metadata,
  });

  return { userId, hashedToken };
}

async function provisionClient(
  supabase: SupabaseAdmin,
  params: {
    userId: string;
    domain: string;
    email: string;
    plan: BillingPlan;
    scanTier: ScanTier;
    sessionId: string;
    customerId: string | null;
    subscriptionId: string | null;
    priceId: string | null;
  },
): Promise<string> {
  const { data, error } = await supabase.rpc(
    "provision_stripe_checkout_client",
    {
      p_owner_user_id: params.userId,
      p_domain: params.domain,
      p_name: nameFromDomain(params.domain),
      p_slug: slugFromDomain(params.domain),
      p_tier: PLAN_TO_LEGACY_TIER[params.plan],
      p_billing_plan: params.plan,
      p_billing_email: params.email,
      p_stripe_customer_id: params.customerId,
      p_stripe_subscription_id: params.subscriptionId,
      p_stripe_checkout_session_id: params.sessionId,
      p_stripe_price_id: params.priceId,
      p_subscription_status: "active",
      p_scan_tier: params.scanTier,
    },
  );

  if (error || typeof data !== "string") {
    throw new Error(`Failed to provision client: ${error?.message ?? "no client id returned"}`);
  }

  return data;
}

function confirmationUrl(request: Request, hashedToken: string): string {
  const configuredOrigin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    new URL(request.url).origin;
  const url = new URL("/auth/confirm", configuredOrigin);
  url.searchParams.set("token_hash", hashedToken);
  url.searchParams.set("type", "magiclink");
  return url.toString();
}

async function sendWelcomeEmail(params: {
  email: string;
  domain: string;
  plan: BillingPlan;
  magicLink: string;
}): Promise<string | null> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return "RESEND_API_KEY is not configured; account was provisioned but no welcome email was sent.";

  const from =
    process.env.RESEND_FROM_EMAIL ??
    "Prompt Goblin <goblins@promptgoblin.io>";

  const html = `
<!doctype html>
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.55; color: #111; max-width: 640px; margin: 0 auto; padding: 28px;">
    <h1 style="font-size: 24px; margin: 0 0 16px;">Your Prompt Goblin dashboard is ready</h1>
    <p>Your ${params.plan} account for <strong>${params.domain}</strong> has been provisioned.</p>
    <p>Use the button below to sign in. The page asks for one click before verifying the token so mail scanners cannot consume the login link before you do.</p>
    <p>
      <a href="${params.magicLink}" style="display:inline-block;background:#10130f;color:#f8f5ec;padding:12px 18px;text-decoration:none;border-radius:4px;">
        Sign in to Prompt Goblin
      </a>
    </p>
    <p style="font-size:13px;color:#555;">If the button does not work, request a fresh magic link from the login page.</p>
  </body>
</html>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [params.email],
      subject: "Your Prompt Goblin dashboard is ready",
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    return `Resend email failed (${response.status}): ${body.slice(0, 500)}`;
  }

  return null;
}

async function handleCheckoutCompleted(
  request: Request,
  supabase: SupabaseAdmin,
  session: Stripe.Checkout.Session,
): Promise<ProvisionResult> {
  if (session.payment_status !== "paid") {
    return { ignored: true };
  }

  const email = checkoutEmail(session);
  if (!email) {
    throw new PermanentWebhookError("Checkout session is missing a customer email.");
  }

  const domain = checkoutDomain(session);
  if (!domain) {
    throw new PermanentWebhookError(
      "Checkout session is missing a customer domain. Configure the Stripe Payment Link with required metadata or a custom field named domain.",
    );
  }

  const plan = checkoutPlan(session);
  const scanTier = normalizeScanTier(session.metadata?.scan_tier, plan);
  const subscriptionId = asStripeId(session.subscription);
  const customerId = asStripeId(session.customer);
  const priceId = checkoutPriceId(session);

  const { userId, hashedToken } = await createOrLinkAuthUser(supabase, email, {
    client_domain: domain,
    billing_plan: plan,
    scan_tier: scanTier,
  });

  const clientId = await provisionClient(supabase, {
    userId,
    domain,
    email,
    plan,
    scanTier,
    sessionId: session.id,
    customerId,
    subscriptionId,
    priceId,
  });

  const warning = await sendWelcomeEmail({
    email,
    domain,
    plan,
    magicLink: confirmationUrl(request, hashedToken),
  });

  return { clientId, warning: warning ?? undefined };
}

async function updateSubscriptionStatus(
  supabase: SupabaseAdmin,
  subscriptionId: string | null,
  status: string,
) {
  if (!subscriptionId) return;
  const { error } = await supabase
    .from("clients")
    .update({
      subscription_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscriptionId);

  if (error) {
    throw new Error(`Failed to update subscription status: ${error.message}`);
  }
}

async function handleEvent(
  request: Request,
  supabase: SupabaseAdmin,
  event: Stripe.Event,
): Promise<ProvisionResult> {
  switch (event.type) {
    case "checkout.session.completed":
      return handleCheckoutCompleted(
        request,
        supabase,
        event.data.object as Stripe.Checkout.Session,
      );
    case "invoice.paid":
      await updateSubscriptionStatus(
        supabase,
        subscriptionIdFromInvoice(event.data.object as Stripe.Invoice),
        "active",
      );
      return {};
    case "invoice.payment_failed":
      await updateSubscriptionStatus(
        supabase,
        subscriptionIdFromInvoice(event.data.object as Stripe.Invoice),
        "past_due",
      );
      return {};
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      await updateSubscriptionStatus(
        supabase,
        subscription.id,
        statusFromSubscription(subscription.status),
      );
      return {};
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await updateSubscriptionStatus(supabase, subscription.id, "canceled");
      return {};
    }
    default:
      return { ignored: true };
  }
}

export async function POST(request: Request) {
  let stripe: Stripe;
  let webhookSecret: string;
  try {
    ({ stripe, webhookSecret } = getStripe());
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Stripe is not configured.", 500);
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return jsonError("Missing stripe-signature header.");

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return jsonError("Webhook signature verification failed.");
  }

  const supabase = createServiceRoleSupabase();
  try {
    const claim = await claimEvent(supabase, event);
    if (claim === "processed") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    if (claim === "processing") {
      return NextResponse.json({ received: true, duplicate: true, status: "processing" });
    }

    const result = await handleEvent(request, supabase, event);
    if (result.ignored) {
      await markEvent(supabase, event, "ignored");
      return NextResponse.json({ received: true, ignored: true });
    }

    if (result.warning) {
      await markEvent(supabase, event, "failed", result.warning);
      return NextResponse.json({ received: true, warning: result.warning });
    }

    await markEvent(supabase, event, "processed");
    return NextResponse.json({ received: true, clientId: result.clientId ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await markEvent(supabase, event, "failed", message).catch((ledgerError) => {
      console.error("[stripe webhook] failed to mark event failed", ledgerError);
    });

    const status = error instanceof PermanentWebhookError ? 200 : 500;
    return NextResponse.json(
      { received: true, error: message },
      { status },
    );
  }
}
