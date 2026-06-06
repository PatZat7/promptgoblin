"use strict";

const { toUrl, assertPublicHost } = require("./util");

const TRACKING = new Set(["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid", "ref", "mc_cid", "mc_eid"]);
const BOT_STATUSES = new Set([401, 403, 406, 409, 429, 503]);

function cleanUrl(input) {
  const u = toUrl(input);
  if (!u) return "";
  u.hash = "";
  for (const key of [...u.searchParams.keys()]) {
    if (TRACKING.has(key.toLowerCase())) u.searchParams.delete(key);
  }
  u.hostname = u.hostname.toLowerCase();
  return u.toString();
}

function normalizeCanonical(url, { finalUrl = "", html = "" } = {}) {
  const base = cleanUrl(finalUrl || url) || cleanUrl(url) || String(url || "");
  const match =
    String(html || "").match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) ||
    String(html || "").match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i);
  if (!match) return base;
  try {
    return cleanUrl(new URL(match[1], base).toString()) || base;
  } catch {
    return base;
  }
}

function norm(text) {
  return String(text || "").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").toLowerCase().replace(/\s+/g, " ").trim();
}

function snippetMatch(html, { terms = [], quotedSnippet = "" } = {}) {
  const text = norm(html);
  const quote = norm(quotedSnippet);
  if (quote && text.includes(quote)) return true;
  const cleanTerms = terms.map(norm).filter(Boolean).slice(0, 3);
  if (cleanTerms.length < 2) return false;
  return cleanTerms.filter((t) => text.includes(t)).length >= 2;
}

function readable(html) {
  return norm(html).split(/\s+/).filter(Boolean).length >= 12;
}

function looksParked(html) {
  const text = norm(html);
  return text.split(/\s+/).length < 40 || /domain for sale|parked domain|coming soon|not found|server error/.test(text);
}

function verdict(url, canonicalUrl, status, v, evidence) {
  return { url, canonicalUrl, status: status || 0, verdict: v, evidence };
}

async function verifyCitation(url, { terms = [], quotedSnippet = "", fetchImpl = fetch, timeoutMs = 10000, publicHostCheck = assertPublicHost } = {}) {
  const u = toUrl(url);
  if (!u) return verdict(url, "", 0, "unverifiable", "invalid or non-public URL");
  const canonicalStart = cleanUrl(u.toString());
  if (!(await publicHostCheck(u.hostname))) {
    return verdict(url, canonicalStart, 0, "unverifiable", "non-public or unresolvable host");
  }
  const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
  try {
    const head = await fetchImpl(canonicalStart, { method: "HEAD", redirect: "follow", signal: ctrl?.signal });
    if (head.status === 404 || head.status === 410) return verdict(url, canonicalStart, head.status, "fabricated", `source returned HTTP ${head.status}`);
    if (BOT_STATUSES.has(head.status)) return verdict(url, canonicalStart, head.status, "unverifiable", `blocked/unreachable (HTTP ${head.status})`);
    const resp = await fetchImpl(canonicalStart, { method: "GET", redirect: "follow", signal: ctrl?.signal });
    const html = await resp.text();
    const canonical = normalizeCanonical(url, { finalUrl: resp.url || canonicalStart, html });
    if (resp.status === 404 || resp.status === 410) return verdict(url, canonical, resp.status, "fabricated", `source returned HTTP ${resp.status}`);
    if (BOT_STATUSES.has(resp.status)) return verdict(url, canonical, resp.status, "unverifiable", `blocked/unreachable (HTTP ${resp.status})`);
    if (resp.status < 200 || resp.status >= 400) return verdict(url, canonical, resp.status, "unverifiable", `source returned HTTP ${resp.status}`);
    if (!readable(html)) return verdict(url, canonical, resp.status, "unverifiable", "resolves but body unreadable (WAF-obfuscated / JS-rendered)");
    if (snippetMatch(html, { terms, quotedSnippet })) return verdict(url, canonical, resp.status, "verified", "source resolves and supports the cited claim");
    if (looksParked(html)) return verdict(url, canonical, resp.status, "fabricated", "page exists but does not support the claim");
    return verdict(url, canonical, resp.status, "unverifiable", "resolves; claim not confirmed in body");
  } catch (err) {
    const msg = String(err && err.message || "").toLowerCase();
    if (msg.includes("abort") || msg.includes("timeout")) return verdict(url, canonicalStart, 0, "unverifiable", "timeout while checking source");
    if (msg.includes("nxdomain") || msg.includes("resolve")) return verdict(url, canonicalStart, 0, "fabricated", "domain does not resolve");
    return verdict(url, canonicalStart, 0, "unverifiable", "could not check source");
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function verifyCitations(urls, opts = {}) {
  const results = [];
  for (const url of [...new Set(urls || [])]) results.push(await verifyCitation(url, opts));
  return {
    results,
    summary: {
      n: results.length,
      verified: results.filter((r) => r.verdict === "verified").length,
      unverifiable: results.filter((r) => r.verdict === "unverifiable").length,
      fabricated: results.filter((r) => r.verdict === "fabricated").length,
    },
  };
}

module.exports = { normalizeCanonical, snippetMatch, verifyCitation, verifyCitations };
