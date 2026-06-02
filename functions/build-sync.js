#!/usr/bin/env node
"use strict";

/**
 * Cross-platform port of packages/scan/<action>/build.sh.
 *
 * Copies the shared ./lib into each action's ./lib so DO Functions bundles it
 * (the deployer only zips an action's own directory; it can't reach ../../lib).
 * Zero third-party deps -> no npm install.
 *
 * Why this exists: the per-action build.sh scripts are bash-only and don't run
 * on a stock Windows shell. DigitalOcean's remote deploy still runs each
 * action's build.sh in its Linux build container, so build.sh stays the source
 * of truth for deploy; THIS script is the local-dev / Windows / `npm test`
 * equivalent. Keep the file lists below identical to the two build.sh files.
 */

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const SRC = path.join(ROOT, "lib");

// Must mirror packages/scan/tier1/build.sh and packages/scan/tier2/build.sh.
const ACTIONS = {
  "packages/scan/tier1/lib": ["util.js", "hygiene.js", "voice.js"],
  "packages/scan/tier2/lib": ["util.js", "perplexity.js", "voice.js", "ratelimit.js"],
};

for (const [destRel, files] of Object.entries(ACTIONS)) {
  const dest = path.join(ROOT, destRel);
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  for (const f of files) {
    fs.copyFileSync(path.join(SRC, f), path.join(dest, f));
  }
  console.log(`synced ${files.length} files -> ${destRel}`);
}
console.log("sync complete");
