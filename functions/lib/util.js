"use strict";

/**
 * Shared helpers for the Prompt Goblin tiered scan functions.
 *
 * These are runtime-agnostic (no DO-specific imports) so they're trivially
 * unit-testable with `node test/*.test.js` and zero keys.
 */

const ALLOWED_ORIGIN = "https://promptgoblin.zatgeist.com";

/**
 * CORS headers. We allow the live site origin plus localhost for dev. DO
 * Functions web actions can't read the request Origin header reliably across
 * runtimes, so we echo a single trusted origin and let the browser enforce it.
 */
function corsHeaders(origin) {
  const allow =
    origin && /^https?:\/\/localhost(?::\d+)?$/.test(origin)
      ? origin
      : ALLOWED_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

/** Standard DO Functions web-action response shape. */
function reply(statusCode, body, origin) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    body: typeof body === "string" ? body : JSON.stringify(body),
  };
}

/** Lower-cased netloc without a leading www. Mirrors pipeline normalize_domain. */
function normalizeDomain(input) {
  let s = String(input || "").trim().toLowerCase();
  if (!s) return "";
  if (!s.includes("://")) s = "https://" + s;
  let host;
  try {
    host = new URL(s).hostname;
  } catch {
    return "";
  }
  return host.startsWith("www.") ? host.slice(4) : host;
}

/** Coerce arbitrary user input to a fetchable https URL, or null if invalid. */
function toUrl(input) {
  let s = String(input || "").trim();
  if (!s) return null;
  if (!s.includes("://")) s = "https://" + s;
  let u;
  try {
    u = new URL(s);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  // Block obvious SSRF targets: localhost, RFC1918, link-local, .internal.
  const h = u.hostname.toLowerCase();
  if (
    h === "localhost" ||
    h === "0.0.0.0" ||
    h.endsWith(".internal") ||
    h.endsWith(".local") ||
    /^127\./.test(h) ||
    /^10\./.test(h) ||
    /^192\.168\./.test(h) ||
    /^169\.254\./.test(h) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(h)
  ) {
    return null;
  }
  return u;
}

function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || "").trim());
}

module.exports = {
  ALLOWED_ORIGIN,
  corsHeaders,
  reply,
  normalizeDomain,
  toUrl,
  isEmail,
};
