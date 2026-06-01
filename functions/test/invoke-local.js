"use strict";

/**
 * Invoke a handler locally exactly as DO Functions would (args object in,
 * { statusCode, headers, body } out). Useful for eyeballing real output.
 *
 *   node test/invoke-local.js tier1 https://promptgoblin.zatgeist.com   # real fetch
 *   node test/invoke-local.js tier2                                     # no-key path
 *
 * Tier-2 only calls Perplexity if PERPLEXITY_API_KEY is set in the env;
 * otherwise it exercises the honest "configure key" degradation path.
 */

const path = require("path");

async function main() {
  const which = process.argv[2] || "tier1";
  const arg = process.argv[3];

  const handler = require(path.join(
    __dirname,
    "..",
    "packages",
    "scan",
    which,
    "index.js"
  ));

  const args =
    which === "tier1"
      ? { url: arg || "https://promptgoblin.zatgeist.com", __ow_method: "post", __ow_headers: {} }
      : {
          email: "demo@example.com",
          domain: arg || "promptgoblin.zatgeist.com",
          competitor: "athenahq.ai",
          __ow_method: "post",
          __ow_headers: { "x-forwarded-for": "203.0.113.7" },
        };

  const res = await handler.main(args);
  console.log("statusCode:", res.statusCode);
  console.log(JSON.stringify(JSON.parse(res.body), null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
