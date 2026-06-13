import { createStore } from "zustand/vanilla";

/**
 * Global UI preferences (palette / motion / density / grain).
 * Each is mirrored to a `data-*` attribute on <html> and persisted to
 * localStorage, so CSS can react and the no-flash script can restore it
 * before first paint. We use the factory + provider pattern (not a module
 * singleton) so state never bleeds across renders — the documented Next.js
 * approach, and the right shape for the multi-route dashboard later.
 */

export type Palette = "dark" | "bone" | "noir" | "rust";
export type Motion = "low" | "med" | "high";
export type Density = "default" | "airy" | "tight";
export type Grain = "on" | "off";

export type UiPrefs = {
  palette: Palette;
  motion: Motion;
  density: Density;
  grain: Grain;
};

export type UiState = UiPrefs & {
  setPalette: (palette: Palette) => void;
  togglePalette: () => void;
  setMotion: (motion: Motion) => void;
  setDensity: (density: Density) => void;
  setGrain: (grain: Grain) => void;
  /** Summon / contact modal */
  summonOpen: boolean;
  summonDemo: boolean;
  openSummon: (demo?: boolean) => void;
  closeSummon: () => void;
};

/** localStorage keys — also read by the inline no-flash script. */
export const STORAGE_KEYS: Record<keyof UiPrefs, string> = {
  palette: "pg-palette",
  motion: "pg-motion",
  density: "pg-density",
  grain: "pg-grain",
};

export const DEFAULT_PREFS: UiPrefs = {
  palette: "dark",
  motion: "med",
  density: "default",
  grain: "on",
};

/** Write one preference to the DOM + localStorage (no-ops on the server). */
const persist = (key: keyof UiPrefs, value: string) => {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute(`data-${key}`, value);
  try {
    localStorage.setItem(STORAGE_KEYS[key], value);
  } catch {
    /* private mode / storage disabled — the in-memory state still works */
  }
};

export const createUiStore = (init: Partial<UiPrefs> = {}) =>
  createStore<UiState>()((set, get) => ({
    ...DEFAULT_PREFS,
    ...init,
    setPalette: (palette) => {
      persist("palette", palette);
      set({ palette });
    },
    togglePalette: () => get().setPalette(get().palette === "bone" ? "dark" : "bone"),
    setMotion: (motion) => {
      persist("motion", motion);
      set({ motion });
    },
    setDensity: (density) => {
      persist("density", density);
      set({ density });
    },
    setGrain: (grain) => {
      persist("grain", grain);
      set({ grain });
    },
    summonOpen: false,
    summonDemo: false,
    openSummon: (demo = false) => set({ summonOpen: true, summonDemo: demo }),
    closeSummon: () => set({ summonOpen: false, summonDemo: false }),
  }));

export type UiStore = ReturnType<typeof createUiStore>;
