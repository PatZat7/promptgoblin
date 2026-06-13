"use client";

import { useUiStore } from "@/components/providers/UiStoreProvider";

/** Client island: "book a demo →" button in the Hero CTA row. */
export const HeroBookDemo = () => {
  const openSummon = useUiStore((s) => s.openSummon);
  return (
    <button
      type="button"
      className="btn ghost"
      data-cursor="./demo"
      onClick={() => openSummon(true)}
    >
      book a demo →
    </button>
  );
};
