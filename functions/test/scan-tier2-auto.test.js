"use strict";

/**
 * Tier-2 auto (domain-only) teaser tests — zero keys, zero network.
 *
 *   node test/scan-tier2-auto.test.js
 *
 * Tests buildQueriesAuto, runTeaserAuto (via stubbed fetch), the domain-only
 * handler path, and the no-key honest degradation. Mirrors the existing
 * scan.test.js style (assert + console.log ok/fail).
 */

const assert = require("assert");
const path = require("path");

const libDir = path.join(__dirname, "..", "lib");
const tier2Dir = path.join(__dirname, "..", "packages", "scan", "tier2");

const { buildQueriesAuto, runTeaserAuto, askOne, extractCitations } = require(path.join(libDir, "perplexity"));
const ratelimit = require(path.join(libDir, "ratelimit"));

// Load handler from the tier2 package (which has its own lib/ copies).
const { main: tier2Main } = require(path.join(tier2Dir, "index.js"));

let passed = 0;
function ok(name, cond) {
  assert.ok(cond, name);
  console.log(`  ok  ${name}`);
  passed++;
}

async function run() {

// ---------------------------------------------------------------------------
// buildQueriesAuto
// ---------------------------------------------------------------------------
console.log("buildQueriesAuto");
ok("caps at 2", buildQueriesAuto("acme.com", 5).length === 2);
ok("floors at 1", buildQueriesAuto("acme.com", 0).length === 1);
ok("brand-anchored, not comparative", buildQueriesAuto("acme.com", 1)[0].toLowerCase().includes("acme"));

// ---------------------------------------------------------------------------
// runTeaserAuto — stubbed fetch
// ---------------------------------------------------------------------------
console.log("runTeaserAuto (stubbed fetch)");

// Client IS cited in one result, two others present.
const autoFetch = async () => ({
  ok: true,
  json: async () => ({
    choices: [{ message: { content: "Many services reviewed." } }],
    citations: [
      "https://acme.com/about",
      "https://rival.com/blog",
      "https://thirdparty.io/post",
    ],
  }),
});

const autoResult = await runTeaserAuto({
  apiKey: "stub",
  domain: "acme.com",
  maxQueries: 2,
  fetchImpl: autoFetch,
});

ok("runTeaserAuto returns engine=perplexity", autoResult.engine === "perplexity");
ok("runTeaserAuto caps queriesRun at maxQueries", autoResult.queriesRun === 2);
ok("runTeaserAuto detects clientCited=true when own domain in citations", autoResult.clientCited === true);
ok("runTeaserAuto collects citedDomains excluding client", !autoResult.citedDomains.includes("acme.com"));
ok("runTeaserAuto collects up to 3 citedDomains", autoResult.citedDomains.length <= 3);
ok("runTeaserAuto includes rival.com in citedDomains", autoResult.citedDomains.includes("rival.com"));

// Client NOT cited.
const noClientFetch = async () => ({
  ok: true,
  json: async () => ({
    choices: [{ message: { content: "Other tools." } }],
    citations: ["https://rival.com/page", "https://other.io/post"],
  }),
});

const notCitedResult = await runTeaserAuto({
  apiKey: "stub",
  domain: "acme.com",
  maxQueries: 1,
  fetchImpl: noClientFetch,
});

ok("runTeaserAuto clientCited=false when own domain absent", notCitedResult.clientCited === false);
ok("runTeaserAuto still collects other citedDomains when not cited", notCitedResult.citedDomains.length > 0);

// ---------------------------------------------------------------------------
// Tier-2 handler — domain-only (auto) path
// ---------------------------------------------------------------------------
console.log("tier2 handler auto path (no key configured)");

// Simulate no PERPLEXITY_API_KEY in env.
delete process.env.PERPLEXITY_API_KEY;
ratelimit._reset();

const noKeyResp = await tier2Main({
  __ow_method: "post",
  __ow_headers: { "x-real-ip": "1.2.3.4" },
  domain: "acme.com",
  // No competitor — auto mode
});

const noKeyBody = JSON.parse(noKeyResp.body);
ok("no-key auto path returns ok:true", noKeyBody.ok === true);
ok("no-key auto path returns configured:false", noKeyBody.configured === false);
ok("no-key auto path returns teaserMode:true", noKeyBody.teaserMode === true);
ok("no-key auto path teaser is null (no fabrication)", noKeyBody.teaser === null);
ok("no-key auto path never echoes key", !JSON.stringify(noKeyBody).includes("pplx-"));

// ---------------------------------------------------------------------------
// Tier-2 handler — domain-only rate limit
// ---------------------------------------------------------------------------
console.log("tier2 handler auto path rate limit");

// ratelimit is already consumed once above (no-key path still hits rl.check).
// Reset and hit twice for the same IP+domain to trigger the cap.
ratelimit._reset();

// First hit — allowed (no key, but rl is checked before key check for auto path).
// Actually the handler checks rl first, so we need key absent and allow first.
const firstHit = await tier2Main({
  __ow_method: "post",
  __ow_headers: { "x-real-ip": "9.9.9.9" },
  domain: "acme.com",
});
ok("first auto hit allowed", JSON.parse(firstHit.body).ok === true || firstHit.statusCode === 200);

const secondHit = await tier2Main({
  __ow_method: "post",
  __ow_headers: { "x-real-ip": "9.9.9.9" },
  domain: "acme.com",
});
ok("second auto hit rate limited", secondHit.statusCode === 429);

// ---------------------------------------------------------------------------
// OPTIONS pass-through
// ---------------------------------------------------------------------------
console.log("tier2 handler OPTIONS");
const opts = await tier2Main({ __ow_method: "options", __ow_headers: {} });
ok("OPTIONS returns 204", opts.statusCode === 204);

// ---------------------------------------------------------------------------
// Missing domain
// ---------------------------------------------------------------------------
console.log("tier2 handler missing domain");
const noDomain = await tier2Main({ __ow_method: "post", __ow_headers: {}, domain: "" });
ok("missing domain returns 400", noDomain.statusCode === 400);

console.log(`\nALL ${passed} CHECKS PASSED — zero keys, zero network.`);
}

run().catch((e) => {
  console.error("\nTEST FAILED:", e.message);
  process.exit(1);
});
