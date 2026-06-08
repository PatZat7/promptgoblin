import type { RunSummary } from "@/lib/dashboard-types";
import { ScoreDelta } from "./ScoreDelta";
import styles from "./CitationScorecard.module.css";

type CitationScorecardProps = {
  run: RunSummary;
};

/**
 * Headline visibility for the client domain.
 * - WAF/SPA/unreadable → renders the blind-spot flag, NEVER a 0 score.
 * - low_confidence → surfaced honestly; never hidden.
 * - Score is "measured share of answer-engine citations", not a quality grade.
 */
export function CitationScorecard({ run }: CitationScorecardProps) {
  if (run.blindSpot) {
    return (
      <div className={styles.card}>
        <div className={styles.blindSpotFlag} role="status">
          <span className={styles.blindSpotIcon} aria-hidden="true">⚠</span>
          <div>
            <p className={styles.blindSpotTitle}>
              Blind spot — {run.blindSpot.reason === "waf" ? "WAF block" : run.blindSpot.reason === "spa" ? "JS-rendered site" : "unreadable"}
            </p>
            <p className={styles.blindSpotDetail}>{run.blindSpot.detail}</p>
            <p className={styles.blindSpotNote}>
              We couldn&apos;t fully read this site server-side. Score cannot be
              measured — this is not a 0; it&apos;s a measurement gap.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Earned result = live AND not sample. Mock/sample must never read as earned.
  const illustrative = run.isSample || run.mode !== "live";
  const sharePct =
    run.clientShare !== null
      ? `${(run.clientShare * 100).toFixed(1)}%`
      : "—";

  return (
    <div className={styles.card}>
      <div className={styles.scoreRow}>
        <span
          className={illustrative ? styles.scoreSample : styles.score}
          aria-label={`${illustrative ? "Illustrative" : "Measured"} visibility share: ${sharePct}`}
        >
          {sharePct}
        </span>
        <div className={styles.meta}>
          <span className={styles.label}>
            {illustrative
              ? "Illustrative share — not a measured result"
              : "Measured share of answer-engine citations"}
          </span>
          <ScoreDelta current={run.clientShare} previous={run.prevClientShare} />
        </div>
      </div>

      {illustrative && (
        <p className={styles.sampleNote} role="note">
          {run.mode === "mock" ? "Mock run" : "Sample data"} — illustrative only,
          not an earned result. Real numbers appear once a live run is approved.
        </p>
      )}

      {run.lowConfidence && (
        <p className={styles.lowConfPill} role="note">
          Low-confidence result — sample size was too small to be reliable.
          Treat this share as indicative, not definitive.
        </p>
      )}
    </div>
  );
}
