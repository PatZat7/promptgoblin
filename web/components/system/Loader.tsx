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
      setHide(true);
      return;
    }
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      i += Math.random() * 9 + 4;
      if (i >= 100) {
        setN(100);
        timer = setTimeout(() => setHide(true), 340);
        return;
      }
      setN(Math.floor(i));
      timer = setTimeout(step, 40 + Math.random() * 50);
    };
    step();
    return () => clearTimeout(timer);
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
