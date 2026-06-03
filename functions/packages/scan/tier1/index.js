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

const { reply, toUrl } = require("./lib/util");
const { buildHygieneReport } = require("./lib/hygiene");
const { tier1Summary } = require("./lib/voice");

const FETCH_TIMEOUT_MS = 12000;
const MAX_BYTES = 3 * 1024 * 1024; // 3 MB cap on fetched HTML

async function fetchText(url, { asBytes = false } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const resp = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "PromptGoblinScanBot/1.0 (+https://promptgoblin.io)" },
    });
    if (!resp.ok) return { ok: false, status: resp.status, text: null, bytes: 0 };
    const text = await resp.text();
    const bytes = Buffer.byteLength(text, "utf8");
    return {
      ok: true,
      status: resp.status,
      text: asBytes ? text.slice(0, MAX_BYTES) : text,
      bytes,
    };
  } catch (e) {
    return { ok: false, status: 0, text: null, bytes: 0, error: e.name };
  } finally {
    clearTimeout(timer);
  }
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
