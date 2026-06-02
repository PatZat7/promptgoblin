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

module.exports = { runTeaser, askOne, buildQueries, extractCitations, BASE_URL, MODEL };
