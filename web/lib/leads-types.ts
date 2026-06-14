/**
 * Lead CRM types + status metadata for the first-sale outreach pipeline.
 *
 * Mirrors the `leads_queue` table (migration 0017). Unlike dashboard-types.ts
 * (read-only pipeline shapes), these back a table the OWNER writes to through
 * the CRM. Pure types + consts only — no `server-only`, so client islands can
 * import the labels/tones too.
 *
 * Honest-broker invariants encoded here:
 *   - `hygieneScore` is HYGIENE (parse/crawl health), never an "AI visibility"
 *     or citation score, and is NULL (never 0) when a page couldn't be read.
 *   - status transitions past `drafted` are MANUAL human actions; nothing in
 *     this app sends a message or drives LinkedIn.
 */

export type LeadStatus =
  | "new"
  | "scanning"
  | "scanned"
  | "scan_failed"
  | "drafted"
  | "connect_sent"
  | "connected"
  | "contacted"
  | "replied"
  | "won"
  | "lost"
  | "skip";

export type LeadScanStatus =
  | "ok"
  | "blocked_by_waf"
  | "unreachable"
  | "non_public"
  | "timeout"
  | "error";

/** A single material finding the Tier-1 hygiene scan returned. */
export type LeadScanFinding = {
  detail: string;
  severity: number | null;
  title?: string | null;
};

export type Lead = {
  id: string;
  companyName: string;
  domain: string;
  contactName: string | null;
  contactTitle: string | null;
  linkedinUrl: string | null;
  competitor: string | null;
  icpSegment: string | null;
  source: string | null;

  // ── Apollo (licensed) reference data — stored for the operator, never auto-sent ──
  email: string | null;
  emailStatus: string | null;
  phone: string | null;
  headline: string | null;
  location: string | null;
  photoUrl: string | null;
  apolloContactId: string | null;
  apolloPersonId: string | null;

  status: LeadStatus;

  /** HYGIENE score (0–100), NULL when the page couldn't be read — never 0. */
  hygieneScore: number | null;
  scanStatus: LeadScanStatus | null;
  scanSummary: string | null;
  scanReport: Record<string, unknown> | null;
  scannedAt: string | null;

  /** ≤300-char connection-request opener (cold). Draft only — sent by hand. */
  connectNote: string | null;
  /** Full post-accept DM. Draft only — sent by hand. */
  dmDraft: string | null;

  draftedAt: string | null;
  connectSentAt: string | null;
  connectedAt: string | null;
  contactedAt: string | null;
  repliedAt: string | null;
  lastActivityAt: string | null;
  nextFollowupAt: string | null;

  /** 0 normal … 3 hot. */
  priority: number;
  tags: string[];
  notes: string | null;

  createdAt: string;
  updatedAt: string;
};

export type LeadStats = {
  total: number;
  byStatus: Record<LeadStatus, number>;
  /** new — ingested, awaiting a scan */
  needsScan: number;
  /** drafted — a connect note / DM is ready for a human to send */
  readyToSend: number;
  /** connect_sent + connected + contacted — outreach in flight */
  inFlight: number;
  replied: number;
  won: number;
  /** rows with next_followup_at on/before now that aren't closed (won/lost/skip) */
  followupsDue: number;
};

export type LeadSort = "recent" | "priority" | "score" | "company";

export type LeadListFilters = {
  status?: LeadStatus | "all";
  q?: string;
  sort?: LeadSort;
};

export type LeadView = "table" | "pipeline";

// ─── status metadata (single source of truth for labels / tone / order) ──────

export type LeadStatusTone =
  | "neutral"
  | "info"
  | "active"
  | "hot"
  | "warn"
  | "win"
  | "lose"
  | "muted";

export const LEAD_STATUS_META: Record<
  LeadStatus,
  { label: string; tone: LeadStatusTone; hint: string }
> = {
  new: { label: "New", tone: "neutral", hint: "Imported — not scanned yet." },
  scanning: { label: "Scanning", tone: "neutral", hint: "Scan in flight." },
  scanned: { label: "Scanned", tone: "info", hint: "Real hygiene scan stored." },
  scan_failed: {
    label: "Scan failed",
    tone: "warn",
    hint: "Couldn't read the page (WAF / timeout / non-public). Not scored 0 — a blind spot.",
  },
  drafted: {
    label: "Drafted",
    tone: "active",
    hint: "Connect note / DM ready. Review, then send by hand.",
  },
  connect_sent: {
    label: "Connect sent",
    tone: "active",
    hint: "You sent the connection request by hand.",
  },
  connected: {
    label: "Connected",
    tone: "active",
    hint: "They accepted. Send the full DM by hand.",
  },
  contacted: {
    label: "Contacted",
    tone: "active",
    hint: "You sent the full DM by hand.",
  },
  replied: { label: "Replied", tone: "hot", hint: "They replied — follow up." },
  won: { label: "Won", tone: "win", hint: "Closed — became a customer." },
  lost: { label: "Lost", tone: "lose", hint: "Not moving forward." },
  skip: { label: "Skip", tone: "muted", hint: "Parked / not a fit." },
};

/** Full lifecycle order, used for the status <select> and table grouping. */
export const LEAD_STATUS_ORDER: LeadStatus[] = [
  "new",
  "scanning",
  "scanned",
  "scan_failed",
  "drafted",
  "connect_sent",
  "connected",
  "contacted",
  "replied",
  "won",
  "lost",
  "skip",
];

/** Columns shown on the Kanban board (transient `scanning` + parked `skip`
 *  are reachable via the table filter / per-card move control, not as columns). */
export const PIPELINE_COLUMNS: LeadStatus[] = [
  "new",
  "scanned",
  "scan_failed",
  "drafted",
  "connect_sent",
  "connected",
  "contacted",
  "replied",
  "won",
  "lost",
];

/** Statuses that count as "closed" — excluded from follow-up-due tallies. */
export const CLOSED_STATUSES: LeadStatus[] = ["won", "lost", "skip"];

export const PRIORITY_META: Record<number, { label: string; short: string }> = {
  0: { label: "Normal", short: "—" },
  1: { label: "Watch", short: "•" },
  2: { label: "Warm", short: "••" },
  3: { label: "Hot", short: "•••" },
};

// ─── scan-report helpers (pure; client-safe) ─────────────────────────────────

const SCAN_STATUS_LABEL: Record<LeadScanStatus, string> = {
  ok: "Read OK",
  blocked_by_waf: "Blocked by WAF",
  unreachable: "Unreachable",
  non_public: "Not public",
  timeout: "Timed out",
  error: "Scan error",
};

export const scanStatusLabel = (s: LeadScanStatus | null): string =>
  s ? SCAN_STATUS_LABEL[s] ?? s : "Not scanned";

/**
 * Honest one-liner for the score cell. NEVER renders "0" for an unread page —
 * a missing score is a blind spot, not a failing grade.
 */
export const hygieneScoreLabel = (lead: Lead): string => {
  if (typeof lead.hygieneScore === "number") return `${lead.hygieneScore}/100`;
  if (lead.status === "new") return "—";
  return scanStatusLabel(lead.scanStatus); // honest blind spot, not a 0
};

/**
 * Pull the most material, human-readable findings the scan actually returned.
 * Tolerant of shape drift in the stored Tier-1 envelope; returns [] when absent.
 */
export const extractScanFindings = (
  report: Record<string, unknown> | null
): LeadScanFinding[] => {
  if (!report || typeof report !== "object") return [];
  // The stored envelope may be the full { ok, report: {...} } or just the report.
  const inner =
    (report.report as Record<string, unknown> | undefined) ?? report;
  const raw = inner?.findings;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((f): LeadScanFinding | null => {
      if (!f || typeof f !== "object") return null;
      const obj = f as Record<string, unknown>;
      const detail =
        typeof obj.detail === "string"
          ? obj.detail
          : typeof obj.message === "string"
            ? obj.message
            : null;
      if (!detail) return null;
      return {
        detail: detail.replace(/\s+/g, " ").trim(),
        severity: typeof obj.severity === "number" ? obj.severity : null,
        title: typeof obj.title === "string" ? obj.title : null,
      };
    })
    .filter((f): f is LeadScanFinding => f !== null)
    .sort((a, b) => (b.severity ?? 0) - (a.severity ?? 0));
};
