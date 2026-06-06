#!/usr/bin/env node
"use strict";

/**
 * coordination-watch — per-turn diff of the multi-agent coordination state.
 *
 * Prints a compact "what changed since this agent's last turn" digest of:
 *   - COORDINATION.md "Live status board" rows
 *   - feedback/{claude,codex,hermes}/ notes (new or modified)
 * filtered to the OTHER agents, so each agent sees what its collaborators did
 * (Codex + Hermes for Claude, etc.) without an echo of its own changes.
 *
 * Deterministic · zero-dependency · no network · no LLM. Designed to be wired
 * as a per-turn hook (Claude `UserPromptSubmit`) or run at the start of each
 * task (Codex / Hermes). Per-agent state lives under .coordination-watch/
 * (gitignored), so each agent diffs against ITS own last run.
 *
 * Usage:  node scripts/coordination-watch.js --agent <claude|codex|hermes>
 * Output: digest on stdout when there are changes; nothing when quiet
 *         (so a per-turn hook adds no clutter on idle turns). Always exit 0.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const REPO = path.resolve(__dirname, "..");
const AGENTS = ["claude", "codex", "hermes"];

function flag(name, fallback) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const agent = String(flag("--agent", process.env.PG_AGENT || "claude")).toLowerCase();

const stateDir = path.join(REPO, ".coordination-watch");
const stateFile = path.join(stateDir, `${agent}.json`);

const sha = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 12);
const safeRead = (p) => {
  try { return fs.readFileSync(p, "utf8"); } catch { return null; }
};

// Extract the "Live status board" rows (| Codex | ... |), keyed by agent.
// The roster/preflight tables use **bold** names, so this matches only the
// plain status-board rows.
function statusBoardRows(md) {
  const rows = {};
  if (!md) return rows;
  for (const ln of md.split(/\r?\n/)) {
    const m = ln.match(/^\|\s*(Codex|Claude|Hermes)\s*\|(.+)\|\s*$/);
    if (m) rows[m[1].toLowerCase()] = m[2].trim().replace(/\s+/g, " ");
  }
  return rows;
}

// Hash every feedback note so we can detect new + modified files.
function feedbackFiles() {
  const out = {};
  for (const a of AGENTS) {
    const dir = path.join(REPO, "feedback", a);
    let names = [];
    try { names = fs.readdirSync(dir).filter((f) => f.endsWith(".md")); } catch { /* missing dir */ }
    for (const n of names) {
      const rel = `feedback/${a}/${n}`;
      out[rel] = sha(safeRead(path.join(REPO, "feedback", a, n)) || "");
    }
  }
  return out;
}

const current = {
  board: statusBoardRows(safeRead(path.join(REPO, "COORDINATION.md"))),
  feedback: feedbackFiles(),
};

let prev = null;
try { prev = JSON.parse(fs.readFileSync(stateFile, "utf8")); } catch { /* first run */ }

const lines = [];
if (prev) {
  for (const a of AGENTS) {
    if (a === agent) continue; // don't echo my own row
    const after = current.board[a];
    if (after && prev.board?.[a] !== after) lines.push(`  • [board:${a}] ${after}`);
  }
  const prevF = prev.feedback || {};
  for (const [file, hash] of Object.entries(current.feedback)) {
    if (file.startsWith(`feedback/${agent}/`)) continue; // skip my own notes
    if (!(file in prevF)) lines.push(`  • [new note] ${file}`);
    else if (prevF[file] !== hash) lines.push(`  • [updated] ${file}`);
  }
}

try {
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(stateFile, JSON.stringify(current, null, 2));
} catch { /* non-fatal: digest still prints */ }

if (lines.length) {
  process.stdout.write(
    `[coordination-watch · ${agent}] changes by Codex/Hermes since your last turn:\n` +
    lines.join("\n") + "\n"
  );
}
// No changes (or first-run baseline) → print nothing, keep the thread uncluttered.
process.exit(0);
