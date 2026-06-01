<!--
  Prompt Goblin — Government Capability Statement (1-pager)
  ========================================================
  This is the standard 1-page doc contracting officers (COs) and agency buyers
  ask for. Fill in every [TODO: ...] placeholder before you send it. Items NOT
  marked TODO are REAL and verifiable today (pipeline, tooling, positioning).

  Legend used throughout:
    [TODO: ...]  -> you must supply this; do NOT fabricate (UEI, CAGE, past perf).
    (REAL)       -> grounded in the actual product/repo; safe to state as fact.

  Print/export: this reads cleanly as Markdown; for a PDF/Word 1-pager, paste
  into your editor of choice (or `pandoc capability-statement.md -o cap.pdf`).
  Keep it to ONE page when rendered — trim the longest competency bullets first.
-->

# PROMPT GOBLIN — CAPABILITY STATEMENT

**Get found by robots. Stay usable by humans.**
Accessibility (Section 508 / WCAG 2.1 AA) · AI-Search Visibility (AEO/GEO) · Technical SEO

---

## COMPANY SNAPSHOT

| | |
|---|---|
| **Legal / DBA name** | [TODO: legal entity name, e.g. "Prompt Goblin LLC" or sole-prop name] — *trade name "Prompt Goblin"* |
| **Location** | Chicago, IL, USA (REAL) |
| **Business type** | Solo / micro-business; independent specialist shop (REAL) |
| **UEI (SAM.gov)** | [TODO: 12-char Unique Entity ID — register free at SAM.gov; **do not invent**] |
| **CAGE Code** | [TODO: assigned automatically during SAM.gov registration] |
| **DUNS** | n/a — DUNS was retired April 2022; UEI replaces it |
| **Point of contact** | [TODO: contact name] · hi@promptgoblin.io (REAL) · promptgoblin.zatgeist.com (REAL) |
| **Small-business status** | [TODO: confirm SBA size standard — see set-aside note below] |

> **Who we are (REAL):** A one-person Chicago shop that makes organizations
> *usable by people on assistive technology* and *findable by both search and AI
> answer engines* — using an auditable, human-reviewed automation pipeline.
> Nothing we ship is auto-deployed; a human reviews every change.

---

## CORE COMPETENCIES

**1. Section 508 / WCAG 2.1 AA Accessibility Audits & Remediation (REAL)**
- Two-layer automated audit: (a) a static-HTML pre-screen (missing `alt`,
  heading order, `lang`, form labels, landmarks, link text, focus order) and
  (b) a **stateful axe-core + headless-Chromium auditor** that drives a page
  into each real component state — collapsed/expanded, dialogs open/closed,
  tabs switched, empty-vs-validation-error forms — and re-runs axe in every
  state, surfacing violations a single-snapshot scan misses (color contrast,
  computed ARIA, focus, target size).
- **Honest coverage statement, always attached:** automated tooling catches
  roughly **57% of WCAG success criteria** (Deque benchmark); the remaining
  ~43% — meaningful alt-text, reading/focus order, custom-widget keyboard
  operation — requires a **human expert pass**. We never certify conformance
  from a tool alone.
- Output is a prioritized, **human-reviewed remediation backlog** with
  paste-ready, agent-executable fix prompts (rule, the state that hid it, WCAG
  ref, offending selectors, the fix, and an acceptance check).

**2. AI-Search Visibility — Answer-Engine / Generative-Engine Optimization (AEO/GEO) (REAL)**
- Measure whether your domain (vs. named competitors) is **cited inside AI
  answers** — ChatGPT, Claude, Gemini, Perplexity, Google AI Overviews — not
  just ranked in blue links.
- A typed **LangGraph** pipeline: `listen → retrieve → citation_diff →
  schema_audit → content_audit → seo_audit → a11y_audit → community_audit →
  recommend → [human review] → ship`. Every scan persists a diffable
  share-of-citations snapshot; a weekly **re-scan diff** reports measured
  before/after movement — honestly, including regressions.

**3. Technical SEO & Structured Data (REAL)**
- Crawlability (robots, sitemaps, canonicals, indexation), JSON-LD / schema.org
  entity coverage, Core Web Vitals (LCP/CLS/INP), and information architecture —
  the same semantic fixes that serve crawlers also serve assistive technology.

---

## DIFFERENTIATORS

- **Human-reviewed agentic loop (REAL).** An auditable LangGraph workflow does
  the heavy lifting, but it **pauses at a hard human-review gate** before
  anything ships. Nothing auto-deploys. Every recommendation is traceable to a
  reproducible finding.
- **Honest broker (REAL).** We separate *hygiene* (schema, `llms.txt`,
  crawlability — table stakes) from *proven levers* (brand mentions, search
  rank) and say so in writing. We do not sell "ran-a-tool = compliant," and we
  do not manufacture urgency or fabricate metrics.
- **Measured before/after delta (REAL).** Value is proven by a tracked KPI
  across weekly re-scans, not a one-time assertion. Deltas can be negative and
  are reported plainly.
- **Days, not quarters (REAL).** A solo, senior operator means a fixed audit
  ships in days; remediation flows continuously, not on an agency release train.

---

## THE LEGAL DRIVER (why this is a budgeted requirement, not a nice-to-have)

- **Section 508 of the Rehabilitation Act** requires federal ICT — including
  public websites and digital content — to conform to the Revised 508 Standards
  (which incorporate **WCAG 2.0 Level AA**), and it extends to vendors who
  develop or maintain that content. *(Federal ICT obligation in force.)*
- **ADA Title II — DOJ web rule (2024).** State and local government web
  content and mobile apps must meet **WCAG 2.1 Level AA**. Compliance dates are
  **April 24, 2027** (public entities serving a population of 50,000+) and
  **April 26, 2028** (smaller entities and special-district governments).
- These deadlines convert accessibility from optional to **mandatory and
  funded** — and pair naturally with AI-search visibility, since the same
  semantic, machine-readable structure serves both screen readers and crawlers.

> *Note: this statement describes statutory drivers in plain terms; it is not
> legal advice. Verify current compliance dates and applicability for your
> entity.*

---

## CODES & CLASSIFICATIONS

**NAICS (verified — primary listed first):**

| Code | Title | Use for |
|---|---|---|
| **541519** | Other Computer Related Services | **Primary** — Section 508 / WCAG accessibility audits & remediation (the common federal classification for accessibility/508 work) |
| **541511** | Custom Computer Programming Services | Remediation code changes, fix implementation |
| **541512** | Computer Systems Design Services | Technical audits, IA, structured-data engineering |
| **541613** | Marketing Consulting Services | AI-search visibility / AEO / SEO strategy |
| **541990** | All Other Professional, Scientific, and Technical Services | Catch-all / mixed-scope engagements |

> **Verification note (REAL):** The brief's draft list (541511 / 541512 /
> 541990) is valid, but **541519 "Other Computer Related Services" is the more
> precise primary for accessibility/508 services** and is what GSA/SBA buyers
> expect to see for this work; the SEO/AEO side maps most cleanly to a marketing
> code (**541613**). Pick **one** primary NAICS in SAM.gov (drives your size
> standard) and list the rest as additional codes. **Confirm the final set
> against your actual scope before registering.**

**Product/Service Codes (PSC) — typical for these buys:** `DA10` / `D399`
(IT & telecom – other), `R408` (program management/support), `R701`
(advertising/marketing). [TODO: confirm the PSCs your target solicitations use.]

**GSA contract vehicle (path, not a held award):** GSA Multiple Award Schedule
(MAS), **SIN 54151S — Information Technology Professional Services** (the IT
professional-services SIN that covers accessibility/508 work). [TODO: not yet
on Schedule — see README for the steps.]

---

## CONTRACT / REGISTRATION READINESS  *(status — fill in as you complete each)*

| Item | Status |
|---|---|
| SAM.gov active registration + UEI | [TODO: not yet registered — free; required to be paid/awarded] |
| CAGE Code | [TODO: issued during SAM.gov registration] |
| GSA MAS Schedule (SIN 54151S) | [TODO: not yet on Schedule — open-market / micro-purchase eligible meanwhile] |
| SBA small-business / set-aside certifications | [TODO: evaluate eligibility — 8(a), WOSB/EDWOSB, SDVOSB, HUBZone — none claimed unless/until certified] |
| Set-aside readiness | Eligible to pursue **micro-purchase** (≤ $10,000) and **simplified-acquisition** work, and to respond to **Sources Sought / RFIs**, without a Schedule. [TODO: confirm thresholds.] |

> **Honesty (REAL — do not edit away):** We claim **no UEI, CAGE, certifications,
> clients, or contract history** that do not exist. The items above are
> readiness placeholders. **Past performance:** none in government yet — we lead
> with a **documented dogfood case study** (below) and a **free, no-obligation
> pilot scan** in lieu of references. See `README.md`.

---

## PROOF IN LIEU OF PAST PERFORMANCE (REAL)

- **Dogfood case study.** We ran our own stateful axe-core auditor against our
  live site (`promptgoblin.zatgeist.com`): automated score **96/100** with **1
  serious `color-contrast` violation across 14 elements** — a real, render-
  dependent finding that a static HTML scan cannot detect, then queued for a
  human-reviewed fix. We test on ourselves before we sell the service.
- **Reproducible, transparent tooling.** The audit pipeline runs deterministically
  with zero API keys for demos, ships a full automated test suite, and every
  finding cites its WCAG criterion — so an agency can verify our claims, not
  take them on faith.
- **Compliant outreach by design.** Our public-sector engine cites only
  reproducible findings, stamps every contact as a FOIA-able public record,
  offers nothing of value (FAR 3.104 / 5 CFR 2635), and never auto-sends.

---

## CAPABILITIES AT A GLANCE (engagement tiers — REAL)

- **Goblin Scout** — one-time audit: full accessibility (static + stateful
  axe-core) pre-screen, AI-citation/competitor diff, schema/SEO gap report, and
  a ranked, human-reviewed fix queue (the baseline).
- **Goblin Warband** — monthly: weekly re-scans with measured before/after
  delta, continuous human-reviewed remediation PRs, live dashboard.
- **Goblin Warlord** — multi-domain program: higher surface/engine coverage and
  custom workflows for portfolios of sites (e.g. multiple agency properties).

---

**Prompt Goblin** · Chicago, IL · hi@promptgoblin.io · promptgoblin.zatgeist.com
*Solo specialist shop · human-reviewed, honest-broker accessibility + AI-search visibility.*
*[TODO: add UEI, CAGE, and "SAM.gov registered — [date]" here once active.]*
