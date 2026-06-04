/**
 * Client-side input validation for the public forms (free scan + summon).
 * First line of defence + UX; the DigitalOcean scan functions re-validate and
 * SSRF-guard every input server-side (never trust the client).
 */

/** Practical email check — RFC-pragmatic, rejects the obvious-garbage cases
 *  without over-rejecting real addresses. */
export const isValidEmail = (input: string): boolean => {
  const v = String(input ?? "").trim();
  if (v.length < 6 || v.length > 254) return false;
  if (/\s/.test(v) || v.includes("..")) return false;
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(v);
};

/** Plausible public domain/URL the scanner can fetch. Strips scheme/www/path,
 *  then checks DNS-label + TLD shape. Mirrors the server's normalizeDomain. */
export const isValidDomain = (input: string): boolean => {
  let v = String(input ?? "").trim().toLowerCase();
  if (!v) return false;
  v = v.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].split("?")[0];
  if (!v || v.length > 253) return false;
  // labels (1–63 chars, alnum + internal hyphens) + a 2+ alpha TLD
  return /^([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(v);
};
