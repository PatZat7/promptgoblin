import type { FixRow } from "@/lib/dashboard-types";
import { SampleBadge } from "./SampleBadge";
import { CopySnippetButton } from "./CopySnippetButton";
import styles from "./FixCard.module.css";

type FixCardProps = {
  fix: FixRow;
};

const KIND_LABELS: Record<string, string> = {
  citation: "citation",
  schema: "schema (hygiene)",
  content: "content",
  seo: "SEO (hygiene)",
  a11y: "accessibility",
  community: "community",
};

const IMPACT_LABELS: Record<number, string> = {
  1: "very low",
  2: "low",
  3: "medium",
  4: "high",
  5: "very high",
};

/**
 * Individual fix card with lock gating.
 *
 * Lock logic (authoritative):
 *   locked = snippet === null
 *   The snippet was stripped SERVER-SIDE in listFixes() for locked fixes.
 *   This component never receives a snippet for locked fixes — there is no
 *   snippet to hide via CSS. The lock state is: payload absence, not styling.
 *
 * Honest-broker: schema/seo kinds carry "hygiene" framing — never "citation
 * guarantee". The rationale copy is passed through as-is from the pipeline.
 */
export function FixCard({ fix }: FixCardProps) {
  const locked = fix.snippet === null;
  const kindLabel = KIND_LABELS[fix.kind] ?? fix.kind;

  return (
    <article
      className={`${styles.card} ${locked ? styles.locked : styles.unlocked}`}
      aria-label={`Fix: ${fix.title}${locked ? " (pending human review)" : ""}`}
    >
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>{fix.title}</h3>
          {fix.isSample && <SampleBadge label="illustrative data" />}
        </div>

        <div className={styles.meta}>
          <span className={styles.kind}>{kindLabel}</span>
          {fix.engineLane && fix.engineLane !== "both" && (
            <span className={styles.lane}>
              {fix.engineLane === "chatgpt" ? "ChatGPT" : "Google AIO"}
            </span>
          )}
          <span className={styles.fixId}>{fix.fixId}</span>
        </div>
      </header>

      <div className={styles.scores}>
        <div className={styles.scoreItem}>
          <span className={styles.scoreLabel}>Impact</span>
          <span className={styles.scoreVal}>{IMPACT_LABELS[fix.impact] ?? fix.impact}</span>
        </div>
        <div className={styles.scoreItem}>
          <span className={styles.scoreLabel}>Effort</span>
          <span className={styles.scoreVal}>{IMPACT_LABELS[fix.effort] ?? fix.effort}</span>
        </div>
        <div className={styles.scoreItem}>
          <span className={styles.scoreLabel}>Score</span>
          <span className={styles.scoreValHighlight}>{fix.score.toFixed(1)}</span>
        </div>
      </div>

      <p className={styles.rationale}>{fix.rationale}</p>

      {locked ? (
        <div className={styles.lockState} role="status" aria-live="polite">
          <span className={styles.lockIcon} aria-hidden="true">🔒</span>
          <div>
            <p className={styles.lockTitle}>Pending human review</p>
            <p className={styles.lockHint}>
              A human reviews every fix before its implementation snippet is
              released. Once approved, the snippet and copy button will appear
              here.
            </p>
          </div>
        </div>
      ) : (
        <div className={styles.snippetBlock}>
          <div className={styles.snippetHeader}>
            <span className={styles.snippetLabel}>Implementation snippet</span>
            <CopySnippetButton snippet={fix.snippet!} />
          </div>
          <pre className={styles.snippetCode}>
            <code>{fix.snippet}</code>
          </pre>
        </div>
      )}
    </article>
  );
}
