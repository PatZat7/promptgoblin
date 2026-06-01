"use strict";

/**
 * Local mock test — runs with ZERO keys and ZERO network.
 *
 *   node test/scan.test.js
 *
 * Covers the Tier-1 hygiene core against fixture HTML, the Perplexity adapter
 * against a stubbed fetch (so no real API call / key is needed), the rate
 * limiter, and the honest no-key degradation path. Mirrors the pipeline's
 * "passes with --mock, no credentials" ethic.
 */

const assert = require("assert");
const path = require("path");

const libDir = path.join(__dirname, "..", "lib");
const { buildHygieneReport } = require(path.join(libDir, "hygiene"));
const { tier1Summary, tier2Summary } = require(path.join(libDir, "voice"));
const { askOne, runTeaser, buildQueries } = require(path.join(libDir, "perplexity"));
const ratelimit = require(path.join(libDir, "ratelimit"));
const { toUrl, normalizeDomain, isEmail } = require(path.join(libDir, "util"));

let passed = 0;
function ok(name, cond) {
  assert.ok(cond, name);
  console.log(`  ok  ${name}`);
  passed++;
}

async function run() {

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const THIN_HTML = `<!doctype html><html><head>
  <title>Acme</title>
  <script type="application/ld+json">{"@type":"Organization","name":"Acme"}</script>
  <script type="application/ld+json">{ this is broken json }</script>
  <link rel="stylesheet" href="/a.css"><link rel="stylesheet" href="/b.css">
  <script src="/x.js"></script><script src="/y.js"></script>
</head><body><h1>Acme</h1><img src="/p.png"></body></html>`;

const RICH_HTML = `<!doctype html><html lang="en"><head>
  <title>Acme — the honest widget shop for teams</title>
  <meta name="description" content="Acme makes widgets people actually use.">
  <link rel="canonical" href="https://acme.com/">
  <meta name="viewport" content="width=device-width">
  <meta property="og:title" content="Acme"><meta property="og:image" content="/og.png">
  <meta property="og:description" content="widgets">
  <script type="application/ld+json">
  {"@graph":[{"@type":"Organization"},{"@type":"WebSite"},{"@type":"FAQPage"},
   {"@type":"Product"},{"@type":"BreadcrumbList"}]}
  </script>
</head><body><h1>Acme</h1>
  <img src="/p.png" width="200" height="100" loading="lazy"></body></html>`;

const ROBOTS_WELCOMING = `User-agent: *\nAllow: /\nUser-agent: GPTBot\nAllow: /\nSitemap: https://acme.com/sitemap.xml\n`;
const ROBOTS_BLOCKING = `User-agent: *\nDisallow: /\n`;
const LLMS_GOOD = `# Acme\n\n> Acme makes widgets.\n\n## What Acme does\n- widgets\n`;

// ---------------------------------------------------------------------------
// util
// ---------------------------------------------------------------------------
console.log("util");
ok("toUrl coerces bare domain", toUrl("acme.com").href === "https://acme.com/");
ok("toUrl rejects localhost (SSRF guard)", toUrl("http://localhost:8080") === null);
ok("toUrl rejects RFC1918", toUrl("http://10.0.0.5") === null);
ok("normalizeDomain strips www", normalizeDomain("https://www.Acme.com/x") === "acme.com");
ok("isEmail accepts good", isEmail("a@b.co"));
ok("isEmail rejects bad", !isEmail("nope"));

// ---------------------------------------------------------------------------
// Tier-1 hygiene
// ---------------------------------------------------------------------------
console.log("tier1 hygiene");
const thin = buildHygieneReport({
  url: "https://acme.com/",
  html: THIN_HTML,
  contentBytes: Buffer.byteLength(THIN_HTML),
  robotsText: ROBOTS_BLOCKING,
  llmsText: null,
});
ok("thin: found Organization", thin.schema.found.includes("Organization"));
ok("thin: missing FAQPage", thin.schema.missing.includes("FAQPage"));
ok("thin: detects malformed JSON-LD", thin.schema.malformedBlocks === 1);
ok("thin: flags blocked AI bots", !thin.crawlability.welcomesAiBots);
ok("thin: has high-severity findings", thin.findings.some((f) => f.severity >= 4));
ok("thin: score below 100", thin.hygieneScore < 100);
ok("thin: disclaimer present (honesty)", /NOT a citation guarantee/i.test(thin.disclaimer));
ok("thin: summary never promises citations", !/get(s)? you cited/i.test(tier1Summary(thin)));

const rich = buildHygieneReport({
  url: "https://acme.com/",
  html: RICH_HTML,
  contentBytes: Buffer.byteLength(RICH_HTML),
  robotsText: ROBOTS_WELCOMING,
  llmsText: LLMS_GOOD,
});
ok("rich: all expected schema found", rich.schema.missing.length === 0);
ok("rich: welcomes AI bots", rich.crawlability.welcomesAiBots);
ok("rich: sitemap detected", rich.crawlability.sitemap === "https://acme.com/sitemap.xml");
ok("rich: llms.txt valid", rich.llmsTxt.valid);
ok("rich: scores higher than thin", rich.hygieneScore > thin.hygieneScore);

// ---------------------------------------------------------------------------
// Tier-2 Perplexity adapter (stubbed fetch — no key, no network)
// ---------------------------------------------------------------------------
console.log("tier2 perplexity (stubbed)");
ok("buildQueries caps at 2", buildQueries("acme.com", "rival.com", 5).length === 2);
ok("buildQueries floors at 1", buildQueries("acme.com", "rival.com", 0).length === 1);

const fakeFetch = async () => ({
  ok: true,
  json: async () => ({
    choices: [{ message: { content: "Rivals include Acme and others." } }],
    citations: ["https://rival.com/compare", "https://acme.com/blog"],
  }),
});
const one = await askOne({
  apiKey: "stub",
  query: "best alternatives to rival",
  clientDomain: "acme.com",
  competitorDomain: "rival.com",
  fetchImpl: fakeFetch,
});
ok("askOne parses native citations", one.sources.length === 2);
ok("askOne detects client cited", one.clientCited === true);
ok("askOne detects competitor cited", one.competitorCited === true);

const teaser = await runTeaser({
  apiKey: "stub",
  domain: "acme.com",
  competitor: "rival.com",
  maxQueries: 2,
  fetchImpl: fakeFetch,
});
ok("runTeaser uses one engine", teaser.engine === "perplexity");
ok("runTeaser caps queries", teaser.results.length === 2);

const SECRET = "pplx-SECRET-TOKEN-12345";
const errFetch = async () => ({ ok: false, status: 401, text: async () => "unauthorized" });
let threw = false,
  leaked = true;
try {
  await askOne({ apiKey: SECRET, query: "q", clientDomain: "a.com", competitorDomain: "b.com", fetchImpl: errFetch });
} catch (e) {
  threw = /401/.test(e.message);
  leaked = e.message.includes(SECRET);
}
ok("askOne throws honest non-200 error", threw);
ok("askOne error never leaks the key", !leaked);

// ---------------------------------------------------------------------------
// No-key degradation + rate limit
// ---------------------------------------------------------------------------
console.log("tier2 degradation + rate limit");
const noKey = tier2Summary({ domain: "acme.com", competitor: "rival.com", results: [], configured: false });
ok("no-key summary says lantern unlit", /unlit|configure|no PERPLEXITY/i.test(noKey));
ok("no-key summary fabricates nothing", /no fabricated results/i.test(noKey));

ratelimit._reset();
ok("ratelimit allows first hit", ratelimit.check("ip|email").allowed);
ok("ratelimit blocks second hit", !ratelimit.check("ip|email").allowed);
ok("ratelimit isolates distinct keys", ratelimit.check("other|email2").allowed);

console.log(`\nALL ${passed} CHECKS PASSED — zero keys, zero network.`);
}

run().catch((e) => {
  console.error("\nTEST FAILED:", e.message);
  process.exit(1);
});
