---
target: homepage
total_score: 29
p0_count: 0
p1_count: 2
timestamp: 2026-06-04T18-29-53Z
slug: web-app-page-tsx
---
# Critique — Prompt Goblin homepage (`web/app/page.tsx`, live: promptgoblin.io)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Excellent in the scan terminal (live narration, %, stepper); intro loader has progress but blocks content |
| 2 | Match System / Real World | 3 | Terminal metaphor speaks fluently to the dev persona; jargon ("crable AF", "MASCOT.EXE") leaks for the SMB/gov buyer |
| 3 | User Control and Freedom | 3 | Scan/forms reset cleanly; the intro loader can't be skipped |
| 4 | Consistency and Standards | 3 | Cohesive HUD/panel system, but the `./work` nav link points at a removed section |
| 5 | Error Prevention | 3 | Forms now validate domain/email; server SSRF-guards every scan |
| 6 | Recognition Rather Than Recall | 3 | Nav + CTAs labeled; some terminal commands need interpretation |
| 7 | Flexibility and Efficiency | 3 | Keyboard-accessible, theme toggle; little power-user need on a landing |
| 8 | Aesthetic and Minimalist Design | 3 | Strong, purposeful aesthetic; minor decorative noise (glitch fragments, marquee) |
| 9 | Error Recovery | 3 | Honest scan-fail card + retry; inline form errors + email fallback |
| 10 | Help and Documentation | 2 | No surfaced FAQ, no inline definitions for AEO/GEO, thin orientation for a cold first-timer |
| **Total** | | **29/40** | **Good — solid foundation, a few real issues to close** |

## Anti-Patterns Verdict

**Does this look AI-generated? No — emphatically.** This is the brand register done right: a committed dark + lime terminal/HUD identity with a chunky pixel headline and a neon goblin mascot. Nobody mistakes it for generic SaaS cream-and-gradient. It has a POV and a sense of humor. The mono/terminal lane is legitimate here (a literal terminal-native dev brand), not a reflex.

**Deterministic scan** (`detect.mjs` on `web/out/index.html`, exit 0, 2 findings):
- `em-dash-overuse` (warning): **35 em-dashes** in body copy — an AI-cadence tell, and against the skill's no-em-dash rule.
- `numbered-section-markers` (advisory): sequence 01–06. Partly a false positive: the pipeline steps in How-it-works / the Mesh are a *real* ordered sequence (legitimate). The decorative PanelBar marks (`06` Summon, `07` Pricing) are the scaffolding tell.
- Clean on gradient text, side-stripe borders, the hero-metric template, glassmorphism, and eyebrow-on-every-section.

**Visual overlays:** none injected. The localhost-overlay flow targets local files; this is a live cross-origin deployment, so I ran the CLI detector on the built markup and inspected the live page directly instead.

## Overall Impression

Genuinely well-crafted and distinctive — the strongest asset is that it *shows the system* (a real, honest live scan) instead of asserting capability, which is exactly the trust play the audience needs. The biggest opportunity isn't the aesthetic; it's removing friction between a skeptical visitor and the proof: a multi-second loader and a below-the-fold, de-emphasized free-scan CTA both delay the one action the whole funnel depends on.

## What's Working

1. **The live scan is the design.** A real terminal that fetches the visitor's domain and streams measured findings is far more convincing than any testimonial. It embodies "show the system, not a PDF."
2. **Honest, specific copy.** "Get found by robots. Stay usable by humans." and "we measure who the answer engines actually cite" — concrete, no buzzwords, on-voice.
3. **Committed, coherent identity.** HUD bars, terminal chrome, calibrated dark+lime tokens, AA-tuned contrast. The system holds together across every section.

## Priority Issues

- **[P1] Broken `./work` nav link.** The HUD nav's `./work` targets `#work`, a section that was removed — `anchorTargetsExist` confirms `#work: false` (every other anchor resolves). Clicking it dead-ends.
  - *Why it matters:* a dead internal anchor is exactly the technical-hygiene defect this shop sells fixing. It quietly undercuts credibility for the skeptical buyer.
  - *Fix:* remove `./work` from the HUD nav (and any footer copy), or repoint it to a live section (`./services` or `./scan`).
  - *Command:* `/impeccable audit` (catch sibling broken anchors/a11y) or a direct edit.

- **[P1] The intro loader gates the first impression.** A ~7-second counting loader ("069% · INDEXING · SCHEMA VALID") blanks the page before the hero renders, and re-runs on every visit.
  - *Why it matters:* the audience is "skeptical and impatient"; a multi-second blank screen before any value prop raises bounce, especially on mobile. The whole funnel depends on them reaching the scan.
  - *Fix:* cap it at ≤1.2s, make it skippable (click / scroll / Esc), or render the hero immediately with the loader as a brief accent overlay rather than a gate.
  - *Command:* `/impeccable animate` (re-time/soften) or `/impeccable optimize`.

- **[P2] CTA hierarchy inverts the funnel.** The hero's primary (filled) button is `./summon` (the contact form — higher friction, asks for email + intent). The free scan, the stated top-of-funnel proof, is the secondary ghost button, and both sit below the fold.
  - *Why it matters:* for an audience that "converts on credibility, not adjectives," the instant, no-card proof should lead. You're routing them to the commitment ask before the proof.
  - *Fix:* make `./free_scan` the primary CTA and `./summon` secondary; pull at least one CTA into the first viewport.
  - *Command:* `/impeccable clarify` (CTA priority/labels) or a direct swap.

- **[P2] Em-dash overuse + jargon density for the secondary audience.** 35 em-dashes (detector), and heavy terminal jargon ("crable AF", "$ goblin scan --surface hygiene", "MASCOT.EXE") that delights the dev persona but reads as "not for me" to the boutique-SMB / gov-508 buyer who also has to convert.
  - *Why it matters:* half the ICP is non-technical and price-aware; if the surface signals "engineers only," they bounce before the proof.
  - *Fix:* trim em-dashes (periods/colons/commas); guarantee one fully plain-language path through the core value prop for the non-technical buyer.
  - *Command:* `/impeccable clarify`.

- **[P2] Thin orientation/help for a cold first-timer.** No surfaced FAQ (the FAQPage schema exists in markup but isn't rendered on-page), no inline definition of AEO/GEO on first use, no contextual help for the jargon.
  - *Why it matters:* Jordan (first-timer) lands cold; the how-it-works section helps, but there's no quick "what is this / what do I do" anchor.
  - *Fix:* render a compact FAQ from the existing schema; define AEO/GEO inline on first mention.
  - *Command:* `/impeccable onboard` or `/impeccable clarify`.

## Persona Red Flags

**Jordan (Confused First-Timer):** Terminal jargon with no inline definitions ("crable AF", "MASCOT.EXE", "$ goblin scan --surface hygiene"); AEO/GEO assumed known; `./work` dead-ends; no visible FAQ/help. Unclear what to do first beyond reading the big headline.

**Casey (Distracted Mobile User):** ~7s loader before any content, on every visit, un-skippable; the primary action (scan) is below the fold and de-emphasized; HUD nav links are small mono text (verify ≥44px touch targets). Heavy glow/animation, though reduced-motion is handled.

**Riley (Deliberate Stress Tester):** `./work` is a broken-link probe waiting to be found; the loader can't be bypassed; decorative "schema fragments: … 'teh' … crable AF" fake-code in the hero could read as broken/real-data ambiguity. (Scan input is now validated + SSRF-guarded — that edge is solid.)

**Morgan (project persona — skeptical, price-aware boutique-SMB owner):** The honest-broker copy + live scan are strong trust signals and land well. But the broken nav link undercuts the "we fix technical hygiene" credibility, the jargon density signals "for engineers," and pricing ($2,950 Scout) sits far down — friction up top (loader + below-fold scan) risks losing them before the proof.

## Minor Observations

- Numbered markers: keep the pipeline-step numbers (a real sequence); consider dropping the decorative PanelBar marks (`06`/`07`) the detector flagged.
- Hero right-panel "glitch" fragments ("teh", "crable AF") are atmospheric but borderline meaningless — minor tension with "show the real system."
- On a 1080p laptop the hero CTAs fall just below the fold; the big pixel headline pushes them down.

## Questions to Consider

- What if the free scan (the proof) were the hero's *primary* CTA, in the first viewport?
- Does the intro loader earn its ~7 seconds, or is it costing you the skeptical visitor before they see the value prop?
- Is the terminal-jargon density tuned for the dev persona at the expense of the SMB / gov-508 buyer who also needs to convert?
