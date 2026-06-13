"use client";

import { useUiStore } from "@/components/providers/UiStoreProvider";
import styles from "./Contact.module.css";

/** The "Summon." headline CTA — opens modal without demo pre-check. */
export const SummonTrigger = () => {
  const openSummon = useUiStore((s) => s.openSummon);
  return (
    <button
      type="button"
      className={styles.bigBtn}
      data-cursor="./summon"
      onClick={() => openSummon(false)}
      aria-label="Open summon form"
    >
      Summon<em className={styles.bigAccent}>.</em>
      <span className={styles.arrow}>→</span>
    </button>
  );
};

/** The "Request a demo →" inline link — opens modal with demo pre-checked. */
export const RequestDemoTrigger = () => {
  const openSummon = useUiStore((s) => s.openSummon);
  return (
    <button
      type="button"
      className={styles.demoLink}
      data-cursor="./demo"
      onClick={() => openSummon(true)}
    >
      Request a demo <span className="arr">→</span>
    </button>
  );
};
