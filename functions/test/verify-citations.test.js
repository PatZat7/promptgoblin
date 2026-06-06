"use strict";

const assert = require("assert");
const path = require("path");
const { normalizeCanonical, snippetMatch, verifyCitation, verifyCitations } = require(path.join(__dirname, "..", "lib", "verify-citations"));

let passed = 0;
function ok(name, cond) {
  assert.ok(cond, name);
  console.log(`  ok  ${name}`);
  passed++;
}

const publicHostCheck = async () => true;

function resp(status, html, url = "https://source.test/page") {
  return { status, url, text: async () => html };
}

async function run() {
  console.log("verify-citations");
  ok("strips tracking params", normalizeCanonical("https://Source.test/a?utm_source=x&keep=1#frag") === "https://source.test/a?keep=1");
  ok("snippet exact match", snippetMatch("<p>Exact claim here</p>", { quotedSnippet: "exact claim" }));
  ok("term quorum", snippetMatch("<p>Acme helps buyers compare CRM tools.</p>", { terms: ["Acme", "CRM tools", "missing"] }));

  const verifiedFetch = async (_url, opts) => opts.method === "HEAD"
    ? resp(200, "")
    : resp(200, "<html><body>Acme helps buyers compare CRM tools with honest source evidence and implementation details.</body></html>");
  const verified = await verifyCitation("https://source.test/page?utm_source=x", {
    terms: ["Acme", "CRM tools", "rival"],
    fetchImpl: verifiedFetch,
    publicHostCheck,
  });
  ok("verified result", verified.verdict === "verified");
  ok("verified canonical strips tracking", !verified.canonicalUrl.includes("utm_source"));

  const blocked = await verifyCitation("https://source.test/page", {
    fetchImpl: async () => resp(403, ""),
    publicHostCheck,
  });
  ok("403 is unverifiable", blocked.verdict === "unverifiable");

  const missing = await verifyCitation("https://source.test/page", {
    fetchImpl: async () => resp(404, ""),
    publicHostCheck,
  });
  ok("404 is fabricated", missing.verdict === "fabricated");

  const unreadable = await verifyCitation("https://source.test/page", {
    fetchImpl: async (_url, opts) => opts.method === "HEAD" ? resp(200, "") : resp(200, "<div id='root'></div>"),
    publicHostCheck,
  });
  ok("JS shell is unverifiable not fabricated", unreadable.verdict === "unverifiable");

  const mixed = await verifyCitations(["https://source.test/page", "https://source.test/page"], {
    fetchImpl: verifiedFetch,
    publicHostCheck,
    terms: ["Acme", "CRM tools"],
  });
  ok("verifyCitations dedupes urls", mixed.results.length === 1);
  ok("summary counts verified", mixed.summary.verified === 1);

  console.log(`verify-citations.test.js: ${passed} assertions passed`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
