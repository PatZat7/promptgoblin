import type { PlatformBreakdown as PlatformBreakdownType, Engine } from "@/lib/dashboard-types";
import styles from "./PlatformBreakdown.module.css";

type PlatformBreakdownProps = {
  byEngine: PlatformBreakdownType;
};

const ENGINE_LABELS: Record<Engine, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude (Anthropic)",
  gemini: "Google AIO / Gemini",
  perplexity: "Perplexity",
};

const ENGINES: Engine[] = ["chatgpt", "perplexity", "gemini", "claude"];

/**
 * Per-platform visibility share bars.
 * An engine absent from byEngine (or with null value) renders "not measured",
 * never "0%" — an absent engine was not queried in this run, not a zero result.
 */
export function PlatformBreakdown({ byEngine }: PlatformBreakdownProps) {
  return (
    <div className={styles.wrap}>
      {ENGINES.map((engine) => {
        const share = byEngine[engine]; // undefined = key not present = not measured
        const notMeasured = share === undefined || share === null;
        const pct = notMeasured ? null : (share! * 100).toFixed(1);
        const barWidth = notMeasured ? "0%" : `${Math.min(share! * 100, 100)}%`;

        return (
          <div key={engine} className={styles.row}>
            <span className={styles.engineLabel}>{ENGINE_LABELS[engine]}</span>
            <div className={styles.barWrap} role="presentation" aria-hidden="true">
              {!notMeasured && (
                <div
                  className={styles.bar}
                  style={{ width: barWidth }}
                />
              )}
            </div>
            <span
              className={notMeasured ? styles.notMeasured : styles.pct}
              aria-label={
                notMeasured
                  ? `${ENGINE_LABELS[engine]}: not measured in this run`
                  : `${ENGINE_LABELS[engine]}: ${pct}% visibility share`
              }
            >
              {notMeasured ? "not measured" : `${pct}%`}
            </span>
          </div>
        );
      })}
    </div>
  );
}
