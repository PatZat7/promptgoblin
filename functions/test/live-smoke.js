"use strict";

/**
 * Live URL smoke runner — REAL network, NOT part of npm test / CI.
 *
 *   node test/live-smoke.js
 *
 * Fetches each URL in live-urls.json against the expected qualitative result
 * and prints PASS / FAIL for each. This is opt-in, network-flaky, and should
 * never be added to the npm test chain.
 *
 * WAF CAVEAT: WAF decisions are IP-reputation-based. A "FAIL" on a WAF case
 * from a residential IP does not mean the code regressed — it may mean the
 * IP is not blocked. Investigate before assuming a code bug.
 *
 * Exit code: 0 if all PASS (or MAYBE-PASS), 1 if any hard FAIL.
 */

const path = require("path");
const libDir = path.join(__dirname, "..", "lib");
const { buildHygieneReport } = require(path.join(libDir, "hygiene"));
const { toUrl } = require(path.join(libDir, "util"));

const URLS = require(path.join(__dirname, "live-urls.json")).urls;

// ---------------------------------------------------------------------------
// Minimal fetch wrapper (mirrors the tier1 index.js fetchText logic but
// simplified — we don't need SSRF guard here since these are pre-approved URLs).
// ---------------------------------------------------------------------------
async function fetchPage(url) {
  let html = null;
  let status = null;
  let botProtected = false;

  // Validate URL is safe before fetching (honour SSRF rules even in smoke test).
  const parsed = toUrl(url);
  if (!parsed) return { ok: false, blocked: true, error: "SSRF-blocked or invalid URL", status: null, html: null };

  const BOT_STATUSES = new Set([403, 429, 503, 999]);
  const BOT_WALL_SIGNATURES = [
    /window\.__cf_chl_opt/i,
    /ak_bmsc/i,
    /challenge-running/i,
    /Just a moment/i,
    /Access Denied.*Akamai/si,
    /<title>\s*Access Denied\s*<\/title>/i,
  ];

  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PromptGoblinSmokeTest/1.0)",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(12000),
      redirect: "follow",
    });

    status = resp.status;

    if (BOT_STATUSES.has(status)) {
      botProtected = true;
      return { ok: false, blocked: true, botProtected: true, status, html: null };
    }

    html = await resp.text();

    // Check for in-body bot walls (CF/Akamai 200 with challenge).
    if (html && html.length < 15 * 1024) {
      if (BOT_WALL_SIGNATURES.some((re) => re.test(html))) {
        botProtected = true;
        return { ok: false, blocked: true, botProtected: true, status, html };
      }
    }

    return { ok: true, blocked: false, status, html };
  } catch (err) {
    return { ok: false, blocked: false, error: err.message, status: null, html: null };
  }
}

// ---------------------------------------------------------------------------
// Evaluate a single URL against its expected spec.
// Returns { pass: bool|"maybe", messages: string[] }
// ---------------------------------------------------------------------------
function evaluate(fetched, expected) {
  const messages = [];
  let pass = true;

  const { readable, staticWasBlocked, stack, noProductSchema, outcome } = expected;

  // readable / staticWasBlocked
  if (readable === true) {
    if (!fetched.ok || fetched.blocked) {
      messages.push(`Expected readable but got blocked/error (status ${fetched.status}, error: ${fetched.error || "none"})`);
      pass = false;
    }
  } else if (readable === false) {
    if (fetched.ok && !fetched.blocked) {
      messages.push(`Expected WAF-blocked but page was readable (status ${fetched.status})`);
      // Treat as "maybe" not hard fail — WAF varies by IP.
      return { pass: "maybe", messages: [`WAF status uncertain from this IP — expected blocked, got readable. Not necessarily a code regression.`] };
    }
  }
  // readable === "maybe" → skip the check

  if (staticWasBlocked === true && fetched.ok) {
    // Already handled above.
  }

  // Tech stack checks (only when page was readable)
  if (fetched.ok && fetched.html && Array.isArray(stack)) {
    const libDir2 = path.join(__dirname, "..", "lib");
    const { detectTechStack } = require(path.join(libDir2, "hygiene"));
    const detected = detectTechStack(fetched.html).detected.map((s) => s.name);
    for (const name of stack) {
      if (!detected.includes(name)) {
        messages.push(`Expected "${name}" in techStack but got: [${detected.join(", ")}]`);
        pass = false;
      }
    }
  }

  // Product schema must not appear as a finding on service/gov sites.
  if (fetched.ok && fetched.html && noProductSchema === true) {
    const report = buildHygieneReport({
      url: "https://live-smoke.local/",
      html: fetched.html,
      contentBytes: Buffer.byteLength(fetched.html),
      robotsText: null,
      llmsText: null,
    });
    if (report.schema.missing.includes("Product")) {
      messages.push(`HONEST-BROKER VIOLATION: site flagged "missing Product schema" but noProductSchema:true`);
      pass = false;
    }
    if (report.findings.some((f) => /Product JSON-LD/i.test(f.detail))) {
      messages.push(`HONEST-BROKER VIOLATION: Product JSON-LD finding present on a service/gov site`);
      pass = false;
    }
  }

  // Blocked page must NEVER have a numeric hygiene score presented as a real audit.
  if (fetched.blocked && fetched.html) {
    const report = buildHygieneReport({
      url: "https://live-smoke.local/",
      html: fetched.html,
      contentBytes: Buffer.byteLength(fetched.html),
      robotsText: null,
      llmsText: null,
    });
    // The score itself can be a number (we ran it against what we got), but
    // callers must NOT present it as a site verdict. We can't test the UI layer
    // here, but we can assert that staticWasBlocked is flaggable.
    messages.push(`[info] Blocked page returned some HTML; buildHygieneReport score=${report.hygieneScore} (not a site verdict — caller must flag staticWasBlocked)`);
  }

  if (pass === true && messages.length === 0) messages.push("ok");
  return { pass, messages };
}

// ---------------------------------------------------------------------------
// Main runner
// ---------------------------------------------------------------------------
async function run() {
  console.log(`\nPrompt Goblin live smoke test — ${URLS.length} URLs (real network)\n`);
  console.log("NOTE: WAF failures from a residential/cloud IP are not necessarily code regressions.\n");

  let hardFails = 0;
  let passes = 0;
  let maybes = 0;

  for (const entry of URLS) {
    process.stdout.write(`  [${entry.category}] ${entry.url} ... `);
    const fetched = await fetchPage(entry.url);
    const { pass, messages } = evaluate(fetched, entry.expected);

    if (pass === true) {
      console.log(`PASS`);
      if (messages.length > 1 || messages[0] !== "ok") {
        for (const m of messages) console.log(`    ${m}`);
      }
      passes++;
    } else if (pass === "maybe") {
      console.log(`MAYBE-PASS (WAF/network uncertain)`);
      for (const m of messages) console.log(`    ${m}`);
      maybes++;
    } else {
      console.log(`FAIL`);
      for (const m of messages) console.log(`    FAIL: ${m}`);
      hardFails++;
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`  PASS:       ${passes}`);
  console.log(`  MAYBE-PASS: ${maybes} (WAF/IP-dependent)`);
  console.log(`  FAIL:       ${hardFails}`);

  if (hardFails > 0) {
    console.error(`\n${hardFails} hard failure(s). Check the FAIL lines above.`);
    process.exit(1);
  } else {
    console.log(`\nSmoke run complete — no hard failures.`);
  }
}

run().catch((e) => {
  console.error("\nSMOKE TEST CRASHED:", e.message);
  process.exit(1);
});
