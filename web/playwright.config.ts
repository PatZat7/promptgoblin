/**
 * Playwright configuration for Prompt Goblin marketing site + SSR dashboard.
 *
 * Two web servers:
 *   1. Static-export server on :4173 — serves web/out/ via `serve` for the
 *      homepage spec (homepage.spec.ts). Uses the pre-built static export.
 *   2. SSR dashboard server on :3010 — runs `next dev` for the Node/SSR
 *      dashboard routes (/dashboard, /runs, /runs/[id], /runs/[id]/fixes,
 *      /login). The dashboard spec (dashboard.spec.ts) uses DASHBOARD_BASE_URL
 *      (defaults to http://localhost:3010) for its BASE, so it is decoupled
 *      from the homepage baseURL.
 *
 * Port assignment:
 *   4173 — conventional Vite-preview port, used here for the static server.
 *   3010 — Next.js dev server (matches web/package.json "dev" script + AGENTS.md).
 *
 * CI vs local:
 *   reuseExistingServer: !process.env.CI  → locally, already-running servers
 *   are reused (fast iteration). In CI we always start fresh (hermetic).
 *
 * Dashboard env gating:
 *   The dashboard spec skips itself when NEXT_PUBLIC_SUPABASE_URL is absent.
 *   The SSR server block is always listed so Playwright starts it — the spec's
 *   own guards handle the no-Supabase case gracefully.
 */

import { defineConfig, devices } from "@playwright/test";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// Load web/.env.local into process.env so the dashboard spec's skip guards
// (NEXT_PUBLIC_SUPABASE_URL, TEST_SESSION_COOKIE, TEST_WAF_RUN_ID) work in the
// test process. Next.js loads .env.local automatically when running next dev/start;
// Playwright does not, so we replicate the load here.
const envLocalPath = join(__dirname, ".env.local");
if (existsSync(envLocalPath)) {
  const lines = readFileSync(envLocalPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

const STATIC_PORT = 4173;
const STATIC_BASE_URL = `http://localhost:${STATIC_PORT}`;

const DASHBOARD_PORT = 3010;
const DASHBOARD_BASE_URL =
  process.env.DASHBOARD_BASE_URL ?? `http://localhost:${DASHBOARD_PORT}`;

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
    /* Homepage spec uses baseURL; dashboard spec uses its own BASE from env */
    baseURL: STATIC_BASE_URL,

    /* Capture a full-page screenshot after every test (pass or fail) */
    screenshot: { mode: "on", fullPage: true },

    /* SSR routes may be slower than static — bump timeouts.
     * actionTimeout: per-action timeout (click, fill, etc.)
     * navigationTimeout: page.goto / page.waitForURL
     * Note: the per-test timeout is set via `timeout` at the config level below. */
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
  },

  /* Per-test timeout. SSR dashboard tests hit cold-start Turbopack compilation
   * on first run — allow 90 s so the fixes page (last to compile) doesn't timeout. */
  timeout: 90_000,

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

  webServer: [
    {
      /**
       * Static-export server for the marketing site (homepage.spec.ts).
       * `npm run build` must have been run before `playwright test` so out/
       * exists. We do NOT re-build here to avoid rebuilding on every test run.
       * CI: run `npm run build` as a prior step.
       */
      command: `npx serve out -l ${STATIC_PORT} --no-clipboard`,
      url: STATIC_BASE_URL,
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
      stderr: "pipe",
      timeout: 60_000,
    },
    {
      /**
       * SSR Node server for the dashboard (dashboard.spec.ts).
       * Runs `next dev` — no separate build step needed. Auth cookies, SSR
       * middleware, and Supabase session handling work only under Node runtime.
       * `DASHBOARD_BASE_URL` can override the base URL (e.g. for a preview).
       *
       * env file: web/.env.local must contain NEXT_PUBLIC_SUPABASE_URL,
       * NEXT_PUBLIC_SUPABASE_ANON_KEY, and optionally TEST_SESSION_COOKIE.
       * next dev reads .env.local automatically.
       */
      command: `npx next dev --port ${DASHBOARD_PORT}`,
      url: DASHBOARD_BASE_URL,
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
      stderr: "pipe",
      /* next dev takes longer to start than a static server */
      timeout: 120_000,
      env: {
        NODE_ENV: "development",
      },
    },
  ],
});
