"use client";

import { useEffect, useRef } from "react";
import styles from "./Cursor.module.css";

/**
 * The pixel cursor. Disabled on touch/coarse pointers and under
 * prefers-reduced-motion (those users keep the native cursor). The label is
 * read from the nearest ancestor with a `data-cursor` attribute — sections
 * set ambient labels, controls override with action labels. Only links/buttons
 * trigger the enlarge.
 */
export const Cursor = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x;
    let ty = y;

    const move = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      const target = e.target as Element | null;
      const labelEl = target?.closest<HTMLElement>("[data-cursor]");
      const control = target?.closest("a, button, [role='button']");
      el.classList.toggle(styles.pointer, Boolean(control));
      el.setAttribute("data-label", labelEl?.getAttribute("data-cursor") ?? "");
    };

    const loop = () => {
      x += (tx - x) * 0.35;
      y += (ty - y) * 0.35;
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", move);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", move);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <div className={styles.cursor} ref={ref} aria-hidden="true" />;
};
