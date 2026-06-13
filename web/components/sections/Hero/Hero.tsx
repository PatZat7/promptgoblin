import { Panel } from "@/components/ui/Panel/Panel";
import { Reveal } from "@/components/ui/Reveal";
import { HeroScan } from "./HeroScan";
import { HeroBookDemo } from "./HeroBookDemo";
import { STRIPE_LINKS } from "@/components/sections/Pricing/pricing.data";
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
          gap.
        </p>
        <div className={styles.cta}>
          <a className="btn ghost" href="#contact" data-cursor="./summon">
            ./summon
          </a>
          <a
            className="btn ghost"
            href={STRIPE_LINKS.watch || "#contact"}
            data-cursor="./watch"
          >
            watch · $99/mo
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
