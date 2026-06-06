import type { RunSummary } from "@/lib/dashboard-types";
import { ScoreDelta } from "./ScoreDelta";
import { SampleBadge } from "./SampleBadge";
import styles from "./RunHistoryTable.module.css";

type RunHistoryTableProps = {
  runs: RunSummary[];
};

/**
 * Table of run history rows, newest first.
 * Each row: date · mode badge · visibility share · ScoreDelta · confidence pill.
 * Empty state: CTA, never fabricated rows.
 */
export function RunHistoryTable({ runs }: RunHistoryTableProps) {
  if (runs.length === 0) {
    return (
      <div className={styles.empty} role="status">
        <p>No scan runs yet for this domain.</p>
        <p className={styles.emptyCta}>
          Once your first run is approved, it will appear here with your measured
          visibility share.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col" className={styles.th}>Date</th>
            <th scope="col" className={styles.th}>Domain</th>
            <th scope="col" className={styles.th}>Mode</th>
            <th scope="col" className={styles.th}>
              Visibility share
              <span className={styles.colHint}> (measured citations)</span>
            </th>
            <th scope="col" className={styles.th}>Delta vs prior</th>
            <th scope="col" className={styles.th}>Confidence</th>
            <th scope="col" className={styles.th}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.runId} className={styles.row}>
              <td className={styles.td}>
                <time dateTime={run.generatedAt}>
                  {new Date(run.generatedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </time>
              </td>
              <td className={styles.td}>
                <span className={styles.domain}>{run.domain}</span>
                {run.isSample && (
                  <SampleBadge label="illustrative data" />
                )}
              </td>
              <td className={styles.td}>
                <span
                  className={
                    run.mode === "live"
                      ? styles.modeLive
                      : run.mode === "sample"
                        ? styles.modeSample
                        : styles.modeMock
                  }
                >
                  {run.mode}
                </span>
              </td>
              <td className={styles.td}>
                {run.blindSpot ? (
                  <span
                    className={styles.blindSpot}
                    title={run.blindSpot.detail}
                  >
                    blind spot — {run.blindSpot.reason}
                  </span>
                ) : run.clientShare !== null ? (
                  <span className={styles.share}>
                    {(run.clientShare * 100).toFixed(1)}%
                  </span>
                ) : (
                  <span className={styles.na}>—</span>
                )}
              </td>
              <td className={styles.td}>
                <ScoreDelta
                  current={run.blindSpot ? null : run.clientShare}
                  previous={run.prevClientShare}
                />
              </td>
              <td className={styles.td}>
                {run.lowConfidence ? (
                  <span className={styles.lowConf}>low-confidence</span>
                ) : (
                  <span className={styles.conf}>{run.confidence}</span>
                )}
              </td>
              <td className={styles.td}>
                <a href={`/runs/${run.runId}`} className={styles.detailLink}>
                  View
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
