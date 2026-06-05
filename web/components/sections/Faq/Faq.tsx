import { Panel, PanelBar } from "@/components/ui/Panel/Panel";
import { Reveal } from "@/components/ui/Reveal";
import { FAQ } from "@/lib/faq";
import styles from "./Faq.module.css";

/** Plain-language FAQ. Single-sourced from lib/faq with the FAQPage JSON-LD, so
 *  the visible answers match what we feed answer engines (dogfood). Answers stay
 *  open (no accordion) — scannable for a skeptic, present for a crawler. */
export const Faq = () => (
  <Panel id="faq" cursor="./faq">
    <PanelBar command="$ goblin --faq" note="straight answers · no sales call" />
    <div className={styles.wrap}>
      <Reveal className={styles.intro}>
        <h2 className={styles.heading}>Questions a skeptic asks</h2>
        <p className={styles.sub}>
          Plain answers, the same ones our structured data hands the robots.
        </p>
      </Reveal>
      <dl className={styles.list}>
        {FAQ.map((item) => (
          <div className={styles.item} key={item.q}>
            <dt className={styles.q}>
              <span className={styles.prompt}>&gt;</span> {item.q}
            </dt>
            <dd className={styles.a}>{item.a}</dd>
          </div>
        ))}
      </dl>
    </div>
  </Panel>
);
