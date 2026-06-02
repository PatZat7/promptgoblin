# Prompt Goblin — Mobile-First Redesign Brief (for Claude Design)

> **How to use this:** paste this whole file into Claude Design. Produce **two distinct directions** (A and B below). Recommended: run it **twice** — once per direction — so each gets full focus, then hand both back for evaluation. Final copy lives in `COPY_V2.md` (use it verbatim where quoted; you may coin section headers/taglines in the goblin voice). All design decisions are **mobile-first** and must pass the honest-broker + accessibility gates at the end.

---

## 0. What Prompt Goblin is (context)
A solo **AEO/GEO + technical-SEO + WCAG 2.1 AA / Section 508 accessibility** shop ("a one-goblin shop"), Chicago. It makes brands **citable by AI answer engines** (ChatGPT, Claude, Gemini, Perplexity, Google AI Overviews) and keeps them usable for humans + machines. The proof engine is a **human-reviewed, self-healing pipeline** (real, runs today). Live now: `promptgoblin.zatgeist.com`.

**Current stack:** zero-build Babel-in-browser React SPA (`app.jsx` + `index.html` + `styles.css`), React/Babel from CDN, deployed as a DigitalOcean static site (deploy-on-push). Aesthetic: 8-bit terminal × dark-fantasy/D&D, custom pixel cursor, CRT grain, light/dark theme.

**The mandate (why we're redesigning):** the current copy is **too complex** and the layout **confusing** — a normal business owner can't tell *how* they'd see improvement or get their money's worth. We want the same soul, but **minimal, clean, plain-spoken, and awwwards-level**.

---

## 1. The brief in one paragraph
Keep the 8-bit-terminal × dark-fantasy/D&D soul, the logo, and the pixel cursor. **Simplify the layout** (more negative space, fewer competing elements, one "wow" moment, not ten). **Rewrite to plain language** (see `COPY_V2.md`) so a non-technical owner instantly gets *what they get, how it works, and how they'll see it working*. **Explain the engine** — one self-healing pipeline with **bounded self-healing loops** (a self-correcting retrieval loop, plus per-discipline verify→heal→re-verify strands — SEO and accessibility proven by the eval gate today; schema scaffolded), a **CI/CD eval gate** that goes red on regression, and a **human approves every change** step — using an **original animated diagram**, not a flowchart. **Add public-sector proof.** Make it **awwwards-tier** with purposeful animation. And design a **user account login + dashboard**. All **mobile-first**, all **WCAG 2.1 AA**.

---

## 2. KEEP (the owner explicitly loves these — do not lose them)
- **The Goblin logo** (`GoblinHead` SVG / `goblin-logo.jsx`). It's the brand. Make it a hero.
- **The pixel-block custom cursor** + the lime hover label (`./exec`, `./open`). Keep, refine.
- **The terminal × dark-fantasy aesthetic** — HUD chrome, mono + pixel fonts, lime-on-near-black, the "spellbook/scroll/summon" D&D vocabulary. This is the differentiator; don't flatten it into generic SaaS.
- **The anchor tagline:** *"Get found by robots. Stay usable by humans."* (hero). And **"Visible AF."**
- **Light/dark theme toggle** (dark+lime default; "bone" light palette). Both must stay AA-clean.
- **The Visibility Mesh's RIGHT side** — the 6 plain-language step cards (Listen → Diff → Audit → Recommend → Human-review → Loop). The owner says the right side is good. **Keep the substance, simplify the words.**
- **Honest-broker voice** — wry, confident, never overclaiming.

## 3. FIX / REPLACE
- **The Visibility Mesh LEFT side** — the cryptic SVG node graph with labels like `audit.schema·seo·a11y`, `citation.weave`, `rag.retrieve k=24`. It's insider jargon. **Replace with an original, legible animated diagram** (see §6) that a buyer understands at a glance.
- **The hero "ascii-noise" blob** (`schema fragments: [...] crable AF`) — decorative noise that reads as broken text. Cut or replace with intentional motion.
- **Jargon-dense body copy** — the hero sub-note, services leads, scan disclaimers. Swap for `COPY_V2.md` plain language.
- **Section sprawl** — there are ~13 stacked panels today. **Collapse to ~7–8** (see §4). Less is the point.
- **Mobile HUD clutter** — the top/bottom status bars crowd small screens. Keep one minimal HUD; drop the rest on mobile.

---

## 4. Information architecture (the new, minimal flow)
Mobile-first vertical order (desktop may place side-by-side, but design the phone first):
1. **Hero** — tagline + one-line value + free-scan CTA + the logo as the signature moment.
2. **How it works** — the 3-loop self-healing engine, explained plainly, anchored by the animated **engine diagram** (§6b). This is the section that earns trust.
3. **Are you citable?** — the **answer-engine citability** diagram (§6a) + the free-scan CTA (live terminal scan can live here, kept, but with the "sample / enter your domain for a real scan" honesty marker).
4. **Proof** — public-sector credentials (USDA, City of Chicago, State of Texas, State of Illinois — *exact wording from `COPY_V2.md`, pending owner confirm*) + the honest dogfood baseline ("we scanned ourselves first: 0% cited").
5. **Services** — the six, condensed to scannable cards (Technical SEO · Schema · AEO · Core Web Vitals · Content · Accessibility/508).
6. **See your money's worth** — the **dashboard teaser** (the monthly scorecard / you-vs-competitor / fix-queue preview) → "you see the gap, then you watch it close."
7. **Pricing** — Scout (one-time) · Warband · Warlord, with plain value per tier + the 100% money-back-on-the-work guarantee.
8. **Summon** — contact/intake + footer (logo, "Visible AF", Chicago, links).

---

## 5. The two directions (produce BOTH)

### Direction A — "Refined Terminal" (evolve · minimal · low-risk · fastest to ship)
- Take what exists and **strip it to essentials.** Big negative space, hairline grid, one accent (lime). The terminal/HUD chrome stays but quiets down.
- **One** hero motion moment (e.g., the goblin logo assembling from pixels, or a single cursor-driven reveal). Everything else calm.
- Mesh-left → a clean **"Visibility Spectrum"**: 5 horizontal signal bars (one per engine) that fill on scroll, with a faded "before" ghost vs. solid "after." Instantly legible.
- Engine diagram → a simple 3-column animated panel (diagnose → eval gate → human-approve) with a "fix packet" that visibly **bounces back on a failed gate** (shows self-healing) and **stops at the human gate**.
- Motion: **Lenis** smooth-scroll + **Motion (motion.dev)** for component micro-interactions + CSS scroll-driven reveals. No WebGL required. Could remain near-zero-build.
- Vibe reference: Malvah / Vercel restraint, but terminal-flavored.

### Direction B — "Goblin Grimoire" (bold · cinematic · awwwards-ambitious · build-required)
- Lean **into** the dark-fantasy/D&D world. The site is a goblin's spellbook/forge for making you visible.
- **Signature WebGL hero — "The Oracle Chamber":** five glowing engine sigils (ChatGPT/Claude/Gemini/Perplexity/AIO) orbit a central prompt; on scroll, signal lines fire and the brand name **lights up inside three of the five** answer windows (before/after citability, made visceral). This is the one unforgettable moment.
- Scroll choreography with **GSAP + ScrollTrigger** (MotionPath for the orbit, SplitText for kinetic headlines). **Lenis** scroll. **Three.js** only for the hero (lazy-loaded). Optional bespoke ambient sound (muted by default, toggle).
- Spellbook → an animated **grimoire**; the engine → the **"Goblin Forge"** (three furnace columns = the three heal loops; a fix ingot drops through diagnose → eval gate → human review, bounces on a red gate, can't skip the human).
- Vibe reference: Atoll Digital (dark navy/industrial-futuristic), Lusion restraint-with-craft, Cartier alcoves.

**Both directions share:** the §4 IA, `COPY_V2.md` copy, the §6 diagrams (A = SVG/CSS/Motion; B = WebGL/GSAP), the §7 dashboard, the §8 mobile rules, the §9 a11y bar, and the §10 honest-broker rules.

---

## 6. The two unique diagrams (no generic flowcharts)

### 6a. "Are you citable?" — make the abstract concrete
Show what "AI answer-engine visibility" *means*: a buyer asks a question; five engines answer; **your brand is either named or absent.**
- **Direction A:** Visibility Spectrum — 5 engine rows, signal-meter bars, before(ghost)→after(solid), one "cited in X% of queries" readout. *(X is illustrative until a real scan — mark it.)*
- **Direction B:** Oracle Chamber (radial WebGL, described above).
- Either way: the payoff frame is **your name lighting up inside the answer.** Buyer-legible in 2 seconds.

### 6b. The engine — "self-healing, eval-gated, human-approved"
Explain the real pipeline without jargon. Two loop families: a self-correcting retrieval loop, and per-discipline verify strands. Each: **find the gap → prove the fix passes a quality gate → a human approves → ship → re-measure on a schedule.** Proven strands today: SEO and accessibility; schema rides the same machinery (scaffolded).
- **Direction A:** 3-column animated panel; a fix packet bounces on a failed gate (self-heal), halts at the human gate (nothing auto-ships), then a re-scan tick shows the delta.
- **Direction B:** The Goblin Forge — 3 furnace columns, fix ingots, red gate = bounce, locked human-review stage.
- **Truth anchor (must stay honest):** it's *one* pipeline with bounded self-healing loops (a self-correcting retrieval loop + per-discipline verify strands; SEO + accessibility proven on the eval gate 2026-06-02, schema scaffolded); the CI/CD eval gate goes **red on regression**; a human approves **every** change; we re-run on cadence and report the measured before/after delta. (Verified green 2026-06-02: 186 tests + eval PASS.) *The visual may show three discipline columns, but copy/labels must NOT claim the schema strand is eval-proven — mark it "scaffolded" or omit its pass/fail badge.*

---

## 7. User account login + dashboard (design it; ships on a real stack — see DESIGN_PLAN.md)
The client-facing product surface. Terminal-styled, mobile-first, dark default.
- **Login:** passwordless email/magic-link **or** OAuth (Google/GitHub). Minimal: logo, one field, the cursor. No password sprawl.
- **Dashboard — core views (progressive disclosure; one KPI front-and-center, drill down on demand):**
  1. **Citation scorecard** — % of sampled buyer prompts where the brand is cited, **per engine** (ChatGPT/Claude/Gemini/Perplexity/AIO), with a 30/90-day trend line.
  2. **You vs. competitor gap** — side-by-side bars (or radar) for the brand vs. 2–3 named competitors; delta since last run in green/red.
  3. **Pipeline run status** — last/next run, the **eval-gate pass/fail badge**, timestamp. (Maps to the real `rescan` loop.)
  4. **Human-gated fix queue** — cards (fix type, target engine/topic, before/after diff preview, **Approve / Reject**). A **padlock** motif reinforces: nothing ships unactioned.
  5. **Before/after deltas** — approved → deployed fixes archive with the measured movement (sample format: "[+X]% on [engine] for [topic]" — real deltas populate only after re-runs; never a pre-filled number).
- **Number styling:** tabular/monospace numerals (no layout shift on update); muted labels vs. bright active values (fits the terminal look). A `>_ CITATION: 68%` blinking-cursor treatment is on-brand *(validate with real users before committing)*.
- **Honesty:** any seeded/sample data in mockups must read as **sample** until real data is wired. The dashboard reports **movement, never attribution** ("we measured this change," never "we guarantee citations").

---

## 8. Mobile-first requirements (design the phone first)
- Lay out at **360–390px** first; desktop is the enhancement.
- **Tap targets ≥ 44×44px** (WCAG 2.5.8). The footer links + theme toggle must clear this.
- **Zero horizontal overflow** at 360px. Terminal/diagram blocks must **wrap or reflow**, never force a wider track (this bit us before — cards clipped, lines truncated).
- **Diagrams need a real mobile state** — not a shrunken desktop SVG. The Spectrum stacks; the Oracle Chamber collapses to a vertical sequence or a tap-through; the engine diagram becomes a single-column step reveal.
- Collapse the dual HUD to one slim top bar on mobile.
- Type scale legible at arm's length; Press Start 2P is chunky — reserve it for short display strings, body in JetBrains Mono.

## 9. Accessibility bar (non-negotiable — this shop sells accessibility)
- **WCAG 2.1 AA, axe-core 100/100, 0 contrast violations.** Small text ≥ 4.5:1 (current tokens: `--muted` 0.80, `--faint` 0.74 on dark — keep ratios when restyling; **axe counts ancestor `opacity`** into contrast, so don't dim text containers).
- **`prefers-reduced-motion`:** every animation has a reduced/again-static fallback. Use `gsap.matchMedia()` (Direction B) and the global CSS reduce block (set durations ~0.01ms, preserve end-state). Canvas/WebGL must pause its RAF loop and render one static frame under reduce.
- **Grain/CRT:** keep static + low-luminance; **no flashing > 3×/sec**; verify with PEAT. Don't let the grain overlay drag text contrast below AA (measure against the *rendered* background).
- Visible focus states, full keyboard nav (incl. any horizontal-scroll or tap-through diagram), `autoAlpha` (not bare opacity) for elements scrolled out so focus can't land off-screen.

## 10. Honest-broker rules (bind every word and pixel — non-negotiable)
- **No fabricated metrics, clients, testimonials, or citations.** No number that wasn't measured.
- **Schema is hygiene, NOT a citation lever.** Never imply markup earns citations. Real levers: brand mentions + Bing rank, measured over a re-run loop.
- The **dogfood baseline "0% cited" is the real, honest number** — keep it; it's a trust asset, not a weakness.
- **Public-sector credentials** must use only the owner-confirmed wording (see `COPY_V2.md` flag). Don't invent titles, dates, dollar amounts, or outcomes.
- **Nothing auto-deploys** — every change is human-reviewed. Don't depict or imply auto-shipping.
- **Illustrative/sample UI must read as illustrative.** The guarantee covers the **work**, never a citation number.

---

## 11. Design tokens to carry over (starting point — evolve, don't discard)
- **Dark (default):** bg `#0A0B0A`, panel `#0E0F0D`, ink `#E9E7DC`, accent/lime `#A3E635`, lines at 16%/30% ink. **Light ("bone"):** bg `#F4F2EC`, ink `#0A0B0A`, lime `#4d7c0f`.
- **Fonts:** Press Start 2P (display, sparingly) · VT323 (soft pixel) · JetBrains Mono (body) · Silkscreen (tiny labels).
- Hairline 1px grid, low-opacity grain, pixel cursor. Directions may extend the palette (B can add a dark-fantasy secondary), but preserve AA contrast.

## 12. Deliverables back to us (per direction)
1. **Mobile frames first** (360–390px) for all §4 sections, then desktop.
2. The **hero** + **both diagrams** (§6) shown **animated** (or with motion specs/prototype).
3. The **login + dashboard** main view (mobile + desktop).
4. A **component + token sheet** (type scale, spacing, color, states, motion timings, reduced-motion variants).
5. A short note on **stack** for that direction (A may stay near-zero-build; B needs a real build — Vite/Three.js/GSAP).
6. A runnable preview if possible.
**Then we evaluate A vs. B** on the awwwards rubric (Design 40 / Usability 30 / Creativity 20 / Content 10) + mobile + a11y + load, pick one (or graft the best of each), and implement → QA gate → ship.
