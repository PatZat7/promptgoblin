import styles from "./SampleBadge.module.css";

type SampleBadgeProps = {
  /** Optional accessible label describing why this is sample data */
  label?: string;
};

/**
 * The [sample] chip — rendered on every card/row whose data is sample/mock.
 * Illustrative data can never be mistaken for an earned result.
 * Honest-broker requirement: this badge is MANDATORY on sample data.
 */
export function SampleBadge({ label }: SampleBadgeProps) {
  return (
    <span
      className={styles.badge}
      aria-label={label ? `Sample data: ${label}` : "Sample data — not a real result"}
      title={label ?? "Illustrative sample data — not an earned result"}
    >
      [sample]
    </span>
  );
}
