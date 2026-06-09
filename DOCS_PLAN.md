# Prompt Goblin — Documentation Plan

> Living doc. Last updated: 2026-06-06. Owner: main thread. Route all outbound artifacts through `integrity-reviewer` before publishing.

## Why this exists

Documentation does three jobs before we have a full client roster:

1. **Closes sales** — a prospect who reads the methodology doc trusts us before the DM conversation.
2. **Reduces onboarding friction** — a client who knows what to expect doesn't ask the same questions twice.
3. **Builds our own AEO authority** — publishing the methodology, benchmark data, and AEO/GEO explainers makes `promptgoblin.io` itself a citation target (the dogfood loop).

---

## Audience map

| Audience | Goal | Format | Where it lives |
|----------|------|--------|----------------|
| **Prospect** | Understand what we do and why it works before committing | Public web pages + PDF leave-behind | `/`, `/methodology`, `/faq`, `/benchmark` on the site |
| **Active client** | Know exactly what we measured, what we found, and how to apply the fixes | Delivered artifact (HTML report + AI-prompt .txt) + onboarding doc | Emailed + eventually gated in dashboard |
| **Technical evaluator / CTO** | Trust our honest-broker stance; validate the scan methodology | Technical methodology page + `llms.txt` | `/methodology` + `public/llms.txt` |
| **Internal / agent team** | Know the pipeline architecture, eval gate contract, and honest-broker rules | `CLAUDE.md`, `web/AGENTS.md`, pipeline `README`, this file | Repo |

---

## Priority 1 — Prospect-facing (blocks sales)

### 1.1 Methodology page (`/methodology`)

**What it is:** A single public page explaining what the scan measures, what each finding means, and what we don't claim.

**Covers:**
- The 4-layer scan: technical hygiene → schema → AI-visibility → accessibility
- What topical authority is and why it predicts citation (r=0.41 from the research)
- What the `recon` auto-discovery step does
- The human-review gate — every fix is reviewed before it goes to a client
- The honest-broker section: schema is hygiene, not a citation lever; no citation number is guaranteed; the refund covers the work, not a citation count

**Honest-broker requirements:**
- Do not promise specific citation outcomes
- Include the "static-fetch blind spot" disclosure (JS-rendered sites scored on what the crawler can reach)
- Never list "Product schema" as a fix for service/government sites

**Owner:** `copywriter` → `integrity-reviewer` → `implementer` (page build)
**Status:** Live; keep current as scan capabilities and report wording change.
**Priority:** High — needed before DM follow-up conversations happen

---

### 1.2 What's included per tier (`/pricing` expansion)

**What it is:** An expandable breakdown under each pricing tier (Scout/Warband/Warlord) listing exactly what deliverables are produced.

**Covers per tier:**
- Number of domains scanned
- Competitor comparison slots
- Human-review gate included or not
- Dashboard access (when live)
- Turnaround time
- Monthly rescan cadence
- AI-prompt artifact included
- Stack-specific fix snippets included

**Status:** Pricing page exists; deliverable detail is thin. Expand inline.
**Owner:** `copywriter` → `integrity-reviewer`
**Priority:** High

---

### 1.3 AEO vs. GEO explainer (`/learn/aeo-vs-geo`)

**What it is:** A short public explainer page that teaches the market the AEO/GEO distinction. The research confirms the market still conflates them. This is a citation-bait page.

**Covers:**
- AEO = optimizing for answer engines (direct answers in ChatGPT/Perplexity/Claude)
- GEO = generative engine optimization (being cited in AI-generated summaries)
- Why they differ from traditional SEO (80% of ChatGPT citations don't rank in Google's top 100)
- The zero-click crisis (CTR fell from 1.76% → 0.61% for AI Overview queries)
- What actually predicts AI citation (topical authority >> DA; direct answer in first 50 words; HTML tables; entity density)

**Honest-broker:** Cite the research sources (arXiv:2311.09735, Conductor 2026 benchmarks, ZipTie.dev). Don't inflate numbers or claim proprietary access to data we don't have.

**Owner:** `researcher` (drafts) → `copywriter` (voice) → `integrity-reviewer` → `implementer`
**Status:** Live; next pass should add the dogfood query/content map from `docs/promptgoblin-dogfood-aeo-seo-plan.md`.
**Priority:** Medium — builds authority; not a sales blocker

---

### 1.4 Citation Landscape Benchmark report (`/benchmark`)

**What it is:** Prompt Goblin's own quarterly benchmark — run the pipeline on 10–20 sample domains per vertical, publish the aggregate findings.

**Covers per vertical:** average visibility score, most common citation gaps, top structural blockers, platform distribution (ChatGPT vs Google AIO citations)

**Honest-broker requirements:**
- Clearly label the sample size and methodology
- No cherry-picking domains
- Report what the crawler can reach — disclose JS-rendered blind spots
- Label as "pipeline output as of [date]" — not a longitudinal study

**Status:** Blocked on having enough pipeline runs. Start with 5–10 domains (use the 27 leads list as a seed). Publish as a PDF + a static `/benchmark` page.
**Owner:** Main thread (pipeline runs) → `copywriter` (report copy) → `integrity-reviewer` → `implementer`
**Priority:** Medium — needed for SEO/AEO authority; produces a sales asset

---

### 1.5 FAQ page (`/faq`)

**What it is:** A dedicated FAQ route backed by the same `web/lib/faq.ts` source
as the homepage FAQ section and FAQPage JSON-LD.

**Covers:**
- What AEO/GEO means
- Schema and llms.txt as hygiene, not citation guarantees
- Pricing
- Work guarantee language

**Status:** Route added 2026-06-08. Keep answers single-sourced; add new FAQ
items in `web/lib/faq.ts` only.
**Owner:** Main thread → `integrity-reviewer` for any changed outbound copy
**Priority:** High — supports crawlable Q&A-shaped content.

---

### 1.6 Bing Webmaster Tools / IndexNow guide

**What it is:** A client/internal guide for Bing property verification, sitemap
submission, URL inspection, URL submission, and IndexNow changed-URL submission.

**Honest-broker:** Submission is for discovery and diagnostics. It is not an
indexing, ranking, or AI-citation guarantee.

**Status:** Internal guide added at `docs/bing-webmaster-tools-submission-guide.md`.
Public route `/docs/bing-webmaster-tools` is queued.
**Owner:** Main thread → `integrity-reviewer` before public/client-facing copy
**Priority:** High — handles the Bing/web-rank side of the dogfood loop.

---

## Priority 2 — Client-facing (blocks retention)

### 2.1 Client onboarding doc

**What it is:** Sent to a new client on day 1. Sets expectations for the engagement.

**Covers:**
- What we need from you (domain, competitor list if you have one, ICP segment, CMS/stack)
- What happens in week 1 (recon + Tier-1 scan + Tier-2 citation check)
- What we deliver (HTML report + AI-prompt artifact + competitor citation diff)
- The human-review gate — you approve every fix before it's implemented
- What we don't do (no auto-deploys, no guaranteed citation numbers, no SEO rank claims)
- Monthly rescan cadence and how to read the delta

**Format:** Single-page HTML email + attached PDF
**Owner:** `copywriter` → `integrity-reviewer`
**Status:** Not started
**Priority:** High once first client is signed

---

### 2.2 Scan report explainer

**What it is:** A one-page reference that explains every finding type in the HTML report.

**Covers:**
- Severity levels (HIGH/MED/LOW) and what they mean
- Finding types: citation gap, schema gap, a11y issue, hygiene issue, topical authority signal, freshness flag, third-party platform absence
- What "verified" vs "unverifiable" citation means (once the verification layer is built)
- Stack-specific fix snippets: how to read the Next.js/WordPress/Shopify/Webflow code blocks
- The AI-prompt artifact: what it is and how to use it

**Format:** Included as an appendix in the HTML report + `/docs/report-guide` (public)
**Owner:** `copywriter` (voice) + `implementer` (HTML appendix)
**Status:** Not started
**Priority:** Medium — needed before first report goes out

---

### 2.3 Fix implementation guide (per-stack)

**What it is:** Stack-specific walkthroughs for applying the top 5 fix types. Supplements the AI-prompt artifact.

**Stacks:** Next.js · WordPress · Shopify · Webflow · Squarespace · Framer · HTML/generic

**Fix types covered:**
1. Adding/correcting JSON-LD schema
2. Writing a direct-answer opening paragraph (first-50-words lift)
3. Converting prose to HTML tables (2.5x citation rate uplift)
4. Adding named entity references (15+ entities = 4.8x selection probability)
5. Freshness update cadence (especially for Finance segment clients)

**Format:** `/docs/fixes/[stack]` — public pages, SEO/AEO bait
**Owner:** `implementer` (page build) → `integrity-reviewer` (no overclaiming)
**Status:** Not started
**Priority:** Low — ship after first client engagement; use the AI-prompt artifact as the stopgap

---

## Priority 3 — Public authority content (builds `promptgoblin.io` as a citation source)

### 3.1 The fabrication crisis explainer (`/learn/ai-citation-hallucinations`)

**What it is:** A data-backed explainer on the AI citation fabrication problem.

**Key stats to include (all sourced):**
- 51% hallucination rate in independent investigations
- 12x increase in affected papers 2023→2026 (1 in 2,828 → 1 in 277)
- ~146,900 fake citations in audited open-access papers
- 206+ court cases with AI citation sanctions
- GPT-4 hallucination rate: 18–28.6%; GPT-5 with web search: ~7–8%

**Positioning:** Trust/verification is the primary differentiator. This page establishes why verification matters and positions Prompt Goblin's verification layer as the answer.

**Sources to cite:** Forbes/Columbia/Lancet study; Nature Portfolio; INRA.AI blog; arXiv:2311.09735
**Owner:** `researcher` (fact-check) → `copywriter` (voice) → `integrity-reviewer`
**Status:** Not started — depends on the citation verification layer being built first (don't publish this until the product can back the claim)

---

### 3.2 `llms.txt` — keep current

`public/llms.txt` exists and is served. Keep it updated as the scan methodology, pricing, and tier deliverables evolve. It is a first-class doc target for AI crawlers.

**Review trigger:** Any time pricing, tier structure, or pipeline capabilities change.
**Owner:** Main thread
**Status:** Current as of 2026-06-05

---

## Priority 4 — Internal / agent-team docs

These exist or are covered by existing files. Review and patch gaps as they surface.

| Doc | File | Status |
|-----|------|--------|
| Agent team roles + honest-broker code | `CLAUDE.md` | Current |
| Next.js site conventions | `web/AGENTS.md` | Current |
| Pipeline architecture + eval gate contract | `pipeline/README.md` | Needs a pass — node order + `recon` node not documented yet |
| Scan API contract (DO Functions) | `functions/README.md` | Needs creation — documents Tier-1 + Tier-2 request/response shape, SSRF guard, CORS origins |
| This documentation plan | `DOCS_PLAN.md` | This file |

---

## Work order

1. **Now:** dogfood the live scan, fix bad recon/query recommendations, and re-run before acting.
2. **Now:** public/client Bing Webmaster Tools guide route + pricing tier detail.
3. **Before first client:** `2.1 Onboarding doc` + `2.2 Scan report explainer`.
4. **Authority pages:** how to show up in ChatGPT, Bing rank and AI citations, technical SEO for AI search, accessibility SEO audit.
5. **After citation verification layer ships:** `3.1 Fabrication crisis explainer` (don't publish until the product backs it).
6. **After 10+ pipeline runs:** `1.4 Citation Landscape Benchmark` (needs data).
7. **Ongoing:** `llms.txt` + `pipeline/README` + `functions/README` patches.

---

## Honest-broker rules for all docs

- No metric that wasn't measured. All stats sourced.
- Schema/llms.txt = hygiene, never a citation lever.
- "Not a proven citation lever" must appear adjacent to any structural fix claim.
- The refund covers the *work*, never a citation count.
- Every doc that mentions AI citation rates must hedge: "in independent investigations" or cite the source inline.
- `integrity-reviewer` gates every outbound doc (prospects see, clients see, public sees).
