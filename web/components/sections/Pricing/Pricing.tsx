import clsx from "clsx";
import { Panel, PanelBar } from "@/components/ui/Panel/Panel";
import { TIERS } from "./pricing.data";
import styles from "./Pricing.module.css";

export const Pricing = () => (
  <Panel id="pricing" cursor="./pricing">
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
            href={tier.link}
            data-cursor="./checkout"
          >
            {tier.cta} <span className="arr">→</span>
          </a>
        </div>
      ))}
    </div>

    <div className={styles.enterprise}>
      <span>
        <b className={styles.guarantee}>✓ 100% money-back guarantee</b> on the
        work, not the algorithm. If we don&apos;t deliver your audit, or
        you&apos;re not happy with it within 14 days, you get every dollar back.
        We won&apos;t promise a citation number (nobody honestly can). We
        guarantee the work and measure the rest straight.
      </span>
    </div>
  </Panel>
);
