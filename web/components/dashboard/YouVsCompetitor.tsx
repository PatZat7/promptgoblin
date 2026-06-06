import styles from "./YouVsCompetitor.module.css";

type DomainShare = { domain: string; share: number };

type YouVsCompetitorProps = {
  client: DomainShare;
  competitors: DomainShare[];
};

/**
 * Bar chart of visibility shares: client domain + competitor domains.
 * Competitor shares that came from research inference carry the "verify"
 * framing from the report — not asserted fact.
 */
export function YouVsCompetitor({ client, competitors }: YouVsCompetitorProps) {
  const all = [client, ...competitors].sort((a, b) => b.share - a.share);
  const max = Math.max(...all.map((d) => d.share), 0.01); // avoid divide-by-0

  return (
    <div className={styles.wrap}>
      {all.map((item) => {
        const isClient = item.domain === client.domain;
        const pct = (item.share * 100).toFixed(1);
        const barWidth = `${(item.share / max) * 100}%`;

        return (
          <div key={item.domain} className={styles.row}>
            <span
              className={isClient ? styles.clientLabel : styles.competitorLabel}
              aria-label={isClient ? `Your domain: ${item.domain}` : `Competitor: ${item.domain}`}
            >
              {item.domain}
              {isClient && <span className={styles.youChip}> you</span>}
            </span>
            <div className={styles.barWrap} role="presentation">
              <div
                className={isClient ? styles.clientBar : styles.competitorBar}
                style={{ width: barWidth }}
                aria-label={`${pct}% visibility share`}
              />
            </div>
            <span className={isClient ? styles.clientPct : styles.competitorPct}>
              {pct}%
            </span>
          </div>
        );
      })}
      <p className={styles.note}>
        Competitor shares sourced from research inference — verify independently.
      </p>
    </div>
  );
}
