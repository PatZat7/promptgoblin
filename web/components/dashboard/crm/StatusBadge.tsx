import {
  LEAD_STATUS_META,
  type LeadStatus,
  type LeadStatusTone,
} from "@/lib/leads-types";
import styles from "./crm.module.css";

export const TONE_CLASS: Record<LeadStatusTone, string> = {
  neutral: styles.toneNeutral,
  info: styles.toneInfo,
  active: styles.toneActive,
  hot: styles.toneHot,
  warn: styles.toneWarn,
  win: styles.toneWin,
  lose: styles.toneLose,
  muted: styles.toneMuted,
};

/** Status pill. Pure/presentational — safe in server or client trees. */
export function StatusBadge({ status }: { status: LeadStatus }) {
  const meta = LEAD_STATUS_META[status];
  return (
    <span className={`${styles.badge} ${TONE_CLASS[meta.tone]}`} title={meta.hint}>
      <span className={styles.badgeDot} aria-hidden="true" />
      {meta.label}
    </span>
  );
}
