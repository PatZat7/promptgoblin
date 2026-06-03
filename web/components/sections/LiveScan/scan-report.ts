import type { ScanReport } from "@/lib/scan-api";
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
  if (key === "llms") return report.llmsTxt?.present ? "ok" : "warn";
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
