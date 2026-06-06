import type { EvalBadgeStatus } from "@/lib/dashboard-types";
import styles from "./EvalBadge.module.css";

type EvalBadgeProps = {
  status: EvalBadgeStatus;
};

const BADGE_CONFIG: Record<
  EvalBadgeStatus,
  { label: string; description: string; className: string }
> = {
  "all-verified": {
    label: "All verified",
    description:
      "Every finding in this run was confirmed by the verify loop.",
    className: "verified",
  },
  "partly-unverified": {
    label: "Partly unverified",
    description:
      "Some findings could not be confirmed or were flagged as regressed by the verify loop.",
    className: "partial",
  },
  "low-confidence": {
    label: "Low confidence",
    description:
      "This run was marked low-confidence — the sample was too small for reliable measurement.",
    className: "low",
  },
  "not-run": {
    label: "Eval not run",
    description: "The verification loop has not run for this scan.",
    className: "notRun",
  },
};

/**
 * Eval badge — sourced from verification_results.
 * NEVER shows "all-verified" when any fix is failed/regressed or low_confidence.
 * Status derivation is in getEvalBadge() (server-side).
 */
export function EvalBadge({ status }: EvalBadgeProps) {
  const config = BADGE_CONFIG[status];
  return (
    <span
      className={`${styles.badge} ${styles[config.className]}`}
      title={config.description}
      aria-label={`Eval status: ${config.label} — ${config.description}`}
    >
      {config.label}
    </span>
  );
}
