import { Panel } from "@/components/ui/Panel/Panel";
import { Reveal } from "@/components/ui/Reveal";
import { HeroScan } from "./HeroScan";
import { HeroBookDemo } from "./HeroBookDemo";
import styles from "./Hero.module.css";

export const Hero = () => (
  <Panel id="top" className={styles.hero} cursor="~/home">
    <div className={styles.grid}>
      <Reveal className={styles.main}>
        <p className={styles.kicker}>
          <span className={styles.kickerBar} /> AI search visibility
        </p>
        <h1 className={styles.title}>
          Your competitors
          <br />
          are in the AI answer.
          <br />
          <span className={styles.titleAccent}>You&rsquo;re not</span>.
        </h1>
        <p className={styles.sub}>
          We find the gap, then ship the fixes.
          <br />
          Engineer-reviewed. Measured.
          <span className={styles.cursor} />
        </p>
        <p className={styles.note}>
          Prompt Goblin is an AI-search-visibility (AEO/GEO) and technical-SEO
          shop that fixes why ChatGPT, Perplexity, Gemini, and Claude cite your
          competitors instead of you &mdash; by measuring brand mentions, Bing
          rank, and content extractability, then shipping engineer-reviewed
          schema, crawl, and content fixes.
        </p>
        <div className={styles.cta}>
          <a className="btn ghost" href="#contact" data-cursor="./summon">
            ./summon
          </a>
          <a className="btn ghost" href="#pricing" data-cursor="./pricing">
            see pricing
          </a>
          <HeroBookDemo />
        </div>
      </Reveal>

      <div className={styles.side}>
        <HeroScan />
      </div>
    </div>
  </Panel>
);
