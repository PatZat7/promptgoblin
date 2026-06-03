"use client";

import { useEffect, useState } from "react";

/**
 * Live Chicago clock. Renders empty on the server and on the first client
 * paint (so there's no hydration mismatch), then ticks every second.
 */
export const HudClock = () => {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "America/Chicago",
        }),
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return <span suppressHydrationWarning>{time ? `${time} CHI` : " "}</span>;
};
