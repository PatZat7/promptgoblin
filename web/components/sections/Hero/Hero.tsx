import clsx from "clsx";
import { Panel } from "@/components/ui/Panel/Panel";
import { Reveal } from "@/components/ui/Reveal";
import { GoblinArt } from "./GoblinArt";
import styles from "./Hero.module.css";

const ASCII_TOP_RIGHT = `schema fragments: [
  "@type": "Org",
  > **nodes ........ }
**crawling graphs**
***(.......) "teh"*,
**objects .........
^animated paypaths^
............crable AF`;

const ASCII_BOTTOM_LEFT = `> crawl ok
> index ok
> cite-ready ✓`;

export const Hero = () => (
  <Panel id="top" className={styles.hero} cursor="~/home">
    <div className={styles.winBar}>
      <span className={styles.dots}>
        <i />
        <i />
        <i />
      </span>
      <span className={styles.grow}>promptgoblin — ~/site — zsh — 132×42</span>
      <span>⌥⌘</span>
    </div>

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
          A one-goblin shop that makes you <b>Visible AF</b> — we measure who the answer engines
          actually cite for your category, then ship the schema, crawl, and content fixes
          (software-engineer-reviewed, never auto-deployed) to close the gap. Days, not quarters.
        </p>
        <p className={styles.note}>
          When an AI names the best in your category — is it you, or your competitor? We measure that
          gap. Then we close it.
        </p>
        <div className={styles.cta}>
          <a className="btn" href="#scan" data-cursor="./scan">
            ./free_scan <span className="arr">→</span>
          </a>
          <a className="btn ghost" href="#contact" data-cursor="./summon">
            ./summon
          </a>
        </div>
      </Reveal>

      <div className={styles.side}>
        <div className={clsx(styles.asciiNoise, styles.asciiTopRight)}>{ASCII_TOP_RIGHT}</div>
        <GoblinArt />
        <div className={clsx(styles.asciiNoise, styles.asciiBottomLeft)}>{ASCII_BOTTOM_LEFT}</div>
        <p className={styles.caption}>
          <span className={styles.captionBlink}>▸</span> mascot.exe — online
        </p>
      </div>
    </div>
  </Panel>
);
