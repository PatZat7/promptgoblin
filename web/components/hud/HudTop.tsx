import { GoblinHead } from "@/components/ui/GoblinHead";
import { NAV } from "@/lib/site";
import { HudClock } from "./HudClock";
import { ThemeToggle } from "./ThemeToggle";
import { HudLoginTrigger } from "./HudLoginTrigger";
import { BookDemoTrigger } from "./BookDemoTrigger";
import styles from "./Hud.module.css";

/** Top status bar. Server-rendered shell; only the toggle + clock hydrate. */
export const HudTop = () => (
  <header className={`${styles.hud} ${styles.top}`}>
    <div className={styles.left}>
      <a className={styles.logo} href="#top" data-cursor="./top">
        <span className={styles.logoMark}>
          <GoblinHead size={24} />
        </span>
        <span>Prompt_Goblin™</span>
      </a>
      <span className={styles.divider} />
      <span className={styles.muted}>AI&nbsp;SEO / Chicago</span>
    </div>

    <nav className={`${styles.center} ${styles.menu}`} aria-label="Primary">
      {NAV.map((link) => (
        <a key={link.href} className={styles.menuLink} href={link.href} data-cursor="./open">
          {link.label}
        </a>
      ))}
    </nav>

    <div className={styles.right}>
      <HudLoginTrigger />
      <span className={styles.divider} />
      <ThemeToggle />
      <span className={styles.divider} />
      <BookDemoTrigger />
      <span className={styles.divider} />
      <HudClock />
    </div>
  </header>
);
