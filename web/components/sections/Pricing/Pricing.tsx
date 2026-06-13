import clsx from "clsx";
import { Panel, PanelBar } from "@/components/ui/Panel/Panel";
import { TIERS } from "./pricing.data";
import styles from "./Pricing.module.css";

export const Pricing = () => (
  <Panel id="pricing" cursor="./pricing" className={styles.section}>
    <PanelBar command="$ goblin --pricing" note="monthly · cancel anytime · no sales call" />
    <div className={clsx("grid-lines", styles.grid)}>
      {TIERS.map((tier) => (
        <div
          key={tier.key}
          className={clsx(styles.tier, tier.featured && styles.featured)}
        >
          {tier.tag && <span className={styles.tag}>{tier.tag}</span>}
          <div className={styles.name}>{tier.name}</div>
          <div className={styles.who}>{"// "}{tier.who}</div>
          <div className={styles.price}>
            ${tier.price}
            <small className={styles.priceUnit}>{tier.interval}</small>
          </div>
          <div className={styles.desc}>{tier.desc}</div>
          <ul className={styles.features}>
            {tier.bullets.map((bullet) => (
              <li key={bullet} className={styles.feature}>
                <span className={styles.check}>▸</span> {bullet}
              </li>
            ))}
          </ul>
          <a
            className={clsx("btn", !tier.featured && "ghost")}
            href={tier.link || "#contact"}
            data-cursor="./checkout"
          >
            {tier.cta} <span className="arr">→</span>
          </a>
        </div>
      ))}
    </div>
  </Panel>
);
