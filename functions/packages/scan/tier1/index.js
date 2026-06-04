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
const { buildHygieneReport } = require("./lib/hygiene");
const { tier1Summary } = require("./lib/voice");

const FETCH_TIMEOUT_MS = 12000;
const MAX_BYTES = 3 * 1024 * 1024; // 3 MB cap on fetched HTML
const MAX_REDIRECTS = 4;

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
        headers: { "User-Agent": "PromptGoblinScanBot/1.0 (+https://promptgoblin.io)" },
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
    if (!resp.ok) return { ok: false, status: resp.status, text: null, bytes: 0 };

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
  if (page.blocked)
    return reply(
      400,
      {
        ok: false,
        error:
          "That host (or a redirect from it) resolves to a non-public address. We only scan public sites.",
      },
      origin
    );
  if (!page.ok)
    return reply(
      502,
      {
        ok: false,
        error: `Couldn't fetch ${target.href}${
          page.status ? ` (HTTP ${page.status})` : ""
        }. Is it public and reachable?`,
      },
      origin
    );

  const robotsUrl = `${target.origin}/robots.txt`;
  const llmsUrl = `${target.origin}/llms.txt`;
  const [robots, llms] = await Promise.all([
    fetchText(robotsUrl),
    fetchText(llmsUrl),
  ]);

  const report = buildHygieneReport({
    url: target.href,
    html: page.text,
    contentBytes: page.bytes,
    robotsText: robots.ok ? robots.text : null,
    llmsText: llms.ok ? llms.text : null,
  });

  return reply(200, { ok: true, tier: 1, report, summary: tier1Summary(report) }, origin);
}

exports.main = main;
