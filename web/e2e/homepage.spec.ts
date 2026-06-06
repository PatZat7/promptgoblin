/**
 * Homepage tests for the Prompt Goblin marketing site.
 *
 * The site is a Next.js static export (out/).  It calls a live DigitalOcean
 * scan function from the Hero widget — we do NOT assert on live-scan results;
 * only structural / a11y properties are tested.
 *
 * axe-core honest-broker note:
 *   We assert zero 'critical' or 'serious' violations at WCAG 2.1 AA.
 *   If axe finds real violations the test fails intentionally — violations are
 *   NOT suppressed or downgraded to warnings to produce a green run.
 */

import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// ─── helpers ──────────────────────────────────────────────────────────────────

/**
 * Wait for the page shell to be stable enough to test.
 * The Loader component fades out after hydration; we wait for the <main> to
 * be visible rather than a fixed timeout.
 */
async function waitForShell(page: import("@playwright/test").Page) {
  await page.waitForSelector("main", { state: "visible", timeout: 20_000 });
}

// ─── homepage loads ───────────────────────────────────────────────────────────

test.describe("Homepage — structure", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForShell(page);
  });

  test("has correct <title>", async ({ page }) => {
    await expect(page).toHaveTitle(/Prompt_Goblin/i);
  });

  test("Hero h1 is present and visible", async ({ page }) => {
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();
    // Must contain the hero headline words
    await expect(h1).toContainText(/AI search/i);
  });

  test("primary nav landmark is present", async ({ page }) => {
    const nav = page.locator('nav[aria-label="Primary"]');
    await expect(nav).toBeVisible();
  });

  test("page has a <main> landmark", async ({ page }) => {
    await expect(page.locator("main")).toBeVisible();
  });

  test("ThemeToggle button is present and has aria-pressed", async ({
    page,
  }) => {
    const toggle = page.locator('button[title="Toggle light / dark"]');
    await expect(toggle).toBeVisible();
    // aria-pressed must be a boolean string ("true" or "false")
    const pressed = await toggle.getAttribute("aria-pressed");
    expect(["true", "false"]).toContain(pressed);
  });
});

// ─── screenshot — desktop ─────────────────────────────────────────────────────

test.describe("Homepage — screenshots", () => {
  test("full-page screenshot (desktop)", async ({ page }) => {
    await page.goto("/");
    await waitForShell(page);
    // Screenshot is also captured automatically by `use: { screenshot: 'on' }`
    // in playwright.config.ts, but an explicit named snapshot makes it easy to
    // diff across runs.
    await page.screenshot({
      path: "test-results/homepage-desktop.png",
      fullPage: true,
    });
  });

  test("full-page screenshot (mobile)", async ({ page, isMobile }) => {
    // This test runs in both projects; mobile viewport is set by the project
    // config.  The label distinguishes the artifact.
    await page.goto("/");
    await waitForShell(page);
    const suffix = isMobile ? "mobile" : "desktop";
    await page.screenshot({
      path: `test-results/homepage-${suffix}-explicit.png`,
      fullPage: true,
    });
  });
});

// ─── theme toggle screenshot ──────────────────────────────────────────────────

test.describe("Homepage — palette toggle", () => {
  test("light-mode screenshot after toggle (skip gracefully if toggle absent)", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForShell(page);

    const toggle = page.locator('button[title="Toggle light / dark"]');
    const isPresent = await toggle.count();

    if (!isPresent) {
      test.skip(true, "ThemeToggle not found — skipping palette screenshot");
      return;
    }

    // Start in dark (default data-palette="dark" set by layout.tsx)
    await expect(page.locator("html")).toHaveAttribute("data-palette", "dark");

    await toggle.click();

    // After toggle the palette should switch to "bone" (light)
    await expect(page.locator("html")).toHaveAttribute("data-palette", "bone", {
      timeout: 3_000,
    });

    await page.screenshot({
      path: "test-results/homepage-light-mode.png",
      fullPage: true,
    });

    // Toggle back to dark for any subsequent tests
    await toggle.click();
    await expect(page.locator("html")).toHaveAttribute("data-palette", "dark", {
      timeout: 3_000,
    });
  });
});

// ─── axe-core a11y audit ──────────────────────────────────────────────────────

test.describe("Homepage — WCAG 2.1 AA (axe-core)", () => {
  test("zero critical or serious violations", async ({ page }) => {
    await page.goto("/");
    await waitForShell(page);

    const results = await new AxeBuilder({ page })
      // Target: WCAG 2.1 Level A + AA rules only
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    // Collect only critical and serious violations (best-practice / moderate
    // are surfaced in the report but not fail-gated here per honest-broker
    // rule — we hold the AA line on serious+critical only).
    const blocking = results.violations.filter((v) =>
      ["critical", "serious"].includes(v.impact ?? "")
    );

    if (blocking.length > 0) {
      // Format for easy reading in the CI log
      const report = blocking
        .map(
          (v) =>
            `[${v.impact?.toUpperCase()}] ${v.id}: ${v.description}\n` +
            v.nodes
              .slice(0, 3)
              .map((n) => `  selector: ${n.target.join(", ")}`)
              .join("\n")
        )
        .join("\n\n");

      // Fail loudly — do NOT suppress or skip
      throw new Error(
        `axe found ${blocking.length} critical/serious WCAG 2.1 AA violation(s):\n\n${report}`
      );
    }

    // Also surface moderate/minor as informational (not a failure)
    const informational = results.violations.filter((v) =>
      ["moderate", "minor"].includes(v.impact ?? "")
    );
    if (informational.length > 0) {
      console.warn(
        `axe informational (moderate/minor, not fail-gated): ${informational.map((v) => v.id).join(", ")}`
      );
    }
  });
});
