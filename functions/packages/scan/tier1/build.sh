#!/bin/bash
# Sync the shared lib into this action so DO Functions bundles it.
# (The deployer only zips the action's own directory; it can't reach ../../lib.)
# We have zero third-party deps, so no npm install is needed — this build.sh
# intentionally replaces the automatic npm step.
set -e
SRC="$(cd "$(dirname "$0")/../../../lib" && pwd)"
DEST="$(cd "$(dirname "$0")" && pwd)/lib"
rm -rf "$DEST"
mkdir -p "$DEST"
cp "$SRC/util.js" "$SRC/hygiene.js" "$SRC/voice.js" "$DEST/"
