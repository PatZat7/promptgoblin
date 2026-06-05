#!/usr/bin/env node
"use strict";

/**
 * Generate email-safe PNG assets for the scan-report email (Gmail/Outlook strip
 * inline <svg>, so the email needs raster images, attached inline via CID).
 *
 * Outputs to ../email-templates/assets/:
 *   logo.png            — the goblin logo, resized + flattened onto the card bg
 *   <slug>.png          — each curated brand icon (brand color, lime fallback for
 *                         near-black marks so they don't vanish on the dark card)
 *   icons.json          — [{ slug, keywords }] so send.mjs can match a stack name
 *
 * Run from web/:  node scripts/gen-email-icons.mjs
 * Requires the devDependency `sharp`.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const HERE = path.dirname(fileURLToPath(import.meta.url)); // web/scripts
const WEB = path.join(HERE, "..");
const REPO = path.join(WEB, "..");
const ASSETS = path.join(REPO, "email-templates", "assets");
const LOGO_SRC = path.join(WEB, "public", "promptgoblinlogo.png");
const ICONS_TS = path.join(WEB, "components", "sections", "LiveScan", "tech-icons.data.ts");

const CARD_BG = { r: 17, g: 19, b: 16 }; // #111310 — the email card background

fs.mkdirSync(ASSETS, { recursive: true });

// --- logo: resize the raster PNG, flatten onto the card bg so it blends ---
await sharp(LOGO_SRC)
  .flatten({ background: CARD_BG })
  .resize(96, 96, { fit: "contain", background: CARD_BG })
  .png()
  .toFile(path.join(ASSETS, "logo.png"));
console.log("✓ logo.png");

// --- brand icons: parse the curated array out of the .ts and rasterize each ---
const ts = fs.readFileSync(ICONS_TS, "utf8");
const marker = ts.indexOf("TECH_ICONS");
const start = ts.indexOf("[", ts.indexOf("=", marker));
const end = ts.lastIndexOf("]");
const icons = JSON.parse(ts.slice(start, end + 1));

const ch = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const lum = (hex) =>
  0.2126 * ch(parseInt(hex.slice(0, 2), 16)) +
  0.7152 * ch(parseInt(hex.slice(2, 4), 16)) +
  0.0722 * ch(parseInt(hex.slice(4, 6), 16));

const manifest = [];
for (const ic of icons) {
  // brand color when it reads on the dark card; lime for near-black marks
  const color = lum(ic.hex) >= 0.16 ? `#${ic.hex}` : "#a3e635";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="${color}" d="${ic.path}"/></svg>`;
  await sharp(Buffer.from(svg)).resize(48, 48).png().toFile(path.join(ASSETS, `${ic.slug}.png`));
  manifest.push({ slug: ic.slug, keywords: ic.keywords });
}
fs.writeFileSync(path.join(ASSETS, "icons.json"), JSON.stringify(manifest, null, 2));
console.log(`✓ ${icons.length} brand icons + icons.json`);
console.log(`assets → ${ASSETS}`);
