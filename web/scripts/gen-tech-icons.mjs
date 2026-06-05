/**
 * Generate a curated, embedded brand-icon dataset from `simple-icons`.
 *
 * Why embed instead of importing `simple-icons` at runtime: the package ships
 * ~3000 icons; importing the barrel would bloat the client bundle. We only need
 * the popular web/CMS/ecommerce stacks, so we bake just those (path + brand hex
 * + match keywords) into a tiny TS module. `simple-icons` stays a devDependency.
 *
 * Re-run after adding a stack:  node scripts/gen-tech-icons.mjs
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import * as si from "simple-icons";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, "..", "components", "sections", "LiveScan", "tech-icons.data.ts");

// slug = simple-icons slug; keywords = lowercased tokens we match detected/entered
// stack names against (most-specific first wins via length sort at match time).
const WANT = [
  // frameworks / SSG / SPA
  ["nextdotjs", ["nextjs", "next.js", "next"]],
  ["react", ["react"]],
  ["vuedotjs", ["vuejs", "vue.js", "vue"]],
  ["nuxt", ["nuxt"]],
  ["angular", ["angular"]],
  ["svelte", ["sveltekit", "svelte"]],
  ["astro", ["astro"]],
  ["remix", ["remix"]],
  ["gatsby", ["gatsby"]],
  ["vite", ["vite"]],
  ["hugo", ["hugo"]],
  ["jekyll", ["jekyll"]],
  ["eleventy", ["eleventy", "11ty"]],
  ["solid", ["solidjs", "solid.js", "solid"]],
  ["qwik", ["qwik"]],
  ["preact", ["preact"]],
  ["alpinedotjs", ["alpine.js", "alpinejs", "alpine"]],
  ["emberdotjs", ["ember"]],
  // CMS / site builders
  ["wordpress", ["wordpress", "wp"]],
  ["wix", ["wix"]],
  ["squarespace", ["squarespace"]],
  ["webflow", ["webflow"]],
  ["framer", ["framer"]],
  ["ghost", ["ghost"]],
  ["drupal", ["drupal"]],
  ["joomla", ["joomla"]],
  ["contentful", ["contentful"]],
  ["sanity", ["sanity"]],
  ["strapi", ["strapi"]],
  ["hubspot", ["hubspot"]],
  ["notion", ["notion"]],
  // ecommerce
  ["shopify", ["shopify"]],
  ["woocommerce", ["woocommerce", "woo"]],
  ["bigcommerce", ["bigcommerce"]],
  ["prestashop", ["prestashop"]],
  ["magento", ["magento"]],
  // backend / languages
  ["nodedotjs", ["nodejs", "node.js", "node"]],
  ["express", ["express"]],
  ["laravel", ["laravel"]],
  ["django", ["django"]],
  ["rubyonrails", ["rubyonrails", "ruby on rails", "rails"]],
  ["flask", ["flask"]],
  ["php", ["php"]],
  ["python", ["python"]],
  ["ruby", ["ruby"]],
  ["dotnet", ["asp.net", ".net", "dotnet"]],
  ["symfony", ["symfony"]],
  ["spring", ["spring"]],
  // hosting / CSS / misc
  ["vercel", ["vercel"]],
  ["netlify", ["netlify"]],
  ["cloudflare", ["cloudflare"]],
  ["firebase", ["firebase"]],
  ["tailwindcss", ["tailwindcss", "tailwind"]],
  ["bootstrap", ["bootstrap"]],
  ["jquery", ["jquery"]],
];

const siName = (slug) => "si" + slug.charAt(0).toUpperCase() + slug.slice(1);

const rows = [];
const missing = [];
for (const [slug, keywords] of WANT) {
  const icon = si[siName(slug)];
  if (!icon || !icon.path) {
    missing.push(slug);
    continue;
  }
  rows.push({ slug, title: icon.title, hex: icon.hex, path: icon.path, keywords });
}

const body =
  `/**\n` +
  ` * Curated brand-icon data (path + official brand hex + match keywords),\n` +
  ` * embedded from the simple-icons library so the client bundle stays small.\n` +
  ` * Regenerate with: node scripts/gen-tech-icons.mjs\n` +
  ` */\n` +
  `export type TechIconData = {\n` +
  `  slug: string;\n` +
  `  title: string;\n` +
  `  /** official brand color, hex without '#' */\n` +
  `  hex: string;\n` +
  `  /** single-path 24x24 brand glyph */\n` +
  `  path: string;\n` +
  `  /** lowercased tokens we match a detected/entered stack name against */\n` +
  `  keywords: string[];\n` +
  `};\n\n` +
  `export const TECH_ICONS: TechIconData[] = ${JSON.stringify(rows, null, 2)};\n`;

writeFileSync(OUT, body, "utf8");
console.log(`Wrote ${rows.length} icons -> ${OUT}`);
if (missing.length) console.warn(`Skipped (not in simple-icons): ${missing.join(", ")}`);
