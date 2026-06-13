// Opens a Supabase magic link (the welcome-email sign-in URL), clicks through
// the /auth/confirm interstitial, and asserts the dashboard loads. Env-driven.
//
//   MAGIC_URL   the full sign-in link (…/auth/confirm?token_hash=…&type=magiclink)
//   EXPECT_TEXT optional substring to assert on the dashboard (e.g. a plan label)
//   HEADLESS    "false" to watch it (default headless)
//
// Prints a JSON result line; exits 0 on success.
import { chromium } from "@playwright/test";

const { MAGIC_URL, EXPECT_TEXT, HEADLESS } = process.env;
if (!MAGIC_URL) {
  console.log(JSON.stringify({ ok: false, error: "MAGIC_URL is required" }));
  process.exit(1);
}

const result = { ok: false, dashboardUrl: null, expectTextFound: null, bodyMarker: null, error: null };
const browser = await chromium.launch({ headless: HEADLESS !== "false" });
const page = await browser.newPage();
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
  await page.goto(MAGIC_URL, { waitUntil: "domcontentloaded", timeout: 60000 });

  // /auth/confirm shows a one-click interstitial button (anti-prefetch).
  const confirmBtn = await firstVisible(
    page.getByRole("button", { name: /(sign in|confirm|continue|finish|complete sign)/i }),
  );
  if (confirmBtn) await confirmBtn.click();

  await page.waitForURL(/\/dashboard/, { timeout: 60000 });
  result.dashboardUrl = page.url();
  const body = await page.locator("body").innerText();
  result.bodyMarker = body.replace(/\s+/g, " ").slice(0, 240);
  if (EXPECT_TEXT) result.expectTextFound = body.toLowerCase().includes(EXPECT_TEXT.toLowerCase());
  result.ok = EXPECT_TEXT ? result.expectTextFound === true : true;
  if (!result.ok) result.error = `dashboard reached but EXPECT_TEXT "${EXPECT_TEXT}" not found`;
} catch (e) {
  result.error = String(e?.message || e).slice(0, 500);
  try { result.dashboardUrl = page.url(); } catch {}
  try { await page.screenshot({ path: `web/scripts/e2e/_login-fail-${Date.now()}.png` }); } catch {}
}
await browser.close();
console.log(JSON.stringify(result));
process.exit(result.ok ? 0 : 1);
