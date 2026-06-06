"use strict";

/**
 * Perplexity adapter — Tier-2 live citation teaser.
 *
 * Mirrors the pipeline's PerplexityClient shape (goblin/llm_clients.py):
 * Perplexity exposes an OpenAI-compatible Chat Completions API at
 * https://api.perplexity.ai and returns native `citations` (an array of URLs).
 *
 * We call the REST endpoint directly with global fetch (Node 18+/24 on DO
 * Functions) so the bundle has zero third-party dependencies. Key comes from
 * env PERPLEXITY_API_KEY; if absent we degrade to a clear "configure key"
 * signal (no fabricated citations — that's the honest-broker constraint).
 */

const { normalizeDomain } = require("./util");

const BASE_URL = "https://api.perplexity.ai/chat/completions";
const MODEL = "sonar"; // native-citation model, cheapest tier
const TIMEOUT_MS = 25_000;
const MAX_TOKENS = 512;

const SYSTEM_PROMPT =
  "Answer the user's question as an AI answer engine would, citing real sources. " +
  "Be concise.";

function hostOf(u) {
  try {
    return normalizeDomain(u);
  } catch {
    return "";
  }
}

function extractCitations(data) {
  const urls = [];
  const add = (item) => {
    let u = "";
    if (typeof item === "string") u = item.trim();
    else if (item && typeof item === "object") u = String(item.url || item.link || "").trim();
    if ((u.startsWith("http://") || u.startsWith("https://")) && !urls.includes(u)) {
      urls.push(u);
    }
  };
  const collect = (items) => {
    if (Array.isArray(items)) items.forEach(add);
  };
  collect(data?.citations);
  collect(data?.search_results);
  collect(data?.choices?.[0]?.message?.citations);
  return urls;
}

/**
 * Ask Perplexity one query, return { query, answer, sources, clientCited,
 * competitorCited }. `sources` are the native citation URLs.
 */
async function askOne({ apiKey, query, clientDomain, competitorDomain, fetchImpl }) {
  const doFetch = fetchImpl || globalThis.fetch;
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), TIMEOUT_MS) : null;
  let resp;
  try {
    resp = await doFetch(BASE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    signal: controller?.signal,
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: query },
      ],
    }),
    });
  } catch (e) {
    const err = new Error(e?.name === "AbortError" ? "Perplexity API timed out." : `Perplexity API request failed: ${e?.message || e}`);
    throw err;
  } finally {
    if (timer) clearTimeout(timer);
  }

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    // Never echo the key; surface a clean, honest error.
    const err = new Error(
      `Perplexity API returned ${resp.status}. ${text.slice(0, 200)}`
    );
    err.status = resp.status;
    throw err;
  }

  const data = await resp.json();
  const answer = data?.choices?.[0]?.message?.content || "";
  const sources = extractCitations(data);

  const hosts = sources.map(hostOf);
  return {
    query,
    answer: answer.slice(0, 600),
    sources,
    clientCited: hosts.includes(clientDomain),
    competitorCited: hosts.includes(competitorDomain),
  };
}

/**
 * Run the capped Tier-2 teaser: 1-2 high-intent queries, one engine.
 * Queries are derived from the brand + competitor so the gap is concrete.
 */
function buildQueries(domain, competitor, max = 2) {
  const brand = domain.split(".")[0];
  const comp = competitor.split(".")[0];
  const all = [
    `What are the best alternatives to ${comp}?`,
    `Is ${brand} a good ${comp} alternative?`,
  ];
  return all.slice(0, Math.max(1, Math.min(2, max)));
}

async function runTeaser({ apiKey, domain, competitor, maxQueries = 2, fetchImpl }) {
  const clientDomain = normalizeDomain(domain);
  const competitorDomain = normalizeDomain(competitor);
  const queries = buildQueries(clientDomain, competitorDomain, maxQueries);
  const results = [];
  for (const q of queries) {
    // Sequential to keep cost + concurrency predictable on a free teaser.
    results.push(
      await askOne({ apiKey, query: q, clientDomain, competitorDomain, fetchImpl })
    );
  }
  return { domain: clientDomain, competitor: competitorDomain, engine: "perplexity", results };
}

/**
 * Brand-anchored, non-comparative queries for the domain-only (auto) teaser.
 * These surface (a) whether the brand's own domain appears in Perplexity's
 * real citations and (b) which OTHER domains ARE cited — without fabricating a
 * competitor comparison. Cap: 1-2 queries.
 */
function buildQueriesAuto(domain, max = 2) {
  const brand = domain.split(".")[0];
  const all = [
    `What do reviewers say about ${brand}?`,
    `What are the best alternatives to ${brand}?`,
  ];
  return all.slice(0, Math.max(1, Math.min(2, max)));
}

/**
 * Domain-only teaser — no competitor. Runs capped queries and aggregates:
 *   clientCited: true if ANY query's citations include the client domain.
 *   citedDomains: up to 3 distinct other hosts that ARE cited (excluding client).
 */
async function runTeaserAuto({ apiKey, domain, maxQueries = 2, fetchImpl }) {
  const clientDomain = normalizeDomain(domain);
  const queries = buildQueriesAuto(clientDomain, maxQueries);
  const results = [];
  const seenOther = new Set();
  for (const q of queries) {
    const r = await askOne({ apiKey, query: q, clientDomain, competitorDomain: null, fetchImpl });
    results.push(r);
    // Collect other cited hosts, excluding the client's own domain.
    const hosts = r.sources.map(hostOf).filter((h) => h && h !== clientDomain);
    for (const h of hosts) {
      if (seenOther.size < 3) seenOther.add(h);
    }
  }
  const clientCited = results.some((r) => r.clientCited);
  return {
    domain: clientDomain,
    engine: "perplexity",
    queriesRun: results.length,
    clientCited,
    citedDomains: [...seenOther],
  };
}

module.exports = { runTeaser, runTeaserAuto, askOne, buildQueries, buildQueriesAuto, extractCitations, BASE_URL, MODEL };
