// One-shot Stripe setup for the $99/mo "Goblin Watch" tier + friends-&-family
// discount codes. The browser route is blocked (Stripe dashboard is walled off
// to automation), so this is the reliable, auditable alternative: one command,
// no UI clicking, and the secret key never touches the repo.
//
// Honest-broker: the secret key is read from the environment ONLY. It is never
// printed, logged, or written to disk. Run it with your freshly-ROTATED live key.
//
// Usage (PowerShell):
//   $env:STRIPE_SECRET_KEY = "sk_live_…"; node web/scripts/create-watch-product.mjs
//   # add --dry-run to print what WOULD be created without writing anything
//
// What it creates (idempotent on re-run via lookup_key + code lookups):
//   • Product  "Goblin Watch"
//   • Price    $99.00 / month recurring (lookup_key: goblin_watch_monthly)
//   • Payment Link  (collects email + a required "domain" field; promo codes ON;
//                    metadata.plan = "watch" so the webhook provisions correctly)
//   • Coupon  100% off forever  + promotion code  FRIENDS0   (→ $0, friends & family)
//   • Coupon  $98 off forever   + promotion code  FRIENDS1   (→ $1, paid-flow test)
//
// After it runs, copy the printed Payment Link into web/lib/site.ts STRIPE_LINKS.watch.

import Stripe from "stripe";

const KEY = process.env.STRIPE_SECRET_KEY;
const DRY = process.argv.includes("--dry-run");

if (!KEY) {
  console.error("✗ STRIPE_SECRET_KEY is not set. Set it in the env and re-run (never paste it into a file).");
  process.exit(1);
}
const MODE = KEY.startsWith("sk_live_") ? "LIVE" : KEY.startsWith("sk_test_") ? "TEST" : "UNKNOWN";
if (MODE === "UNKNOWN") {
  console.error("✗ STRIPE_SECRET_KEY does not look like an sk_live_ or sk_test_ key. Aborting.");
  process.exit(1);
}

const stripe = new Stripe(KEY, { apiVersion: "2025-03-31.basil" });

const PRICE_LOOKUP = "goblin_watch_monthly";
const UNIT_AMOUNT = 9900; // $99.00
const DISCOUNT_1_OFF = 9800; // $98.00 off => effective $1.00

const log = (...a) => console.log(...a);
const banner = (t) => log(`\n${"─".repeat(60)}\n${t}\n${"─".repeat(60)}`);

async function findOrCreateProduct() {
  const existing = await stripe.products.search({ query: `name:'Goblin Watch' AND active:'true'` });
  if (existing.data[0]) {
    log(`• Product exists: ${existing.data[0].id}`);
    return existing.data[0];
  }
  if (DRY) { log("• [dry-run] would create product 'Goblin Watch'"); return { id: "prod_DRYRUN" }; }
  const p = await stripe.products.create({
    name: "Goblin Watch",
    description:
      "Weekly AI citation-visibility report across ChatGPT, Claude, Gemini, and Perplexity, " +
      "plus your Bing/web rank — with a what's-missing list, week-over-week deltas, and a " +
      "drop-in AI-ready fix prompt. Human-reviewed before every send.",
    metadata: { plan: "watch", tier: "watch" },
  });
  log(`• Created product: ${p.id}`);
  return p;
}

async function findOrCreatePrice(productId) {
  const existing = await stripe.prices.list({ lookup_keys: [PRICE_LOOKUP], active: true, limit: 1 });
  if (existing.data[0]) {
    log(`• Price exists: ${existing.data[0].id} ($${(existing.data[0].unit_amount / 100).toFixed(2)}/mo)`);
    return existing.data[0];
  }
  if (DRY) { log("• [dry-run] would create $99/mo price"); return { id: "price_DRYRUN" }; }
  const price = await stripe.prices.create({
    product: productId,
    currency: "usd",
    unit_amount: UNIT_AMOUNT,
    recurring: { interval: "month" },
    lookup_key: PRICE_LOOKUP,
    metadata: { plan: "watch" },
  });
  log(`• Created price: ${price.id} ($99.00/mo)`);
  return price;
}

async function createPaymentLink(priceId) {
  if (DRY) { log("• [dry-run] would create Payment Link (promo codes ON, domain field, metadata.plan=watch)"); return { url: "https://buy.stripe.com/DRYRUN" }; }
  const link = await stripe.paymentLinks.create({
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    // The webhook reads metadata.plan to map the account to the right scan tier.
    metadata: { plan: "watch" },
    subscription_data: { metadata: { plan: "watch" } },
    // Collect the site we'll scan — the provisioning RPC needs this (and the
    // cross-tenant guard rejects a checkout without it).
    custom_fields: [
      {
        key: "domain",
        label: { type: "custom", custom: "Your website domain (we'll watch this)" },
        type: "text",
        text: { minimum_length: 3 },
        optional: false,
      },
    ],
  });
  log(`• Created Payment Link: ${link.url}`);
  return link;
}

async function findOrCreateCoupon({ idHint, percent_off, amount_off, name }) {
  // Coupons aren't searchable by name; match on our metadata tag for idempotency.
  const all = await stripe.coupons.list({ limit: 100 });
  const match = all.data.find((c) => c.metadata?.goblin_tag === idHint);
  if (match) { log(`• Coupon exists: ${match.id} (${name})`); return match; }
  if (DRY) { log(`• [dry-run] would create coupon ${name}`); return { id: `coupon_${idHint}` }; }
  const body = { name, duration: "forever", metadata: { goblin_tag: idHint } };
  if (percent_off != null) body.percent_off = percent_off;
  if (amount_off != null) { body.amount_off = amount_off; body.currency = "usd"; }
  const c = await stripe.coupons.create(body);
  log(`• Created coupon: ${c.id} (${name})`);
  return c;
}

async function findOrCreatePromo(code, couponId) {
  const existing = await stripe.promotionCodes.list({ code, limit: 1 });
  if (existing.data[0]) { log(`• Promo code exists: ${code} -> ${existing.data[0].id}`); return existing.data[0]; }
  if (DRY) { log(`• [dry-run] would create promo code ${code}`); return { code }; }
  const pc = await stripe.promotionCodes.create({ coupon: couponId, code });
  log(`• Created promo code: ${pc.code}`);
  return pc;
}

async function main() {
  banner(`Goblin Watch setup — Stripe ${MODE} mode${DRY ? " (DRY RUN)" : ""}`);
  if (MODE === "LIVE" && !DRY) log("⚠ Creating REAL live objects. They are reversible (archive/deactivate in Stripe).");

  const product = await findOrCreateProduct();
  const price = await findOrCreatePrice(product.id);
  const link = await createPaymentLink(price.id);

  const free = await findOrCreateCoupon({ idHint: "ff_free", percent_off: 100, name: "Friends & Family — Free" });
  const dollar = await findOrCreateCoupon({ idHint: "ff_one_dollar", amount_off: DISCOUNT_1_OFF, name: "Friends & Family — $1" });
  await findOrCreatePromo("FRIENDS0", free.id);
  await findOrCreatePromo("FRIENDS1", dollar.id);

  banner("DONE — wire this into the site");
  log(`Payment Link : ${link.url}`);
  log(`Price ID     : ${price.id}`);
  log("");
  log("Next:");
  log(`  1. Put the Payment Link in web/lib/site.ts -> STRIPE_LINKS.watch`);
  log(`  2. Friends & family: share the link, code FRIENDS0 (free) or FRIENDS1 ($1)`);
  log(`  3. Confirm the webhook maps metadata.plan="watch" (already wired in app/api/webhooks/stripe).`);
}

main().catch((err) => {
  // Print message only — never the key or full request internals.
  console.error(`✗ Stripe setup failed: ${err?.message ?? err}`);
  process.exit(1);
});
