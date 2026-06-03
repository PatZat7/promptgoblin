import clsx from "clsx";
import { Panel, PanelBar } from "@/components/ui/Panel/Panel";
import { SummonForm } from "./SummonForm";
import styles from "./Contact.module.css";

export const Contact = () => (
  <Panel id="contact" cursor="./summon">
    <PanelBar mark="06" command="$ goblin --summon" note="3 slots · Q3–Q4 2026" />
    <div className={clsx("grid-lines", styles.grid)}>
      <div className={styles.main}>
        <div className={styles.big}>
          <a href="#contact" data-cursor="./summon">
            Summon<em className={styles.bigAccent}>.</em>
            <span className={styles.arrow}>→</span>
          </a>
        </div>
        <p className={styles.avail}>
          Drop your domain and what you want to get cited for — I&apos;ll run a{" "}
          <em>free visibility scan</em> and send back the gaps. Best for jobs measured in{" "}
          <em>days</em>, not quarters.
          <br />
          <em>No card, no sales call.</em> Paid work carries a{" "}
          <em>100% money-back guarantee</em> — full refund if we don&apos;t deliver or you&apos;re
          not happy within 14 days.
        </p>
        <SummonForm />
      </div>

      <div className={styles.side}>
        <div className={styles.row}>
          <span className={styles.rowKey}>$ mail</span>
          <span className={clsx(styles.rowVal, styles.rowValBig)}>
            <a href="mailto:hi@promptgoblin.io" data-cursor="./mail">hi@promptgoblin.io</a>
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.rowKey}>$ chat</span>
          <span className={styles.rowVal}>@promptgoblin</span>
        </div>
        <div className={styles.row}>
          <span className={styles.rowKey}>$ ls ./elsewhere</span>
          <span className={styles.rowVal}>
            <span className={styles.soon}>github</span> · <span className={styles.soon}>x.com</span> ·{" "}
            <span className={styles.soon}>substack</span>
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.rowKey}>$ pwd</span>
          <span className={styles.rowVal}>Chicago, IL · by appt</span>
        </div>
      </div>
    </div>

    <div className={styles.colophon}>
      <span>© Prompt_Goblin™ 2024–2026 · Visible AF</span>
      <span>Set in Press Start 2P · VT323 · JetBrains Mono</span>
    </div>
  </Panel>
);
