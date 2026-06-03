"use client";

import { useEffect, useRef } from "react";
import clsx from "clsx";

/**
 * Wraps server-rendered content and fades it in when it scrolls into view.
 * Children stay server components — only this thin wrapper hydrates.
 */
export const Reveal = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.14 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={clsx("reveal", className)}>
      {children}
    </div>
  );
};
