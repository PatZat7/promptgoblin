"use client";

import { useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useUiStore } from "@/components/providers/UiStoreProvider";
import { SummonForm } from "./SummonForm";
import styles from "./SummonModal.module.css";

/**
 * Global Summon modal — renders the SummonForm in an accessible dialog overlay.
 *
 * A11y: role="dialog" + aria-modal, focus trap, ESC to close, click-backdrop
 * to close, restores focus to the opener. prefers-reduced-motion path for
 * the open/close transitions.
 *
 * Mount once globally in app/layout.tsx; it renders nothing when closed.
 */
export const SummonModal = () => {
  const summonOpen = useUiStore((s) => s.summonOpen);
  const closeSummon = useUiStore((s) => s.closeSummon);

  const triggerRef = useRef<Element | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  // Capture the element that opened the modal so focus can be restored on close.
  useEffect(() => {
    if (summonOpen) {
      triggerRef.current = document.activeElement;
      firstFocusRef.current?.focus();
      // Lock body scroll while open.
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      if (triggerRef.current && "focus" in triggerRef.current) {
        (triggerRef.current as HTMLElement).focus();
      }
    }
  }, [summonOpen]);

  // ESC key closes.
  useEffect(() => {
    if (!summonOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeSummon();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [summonOpen, closeSummon]);

  // Focus trap — keep Tab/Shift+Tab inside the dialog.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    },
    []
  );

  if (!summonOpen) return null;

  return (
    /* Backdrop */
    <div
      className={styles.backdrop}
      onClick={closeSummon}
      aria-hidden="true"
    >
      {/* Dialog panel — stop propagation so clicking inside doesn't dismiss */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="summon-modal-title"
        className={styles.dialog}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header row */}
        <div className={styles.header}>
          <Link href="/" className={styles.wordmark} aria-label="Prompt Goblin home">
            PROMPT_GOBLIN™
          </Link>
          <button
            ref={firstFocusRef}
            className={styles.closeBtn}
            onClick={closeSummon}
            aria-label="Close summon dialog"
          >
            ✕
          </button>
        </div>

        <h2 id="summon-modal-title" className={styles.title}>
          $ goblin --summon
        </h2>
        <p className={styles.subtitle}>
          Drop your domain and what you want to get cited for. A real engineer
          replies within a working day.
        </p>

        <div className={styles.formWrap}>
          <SummonForm />
        </div>
      </div>
    </div>
  );
};
