/**
 * Dashboard TypeScript types — mirror pipeline field names exactly.
 * These are READ-ONLY shapes from the DB; the dashboard never writes
 * human_reviewed / approved / snippet (the pipeline writes them).
 */

export type Engine = "chatgpt" | "claude" | "gemini" | "perplexity";
export type RunMode = "live" | "mock" | "sample";
export type VerifyStatus =
  | "verified"
  | "failed"
  | "unverifiable"
  | "skipped"
  | "regressed";

export type RunSummary = {
  runId: string;
  clientId: string;
  domain: string;
  generatedAt: string;
  mode: RunMode;
  /** visibility[clientDomain] — null for WAF/SPA/unreadable runs (never forced to 0) */
  clientShare: number | null;
  /** prior run's clientShare — null means "no prior baseline" */
  prevClientShare: number | null;
  confidence: string;
  lowConfidence: boolean;
  /** true when this row is sample/mock data, never an earned result */
  isSample: boolean;
  blindSpot: null | { reason: "waf" | "unreadable" | "spa"; detail: string };
};

/** null = engine was not queried in this run; renders "not measured", never "0%" */
export type PlatformBreakdown = Partial<Record<Engine, number | null>>;

/**
 * Three-bucket integrity count from verification_results.
 * "fabricated" means the verify loop could NOT confirm the gap was real or
 * the fix held — target 0; it is an honesty signal, not a brag count.
 */
export type IntegrityTally = {
  verified: number;
  unverifiable: number;
  /** gaps flagged as failed/regressed — the honesty signal; target 0 */
  fabricated: number;
};

export type FixRow = {
  fixId: string;
  title: string;
  kind: string;
  impact: number;
  effort: number;
  score: number;
  rationale: string;
  approved: boolean;
  humanReviewed: boolean;
  /**
   * null when locked (human_reviewed=false OR approved=false).
   * Stripped SERVER-SIDE before serialization — never sent to the browser
   * for locked fixes. FixCard derives its lock state from snippet === null.
   */
  snippet: string | null;
  engineLane?: "chatgpt" | "google_aio" | "both";
  isSample: boolean;
};

export type EvalBadgeStatus =
  | "all-verified"
  | "partly-unverified"
  | "low-confidence"
  | "not-run";

export type EvalBadge = {
  status: EvalBadgeStatus;
};

export type RunDetail = {
  summary: RunSummary;
  /** visibility jsonb — client domain first, then competitors */
  youVsCompetitor: { domain: string; share: number }[];
  /** visibility_by_engine jsonb; missing engines → null ("not measured") */
  byEngine: PlatformBreakdown;
  integrity: IntegrityTally;
  /** scan-proof storage paths — server resolves these to signed URLs before render */
  proofs: {
    label: string;
    storagePath: string;
    width: number;
    height: number;
  }[];
  evalBadge: EvalBadgeStatus;
  blindSpot: null | { reason: "waf" | "unreadable" | "spa"; detail: string };
};
