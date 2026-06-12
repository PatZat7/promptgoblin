import path from "node:path";
import sharp from "sharp";

const WIDTH = 1200;
const HEIGHT = 630;
const root = path.resolve(import.meta.dirname, "..");
const outputs = [
  path.join(root, "public", "og-image.png"),
  path.join(root, "public", "og-image-share-v2.png"),
];

const gridLines = [];
for (let x = 0; x <= WIDTH; x += 80) {
  gridLines.push(`<path d="M${x} 0 V${HEIGHT}" class="grid" />`);
}
for (let y = 36; y <= HEIGHT; y += 62) {
  gridLines.push(`<path d="M0 ${y} H${WIDTH}" class="grid" />`);
}

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#11120f"/>
      <stop offset="1" stop-color="#080907"/>
    </linearGradient>
    <filter id="softGlow" x="-25%" y="-25%" width="150%" height="150%">
      <feGaussianBlur stdDeviation="3.5" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <style>
    .bg { fill: #090a08; }
    .panel { fill: url(#panel); stroke: #2b3028; stroke-width: 1.5; }
    .grid { stroke: #242820; stroke-width: 1; opacity: .34; }
    .scan { stroke: #1b1e18; stroke-width: 1; opacity: .42; }
    .cream { fill: #f3f0df; }
    .muted { fill: #b9b8aa; }
    .faint { fill: #7e8378; }
    .lime { fill: #a3e635; }
    .markStroke { stroke: #d8d3bd; fill: none; stroke-width: 5; stroke-linecap: square; stroke-linejoin: miter; }
    .accentStroke { stroke: #a3e635; fill: none; stroke-width: 4; stroke-linecap: square; stroke-linejoin: miter; }
    .outline { stroke: #8f986f; fill: none; stroke-width: 1.5; opacity: .72; }
    .mono { font-family: Consolas, "Courier New", monospace; }
    .sans { font-family: Arial, Helvetica, sans-serif; }
    .display { font-family: Georgia, "Times New Roman", serif; font-weight: 700; }
  </style>

  <rect class="bg" width="${WIDTH}" height="${HEIGHT}"/>
  <rect x="20" y="20" width="1160" height="590" rx="0" class="panel"/>
  ${gridLines.join("\n  ")}
  <path d="M20 82 H1180 M20 548 H1180" class="scan"/>
  <path d="M86 82 V548 M1114 82 V548" class="scan"/>

  <circle cx="58" cy="54" r="6" fill="#555a52"/>
  <circle cx="82" cy="54" r="6" fill="#555a52"/>
  <circle cx="106" cy="54" r="6" fill="#a3e635"/>
  <text x="146" y="59" class="mono faint" font-size="15" letter-spacing="2">PROMPT_GOBLIN // OG-CARD V2</text>
  <text x="968" y="59" class="mono faint" font-size="15">promptgoblin.io</text>

  <g transform="translate(120 188)" filter="url(#softGlow)">
    <path d="M72 52 L10 16 L54 150 M190 52 L252 16 L208 150" class="markStroke"/>
    <path d="M58 44 H98 M154 44 H194 M78 44 V68 M174 44 V68" class="markStroke"/>
    <path d="M88 96 L112 78 L136 96 L112 114 Z" class="accentStroke"/>
    <path d="M66 116 L66 144 H92 M198 116 L198 144 H172" class="markStroke"/>
    <path d="M90 174 L114 136 L134 174 L152 144 L174 174" class="markStroke"/>
  </g>

  <path d="M412 140 V502" stroke="#33382f" stroke-width="1.5"/>

  <text x="456" y="184" class="mono muted" font-size="18" letter-spacing="3">AEO / GEO / TECHNICAL SEO / WCAG</text>
  <text x="454" y="265" class="display cream" font-size="58">PROMPT_</text>
  <text x="720" y="265" class="display cream" font-size="58">GOBLIN</text>
  <text x="988" y="233" class="display cream" font-size="30">TM</text>
  <rect x="668" y="282" width="44" height="7" fill="#f3f0df" rx="3.5"/>

  <text x="456" y="345" class="mono cream" font-size="29" font-weight="700">Get found by robots.</text>
  <text x="456" y="387" class="mono cream" font-size="29" font-weight="700">Stay usable by humans.</text>

  <text x="456" y="446" class="mono muted" font-size="20">AI-search visibility + technical SEO + WCAG 2.1 AA.</text>
  <text x="456" y="476" class="mono muted" font-size="20">Measured. Human-reviewed. No fake citation promises.</text>

  <g transform="translate(456 520)">
    <rect width="118" height="28" class="outline"/>
    <text x="14" y="19" class="mono lime" font-size="14" font-weight="700">VISIBLE AF</text>
    <rect x="132" width="92" height="28" class="outline"/>
    <text x="150" y="19" class="mono muted" font-size="14">AI SEARCH</text>
    <rect x="238" width="82" height="28" class="outline"/>
    <text x="254" y="19" class="mono muted" font-size="14">AEO/GEO</text>
  </g>
</svg>`;

for (const out of outputs) {
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: false }).toFile(out);
  console.log(out);
}
