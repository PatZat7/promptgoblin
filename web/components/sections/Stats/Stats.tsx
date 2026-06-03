import clsx from "clsx";
import { Panel, PanelBar } from "@/components/ui/Panel/Panel";
import styles from "./Stats.module.css";

// Every number is provable on this site — dogfood telemetry, no vanity metrics.
const STATS = [
  { value: "5", label: "Answer engines scanned" },
  { value: "6", label: "JSON-LD blocks · this site" },
  { value: "7", label: "Pipeline nodes · engineer-gated" },
  { value: "0", label: "Changes auto-deployed" },
];

export const Stats = () => (
  <Panel cursor="./telemetry">
    <PanelBar mark="//" command="telemetry" note="this site · dogfooded" />
    <div className={clsx("grid-lines", styles.grid)}>
      {STATS.map((stat) => (
        <div className={styles.stat} key={stat.label}>
          <div className={styles.value}>{stat.value}</div>
          <div className={styles.label}>{stat.label}</div>
        </div>
      ))}
    </div>
  </Panel>
);
