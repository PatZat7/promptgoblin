import clsx from "clsx";
import type { ScanStep } from "./scan.data";
import styles from "./LiveScan.module.css";

const TONE: Record<string, string | undefined> = {
  ok: styles.pvOk,
  warn: styles.pvWarn,
  bad: styles.pvBad,
};

export const ScanStepper = ({ steps }: { steps: ScanStep[] }) => (
  <>
    <ol className={styles.stepper} aria-label="scan progress">
      {steps.map((step) => {
        // Google (Illyes/Mueller, Jul 2025) confirmed Search + AI Overviews
        // don't use llms.txt — strike it so it never reads as a real factor.
        const struck = step.key === "llms";
        return (
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
            <span className={clsx(styles.sxLabel, struck && styles.sxStruck)}>{step.label}</span>
            {step.value ? (
              <span className={clsx(styles.sxVal, struck ? styles.sxDimmed : TONE[step.tone] ?? TONE.ok)}>
                {step.value}
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
    {steps.some((s) => s.key === "llms") ? (
      <p className={styles.sxNote}>
        llms.txt struck: Google says Search &amp; AI Overviews don&apos;t use it (Illyes/Mueller, Jul 2025). We still check it — it just isn&apos;t a citation lever.
      </p>
    ) : null}
  </>
);
