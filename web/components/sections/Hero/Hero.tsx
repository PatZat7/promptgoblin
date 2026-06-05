import clsx from "clsx";
import { Panel } from "@/components/ui/Panel/Panel";
import { Reveal } from "@/components/ui/Reveal";
import { GoblinArt } from "./GoblinArt";
import styles from "./Hero.module.css";

export const Hero = () => (
  <Panel id="top" className={styles.hero} cursor="~/home">
    <div className={styles.grid}>
      <Reveal className={styles.main}>
        <p className={styles.kicker}>
          <span className={styles.kickerBar} /> Core positioning
        </p>
        <h1 className={styles.title}>
          AI search
          <br />
          visibility &amp;
          <br />
          <span className={styles.titleAccent}>technical SEO</span>.
        </h1>
        <p className={styles.sub}>
          Get found by robots.
          <br />
          Stay usable by humans.
          <span className={styles.cursor} />
        </p>
        <p className={styles.note}>
          A one-goblin shop that makes you <b>Visible AF</b>: we measure who the
          answer engines actually cite for your category, then ship the schema,
          crawl, and content fixes (software-engineer-reviewed) to close the
          gap. Days, not quarters.
        </p>
        <div className={styles.cta}>
          <a className="btn ghost" href="#contact" data-cursor="./summon">
            ./summon
          </a>
        </div>
      </Reveal>

      <div className={styles.side}>
        <GoblinArt />
      </div>
    </div>
  </Panel>
);
