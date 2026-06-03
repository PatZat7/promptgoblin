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
  if (!llms.present)
    add(2, "llms", "No llms.txt. Hygiene only — emerging, not a proven citation lever.");
  else if (!llms.valid)
    add(1, "llms", `llms.txt present but off-spec: ${llms.notes.join("; ")}.`);
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

module.exports = {
  EXPECTED_TYPES,
  AI_BOTS,
  extractJsonLdTypes,
  countMalformedJsonLd,
  analyzeHead,
  analyzeWeight,
  analyzeRobots,
  analyzeLlmsTxt,
  buildHygieneReport,
};
