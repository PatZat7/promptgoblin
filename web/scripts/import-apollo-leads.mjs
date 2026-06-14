/**
 * import-apollo-leads.mjs
 *
 * Import Apollo people into the leads_queue CRM. COMPLIANT: Apollo is a LICENSED
 * B2B data provider accessed via its official API — this is not scraping and not
 * LinkedIn automation. The LinkedIn URLs come from Apollo's own `linkedin_url`
 * field. Email/phone are licensed reference data stored for the operator to act
 * on BY HAND; nothing here sends anything.
 *
 * Input: a mapped JSON array (default web/scripts/pending_apollo.json) with the
 * shape produced from an Apollo contacts/people pull:
 *   { apollo_contact_id, apollo_person_id, company_name, domain, contact_name,
 *     contact_title, linkedin_url, email, email_status, phone, headline,
 *     location, photo_url }
 *
 * Idempotent: rows whose apollo_person_id already exists for this owner are
 * SKIPPED (never clobbered) — re-running is safe. Dedups within the file too.
 *
 * Usage:
 *   node scripts/import-apollo-leads.mjs [path/to/pending_apollo.json] \
 *     [--owner-id <uuid> | --owner-email <email>] [--dry-run]
 *
 * Owner (one of, in precedence order): --owner-id, --owner-email,
 *   LEADS_OWNER_USER_ID, LEADS_OWNER_EMAIL.
 *
 * Env (web/.env.local or `doppler run`): NEXT_PUBLIC_SUPABASE_URL (or
 *   SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY. The service-role client bypasses
 *   RLS by design (server-side only), same trusted path as the other importers.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join, isAbsolute, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ENV_PATH = join(__dirname, "..", ".env.local");
const DEFAULT_INPUT = join(__dirname, "pending_apollo.json");

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
    "  Set them in web/.env.local (run: pwsh scripts/doppler-pull-env.ps1) or use `doppler run --`."
  );
  process.exit(1);
}

// ─── args ───────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const isDryRun = argv.includes("--dry-run");
const flag = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};
const ownerIdArg = flag("--owner-id");
const ownerEmailArg = flag("--owner-email");
const inputArg = argv.find((a) => !a.startsWith("--") && a !== ownerIdArg && a !== ownerEmailArg);
const INPUT_PATH = inputArg
  ? (isAbsolute(inputArg) ? inputArg : resolve(process.cwd(), inputArg))
  : DEFAULT_INPUT;

const STR = (v) => {
  const s = (v ?? "").toString().trim();
  return s.length ? s : null;
};
function normalizeDomain(raw) {
  let d = String(raw || "").trim().toLowerCase();
  if (!d) return "";
  d = d.replace(/^https?:\/\//, "").replace(/^www\./, "");
  d = d.split("/")[0].split("?")[0].split("#")[0];
  return d.trim();
}

// ─── CSV support (Apollo UI export) ──────────────────────────────────────────
// On a free API plan, net-new prospecting (mixed_people search) is blocked, so
// the scale path is: prospect in the Apollo UI → export CSV → import it here.

/** RFC-4180-ish CSV parser (handles quoted fields, embedded commas/newlines). */
function parseCsv(text) {
  const rows = [];
  let field = "", row = [], inQuotes = false;
  text = text.replace(/^﻿/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\r") { /* ignore */ }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function csvToObjects(text) {
  const rows = parseCsv(text).filter((r) => !(r.length === 1 && r[0] === ""));
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const o = {};
    headers.forEach((h, i) => { o[h] = (r[i] ?? "").trim(); });
    return o;
  });
}

/** Case-insensitive first-non-empty column lookup. */
function col(o, names) {
  for (const n of names) {
    for (const k of Object.keys(o)) {
      if (k.toLowerCase() === n.toLowerCase() && o[k]) return o[k];
    }
  }
  return null;
}

/** Map one Apollo export row to the mapped-lead shape. */
function mapApolloCsvRow(o) {
  const name =
    [col(o, ["First Name"]), col(o, ["Last Name"])].filter(Boolean).join(" ") ||
    col(o, ["Name", "Full Name"]);
  const website = col(o, ["Website", "Company Domain", "Primary Domain"]);
  const email = col(o, ["Email", "Primary Email"]);
  let domain = website ? normalizeDomain(website) : null;
  if (!domain && email && email.includes("@")) domain = email.split("@")[1].toLowerCase();
  const location =
    [col(o, ["City"]), col(o, ["State"]), col(o, ["Country"])].filter(Boolean).join(", ") || null;
  return {
    apollo_contact_id: col(o, ["Apollo Contact Id", "Contact Id"]),
    apollo_person_id: col(o, ["Apollo Person Id", "Person Id"]),
    company_name: col(o, ["Company", "Company Name for Emails", "Account Name", "Employer"]),
    domain,
    contact_name: name,
    contact_title: col(o, ["Title", "Job Title"]),
    linkedin_url: col(o, ["Person Linkedin Url", "LinkedIn Url", "Linkedin Url"]),
    email,
    email_status: col(o, ["Email Status"]),
    phone: col(o, ["Work Direct Phone", "Mobile Phone", "Corporate Phone", "Direct Phone", "Phone"]),
    headline: col(o, ["Headline"]),
    location,
    photo_url: null,
    icp_segment: col(o, ["Industry", "Keywords"]),
    source: "apollo-csv",
  };
}

// ─── main ─────────────────────────────────────────────────────────────────────

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function resolveOwnerUserId() {
  if (ownerIdArg) return ownerIdArg;
  const explicit = pick("LEADS_OWNER_USER_ID");
  if (explicit) return explicit;
  const email = ownerEmailArg || pick("LEADS_OWNER_EMAIL");
  if (!email) {
    throw new Error("No owner. Pass --owner-id <uuid> / --owner-email <email>, or set LEADS_OWNER_USER_ID / LEADS_OWNER_EMAIL.");
  }
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (error) throw error;
  const match = data.users.find((u) => (u.email || "").toLowerCase() === email.toLowerCase());
  if (!match) throw new Error(`owner email '${email}' not found in auth.users.`);
  return match.id;
}

async function main() {
  if (!existsSync(INPUT_PATH)) {
    console.error(`ERROR: input file not found: ${INPUT_PATH}`);
    process.exit(1);
  }
  const isCsv = INPUT_PATH.toLowerCase().endsWith(".csv");
  let records;
  try {
    const text = readFileSync(INPUT_PATH, "utf-8");
    if (isCsv) {
      records = csvToObjects(text).map(mapApolloCsvRow);
    } else {
      const raw = JSON.parse(text.replace(/^﻿/, ""));
      records = Array.isArray(raw) ? raw : Array.isArray(raw?.leads) ? raw.leads : null;
    }
  } catch (e) {
    console.error(`ERROR: could not read ${INPUT_PATH}: ${e.message}`);
    process.exit(1);
  }
  if (!records) {
    console.error("ERROR: expected a JSON array of mapped Apollo leads, or a .csv export.");
    process.exit(1);
  }

  const ownerUserId = await resolveOwnerUserId();
  console.log(`\n── Import Apollo leads ───────────────────────────────────────`);
  console.log(`  Source : ${INPUT_PATH}`);
  console.log(`  Owner  : ${ownerUserId}`);
  console.log(`  Mode   : ${isDryRun ? "DRY RUN (no writes)" : "live insert"}`);
  console.log(`  Records: ${records.length}`);

  // Clean + validate.
  const cleaned = [];
  const seen = new Set();
  let invalid = 0;
  for (const [i, rec] of records.entries()) {
    const company = STR(rec.company_name);
    const domain = normalizeDomain(rec.domain);
    const personId = STR(rec.apollo_person_id);
    if (!company || !domain) {
      console.warn(`  ! row ${i}: skipped (need company_name + domain)`);
      invalid++;
      continue;
    }
    const dedupeKey =
      personId || STR(rec.linkedin_url) || STR(rec.email) || `${company}|${STR(rec.contact_name) || ""}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    cleaned.push({
      owner_user_id: ownerUserId,
      apollo_contact_id: STR(rec.apollo_contact_id),
      apollo_person_id: personId,
      company_name: company,
      domain,
      contact_name: STR(rec.contact_name),
      contact_title: STR(rec.contact_title),
      linkedin_url: STR(rec.linkedin_url),
      email: STR(rec.email),
      email_status: STR(rec.email_status),
      phone: STR(rec.phone),
      headline: STR(rec.headline),
      location: STR(rec.location),
      photo_url: STR(rec.photo_url),
      icp_segment: STR(rec.icp_segment),
      source: STR(rec.source) || "apollo",
      status: "new",
    });
  }

  // Idempotent: skip rows whose apollo_person_id / linkedin_url / email already
  // exist for this owner. CSV exports often lack a person_id, so we also key on
  // linkedin_url + email.
  const { data: existingRows, error: existErr } = await admin
    .from("leads_queue")
    .select("apollo_person_id, linkedin_url, email")
    .eq("owner_user_id", ownerUserId);
  if (existErr) throw existErr;
  const existPid = new Set(), existLi = new Set(), existEmail = new Set();
  for (const r of existingRows || []) {
    if (r.apollo_person_id) existPid.add(r.apollo_person_id);
    if (r.linkedin_url) existLi.add(r.linkedin_url.toLowerCase());
    if (r.email) existEmail.add(r.email.toLowerCase());
  }
  const toInsert = cleaned.filter(
    (r) =>
      !(r.apollo_person_id && existPid.has(r.apollo_person_id)) &&
      !(r.linkedin_url && existLi.has(r.linkedin_url.toLowerCase())) &&
      !(r.email && existEmail.has(r.email.toLowerCase()))
  );
  const skipped = cleaned.length - toInsert.length;

  console.log(`\n  Valid: ${cleaned.length} · already in DB: ${skipped} · to insert: ${toInsert.length} · invalid: ${invalid}`);

  if (isDryRun) {
    for (const r of toInsert) console.log(`    + ${r.contact_name ?? "?"} — ${r.company_name} <${r.domain}>`);
    console.log("\n  DRY RUN — nothing written.\n");
    return;
  }
  if (!toInsert.length) {
    console.log("\n  Nothing new to insert.\n");
    return;
  }

  // Insert in batches of 100.
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += 100) {
    const batch = toInsert.slice(i, i + 100);
    const { data, error } = await admin.from("leads_queue").insert(batch).select("id");
    if (error) throw error;
    inserted += data.length;
  }
  console.log(`\n  Inserted ${inserted} lead(s).`);
  console.log(`  Review them in the dashboard at /crm.\n`);
}

main().catch((err) => {
  console.error("\nIMPORT ERROR:", err.message || err);
  process.exit(1);
});
