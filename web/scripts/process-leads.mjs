/**
 * process-leads.mjs
 *
 * Track 2, step 2/3 — enrich leads with a REAL Tier-1 hygiene scan, then draft a
 * LinkedIn DM for HUMAN review and MANUAL send.
 *
 * For each lead with status 'new' (or --rescan for failures):
 *   1. POST the lead's domain to the live Tier-1 scan (the same DigitalOcean
 *      function the website uses). No mock, no theater.
 *   2. Store the REAL result:
 *        - ok      → hygiene_score + scan_report + status 'scanned'
 *        - not ok  → hygiene_score stays NULL, scan_status = honest outcome
 *                    (blocked_by_waf | unreachable | non_public | timeout | error),
 *                    status 'scan_failed'. A page we can't read is NEVER scored 0.
 *   3. On a successful scan, generate a short LinkedIn DM DRAFT from the REAL
 *      findings and store it in linkedin_dm_draft (status 'drafted').
 *
 * This script NEVER sends anything. It writes drafts to the DB. You open each
 * lead's linkedin_url by hand and paste the draft yourself.
 *
 * Usage:
 *   node scripts/process-leads.mjs [--limit N] [--dry-run] [--rescan]
 *   doppler run -- node scripts/process-leads.mjs --limit 10
 *
 * Flags:
 *   --limit N   max leads to process this run (default 10; be gentle)
 *   --dry-run   scan + print drafts, write NOTHING to the DB
 *   --rescan    also re-process status 'scan_failed' rows (e.g. transient WAF)
 *
 * Env (web/.env.local or `doppler run`):
 *   NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY
 *   LEADS_OWNER_USER_ID or LEADS_OWNER_EMAIL   (whose leads to process)
 *   LEADS_REPORT_LINK   optional; link the draft points to so they can see the
 *                       real scan themselves. Default: https://promptgoblin.io/#scan
 *                       (a public self-serve scan — NOT a fake per-lead dashboard).
 *
 * Honest-broker notes:
 *   - Tier-1 is a HYGIENE scan (parse/crawl health), NOT an AI-visibility or
 *     citation measure. The draft says exactly that and offers the deeper audit.
 *   - The draft is built ONLY from findings the scan actually returned. If the
 *     scan couldn't read the site, NO draft is written — you decide by hand.
 *   - No fabricated "visibility score", no invented "traffic you're losing".
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ENV_PATH = join(__dirname, "..", ".env.local");

const SCAN_TIER1 =
  "https://faas-nyc1-2ef2e6cc.doserverless.co/api/v1/web/fn-d4c19df5-3777-4a5d-9843-92f3ebf1f8e7/scan/tier1";

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
const REPORT_LINK = pick("LEADS_REPORT_LINK") || "https://promptgoblin.io/#scan";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "ERROR: need NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.\n" +
    "  Set them in web/.env.local (pwsh scripts/doppler-pull-env.ps1) or use `doppler run --`."
  );
  process.exit(1);
}

// ─── args ───────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const rescan = args.includes("--rescan");
const limitArg = args.find((a) => a.startsWith("--limit"));
let LIMIT = 10;
if (limitArg) {
  const inline = limitArg.includes("=") ? limitArg.split("=")[1] : args[args.indexOf(limitArg) + 1];
  const n = parseInt(inline, 10);
  if (Number.isFinite(n) && n > 0) LIMIT = n;
}

// ─── scan ─────────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Call the live Tier-1 scan. Returns the parsed envelope, or a synthetic
 *  { ok:false, outcome:'error' } on a true network/parse failure. */
async function scanDomain(domain) {
  const url = /^https?:\/\//.test(domain) ? domain : `https://${domain}`;
  try {
    const r = await fetch(SCAN_TIER1, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    // The function returns its honest JSON envelope even on non-2xx — don't gate on r.ok.
    return await r.json();
  } catch (e) {
    return { ok: false, outcome: "error", error: `scan request failed: ${e.message}` };
  }
}

// ─── draft (honest, deterministic, no LLM) ──────────────────────────────────────

function firstNameOf(lead) {
  const n = (lead.contact_name || "").trim();
  if (!n) return "there";
  return n.split(/\s+/)[0];
}

/** Pull the most material, HUMAN-readable findings the scan actually returned. */
function realHooks(report) {
  const hooks = [];
  const findings = Array.isArray(report?.findings) ? [...report.findings] : [];
  findings.sort((a, b) => (b.severity || 0) - (a.severity || 0));
  for (const f of findings.slice(0, 2)) {
    if (f?.detail) hooks.push(String(f.detail).replace(/\s+/g, " ").trim());
  }
  // Crawl-access facts are concrete and persuasive — surface if present.
  const crawl = report?.crawlability;
  if (crawl && crawl.present && crawl.welcomesAiBots === false) {
    hooks.push("your robots.txt doesn't clearly welcome the AI crawlers (GPTBot / PerplexityBot).");
  }
  return hooks.slice(0, 2);
}

/**
 * Build a short LinkedIn DM draft from a REAL successful scan.
 * Returns null if the scan wasn't ok (we never draft off a score we couldn't measure).
 */
function buildDmDraft(lead, scan) {
  if (!scan || scan.ok !== true || !scan.report) return null;
  const report = scan.report;
  const score = report.hygieneScore;
  const name = firstNameOf(lead);
  const hooks = realHooks(report);

  const hookLine = hooks.length
    ? hooks.map((h) => `• ${h}`).join("\n")
    : "• a couple of small, fixable parse/crawl gaps";

  // Honest framing branches on the REAL score — never pretend a clean site is broken.
  const lead_in =
    typeof score === "number" && score < 70
      ? `ran ${lead.domain} through our AI-search *hygiene* scan and it flagged some table-stakes gaps:`
      : `ran ${lead.domain} through our AI-search *hygiene* scan — hygiene's actually in decent shape (${score}/100). The gap for most teams isn't hygiene, it's the citation side:`;

  return [
    `Hi ${name} —`,
    ``,
    lead_in,
    hookLine,
    ``,
    `That's hygiene — whether ChatGPT/Perplexity can cleanly read you. It's table stakes, not a citation guarantee; what actually earns citations is brand mentions + Bing rank, which we measure separately.`,
    ``,
    `Happy to send the full breakdown (and you can run it yourself here: ${REPORT_LINK}). Worth a look?`,
  ].join("\n");
}

// ─── main ─────────────────────────────────────────────────────────────────────

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function resolveOwnerUserId() {
  const explicit = pick("LEADS_OWNER_USER_ID");
  if (explicit) return explicit;
  const email = pick("LEADS_OWNER_EMAIL");
  if (!email) throw new Error("Set LEADS_OWNER_USER_ID or LEADS_OWNER_EMAIL.");
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (error) throw error;
  const match = data.users.find((u) => (u.email || "").toLowerCase() === email.toLowerCase());
  if (!match) throw new Error(`LEADS_OWNER_EMAIL '${email}' not found.`);
  return match.id;
}

async function main() {
  const ownerUserId = await resolveOwnerUserId();
  const statuses = rescan ? ["new", "scan_failed"] : ["new"];

  const { data: leads, error } = await admin
    .from("leads_queue")
    .select("*")
    .eq("owner_user_id", ownerUserId)
    .in("status", statuses)
    .order("created_at", { ascending: true })
    .limit(LIMIT);
  if (error) throw error;

  console.log(`\n── Process leads ─────────────────────────────────────────────`);
  console.log(`  Owner : ${ownerUserId}`);
  console.log(`  Mode  : ${isDryRun ? "DRY RUN (no writes)" : "live"}${rescan ? " · rescan" : ""}`);
  console.log(`  Queue : ${leads.length} lead(s) [${statuses.join(", ")}], limit ${LIMIT}\n`);

  if (!leads.length) {
    console.log("  Nothing to process. Import leads first: node scripts/import-local-leads.mjs\n");
    return;
  }

  let scanned = 0, failed = 0, drafted = 0;

  for (const lead of leads) {
    process.stdout.write(`  • ${lead.domain} … `);
    const scan = await scanDomain(lead.domain);
    const scannedAt = new Date().toISOString();

    if (scan && scan.ok === true && scan.report) {
      const score = typeof scan.report.hygieneScore === "number" ? scan.report.hygieneScore : null;
      const draft = buildDmDraft(lead, scan);
      const update = {
        hygiene_score: score,                       // real; may be null if the report omitted it
        scan_status: "ok",
        scan_summary: scan.summary || null,
        scan_report: scan.report,
        scanned_at: scannedAt,
        linkedin_dm_draft: draft,
        drafted_at: draft ? scannedAt : null,
        status: draft ? "drafted" : "scanned",
      };
      console.log(`hygiene ${score ?? "?"}/100 → ${update.status}`);
      if (draft) drafted++;
      scanned++;
      if (!isDryRun) {
        const { error: upErr } = await admin.from("leads_queue").update(update).eq("id", lead.id);
        if (upErr) console.error(`      ! write failed: ${upErr.message}`);
      } else if (draft) {
        console.log("      ┌ draft ─────────────────────────────");
        console.log(draft.split("\n").map((l) => "      │ " + l).join("\n"));
        console.log("      └────────────────────────────────────");
      }
    } else {
      // Honest failure. NEVER score 0. Record the real outcome.
      const outcome = scan?.outcome || "error";
      const update = {
        hygiene_score: null,                        // blind spot, not a 0
        scan_status: ["blocked_by_waf", "unreachable", "non_public", "timeout", "error"].includes(outcome)
          ? outcome
          : "error",
        scan_summary: scan?.error || `scan not ok (${outcome})`,
        scan_report: scan || null,
        scanned_at: scannedAt,
        status: "scan_failed",
      };
      console.log(`could not read (${update.scan_status}) → scan_failed [no draft]`);
      failed++;
      if (!isDryRun) {
        const { error: upErr } = await admin.from("leads_queue").update(update).eq("id", lead.id);
        if (upErr) console.error(`      ! write failed: ${upErr.message}`);
      }
    }

    await sleep(1500); // be polite to the scan function
  }

  console.log(`\n── Summary ───────────────────────────────────────────────────`);
  console.log(`  scanned ok : ${scanned}`);
  console.log(`  drafted    : ${drafted} (status 'drafted' — review + send by hand)`);
  console.log(`  failed     : ${failed} (honest blind spots; --rescan to retry)`);
  console.log(
    isDryRun
      ? `\n  DRY RUN — nothing written.\n`
      : `\n  Review drafts in the leads_queue table (or the /approvals view), then send manually.\n`
  );
}

main().catch((err) => {
  console.error("\nPROCESS ERROR:", err.message || err);
  process.exit(1);
});
