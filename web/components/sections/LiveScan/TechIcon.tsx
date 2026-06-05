/**
 * Brand icon per detected/entered tech stack, from the curated simple-icons
 * dataset (tech-icons.data.ts — regenerate via scripts/gen-tech-icons.mjs).
 * Rendered in the brand's official color when it reads on the dark chip, else
 * the chip's lime (currentColor). Unknown stacks get a generic code mark.
 */
import type { CSSProperties } from "react";
import { TECH_ICONS, type TechIconData } from "./tech-icons.data";

const norm = (n: string) => n.toLowerCase().replace(/[^a-z0-9]/g, "");

// Flatten to {keyword, icon}, longest keyword first so "preact" wins over
// "react", "rubyonrails" over "ruby", "nextjs" over a bare token, etc.
const INDEX: { kw: string; icon: TechIconData }[] = TECH_ICONS.flatMap((icon) =>
  icon.keywords.map((kw) => ({ kw: norm(kw), icon })),
)
  .filter((e) => e.kw)
  .sort((a, b) => b.kw.length - a.kw.length);

const iconFor = (name?: string): TechIconData | null => {
  const n = norm(name || "");
  if (!n) return null;
  for (const { kw, icon } of INDEX) if (n.includes(kw)) return icon;
  return null;
};

// Relative luminance of #rrggbb (hex without '#'); keeps near-black brand marks
// (Next.js / Vercel / Express = #000) from vanishing on the dark chip.
const channel = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex: string) => {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return 1;
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

// Flip to true for an all-lime monochrome treatment matching the HUD exactly.
const MONOCHROME = false;
const MIN_LUM = 0.16;

// generic </> code mark for stacks we don't have a brand glyph for.
const GENERIC = "M8.7 7.3 3.4 12l5.3 4.7 1.3-1.5L6.4 12l3.6-3.2zm6.6 0-1.3 1.5 3.6 3.2-3.6 3.2 1.3 1.5L20.6 12z";

export const TechIcon = ({ name, className }: { name?: string; className?: string }) => {
  const icon = iconFor(name);
  const brand =
    !MONOCHROME && icon && luminance(icon.hex) >= MIN_LUM ? `#${icon.hex}` : undefined;
  const style: CSSProperties | undefined = brand ? { color: brand } : undefined;
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="currentColor"
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      <path d={icon?.path ?? GENERIC} />
    </svg>
  );
};
