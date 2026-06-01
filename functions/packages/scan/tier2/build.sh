#!/bin/bash
# Sync the shared lib into this action so DO Functions bundles it.
# (The deployer only zips the action's own directory; it can't reach ../../lib.)
# Zero third-party deps -> no npm install; this build.sh replaces the npm step.
set -e
SRC="$(cd "$(dirname "$0")/../../../lib" && pwd)"
DEST="$(cd "$(dirname "$0")" && pwd)/lib"
rm -rf "$DEST"
mkdir -p "$DEST"
cp "$SRC/util.js" "$SRC/perplexity.js" "$SRC/voice.js" "$SRC/ratelimit.js" "$DEST/"
