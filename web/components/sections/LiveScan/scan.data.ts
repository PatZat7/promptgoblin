/**
 * Live Tier-1 hygiene scan data. Honest-broker: Tier-1 never queries answer
 * engines, so the narrated phases only resolve to MEASURED hygiene values — no
 * fabricated citation counts. The idle loop is a clearly-labelled SAMPLE.
 */

export type ScanPhase = { key: "fetch" | "robots" | "llms" | "schema" | "score"; label: string };

export const SCAN_PHASES: ScanPhase[] = [
  { key: "fetch", label: "fetch surface" },
  { key: "robots", label: "read robots.txt" },
  { key: "llms", label: "read llms.txt" },
  { key: "schema", label: "parse JSON-LD" },
  { key: "score", label: "score hygiene" },
];

export type ScanLineKind = "cmd" | "info" | "kv" | "phase" | "warn" | "err" | "issue" | "ok" | "sample" | "sep";

export type ScanLine = {
  id: number;
  t: ScanLineKind;
  text?: string;
  k?: string;
  v?: string;
  tone?: string;
  sev?: "HIGH" | "MED" | "LOW";
};

export type ScanLineInput = Omit<ScanLine, "id">;

export type ScanStep = {
  key: string;
  label: string;
  status: "pending" | "active" | "done";
  value: string | null;
  tone: string;
};

// Illustrative only — no real domain queried, no fabricated engine/citation stats.
export const SAMPLE_LINES: ScanLineInput[] = [
  { t: "cmd", text: "goblin scan --surface hygiene --sample" },
  { t: "info", text: "illustrative sample · no domain queried" },
  { t: "phase", k: "fetch surface", v: "71 KB", tone: "ok" },
  { t: "phase", k: "read robots.txt", v: "welcomes AI crawlers", tone: "ok" },
  { t: "phase", k: "read llms.txt", v: "not found", tone: "warn" },
  { t: "phase", k: "parse JSON-LD", v: "2 of 5 entity types", tone: "warn" },
  { t: "phase", k: "score hygiene", v: "64 / 100", tone: "warn" },
  { t: "sep" },
  { t: "issue", sev: "HIGH", text: "missing FAQPage + Organization JSON-LD" },
  { t: "issue", sev: "MED", text: "no llms.txt (hygiene, not a citation lever)" },
  { t: "issue", sev: "LOW", text: "2 <h1> tags: pick one" },
  { t: "sep" },
  { t: "ok", text: "goblin.recommend → structured data + crawl welcome mat" },
  { t: "sample", text: "↑ illustrative sample · not your site · enter your domain above for a real scan" },
];
