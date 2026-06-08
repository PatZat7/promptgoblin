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
const { askOne, runTeaser, buildQueries, extractCitations } = require(path.join(libDir, "perplexity"));
const ratelimit = require(path.join(libDir, "ratelimit"));
const { toUrl, normalizeDomain, isEmail, ipIsBlocked } = require(path.join(libDir, "util"));

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

// Service / government pattern: Service + OfferCatalog, NO Product. Must NEVER be
// told it's "missing Product schema" (honest-broker rule).
const SERVICE_HTML = `<!doctype html><html lang="en"><head>
  <title>Hatfield &amp; Co — Chicago employment lawyers</title>
  <script type="application/ld+json">
  {"@graph":[{"@type":"Organization"},{"@type":"WebSite"},{"@type":"Service"},{"@type":"OfferCatalog"}]}
  </script>
</head><body><h1>Employment law</h1></body></html>`;

// Commerce pattern: og:type=product signals a storefront, so a missing Product
// schema here IS a fair (commerce-only) finding.
const COMMERCE_HTML = `<!doctype html><html lang="en"><head>
  <title>Acme Store — buy the widget</title>
  <meta property="og:type" content="product">
  <script type="application/ld+json">{"@type":"Organization"}</script>
</head><body><h1>Widget</h1></body></html>`;

const NEXT_HTML = `<!doctype html><html><head>
  <title>Next app</title>
  <script id="__NEXT_DATA__" type="application/json">{"props":{}}</script>
  <script src="/_next/static/chunks/app.js"></script>
</head><body><h1>Next</h1></body></html>`;

const WORDPRESS_HTML = `<!doctype html><html><head>
  <title>WP site</title>
  <meta name="generator" content="WordPress 6.5">
  <link rel="stylesheet" href="/wp-content/themes/acme/style.css">
</head><body><h1>WP</h1></body></html>`;

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

// SSRF guard — literal + encoded-IP rejection in toUrl, and the resolved-IP
// classifier ipIsBlocked() used by the DNS-resolution guard (assertPublicHost).
console.log("ssrf guard");
ok("toUrl rejects decimal-encoded IP (127.0.0.1)", toUrl("http://2130706433") === null);
ok("toUrl rejects hex-encoded IP", toUrl("http://0x7f000001") === null);
ok("toUrl rejects cloud metadata literal", toUrl("http://169.254.169.254/latest/meta-data") === null);
ok("toUrl rejects .internal hostnames", toUrl("https://db.internal") === null);
ok("toUrl rejects non-http(s) scheme", toUrl("file:///etc/passwd") === null);
ok("toUrl allows a public host", toUrl("https://example.com").hostname === "example.com");
ok("ipIsBlocked: v4 loopback", ipIsBlocked("127.0.0.1"));
ok("ipIsBlocked: RFC1918", ipIsBlocked("10.1.2.3") && ipIsBlocked("192.168.0.1") && ipIsBlocked("172.20.0.1"));
ok("ipIsBlocked: cloud metadata 169.254.169.254", ipIsBlocked("169.254.169.254"));
ok("ipIsBlocked: v6 loopback/link-local/ULA", ipIsBlocked("::1") && ipIsBlocked("fe80::1") && ipIsBlocked("fd00::1"));
ok("ipIsBlocked: v4-mapped private v6", ipIsBlocked("::ffff:10.0.0.1"));
ok("ipIsBlocked: allows public v4", !ipIsBlocked("8.8.8.8"));
ok("ipIsBlocked: allows public v6", !ipIsBlocked("2606:4700:4700::1111"));

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
ok("rich: unknown stack asks prospect to confirm", /No obvious stack/i.test(rich.techStack.note));

const nextStack = buildHygieneReport({
  url: "https://next.example/",
  html: NEXT_HTML,
  contentBytes: Buffer.byteLength(NEXT_HTML),
  robotsText: ROBOTS_WELCOMING,
  llmsText: null,
});
ok("tech stack: detects Next.js", nextStack.techStack.detected.some((s) => s.name === "Next.js" && s.confidence === "high"));

const wpStack = buildHygieneReport({
  url: "https://wp.example/",
  html: WORDPRESS_HTML,
  contentBytes: Buffer.byteLength(WORDPRESS_HTML),
  robotsText: ROBOTS_WELCOMING,
  llmsText: null,
});
ok("tech stack: detects WordPress", wpStack.techStack.detected.some((s) => s.name === "WordPress" && s.confidence === "high"));

// Expanded detection: Nuxt, Shopify, generator-meta CMS, Astro, and the
// "drop bare React/Vite when a specific framework is found" dedup.
const NUXT_HTML = `<!doctype html><html><head><title>Nuxt</title>
  <link rel="preload" as="script" href="/_nuxt/entry.abc123.js">
</head><body><div id="__nuxt"></div></body></html>`;
const nuxtStack = buildHygieneReport({ url: "https://nuxt.example/", html: NUXT_HTML, contentBytes: Buffer.byteLength(NUXT_HTML), robotsText: ROBOTS_WELCOMING, llmsText: null });
ok("tech stack: detects Nuxt", nuxtStack.techStack.detected.some((s) => s.name === "Nuxt" && s.confidence === "high"));

const SHOPIFY_HTML = `<!doctype html><html><head><title>Shop</title>
  <script src="https://cdn.shopify.com/s/files/1/0/theme.js"></script>
</head><body><h1>Shop</h1></body></html>`;
const shopStack = buildHygieneReport({ url: "https://shop.example/", html: SHOPIFY_HTML, contentBytes: Buffer.byteLength(SHOPIFY_HTML), robotsText: ROBOTS_WELCOMING, llmsText: null });
ok("tech stack: detects Shopify", shopStack.techStack.detected.some((s) => s.name === "Shopify" && s.confidence === "high"));

const DRUPAL_HTML = `<!doctype html><html><head><title>Gov</title>
  <meta name="Generator" content="Drupal 10 (https://www.drupal.org)">
</head><body><h1>Services</h1></body></html>`;
const drupalStack = buildHygieneReport({ url: "https://gov.example/", html: DRUPAL_HTML, contentBytes: Buffer.byteLength(DRUPAL_HTML), robotsText: ROBOTS_WELCOMING, llmsText: null });
ok("tech stack: detects Drupal via generator meta", drupalStack.techStack.detected.some((s) => s.name === "Drupal" && s.confidence === "high"));

const ASTRO_HTML = `<!doctype html><html><head><title>Astro</title>
  <link rel="stylesheet" href="/_astro/index.abc.css">
</head><body><astro-island uid="1"></astro-island></body></html>`;
const astroStack = buildHygieneReport({ url: "https://astro.example/", html: ASTRO_HTML, contentBytes: Buffer.byteLength(ASTRO_HTML), robotsText: ROBOTS_WELCOMING, llmsText: null });
ok("tech stack: detects Astro", astroStack.techStack.detected.some((s) => s.name === "Astro" && s.confidence === "high"));

const NEXT_REACT_HTML = `<!doctype html><html><head><title>App</title>
  <script id="__NEXT_DATA__" type="application/json">{}</script>
  <script src="/_next/static/chunks/react-dom.production.min.js"></script>
</head><body></body></html>`;
const nrStack = buildHygieneReport({ url: "https://nr.example/", html: NEXT_REACT_HTML, contentBytes: Buffer.byteLength(NEXT_REACT_HTML), robotsText: ROBOTS_WELCOMING, llmsText: null });
ok("tech stack: Next.js detected on a React app", nrStack.techStack.detected.some((s) => s.name === "Next.js"));
ok("tech stack: drops bare React when a framework is detected", !nrStack.techStack.detected.some((s) => s.name === "React"));

// CSS frameworks are ALWAYS reported when found; jQuery is real implementation
// signal and IS reported too (the fix plan targets jQuery-based themes).
const NEXT_TAILWIND_HTML = `<!doctype html><html><head><title>App</title>
  <script id="__NEXT_DATA__" type="application/json">{}</script>
  <script src="/_next/static/chunks/main.js"></script>
  <link rel="stylesheet" href="/assets/tailwind.min.css">
</head><body></body></html>`;
const ntStack = buildHygieneReport({ url: "https://nt.example/", html: NEXT_TAILWIND_HTML, contentBytes: Buffer.byteLength(NEXT_TAILWIND_HTML), robotsText: ROBOTS_WELCOMING, llmsText: null });
ok("tech stack: reports CSS (Tailwind) alongside the framework", ntStack.techStack.detected.some((s) => s.name === "Tailwind CSS"));
ok("tech stack: keeps the framework when CSS is also present", ntStack.techStack.detected.some((s) => s.name === "Next.js"));

const JQUERY_ONLY_HTML = `<!doctype html><html><head><title>Old site</title>
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
</head><body><h1>Hi</h1></body></html>`;
const jqStack = buildHygieneReport({ url: "https://jq.example/", html: JQUERY_ONLY_HTML, contentBytes: Buffer.byteLength(JQUERY_ONLY_HTML), robotsText: ROBOTS_WELCOMING, llmsText: null });
ok("tech stack: jQuery is reported when found", jqStack.techStack.detected.some((s) => s.name === "jQuery"));

const JQUERY_BOOTSTRAP_HTML = `<!doctype html><html><head><title>Old site</title>
  <link rel="stylesheet" href="/css/bootstrap.min.css">
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
</head><body></body></html>`;
const jqbStack = buildHygieneReport({ url: "https://jqb.example/", html: JQUERY_BOOTSTRAP_HTML, contentBytes: Buffer.byteLength(JQUERY_BOOTSTRAP_HTML), robotsText: ROBOTS_WELCOMING, llmsText: null });
ok("tech stack: CSS (Bootstrap) shows alongside jQuery", jqbStack.techStack.detected.some((s) => s.name === "Bootstrap"));
ok("tech stack: jQuery reported alongside CSS", jqbStack.techStack.detected.some((s) => s.name === "jQuery"));

// Regression lock (deadmau5.com): a WordPress site that also loads jQuery must
// report BOTH — WordPress (high) + jQuery (low). Commit 1573276 dropped jQuery
// here ("jQuery means plain HTML"); that lost real signal and is reverted.
const WP_JQUERY_HTML = `<!doctype html><html><head><title>deadmau5</title>
  <link rel="stylesheet" href="/wp-content/themes/mau5/style.css">
  <script src="/wp-includes/js/jquery/jquery.min.js"></script>
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
</head><body></body></html>`;
const wpjqStack = buildHygieneReport({ url: "https://deadmau5.com/", html: WP_JQUERY_HTML, contentBytes: Buffer.byteLength(WP_JQUERY_HTML), robotsText: ROBOTS_WELCOMING, llmsText: null });
ok("tech stack: WordPress detected on a WP+jQuery site", wpjqStack.techStack.detected.some((s) => s.name === "WordPress"));
ok("tech stack: jQuery detected on a WP+jQuery site (deadmau5 regression)", wpjqStack.techStack.detected.some((s) => s.name === "jQuery"));

// Product schema is commerce-only — service/gov sites must never be flagged for it.
const service = buildHygieneReport({
  url: "https://hatfieldlaw.com/",
  html: SERVICE_HTML,
  contentBytes: Buffer.byteLength(SERVICE_HTML),
  robotsText: ROBOTS_WELCOMING,
  llmsText: null,
});
ok(
  "service site: NOT flagged missing Product (honest-broker)",
  !service.schema.missing.includes("Product") &&
    !service.findings.some((f) => /Product JSON-LD/.test(f.detail)),
);
ok("service site: still audited (has other findings)", service.findings.length > 0);

const commerce = buildHygieneReport({
  url: "https://acmestore.com/widget",
  html: COMMERCE_HTML,
  contentBytes: Buffer.byteLength(COMMERCE_HTML),
  robotsText: ROBOTS_WELCOMING,
  llmsText: null,
});
ok("commerce page: flagged missing Product", commerce.schema.missing.includes("Product"));
ok(
  "commerce Product finding is MED (sev 3), not HIGH",
  commerce.findings
    .filter((f) => /Product JSON-LD/.test(f.detail))
    .every((f) => f.severity === 3),
);

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

const nestedSources = extractCitations({
  citations: ["https://rival.com/compare"],
  search_results: [{ url: "https://acme.com/blog" }, { link: "https://third.com/post" }],
  choices: [{ message: { citations: ["https://nested.example/source", "https://rival.com/compare"] } }],
});
ok("extractCitations supports nested/message citations", nestedSources.includes("https://nested.example/source"));
ok("extractCitations dedupes while preserving sources", nestedSources.length === 4);

let sentBody = null;
await askOne({
  apiKey: "stub",
  query: "token cap check",
  clientDomain: "acme.com",
  competitorDomain: "rival.com",
  fetchImpl: async (_url, opts) => {
    sentBody = JSON.parse(opts.body);
    return {
      ok: true,
      json: async () => ({ choices: [{ message: { content: "ok" } }], citations: [] }),
    };
  },
});
ok("askOne sends capped max_tokens", sentBody && sentBody.max_tokens === 512);

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
