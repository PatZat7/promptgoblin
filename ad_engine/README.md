# Prompt Goblin — Brand-Asset Ad Engine

A small, brand-locked engine for generating **on-brand ad copy** (working code) and
**brand-locked ad images** (prompt pack) for Prompt Goblin's gov-forward, honest-broker
positioning. Lives in its own directory and **touches nothing** in the live site
(`app.jsx`, `index.html`) or the `pipeline/`.

```
ad_engine/
├── brand.json          # REAL brand assets, extracted from styles.css + app.jsx + goblin-logo.jsx + sprites.jsx
├── prompts.md          # ready-to-paste prompt pack: per-channel COPY + brand-locked IMAGE prompts
├── generate.mjs        # working Node copy-generator (OpenAI via native fetch; --dry-run = no network)
├── test_generate.mjs   # offline test (no network): asserts prompt assembly + the model path
└── README.md           # this file
```

---

## Quick start

```bash
# 1. See the assembled prompt without any API key or network (safe, free):
node generate.mjs --channel linkedin --angle "Section 508 deadline" --dry-run

# 2. Auto-generate copy (needs OPENAI_API_KEY in env):
node generate.mjs --channel linkedin --angle "Section 508 deadline" --audience gov --variants 3

# 3. Run the offline test (no network):
node test_generate.mjs
```

No `npm install` — zero dependencies. Uses Node 18+ native `fetch`. (Built/tested on Node v24.)

### CLI

```
node generate.mjs --channel <linkedin|google|meta> --angle "<campaign angle>" [opts]

  --audience  gov | commercial   (default: gov — the shop is gov-forward)
  --variants  N                  (default: 3)
  --dry-run                      print the assembled prompt only; never touches the network
  --json                         machine-readable JSON output
  --model     <openai-model-id>  (default: gpt-4o-mini)
  -h, --help
```

**Behavior:**
- `OPENAI_API_KEY` set → calls OpenAI Chat Completions, returns ad copy as JSON
  (headlines / primary text / descriptions / CTAs), shaped per channel.
- No key, **or** `--dry-run` → prints the fully-assembled, brand-locked prompt for a
  human to paste into **Claude Design**, Gemini, or ChatGPT. No network either way.
- Channel aliases accepted: `li`→linkedin, `fb`/`ig`/`facebook`/`instagram`→meta, `search`→google.

Everything is seeded from `brand.json`, so copy automatically carries the right voice,
honesty guardrails, per-channel character limits, tiers/prices, and the gov/commercial pain angle.

---

## Research recommendation (June 2026)

The brief asked which 2026 stack actually supports **brand conditioning** (reference images,
palette/font locking, logo placement) and per-channel ad-copy practice. Findings:

### Image generation

| Engine | What it's for | Brand-conditioning support |
|---|---|---|
| **Gemini 2.5 Flash Image — "Nano Banana" / Nano Banana Pro** (`gemini-2.5-flash-image`; Nano Banana 2 = Gemini 3.x Flash Image) | **Recommended default for ad images**, especially poster-style ads that need **readable text inside the image**. | Up to **5–6 reference images**, multi-image fusion (composite a logo + scene), spatial/style consistency, character consistency (locks a recurring mark/avatar). Best-in-class in-image text (~85% accurate). |
| **OpenAI `gpt-image-1`** (and `gpt-image-1.5`) | Clean **style-transfer** ("keep this logo, restyle the background to the brand palette"); also drives `generate.mjs` for **copy**. | Accepts image inputs; honors explicit layout constraints ("logo top-right", "subject centered, negative space left"); strong at "keep style cues X, change content Y, no extra elements". |
| **Claude Design** (Anthropic Labs, launched Apr 17 2026; powered by Claude Opus 4.x vision) | **Editable layouts**, one-pagers, ad concepts, decks. | Reads a **`brand-guidelines.md`** (our `brand.json` doubles as this) and a design system from your codebase, then applies palette/type automatically. **Native export to Canva** as editable files (not flattened), where the brand kit composites the logo cleanly. |

**Recommended pairing for Prompt Goblin:**
1. **Nano Banana Pro** for the hero ad image (terminal scene + readable headline text), **compositing the real goblin-head PNG** as a reference.
2. **Claude Design** when you want an editable, on-brand layout you'll finish in Canva — feed it `brand.json` + the logo PNG.
3. **gpt-image-1** as the style-transfer fallback (restyle a background, keep the exact mark).
4. **Always finish in Canva/Figma**: overlay the real logo + final, legally-load-bearing copy so the mark and claims are pixel-exact.

> **Key gotcha:** none of these reliably *draws* the specific Prompt Goblin head from text. Always
> attach the exported `GoblinHead` PNG as a reference and tell the model not to redraw it
> (or use the Canva-labeling method for complex compositions). See `prompts.md` → "Logo handling".

### Ad copy (per-channel character budgets, baked into `brand.json#channels`)

| Channel | Sweet spot | Hard limits | Note |
|---|---|---|---|
| **LinkedIn** (primary) | intro ≤150, headline ≤70 | intro 600, headline 200, desc 100 | Only ~150 intro chars show above "see more". Open on the pain. Sub-70 headlines outperform. |
| **Google RSA** | — | 15 × headline ≤30, 4 × desc ≤90, 2 × path ≤15 | Spaces count. Front-load the keyword; match query intent. Text-only in search. |
| **Meta** | primary ≤125, headline ≤27 | primary 2200, headline 40, desc 25 | ~125 primary chars before "See More". Sound-off, mobile-first hook. |

**Copy principles applied:** lead with the audience's daily pain; native/tactical, not corporate;
message-match ad → landing page; match CTA aggressiveness to funnel stage.

---

## How `generate.mjs` works

1. Loads `brand.json` (single source of truth).
2. `assemblePrompt()` (pure, synchronous, exported) builds a system + user prompt that injects:
   the brand voice & personality, the **honesty guardrails** verbatim, the resolved **channel
   character limits**, the tiers/prices/guarantee, and the **gov-vs-commercial pain block** chosen
   by `--audience`. It also resolves the paired **image spec** for that channel.
3. If a key is present, `generateCopy()` POSTs to OpenAI with `response_format: json_object` and
   returns parsed JSON. `fetch` is injectable, so the test exercises this path with **no network**.
4. No key / `--dry-run` → the assembled prompt is printed for a human to paste elsewhere.

The generator is **copy-only by design.** Image generation is a prompt-pack + human-in-Canva step
(see *Automatable vs human* below), because the brand depends on compositing the exact logo and
shipping legally-careful claims — both of which we keep under human control.

---

## Automatable vs. needs a human designer

**Automatable today (this engine):**
- Assembling brand-locked, channel-correct **prompts** from a single source of truth.
- Generating **ad-copy variants** (headlines / primary text / descriptions / CTAs) within each
  platform's character budget, in-voice, with honesty guardrails enforced in the prompt.
- Producing **first-draft ad images** from `prompts.md` in Nano Banana / gpt-image-1 / Claude Design.
- Keeping every asset seeded from `brand.json`, so a palette/price/tagline change propagates.

**Needs a human (by policy and by craft):**
- **Final logo placement & lockup** — composite the real goblin-head asset; models drift if they
  redraw it. Finish in Canva/Figma.
- **The honesty review** — a human goblin runs the checklist in `prompts.md` and signs off. *Nothing
  here auto-publishes or auto-sends* (same human-in-the-loop principle as the main pipeline).
- **Accessibility of the ad itself** — alt text, caption files for video, contrast spot-check (the
  lime accent must stay off light backgrounds; on the bone theme lime darkens to `#4d7c0f`).
- **Claim verification** — any number, client reference, or "compliant" wording must be true and
  human-approved. The model is prompted against fabrication, but the human is the backstop.
- **Targeting, budgets, A/B setup, and spend** — out of scope for this engine.

---

## Honesty stance (matches the shop)

- Schema / llms.txt = **hygiene, not a citation lever** (real levers: brand mentions + Bing rank).
- Accessibility automation catches **~57%**; the rest needs a human pass — never sold as compliance-by-tool.
- **Nothing auto-deploys / auto-sends.** Human-in-the-loop, always.
- Gov outreach is **FAR/FOIA-compliant, no gifts**.
- The **100% money-back guarantee is on the work, not the algorithm.** No guaranteed citation counts.

These are enforced in the generated prompt (`brand.json#voice.honestyGuardrails` + `voice.dont`) and
re-checked by the human gate in `prompts.md`.

---

## Tests

`node test_generate.mjs` — 12 offline checks, **no network**:

- `brand.json` loads and carries the **real** extracted values (palette `#0A0B0A`/`#A3E635`/`#E9E7DC`;
  fonts Press Start 2P / VT323 / Silkscreen / JetBrains Mono; tiers 2,950 / 4,800 / 12,500; taglines).
- `parseArgs` (gov default, flag rejection) and `resolveChannel` (aliases + junk rejection).
- `assemblePrompt` for LinkedIn / Google / Meta surfaces the correct **character limits**, injects the
  **honesty guardrails** and lexicon, swaps the **gov vs commercial** pain block, resolves the image
  spec, and rejects unknown channels.
- `generateCopy` throws on missing key, **POSTs correctly to OpenAI with an injected `fetch`** (asserts
  endpoint, auth header, `json_object` format, message roles, parsed result), and surfaces non-200s.
