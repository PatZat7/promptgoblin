"use strict";

/**
 * Tier-2 email-gated, rate-limited LLM citation teaser — DO Functions web action.
 *
 * POST { email, domain, competitor }
 * -> { ok, tier: 2, teaser, summary }
 *
 * ONE live engine (Perplexity, native citations), 1-2 capped high-intent
 * queries, gated behind a valid email and rate-limited per IP+email to control
 * cost. Key via env PERPLEXITY_API_KEY — never hardcoded, never echoed. If the
 * key is absent we degrade to an honest "configure key" message (mirrors the
 * pipeline's mock-fallback ethic) rather than fabricating citations.
 */

const { reply, normalizeDomain, isEmail } = require("./lib/util");
const { runTeaser } = require("./lib/perplexity");
const { tier2Summary } = require("./lib/voice");
const ratelimit = require("./lib/ratelimit");

const MAX_QUERIES = 2;

async function main(args) {
  const origin = args.__ow_headers?.origin;
  const method = (args.__ow_method || "post").toLowerCase();
  if (method === "options") return reply(204, "", origin);

  const email = String(args.email || "").trim().toLowerCase();
  const domain = normalizeDomain(args.domain);
  const competitor = normalizeDomain(args.competitor);

  // --- input validation ---
  if (!isEmail(email))
    return reply(400, { ok: false, error: "A valid email is required (email-gated)." }, origin);
  if (!domain)
    return reply(400, { ok: false, error: "Provide your `domain`." }, origin);
  if (!competitor)
    return reply(400, { ok: false, error: "Provide one `competitor` domain." }, origin);
  if (domain === competitor)
    return reply(400, { ok: false, error: "Domain and competitor must differ." }, origin);

  // --- rate limit by IP + email (in-memory; best-effort) ---
  const ip =
    args.__ow_headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
    args.__ow_headers?.["x-real-ip"] ||
    "unknown";
  const rl = ratelimit.check(`${ip}|${email}`);
  if (!rl.allowed)
    return reply(
      429,
      {
        ok: false,
        error: "Free teaser limit reached. The full audit (Goblin Scout) lifts the cap.",
        retryAfterHours: Math.ceil(rl.retryAfterMs / 3_600_000),
      },
      origin
    );

  // --- key check: degrade honestly if absent ---
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    const summary = tier2Summary({ domain, competitor, results: [], configured: false });
    return reply(
      200,
      {
        ok: true,
        tier: 2,
        configured: false,
        teaser: null,
        summary,
        note: "PERPLEXITY_API_KEY not set. Set it in the function env to enable the live citation teaser.",
      },
      origin
    );
  }

  // --- run the capped, single-engine teaser ---
  try {
    const teaser = await runTeaser({ apiKey, domain, competitor, maxQueries: MAX_QUERIES });
    const summary = tier2Summary({ domain, competitor, results: teaser.results, configured: true });
    return reply(200, { ok: true, tier: 2, configured: true, teaser, summary }, origin);
  } catch (e) {
    // Honest error; never include the key or raw headers.
    return reply(
      502,
      {
        ok: false,
        error: "The live citation engine errored. Your hygiene scan is still valid.",
        detail: String(e.message || e).slice(0, 200),
      },
      origin
    );
  }
}

exports.main = main;
