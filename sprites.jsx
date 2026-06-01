/* global React */
/* Pixel-art sprite library for Prompt Goblin */

const PALETTES = {
  fire: { F: "var(--fire)", O: "var(--fire-2)", W: "#ffffff" },
  lightning: { Y: "var(--lightning)", K: "var(--fg)" },
  ice: { I: "var(--ice-2)", B: "var(--ice)" },
  goblin: { D: "var(--goblin-dk)", G: "var(--goblin)", W: "#ffffff", K: "var(--fg)", T: "var(--lightning)" },
  mono: { D: "var(--fg)", G: "var(--fg)", W: "var(--fg)", K: "var(--fg)" },
};

function Sprite({ rows, palette = "goblin", size = 8, title, style, className }) {
  const w = rows[0].length, h = rows.length;
  const pal = PALETTES[palette] || PALETTES.goblin;
  const rects = [];
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < w; x++) {
      const ch = row[x];
      if (ch === "." || ch === " ") continue;
      const fill = pal[ch] || "currentColor";
      rects.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={fill} />);
    }
  }
  return (
    <svg
      className={"pixel " + (className || "")}
      viewBox={`0 0 ${w} ${h}`}
      width={w * size}
      height={h * size}
      style={style}
      role="img"
      aria-label={title || "sprite"}
    >
      {rects}
    </svg>
  );
}

/* ===== Sprite definitions ===== */

const SPRITE_FIRE = [
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

const SPRITE_LIGHTNING = [
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

const SPRITE_ICE = [
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

/* Big goblin head — 16x16 */
const SPRITE_GOBLIN = [
  "................",
  "..D..........D..",
  ".DGD........DGD.",
  ".DGGD......DGGD.",
  "..DGGDDDDDDGGD..",
  ".DGGGGGGGGGGGGD.",
  "DGGGGGGGGGGGGGGD",
  "DGGWKGGGGGGKWGGD",
  "DGGWKGGGGGGKWGGD",
  "DGGGGGGDDGGGGGGD",
  "DGGGGGGDDGGGGGGD",
  "DGGGDDDDDDDDGGGD",
  "DGGDWKWKWKWKGGGD",
  "DGGGDDDDDDDDGGGD",
  ".DGGGGGGGGGGGGD.",
  "..DDDDDDDDDDDD..",
];

/* Small 8x8 goblin mark for the logo */
const SPRITE_GOBLIN_MARK = [
  ".D....D.",
  "DGD..DGD",
  ".DGGGGD.",
  "DGKGGKGD",
  "DGGGGGGD",
  "DGDDDDGD",
  ".DGDDGD.",
  "..DDDD..",
];

/* Goblin "scared/closed-eye" variant for the loader / idle alt frame */
const SPRITE_GOBLIN_BLINK = [
  "................",
  "..D..........D..",
  ".DGD........DGD.",
  ".DGGD......DGGD.",
  "..DGGDDDDDDGGD..",
  ".DGGGGGGGGGGGGD.",
  "DGGGGGGGGGGGGGGD",
  "DGGDDGGGGGGDDGGD",
  "DGGGGGGGGGGGGGGD",
  "DGGGGGGDDGGGGGGD",
  "DGGGGGGDDGGGGGGD",
  "DGGGDDDDDDDDGGGD",
  "DGGDWKWKWKWKGGGD",
  "DGGGDDDDDDDDGGGD",
  ".DGGGGGGGGGGGGD.",
  "..DDDDDDDDDDDD..",
];

const SpriteFire      = (p) => <Sprite rows={SPRITE_FIRE}      palette="fire"      {...p} />;
const SpriteLightning = (p) => <Sprite rows={SPRITE_LIGHTNING} palette="lightning" {...p} />;
const SpriteIce       = (p) => <Sprite rows={SPRITE_ICE}       palette="ice"       {...p} />;
const SpriteGoblin    = (p) => <Sprite rows={SPRITE_GOBLIN}    palette="goblin"    {...p} />;
const SpriteGoblinMk  = (p) => <Sprite rows={SPRITE_GOBLIN_MARK}    palette="goblin"    {...p} />;
const SpriteGoblinBlk = (p) => <Sprite rows={SPRITE_GOBLIN_BLINK}   palette="goblin"    {...p} />;

Object.assign(window, {
  Sprite,
  SpriteFire, SpriteLightning, SpriteIce,
  SpriteGoblin, SpriteGoblinMk, SpriteGoblinBlk,
});
