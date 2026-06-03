import { SITE } from "@/lib/site";
import styles from "./Hud.module.css";

type HudBottomProps = {
  /** 1-based index of the section currently in view. */
  section?: number;
  total?: number;
  name?: string;
};

/** Bottom status bar — static OS chrome. */
export const HudBottom = ({ section = 4, total = 7, name = "Visibility Mesh" }: HudBottomProps) => (
  <footer className={`${styles.hud} ${styles.bottom}`}>
    <div className={styles.left}>
      <span className={styles.muted}>
        {SITE.geo.lat}°N · {Math.abs(Number(SITE.geo.lon))}°W
      </span>
    </div>
    <div className={styles.center}>
      <span className={styles.muted}>SECTOR —</span>
      <span>
        {String(section).padStart(2, "0")}/{String(total).padStart(2, "0")}
      </span>
      <span>{name}</span>
    </div>
    <div className={styles.right}>
      <span className={styles.muted}>EN_US</span>
      <span className={styles.divider} />
      <a href="#top">↑ top</a>
    </div>
  </footer>
);
