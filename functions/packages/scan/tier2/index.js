"use strict";

/**
 * Tier-2 rate-limited LLM citation teaser — DO Functions web action.
 *
 * Two modes:
 *   POST { domain }              -> auto path (no competitor needed)
 *   POST { email, domain, competitor } -> comparative path (existing)
 *
 * Key via env PERPLEXITY_API_KEY — never hardcoded, never echoed. Absent key
 * degrades to an honest { configured: false } response (no fabricated citations).
 */

const { reply, normalizeDomain, isEmail } = require("./lib/util");
const { runTeaser, runTeaserAuto } = require("./lib/perplexity");
const { tier2Summary } = require("./lib/voice");
const ratelimit = require("./lib/ratelimit");

const MAX_QUERIES = 2;

async function main(args) {
  const origin = args.__ow_headers?.origin;
  const method = (args.__ow_method || "post").toLowerCase();
  if (method === "options") return reply(204, "", origin);

  const domain = normalizeDomain(args.domain);
  if (!domain)
    return reply(400, { ok: false, error: "Provide your `domain`." }, origin);

  // Detect which path: auto (domain-only) vs comparative (email + competitor).
  const competitor = normalizeDomain(args.competitor);
  const isAutoMode = !competitor;

  if (!isAutoMode) {
    // Comparative path — requires email.
    const email = String(args.email || "").trim().toLowerCase();
    if (!isEmail(email))
      return reply(400, { ok: false, error: "A valid email is required (email-gated)." }, origin);
    if (domain === competitor)
      return reply(400, { ok: false, error: "Domain and competitor must differ." }, origin);

    // --- rate limit by IP + email ---
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

    try {
      const teaser = await runTeaser({ apiKey, domain, competitor, maxQueries: MAX_QUERIES });
      const summary = tier2Summary({ domain, competitor, results: teaser.results, configured: true });
      return reply(200, { ok: true, tier: 2, configured: true, teaser, summary }, origin);
    } catch (e) {
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

  // --- Auto path: domain-only, no competitor ---
  // Rate-limit by IP + domain to cap cost.
  const ip =
    args.__ow_headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
    args.__ow_headers?.["x-real-ip"] ||
    "unknown";
  const rl = ratelimit.check(`${ip}|auto|${domain}`);
  if (!rl.allowed)
    return reply(
      429,
      {
        ok: false,
        error: "Free teaser limit reached for this domain. The full audit (Goblin Scout) lifts the cap.",
        retryAfterHours: Math.ceil(rl.retryAfterMs / 3_600_000),
      },
      origin
    );

  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    return reply(
      200,
      {
        ok: true,
        tier: 2,
        configured: false,
        teaserMode: true,
        teaser: null,
        note: "PERPLEXITY_API_KEY not set. Set it in the function env to enable the live citation teaser.",
      },
      origin
    );
  }

  try {
    const teaser = await runTeaserAuto({ apiKey, domain, maxQueries: MAX_QUERIES });
    return reply(
      200,
      {
        ok: true,
        tier: 2,
        configured: true,
        teaserMode: true,
        teaser,
      },
      origin
    );
  } catch (e) {
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
