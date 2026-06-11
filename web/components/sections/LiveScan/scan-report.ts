import type { ScanReport, ScanResponse, ScanOutcome } from "@/lib/scan-api";
import type { ScanPhase } from "./scan.data";

export const scanHost = (url: string): string =>
  String(url || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0];

/** Resolve each phase to a MEASURED value pulled straight from the real report. */
export const phaseValues = (r: ScanReport | null): Record<ScanPhase["key"], string> => {
  const report = r || {};
  const cwv = report.coreWebVitalsProxies || {};
  const crawl = report.crawlability || {};
  const llms = report.llmsTxt || {};
  const schema = report.schema || {};
  const foundN = (schema.found || []).length;
  const total = foundN + (schema.missing || []).length;
  return {
    fetch: cwv.htmlKilobytes != null ? `${cwv.htmlKilobytes} KB` : "ok",
    robots: !crawl.present ? "not found" : crawl.welcomesAiBots ? "welcomes AI crawlers" : "blocks AI crawlers",
    llms: llms.present ? (llms.valid ? "found · on-spec" : "found · off-spec") : "not found",
    schema: `${foundN}${total ? ` of ${total}` : ""} entity types`,
    score: `${report.hygieneScore != null ? report.hygieneScore : "?"} / 100`,
  };
};

export const phaseTone = (r: ScanReport | null, key: ScanPhase["key"]): string => {
  const report = r || {};
  if (key === "robots") return report.crawlability?.welcomesAiBots ? "ok" : "warn";
  // llms.txt is not used by Google Search / AI Overviews (Illyes/Mueller, Jul
  // 2025) — never color its absence as a warning. The stepper strikes it through.
  if (key === "llms") return "ok";
  if (key === "schema") return (report.schema?.missing || []).length === 0 ? "ok" : "warn";
  if (key === "score") {
    const s = report.hygieneScore ?? 0;
    return s >= 80 ? "ok" : s >= 50 ? "warn" : "bad";
  }
  return "ok";
};

export type ScoreBand = { key: "ok" | "warn" | "bad"; label: string };

export const scoreBand = (s: number | undefined): ScoreBand => {
  if (s == null) return { key: "warn", label: "scan complete" };
  if (s >= 80) return { key: "ok", label: "healthy" };
  if (s >= 50) return { key: "warn", label: "fixable" };
  return { key: "bad", label: "cursed" };
};

// --- Honest failure copy -----------------------------------------------------
// When a scan can't produce a report we NEVER score the site 0 or imply its
// hygiene is bad — a WAF block / unreachable host / private address is a
// reachability or scope outcome, not a verdict. These strings are the
// integrity-reviewer-approved copy (goblin voice, no overclaim, no citation
// promise). `soft: true` => render as caution (amber), not a red failure.
// A success response simply never hits this path.

const BOT_PROTECTION_STATUSES = new Set([401, 403, 406, 409, 429, 503]);

/** Pull the upstream HTTP status: prefer the typed field, else parse the
 *  function's "(HTTP 403)" error string (works before the function ships the
 *  typed `status`/`outcome` fields). */
const upstreamStatus = (resp: ScanResponse | null): number | undefined => {
  if (typeof resp?.status === "number") return resp.status;
  const m = /\(HTTP (\d{3})\)/.exec(resp?.error || "");
  return m ? Number(m[1]) : undefined;
};

/** Best-effort classification of WHY a scan failed, tolerant of an
 *  not-yet-updated function (infers from the error string + status). */
const resolveOutcome = (resp: ScanResponse | null): ScanOutcome | null => {
  if (!resp) return "unreachable"; // null = network/parse failure on our side
  const o = resp.outcome;
  if (o === "blocked_by_waf" || o === "unreachable" || o === "non_public" || o === "timeout") return o;
  if (resp.blocked) return "blocked_by_waf";
  if (/non-public address/i.test(resp.error || "")) return "non_public";
  const s = upstreamStatus(resp);
  if (s && BOT_PROTECTION_STATUSES.has(s)) return "blocked_by_waf";
  return null;
};

export type ScanFailure = {
  outcome: ScanOutcome | null;
  /** true => not a hygiene failure; render calm/amber, never red "cursed". */
  soft: boolean;
  /** terse single line for the terminal log */
  line: string;
  /** sentence(s) for the result card / error message */
  card: string;
};

const FAILURE_COPY: Record<ScanOutcome, { line: (status?: number) => string; card: string }> = {
  blocked_by_waf: {
    line: (status) =>
      `blocked at the gate — this site's WAF turned my crawler away (HTTP ${status ?? 403}). not a hygiene fail; big retail/enterprise sites do this. the full Scout audit reads them a different way.`,
    card:
      "Couldn't read this one from the outside — the site's CDN/WAF blocks automated crawlers, so my quick fetch got a 403. That's normal for big retail and enterprise sites and says nothing about your hygiene. No score here — the full Scout audit reads protected sites a different way.",
  },
  unreachable: {
    line: () =>
      "couldn't reach the host — no answer at all (DNS or the server's down). nothing to score yet. double-check the domain, or try again in a bit.",
    card:
      "Knocked and nobody home — the host didn't respond (DNS didn't resolve, or the server's down right now). That's a connection problem, not a hygiene problem, so there's no score to give. Check the domain spelling, confirm it's live, and try again.",
  },
  non_public: {
    line: () =>
      "that host points at a private/internal address — I only scan public sites, so I won't poke at it. nothing scored.",
    card:
      "This one resolves to a private or internal address (or redirects to one), and the free scan only touches public sites — so I left it alone. No score, no verdict: it's a scope rule, not a hygiene finding. Point me at a public URL and I'll dig in.",
  },
  timeout: {
    line: () =>
      "ran out of patience — the site took too long to answer. could be slow, could be throttling my crawler. not a hygiene fail; give it another go.",
    card:
      "Timed out before the page came back — either the site's being slow right now or it's throttling automated crawlers like mine. Either way it's a fetch hiccup, not a hygiene verdict, so there's no score. Give it another run in a minute; if it keeps stalling, the full Scout audit can take another run at it.",
  },
};

/** Resolve a failed scan response into honest, integrity-approved copy. Falls
 *  back to the function's raw error string for an unclassified failure. */
export const scanFailureCopy = (resp: ScanResponse | null): ScanFailure => {
  const outcome = resolveOutcome(resp);
  if (outcome) {
    return { outcome, soft: true, line: FAILURE_COPY[outcome].line(upstreamStatus(resp)), card: FAILURE_COPY[outcome].card };
  }
  const why = resp?.error || "host unreachable or not public";
  return { outcome: null, soft: false, line: `scan failed · ${why}`, card: why };
};
