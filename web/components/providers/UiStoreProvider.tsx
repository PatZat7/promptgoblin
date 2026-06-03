"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useStore } from "zustand";
import {
  createUiStore,
  DEFAULT_PREFS,
  type UiPrefs,
  type UiState,
  type UiStore,
} from "@/lib/ui-store";

const UiStoreContext = createContext<UiStore | null>(null);

export const UiStoreProvider = ({ children }: { children: React.ReactNode }) => {
  const [store] = useState(() => createUiStore());

  // The no-flash script (in <head>) already restored prefs onto <html> before
  // paint. Sync the store to that DOM truth once, after hydration.
  useEffect(() => {
    const el = document.documentElement;
    const read = <K extends keyof UiPrefs>(key: K): UiPrefs[K] =>
      (el.getAttribute(`data-${key}`) as UiPrefs[K]) ?? DEFAULT_PREFS[key];
    store.setState({
      palette: read("palette"),
      motion: read("motion"),
      density: read("density"),
      grain: read("grain"),
    });
  }, [store]);

  return <UiStoreContext.Provider value={store}>{children}</UiStoreContext.Provider>;
};

export function useUiStore<T>(selector: (state: UiState) => T): T {
  const store = useContext(UiStoreContext);
  if (!store) throw new Error("useUiStore must be used within <UiStoreProvider>");
  return useStore(store, selector);
}
