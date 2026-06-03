import { JetBrains_Mono, Silkscreen, VT323, Press_Start_2P } from "next/font/google";

/**
 * Self-hosted Google fonts (no runtime request to Google, no layout shift).
 * Each exposes a CSS variable that globals.css maps onto a design token:
 *   --font-jetbrains  → --mono       (body / UI)
 *   --font-press-start→ --pixel      (display headings)
 *   --font-vt323      → --pixel-soft (marquee / large retro)
 *   --font-silkscreen → --pixel-tiny (labels / kickers)
 * JetBrains Mono is variable (no weight). The pixel fonts are fixed-weight
 * and only used in a few spots, so they don't preload.
 */
export const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-press-start",
  display: "swap",
  preload: false,
});

export const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-vt323",
  display: "swap",
  preload: false,
});

export const silkscreen = Silkscreen({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-silkscreen",
  display: "swap",
  preload: false,
});

/** Space-joined `className` for the <html> element. */
export const fontVariables = [
  jetBrainsMono.variable,
  pressStart.variable,
  vt323.variable,
  silkscreen.variable,
].join(" ");
