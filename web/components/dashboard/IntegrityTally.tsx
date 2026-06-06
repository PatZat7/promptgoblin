import styles from "./IntegrityTally.module.css";

type IntegrityTallyProps = {
  verified: number;
  unverifiable: number;
  /** Gaps the verify loop could NOT confirm — honesty signal, target 0 */
  fabricated: number;
};

/**
 * Three-bucket integrity count from verification_results.
 *
 * HONEST-BROKER: "fabricated" here means the verify loop flagged the gap
 * as unconfirmed / regressed — it is an HONESTY metric (target 0), not a
 * brag count. Label and tooltip must say so.
 */
export function IntegrityTally({ verified, unverifiable, fabricated }: IntegrityTallyProps) {
  const total = verified + unverifiable + fabricated;

  return (
    <div className={styles.wrap}>
      <dl className={styles.tally}>
        <div className={styles.bucket}>
          <dt
            className={styles.bucketLabel}
            title="Gaps the verify loop confirmed as real and fixable."
          >
            Verified
          </dt>
          <dd className={styles.verifiedCount}>{verified}</dd>
        </div>

        <div className={styles.bucket}>
          <dt
            className={styles.bucketLabel}
            title="Gaps that couldn't be live-confirmed (kind not live-verifiable — honest, not a failure)."
          >
            Unverifiable
          </dt>
          <dd className={styles.unverifiableCount}>{unverifiable}</dd>
        </div>

        <div className={styles.bucket}>
          <dt
            className={styles.bucketLabel}
            title="Gaps the verify loop could NOT confirm as real or that regressed. This is an honesty signal — target 0. A higher count means more of the pipeline's findings were unconfirmed."
          >
            Unconfirmed
            <span className={styles.hint}> (target: 0)</span>
          </dt>
          <dd
            className={fabricated > 0 ? styles.fabricatedCountBad : styles.fabricatedCountGood}
          >
            {fabricated}
          </dd>
        </div>
      </dl>

      {total === 0 && (
        <p className={styles.noResults}>No verification results for this run.</p>
      )}

      {fabricated > 0 && (
        <p className={styles.honestNote} role="note">
          {fabricated} finding{fabricated !== 1 ? "s were" : " was"} flagged by
          the verify loop as unconfirmed or regressed. This means the pipeline
          couldn&apos;t confirm those gaps were real — the &ldquo;fabricated&rdquo; label is
          an honesty signal, not a count of AI hallucinations.
        </p>
      )}
    </div>
  );
}
