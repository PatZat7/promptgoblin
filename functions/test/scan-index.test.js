"use strict";

/**
 * Unit tests for functions/packages/scan/tier1/index.js
 *
 * Exercises: looksLikeBotWall, fetchText (with stubbed global.fetch),
 * assertPublicHost SSRF re-validation via redirect, and the main() envelope.
 *
 * Zero keys, zero real network. Mirrors scan.test.js plain-assert style.
 */

const assert = require("assert");
const path = require("path");

// index.js requires ./lib/* which are synced by build-sync. Require from the
// tier1 directory so the paths resolve correctly.
const indexPath = path.join(__dirname, "..", "packages", "scan", "tier1", "index.js");
const { main, _looksLikeBotWall, _fetchText, _BOT_PROTECTION_STATUSES } = require(indexPath);

let passed = 0;
function ok(name, cond) {
  assert.ok(cond, name);
  console.log(`  ok  ${name}`);
  passed++;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Replace global.fetch for the duration of `fn`, then restore. */
async function withFetch(impl, fn) {
  const original = global.fetch;
  global.fetch = impl;
  try {
    return await fn();
  } finally {
    global.fetch = original;
  }
}

/** Build a minimal DO-Functions args object. */
function args(url) {
  return { url, __ow_method: "post", __ow_headers: { origin: "https://test.local" } };
}

/** Parse the JSON body from a reply() envelope. */
function body(envelope) {
  return JSON.parse(envelope.body);
}

// ---------------------------------------------------------------------------
// WAF body fixtures
// ---------------------------------------------------------------------------
const CF_CHALLENGE = `<!DOCTYPE html><html><head><title>Just a moment...</title>
<script>window.__cf_chl_opt={cNounce:'x'};</script>
</head><body><h1>Just a moment...</h1></body></html>`;

const AKAMAI_BODY = `<html><body><script>var ak_bmsc='abc123';</script><p>checking</p></body></html>`;

const NORMAL_HTML = `<!doctype html><html lang="en"><head>
  <title>Acme</title>
  <meta name="description" content="widgets">
  <link rel="canonical" href="https://acme.com/">
  <script type="application/ld+json">{"@graph":[{"@type":"Organization"},{"@type":"WebSite"}]}</script>
</head><body><h1>Acme</h1></body></html>`;

async function run() {

// ---------------------------------------------------------------------------
// looksLikeBotWall (synchronous — no fetch stub needed)
// ---------------------------------------------------------------------------
console.log("looksLikeBotWall");

ok(
  "looksLikeBotWall: CF challenge (small body) -> true",
  _looksLikeBotWall(CF_CHALLENGE, CF_CHALLENGE.length)
);

ok(
  "looksLikeBotWall: Akamai signature (small body) -> true",
  _looksLikeBotWall(AKAMAI_BODY, AKAMAI_BODY.length)
);

// Signature matches but body is large (>12 KB) -> NOT a bot wall
const LARGE_PAGE = "x".repeat(13 * 1024) + " just a moment ";
ok(
  "looksLikeBotWall: large body with keyword -> false (size guard)",
  !_looksLikeBotWall(LARGE_PAGE, LARGE_PAGE.length)
);

const NORMAL_SMALL = `<!doctype html><html><head><title>Hi</title></head><body><h1>Hi</h1></body></html>`;
ok(
  "looksLikeBotWall: normal small page -> false",
  !_looksLikeBotWall(NORMAL_SMALL, NORMAL_SMALL.length)
);

ok("looksLikeBotWall: null html -> false", !_looksLikeBotWall(null, 0));

// ---------------------------------------------------------------------------
// BOT_PROTECTION_STATUSES set
// ---------------------------------------------------------------------------
console.log("BOT_PROTECTION_STATUSES");
ok("BOT_PROTECTION_STATUSES includes 403", _BOT_PROTECTION_STATUSES.has(403));
ok("BOT_PROTECTION_STATUSES includes 429", _BOT_PROTECTION_STATUSES.has(429));
ok("BOT_PROTECTION_STATUSES includes 503", _BOT_PROTECTION_STATUSES.has(503));
ok("BOT_PROTECTION_STATUSES does NOT include 200", !_BOT_PROTECTION_STATUSES.has(200));

// ---------------------------------------------------------------------------
// fetchText — stubbed fetch
// ---------------------------------------------------------------------------
console.log("fetchText (stubbed)");

// Normal 200 HTML page — use example.com which resolves to a public IP.
await withFetch(async () => ({
  ok: true,
  status: 200,
  text: async () => "<html><body>hello</body></html>",
  headers: { get: () => null },
}), async () => {
  const result = await _fetchText("https://example.com/");
  ok("fetchText: 200 OK page -> ok:true", result.ok === true);
  ok("fetchText: 200 returns text", typeof result.text === "string" && result.text.length > 0);
  ok("fetchText: 200 returns status 200", result.status === 200);
});

// 403 -> botProtected flag
await withFetch(async () => ({
  ok: false,
  status: 403,
  text: async () => "Forbidden",
  headers: { get: () => null },
}), async () => {
  const result = await _fetchText("https://example.com/");
  ok("fetchText: 403 -> ok:false", result.ok === false);
  ok("fetchText: 403 -> botProtected:true", result.botProtected === true);
  ok("fetchText: 403 -> status:403", result.status === 403);
});

// DNS / network error (fetch throws)
await withFetch(async () => {
  const e = new Error("network");
  e.name = "TypeError";
  throw e;
}, async () => {
  const result = await _fetchText("https://example.com/");
  ok("fetchText: network throw -> ok:false", result.ok === false);
  ok("fetchText: network throw -> error:TypeError", result.error === "TypeError");
});

// SSRF: redirect to 169.254.169.254 — toUrl blocks the private IP literal
// before any fetch attempt, so blocked:true is set without calling fetch.
await withFetch(async (url) => {
  if (url.includes("169.254")) throw new Error("should have been blocked before fetch");
  return {
    ok: false,
    status: 302,
    headers: { get: (h) => h === "location" ? "http://169.254.169.254/latest/meta-data" : null },
  };
}, async () => {
  const result = await _fetchText("https://example.com/");
  ok("fetchText: redirect to 169.254.169.254 -> blocked:true (SSRF guard)", result.blocked === true);
  ok("fetchText: redirect to 169.254.169.254 -> ok:false", result.ok === false);
});

// SSRF: redirect to RFC-1918 10.x
await withFetch(async (url) => {
  if (url.includes("10.0.0")) throw new Error("should have been blocked before fetch");
  return {
    ok: false,
    status: 301,
    headers: { get: (h) => h === "location" ? "http://10.0.0.1/" : null },
  };
}, async () => {
  const result = await _fetchText("https://example.com/");
  ok("fetchText: redirect to 10.0.0.1 -> blocked:true (SSRF guard)", result.blocked === true);
});

// ---------------------------------------------------------------------------
// main() — WAF / outcome envelope tests
// ---------------------------------------------------------------------------
console.log("main() outcome envelopes");

// (a) 403 -> blocked_by_waf, HTTP-200 envelope, no numeric score, blocked:true
await withFetch(async () => ({
  ok: false,
  status: 403,
  text: async () => "Forbidden",
  headers: { get: () => null },
}), async () => {
  const env = await main(args("https://example.com/"));
  const b = body(env);
  ok("main 403: envelope statusCode is 200", env.statusCode === 200);
  ok("main 403: ok:false", b.ok === false);
  ok("main 403: blocked:true", b.blocked === true);
  ok("main 403: outcome is blocked_by_waf", b.outcome === "blocked_by_waf");
  ok("main 403: no report/score (never scored)", b.report === undefined && b.hygieneScore === undefined);
  ok("main 403: status field is 403", b.status === 403);
});

// (b) 200 Cloudflare challenge body -> blocked_by_waf
await withFetch(async () => ({
  ok: true,
  status: 200,
  text: async () => CF_CHALLENGE,
  headers: { get: () => null },
}), async () => {
  const env = await main(args("https://example.com/"));
  const b = body(env);
  ok("main CF-challenge 200: envelope statusCode is 200", env.statusCode === 200);
  ok("main CF-challenge 200: ok:false", b.ok === false);
  ok("main CF-challenge 200: blocked:true", b.blocked === true);
  ok("main CF-challenge 200: outcome blocked_by_waf", b.outcome === "blocked_by_waf");
});

// (c) Normal 200 HTML -> real hygiene score (not blocked)
await withFetch(async (url) => {
  // robots.txt and llms.txt secondary fetches return 404
  if (url.includes("robots") || url.includes("llms")) {
    return { ok: false, status: 404, text: async () => "", headers: { get: () => null } };
  }
  return {
    ok: true,
    status: 200,
    text: async () => NORMAL_HTML,
    headers: { get: () => null },
  };
}, async () => {
  const env = await main(args("https://example.com/"));
  const b = body(env);
  ok("main normal 200: envelope statusCode 200", env.statusCode === 200);
  ok("main normal 200: ok:true", b.ok === true);
  ok("main normal 200: has report", b.report !== undefined);
  ok("main normal 200: hygieneScore is a number", typeof b.report.hygieneScore === "number");
  ok("main normal 200: outcome is NOT blocked_by_waf", b.outcome !== "blocked_by_waf");
  ok("main normal 200: blocked field absent", b.blocked === undefined);
  ok("main normal 200: tier:1", b.tier === 1);
});

// (d) DNS / network error -> outcome:'unreachable'
await withFetch(async () => {
  const e = new Error("network");
  e.name = "AbortError";
  throw e;
}, async () => {
  const env = await main(args("https://example.com/"));
  const b = body(env);
  ok("main network error: envelope statusCode 200", env.statusCode === 200);
  ok("main network error: ok:false", b.ok === false);
  ok("main network error: outcome unreachable", b.outcome === "unreachable");
  ok("main network error: no report", b.report === undefined);
});

// (e) SSRF — toUrl rejects IP literals outright -> 400 "provide a valid URL".
// No fetch stub needed; this exercises the toUrl null path, not the DNS guard.
{
  const env = await main(args("http://10.0.0.1/"));
  const b = body(env);
  ok("main SSRF IP literal: statusCode 400", env.statusCode === 400);
  ok("main SSRF IP literal: ok:false", b.ok === false);
  // toUrl returns null -> no target -> "Provide a valid public..." error (not non_public)
  ok("main SSRF IP literal: no outcome field", b.outcome === undefined);
}

// (e2) SSRF via redirect -> non_public (assertPublicHost / blocked:true path).
// We use a public-looking hostname but stub fetch to return a 301 to 10.x so
// fetchText's per-hop SSRF re-validation triggers blocked:true.
await withFetch(async (url) => {
  if (url.includes("10.0.0")) throw new Error("should have been blocked before fetch");
  return {
    ok: false,
    status: 301,
    headers: { get: (h) => h === "location" ? "http://10.0.0.2/" : null },
  };
}, async () => {
  const env = await main(args("https://example.com/"));
  const b = body(env);
  ok("main SSRF redirect: envelope statusCode 400", env.statusCode === 400);
  ok("main SSRF redirect: ok:false", b.ok === false);
  ok("main SSRF redirect: outcome non_public", b.outcome === "non_public");
});

// (f) Invalid / missing URL -> 400 error
{
  const env = await main(args(""));
  const b = body(env);
  ok("main no-url: statusCode 400", env.statusCode === 400);
  ok("main no-url: ok:false", b.ok === false);
}

// (g) OPTIONS preflight -> 204
{
  const env = await main({ __ow_method: "options", __ow_headers: {} });
  ok("main OPTIONS: 204", env.statusCode === 204);
}

console.log(`\nALL ${passed} INDEX.JS CHECKS PASSED — zero keys, zero real network.`);
}

run().catch((e) => {
  console.error("\nTEST FAILED:", e.message);
  process.exit(1);
});
