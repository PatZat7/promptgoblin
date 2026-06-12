"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import styles from "./Loader.module.css";

/** Brief intro overlay that counts up then fades. Skipped under reduced-motion. */
export const Loader = () => {
  const [n, setN] = useState(0);
  const [hide, setHide] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Post-hydration reduced-motion guard: must run in the effect (not lazy
      // init) so static-export HTML and the client agree, avoiding a mismatch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHide(true);
      return;
    }
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const dismiss = () => {
      setN(100);
      setHide(true);
    };
    // Dismiss on the first animation frame after mount — the page is already
    // painted; we just want a single blink, not a 400ms gate.
    const rafId = requestAnimationFrame(dismiss);
    const step = () => {
      i += Math.random() * 18 + 10;
      if (i >= 100) {
        setN(100);
        timer = setTimeout(() => setHide(true), 180);
        return;
      }
      setN(Math.floor(i));
      timer = setTimeout(step, 20 + Math.random() * 22);
    };
    step();
    // Hard cap: never gate the page beyond 420ms, even if the tab is backgrounded
    // and setTimeout is throttled to >=1s per tick. Plus let a visitor skip it.
    const cap = setTimeout(dismiss, 420);
    window.addEventListener("pointerdown", dismiss, { once: true });
    window.addEventListener("keydown", dismiss, { once: true });
    window.addEventListener("wheel", dismiss, { once: true, passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
      clearTimeout(cap);
      window.removeEventListener("pointerdown", dismiss);
      window.removeEventListener("keydown", dismiss);
      window.removeEventListener("wheel", dismiss);
    };
  }, []);

  return (
    <div className={clsx(styles.loader, hide && styles.hide)} aria-hidden="true">
      <div>
        <div className={styles.cmd}>$ goblin crawl --self</div>
        <div className={styles.count}>
          {String(n).padStart(3, "0")}
          <em>%</em>
        </div>
      </div>
      <div className={styles.right}>
        <div>indexing</div>
        <div>
          <b>schema valid</b>
        </div>
        <div>v 26.05.28</div>
      </div>
    </div>
  );
};
