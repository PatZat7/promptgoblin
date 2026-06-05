# Prompt Goblin — next batch (queued 2026-06-04, before /compact)

> Fold into PLAN.md. Captured so it survives compaction.

## Working-tree state (IMPORTANT)
- **LIVE (deployed, clusters 1+2):** hero `./free_scan` primary CTA, loader hardening, dead `./work` nav removed, numbered panel marks dropped.
- **UNCOMMITTED in working tree (local dev only):**
  - **cluster 3** (FAQ section, em-dash sweep, Hero jargon cleanup) — integrity-approved.
  - **techStack feature** (Codex-built: `functions/lib/hygiene.js` detection, `scan-api.ts`, LiveScan techStack field, ScanResult stack card; 56 tests pass).
  - **scan section v2** (this session: moved above the fold, full-bleed, terminal-on-top, simplified form, pop-in tech-stack icons via `TechIcon.tsx`).
- Nothing from cluster 3 / techStack / scan-v2 is committed or deployed yet. Decide commit/deploy strategy (entangled in `LiveScan*`).

## Asks from the owner (this batch)
1. **"Talk to a goblin" → modal, not mailto.** REVERTED per owner (2026-06-04). Was built (native `<dialog>` modal, integrity- + axe-approved) then undone at owner request; `Pricing.tsx` is back to `mailto:goblins@promptgoblin.com`. Still open if revisited.
2. ~~**Brand the report emails + logo.**~~ **DONE + KEPT** (2026-06-04). `email-templates/scan-report.html` (table-based, inline-styled, dark+lime) + `email-templates/README.md` (placeholder map + honest-broker rules + SPA-guard). Logo at `web/public/promptgoblinlogo.png` → hosts at `promptgoblin.io/promptgoblinlogo.png` on next deploy. Rendered + integrity-approved. Report emails go out by hand for now (static site = no server email); template is paste-ready. **This is the one piece the owner kept.**
3. **Reduce copy, dead-simple.** REVERTED per owner (2026-06-04). Built (12→7 sections, hero trim) then undone; page is back to all 12 sections and the original hero. Still open if revisited (Research B checklist below).
4. **Surface agentic + human-reviewed.** REVERTED per owner (2026-06-04). Built (plain 1→2→3 ladder, featured Step 3) then undone; `HowItWorks` is back to the engine-diagram version. Still open.
5. **Tier 3.** REVERTED per owner (2026-06-04). The 1→2→3 ladder framing was undone with #3/#4. Owner's earlier decision was "reframe as ladder, no new price tier" — re-confirm if revisited.

## This session (2026-06-04)
- **KEPT:** the branded scan-report email (ask #2) — `email-templates/` + `web/public/promptgoblinlogo.png`.
- **REVERTED at owner request** ("the scan report is good but undo everything else"): the modal (ask #1), the section cuts + hero trim (#3), the how-it-works 1→2→3 ladder (#4/#5), and the duplicate-`id="top"` fix. All site source files restored to their pre-session (uncommitted) state; `TalkModal.*` deleted. Typecheck + lint clean; verified on :3000 (12 sections back, mailto back, original hero).
- Pre-session work is untouched: cluster 3 (Faq, em-dash sweep), techStack feature, scan-v2 redesign.
- **NEW — real tech-stack detection + brand-icon library:**
  - `functions/lib/hygiene.js detectTechStack` rewritten: parses `<meta name="generator">` + ~25 HTML fingerprints (Next, Nuxt, Remix, Astro, SvelteKit, Gatsby, Angular, Vue, WordPress, WooCommerce, Shopify, BigCommerce, Magento, PrestaShop, Webflow, Wix, Squarespace, Framer, Drupal, Joomla, HubSpot, Bootstrap, Tailwind, jQuery, React, Vite), drops bare React/Vite when a specific framework is found. `functions/test/scan.test.js`: +6 tests → **62 pass**.
  - Installed `simple-icons` (devDependency, build-only) → `web/scripts/gen-tech-icons.mjs` generates `web/components/sections/LiveScan/tech-icons.data.ts` (54 curated brand icons: path + official hex + match keywords). Re-run: `node scripts/gen-tech-icons.mjs`.
  - `TechIcon.tsx` rewritten to render real brand glyphs in brand color, with a luminance fallback to lime for near-black marks (Next/Vercel/Notion/Express) and a generic `</>` for unknowns. `MONOCHROME` const flips to all-lime if the brand colors ever feel off-brand. Verified every icon renders; `npm run build` green.
  - **To go live:** the detected-stack list comes from the deployed Tier-1 function, so the expanded detection needs `doctl serverless deploy functions --remote-build` (owner-gated deploy). The brand icons + entered-stack path already work client-side.
- **Scan layout reverted to original** (owner: "go back to the Original Goblin Scan Layout"): restored the side-by-side terminal + form in a contained `grid-lines` panel (`.grid` 1.4fr/1fr) + the 4-item checklist; dropped the v2 full-bleed / terminal-on-top. **Kept** the tech-stack feature (the `techStack` input, detection, brand icons, result card). Only `LiveScan.tsx` (3 edits) + `LiveScan.module.css` (3 rule-blocks) touched; all card styles preserved. Verified on :3000 (grid 2-col, contained, checklist + tech-stack input present). Note: a pre-existing eslint flag in the idle-reveal effect (`setLines([])` in useEffect) exists in the committed baseline too — not introduced here; `next build` doesn't run eslint.

## Remaining / owner's call
- **Commit/deploy strategy** for the uncommitted tree (cluster 3 + techStack + scan-v2 + the new email) — still undecided. Nothing auto-deploys.
- The simplification asks (#1, #3, #4, #5) remain open if the owner wants them later — Research A/B below still apply.

## Research dispatched (background, read-only `researcher` agents)
- **A — competitor + tier-3 intel:** landscape, how rivals package audit→fix→monitor, concrete tier-3 options + price anchoring, plain-language "agentic+human" messaging.
- **B — uncluttered tech-company layouts:** Linear/Vercel/Stripe/Raycast/etc. — concrete checklist to simplify the site for non-technical readers.

## Other open items
- Detected-stack icons need the DO Tier-1 functions **redeployed** (techStack detection only returns from the live endpoint after deploy). Entered-stack icon already works.
- **Systemic SWC space bug:** `<b>x</b> word` and `{expr} word` drop the inter-word space here; needs explicit `{" "}`. Fixed so far: scan-result email, scan disclaimer. **Sweep the rest** (any `</b> `/`</em> ` followed by a word that wraps).
- Earlier-noted: `services.data.ts` "~57%" figure — attribute before it fronts a prospect. PLAN.md / CLAUDE.md still describe the old SPA (stale post-cutover).

## Research B — uncluttered-layout findings (Linear/Vercel/Stripe/Raycast/Framer/Supabase/Clerk/Mintlify/Resend)
Benchmarks: reference heroes = 3–11 word headlines + 20–40 words above the fold + 6–9 sections. Prompt Goblin today = 6-word h1 across 3 lines + ~120 words above the fold + **12 sections**.

**CRITICAL (hurts non-technical comprehension):**
1. **Hero → one headline (≤6 words) + one ~15-word sentence + one CTA.** Today ~120 words above fold. The "When an AI names the best in your category…" note is a stronger hero line than the current h1 — consider promoting it.
2. **Kill the ASCII terminal chrome as the primary hero visual** (win-bar, coord noise, `mascot.exe` caption = 20–30% of hero weight, illegible to non-tech). Keep the goblin character; drop/shrink the faux-terminal frame.
3. **Remove IndexNow `// now` section** (founder-status block reads as a personal dev site; zero conversion function) — or move to an About page.
4. **Merge or cut Stats + Marquee** (two social-proof sections with no real metrics = noise; if no real numbers, omit — don't fake credibility with a ticker).
5. **Merge HowItWorks + GoblinMesh into ONE "how it works"** (3 named steps, ~15 words each; one metaphor). Two consecutive process sections confuse non-tech buyers.

**HIGH:**
6. **12 → 6–7 sections.** Target: Hero · Services(Spellbook) · How-it-works(merged, 3 steps) · LiveScan demo · Pricing · Contact+FAQ(merged).
7. **Add plain descriptors to goblin tier names** in pricing/services ("Scout — one-time audit", "Warband — monthly retainer"). Fantasy names alone force decoding before comparison.
8. **Strip `$ goblin --x` command labels** from section headers (reads as noise, not polish).
9. **Cut HowItWorks copy ~60%**; drop the "'RAG pipeline'/'CI/CD eval gate' are the accurate names…" meta-commentary (a tell it's written for a skeptic who'll question jargon). Outcomes, not process.
10. **Pricing: trim to name + who + price + one sentence + CTA** (drop the 5-bullet lists; ~200 words), or move to /pricing.

**MEDIUM:** 3 type levels only (not ~13); section padding ~80–120px (more whitespace); one focal point above the fold.

**KEEP (confirmed good):** the goblin character; LiveScan demo early (strongest conversion section); visible pricing (differentiator for a solo shop); 3-card services concept; a short 4–6 FAQ.

→ This directly serves asks #3 (cut copy), #4 (surface "agentic+human" simply via a single 3-step how-it-works), and #6 layout. Tier-3 (#5) + competitor framing pending Research A.

## Research A — competitors + Tier 3 (sourced; some prices are vendor-claim, treat as directional)
**Landscape (3 layers, none covers all 3 pillars like PG):**
- AEO/GEO SaaS tools = *measure only, no fixes*: Otterly $29/mo, AthenaHQ $95/mo, Scrunch $250/mo, Profound $499/mo, Semrush AIO ~$120–450/mo, BrightEdge custom.
- Full-service AEO agencies: Minuttia ~$4–5K/mo (audit only), LoudFace $5–18K, OGTool $8K, Omniscient $10–15K, NoGood $15–25K, iPullRank $20K+, First Page Sage $20–60K, Amsive $30–80K. (Upper bounds partly uncorroborated/vendor-promo — do NOT cite as fact.)
- Tech-SEO agencies: WebFX $3–20K+, Directive $7–30K+ (Tier-3 = 200+ hrs/mo dedicated eng), Conductor platform+services.
- A11y shops (siloed): DigitalA11Y ($100–350/page, $800/mo), AudioEye, Level Access $150–300K/yr.
- **GAP PG fills:** no mid-market ($5–25K/mo) player combines AEO/GEO + tech-SEO + WCAG/508 with agentic scan + human-reviewed, stack-mapped fix delivery. Genuinely differentiated.

**Tier-3 options (above Warlord $12.5K/mo):**
- **A. Embedded Operator / "Fractional GEO Director"** — roadmap ownership, weekly sync, direct Slack, priority SLA. ~$18–28K/mo. **RECOMMENDED** (solo-operator credibility is the asset; sells accountability not report volume).
- **C. Always-On / SLA tier** — response-time SLA (NOT a citation-outcome guarantee → honest-broker), on-deploy re-runs, incident response. ~$20–30K/mo. **RECOMMENDED** (no one packages this).
- B. Portfolio / multi-entity (3–5 brands, shared entity graph) ~$20–35K/mo — natural Warlord evolution.
- D. Enterprise Launch + Handoff sprint (90–120 days, build-to-own) ~$35–65K flat — converts to retainer.
→ Lead Tier 3 with **A** (embedded) or **C** (always-on SLA).

**"Agentic + human-reviewed" messaging for non-tech buyers (ask #4):**
- Lead with the BUYER's AI behavior, not our process: "Your customers ask ChatGPT/Perplexity before they visit you. We make sure you show up."
- Elevator contrast: "SEO gets you ranked. GEO gets you cited."
- Downplay automation, foreground expertise + outcome ("AI assists the work; a human owns it"; "the deliverables aren't the results — the results are").
- Make the human gate a NAMED person: "a senior engineer reviews every fix before it ships."
- Use "trust," not "algorithm."
- AVOID in top-funnel: "agentic pipeline / LLM embeddings / entity graph / schema markup / E-E-A-T."
- **Recommended PG one-liner:** "We scan your site the way AI systems do, find what's blocking citations and compliance, and a senior human reviews every fix before it reaches your team." (covers scan + expertise + honest scope.)
