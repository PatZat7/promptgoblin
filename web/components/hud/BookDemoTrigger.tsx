"use client";

import { useUiStore } from "@/components/providers/UiStoreProvider";
import styles from "./Hud.module.css";

/** Client island: opens the Summon modal in demo mode. Preserves pulsing dot + bookDemoCta style. */
export const BookDemoTrigger = () => {
  const openSummon = useUiStore((s) => s.openSummon);
  return (
    <button
      type="button"
      className={styles.bookDemoCta}
      data-cursor="./demo"
      onClick={() => openSummon(true)}
      aria-label="Book a demo"
    >
      <span className={styles.dot} />
      Book&nbsp;a&nbsp;demo
    </button>
  );
};
