"use strict";

/**
 * Tier-1 free hygiene scan — DO Functions web action.
 *
 * POST { url: "https://example.com" }
 * -> { ok, report, summary } with an honest technical-hygiene report.
 *
 * No API keys. Runs for everyone. Fetches the URL + robots.txt + llms.txt and
 * delegates the analysis to ./lib/hygiene.js (kept in sync from /functions/lib
 * by build.sh at deploy time so DO bundles it inside the action).
 *
 * NOT a citation claim — see report.disclaimer.
 */

const { reply, toUrl, assertPublicHost } = require("./lib/util");
const { buildHygieneReport, buildRenderDiff } = require("./lib/hygiene");
const { tier1Summary } = require("./lib/voice");

const FETCH_TIMEOUT_MS = 12000;
const SCRAPFLY_TIMEOUT_MS = 15000;
const MAX_BYTES = 3 * 1024 * 1024; // 3 MB cap on fetched HTML
const MAX_REDIRECTS = 4;

// Browser-like headers reduce NAIVE user-agent blocks. They do NOT and CANNOT
// defeat datacenter-IP reputation blocks (e.g. Akamai/Cloudflare scoring this
// function's egress IP) — those need a residential/proxy IP we intentionally do
// not use. We keep the PromptGoblinScanBot token appended so we stay honestly
// self-identifying (not impersonating a human). When the upstream still
// 4xx/5xx-blocks us, we classify it as bot_protection and report it honestly.
const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 " +
    "PromptGoblinScanBot/1.0 (+https://promptgoblin.io)",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif," +
    "image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

// Upstream statuses that signal bot/WAF protection rather than a real outage.
const BOT_PROTECTION_STATUSES = new Set([401, 403, 406, 409, 429, 503]);

// WAF challenge interstitials answer 200 with a CAPTCHA/JS-challenge body. Treat
// a page as a bot wall only when it BOTH matches a signature AND is implausibly
// small for a real homepage — avoids false-positiving pages that merely mention
// "captcha" in body copy.
const WAF_BODY_SIGNATURES = [
  /just a moment/i,
  /cf-browser-verification|cf-challenge|challenge-platform/i,
  /__cf_chl_|cf_chl_opt/i,
  /ak_bmsc|_abck|bm_sz|akamai/i,
  /captcha|are you a human|verify you are human/i,
  /distil_r_(?:captcha|blocked)|imperva|incapsula/i,
  /access denied|request unsuccessful|reference\s*#?\d/i,
];
function looksLikeBotWall(html, contentBytes) {
  if (!html) return false;
  const tiny = contentBytes < 12 * 1024;
  return tiny && WAF_BODY_SIGNATURES.some((re) => re.test(html));
}

// DOM schema probe: top-level `return` so Scrapfly captures the result in
// result.browser_data.javascript_evaluation_result. Queries the live DOM after
// React/JS has fully mounted — the ground truth for what schemas actually exist.
const JS_SCHEMA_PROBE = Buffer.from(
  "var ld=document.querySelectorAll(\"script[type='application/ld+json']\");" +
  "var md=document.querySelectorAll(\"[itemtype]\");" +
  "var types=Array.from(ld).flatMap(function(n){try{var d=JSON.parse(n.textContent);" +
  "return[].concat(d[\"@type\"]||(d[\"@graph\"]||[]).map(function(g){return g[\"@type\"]})).filter(Boolean)" +
  "}catch(e){return[]}});" +
  "return {ldCount:ld.length,types:Array.from(new Set(types)).sort()," +
  "mdCount:md.length,mdTypes:Array.from(new Set(Array.from(md).map(function(e){return e.getAttribute(\"itemtype\")}))).slice(0,8)};"
).toString("base64url");

// Scrapfly fetch: browser-rendered HTML + live DOM schema probe.
// asp=true adds residential-IP + TLS-spoof (needed for Akamai; optional for open sites).
// Returns { html, bytes, domSchemas } on success, null if no key / failure / still bot-walled.
async function fetchViaScrapfly(rawUrl, { asp = false } = {}) {
  const key = process.env.SCRAPFLY_KEY;
  if (!key) return null;
  const endpoint =
    `https://api.scrapfly.io/scrape?key=${encodeURIComponent(key)}` +
    `&url=${encodeURIComponent(rawUrl)}&render_js=true` +
    (asp ? "&asp=true" : "") +
    `&js=${JS_SCHEMA_PROBE}`;
  let resp;
  try {
    resp = await fetch(endpoint, { signal: AbortSignal.timeout(SCRAPFLY_TIMEOUT_MS) });
  } catch {
    return null;
  }
  if (!resp.ok) return null;
  let json;
  try { json = await resp.json(); } catch { return null; }
  const html = json?.result?.content ?? null;
  if (!html) return null;
  const bytes = Buffer.byteLength(html, "utf8");
  if (looksLikeBotWall(html, bytes)) return null;
  const domSchemas = json?.result?.browser_data?.javascript_evaluation_result ?? null;
  return { html, bytes, domSchemas };
}

// SSRF-safe fetch: follow redirects MANUALLY and re-validate EVERY hop's host
// (toUrl literal-guard + assertPublicHost DNS-guard), so a 30x response can't
// bounce the scan onto an internal target (localhost, 169.254.169.254, 10.x…).
// `blocked: true` means some hop failed the guard.
async function fetchText(initialUrl, { asBytes = false } = {}) {
  let current = initialUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const u = toUrl(current);
    if (!u) return { ok: false, status: 0, text: null, bytes: 0, blocked: true };
    if (!(await assertPublicHost(u.hostname)))
      return { ok: false, status: 0, text: null, bytes: 0, blocked: true };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let resp;
    try {
      resp = await fetch(u.href, {
        redirect: "manual",
        signal: controller.signal,
        headers: BROWSER_HEADERS,
      });
    } catch (e) {
      clearTimeout(timer);
      return { ok: false, status: 0, text: null, bytes: 0, error: e.name };
    }
    clearTimeout(timer);

    if (resp.status >= 300 && resp.status < 400) {
      const loc = resp.headers.get("location");
      if (!loc) return { ok: false, status: resp.status, text: null, bytes: 0 };
      try {
        current = new URL(loc, u.href).href; // resolve relative redirects, then re-validate
      } catch {
        return { ok: false, status: resp.status, text: null, bytes: 0 };
      }
      continue;
    }
    if (!resp.ok)
      return {
        ok: false,
        status: resp.status,
        text: null,
        bytes: 0,
        botProtected: BOT_PROTECTION_STATUSES.has(resp.status),
      };

    const text = await resp.text();
    const bytes = Buffer.byteLength(text, "utf8");
    return {
      ok: true,
      status: resp.status,
      text: asBytes ? text.slice(0, MAX_BYTES) : text,
      bytes,
    };
  }
  return { ok: false, status: 0, text: null, bytes: 0, error: "too_many_redirects" };
}

async function main(args) {
  const origin = args.__ow_headers?.origin;
  const method = (args.__ow_method || "post").toLowerCase();
  if (method === "options") return reply(204, "", origin);

  const target = toUrl(args.url || args.domain);
  if (!target)
    return reply(
      400,
      { ok: false, error: "Provide a valid public http(s) URL in `url`." },
      origin
    );

  const page = await fetchText(target.href, { asBytes: true });

  // SSRF guard tripped (private/internal host or a redirect hop to one). This is
  // a scope refusal, not a hygiene verdict. Kept first and unchanged.
  if (page.blocked)
    return reply(
      400,
      {
        ok: false,
        outcome: "non_public",
        error:
          "That host (or a redirect from it) resolves to a non-public address. We only scan public sites.",
      },
      origin
    );

  // Upstream bot/WAF protection: a 4xx/5xx block (403/429/503…) OR a 200 served
  // with a CAPTCHA/challenge interstitial. This is NOT a hygiene failure and is
  // NEVER scored — same category as the SPA static-fetch blind spot. We say so
  // honestly and return 200 (our function succeeded; the block is the upstream's,
  // and a 200 body survives any client that early-returns on !r.ok).
  const botWalled =
    (!page.ok && page.botProtected) ||
    (page.ok && looksLikeBotWall(page.text, page.bytes));

  // renderedHtml: browser-rendered HTML from Scrapfly (null = unavailable).
  // staticHtml:   the raw HTTP response body (null when WAF-blocked).
  // domSchemas:   live-DOM probe result capturing schemas after JS fully mounts.
  let renderedHtml = null;
  let staticHtml = page.ok ? page.text : null;
  let domSchemas = null;

  if (botWalled) {
    const fallback = await fetchViaScrapfly(target.href, { asp: true });
    if (fallback) {
      renderedHtml = fallback.html;
      domSchemas = fallback.domSchemas;
      // Scrapfly bypassed the WAF — overwrite page and fall through to hygiene.
      // staticHtml stays null (honestly: the static crawl got nothing).
      page.ok = true;
      page.text = fallback.html;
      page.bytes = fallback.bytes;
      page.status = 200;
    } else {
      return reply(
        200,
        {
          ok: false,
          blocked: true,
          outcome: "blocked_by_waf",
          reason: "bot_protection",
          status: page.status || 200,
          error:
            `${target.href} is behind bot/WAF protection that blocks automated ` +
            `requests (HTTP ${page.status || 200}). This is NOT a problem with your ` +
            `site's hygiene — our server-side fetch can't reach it the way a browser ` +
            `can. The full Scout audit reads protected sites a different way.`,
        },
        origin
      );
    }
  }

  // Genuine fetch failure (DNS, timeout, real 5xx outage, non-WAF 4xx).
  if (!page.ok)
    return reply(
      200,
      {
        ok: false,
        outcome: "unreachable",
        status: page.status || 0,
        error: `Couldn't fetch ${target.href}${
          page.status ? ` (HTTP ${page.status})` : ""
        }. Is it public and reachable?`,
      },
      origin
    );

  const robotsUrl = `${target.origin}/robots.txt`;
  const llmsUrl = `${target.origin}/llms.txt`;

  // For non-WAF sites: fire Scrapfly browser render in parallel with robots/llms.
  // For WAF sites: renderedHtml already set above; skip the extra call.
  const renderPromise = renderedHtml
    ? Promise.resolve(null)
    : fetchViaScrapfly(target.href, { asp: false });

  const [robots, llms, renderResult] = await Promise.all([
    fetchText(robotsUrl),
    fetchText(llmsUrl),
    renderPromise,
  ]);

  if (renderResult) {
    renderedHtml = renderResult.html;
    domSchemas = renderResult.domSchemas ?? null;
  }

  const report = buildHygieneReport({
    url: target.href,
    html: page.text,
    contentBytes: page.bytes,
    robotsText: robots.ok ? robots.text : null,
    llmsText: llms.ok ? llms.text : null,
  });

  const renderDiff = buildRenderDiff(staticHtml, renderedHtml, domSchemas);

  return reply(200, { ok: true, tier: 1, report, renderDiff, summary: tier1Summary(report) }, origin);
}

exports.main = main;

// Named exports for unit-testing WITHOUT breaking the DO Functions handler.
// These are internal helpers; callers should stub global fetch before using fetchText.
exports._looksLikeBotWall = looksLikeBotWall;
exports._fetchText = fetchText;
exports._BOT_PROTECTION_STATUSES = BOT_PROTECTION_STATUSES;
