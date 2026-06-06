import styles from "./ScoreDelta.module.css";

type ScoreDeltaProps = {
  /** Current visibility share (0..1), or null for WAF/unreadable */
  current: number | null;
  /** Previous run's visibility share (0..1), or null = no prior baseline */
  previous: number | null;
};

/**
 * Renders the visibility delta vs the prior run.
 * - previous == null → "No prior baseline" (never invents a delta)
 * - current == null → blind-spot run; shows flag, not 0
 * - Δ = current − previous; arrows and colour for + / − / 0
 *
 * Honest-broker: never invents a baseline, never shows a 0 for unreadable.
 */
export function ScoreDelta({ current, previous }: ScoreDeltaProps) {
  if (previous === null) {
    return (
      <span className={styles.noBaseline} aria-label="No prior baseline">
        — no prior baseline
      </span>
    );
  }

  if (current === null) {
    return (
      <span className={styles.blindSpot} aria-label="Site unreadable by scanner">
        blind spot
      </span>
    );
  }

  const delta = current - previous;
  const pct = (Math.abs(delta) * 100).toFixed(1);

  if (delta === 0) {
    return (
      <span className={styles.flat} aria-label="No change in visibility delta">
        ▬ 0.0 pp
      </span>
    );
  }

  if (delta > 0) {
    return (
      <span className={styles.up} aria-label={`Visibility up ${pct} percentage points`}>
        ▲ +{pct} pp
      </span>
    );
  }

  return (
    <span className={styles.down} aria-label={`Visibility down ${pct} percentage points`}>
      ▼ −{pct} pp
    </span>
  );
}
