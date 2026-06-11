"use strict";

/**
 * Tier-1 hygiene analysis — the free, no-key scan.
 *
 * Given fetched HTML + robots.txt + llms.txt, produce an honest structured
 * report of *technical hygiene* signals that AEO/GEO playbooks treat as table
 * stakes: structured data, crawler welcome mat, head-tag hygiene, and a few
 * lightweight Core Web Vitals proxies.
 *
 * HONESTY CONSTRAINT (Prompt Goblin core positioning): schema/llms.txt are
 * HYGIENE, NOT proven citation levers. Nothing in here claims "this gets you
 * cited." The real levers are brand mentions + Bing ranking — surfaced as a
 * caveat, not a promise.
 *
 * Pure functions: HTML/text in, JSON out. No network, so unit-testable offline.
 */

// Schema @types AEO/GEO playbooks consider table stakes for a marketed domain.
// Mirrors pipeline goblin/nodes/schema_audit.py:_EXPECTED_TYPES.
// NOTE: Product is intentionally NOT in this universal set — it is commerce-only
// and flagged conditionally below (see pageSignalsCommerce). We never tell a
// service or government site it's "missing Product schema": those correctly use
// Service / Offer / OfferCatalog. (Honest-broker rule.)
const EXPECTED_TYPES = [
  "Organization",
  "WebSite",
  "FAQPage",
  "BreadcrumbList",
];

// AI answer-engine crawler user-agents we want to see welcomed in robots.txt.
const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "PerplexityBot",
  "Google-Extended",
];

/** Pull @type values out of every JSON-LD <script> block. Regex-based so we
 * need no DOM dependency in the function bundle. */
function extractJsonLdTypes(html) {
  const found = new Set();
  const re =
    /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    let data;
    try {
      data = JSON.parse(m[1].trim());
    } catch {
      continue; // malformed JSON-LD is itself a finding (see below)
    }
    const nodes = Array.isArray(data) ? data : [data];
    for (const node of nodes) {
      collectTypes(node, found);
    }
  }
  return [...found].sort();
}

function collectTypes(node, found) {
  if (!node || typeof node !== "object") return;
  const t = node["@type"];
  if (Array.isArray(t)) t.forEach((x) => found.add(String(x)));
  else if (t) found.add(String(t));
  // @graph holds an array of entities — common in real-world JSON-LD.
  if (Array.isArray(node["@graph"]))
    node["@graph"].forEach((g) => collectTypes(g, found));
}

/** Count JSON-LD blocks that failed to parse (broken structured data). */
function countMalformedJsonLd(html) {
  const re =
    /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m,
    bad = 0;
  while ((m = re.exec(html)) !== null) {
    try {
      JSON.parse(m[1].trim());
    } catch {
      bad++;
    }
  }
  return bad;
}

function firstMatch(re, s) {
  const m = re.exec(s);
  return m ? m[1].trim() : null;
}

/** Title / meta description / canonical / OpenGraph + viewport hygiene. */
function analyzeHead(html) {
  const title = firstMatch(/<title[^>]*>([\s\S]*?)<\/title>/i, html);
  const metaDesc = firstMatch(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i,
    html
  );
  const canonical = firstMatch(
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i,
    html
  );
  const ogTitle = /<meta[^>]+property=["']og:title["']/i.test(html);
  const ogDesc = /<meta[^>]+property=["']og:description["']/i.test(html);
  const ogImage = /<meta[^>]+property=["']og:image["']/i.test(html);
  const viewport = /<meta[^>]+name=["']viewport["']/i.test(html);
  const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
  const lang = firstMatch(/<html[^>]+lang=["']([^"']*)["']/i, html);

  return {
    title,
    titleLength: title ? title.length : 0,
    metaDescription: metaDesc,
    metaDescriptionLength: metaDesc ? metaDesc.length : 0,
    canonical,
    openGraph: { title: ogTitle, description: ogDesc, image: ogImage },
    hasViewport: viewport,
    h1Count,
    htmlLang: lang,
  };
}

/** Lightweight Core Web Vitals *proxies*. We can't measure field LCP/INP/CLS
 * from one server-side fetch — these are static-weight signals only, labeled
 * honestly as proxies. */
function analyzeWeight(html, contentBytes) {
  const scripts = (html.match(/<script[\s>]/gi) || []).length;
  const blockingScripts = (
    html.match(/<script(?![^>]*\b(?:async|defer|type=["']module["'])\b)[^>]*\bsrc=/gi) ||
    []
  ).length;
  const blockingStyles = (
    html.match(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi) || []
  ).length;
  const inlineStyleBytes = (html.match(/<style[\s>][\s\S]*?<\/style>/gi) || [])
    .join("").length;
  const images = (html.match(/<img[\s>]/gi) || []).length;
  const imagesMissingDims = (
    html.match(/<img(?![^>]*\b(?:width|height)=)[^>]*>/gi) || []
  ).length; // missing width/height -> CLS risk
  const lazyImages = (html.match(/<img[^>]+loading=["']lazy["']/gi) || []).length;

  return {
    htmlBytes: contentBytes,
    htmlKilobytes: Math.round((contentBytes / 1024) * 10) / 10,
    scriptTags: scripts,
    renderBlockingScripts: blockingScripts,
    renderBlockingStylesheets: blockingStyles,
    inlineStyleBytes,
    images,
    imagesMissingDimensions: imagesMissingDims, // CLS proxy
    lazyLoadedImages: lazyImages,
  };
}

// <meta name="generator" content="X"> substrings → canonical stack name.
const GENERATOR_MAP = [
  [/wordpress/i, "WordPress"],
  [/drupal/i, "Drupal"],
  [/joomla/i, "Joomla"],
  [/ghost/i, "Ghost"],
  [/hugo/i, "Hugo"],
  [/jekyll/i, "Jekyll"],
  [/eleventy/i, "Eleventy"],
  [/wix\.com|wix website/i, "Wix"],
  [/squarespace/i, "Squarespace"],
  [/webflow/i, "Webflow"],
  [/shopify/i, "Shopify"],
  [/hubspot/i, "HubSpot"],
  [/gatsby/i, "Gatsby"],
  [/next\.js/i, "Next.js"],
];

// HTML/asset fingerprints: [regex, name, confidence, evidence].
const TECH_RULES = [
  [/<script[^>]+id=["']__NEXT_DATA__["']|\/_next\/static\//i, "Next.js", "high", "Next.js data or /_next/ assets"],
  [/\/_nuxt\/|window\.__NUXT__|id=["']__nuxt["']/i, "Nuxt", "high", "Nuxt runtime or /_nuxt/ assets"],
  [/__remixContext|__remixManifest/i, "Remix", "high", "Remix runtime context"],
  [/\/_astro\/|data-astro-|astro-island/i, "Astro", "high", "Astro assets or islands"],
  [/\/_app\/immutable\/|__sveltekit/i, "SvelteKit", "high", "SvelteKit immutable assets"],
  [/___gatsby|gatsby-(?:image|plugin|script)/i, "Gatsby", "high", "Gatsby runtime markers"],
  [/ng-version=|_nghost-|<app-root[\s>]/i, "Angular", "high", "Angular root or ng-version"],
  [/data-v-app|data-v-[0-9a-f]{8}|window\.__VUE__/i, "Vue", "medium", "Vue scoped attributes or runtime"],
  [/wp-content|wp-includes/i, "WordPress", "high", "WordPress asset paths"],
  [/woocommerce|wp-content\/plugins\/woocommerce/i, "WooCommerce", "high", "WooCommerce markers"],
  [/cdn\.shopify\.com|Shopify\.theme|\/cart\/add\.js|myshopify\.com/i, "Shopify", "high", "Shopify CDN or storefront markers"],
  [/cdn11\.bigcommerce\.com|bigcommerce\.com\/s-/i, "BigCommerce", "high", "BigCommerce CDN"],
  [/\/static\/version\d|Magento_|mage\/cookies/i, "Magento", "high", "Magento static or runtime markers"],
  [/prestashop|\/modules\/ps_/i, "PrestaShop", "high", "PrestaShop modules"],
  [/uploads-ssl\.webflow\.com|data-wf-page=|webflow\.js/i, "Webflow", "high", "Webflow attributes or assets"],
  [/static\.wixstatic\.com|X-Wix-|wix-code-sdk|wixsite\.com/i, "Wix", "high", "Wix static assets or runtime markers"],
  [/static1\.squarespace\.com|squarespace-cdn|Y\.Squarespace/i, "Squarespace", "high", "Squarespace CDN or runtime markers"],
  [/framerusercontent\.com|data-framer-/i, "Framer", "high", "Framer asset host or data attributes"],
  [/Drupal\.settings|\/sites\/default\/files|data-drupal-/i, "Drupal", "high", "Drupal settings or asset paths"],
  [/\/media\/jui\/|\/templates\/[^"']+\/joomla/i, "Joomla", "medium", "Joomla media or template paths"],
  [/hs-scripts\.com|js\.hs-analytics|_hsenc=/i, "HubSpot", "medium", "HubSpot scripts or tracking"],
  [/cdn\.jsdelivr\.net\/npm\/bootstrap|\/bootstrap(?:\.min)?\.css/i, "Bootstrap", "low", "Bootstrap stylesheet"],
  [/cdn\.tailwindcss\.com|\/tailwind(?:\.min)?\.css/i, "Tailwind CSS", "low", "Tailwind stylesheet or CDN"],
  [/\/bulma(?:\.min)?\.css|cdn\.jsdelivr\.net\/npm\/bulma/i, "Bulma", "low", "Bulma stylesheet"],
  [/\/foundation(?:\.min)?\.css|foundation-sites/i, "Foundation", "low", "Foundation stylesheet"],
  [/\/materialize(?:\.min)?\.css|materializecss/i, "Materialize", "low", "Materialize stylesheet"],
  [/code\.jquery\.com|\/jquery(?:-\d|\.min)?\.js/i, "jQuery", "low", "jQuery script"],
  [/data-reactroot|react-dom(?:\.production)?(?:\.min)?\.js/i, "React", "low", "React DOM markers"],
  [/\/assets\/index-[A-Za-z0-9_]+\.js|type=["']module["'][^>]+src=["'][^"']*\/assets\//i, "Vite", "low", "Vite-bundled module assets"],
];

// Specific frameworks make a bare React/Vite low-confidence hint redundant noise.
const SPECIFIC_FRAMEWORKS = ["Next.js", "Nuxt", "Remix", "Astro", "SvelteKit", "Gatsby", "Angular", "Vue"];

function detectTechStack(html) {
  const signals = [];
  const add = (name, confidence, evidence) => {
    if (!signals.some((s) => s.name === name)) signals.push({ name, confidence, evidence });
  };

  // 1) <meta name="generator"> is the most authoritative single signal.
  const generator = firstMatch(
    /<meta[^>]+name=["']generator["'][^>]+content=["']([^"']*)["']/i,
    html
  );
  if (generator) {
    for (const [re, name] of GENERATOR_MAP) {
      if (re.test(generator)) add(name, "high", `generator meta: "${generator.slice(0, 48)}"`);
    }
  }

  // 2) Framework / CMS / ecommerce fingerprints in the markup + asset paths.
  for (const [re, name, conf, ev] of TECH_RULES) {
    if (re.test(html)) add(name, conf, ev);
  }

  let detected = signals;
  if (signals.some((s) => SPECIFIC_FRAMEWORKS.includes(s.name))) {
    detected = detected.filter(
      (s) => !((s.name === "React" || s.name === "Vite") && s.confidence === "low")
    );
  }

  return {
    detected: detected.slice(0, 6),
    note:
      detected.length > 0
        ? "Detected from public HTML fingerprints. Confirm the stack before implementation."
        : "No obvious stack fingerprint found in the public HTML. We auto-detect your stack during the audit and ship stack-specific fixes with Scout.",
  };
}

/** Does robots.txt explicitly welcome (Allow / no Disallow) the AI bots? */
function analyzeRobots(robotsText) {
  if (robotsText == null) {
    return { present: false, welcomesAiBots: false, bots: {}, sitemap: null };
  }
  const lines = robotsText.split(/\r?\n/);
  const sitemap = firstMatch(/^\s*sitemap:\s*(\S+)/im, robotsText);

  // Build per-user-agent disallow awareness (coarse but honest).
  const bots = {};
  for (const bot of AI_BOTS) {
    // crude: is there a block for this UA that Disallows /?
    const blockRe = new RegExp(
      `user-agent:\\s*${bot}[\\s\\S]*?(?=user-agent:|$)`,
      "i"
    );
    const block = blockRe.exec(robotsText);
    let blocked = false;
    if (block) blocked = /disallow:\s*\/\s*$/im.test(block[0]);
    // Also respect a global "User-agent: *  Disallow: /".
    const star = /user-agent:\s*\*[\s\S]*?disallow:\s*\/\s*$/im.test(robotsText);
    bots[bot] = { explicitlyMentioned: !!block, blocked: blocked || star };
  }
  const welcomesAiBots = Object.values(bots).every((b) => !b.blocked);
  void lines;
  return { present: true, welcomesAiBots, bots, sitemap };
}

/** Is llms.txt present and shaped like the spec (markdown headings + summary)? */
function analyzeLlmsTxt(llmsText) {
  if (llmsText == null) return { present: false, valid: false, notes: [] };
  const notes = [];
  const hasTitle = /^#\s+\S/m.test(llmsText);
  const hasSummary = /^>\s+\S/m.test(llmsText); // blockquote summary per spec
  const hasSections = /^##\s+\S/m.test(llmsText);
  if (!hasTitle) notes.push("missing top-level # title");
  if (!hasSummary) notes.push("missing > one-line summary blockquote");
  if (!hasSections) notes.push("no ## sections");
  return {
    present: true,
    valid: hasTitle && hasSummary,
    hasSections,
    bytes: llmsText.length,
    notes,
  };
}

/** Does the page signal commerce intent? Only then is a missing Product schema a
 * fair finding (a real storefront benefits from Product markup). */
function pageSignalsCommerce(html, schemaFound) {
  const f = schemaFound || [];
  if (f.includes("Product") || f.includes("Offer") || f.includes("AggregateOffer")) return true;
  if (/<meta[^>]+property=["']og:type["'][^>]+content=["']product["']/i.test(html)) return true;
  if (/<meta[^>]+property=["']product:price/i.test(html)) return true;
  if (/itemprop\s*=\s*["']price["']/i.test(html)) return true;
  return false;
}

/** Service / government sites correctly use Service / Offer / OfferCatalog — never
 * tell them they're "missing Product schema" (a self-discrediting, inapplicable
 * claim). Detect that pattern from their structured data. */
function pageSignalsService(schemaFound) {
  const SERVICE_TYPES = [
    "Service", "ProfessionalService", "LegalService", "MedicalBusiness",
    "LocalBusiness", "GovernmentService", "GovernmentOrganization", "OfferCatalog",
  ];
  return (schemaFound || []).some((t) => SERVICE_TYPES.includes(t));
}

/**
 * Compose the full Tier-1 report from already-fetched inputs. This is the
 * pure core; the handler does the fetching and wraps this.
 */
function buildHygieneReport({ url, html, contentBytes, robotsText, llmsText }) {
  const schemaFound = extractJsonLdTypes(html);
  const schemaMissing = EXPECTED_TYPES.filter((t) => !schemaFound.includes(t));
  // Product is commerce-only — add it to "missing" ONLY when the page signals
  // commerce intent and is NOT a service/government site. Keeps us from telling a
  // law firm or a .gov it's "missing Product schema" (the honesty wedge).
  if (
    !schemaFound.includes("Product") &&
    pageSignalsCommerce(html, schemaFound) &&
    !pageSignalsService(schemaFound)
  ) {
    schemaMissing.push("Product");
  }
  const malformedJsonLd = countMalformedJsonLd(html);
  const head = analyzeHead(html);
  const weight = analyzeWeight(html, contentBytes);
  const techStack = detectTechStack(html);
  const robots = analyzeRobots(robotsText);
  const llms = analyzeLlmsTxt(llmsText);

  // Findings: honest, severity-scored (mirrors pipeline Gap.severity 1-5).
  const findings = [];
  const add = (severity, area, detail) => findings.push({ severity, area, detail });

  for (const t of schemaMissing) {
    // FAQPage is a strong, broadly-applicable AEO lever (HIGH). Product, when it
    // reaches here, is a commerce-only gap (MED) — gated by the conditional above.
    const sev = t === "FAQPage" ? 4 : 3;
    add(sev, "schema", `Missing ${t} JSON-LD. Engines can't extract this entity cleanly.`);
  }
  if (malformedJsonLd > 0)
    add(4, "schema", `${malformedJsonLd} JSON-LD block(s) fail to parse — broken structured data is worse than none.`);
  if (!head.title) add(4, "head", "No <title> — the single highest-leverage head tag.");
  else if (head.titleLength > 65)
    add(2, "head", `Title is ${head.titleLength} chars; may truncate in results.`);
  if (!head.metaDescription) add(3, "head", "No meta description.");
  if (!head.canonical) add(2, "head", "No canonical link — duplicate-URL risk.");
  if (!head.openGraph.title || !head.openGraph.image)
    add(2, "head", "Incomplete OpenGraph (title/image) — weak link unfurls.");
  if (!head.hasViewport) add(3, "head", "No viewport meta — mobile rendering / CWV risk.");
  if (head.h1Count === 0) add(3, "content", "No <h1> heading.");
  else if (head.h1Count > 1) add(1, "content", `${head.h1Count} <h1> tags — pick one.`);
  if (!robots.present) add(3, "crawlability", "No robots.txt found.");
  else if (!robots.welcomesAiBots)
    add(4, "crawlability", "robots.txt blocks one or more AI answer-engine crawlers.");
  if (!robots.sitemap) add(2, "crawlability", "No Sitemap: line in robots.txt.");
  // llms.txt is informational only — Google confirmed Search + AI Overviews
  // don't use it (Illyes/Mueller, Jul 2025), so its absence/shape is NEVER
  // scored. Severity 0 = surfaced for transparency, zero score penalty.
  if (!llms.present)
    add(0, "llms", "No llms.txt — informational only. Google's Search & AI Overviews don't use it (Illyes/Mueller, Jul 2025); not scored.");
  else if (!llms.valid)
    add(0, "llms", `llms.txt present but off-spec (${llms.notes.join("; ")}) — informational only; Google doesn't use llms.txt, not scored.`);
  if (weight.renderBlockingScripts > 4)
    add(2, "cwv", `${weight.renderBlockingScripts} render-blocking scripts — LCP risk.`);
  if (weight.imagesMissingDimensions > 0)
    add(2, "cwv", `${weight.imagesMissingDimensions} image(s) without width/height — CLS risk.`);
  if (weight.htmlKilobytes > 250)
    add(1, "cwv", `HTML is ${weight.htmlKilobytes} KB before assets — heavy.`);

  findings.sort((a, b) => b.severity - a.severity);

  // Hygiene score: start at 100, dock by finding severity (honest, bounded).
  const penalty = findings.reduce((s, f) => s + f.severity * 3, 0);
  const hygieneScore = Math.max(0, 100 - penalty);

  return {
    url,
    fetchedAt: new Date().toISOString(),
    hygieneScore,
    schema: { found: schemaFound, missing: schemaMissing, malformedBlocks: malformedJsonLd },
    head,
    techStack,
    crawlability: robots,
    llmsTxt: llms,
    coreWebVitalsProxies: weight,
    findings,
    // The honesty caveat travels WITH the data, not just the prose summary.
    disclaimer:
      "Tier-1 measures technical hygiene (structured data, crawlability, head tags, " +
      "Core Web Vitals proxies). Hygiene is table stakes, NOT a citation guarantee. " +
      "The proven levers for AI-answer citation are brand mentions and Bing ranking; " +
      "those require the live LLM citation audit (Tier 2) and the weekly re-run loop.",
  };
}

/**
 * buildRenderDiff — compare what a static crawler sees vs. what a real browser
 * renders, to surface JSON-LD that only exists after JS execution (the "hidden
 * from crawlers" panel). Answer-engine crawlers largely fetch static HTML, so
 * JS-injected schema is invisible to them — that's a real, honest finding.
 *
 *   staticHtml   — the raw HTTP response body (null when the static fetch was
 *                  WAF-blocked and only the browser render succeeded).
 *   renderedHtml — browser-rendered HTML from Scrapfly (null when unavailable,
 *                  e.g. no SCRAPFLY_KEY).
 *   domSchemas   — live-DOM probe result { ldCount, types[], mdCount, mdTypes[] }
 *                  (null when not captured). When present, `types` is the
 *                  ground-truth browser-side schema list and wins over parsing.
 *
 * HONESTY CONSTRAINT: with no browser render to compare against, return
 * { available:false } — never invent a diff. A WAF-blocked static fetch is
 * reported as staticWasBlocked, not as a hygiene failure.
 */
function buildRenderDiff(staticHtml, renderedHtml, domSchemas) {
  const haveProbe = !!(domSchemas && Array.isArray(domSchemas.types));
  // Nothing browser-side to compare against → honestly unavailable.
  if (!renderedHtml && !haveProbe) return { available: false };

  const staticWasBlocked = staticHtml == null;
  const staticTypes = staticHtml ? extractJsonLdTypes(staticHtml) : [];

  // Browser-side schema truth: prefer the live-DOM probe, else parse rendered HTML.
  const browserTypes =
    haveProbe && domSchemas.types.length
      ? [...new Set(domSchemas.types.map(String))].sort()
      : renderedHtml
        ? extractJsonLdTypes(renderedHtml)
        : [];

  const staticSet = new Set(staticTypes);
  const browserSet = new Set(browserTypes);
  const schemasOnlyInBrowser = browserTypes.filter((t) => !staticSet.has(t));
  const schemasOnlyInStatic = staticTypes.filter((t) => !browserSet.has(t));
  const schemasInBoth = browserTypes.filter((t) => staticSet.has(t));

  // SPA heuristic: thin static shell, much larger rendered DOM. Only judge when
  // we can see both sides.
  const isSpa =
    !!staticHtml && !!renderedHtml && renderedHtml.length > staticHtml.length * 1.5;

  const diff = {
    available: true,
    schemasOnlyInBrowser,
    schemasOnlyInStatic,
    schemasInBoth,
    hiddenSchemaCount: schemasOnlyInBrowser.length,
    isSpa,
    staticWasBlocked,
  };

  // Head-tag drift (title / description) — only when the rendered head is readable.
  if (renderedHtml) {
    const staticHead = staticHtml ? analyzeHead(staticHtml) : null;
    const browserHead = analyzeHead(renderedHtml);
    diff.title = {
      static: staticHead ? staticHead.title : null,
      browser: browserHead.title,
      match: !!staticHead && staticHead.title === browserHead.title,
    };
    diff.description = {
      static: staticHead ? staticHead.metaDescription : null,
      browser: browserHead.metaDescription,
      match: !!staticHead && staticHead.metaDescription === browserHead.metaDescription,
    };
  }

  return diff;
}

module.exports = {
  EXPECTED_TYPES,
  AI_BOTS,
  extractJsonLdTypes,
  countMalformedJsonLd,
  analyzeHead,
  analyzeWeight,
  detectTechStack,
  analyzeRobots,
  analyzeLlmsTxt,
  buildHygieneReport,
  buildRenderDiff,
};
