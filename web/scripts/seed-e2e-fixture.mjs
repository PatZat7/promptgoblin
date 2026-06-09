/**
 * seed-e2e-fixture.mjs
 *
 * Creates (or tears down) a throwaway Supabase fixture user and seeded data
 * for the Playwright dashboard e2e suite.
 *
 * Usage:
 *   node scripts/seed-e2e-fixture.mjs          # seed + write TEST_SESSION_COOKIE
 *   node scripts/seed-e2e-fixture.mjs --teardown  # delete user + all owned rows
 *
 * Reads from web/.env.local (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).
 * Writes TEST_SESSION_COOKIE + TEST_WAF_RUN_ID back to web/.env.local.
 *
 * Honest-broker notes:
 * - All seeding uses the service-role admin client (bypasses RLS per design).
 * - The throwaway user has a generated email, never a real person.
 * - Teardown deletes the user (cascade removes all owned rows) + verifies 0 residual.
 * - Never claims a mock/skip as a real pass.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ENV_PATH = join(__dirname, "..", ".env.local");

// ─── load env ─────────────────────────────────────────────────────────────────

function loadEnv(path) {
  const lines = readFileSync(path, "utf-8").split("\n");
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    // strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function updateEnvLocal(path, updates) {
  let content = readFileSync(path, "utf-8");
  for (const [key, value] of Object.entries(updates)) {
    const pattern = new RegExp(`^(#\\s*)?${key}=.*$`, "m");
    const newLine = `${key}=${value}`;
    if (pattern.test(content)) {
      content = content.replace(pattern, newLine);
    } else {
      content += `\n${newLine}\n`;
    }
  }
  writeFileSync(path, content, "utf-8");
  console.log(`  Updated ${path}:`, Object.keys(updates).join(", "));
}

// ─── cookie encoding ──────────────────────────────────────────────────────────

const MAX_CHUNK_SIZE = 3180;

/**
 * Encode a Supabase session as @supabase/ssr-compatible cookies.
 * The session JSON is stored under the key `sb-<projectRef>-auth-token`.
 * If the URL-encoded value exceeds MAX_CHUNK_SIZE, it is split into
 * `sb-<ref>-auth-token.0`, `.1`, … (same logic as the ssr chunker).
 *
 * Returns an array of { name, value } pairs ready for Playwright `addCookies`.
 */
function encodeSessionCookies(projectRef, session) {
  const key = `sb-${projectRef}-auth-token`;
  const value = JSON.stringify(session);

  const encoded = encodeURIComponent(value);
  if (encoded.length <= MAX_CHUNK_SIZE) {
    return [{ name: key, value }];
  }

  // Chunk the encoded string, then decode each chunk's boundary-safe slice
  const chunks = [];
  let remaining = encoded;
  while (remaining.length > 0) {
    let head = remaining.slice(0, MAX_CHUNK_SIZE);
    // Don't cut mid-%XX escape
    const lastPercent = head.lastIndexOf("%");
    if (lastPercent > MAX_CHUNK_SIZE - 3) {
      head = head.slice(0, lastPercent);
    }
    // Recover the original (non-encoded) string for this chunk boundary
    let chunkValue;
    let attempt = head;
    while (true) {
      try {
        chunkValue = decodeURIComponent(attempt);
        break;
      } catch {
        attempt = attempt.slice(0, attempt.length - 3);
      }
    }
    chunks.push(chunkValue);
    remaining = remaining.slice(attempt.length);
  }

  return chunks.map((chunkVal, i) => ({ name: `${key}.${i}`, value: chunkVal }));
}

// ─── main ─────────────────────────────────────────────────────────────────────

const isTeardown = process.argv.includes("--teardown");

const env = loadEnv(ENV_PATH);
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in web/.env.local");
  process.exit(1);
}

// Extract project ref from URL (e.g. https://teeztxhrolhmmibxnnxi.supabase.co)
const projectRef = new URL(SUPABASE_URL).hostname.split(".")[0];

// Admin client (bypasses RLS — service role only, never shipped to browser)
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ─── teardown ─────────────────────────────────────────────────────────────────

async function teardown() {
  console.log("\n── Teardown ──────────────────────────────────────────────────");
  const fixtureEmail = env.E2E_FIXTURE_USER_EMAIL;
  const fixtureUserId = env.E2E_FIXTURE_USER_ID;

  if (!fixtureUserId && !fixtureEmail) {
    console.log("  No E2E_FIXTURE_USER_ID or E2E_FIXTURE_USER_EMAIL in .env.local — nothing to tear down.");
    return;
  }

  let userId = fixtureUserId;
  if (!userId) {
    // Look up by email
    const { data: { users }, error } = await admin.auth.admin.listUsers({ perPage: 100 });
    if (error) throw error;
    const match = users.find(u => u.email === fixtureEmail);
    if (!match) {
      console.log(`  User ${fixtureEmail} not found — already deleted.`);
      return;
    }
    userId = match.id;
  }

  console.log(`  Deleting user ${userId}...`);
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    console.error("  ERROR deleting user:", deleteError.message);
    throw deleteError;
  }
  console.log("  User deleted (cascade removed owned rows).");

  // Verify no residual rows in clients (cascade should have handled everything)
  const { data: residual } = await admin.from("clients").select("id").eq("owner_user_id", userId);
  if (residual && residual.length > 0) {
    console.error(`  WARN: ${residual.length} residual clients rows after delete!`);
  } else {
    console.log("  Verified: 0 residual client rows.");
  }

  // Remove from .env.local
  updateEnvLocal(ENV_PATH, {
    TEST_SESSION_COOKIE: "",
    TEST_WAF_RUN_ID: "",
    E2E_FIXTURE_USER_EMAIL: "",
    E2E_FIXTURE_USER_ID: "",
  });
  console.log("  Cleared fixture vars from .env.local.\n");
}

// ─── seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("\n── Seed ──────────────────────────────────────────────────────");

  // 1. Create throwaway confirmed auth user
  const email = `e2e-fixture-${Date.now()}@pg-test.invalid`;
  const password = `E2EFixture!${Math.random().toString(36).slice(2, 10)}`;

  console.log(`  Creating test user: ${email}`);
  const { data: createData, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
  if (createError) throw createError;
  const userId = createData.user.id;
  console.log(`  User created: ${userId}`);

  // 2. Seed a client owned by that user (service role bypasses RLS)
  const clientId = crypto.randomUUID();
  const { error: clientError } = await admin.from("clients").insert({
    id: clientId,
    owner_user_id: userId,
    slug: `e2e-fixture-${Date.now()}`,
    name: "E2E Fixture Client",
    domain: `e2e-fixture-${Date.now()}.example.com`,
    tier: "starter",
    is_sample: false,
  });
  if (clientError) throw clientError;
  console.log(`  Client seeded: ${clientId}`);
  const { error: membershipError } = await admin.from("client_memberships").insert({
    client_id: clientId,
    user_id: userId,
    role: "admin",
    scan_tier: "tier3",
    can_run_scans: true,
    can_review: true,
  });
  if (membershipError) throw membershipError;
  console.log(`  Membership seeded for ${userId}`);

  // 3. Seed a LIVE APPROVED run (the "visible" run)
  const liveRunId = crypto.randomUUID();
  // Get the domain we actually stored
  const { data: clientRow } = await admin.from("clients").select("domain").eq("id", clientId).single();
  const clientDomain = clientRow?.domain ?? "e2e-fixture.example.com";
  const liveVisibilityWithDomain = {
    [clientDomain]: 0.31,
    "competitor-a.example.com": 0.42,
    "competitor-b.example.com": 0.27,
  };

  const { error: liveRunError } = await admin.from("runs").insert({
    id: liveRunId,
    client_id: clientId,
    owner_user_id: userId,
    graph_snapshot: { version: 1, visibility_by_engine: { chatgpt: 0.25, perplexity: 0.38, gemini: null, claude: null } },
    snapshot_schema: 1,
    mode: "live",
    visibility: liveVisibilityWithDomain,
    visibility_score: 0.31,
    confidence: "high",
    low_confidence: false,
    blind_spot: null,
    approved: true,
    status: "complete",
    is_sample: false,
  });
  if (liveRunError) throw liveRunError;
  console.log(`  Live run seeded: ${liveRunId}`);

  // 4. Seed a second LIVE APPROVED run (older, to produce a real delta on the first)
  const olderRunId = crypto.randomUUID();
  const olderVisibility = {
    [clientDomain]: 0.18,
    "competitor-a.example.com": 0.51,
    "competitor-b.example.com": 0.31,
  };

  // Insert the older run with an explicit earlier timestamp
  const { error: olderRunError } = await admin.from("runs").insert({
    id: olderRunId,
    client_id: clientId,
    owner_user_id: userId,
    graph_snapshot: { version: 1 },
    snapshot_schema: 1,
    mode: "live",
    visibility: olderVisibility,
    visibility_score: 0.18,
    confidence: "high",
    low_confidence: false,
    blind_spot: null,
    approved: true,
    status: "complete",
    is_sample: false,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
  });
  if (olderRunError) throw olderRunError;
  console.log(`  Older run seeded: ${olderRunId} (7 days ago)`);

  // 5. Seed a BLIND-SPOT run (WAF block, approved)
  const wafRunId = crypto.randomUUID();
  const { error: wafRunError } = await admin.from("runs").insert({
    id: wafRunId,
    client_id: clientId,
    owner_user_id: userId,
    graph_snapshot: { version: 1 },
    snapshot_schema: 1,
    mode: "live",
    visibility: null,
    visibility_score: null, // NULL for blind-spot — never 0
    confidence: "low",
    low_confidence: true,
    blind_spot: "WAF/Akamai 403 — page couldn't be fully read; result is a blind spot, not 0.",
    approved: true,
    status: "complete",
    is_sample: false,
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
  });
  if (wafRunError) throw wafRunError;
  console.log(`  WAF blind-spot run seeded: ${wafRunId}`);

  // 6. Seed recommendations for the live run
  //    - One LOCKED fix (human_reviewed=false) — snippet must never be sent to browser
  //    - One APPROVED+REVIEWED fix (snippet exposed)
  const { error: rec1Error } = await admin.from("recommendations").insert({
    run_id: liveRunId,
    owner_user_id: userId,
    fix_id: "FIX-e2e-001",
    title: "Add FAQ schema to /faq",
    kind: "schema",
    engine_lane: "both",
    priority: "high",
    impact: 4,
    effort: 2,
    score: 8,
    rationale: "FAQ-formatted content on this page is not wrapped in FAQPage schema. Schema is hygiene, not a citation guarantee.",
    status: "proposed",
    human_reviewed: false,
    snippet: "<!-- LOCKED: this should never appear in browser DOM -->",
    is_sample: false,
  });
  if (rec1Error) throw rec1Error;

  const { error: rec2Error } = await admin.from("recommendations").insert({
    run_id: liveRunId,
    owner_user_id: userId,
    fix_id: "FIX-e2e-002",
    title: "Add brand mention context to /about",
    kind: "citation",
    engine_lane: "chatgpt",
    priority: "medium",
    impact: 3,
    effort: 2,
    score: 6,
    rationale: "The /about page lacks brand-differentiating language that answer engines pick up as citation anchors.",
    status: "approved",
    human_reviewed: true,
    snippet: '<meta name="description" content="Prompt Goblin — AEO + GEO specialists.">',
    is_sample: false,
  });
  if (rec2Error) throw rec2Error;
  console.log(`  Recommendations seeded (1 locked, 1 approved+reviewed) for run ${liveRunId}`);

  // 7. Seed verification_results for the live run
  const { error: vr1Error } = await admin.from("verification_results").insert({
    run_id: liveRunId,
    owner_user_id: userId,
    method: "axe_core",
    status: "verified",
    passed: true,
    verdict: "WCAG 2.1 AA — 0 critical/serious violations",
    is_sample: false,
  });
  if (vr1Error) throw vr1Error;

  const { error: vr2Error } = await admin.from("verification_results").insert({
    run_id: liveRunId,
    owner_user_id: userId,
    method: "static_fetch",
    status: "unverifiable",
    passed: null,
    verdict: "Page behind auth — static fetch returned 403",
    is_sample: false,
  });
  if (vr2Error) throw vr2Error;
  console.log("  Verification results seeded for live run.");

  // 8. Mint a session for the fixture user.
  // Use signInWithPassword (we set a password above) — it returns a real
  // access+refresh session, which we encode as the @supabase/ssr cookie below.
  console.log("  Signing in as fixture user to get session...");
  const anonClient = createClient(SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: sessionData, error: sessionError } = await anonClient.auth.signInWithPassword({
    email,
    password,
  });
  if (sessionError) throw sessionError;

  const session = sessionData.session;
  if (!session) {
    throw new Error("signInWithPassword returned no session");
  }
  console.log(`  Session minted. Expires: ${new Date(session.expires_at * 1000).toISOString()}`);

  // 9. Encode session as @supabase/ssr cookies
  const cookies = encodeSessionCookies(projectRef, {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    expires_in: session.expires_in,
    token_type: session.token_type,
    user: session.user,
  });

  const cookieString = cookies.map(c => `${c.name}=${c.value}`).join("; ");
  console.log(`  Encoded ${cookies.length} cookie chunk(s): ${cookies.map(c => c.name).join(", ")}`);

  // 10. Write env vars back to .env.local
  updateEnvLocal(ENV_PATH, {
    TEST_SESSION_COOKIE: cookieString,
    TEST_WAF_RUN_ID: wafRunId,
    E2E_FIXTURE_USER_EMAIL: email,
    E2E_FIXTURE_USER_ID: userId,
  });

  console.log("\n── Summary ───────────────────────────────────────────────────");
  console.log("  User:      ", email, `(id: ${userId})`);
  console.log("  Client:    ", clientId);
  console.log("  Live run:  ", liveRunId, "(approved, visible)");
  console.log("  Older run: ", olderRunId, "(approved, delta baseline)");
  console.log("  WAF run:   ", wafRunId, "(blind-spot, approved)");
  console.log("  Cookie:    ", cookies.length === 1 ? "single chunk" : `${cookies.length} chunks`);
  console.log("\nTEST_SESSION_COOKIE and TEST_WAF_RUN_ID written to web/.env.local.");
  console.log("Run teardown after tests: node scripts/seed-e2e-fixture.mjs --teardown\n");
}

// ─── entry ────────────────────────────────────────────────────────────────────

(async () => {
  try {
    if (isTeardown) {
      await teardown();
    } else {
      await seed();
    }
  } catch (err) {
    console.error("SEED SCRIPT ERROR:", err);
    process.exit(1);
  }
})();
