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
    origin && /^https?:\/\/(localhost|127\.0\.0\.1)(?::\d+)?$/.test(origin)
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

// --- SSRF guard helpers -----------------------------------------------------
// The scan fetches an arbitrary user-supplied URL, so the host must be a PUBLIC
// name — never an internal/loopback/link-local target reachable by IPv4, IPv6,
// or an encoded-IP literal (decimal/hex/octal). We reject all IP literals that
// are not clearly global-unicast, and bare-numeric hosts (encoded IPs).

function _ipv4PartsPrivate(parts) {
  const [a, b] = parts;
  return (
    a === 0 || a === 127 || a === 10 || a === 169 && b === 254 ||
    a === 192 && b === 168 || a === 172 && b >= 16 && b <= 31 ||
    a >= 224 // multicast/reserved
  );
}

function _isBlockedIpLiteral(host) {
  // IPv6 (URL hostnames keep brackets): block loopback, link-local, ULA, v4-mapped.
  if (host.startsWith("[") || host.includes(":")) {
    const h = host.replace(/^\[|\]$/g, "").toLowerCase();
    if (h === "::1" || h === "::") return true;            // loopback / unspecified
    if (h.startsWith("fe80") || h.startsWith("fc") || h.startsWith("fd")) return true; // link-local / ULA
    if (h.startsWith("::ffff:")) return true;              // IPv4-mapped — treat as IP literal, block
    return true; // any other raw IPv6 literal: not a public hostname we scan
  }
  // Dotted IPv4.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    const parts = host.split(".").map(Number);
    if (parts.some((n) => n > 255)) return true;
    return _ipv4PartsPrivate(parts);
  }
  // Encoded IPs: a bare integer (decimal), 0x.. (hex), or 0.. (octal) host is an
  // IP in disguise (e.g. 2130706433 == 127.0.0.1). Reject all bare-numeric hosts.
  if (/^(0x[0-9a-f]+|\d+)$/i.test(host)) return true;
  return false;
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
  const h = u.hostname.toLowerCase();
  // Named internal targets.
  if (
    h === "localhost" ||
    h.endsWith(".internal") ||
    h.endsWith(".local") ||
    h.endsWith(".localhost")
  ) {
    return null;
  }
  // IP-literal targets (IPv4, IPv6, encoded) — block anything not public.
  if (_isBlockedIpLiteral(h)) return null;
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
