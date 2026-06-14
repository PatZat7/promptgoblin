import {
  extractScanFindings,
  scanStatusLabel,
  type Lead,
} from "@/lib/leads-types";
import styles from "./crm.module.css";

/**
 * Honest rendering of the REAL Tier-1 hygiene scan.
 *  - A score is shown as "<n>/100 hygiene" — never relabeled "AI visibility".
 *  - A page we couldn't read shows the honest blind-spot reason, NEVER a 0.
 *  - Findings are pulled straight from the stored envelope; nothing invented.
 */
export function ScanReport({ lead }: { lead: Lead }) {
  const findings = extractScanFindings(lead.scanReport);
  const hasScore = typeof lead.hygieneScore === "number";

  if (lead.status === "new") {
    return (
      <p className={styles.muted} style={{ fontSize: "0.8125rem" }}>
        Not scanned yet. Run <span className={styles.code}>node scripts/process-leads.mjs</span>{" "}
        to fetch a real hygiene scan.
      </p>
    );
  }

  return (
    <div className={styles.section}>
      {hasScore ? (
        <div className={styles.scoreHeadline}>
          <span className={styles.scoreBig}>{lead.hygieneScore}</span>
          <span className={styles.scoreUnit}>/100 hygiene</span>
        </div>
      ) : (
        <div className={styles.blindSpot}>
          <strong>Blind spot — {scanStatusLabel(lead.scanStatus)}.</strong> We couldn&apos;t
          read this page, so it has <em>no</em> hygiene score (never a 0).{" "}
          {lead.scanSummary ? lead.scanSummary : "Try a rescan later."}
        </div>
      )}

      {lead.scanSummary && hasScore && (
        <p className={styles.muted} style={{ fontSize: "0.8125rem", margin: 0 }}>
          {lead.scanSummary}
        </p>
      )}

      {findings.length > 0 && (
        <ul className={styles.findings}>
          {findings.map((f, i) => (
            <li key={i} className={styles.finding}>
              {f.title ? <strong>{f.title}: </strong> : null}
              {f.detail}
            </li>
          ))}
        </ul>
      )}

      <p className={styles.honest}>
        Hygiene is parse/crawl health — whether ChatGPT/Perplexity can cleanly read
        the site. It&apos;s table stakes, not a citation guarantee. The proven
        citation levers (brand mentions + Bing rank) are measured separately.
      </p>
    </div>
  );
}
