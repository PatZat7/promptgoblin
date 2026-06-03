import clsx from "clsx";
import styles from "./Panel.module.css";

type PanelProps = {
  id?: string;
  className?: string;
  /** Ambient cursor label shown when hovering empty space in this section. */
  cursor?: string;
  children: React.ReactNode;
};

/** A horizontal section band in the terminal layout. */
export const Panel = ({ id, className, cursor, children }: PanelProps) => (
  <section id={id} className={clsx(styles.panel, className)} data-cursor={cursor}>
    {children}
  </section>
);

type PanelBarProps = {
  /** The shell-style command shown on the left, e.g. `$ goblin graph --run`. */
  command: string;
  /** Leading marker token (lime), e.g. `▸`, `03`, `//`. */
  mark?: string;
  /** Optional dim note on the right (illustrative / status text). */
  note?: string;
};

/** The title bar that tops a panel. */
export const PanelBar = ({ command, mark = "▸", note }: PanelBarProps) => (
  <div className={styles.bar}>
    <span className={styles.mark}>{mark}</span>
    <span>{command}</span>
    <span className={styles.grow} />
    {note && <span className={styles.note}>{note}</span>}
  </div>
);
