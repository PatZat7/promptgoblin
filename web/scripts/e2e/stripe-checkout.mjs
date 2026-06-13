// Completes a Stripe hosted Checkout Session at $0 (coupon applied server-side,
// payment_method_collection: if_required) — so it never enters a card. The
// session is created by the orchestrator via the Stripe API with the tier price,
// the 100%-off coupon, customer_email, and metadata{domain,plan}; this script
// just drives the hosted page to completion.
//
//   CHECKOUT_URL  the cs_live_… / cs_test_… session url
//   EMAIL         optional — filled only if the email field is present and empty
//   HEADLESS      "false" to watch (default headless)
//
// Prints a JSON result line; exits 0 on success.
import { chromium } from "@playwright/test";

const { CHECKOUT_URL, EMAIL, HEADLESS } = process.env;
if (!CHECKOUT_URL) {
  console.log(JSON.stringify({ ok: false, error: "CHECKOUT_URL is required" }));
  process.exit(1);
}

const result = { ok: false, steps: [], finalUrl: null, cardFieldPresent: null, error: null };
const browser = await chromium.launch({ headless: HEADLESS !== "false" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(30000);

const firstVisible = async (locator) => {
  const n = await locator.count();
  for (let i = 0; i < n; i++) {
    const el = locator.nth(i);
    if (await el.isVisible().catch(() => false)) return el;
  }
  return null;
};

try {
  await page.goto(CHECKOUT_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(3500);

  // Email is normally prefilled from the session's customer_email. Fill only if
  // the field is present AND empty.
  if (EMAIL) {
    const email = page.locator("input#email").first();
    if (await email.isVisible().catch(() => false)) {
      const val = await email.inputValue().catch(() => "x");
      if (!val) await email.fill(EMAIL);
    }
  }
  result.steps.push("loaded");

  // Any required custom field named "domain" (only if the session was built with
  // one; API sessions use metadata instead, so this is usually absent).
  const domainField = await firstVisible(page.locator('input[name="domain"]'));
  if (domainField) {
    await domainField.fill(`qa-${Date.now()}.example`);
    result.steps.push("domain-field");
  }

  // At $0 with if_required there must be no card field.
  const cardRadio = page.locator("#payment-method-accordion-item-title-card");
  result.cardFieldPresent = await cardRadio.isVisible().catch(() => false);
  if (result.cardFieldPresent) {
    throw new Error("card field present — session total is not $0 (coupon not applied?)");
  }

  const submit = await firstVisible(
    page.getByRole("button", { name: /(subscribe|start|pay|complete|confirm|get started|place order)/i }),
  );
  if (!submit) throw new Error("submit button not found");
  await submit.click();
  result.steps.push("submit");

  await page.waitForURL(/promptgoblin\.io\/welcome/, { timeout: 90000 });
  result.finalUrl = page.url();
  result.ok = true;
} catch (e) {
  result.error = String(e?.message || e).slice(0, 500);
  try { result.finalUrl = page.url(); } catch {}
  try { await page.screenshot({ path: `web/scripts/e2e/_checkout-fail-${Date.now()}.png` }); } catch {}
}
await browser.close();
console.log(JSON.stringify(result));
process.exit(result.ok ? 0 : 1);
