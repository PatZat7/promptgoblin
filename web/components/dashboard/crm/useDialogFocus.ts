import { useEffect, type RefObject } from "react";

/**
 * Modal dialog focus management (ARIA APG dialog pattern + WCAG 2.4.3 Focus Order):
 *  - moves focus into the dialog on open,
 *  - traps Tab / Shift+Tab inside it (aria-modal alone does NOT trap focus),
 *  - closes on Escape,
 *  - restores focus to the previously-focused element on close.
 *
 * Pass the dialog container ref and a STABLE onClose (useCallback).
 */
const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useDialogFocus(
  ref: RefObject<HTMLElement | null>,
  onClose: () => void
) {
  useEffect(() => {
    const prev = (typeof document !== "undefined"
      ? document.activeElement
      : null) as HTMLElement | null;
    ref.current?.focus();

    function focusables(): HTMLElement[] {
      if (!ref.current) return [];
      return Array.from(
        ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter((el) => el.offsetParent !== null);
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        ref.current?.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === ref.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [ref, onClose]);
}
