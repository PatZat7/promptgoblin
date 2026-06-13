// Live Stripe end-to-end test, per tier, at $0 (coupon applied server-side).
//
// For each tier it: creates a $0 Checkout Session via the Stripe API (tier price
// + 100%-off coupon + payment_method_collection:if_required + metadata{domain,
// plan}), drives the hosted page to completion with Playwright (no card), waits
// for the webhook to provision the client in Supabase, asserts the plan→tier
// mapping, mints a magic link via Supabase admin, logs in with Playwright and
// asserts the dashboard + tier label, then tears everything down (cancels the
// Stripe subscription, deletes the client row + auth user + ledger rows).
//
// Required env (launch with the wrapper in docs/stripe-live-e2e.md):
//   STRIPE_KEY                  live (or test) secret key
//   SUPABASE_URL                project url
//   SUPABASE_SERVICE_ROLE_KEY   service-role key (bypasses RLS)
//   COUPON_ID                   100%-off coupon id (live: 2gX7MsjX)
//   TIERS                       optional CSV subset (default: watch,scout,warband,warlord)
//   SITE_URL                    default https://promptgoblin.io
//   KEEP                        "1" to skip teardown (leave accounts for manual poking)
//
// Exits 0 only if every selected tier passes.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const {
  STRIPE_KEY,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  COUPON_ID,
  SITE_URL = "https://promptgoblin.io",
  KEEP,
} = process.env;
const STRIPE_VERSION = "2024-06-20"; // pin: account default rejects `coupon` on newer versions

for (const [k, v] of Object.entries({ STRIPE_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, COUPON_ID })) {
  if (!v) { console.error(`Missing env ${k}`); process.exit(2); }
}

// Tier → live price + expected provisioning. tierLabel is what the dashboard
// badge renders (watch = TIER1; scout/warband/warlord = TIER3).
const ALL_TIERS = {
  watch:   { price: "price_1ThYYdLsDV5y6e3wfTd7QKVO", legacyTier: "starter",  tierLabel: "TIER1" },
  scout:   { price: "price_1Tf4ZFLsDV5y6e3wsS88KCjv", legacyTier: "starter",  tierLabel: "TIER3" },
  warband: { price: "price_1Tf4ZGLsDV5y6e3wmEgkp9rA", legacyTier: "retainer", tierLabel: "TIER3" },
  warlord: { price: "price_1Tf4ZHLsDV5y6e3wjeRIdSH2", legacyTier: "retainer", tierLabel: "TIER3" },
};
const selected = (process.env.TIERS || "watch,scout,warband,warlord")
  .split(",").map((s) => s.trim()).filter((t) => ALL_TIERS[t]);

const runId = `${Date.now().toString(36)}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- Stripe (form-encoded) ---------------------------------------------------
const stripe = async (method, path, params) => {
  const body = params
    ? new URLSearchParams(Object.entries(params).flatMap(([k, v]) =>
        Array.isArray(v) ? v.map((x, i) => [`${k}[${i}]`, x]) : [[k, String(v)]])).toString()
    : undefined;
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${STRIPE_KEY}`,
      "Stripe-Version": STRIPE_VERSION,
      ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body,
  });
  const json = await res.json();
  if (json.error) throw new Error(`Stripe ${path}: ${json.error.message}`);
  return json;
};

// --- Supabase REST + admin ---------------------------------------------------
const sbHeaders = { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` };
const sbRest = async (method, query, extra = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
    method,
    headers: { ...sbHeaders, "Content-Type": "application/json", ...(extra.headers || {}) },
    body: extra.body,
  });
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};
const mintMagicLink = async (email) => {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: { ...sbHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "magiclink", email }),
  });
  const j = await res.json();
  const ht = j?.properties?.hashed_token || j?.hashed_token;
  if (!ht) throw new Error(`generate_link: ${JSON.stringify(j).slice(0, 160)}`);
  return `${SITE_URL}/auth/confirm?token_hash=${ht}&type=magiclink`;
};

// --- run a Playwright leg, parse its JSON line -------------------------------
const playwright = (script, env) =>
  new Promise((resolve) => {
    const p = spawn(process.execPath, [join(HERE, script)], {
      env: { ...process.env, ...env },
      cwd: join(HERE, "..", ".."), // web/
    });
    let out = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", () => {});
    p.on("close", () => {
      const line = out.trim().split("\n").filter(Boolean).pop() || "{}";
      try { resolve(JSON.parse(line)); } catch { resolve({ ok: false, error: out.slice(-300) }); }
    });
  });

// --- per-tier flow -----------------------------------------------------------
async function runTier(plan) {
  const cfg = ALL_TIERS[plan];
  const domain = `goblinqa-${plan}-${runId}.com`;
  const email = `atpatzat+qa${plan}@gmail.com`;
  const r = { plan, domain, email, steps: {}, ok: false, error: null, clientId: null, subId: null, userId: null };
  try {
    // 1. $0 session
    const session = await stripe("POST", "checkout/sessions", {
      mode: "subscription",
      "line_items[0][price]": cfg.price,
      "line_items[0][quantity]": 1,
      "discounts[0][coupon]": COUPON_ID,
      payment_method_collection: "if_required",
      customer_email: email,
      "metadata[domain]": domain,
      "metadata[plan]": plan,
      success_url: `${SITE_URL}/welcome`,
    });
    if (session.amount_total !== 0) throw new Error(`session total ${session.amount_total} != 0`);
    r.steps.session = "ok";

    // 2. Playwright checkout
    const co = await playwright("stripe-checkout.mjs", { CHECKOUT_URL: session.url, EMAIL: email, HEADLESS: "true" });
    r.steps.checkout = co.ok ? "ok" : `FAIL: ${co.error}`;
    if (!co.ok) throw new Error(`checkout: ${co.error}`);

    // 3. poll Supabase for provisioning
    let row = null;
    for (let i = 0; i < 20 && !row; i++) {
      await sleep(3000);
      const rows = await sbRest("GET",
        `clients?domain=eq.${domain}&select=id,billing_plan,tier,subscription_status,welcome_email_status,stripe_subscription_id,owner_user_id`);
      if (Array.isArray(rows) && rows.length) row = rows[0];
    }
    if (!row) throw new Error("provisioning row never appeared (webhook?)");
    r.clientId = row.id; r.subId = row.stripe_subscription_id; r.userId = row.owner_user_id;
    if (row.billing_plan !== plan) throw new Error(`billing_plan ${row.billing_plan} != ${plan}`);
    if (row.tier !== cfg.legacyTier) throw new Error(`tier ${row.tier} != ${cfg.legacyTier}`);
    r.steps.provision = `ok (tier=${row.tier}, email=${row.welcome_email_status})`;

    // 4. magic-link login (real email is asserted separately by the workflow via Gmail)
    const magic = await mintMagicLink(email);
    const li = await playwright("magic-login.mjs", { MAGIC_URL: magic, EXPECT_TEXT: cfg.tierLabel, HEADLESS: "true" });
    r.steps.login = li.ok ? `ok (${cfg.tierLabel})` : `FAIL: ${li.error}`;
    if (!li.ok) throw new Error(`login: ${li.error}`);

    r.ok = true;
  } catch (e) {
    r.error = String(e?.message || e).slice(0, 300);
  } finally {
    if (!KEEP) r.steps.cleanup = await cleanup(r);
  }
  return r;
}

async function cleanup(r) {
  const notes = [];
  try {
    if (r.subId) { await stripe("DELETE", `subscriptions/${r.subId}`); notes.push("sub-canceled"); }
  } catch (e) { notes.push(`sub-cancel-fail:${String(e.message).slice(0, 60)}`); }
  try {
    if (r.clientId) {
      await sbRest("DELETE", `clients?id=eq.${r.clientId}`, { headers: { Prefer: "return=minimal" } });
      notes.push("client-deleted");
    }
  } catch (e) { notes.push(`client-del-fail:${String(e.message).slice(0, 60)}`); }
  try {
    if (r.userId) {
      await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${r.userId}`, { method: "DELETE", headers: sbHeaders });
      notes.push("user-deleted");
    }
  } catch (e) { notes.push(`user-del-fail:${String(e.message).slice(0, 60)}`); }
  return notes.join(", ") || "nothing-to-clean";
}

// --- main --------------------------------------------------------------------
const results = [];
for (const plan of selected) {
  process.stderr.write(`\n▶ ${plan}…\n`);
  const r = await runTier(plan);
  results.push(r);
  process.stderr.write(`  ${r.ok ? "✅ PASS" : "❌ FAIL"} ${plan}  ${JSON.stringify(r.steps)}\n`);
}
const passed = results.filter((r) => r.ok).length;
console.log(JSON.stringify({ runId, passed, total: results.length, results }, null, 2));
process.exit(passed === results.length ? 0 : 1);
