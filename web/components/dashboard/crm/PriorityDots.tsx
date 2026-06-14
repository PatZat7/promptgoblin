import { PRIORITY_META } from "@/lib/leads-types";
import styles from "./crm.module.css";

/** Compact priority indicator (•/••/••• or — for normal). */
export function PriorityDots({ value }: { value: number }) {
  const p = Math.min(3, Math.max(0, Math.trunc(value || 0)));
  const meta = PRIORITY_META[p];
  if (p === 0) {
    return (
      <span className={styles.priorityNone} title="Normal priority" aria-label="Normal priority">
        —
      </span>
    );
  }
  return (
    <span
      className={styles.priority}
      title={`${meta.label} priority`}
      aria-label={`${meta.label} priority`}
    >
      {"•".repeat(p)}
    </span>
  );
}
