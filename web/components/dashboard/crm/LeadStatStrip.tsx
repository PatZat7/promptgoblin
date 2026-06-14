import type { LeadStats } from "@/lib/leads-types";
import styles from "./crm.module.css";

type Stat = { label: string; value: number; alert?: boolean };

/** Funnel stat strip — server component, derived from getLeadStats(). */
export function LeadStatStrip({ stats }: { stats: LeadStats }) {
  const cells: Stat[] = [
    { label: "Total", value: stats.total },
    { label: "Needs scan", value: stats.needsScan },
    { label: "Ready to send", value: stats.readyToSend },
    { label: "In flight", value: stats.inFlight },
    { label: "Replied", value: stats.replied },
    { label: "Won", value: stats.won },
    { label: "Follow-ups due", value: stats.followupsDue, alert: stats.followupsDue > 0 },
  ];

  return (
    <dl className={styles.statStrip}>
      {cells.map((c) => (
        <div key={c.label} className={`${styles.statCard} ${c.alert ? styles.alert : ""}`}>
          <dt className={styles.statLabel}>{c.label}</dt>
          <dd className={styles.statNum}>{c.value}</dd>
        </div>
      ))}
    </dl>
  );
}
