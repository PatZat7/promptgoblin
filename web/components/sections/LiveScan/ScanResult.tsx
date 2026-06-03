import clsx from "clsx";
import type { ScanReport } from "@/lib/scan-api";
import type { ScanStep } from "./scan.data";
import type { ScoreBand } from "./scan-report";
import { ScanStepper } from "./ScanStepper";
import styles from "./LiveScan.module.css";

const BAND: Record<string, string | undefined> = {
  ok: styles.bandOk,
  warn: styles.bandWarn,
  bad: styles.bandBad,
};

type ScanResultProps = {
  report: ScanReport;
  email: string;
  target: string;
  band: ScoreBand;
  steps: ScanStep[];
  onReset: () => void;
};

export const ScanResult = ({ report, email, target, band, steps, onReset }: ScanResultProps) => {
  const found = report.schema?.found ?? [];
  const missing = report.schema?.missing ?? [];
  const findings = report.findings ?? [];
  const highN = findings.filter((f) => (f.severity ?? 0) >= 4).length;
  const medN = findings.filter((f) => f.severity === 3).length;
  const lowN = findings.filter((f) => f.severity != null && f.severity <= 2).length;

  return (
    <div className={styles.result}>
      {steps?.length ? <ScanStepper steps={steps} /> : null}

      <div className={styles.srTop}>
        <div className={clsx(styles.srScore, BAND[band.key])}>
          <span className={styles.srNum}>{report.hygieneScore}</span>
          <span className={styles.srDen}>/100</span>
        </div>
        <div className={styles.srTopMeta}>
          <div className={styles.srK}>hygiene · {target}</div>
          <div className={styles.srSub}>
            {highN} high · {medN} medium · {lowN} low
          </div>
        </div>
      </div>

      <div className={styles.srBlock}>
        <div className={styles.srK}>structured data</div>
        <div className={styles.srChips}>
          {found.map((t) => (
            <span className={clsx(styles.srChip, styles.chipOk)} key={`f${t}`}>
              ✓ {t}
            </span>
          ))}
          {missing.map((t) => (
            <span className={clsx(styles.srChip, styles.chipMiss)} key={`m${t}`}>
              ✕ {t}
            </span>
          ))}
          {!found.length && !missing.length && <span className={styles.srChip}>—</span>}
        </div>
      </div>

      <p className={styles.srDisc}>{report.disclaimer}</p>

      <div className={styles.srCta}>
        <div className={styles.srOkT}>
          ✓ Real hygiene result delivered above. A software engineer (me) will personally review it
          and email {email || "you"} about the full citation &amp; accessibility audit — no automated
          report.
        </div>
        <a className="btn" href="#pricing" data-cursor="./audit">
          see the full Scout audit <span className="arr">→</span>
        </a>
      </div>

      <button type="button" className={styles.srAgain} onClick={onReset} data-cursor="./retry">
        ↺ scan another domain
      </button>
    </div>
  );
};
