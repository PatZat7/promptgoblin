/**
 * The self-healing, eval-gated engine — narrated as a looping "sample run".
 * Honest-broker copy: SEO + a11y proven on the gate (2026-06-02), schema
 * scaffolded; nothing auto-ships (engineer-gated).
 */

export type GateState = null | "eval" | "fail" | "pass";

export type EnginePhase = {
  stage: 0 | 1 | 2;
  gate: GateState;
  pk: string;
  pkFail: boolean;
  rd: string;
  tick: "ok" | "bad";
};

export const ENGINE_PHASES: EnginePhase[] = [
  { stage: 0, gate: null, pk: "fix packet · a11y", pkFail: false, rd: "scan → gap found: contrast on .cta (sample)", tick: "ok" },
  { stage: 1, gate: "eval", pk: "→ eval gate", pkFail: false, rd: "eval gate · running 201 tests + eval…", tick: "ok" },
  { stage: 1, gate: "fail", pk: "RED · regression", pkFail: true, rd: "eval: RED. patch broke 2 tests. bounce back.", tick: "bad" },
  { stage: 0, gate: null, pk: "self-heal · re-patch", pkFail: false, rd: "self-heal loop · retrieval re-tries the fix", tick: "ok" },
  { stage: 1, gate: "eval", pk: "→ eval gate", pkFail: false, rd: "eval gate · re-running…", tick: "ok" },
  { stage: 1, gate: "pass", pk: "PASS", pkFail: false, rd: "eval: PASS · 201 tests + eval green (2026-06-02)", tick: "ok" },
  { stage: 2, gate: "pass", pk: "→ engineer review", pkFail: false, rd: "halt · awaiting engineer approval. nothing auto-ships.", tick: "ok" },
  { stage: 2, gate: "pass", pk: "approved ✓", pkFail: false, rd: "engineer approved → reviewed PR opened on your repo", tick: "ok" },
  { stage: 2, gate: "pass", pk: "re-scan → Δ", pkFail: false, rd: "re-run on cadence · measured before/after delta (sample)", tick: "ok" },
];

export type EngineStage = { num: string; name: string; desc: string };

export const ENGINE_STAGES: EngineStage[] = [
  { num: "01 · diagnose", name: "Find the gap", desc: "RAG pipeline samples engines + audits SEO / a11y, surfaces a scoped fix." },
  { num: "02 · eval gate", name: "Prove it passes", desc: "CI/CD eval gate runs the suite. Red on regression → the fix bounces back to self-heal." },
  { num: "03 · engineer", name: "An engineer approves", desc: "Every change halts here. A software engineer approves → reviewed PR. Nothing auto-deploys." },
];
