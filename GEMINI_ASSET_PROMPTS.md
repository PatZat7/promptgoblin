# Gemini image prompts — Prompt Goblin social assets

Copy-paste prompts for **Gemini image generation** (Gemini 2.5 Flash Image / "Nano Banana", or Imagen 4) to make on-brand assets for X, LinkedIn, Substack, and stories.

## How to use
- **Paste the STYLE BLOCK (§0) + one asset prompt together.** The style block keeps every asset consistent.
- **Attach the logo as a reference image** for anything with the mascot: render `favicon.svg` (or a screenshot of the site's `GoblinHead`) to PNG and attach it, with "use the attached goblin head as the mascot — keep its exact angular wireframe shape." Gemini holds character/logo consistency from a reference.
- **Put exact in-image text in "quotes"** — Gemini renders text well, but always proofread the output (regenerate if a letter is garbled).
- **Set aspect ratio** in the prompt and via the API `aspect_ratio` param: 1:1 (square feed/avatar), 16:9 (X/LinkedIn landscape), 3:1 (X header 1500×500), 4:1 (LinkedIn banner 1584×396), 9:16 (stories/Reels).
- **Iterate by editing:** generate once, then "keep everything, change only the headline to '…'" — cheaper and more consistent than re-rolling.
- **Honesty (non-negotiable):** never bake a fabricated metric into an image (no "+300% citations", no fake client logos, no invented review counts). The only real number we use is the dogfood baseline "0% cited." Stylized/illustrative UI is fine; fake data is not.

---

## §0. STYLE BLOCK (paste before every prompt)
```
Brand: "Prompt Goblin" — an AI-search-visibility shop. Visual world: 8-bit retro
terminal MEETS dark-fantasy / dungeons-and-dragons. A wry goblin mascot.
Palette: near-black background #0A0B0A and panel #0E0F0D, warm bone text #E9E7DC,
and a single electric lime accent #A3E635 used for glow, highlights, and one focal
element. High contrast, moody, confident — not cute, not corporate.
Texture: subtle CRT scanlines and fine film grain, a faint 1px hairline grid, soft
lime bloom around the focal point. Typography: chunky pixel / 8-bit display type
(like "Press Start 2P") for headlines, clean monospace (like JetBrains Mono) for
small text; crisp, legible, well-kerned. Terminal motifs welcome: a window title
bar with three dots, a blinking block cursor, ">_", "✓ ▸ ⚠" glyphs.
Mood: arcade game crossed with a hacker terminal and a spellbook. Clean negative
space; ONE focal element, not clutter. No generic AI-gradient slop, no stock
photos, no busy backgrounds.
```

---

## §1. Launch / announcement card — "Visible AF"
**Use:** pinned launch post. **Aspect:** 1:1 and 16:9.
```
[STYLE BLOCK]
Compose a square social card. Centered: the goblin mascot head (attached
reference) glowing with a soft lime rim-light, sitting inside a retro terminal
window with a title bar reading "promptgoblin — ~/launch". Beneath the mascot,
big pixel headline in two lines: "VISIBLE" / "AF." in bone white with the lime
accent on "AF.". A small monospace line under it reads "AI search visibility ·
technical SEO · accessibility". A blinking lime block cursor at the end. Dark
#0A0B0A background, scanlines, faint grid, lime bloom behind the goblin. Balanced,
lots of negative space. 1:1.
```
*Caption idea:* `the goblin is loose. we make brands citable by AI — and usable by humans. ▸ Visible AF.`

## §2. Hero tagline poster
**Use:** the anchor brand statement. **Aspect:** 16:9 or 1:1.
```
[STYLE BLOCK]
A bold typographic poster, no mascot. Huge pixel/8-bit headline filling the frame
in three stacked lines: "GET FOUND" / "BY ROBOTS." then below in lime:
"STAY USABLE BY HUMANS." Tiny monospace footer line: "promptgoblin.io". Dark
#0A0B0A field, scanlines, a single thin lime underline rule between the two
thoughts, subtle grain. Cinematic, high-contrast, confident. 16:9.
```

## §3. "Are you citable?" explainer (the citability concept)
**Use:** educational post — what AEO means. **Aspect:** 1:1 or 4:5.
```
[STYLE BLOCK]
An original diagram, NOT a flowchart. A dark radial scene: a central glowing lime
prompt node labeled "best [your category]?", with FIVE small terminal windows
arranged in an arc around it, each labeled in monospace: "ChatGPT", "Claude",
"Gemini", "Perplexity", "AI Overviews". Thin lime signal lines connect the center
to each window. Inside THREE of the windows, a highlighted lime line reads
"▸ YOUR BRAND" (lit up / cited); the other two show dim grey "— not cited" text.
Headline at top in pixel type: "WHEN AI ANSWERS — ARE YOU IN IT?". Clean, dark,
glowing, legible. 1:1.
```
*Note:* the "cited" highlight is illustrative — keep it as concept art, not a claimed result.

## §4. The engine — "self-healing, human-approved"
**Use:** "how it works" post. **Aspect:** 1:1 or 16:9.
```
[STYLE BLOCK]
An original on-brand diagram styled like a goblin's forge crossed with a CI
pipeline. Three vertical glowing "furnace" columns on a dark field, each a stacked
terminal panel. Left column labeled "1 · FIND THE GAP", middle "2 · PROVE THE FIX
(eval gate)" shown as a gate glowing lime=pass / red=fail, right "3 · HUMAN
APPROVES" shown as a small goblin reviewing a glowing scroll with a padlock icon.
A small lime "fix" token travels left-to-right, bouncing back at the red gate
(self-healing) and stopping at the padlock (nothing auto-ships). Pixel headline
top: "AUTOMATED FINDS IT. A HUMAN SHIPS IT." Dark #0A0B0A, scanlines, lime accents.
Legible monospace labels. 16:9.
```

## §5. The honest hook — "0% cited"
**Use:** contrarian/credibility post (we dogfood; honest baseline). **Aspect:** 1:1.
```
[STYLE BLOCK]
A single retro terminal window on a dark field, title bar "goblin@visibility-mesh".
Monospace lines inside, rendered crisply:
"$ goblin scan --self"
"⚠ cited by AI: 0%"
"// (so is the competitor — both invisible)"
"✓ invisibility cloak: BREAKABLE"
A blinking lime block cursor on the last line. The "0%" is large and lime. Faint
scanlines and grain, lime glow on the window edge. Confident, stark, honest. 1:1.
```
*Caption idea:* `we scanned ourselves first. 0% cited. so is the competitor. that's the honest starting line — now we close the gap, and you watch the number move. no fake metrics, ever.`

## §6. Principle / quote cards (carousel set — 4 slides, same template)
**Use:** values carousel. **Aspect:** 1:1 each. Generate one, then edit only the quote.
```
[STYLE BLOCK]
A minimalist quote card: a small goblin head glyph top-left, a thin lime corner
bracket framing the card. Centered monospace-to-pixel quote in bone white, the key
phrase in lime. Footer tag in tiny monospace: "// house rules". Dark #0A0B0A,
restrained, lots of negative space, faint grain. 1:1.
Quote text: "Schema is hygiene — NOT a citation lever."
```
Swap the quote line for the other slides (all real, honest principles):
- "Nothing auto-deploys. A human approves every change."
- "We ship the fixes — not a PDF you implement yourself."
- "We guarantee the work. Never a citation number."

## §7. Profile avatar
**Use:** X / LinkedIn / Substack avatar. **Aspect:** 1:1.
```
[STYLE BLOCK]
A clean profile avatar: the goblin mascot head (attached reference), front-facing,
centered, glowing lime rim-light on a flat near-black #0A0B0A background with a
faint single hairline grid. Bold, iconic, readable at very small sizes. No text.
Subtle grain. 1:1.
```

## §8. Header / banner
**Use:** X header (3:1, 1500×500) and LinkedIn banner (4:1, 1584×396) — generate both.
```
[STYLE BLOCK]
A wide banner. Left third: the goblin mascot head (attached reference) with lime
rim-light. Center-right: pixel headline "GET FOUND BY ROBOTS. STAY USABLE BY
HUMANS." with a small monospace subline "AEO · technical SEO · accessibility ·
Chicago". A blinking lime cursor at the end. Dark #0A0B0A field, scanlines, faint
grid, a single lime hairline rule. Wide cinematic 3:1 composition, text safely
inside the center (avatar may overlap the lower-left in profile layouts).
```

## §9. Engagement / meme goblin
**Use:** reply/engagement bait. **Aspect:** 1:1 or 4:5.
```
[STYLE BLOCK]
A characterful illustration: the goblin mascot peeking over the bottom edge of a
glowing terminal window, side-eye expression, one clawed hand on the frame. The
terminal shows a search result citing a competitor. Pixel caption across the top:
"WHEN THE AI RECOMMENDS YOUR COMPETITOR". Dark, lime accents, scanlines, dry humor
— wry not goofy. 4:5.
```

## §10. Substack / blog header (per field-note)
**Use:** essay headers (e.g. "What llms.txt is"). **Aspect:** 16:9 or 3:1.
```
[STYLE BLOCK]
A wide article header for an essay titled "WHAT IS LLMS.TXT?" — pixel headline left,
a stylized glowing lime document/scroll icon right (a scroll with ">_ llms.txt"
on it), dark #0A0B0A field, scanlines, faint grid. Editorial, calm, one focal icon.
Swap the title text per article. 16:9.
```

---

## Quick caption pairings (goblin voice — honest, no fabricated numbers)
- **§1 launch:** "the goblin is loose. we make brands citable by AI answer engines — and usable by humans. ▸ Visible AF."
- **§3 citability:** "every day, AI answers your customer's question. it names someone. is it you — or your competitor? we measure that gap, then close it."
- **§4 engine:** "automated finds the gaps. an eval gate proves the fix works. a human approves every change. then we re-run it and you watch the numbers move."
- **§5 honest hook:** "we dogfooded our own site: 0% cited. no spin. that's the starting line — and the only honest place to start."

> Reminder: any text the model bakes into an image must obey the honest-broker code — no invented metrics, clients, testimonials, or citation guarantees. The guarantee is on the work, never a number.
