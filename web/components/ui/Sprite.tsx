/**
 * Pixel-art sprite renderer — each non-space char in `rows` becomes a 1×1 SVG
 * rect colored by the palette. Pure/server (no interactivity).
 */

const PALETTES = {
  fire: { F: "var(--fire)", O: "var(--fire-2)", W: "#ffffff" },
  lightning: { Y: "var(--lightning)", K: "var(--fg)" },
  ice: { I: "var(--ice-2)", B: "var(--ice)" },
} as const;

type PaletteName = keyof typeof PALETTES;

type SpriteProps = {
  rows: string[];
  palette?: PaletteName;
  /** Pixel size of each cell. */
  size?: number;
  title?: string;
  className?: string;
};

const Sprite = ({ rows, palette = "fire", size = 8, title = "sprite", className }: SpriteProps) => {
  const width = rows[0].length;
  const height = rows.length;
  const colors: Record<string, string> = PALETTES[palette];
  const rects: React.ReactNode[] = [];

  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === "." || ch === " ") return;
      rects.push(
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={colors[ch] ?? "currentColor"} />,
      );
    }),
  );

  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      width={width * size}
      height={height * size}
      role="img"
      aria-label={title}
    >
      {rects}
    </svg>
  );
};

const FIRE = [
  "....FF....",
  "...FOOF...",
  "..FOOOOF..",
  "..FOOOOF..",
  ".FOOOOOFF.",
  ".FOOWOOOF.",
  ".FOWWWOOF.",
  "FOOWWWWOOF",
  "FOOWWWWWOF",
  "FOOOWWWOOF",
  "FOOOOOOOOF",
  ".FOOOOOOF.",
  "..FFOOFF..",
  "...FFFF...",
];

const LIGHTNING = [
  "....YY..",
  "...YY...",
  "..YY....",
  ".YY.....",
  "YYYYYY..",
  "YYYYY...",
  "...YYY..",
  "..YYY...",
  ".YYY....",
  "YYYYYYY.",
  "..YYY...",
  ".YYY....",
  "YYY.....",
  "YY......",
];

const ICE = [
  "...II...",
  "..IBBI..",
  "..IBBI..",
  ".IBBBBI.",
  ".IBBBBI.",
  "IBBBBBBI",
  "IBBBBBBI",
  "IBBIIBBI",
  "IBBBBBBI",
  ".IBBBBI.",
  ".IBBBBI.",
  "..IBBI..",
  "..IBBI..",
  "...II...",
];

export const SpriteFire = (props: Omit<SpriteProps, "rows" | "palette">) => (
  <Sprite rows={FIRE} palette="fire" title="fire" {...props} />
);
export const SpriteLightning = (props: Omit<SpriteProps, "rows" | "palette">) => (
  <Sprite rows={LIGHTNING} palette="lightning" title="lightning" {...props} />
);
export const SpriteIce = (props: Omit<SpriteProps, "rows" | "palette">) => (
  <Sprite rows={ICE} palette="ice" title="ice" {...props} />
);
