#!/usr/bin/env node
"use strict";

/**
 * Prompt Goblin — fill + send the branded scan-report email, pixel-perfect.
 *
 * Zero dependencies (native fetch + fs, Node 18+). Reads scan-report.html,
 * replaces every {{PLACEHOLDER}} with values from a JSON data file, and sends
 * via Resend or Postmark from goblins@promptgoblin.io.
 *
 * HONEST-BROKER GUARDS (do not remove):
 *  - DRY RUN BY DEFAULT. Nothing is sent without an explicit --send. The dry run
 *    writes a filled .html you can open + proof-read first.
 *  - Refuses to send if ANY {{PLACEHOLDER}} is still unfilled.
 *  - Refuses to send a 0 / blank / non-numeric SCORE (the SPA static-fetch blind
 *    spot — never report a near-zero score as fact for a site we couldn't render).
 *    Override only with --allow-zero, and only when the score is genuinely real.
 *  - The template's disclaimer block is never altered here: hygiene is not a
 *    citation guarantee; the refund covers the work, never a number.
 *
 * SECRETS: the API key lives ONLY in a gitignored email-templates/.env (see
 * .env.example). It is never printed, never committed.
 *
 * USAGE
 *   node email-templates/send.mjs --data lead.json            # dry run (no send)
 *   node email-templates/send.mjs --data lead.json --send     # actually send
 *   node email-templates/send.mjs --help
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// .env loader (minimal; does not overwrite vars already in the environment)
// ---------------------------------------------------------------------------
function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}
// Local override first (email-templates/.env), then the repo-root .env where this
// project keeps its secrets. loadEnv never overwrites an already-set var, so
// precedence is: inline env > email-templates/.env > root .env.
loadEnv(path.join(HERE, ".env"));
loadEnv(path.join(HERE, "..", ".env"));

// ---------------------------------------------------------------------------
// args
// ---------------------------------------------------------------------------
const argv = process.argv.slice(2);
const opt = { send: false, allowZero: false };
for (let i = 0; i < argv.length; i += 1) {
  const a = argv[i];
  if (a === "--send") opt.send = true;
  else if (a === "--allow-zero") opt.allowZero = true;
  else if (a === "--data") opt.data = argv[++i];
  else if (a === "--to") opt.to = argv[++i];
  else if (a === "--template") opt.template = argv[++i];
  else if (a === "--out") opt.out = argv[++i];
  else if (a === "--help" || a === "-h") opt.help = true;
  else {
    fail(`Unknown argument: ${a}  (try --help)`);
  }
}

const HELP = `Prompt Goblin scan-report mailer

  node email-templates/send.mjs --data <file.json> [--send] [options]

Required:
  --data <file>     JSON of placeholder values + recipient (see lead.example.json)

Options:
  --send            Actually send. WITHOUT this flag it is a DRY RUN (writes a
                    filled .html and prints a summary; sends nothing).
  --to <email>      Override the "to" address from the data file.
  --template <path> Source template (default: ./scan-report.html)
  --out <path>      Dry-run output file (default: ./scan-report.filled.html)
  --allow-zero      Permit a 0 / non-numeric SCORE (SPA blind-spot override).
  --help            This text.

Environment (email-templates/.env — see .env.example):
  EMAIL_PROVIDER    "resend" (default) or "postmark"
  RESEND_API_KEY    if provider=resend
  POSTMARK_API_TOKEN if provider=postmark
  MAIL_FROM         e.g. Prompt Goblin <goblins@promptgoblin.io>
  MAIL_REPLY_TO     optional reply-to address
`;

if (opt.help) {
  process.stdout.write(HELP);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
function fail(msg) {
  console.error(`✖ ${msg}`);
  process.exit(1);
}
function need(name) {
  const v = process.env[name];
  if (!v) fail(`Missing ${name}. Add it to email-templates/.env (see .env.example). Never commit it.`);
  return v;
}
const escapeHtml = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim());

// ---------------------------------------------------------------------------
// load template + data
// ---------------------------------------------------------------------------
if (!opt.data) fail("Missing --data <file.json>. See lead.example.json.");

const templatePath = opt.template
  ? path.resolve(opt.template)
  : path.join(HERE, "scan-report.html");
const dataPath = path.resolve(opt.data);
if (!fs.existsSync(templatePath)) fail(`Template not found: ${templatePath}`);
if (!fs.existsSync(dataPath)) fail(`Data file not found: ${dataPath}`);

const template = fs.readFileSync(templatePath, "utf8");
let data;
try {
  data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
} catch (e) {
  fail(`Could not parse ${opt.data} as JSON: ${e.message}`);
}

const to = (opt.to || data.to || "").trim();
if (!isEmail(to)) fail(`Recipient "to" is not a valid email: ${to || "(empty)"}`);

// ---------------------------------------------------------------------------
// fill placeholders (HTML-escaped) and validate
// ---------------------------------------------------------------------------
const TOKEN = /\{\{\s*([A-Z0-9_]+)\s*\}\}/g;
// Strip HTML comments first: they carry dev-only notes (incl. a literal
// {{PLACEHOLDER}} usage example and the SPA-guard reminder, which the code below
// enforces) and shouldn't ship in the outgoing email.
const source = template.replace(/<!--[\s\S]*?-->/g, "");
const html = source.replace(TOKEN, (m, key) =>
  key in data ? escapeHtml(data[key]) : m,
);

const leftover = [...new Set([...html.matchAll(TOKEN)].map((x) => x[1]))];
if (leftover.length) {
  fail(
    `Unfilled placeholders (refusing to send a broken email):\n  ${leftover
      .map((k) => `{{${k}}}`)
      .join("\n  ")}\nAdd them to ${opt.data}.`,
  );
}

// honest-broker: never send a 0 / blank / non-numeric score as fact
const score = String(data.SCORE ?? "").trim();
const scoreOk = /^\d{1,3}$/.test(score) && Number(score) > 0 && Number(score) <= 100;
if (!scoreOk && !opt.allowZero) {
  fail(
    `SCORE is "${score || "(empty)"}". A 0 / blank / non-numeric score usually means the\n` +
      `static fetch came back thin (a JS-rendered SPA), NOT a real near-zero score.\n` +
      `Do not send that as fact. Fix the score, or pass --allow-zero only if it is genuinely real.`,
  );
}

const subject =
  (data.subject && String(data.subject)) ||
  `Your Prompt Goblin scan for ${data.DOMAIN || "your site"}`;
const from = process.env.MAIL_FROM || "Prompt Goblin <goblins@promptgoblin.io>";
const replyTo = process.env.MAIL_REPLY_TO || "";
const provider = (process.env.EMAIL_PROVIDER || "resend").toLowerCase();

// ---------------------------------------------------------------------------
// providers
// ---------------------------------------------------------------------------
async function sendResend() {
  const key = need("RESEND_API_KEY");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Resend ${res.status}: ${body.message || JSON.stringify(body)}`);
  return body.id;
}

async function sendPostmark() {
  const token = need("POSTMARK_API_TOKEN");
  const res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      "X-Postmark-Server-Token": token,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      From: from,
      To: to,
      Subject: subject,
      HtmlBody: html,
      MessageStream: "outbound",
      ...(replyTo ? { ReplyTo: replyTo } : {}),
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (body.ErrorCode && body.ErrorCode !== 0) throw new Error(`Postmark ${body.ErrorCode}: ${body.Message}`);
  if (!res.ok) throw new Error(`Postmark ${res.status}: ${body.Message || JSON.stringify(body)}`);
  return body.MessageID;
}

// ---------------------------------------------------------------------------
// run
// ---------------------------------------------------------------------------
const summary = [
  `  provider : ${provider}`,
  `  from     : ${from}`,
  `  to       : ${to}`,
  `  subject  : ${subject}`,
  `  size     : ${Buffer.byteLength(html, "utf8")} bytes`,
].join("\n");

if (!opt.send) {
  const outPath = opt.out ? path.resolve(opt.out) : path.join(HERE, "scan-report.filled.html");
  fs.writeFileSync(outPath, html, "utf8");
  process.stdout.write(
    `DRY RUN — nothing sent.\n${summary}\n  preview  : ${outPath}\n\n` +
      `Open the preview, proof-read it, then re-run with --send to send.\n`,
  );
  process.exit(0);
}

try {
  if (provider !== "resend" && provider !== "postmark") {
    fail(`EMAIL_PROVIDER must be "resend" or "postmark" (got "${provider}").`);
  }
  const id = provider === "postmark" ? await sendPostmark() : await sendResend();
  process.stdout.write(`✓ Sent.\n${summary}\n  message  : ${id}\n`);
} catch (e) {
  // Don't process.exit() here: the fetch socket is still closing, and a hard
  // exit mid-teardown trips a libuv assertion on Windows. Set the code instead.
  console.error(`✖ Send failed: ${e.message}`);
  process.exitCode = 1;
}
