/**
 * import-local-leads.mjs
 *
 * Track 2, step 1 — LOCAL, COMPLIANT lead ingestion.
 *
 * Reads a local JSON file of leads (which YOU generate by hand, with your own
 * standalone tools) and inserts them into the Supabase `leads_queue` table.
 * There is NO browser automation and NO third-party platform is driven here —
 * this script only reads a file and writes rows.
 *
 * Usage:
 *   node scripts/import-local-leads.mjs [path/to/pending_leads.json] [--dry-run]
 *   doppler run -- node scripts/import-local-leads.mjs            # if using Doppler
 *
 * Defaults the input path to web/scripts/pending_leads.json.
 * See web/scripts/pending_leads.example.json for the expected shape.
 *
 * Reads from web/.env.local (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY),
 * falling back to process.env (so `doppler run --` also works).
 *
 * Owner: every row needs owner_user_id (for dashboard RLS). Provide ONE of:
 *   LEADS_OWNER_USER_ID=<auth.users uuid>     (preferred)
 *   LEADS_OWNER_EMAIL=<your login email>      (resolved via the admin API)
 *
 * Honest-broker notes:
 *   - Inserts only identity fields with status 'new'. Re-running is idempotent:
 *     existing (owner, domain) rows are SKIPPED, never clobbered, so a re-import
 *     can't wipe a real scan or a reviewed draft.
 *   - The service-role admin client bypasses RLS by design (server-side only).
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join, isAbsolute, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ENV_PATH = join(__dirname, "..", ".env.local");
const DEFAULT_INPUT = join(__dirname, "pending_leads.json");

// ─── env ────────────────────────────────────────────────────────────────────

function loadEnv(path) {
  const env = {};
  if (!existsSync(path)) return env;
  for (const line of readFileSync(path, "utf-8").replace(/^﻿/, "").split("\n")) {
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
    env[key] = value;
  }
  return env;
}

const fileEnv = loadEnv(ENV_PATH);
const pick = (k) => process.env[k] || fileEnv[k] || "";

const SUPABASE_URL = pick("NEXT_PUBLIC_SUPABASE_URL") || pick("SUPABASE_URL");
const SERVICE_ROLE_KEY = pick("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "ERROR: need NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.\n" +
    "  Either set them in web/.env.local (run: pwsh scripts/doppler-pull-env.ps1)\n" +
    "  or run via: doppler run -- node scripts/import-local-leads.mjs"
  );
  process.exit(1);
}

// ─── args ───────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const inputArg = args.find((a) => !a.startsWith("--"));
const INPUT_PATH = inputArg
  ? (isAbsolute(inputArg) ? inputArg : resolve(process.cwd(), inputArg))
  : DEFAULT_INPUT;

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Normalize a domain: lowercase, strip scheme, strip www., drop any path/query. */
function normalizeDomain(raw) {
  let d = String(raw || "").trim().toLowerCase();
  if (!d) return "";
  d = d.replace(/^https?:\/\//, "").replace(/^www\./, "");
  d = d.split("/")[0].split("?")[0].split("#")[0];
  return d.trim();
}

const STR = (v) => {
  const s = (v ?? "").toString().trim();
  return s.length ? s : null;
};

// ─── main ─────────────────────────────────────────────────────────────────────

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function resolveOwnerUserId() {
  const explicit = pick("LEADS_OWNER_USER_ID");
  if (explicit) return explicit;
  const email = pick("LEADS_OWNER_EMAIL");
  if (!email) {
    throw new Error(
      "No owner. Set LEADS_OWNER_USER_ID=<auth uuid> or LEADS_OWNER_EMAIL=<your login email>."
    );
  }
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (error) throw error;
  const match = data.users.find((u) => (u.email || "").toLowerCase() === email.toLowerCase());
  if (!match) throw new Error(`LEADS_OWNER_EMAIL '${email}' not found in auth.users.`);
  return match.id;
}

async function main() {
  if (!existsSync(INPUT_PATH)) {
    console.error(`ERROR: input file not found: ${INPUT_PATH}`);
    console.error("  Copy web/scripts/pending_leads.example.json → pending_leads.json and fill it in.");
    process.exit(1);
  }

  let raw;
  try {
    raw = JSON.parse(readFileSync(INPUT_PATH, "utf-8").replace(/^﻿/, ""));
  } catch (e) {
    console.error(`ERROR: ${INPUT_PATH} is not valid JSON: ${e.message}`);
    process.exit(1);
  }
  const records = Array.isArray(raw) ? raw : Array.isArray(raw?.leads) ? raw.leads : null;
  if (!records) {
    console.error("ERROR: expected a JSON array of leads, or { \"leads\": [...] }.");
    process.exit(1);
  }

  const ownerUserId = await resolveOwnerUserId();
  console.log(`\n── Import leads ──────────────────────────────────────────────`);
  console.log(`  Source : ${INPUT_PATH}`);
  console.log(`  Owner  : ${ownerUserId}`);
  console.log(`  Mode   : ${isDryRun ? "DRY RUN (no writes)" : "live insert"}`);
  console.log(`  Records: ${records.length}`);

  // Clean + validate.
  const cleaned = [];
  const seen = new Set();
  let invalid = 0;
  for (const [i, rec] of records.entries()) {
    const domain = normalizeDomain(rec.domain);
    const company = STR(rec.company_name) || STR(rec.company);
    if (!domain || !company) {
      console.warn(`  ! row ${i}: skipped (need company_name + domain) — ${JSON.stringify(rec).slice(0, 80)}`);
      invalid++;
      continue;
    }
    if (seen.has(domain)) {
      console.warn(`  ! row ${i}: duplicate domain in file (${domain}) — keeping first`);
      continue;
    }
    seen.add(domain);
    cleaned.push({
      owner_user_id: ownerUserId,
      company_name: company,
      domain,
      contact_name: STR(rec.contact_name),
      contact_title: STR(rec.contact_title),
      linkedin_url: STR(rec.linkedin_url),
      competitor: STR(rec.competitor) ? normalizeDomain(rec.competitor) : null,
      icp_segment: STR(rec.icp_segment),
      source: STR(rec.source) || "local-import",
      status: "new",
    });
  }

  // Skip domains that already exist for this owner (idempotent; never clobber).
  const { data: existingRows, error: existErr } = await admin
    .from("leads_queue")
    .select("domain")
    .eq("owner_user_id", ownerUserId);
  if (existErr) throw existErr;
  const existing = new Set((existingRows || []).map((r) => r.domain));
  const toInsert = cleaned.filter((r) => !existing.has(r.domain));
  const skipped = cleaned.length - toInsert.length;

  console.log(`\n  Valid: ${cleaned.length} · already in DB: ${skipped} · to insert: ${toInsert.length} · invalid: ${invalid}`);

  if (isDryRun) {
    for (const r of toInsert) console.log(`    + ${r.company_name} <${r.domain}>`);
    console.log("\n  DRY RUN — nothing written.\n");
    return;
  }
  if (!toInsert.length) {
    console.log("\n  Nothing new to insert.\n");
    return;
  }

  const { data, error } = await admin.from("leads_queue").insert(toInsert).select("id, domain");
  if (error) throw error;
  console.log(`\n  Inserted ${data.length} lead(s):`);
  for (const r of data) console.log(`    ✓ ${r.domain}`);
  console.log(`\n  Next: node scripts/process-leads.mjs --limit 10\n`);
}

main().catch((err) => {
  console.error("\nIMPORT ERROR:", err.message || err);
  process.exit(1);
});
