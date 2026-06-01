#!/usr/bin/env node
/**
 * Prompt Goblin — Brand-Asset Ad Engine: COPY generator.
 *
 * Given a --channel (linkedin|google|meta) and a campaign --angle, this assembles
 * a brand-locked prompt from brand.json and either:
 *   - calls OpenAI (if OPENAI_API_KEY is set) to produce ad COPY, or
 *   - prints the assembled prompt for a human to paste into Claude/Gemini.
 *
 * Zero dependencies: uses Node 18+ native fetch. Nothing here generates IMAGES —
 * image prompts live in prompts.md and run in Nano Banana / gpt-image-1 / Claude
 * Design with the real goblin-head asset composited in (models can't draw it).
 *
 * Usage:
 *   node generate.mjs --channel linkedin --angle "508 deadline" [--audience gov]
 *   node generate.mjs --channel google   --angle "AI SEO audit" --dry-run
 *   node generate.mjs --channel meta      --angle "free scan" --json
 *
 * Flags:
 *   --channel   linkedin | google | meta            (required)
 *   --angle     free-text campaign angle            (required)
 *   --audience  gov | commercial                    (default: gov — gov-forward ICP)
 *   --variants  N                                    (default: 3)
 *   --dry-run   print the assembled prompt only; never touch the network
 *   --json      emit machine-readable JSON instead of pretty text
 *   --model     OpenAI model id                      (default: gpt-4o-mini)
 */

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BRAND_PATH = resolve(__dirname, "brand.json");

/* ----------------------------- brand loading ----------------------------- */

export async function loadBrand(path = BRAND_PATH) {
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw);
}

/* ----------------------------- arg parsing ------------------------------- */

export function parseArgs(argv) {
  const args = {
    channel: null,
    angle: null,
    audience: "gov",
    variants: 3,
    dryRun: false,
    json: false,
    model: "gpt-4o-mini",
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case "--channel": args.channel = (next() || "").toLowerCase(); break;
      case "--angle": args.angle = next(); break;
      case "--audience": args.audience = (next() || "").toLowerCase(); break;
      case "--variants": args.variants = Math.max(1, parseInt(next(), 10) || 3); break;
      case "--model": args.model = next(); break;
      case "--dry-run": args.dryRun = true; break;
      case "--json": args.json = true; break;
      case "-h":
      case "--help": args.help = true; break;
      default:
        if (a.startsWith("--")) throw new Error(`Unknown flag: ${a}`);
    }
  }
  return args;
}

/* --------------------------- prompt assembly ----------------------------- */

const CHANNEL_ALIASES = {
  linkedin: "linkedin", li: "linkedin",
  google: "google", g: "google", search: "google",
  meta: "meta", facebook: "meta", fb: "meta", instagram: "meta", ig: "meta",
};

export function resolveChannel(channel) {
  const key = CHANNEL_ALIASES[channel];
  if (!key) {
    throw new Error(
      `Unknown channel "${channel}". Use one of: linkedin, google, meta.`
    );
  }
  return key;
}

/** Human-readable spec line for a channel field, e.g. "headline: aim ≤70 chars, hard max 200; provide 15". */
function fmtField(name, f) {
  if (!f) return null;
  const charParts = [];
  if (f.sweet != null) charParts.push(`aim ≤${f.sweet} chars`);
  if (f.max != null) charParts.push(`hard max ${f.max} chars`);
  let line = charParts.join(", ");
  if (f.count != null) line += `${line ? "; " : ""}provide up to ${f.count}`;
  const tail = f.note ? ` — ${f.note}` : "";
  return `  - ${name}: ${line}${tail}`;
}

const CHANNEL_FIELDS = {
  linkedin: ["introText", "headline", "description"],
  google: ["headline", "description", "path"],
  meta: ["primaryText", "headline", "description"],
};

/**
 * Build the full text prompt sent to the model (or printed in --dry-run).
 * Pure + synchronous so the offline test can assert on it with no network.
 */
export function assemblePrompt(brand, { channel, angle, audience = "gov", variants = 3 }) {
  const ch = resolveChannel(channel);
  const spec = brand.channels[ch];
  const img = (brand.imageSpecs || {})[ch];
  const aud = audience === "commercial" ? brand.icp.commercial : brand.icp.government;
  const v = brand.voice;
  const offer = brand.offer;

  const fieldLines = CHANNEL_FIELDS[ch]
    .map((name) => fmtField(name, spec[name]))
    .filter(Boolean)
    .join("\n");

  const ctas = (spec.cta || []).join(", ");
  const taglines = v.taglines.map((t) => `"${t}"`).join(", ");
  const disciplines = offer.disciplines
    .map((d) => `${d.code} (${d.label})`)
    .join(", ");
  const guardrails = v.honestyGuardrails.map((g) => `- ${g}`).join("\n");
  const dont = v.dont.map((d) => `- ${d}`).join("\n");
  const painPoints = aud.painPoints.map((p) => `- ${p}`).join("\n");

  const system =
    `You are the in-house copywriter for ${brand.brand.name} (${brand.brand.wordmark}), ` +
    `a solo, honest-broker AI-search-visibility (AEO/GEO), technical-SEO, and accessibility shop. ` +
    `Voice: ${v.personality} ` +
    `You write ad copy that sounds like a competent dev in a terminal, never a marketer in a deck. ` +
    `You NEVER fabricate clients, testimonials, metrics, or guarantees.`;

  const user = [
    `# TASK`,
    `Write ${variants} distinct ad-copy variant${variants > 1 ? "s" : ""} for ${spec.label}.`,
    `Campaign angle: "${angle}".`,
    `Audience: ${aud.label}.`,
    ``,
    `# AUDIENCE PAIN (lead with one of these)`,
    painPoints,
    `Angle to strike: ${aud.angle}`,
    ``,
    `# WHAT WE SELL`,
    `Disciplines: ${disciplines}.`,
    `Tiers: ${offer.tiers.map((t) => `${t.name} ($${t.price} ${t.interval})`).join(", ")}.`,
    `Guarantee: ${offer.guarantee}`,
    `Proof we can use: ${offer.proof.join(" / ")}.`,
    ``,
    `# CHANNEL FORMAT (${spec.label})`,
    fieldLines,
    `  - CTA options: ${ctas}`,
    `  - Channel guidance: ${spec.guidance}`,
    img ? `  - Paired image spec: ${img.ratio} (${img.px})` : null,
    ``,
    `# VOICE`,
    `Taglines you may end on (don't overuse): ${taglines}.`,
    `Lexicon: use "summon" not "contact"; an un-found site is "cursed"/wears an "invisibility cloak"; the operator is "a goblin"; the outcome is "Visible AF".`,
    ``,
    `# HARD RULES (do NOT violate)`,
    guardrails,
    dont,
    ``,
    `# OUTPUT`,
    `Return ONLY valid JSON, no prose, shaped exactly:`,
    jsonShape(ch, spec),
  ]
    .filter((line) => line !== null)
    .join("\n");

  return { channel: ch, system, user, spec, image: img || null };
}

/** The exact JSON shape we want the model to return, per channel. */
function jsonShape(ch, spec) {
  const head = spec.headline ? "headline" : "headline";
  if (ch === "google") {
    return JSON.stringify(
      {
        variants: [
          {
            headlines: ["≤30 chars", "≤30 chars", "≤30 chars (provide up to 15)"],
            descriptions: ["≤90 chars", "≤90 chars (provide up to 4)"],
            paths: ["≤15", "≤15"],
          },
        ],
      },
      null,
      2
    );
  }
  if (ch === "meta") {
    return JSON.stringify(
      {
        variants: [
          { primaryText: "≤125 ideal", headline: "≤40", description: "≤25", cta: "one of the CTA options" },
        ],
      },
      null,
      2
    );
  }
  // linkedin
  return JSON.stringify(
    {
      variants: [
        { introText: "≤150 ideal", headline: "≤70", description: "≤70", cta: "one of the CTA options" },
      ],
    },
    null,
    2
  );
}

/* ----------------------------- model call -------------------------------- */

/**
 * Call OpenAI Chat Completions via native fetch. Returns parsed JSON copy.
 * Injectable `fetchImpl` keeps this unit-testable without a real network.
 */
export async function generateCopy(prompt, {
  apiKey = process.env.OPENAI_API_KEY,
  model = "gpt-4o-mini",
  fetchImpl = globalThis.fetch,
} = {}) {
  if (!apiKey) {
    const err = new Error("OPENAI_API_KEY not set");
    err.code = "NO_KEY";
    throw err;
  }
  const res = await fetchImpl("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.8,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenAI ${res.status}: ${text.slice(0, 500)}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(content);
  } catch {
    return { raw: content };
  }
}

/* ----------------------------- presentation ------------------------------ */

function renderPromptForHuman(prompt) {
  const bar = "─".repeat(64);
  return [
    bar,
    `PROMPT GOBLIN — assembled ${prompt.channel.toUpperCase()} copy prompt`,
    `(no OPENAI_API_KEY / --dry-run: paste this into Claude Design, Gemini, or ChatGPT)`,
    bar,
    `[SYSTEM]`,
    prompt.system,
    ``,
    `[USER]`,
    prompt.user,
    bar,
    prompt.image
      ? `Paired image: ${prompt.image.ratio} (${prompt.image.px}). See prompts.md for the brand-locked image prompt + logo-compositing step.`
      : ``,
  ].join("\n");
}

/* ------------------------------- main ------------------------------------ */

const HELP = `Prompt Goblin ad-copy generator

  node generate.mjs --channel <linkedin|google|meta> --angle "<angle>" [opts]

Options:
  --audience  gov | commercial   (default: gov)
  --variants  N                  (default: 3)
  --dry-run                      print assembled prompt; no network
  --json                         emit JSON
  --model     <id>               (default: gpt-4o-mini)
  -h, --help                     this help
`;

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error("✕ " + e.message + "\n");
    console.error(HELP);
    process.exit(2);
  }
  if (args.help) {
    console.log(HELP);
    return;
  }
  if (!args.channel || !args.angle) {
    console.error("✕ --channel and --angle are required.\n");
    console.error(HELP);
    process.exit(2);
  }

  const brand = await loadBrand();
  let prompt;
  try {
    prompt = assemblePrompt(brand, args);
  } catch (e) {
    console.error("✕ " + e.message);
    process.exit(2);
  }

  const haveKey = !!process.env.OPENAI_API_KEY;

  // Dry-run OR no key -> print the assembled prompt for a human to paste.
  if (args.dryRun || !haveKey) {
    if (!args.dryRun && !haveKey) {
      console.error(
        "ℹ OPENAI_API_KEY not set — printing the assembled prompt instead of calling the model.\n" +
        "  Paste it into Claude Design / Gemini / ChatGPT, or set the key to auto-generate.\n"
      );
    }
    if (args.json) {
      console.log(JSON.stringify({ mode: "prompt-only", ...prompt }, null, 2));
    } else {
      console.log(renderPromptForHuman(prompt));
    }
    return;
  }

  // Live generation.
  try {
    const copy = await generateCopy(prompt, { model: args.model });
    if (args.json) {
      console.log(JSON.stringify({ mode: "generated", channel: prompt.channel, copy }, null, 2));
    } else {
      console.log(`✓ ${prompt.channel.toUpperCase()} copy — angle: "${args.angle}" — audience: ${args.audience}\n`);
      console.log(JSON.stringify(copy, null, 2));
      if (prompt.image) {
        console.log(
          `\nPaired image: ${prompt.image.ratio} (${prompt.image.px}). ` +
          `Generate it from prompts.md (brand-locked image prompt + real goblin-head composite).`
        );
      }
    }
  } catch (e) {
    if (e.code === "NO_KEY") {
      console.error("✕ OPENAI_API_KEY disappeared mid-run.");
    } else {
      console.error("✕ generation failed: " + e.message);
      console.error("  Falling back — here is the prompt to run by hand:\n");
      console.error(renderPromptForHuman(prompt));
    }
    process.exit(1);
  }
}

// Only run main() when executed directly, not when imported by the test.
const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((e) => {
    console.error("✕ " + (e?.stack || e));
    process.exit(1);
  });
}
