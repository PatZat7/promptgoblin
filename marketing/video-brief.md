# Prompt Goblin — Short Video Brief (15–30s loop)

> A vertical, looping spot for TikTok / Reels / Shorts built on the existing shimmer orb (`assetgen/shimmer-orb.html`). Terminal-dark, minimal, goblin-coded. Honest-broker: positioning only — no metrics on screen, no guaranteed citation numbers.

## Concept

A search prompt is typed into a terminal. The dot-matrix shimmer orb "thinks," then resolves into the brand line. The payoff: when the answer engine speaks, **your name is in it.** The whole thing reads like watching an AI compose an answer — on brand for what we actually do.

Working title: **"In the Answer."**

## Look & feel

- Background `#0b0f08` (terminal dark). Brand lime `#a7ee39` for accents only.
- Font: JetBrains Mono (body/terminal), Silkscreen/Press Start 2P for the pixel kicker.
- Shimmer orb kept subtle — peak ~35% alpha, never the hero. Lots of negative space.
- Optional: faint scanline / CRT grain at very low opacity. Blinking lime block cursor.
- Motion is calm and confident — no frantic cuts.

## Timeline (≈18s, loops cleanly)

| Time | On screen | Motion / audio |
|---|---|---|
| 0.0–3.0s | Terminal prompt types: `> best [your category]?` | cursor blinks; soft key clicks; orb dim in bg |
| 3.0–7.0s | Orb shimmers / "thinks"; faint lines of answer text scroll up behind | low synth swell; dots twinkle up toward ~35% |
| 7.0–11.0s | Headline resolves: **Cited by AI** (lime accent) | orb settles; single bass hit on resolve |
| 11.0–15.0s | Sub: `get found by robots. stay usable by humans.` | gentle fade-in; cursor blink |
| 15.0–18.0s | `promptgoblin.io` + `free visibility scan` | quiet hold; orb dims back to opening state → seamless loop |

**Loop seam:** end frame matches the 0.0s dim-orb state so it repeats without a visible cut.

## Text overlays (minimal — ≤3 words per beat)

1. `> best [your category]?` (typed)
2. **Cited by AI**
3. get found by robots. stay usable by humans.
4. promptgoblin.io · free visibility scan

## Variations

- Swap the headline per audience: **Visible AF** (TikTok), **AI search visibility** (LinkedIn cut), **Get cited.** (Story).
- 15s cut: trim the "thinking" beat to ~2s.

## Production options

- **Fastest:** screen-record `assetgen/social-tiktok.html` with the shimmer running, then add the typed-prompt beat + audio in CapCut/Premiere.
- **Cleaner:** rebuild the timeline as a single HTML canvas animation (extend the shimmer file with a typed-prompt intro + headline resolve) and screen-capture at 1080×1920.

## Export specs

- Resolution: **1080×1920** (9:16)
- Codec: **H.264** (MP4), high profile
- Frame rate: **30fps**
- Duration: 15–18s, seamless loop
- Bitrate: ~10–12 Mbps; audio AAC 128kbps (or silent — many feeds autoplay muted; keep it readable without sound)
- Captions: burn in the text overlays (don't rely on platform captions)
