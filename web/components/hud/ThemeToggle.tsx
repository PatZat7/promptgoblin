"use client";

import { useUiStore } from "@/components/providers/UiStoreProvider";
import styles from "./Hud.module.css";

/** Light/dark switch — the visible proof that the Zustand prefs store works. */
export const ThemeToggle = () => {
  const palette = useUiStore((s) => s.palette);
  const togglePalette = useUiStore((s) => s.togglePalette);
  const isLight = palette === "bone";

  return (
    <button
      type="button"
      className={styles.themeToggle}
      onClick={togglePalette}
      title="Toggle light / dark"
      aria-pressed={isLight}
      data-cursor="./theme"
    >
      <span className={styles.swatch} aria-hidden="true" />
      <span className={styles.toggleLabel}>{isLight ? "LIGHT" : "DARK"}</span>
    </button>
  );
};
