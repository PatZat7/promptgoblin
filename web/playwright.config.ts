/**
 * Playwright configuration for Prompt Goblin marketing site.
 *
 * Static-export strategy:
 *   `npm run build` writes web/out/.  We serve that directory with `serve`
 *   (a zero-config static server, pinned in devDependencies).  `serve` is
 *   chosen over a hand-rolled script because it handles trailingSlash /
 *   index.html rewrites exactly the same way Next.js exports expect, works
 *   offline / in CI without internet, and produces deterministic logs.
 *
 *   Port 4173 is the conventional Vite-preview port — unused by Next's dev
 *   server (3010) or build server (3000), so no collisions locally.
 *
 * CI vs local:
 *   reuseExistingServer: !process.env.CI  → locally, if something is already
 *   serving on 4173 we reuse it (fast iteration).  In CI we always start
 *   fresh so the test run is hermetic.
 */

import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in source */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Use 1 worker in CI to avoid port-conflict noise */
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["list"],
  ],

  use: {
    baseURL: BASE_URL,

    /* Capture a full-page screenshot after every test (pass or fail) */
    screenshot: { mode: "on", fullPage: true },

    /* Short timeout — static site, no SSR latency */
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },

  /* Screenshots land here (Playwright default inside test-results/) */
  outputDir: "test-results",

  projects: [
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["Pixel 7"],
        // Pixel 7 device preset already sets viewport, userAgent, etc.
      },
    },
  ],

  webServer: {
    /**
     * `npm run build` is intentionally NOT listed here — running it inside
     * the webServer block would re-build on every `playwright test` invocation.
     * Instead: ensure `out/` is current before running tests.
     * CI pipeline should run `npm run build` as a prior step.
     * Locally, the developer builds manually or once per session.
     *
     * We start `serve` pointing at the existing out/ directory.
     */
    command: `npx serve out -l ${PORT} --no-clipboard`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    stdout: "pipe",
    stderr: "pipe",
    timeout: 60_000,
  },
});
