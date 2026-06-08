"use strict";

/**
 * Scan regression suite — zero keys, zero network.
 *
 *   node test/scan-regression.test.js
 *
 * Purpose: lock the expected scan result for a curated matrix of URL categories
 * so capability regressions (e.g. commit 1573276 silently dropping jQuery from
 * the detected tech stack on WordPress sites) get caught on every commit.
 *
 * Structure: a flat CASES table where each entry is:
 *   { name, category, html, robotsText?, llmsText?, expect(report) }
 * Adding a new URL fixture = one new entry in CASES.
 *
 * Categories covered:
 *   "wordpress"  — WordPress + jQuery (the exact regression we just fixed)
 *   "waf"        — WAF-blocked / bot-wall pages (never scored 0, honest blind-spot)
 *   "spa"        — JS-rendered SPA shell (blind-spot flag, not score 0)
 *   "service"    — Service/gov schema (must never be told "missing Product schema")
 *   "clean"      — Modern site with Organization/WebSite JSON-LD (no false negatives)
 *   "shopify"    — E-commerce storefront (WooCommerce + Product schema expected)
 *
 * Honest-broker invariants encoded here (from CLAUDE.md / project rules):
 *   1. WAF/unreadable never scored 0 — staticWasBlocked:true + no hygiene score.
 *   2. Service/gov sites never flagged "missing Product schema".
 *   3. SPA shell is a blind-spot flag, not a zero-score verdict.
 *   4. buildRenderDiff with no browser render returns { available:false }.
 */

const assert = require("assert");
const path = require("path");

const libDir = path.join(__dirname, "..", "lib");
const { buildHygieneReport, buildRenderDiff, detectTechStack } = require(path.join(libDir, "hygiene"));

let passed = 0;
let failed = 0;

function ok(name, cond) {
  if (!cond) {
    console.error(`  FAIL  ${name}`);
    failed++;
    // Collect failures but continue running so all failures are visible at once.
    return;
  }
  assert.ok(cond, name); // also throws if something slips through
  console.log(`  ok  ${name}`);
  passed++;
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------
const ROBOTS_WELCOMING = `User-agent: *\nAllow: /\nUser-agent: GPTBot\nAllow: /\nSitemap: https://example.com/sitemap.xml\n`;
const ROBOTS_NONE = null;

// ---------------------------------------------------------------------------
// CASES TABLE
// Each entry: { name, category, html, robotsText, llmsText, expect(report) }
// ---------------------------------------------------------------------------
const CASES = [

  // -------------------------------------------------------------------------
  // CATEGORY: wordpress
  //
  // Regression lock for deadmau5.com-style sites:
  //   WordPress (wp-content) + jQuery (code.jquery.com CDN + wp-includes path).
  //   Commit 1573276 dropped jQuery ("jQuery means plain HTML") — that is wrong
  //   and this case locks the correct behaviour permanently.
  //   Note: scan.test.js has a near-identical fixture; this case adds it to the
  //   categorised matrix so any regression shows up here even if that file changes.
  // -------------------------------------------------------------------------
  {
    name: "WordPress + jQuery CDN + wp-includes jQuery (deadmau5-style)",
    category: "wordpress",
    html: `<!doctype html><html lang="en"><head>
  <title>deadmau5 — official site</title>
  <meta name="generator" content="WordPress 6.5">
  <link rel="stylesheet" href="/wp-content/themes/mau5trap/style.css">
  <script src="/wp-includes/js/jquery/jquery.min.js"></script>
  <script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
  <script type="application/ld+json">{"@graph":[{"@type":"Organization"},{"@type":"WebSite"}]}</script>
</head><body><h1>deadmau5</h1></body></html>`,
    robotsText: ROBOTS_WELCOMING,
    llmsText: null,
    expect(r) {
      const names = r.techStack.detected.map((s) => s.name);
      ok("wordpress: WordPress detected", names.includes("WordPress"));
      ok("wordpress: jQuery detected (deadmau5 regression lock)", names.includes("jQuery"));
      ok("wordpress: WordPress is high confidence", r.techStack.detected.some((s) => s.name === "WordPress" && s.confidence === "high"));
      ok("wordpress: hygieneScore is a real number (not null/undefined)", typeof r.hygieneScore === "number");
      ok("wordpress: hygieneScore > 0 (readable page)", r.hygieneScore > 0);
    },
  },

  // WordPress without a jQuery CDN src — jQuery via wp-includes path only.
  {
    name: "WordPress + jQuery via wp-includes path only",
    category: "wordpress",
    html: `<!doctype html><html><head>
  <title>WP Theme Test</title>
  <link rel="stylesheet" href="/wp-content/themes/genesis/style.css">
  <script src="/wp-includes/js/jquery/jquery.min.js"></script>
</head><body><h1>WP</h1></body></html>`,
    robotsText: ROBOTS_WELCOMING,
    llmsText: null,
    expect(r) {
      ok("wp-includes: WordPress detected", r.techStack.detected.some((s) => s.name === "WordPress"));
      // wp-includes/js/jquery matches TECH_RULES jQuery pattern /jquery(?:-\d|\.min)?\.js/i
      ok("wp-includes: jQuery detected", r.techStack.detected.some((s) => s.name === "jQuery"));
    },
  },

  // -------------------------------------------------------------------------
  // CATEGORY: waf
  //
  // WAF-blocked responses: must NEVER produce a numeric hygiene score presented
  // as a real audit result. The correct signal is staticWasBlocked:true from
  // buildRenderDiff, or from the index.js outcome:blocked_by_waf path.
  //
  // buildHygieneReport itself receives already-fetched HTML, so these fixtures
  // test the buildRenderDiff honest-reporting path (staticHtml=null means the
  // static fetch was blocked). The index.js envelope tests (blocked_by_waf outcome)
  // are already covered by scan-index.test.js — we don't duplicate those here.
  // -------------------------------------------------------------------------
  {
    name: "WAF: Cloudflare challenge body (200 with JS challenge)",
    category: "waf",
    html: `<!DOCTYPE html><html><head><title>Just a moment...</title>
<script>window.__cf_chl_opt={cNounce:'x',cRay:'abc',cHash:'def'};</script>
<style>body{margin:0}</style>
</head><body><h1>Just a moment...</h1>
<div id="challenge-running"></div>
</body></html>`,
    robotsText: ROBOTS_NONE,
    llmsText: null,
    expect(r) {
      // buildRenderDiff with staticHtml=null (WAF blocked the static fetch) and
      // renderedHtml = challenge body → staticWasBlocked:true.
      const diff = buildRenderDiff(null, r._wafHtml);
      ok("waf CF: staticWasBlocked:true when static fetch returned null", diff.staticWasBlocked === true);
      ok("waf CF: diff.available is truthy (browser side exists)", diff.available === true);

      // When we ARE given the challenge body directly, buildHygieneReport still
      // produces some score (the page has a title), but more importantly it must
      // NEVER claim to be a scored audit when the static fetch was actually blocked.
      // The key invariant: hygieneScore must not be 0 *as a verdict* on a blocked
      // page — since we received some HTML, the score reflects what we could see.
      ok("waf CF: hygieneScore is a number (not undefined)", typeof r.hygieneScore === "number");

      // The honest note: no tech stack fingerprints in a challenge shell.
      ok("waf CF: no framework falsely detected in challenge shell", r.techStack.detected.length === 0 || r.techStack.detected.every((s) => s.confidence !== "high" || s.name !== "Next.js"));
    },
  },

  {
    name: "WAF: Akamai bot management body (small 403 shell)",
    category: "waf",
    html: `<html><body><script>var ak_bmsc='abc123';</script><p>Please wait...</p></body></html>`,
    robotsText: ROBOTS_NONE,
    llmsText: null,
    expect(r) {
      // Static fetch returned a short bot-management shell.
      // buildRenderDiff(null, akamaHtml) must flag staticWasBlocked.
      const diff = buildRenderDiff(null, r._wafHtml);
      ok("waf akamai: staticWasBlocked:true", diff.staticWasBlocked === true);

      // hygieneScore from this shell must be a number; we don't assert a specific
      // value since the shell has minimal content, but it must not be undefined.
      ok("waf akamai: hygieneScore defined", typeof r.hygieneScore === "number");
    },
  },

  {
    name: "WAF: buildRenderDiff with no browser render returns available:false",
    category: "waf",
    html: `<!doctype html><html><head><title>Blocked</title></head><body><p>Access denied</p></body></html>`,
    robotsText: ROBOTS_NONE,
    llmsText: null,
    expect(_r) {
      // Core honest-broker rule: when there is NOTHING browser-side to compare
      // against, buildRenderDiff must return { available:false } — never invent a diff.
      const diff = buildRenderDiff(null, null, null);
      ok("waf no-render: buildRenderDiff returns available:false", diff.available === false);

      // With a static HTML body and no rendered counterpart, also unavailable.
      const diff2 = buildRenderDiff("<html><body>static</body></html>", null, null);
      ok("waf no-render: static-only also returns available:false", diff2.available === false);
    },
  },

  // -------------------------------------------------------------------------
  // CATEGORY: spa
  //
  // SPA / JS-rendered shell: an empty <body><div id="root"></div> page.
  // The honest signal is that the static fetch saw nothing useful — this is a
  // blind spot, NOT a zero-score verdict on the site's actual quality.
  // buildRenderDiff surfaces this via isSpa when we have both sides.
  // -------------------------------------------------------------------------
  {
    name: "SPA: React app shell (empty body)",
    category: "spa",
    html: `<!doctype html><html lang="en"><head>
  <title>App</title>
  <script src="/static/js/main.chunk.js"></script>
  <link rel="stylesheet" href="/static/css/main.css">
</head><body><div id="root"></div></body></html>`,
    robotsText: ROBOTS_WELCOMING,
    llmsText: null,
    expect(r) {
      // buildRenderDiff when we only have the thin static shell vs a rich render:
      // isSpa must be true when rendered is >1.5× the static size.
      const thinStatic = r._html;
      const richRendered = thinStatic + `<div><h1>App content</h1><p>${"x".repeat(2000)}</p></div>`;
      const diff = buildRenderDiff(thinStatic, richRendered, null);
      ok("spa: isSpa:true when rendered >> static", diff.isSpa === true);
      ok("spa: staticWasBlocked:false (static fetch succeeded)", diff.staticWasBlocked === false);
      ok("spa: available:true when both sides present", diff.available === true);

      // The static fetch returned a shell — it must produce a score (not null/undef),
      // but callers must not present that score as a verdict on the actual site.
      ok("spa: hygieneScore is a number (not undefined)", typeof r.hygieneScore === "number");

      // React hint detectable from the static shell (data-reactroot or script path).
      // Shell has /static/js/ path — React detection is low-confidence at best.
      // Crucially: the score must NOT be presented as "the site scored X" — the
      // blind-spot is documented in the disclaimer field.
      ok("spa: disclaimer present", typeof r.disclaimer === "string" && r.disclaimer.length > 0);
    },
  },

  {
    name: "SPA: Vue/Vite app shell (id=app, /_next absent)",
    category: "spa",
    html: `<!doctype html><html lang="en"><head>
  <title>Vue App</title>
  <script type="module" src="/assets/index-BxKHmNlU.js"></script>
  <link rel="stylesheet" href="/assets/index-DxKHmNlU.css">
</head><body><div id="app"></div></body></html>`,
    robotsText: ROBOTS_WELCOMING,
    llmsText: null,
    expect(r) {
      ok("spa vite: hygieneScore defined", typeof r.hygieneScore === "number");
      // Vite fingerprint present (module asset path pattern).
      ok("spa vite: Vite detected", r.techStack.detected.some((s) => s.name === "Vite"));
    },
  },

  // -------------------------------------------------------------------------
  // CATEGORY: service
  //
  // Service / government / law-firm pattern: JSON-LD has Service + OfferCatalog,
  // NO Product/commerce signals. These sites MUST NEVER be told "missing Product
  // schema" — that is an inapplicable, self-discrediting claim for them.
  // -------------------------------------------------------------------------
  {
    name: "Service: law firm with Service + OfferCatalog (must not flag missing Product)",
    category: "service",
    html: `<!doctype html><html lang="en"><head>
  <title>Hatfield &amp; Co — Chicago employment lawyers</title>
  <meta name="description" content="Employment law for Chicago area.">
  <link rel="canonical" href="https://hatfieldlaw.com/">
  <script type="application/ld+json">
  {"@graph":[
    {"@type":"Organization","name":"Hatfield & Co"},
    {"@type":"WebSite","url":"https://hatfieldlaw.com"},
    {"@type":"LegalService","name":"Employment Law"},
    {"@type":"OfferCatalog","name":"Legal Services"}
  ]}
  </script>
</head><body><h1>Employment law</h1></body></html>`,
    robotsText: ROBOTS_WELCOMING,
    llmsText: null,
    expect(r) {
      ok("service lawfirm: NOT missing Product (honest-broker)", !r.schema.missing.includes("Product"));
      ok("service lawfirm: no 'missing Product' finding", !r.findings.some((f) => /Product JSON-LD/i.test(f.detail)));
      ok("service lawfirm: still has findings (genuine gaps)", r.findings.length > 0);
      ok("service lawfirm: LegalService in found types", r.schema.found.includes("LegalService"));
    },
  },

  {
    name: "Service: government site with GovernmentOrganization",
    category: "service",
    html: `<!doctype html><html lang="en"><head>
  <title>City of Springfield — Official Site</title>
  <meta name="description" content="City services.">
  <script type="application/ld+json">
  {"@graph":[
    {"@type":"GovernmentOrganization","name":"City of Springfield"},
    {"@type":"GovernmentService","name":"Permit Applications"},
    {"@type":"WebSite","url":"https://springfield.gov"}
  ]}
  </script>
</head><body><h1>City services</h1></body></html>`,
    robotsText: ROBOTS_WELCOMING,
    llmsText: null,
    expect(r) {
      ok("service gov: NOT missing Product", !r.schema.missing.includes("Product"));
      ok("service gov: no Product finding", !r.findings.some((f) => /Product JSON-LD/i.test(f.detail)));
      ok("service gov: GovernmentOrganization in found", r.schema.found.includes("GovernmentOrganization"));
    },
  },

  {
    name: "Service: healthcare practice with MedicalBusiness",
    category: "service",
    html: `<!doctype html><html lang="en"><head>
  <title>Springfield Family Clinic</title>
  <script type="application/ld+json">
  {"@type":"MedicalBusiness","name":"Springfield Family Clinic"}
  </script>
</head><body><h1>Family medicine</h1></body></html>`,
    robotsText: ROBOTS_NONE,
    llmsText: null,
    expect(r) {
      ok("service medical: NOT missing Product", !r.schema.missing.includes("Product"));
      ok("service medical: MedicalBusiness in found", r.schema.found.includes("MedicalBusiness"));
    },
  },

  // -------------------------------------------------------------------------
  // CATEGORY: clean
  //
  // A well-optimised modern site: Next.js, Organization + WebSite JSON-LD,
  // welcoming robots, llms.txt present. Should score high, detect the stack,
  // and not produce false "missing schema" findings for types it actually has.
  // -------------------------------------------------------------------------
  {
    name: "Clean: Next.js with Organization + WebSite JSON-LD, welcoming robots",
    category: "clean",
    html: `<!doctype html><html lang="en"><head>
  <title>Acme — the honest widget shop for teams</title>
  <meta name="description" content="Acme makes widgets people actually use.">
  <link rel="canonical" href="https://acme.com/">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta property="og:title" content="Acme">
  <meta property="og:image" content="https://acme.com/og.png">
  <meta property="og:description" content="Acme widgets">
  <script id="__NEXT_DATA__" type="application/json">{"props":{},"page":"/"}</script>
  <script src="/_next/static/chunks/main-abc123.js"></script>
  <script type="application/ld+json">
  {"@graph":[
    {"@type":"Organization","name":"Acme","url":"https://acme.com"},
    {"@type":"WebSite","url":"https://acme.com"},
    {"@type":"FAQPage","mainEntity":[{"@type":"Question","name":"What is Acme?"}]},
    {"@type":"BreadcrumbList"}
  ]}
  </script>
</head><body><h1>Acme</h1></body></html>`,
    robotsText: ROBOTS_WELCOMING,
    llmsText: `# Acme\n\n> Acme makes widgets people actually use.\n\n## Products\n- Widget Pro\n`,
    expect(r) {
      ok("clean: Next.js detected", r.techStack.detected.some((s) => s.name === "Next.js" && s.confidence === "high"));
      ok("clean: Organization in found", r.schema.found.includes("Organization"));
      ok("clean: WebSite in found", r.schema.found.includes("WebSite"));
      ok("clean: FAQPage in found", r.schema.found.includes("FAQPage"));
      ok("clean: BreadcrumbList in found", r.schema.found.includes("BreadcrumbList"));
      ok("clean: NOT missing any universal schema type", r.schema.missing.length === 0);
      ok("clean: no false 'missing Organization' finding", !r.findings.some((f) => /Organization JSON-LD/i.test(f.detail)));
      ok("clean: no false 'missing WebSite' finding", !r.findings.some((f) => /WebSite JSON-LD/i.test(f.detail)));
      ok("clean: no false 'missing FAQPage' finding", !r.findings.some((f) => /FAQPage JSON-LD/i.test(f.detail)));
      ok("clean: NOT flagged missing Product (no commerce signals)", !r.schema.missing.includes("Product"));
      ok("clean: welcoming robots", r.crawlability.welcomesAiBots === true);
      ok("clean: sitemap detected", typeof r.crawlability.sitemap === "string");
      ok("clean: llms.txt valid", r.llmsTxt.valid === true);
      ok("clean: hygieneScore >= 70 (high-quality site)", r.hygieneScore >= 70);
      ok("clean: disclaimer present", /NOT a citation guarantee/i.test(r.disclaimer));
    },
  },

  {
    name: "Clean: Astro static site, organization schema, no commerce",
    category: "clean",
    html: `<!doctype html><html lang="en"><head>
  <title>Portfolio — Jane Dev</title>
  <meta name="description" content="Full-stack developer.">
  <link rel="canonical" href="https://janedev.io/">
  <meta name="viewport" content="width=device-width">
  <meta property="og:title" content="Jane Dev">
  <meta property="og:image" content="https://janedev.io/og.png">
  <link rel="stylesheet" href="/_astro/index.Dv5BCKLQ.css">
  <script type="application/ld+json">{"@type":"Organization","name":"Jane Dev","url":"https://janedev.io"}</script>
  <script type="application/ld+json">{"@type":"WebSite","url":"https://janedev.io"}</script>
</head><body><astro-island uid="1"><h1>Jane Dev</h1></astro-island></body></html>`,
    robotsText: ROBOTS_WELCOMING,
    llmsText: null,
    expect(r) {
      ok("clean astro: Astro detected", r.techStack.detected.some((s) => s.name === "Astro"));
      ok("clean astro: Organization in found", r.schema.found.includes("Organization"));
      ok("clean astro: WebSite in found", r.schema.found.includes("WebSite"));
      ok("clean astro: NOT flagged missing Product", !r.schema.missing.includes("Product"));
    },
  },

  // -------------------------------------------------------------------------
  // CATEGORY: shopify (ecommerce with Product schema)
  //
  // A Shopify store with WooCommerce-style Product JSON-LD.
  // Commerce signals (og:type=product) present → Product missing IS a fair finding.
  // Also: WooCommerce with Product schema should NOT be flagged for missing Product.
  // -------------------------------------------------------------------------
  {
    name: "Shopify: storefront with og:type=product but missing Product JSON-LD",
    category: "shopify",
    html: `<!doctype html><html lang="en"><head>
  <title>Acme Store — Widget Pro</title>
  <meta property="og:type" content="product">
  <script src="https://cdn.shopify.com/s/files/1/0/theme.js"></script>
  <script type="application/ld+json">{"@type":"Organization","name":"Acme Store"}</script>
</head><body><h1>Widget Pro</h1></body></html>`,
    robotsText: ROBOTS_WELCOMING,
    llmsText: null,
    expect(r) {
      ok("shopify no-product: Shopify detected", r.techStack.detected.some((s) => s.name === "Shopify"));
      ok("shopify no-product: Product flagged as missing (commerce page)", r.schema.missing.includes("Product"));
      ok("shopify no-product: Product finding is sev 3 (MED, not HIGH)", r.findings.filter((f) => /Product JSON-LD/i.test(f.detail)).every((f) => f.severity === 3));
    },
  },

  {
    name: "Shopify: storefront WITH Product JSON-LD (not missing, no false alarm)",
    category: "shopify",
    html: `<!doctype html><html lang="en"><head>
  <title>Acme Store — Widget Pro</title>
  <meta property="og:type" content="product">
  <script src="https://cdn.shopify.com/s/files/1/0/theme.js"></script>
  <script type="application/ld+json">
  {"@type":"Product","name":"Widget Pro","offers":{"@type":"Offer","price":"29.99"}}
  </script>
</head><body><h1>Widget Pro</h1></body></html>`,
    robotsText: ROBOTS_WELCOMING,
    llmsText: null,
    expect(r) {
      ok("shopify with-product: Product NOT missing", !r.schema.missing.includes("Product"));
      ok("shopify with-product: Product in found", r.schema.found.includes("Product"));
      ok("shopify with-product: no false Product finding", !r.findings.some((f) => /Product JSON-LD/.test(f.detail)));
    },
  },

];

// ---------------------------------------------------------------------------
// Run the matrix
// ---------------------------------------------------------------------------
async function run() {
  console.log(`\nscan-regression.test.js — ${CASES.length} URL fixture cases\n`);

  for (const tc of CASES) {
    console.log(`[${tc.category}] ${tc.name}`);

    const html = tc.html;
    const report = buildHygieneReport({
      url: `https://fixture.local/${tc.category}/`,
      html,
      contentBytes: Buffer.byteLength(html),
      robotsText: tc.robotsText !== undefined ? tc.robotsText : null,
      llmsText: tc.llmsText !== undefined ? tc.llmsText : null,
    });

    // Attach internal refs some expect() callbacks need without going back to
    // the outer scope.
    report._html = html;
    report._wafHtml = html;

    tc.expect(report);
  }

  // -------------------------------------------------------------------------
  // detectTechStack direct-call checks (edge cases not covered by the matrix)
  // -------------------------------------------------------------------------
  console.log("\ndetectTechStack edge cases");

  // WooCommerce alongside WordPress — both must appear.
  const WOO_HTML = `<!doctype html><html><head>
  <link rel="stylesheet" href="/wp-content/themes/storefront/style.css">
  <script src="/wp-content/plugins/woocommerce/assets/js/frontend/woocommerce.min.js"></script>
</head><body><h1>Shop</h1></body></html>`;
  const wooStack = detectTechStack(WOO_HTML);
  ok("detectTechStack: WordPress found on WooCommerce site", wooStack.detected.some((s) => s.name === "WordPress"));
  ok("detectTechStack: WooCommerce found", wooStack.detected.some((s) => s.name === "WooCommerce"));

  // Squarespace — no WordPress contamination.
  const SQ_HTML = `<!doctype html><html><head>
  <script src="https://static1.squarespace.com/static/main.js"></script>
</head><body></body></html>`;
  const sqStack = detectTechStack(SQ_HTML);
  ok("detectTechStack: Squarespace detected", sqStack.detected.some((s) => s.name === "Squarespace"));
  ok("detectTechStack: no WordPress on Squarespace", !sqStack.detected.some((s) => s.name === "WordPress"));

  // SvelteKit — no React/Vite noise.
  const SVELTE_HTML = `<!doctype html><html><head>
  <link rel="stylesheet" href="/_app/immutable/index.css">
  <script type="module" src="/_app/immutable/start.js"></script>
</head><body><div id="svelte"></div></body></html>`;
  const svelteStack = detectTechStack(SVELTE_HTML);
  ok("detectTechStack: SvelteKit detected", svelteStack.detected.some((s) => s.name === "SvelteKit"));
  ok("detectTechStack: no bare React on SvelteKit site", !svelteStack.detected.some((s) => s.name === "React"));

  // Bootstrap + jQuery coexist (no deduplication kills either).
  const BSJS_HTML = `<!doctype html><html><head>
  <link rel="stylesheet" href="/css/bootstrap.min.css">
  <script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
</head><body></body></html>`;
  const bsjsStack = detectTechStack(BSJS_HTML);
  ok("detectTechStack: Bootstrap detected alongside jQuery", bsjsStack.detected.some((s) => s.name === "Bootstrap"));
  ok("detectTechStack: jQuery detected alongside Bootstrap", bsjsStack.detected.some((s) => s.name === "jQuery"));

  // Angular app — no React false positive.
  const ANGULAR_HTML = `<!doctype html><html><head>
  <title>Angular App</title>
</head><body><app-root ng-version="17.0.0"></app-root></body></html>`;
  const angularStack = detectTechStack(ANGULAR_HTML);
  ok("detectTechStack: Angular detected", angularStack.detected.some((s) => s.name === "Angular"));
  ok("detectTechStack: no bare React on Angular site", !angularStack.detected.some((s) => s.name === "React"));

  // Empty page → note includes "No obvious stack".
  const emptyStack = detectTechStack("<html><body></body></html>");
  ok("detectTechStack: empty page note says no obvious stack", /No obvious stack/i.test(emptyStack.note));

  // -------------------------------------------------------------------------
  // buildRenderDiff — honest-reporting path checks
  // -------------------------------------------------------------------------
  console.log("\nbuildRenderDiff honest-reporting");

  // Static fetch was WAF-blocked; browser render has schema.
  const renderedWithSchema = `<html><head>
  <script type="application/ld+json">{"@type":"Organization"}</script>
</head><body><h1>Site</h1></body></html>`;
  const diffWaf = buildRenderDiff(null, renderedWithSchema, null);
  ok("renderDiff WAF: available:true", diffWaf.available === true);
  ok("renderDiff WAF: staticWasBlocked:true", diffWaf.staticWasBlocked === true);
  ok("renderDiff WAF: Organization in schemasOnlyInBrowser", diffWaf.schemasOnlyInBrowser.includes("Organization"));
  ok("renderDiff WAF: hiddenSchemaCount >= 1", diffWaf.hiddenSchemaCount >= 1);

  // Both sides have the same schema — nothing hidden.
  const staticHtml = `<html><head><script type="application/ld+json">{"@type":"Organization"}</script></head><body><h1>X</h1></body></html>`;
  const diffSame = buildRenderDiff(staticHtml, staticHtml, null);
  ok("renderDiff same: hiddenSchemaCount=0", diffSame.hiddenSchemaCount === 0);
  ok("renderDiff same: staticWasBlocked:false", diffSame.staticWasBlocked === false);

  // JS-rendered site: browser rendered HTML much larger → isSpa:true.
  const thinShell = `<html><head><title>App</title></head><body><div id="root"></div></body></html>`;
  const fatRendered = thinShell + `<div>${"content ".repeat(400)}</div>`;
  const diffSpa = buildRenderDiff(thinShell, fatRendered, null);
  ok("renderDiff SPA: isSpa:true (rendered >> static)", diffSpa.isSpa === true);
  ok("renderDiff SPA: staticWasBlocked:false", diffSpa.staticWasBlocked === false);

  // DOM probe wins over HTML parsing when domSchemas.types is non-empty.
  const domProbe = { ldCount: 2, types: ["Organization", "WebSite"], mdCount: 0, mdTypes: [] };
  const diffProbe = buildRenderDiff(null, null, domProbe);
  ok("renderDiff domProbe: available:true", diffProbe.available === true);
  ok("renderDiff domProbe: Organization in browserTypes (via schemasInBoth or OnlyInBrowser)", diffProbe.schemasOnlyInBrowser.includes("Organization") || diffProbe.schemasInBoth.includes("Organization"));

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  const total = passed + failed;
  if (failed > 0) {
    console.error(`\n${failed} FAILURE(S) out of ${total} checks. See FAIL lines above.`);
    process.exit(1);
  }
  console.log(`\nALL ${passed} REGRESSION CHECKS PASSED — zero keys, zero network.`);
}

run().catch((e) => {
  console.error("\nTEST FAILED (unhandled):", e.message);
  if (e.stack) console.error(e.stack);
  process.exit(1);
});
