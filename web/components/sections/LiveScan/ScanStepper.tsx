import clsx from "clsx";
import type { ScanStep } from "./scan.data";
import styles from "./LiveScan.module.css";

const TONE: Record<string, string | undefined> = {
  ok: styles.pvOk,
  warn: styles.pvWarn,
  bad: styles.pvBad,
};

export const ScanStepper = ({ steps }: { steps: ScanStep[] }) => (
  <ol className={styles.stepper} aria-label="scan progress">
    {steps.map((step) => (
      <li
        className={clsx(
          styles.sx,
          step.status === "active" && styles.sxActive,
          step.status === "done" && styles.sxDone,
        )}
        key={step.key}
      >
        <span className={styles.sxDot} aria-hidden="true">
          {step.status === "done" ? "✓" : ""}
        </span>
        <span className={styles.sxLabel}>{step.label}</span>
        {step.value ? (
          <span className={clsx(styles.sxVal, TONE[step.tone] ?? TONE.ok)}>{step.value}</span>
        ) : null}
      </li>
    ))}
  </ol>
);
