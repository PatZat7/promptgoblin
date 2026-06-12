import clsx from "clsx";
import { Panel, PanelBar } from "@/components/ui/Panel/Panel";
import { SummonForm } from "./SummonForm";
import styles from "./Contact.module.css";

export const Contact = () => (
  <Panel id="contact" cursor="./summon">
    <PanelBar command="$ goblin --summon" note="3 slots · Q3–Q4 2026" />
    <div className={clsx("grid-lines", styles.grid)}>
      <div className={styles.main}>
        <div className={styles.big}>
          <a href="#contact" data-cursor="./summon">
            Summon<em className={styles.bigAccent}>.</em>
            <span className={styles.arrow}>→</span>
          </a>
        </div>
        <p className={styles.avail}>
          Want the scan in your inbox? Drop your domain, email, and what you
          want to get cited for. I&apos;ll send back the gaps and the next
          useful moves. Best for jobs measured in <em>days</em>, not quarters.
          <br />
          <em>No card, no sales call.</em> Paid work carries a{" "}
          <em>100% money-back guarantee</em>: full refund if we don&apos;t
          deliver or you&apos;re not happy within 14 days.{" "}<br /><br />
          <a href="#contact" className={styles.demoLink} data-cursor="./demo">
            Request a demo <span className="arr">→</span>
          </a>
        </p>
        <SummonForm />
      </div>

      <div className={styles.side}>
        <div className={styles.row}>
          <span className={styles.rowKey}>$ mail</span>
          <span className={clsx(styles.rowVal, styles.rowValBig)}>
            <a href="mailto:goblins@promptgoblin.io" data-cursor="./mail">
              goblins@promptgoblin.io
            </a>
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.rowKey}>$ chat</span>
          <span className={styles.rowVal}>@promptgoblin</span>
        </div>
        <div className={styles.row}>
          <span className={styles.rowKey}>$ ls ./elsewhere</span>
          <span className={styles.rowVal}>
            <span className={styles.soon}>github</span> ·{" "}
            <span className={styles.soon}>x.com</span> ·{" "}
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
