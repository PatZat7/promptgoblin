"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { GoblinHead } from "@/components/ui/GoblinHead";
import styles from "./Hero.module.css";

/** The mascot — blinks every ~4s (skipped under reduced-motion). */
export const GoblinArt = () => {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 160);
    }, 4200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={clsx(styles.art, blink && styles.artBlink)}>
      <GoblinHead />
    </div>
  );
};
