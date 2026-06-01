# Prompt Goblin — Ad Prompt Pack

Ready-to-paste prompts for **ad copy** and **brand-locked images**, per channel
(LinkedIn / Google / Meta), seeded from [`brand.json`](./brand.json). Every prompt
carries the **gov-forward + honest-broker + 508-deadline** angle.

All values (palette, fonts, voice, tiers/prices, taglines, the goblin-head mark)
are extracted from the live site — see `brand.json` for provenance. **Do not
hand-edit hexes/fonts here; edit `brand.json` and re-paste.**

> Recommended engines (from research, June 2026 — see [README](./README.md)):
> - **Copy** → `generate.mjs` (OpenAI), or paste the copy prompts into **Claude Design** / Gemini / ChatGPT.
> - **Images** → **Gemini 2.5 Flash Image ("Nano Banana") / Nano Banana Pro** for poster-style ads with *readable in-image text*, **OpenAI gpt-image-1** for clean style-transfer, **Claude Design** when you want editable layouts (it reads `brand.json` as a brand-guidelines file and exports to Canva).
> - **The goblin-head mark is never drawn from text — always composite the real SVG/PNG** (see "Logo handling" at the bottom).

---

## How to use this pack

1. **Copy:** run `node generate.mjs --channel <ch> --angle "<angle>"` (auto-generates if `OPENAI_API_KEY` is set; otherwise prints the prompt to paste). Or copy a block below directly.
2. **Image:** paste an IMAGE block into Nano Banana / gpt-image-1 / Claude Design, attach the **goblin-head PNG** + a **dark-theme screenshot** of the site as reference images, and set the channel aspect ratio from `brand.json#imageSpecs`.
3. **Always run the honesty checklist** (bottom) before anything ships. Nothing auto-publishes — a human goblin reviews every asset.

---

## Shared brand block (paste into any image engine first)

```
BRAND LOCK — Prompt Goblin (AI-search visibility + technical SEO + accessibility).
Aesthetic: 8-bit / terminal / dashboard. Dark, technical, irreverent. NOT corporate, NOT glossy.
Palette (use exactly):
  background #0A0B0A (near-black), panels #0E0F0D
  body/heading text #E9E7DC (bone — NOT pure white)
  ONE hero accent: lime #A3E635 (CTA, one keyword, the goblin glow) — used sparingly
  hairlines #E9E7DC at 16–30% opacity
Type (use exactly, all monospace/pixel — NO proportional sans/serif anywhere):
  Display/headline = "Press Start 2P" (chunky pixel), sentence case, set BIG
  Labels/CTA/tags  = "Silkscreen", UPPERCASE, letter-spaced
  Body/terminal    = "JetBrains Mono"
Texture: faint horizontal scanlines + ~5% film grain. Thin hairline grid. A blinking pixel cursor.
Mascot: a lime line-art GOBLIN HEAD (horned/eared, glowing eyes, fanged grin) with a soft lime glow — COMPOSITE THE PROVIDED LOGO FILE, do not invent it.
Voice cues if any text appears: terminal/CLI framing ($ goblin …), plainspoken, "Visible AF".
Reference images attached: [1] goblin-head PNG (transparent), [2] dark-theme site screenshot for palette/texture.
HONESTY: never imply a guaranteed ranking/citation count; never show fake logos, fake dashboards with invented numbers, or "100% compliant" badges.
```

---

# LINKEDIN  (primary channel — gov + B2B decision-makers)

**Format (from brand.json):** intro text aim ≤150 chars (max 600), headline aim ≤70 (max 200), description ≤70. CTAs: Learn more / Sign up / Download / Request demo. Image **1200×627 (1.91:1)** or 1080×1080.

### LinkedIn — COPY prompt (gov / 508)

```
You are the in-house copywriter for Prompt Goblin — a solo, honest-broker AI-search-visibility,
technical-SEO, and accessibility shop. Voice: terminal/8-bit, irreverent, plainspoken; a competent
dev in a CLI, never a marketer in a deck.

Write 3 LinkedIn Single Image ad variants for government / public-sector buyers.
Angle: the Section 508 / ADA Title II accessibility deadline + honest, human-verified remediation.

Lead each on a pain they feel: 508/ADA is law and audited; April-2026+ Title II deadlines for
state/local web & apps; citizens can't find services inside AI answer engines; procurement needs
documented, human-verified remediation — not a tool's PDF.

Constraints:
- intro text ≤150 chars (only ~150 show before "see more")
- headline ≤70 chars, punchy, benefit/pain-first
- description ≤70 chars
- pick a CTA from: Learn more, Sign up, Download, Request demo
- use "summon" not "contact"; you may end on "Visible AF" (sparingly)

HARD RULES: never promise a citation count or compliance-by-tool ("automation catches ~57%, the rest
needs a human pass"); schema/llms.txt are hygiene, not citation levers; nothing auto-deploys (a human
goblin reviews every change); no fabricated clients/metrics; the 100% money-back guarantee is on the
WORK, not the algorithm.

Return JSON: { "variants": [ { "introText", "headline", "description", "cta" } ] }
```

### LinkedIn — COPY prompt (commercial / AEO)

```
[Same system + rules as above.]
Write 3 LinkedIn Single Image ad variants for commercial B2B buyers.
Angle: "invisible inside ChatGPT/Perplexity/AI Overviews while competitors get cited" — sell the
citation-graph diff vs a NAMED rival, days-not-quarters speed, and a flat fee (no meter).
Same constraints + HARD RULES + JSON shape as the gov prompt.
```

### LinkedIn — IMAGE prompt (gov / 508)  — Nano Banana Pro or gpt-image-1

```
[Paste the Shared brand block first, then:]
Compose a 1200x627 (1.91:1) LinkedIn ad in the Prompt Goblin terminal aesthetic.
Scene: a dark "terminal window" card on #0A0B0A with scanlines and a hairline grid.
In the terminal, monospace ("JetBrains Mono") bone text reads like a live audit log:
  $ goblin audit --section-508 --domain agency.gov
  ▲ [HIGH] 14 WCAG 2.1 AA issues  ·  ⚠ deadline: ADA Title II
  ✓ human-verified remediation queued → reviewed PRs
One short Press Start 2P headline in bone with ONE lime (#A3E635) keyword, e.g.
  "Section 508 deadline? Get FIXABLE." (the word FIXABLE in lime)
Bottom-left lockup: the provided lime goblin-head logo + "PROMPT_GOBLIN" in Silkscreen uppercase,
and a lime CTA chip "RUN A FREE SCAN →".
Mood: government-credible but unmistakably the goblin — restrained, one screaming lime accent, soft
lime glow on the mark. No stock photos, no people, no fake .gov seals, no invented compliance badges.
Leave clean negative space top-right for the platform UI.
```

### LinkedIn — IMAGE prompt (commercial / AEO citation gap)

```
[Shared brand block, then:]
Compose a 1200x627 LinkedIn ad. Scene: a dark dashboard panel showing a "citation graph" — a sparse
node-graph where competitor nodes glow lime and a single "YOU" node is dim/unlit (the invisibility
cloak), connected by hairline edges on #0A0B0A with scanlines.
Press Start 2P headline, bone with one lime word: "Cited by ChatGPT? Your rival is. YOU aren't."
Silkscreen sub-label: "CITATION-GRAPH DIFF · 5 ANSWER ENGINES".
Bottom-left: provided goblin-head logo + "PROMPT_GOBLIN" + lime CTA chip "SEE THE GAP →".
No fabricated brand logos for the competitor — use a neutral lime node labeled "COMPETITOR".
```

---

# GOOGLE  (high-intent search — Responsive Search Ads)

**Format (from brand.json):** up to **15 headlines ≤30 chars**, up to **4 descriptions ≤90 chars**, up to **2 paths ≤15 chars**. Spaces count. Display image set: 1200×628 + 1200×1200 + 960×1200.

### Google — COPY prompt (gov + commercial RSA)

```
You are the in-house copywriter for Prompt Goblin (honest-broker AI-search visibility + technical SEO
+ accessibility). Voice: terminal/plainspoken, never corporate filler.

Write a Google Responsive Search Ads asset set targeting BOTH:
  (a) gov intent queries: "Section 508 remediation", "ADA Title II website compliance", "508 audit"
  (b) commercial intent: "AI SEO audit", "get cited by ChatGPT", "AEO agency"

Provide:
- 15 headlines, each ≤30 chars (spaces count). Front-load the keyword. Include at least:
  one with a number/proof, one with the CTA, one with "human-reviewed", one with "free scan".
- 4 descriptions, each ≤90 chars.
- 2 paths, each ≤15 chars (e.g. /508-audit, /ai-visibility).

HARD RULES: match the query intent; no guaranteed-ranking/citation-count claims; no compliance-by-tool;
"human-reviewed fixes, not a PDF"; nothing auto-deploys; no fabricated metrics.

Return JSON: { "variants": [ { "headlines": [...], "descriptions": [...], "paths": [...] } ] }
```

> Google RSA is **text-only** in search. The image prompts above (LinkedIn/Meta) feed **Google Display / Demand Gen** — generate the 1.91:1, 1:1, and 4:5 crops from `brand.json#imageSpecs.google`.

---

# META  (Facebook / Instagram — awareness + retargeting)

**Format (from brand.json):** primary text aim ≤125 chars (max 2200), headline aim ≤27–40, description ≤25. CTAs: Learn More / Sign Up / Download / Contact Us. Image **1080×1080 (1:1)** or 1080×1350 (4:5); 1080×1920 for Stories/Reels.

### Meta — COPY prompt (gov + commercial)

```
[Same system + HARD RULES as LinkedIn.]
Write 3 Meta (Facebook/Instagram) single-image ad variants. The first line is the hook (only ~125
chars show before "See More"); assume sound-off and mobile-first.
Produce one gov-angled variant (508/ADA deadline, human-verified remediation) and two commercial
(invisible in AI answers / citation-graph diff / free scan, no card).

Constraints: primaryText ≤125 ideal, headline ≤40 (feed shows ~27), description ≤25,
CTA from: Learn More, Sign Up, Download, Contact Us. Use "summon"; may end on "Visible AF".

Return JSON: { "variants": [ { "primaryText", "headline", "description", "cta" } ] }
```

### Meta — IMAGE prompt (square, mobile-first)

```
[Shared brand block, then:]
Compose a 1080x1080 (1:1) Meta ad, mobile-first, in the Prompt Goblin terminal aesthetic.
Center: a bold Press Start 2P stack in bone with ONE lime word, e.g.
  "INVISIBLE / TO / ChatGPT?" (ChatGPT in lime) — big enough to read at thumbnail size.
Background: #0A0B0A with scanlines, a faint hairline grid, and a single blinking lime pixel cursor.
Top or bottom: a one-line terminal echo in JetBrains Mono: "$ goblin scan --surface llm → 0 citations".
Bottom-left lockup: provided lime goblin-head logo + "PROMPT_GOBLIN" (Silkscreen) + lime CTA chip
"FREE SCAN →". One screaming lime accent only; everything else bone/near-black. No people, no stock,
no fake screenshots with invented numbers.
Also export a 1080x1350 (4:5) variant with the same lockup and more vertical breathing room.
```

---

## Logo handling (critical — read before generating any image)

Image models **cannot reliably draw the Prompt Goblin head from a text description** — it's a specific
line-art mark (`goblin-logo.jsx`, viewBox `0 0 502.3 360.6`). Always **composite the real asset**:

1. Export the `GoblinHead` SVG to a **1024×1024 transparent PNG**, lime `#A3E635` fill (and a white/dark variant).
2. **Nano Banana / Nano Banana Pro:** attach the PNG as a reference image; instruct "place the provided logo bottom-left, do not redraw it." For tricky multi-element layouts use the **Canva-labeling method** (lay out logo + CTA + headline in Canva, export one labeled frame, then ask the model to render *around* it) — research shows this takes multi-object placement from ~90% failure to near-100%.
3. **gpt-image-1:** pass the PNG as an input image and use style-transfer phrasing ("keep this logo exactly; restyle only the background to the brand palette").
4. **Claude Design:** attach `brand.json` (it reads it as a brand-guidelines file) **and** the logo PNG; it applies palette/type and exports editable files to Canva where the brand kit composites the mark cleanly.
5. **Safest for production:** generate the *background/headline* with AI, then **overlay the real logo + final copy in Canva/Figma** so the mark and the legally-load-bearing copy are pixel-exact.

---

## Honesty checklist (run on every generated asset — gate before ship)

- [ ] No guaranteed ranking or citation-count claim. (We measure deltas; we don't promise numbers.)
- [ ] Schema / llms.txt not framed as a "citation lever" — they're hygiene.
- [ ] Accessibility not sold as compliance-by-tool — automation catches ~57%, human pass for the rest.
- [ ] Nothing implies auto-deploy/auto-send — human-in-the-loop is stated or implied.
- [ ] No fabricated clients, testimonials, logos, dashboards, or .gov seals.
- [ ] Guarantee, if shown, is "on the work, not the algorithm."
- [ ] Gov creative: no gifts/inducements; FAR/FOIA-appropriate tone.
- [ ] Palette/type/logo match `brand.json` exactly (lime is the *only* hero accent; text is bone, not white).
- [ ] A human goblin has reviewed it. (Nothing here auto-publishes.)
