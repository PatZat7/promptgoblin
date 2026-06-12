// Resubmit the site's indexable URLs to IndexNow via our own-host-validated
// /indexnow endpoint. The deployed sitemap is the single source of truth, so
// this never drifts from app/sitemap.ts.
//
// Usage:
//   node scripts/indexnow-submit.mjs            # submit against prod
//   node scripts/indexnow-submit.mjs --dry-run  # print payload, do not POST
//   node scripts/indexnow-submit.mjs --base http://localhost:3010
//   SITE_URL=https://promptgoblin.io node scripts/indexnow-submit.mjs
//
// Honest-broker: this is a deliberate, human-run step (or the now-fixed manual
// CI step) — not an auto-fire on every push. It submits the full sitemap, which
// is well within IndexNow limits; "changed URLs only" is a later optimization.
import { pathToFileURL } from "node:url";

const DEFAULT_BASE = (process.env.SITE_URL || "https://promptgoblin.io").replace(/\/$/, "");

/** Pull every <loc>…</loc> value out of a sitemap XML string. */
export const extractLocs = (xml) =>
  [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()).filter(Boolean);

/** Keep only deduped https URLs whose host matches `host` (www-insensitive) —
 *  mirrors the server endpoint's ownSiteUrls guard so we never submit foreign
 *  URLs and burn the key's reputation. */
export const sameHostHttps = (urls, host) => {
  const seen = new Set();
  for (const raw of urls) {
    try {
      const u = new URL(raw);
      if (u.protocol === "https:" && u.hostname.replace(/^www\./, "") === host) {
        seen.add(u.href);
      }
    } catch {
      /* skip invalid URL */
    }
  }
  return [...seen];
};

/** sitemap XML + base URL -> the urlList we will submit. */
export const buildSubmission = (xml, base) => {
  const host = new URL(base).hostname.replace(/^www\./, "");
  return sameHostHttps(extractLocs(xml), host);
};

const main = async () => {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const baseIdx = args.indexOf("--base");
  const base = (baseIdx >= 0 && args[baseIdx + 1] ? args[baseIdx + 1] : DEFAULT_BASE).replace(/\/$/, "");

  const res = await fetch(`${base}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap fetch failed: ${res.status} ${res.statusText}`);
  const urlList = buildSubmission(await res.text(), base);
  if (!urlList.length) throw new Error("no same-host https URLs found in sitemap");

  console.log(`${dryRun ? "[dry-run] would submit" : "submitting"} ${urlList.length} URL(s) to ${base}/indexnow`);
  for (const u of urlList) console.log(`  ${u}`);
  if (dryRun) return;

  const post = await fetch(`${base}/indexnow`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urlList }),
  });
  const text = await post.text();
  console.log(`IndexNow response: ${post.status} ${text}`);
  if (!post.ok) process.exitCode = 1;
};

// Run only when invoked directly (node scripts/indexnow-submit.mjs), not when
// imported by tests. pathToFileURL keeps this correct on Windows + POSIX.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  });
}
