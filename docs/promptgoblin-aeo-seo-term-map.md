# Prompt Goblin — AEO/SEO/GEO Term Target Map

> Canonical list of discovery terms we want `promptgoblin.io` to **rank for** and/or **be cited for** in AI Overviews / generative engine responses.
> Categories align to Google query fan-out behavior: core brand, category, answer, compare, local/regional.

---

## 1. Brand / Core Identity

| Term / Query | Type | Notes |
|---|---|---|
| Prompt Goblin | brand | Core brand; ensure homepage is the #1 result |
| AEO agency | brand+category | Direct positioning |
| GEO agency | brand+category | Direct positioning |
| prompt goblin | brand | Typo/variant |

---

## 2. Category / ICP Terms

| Term / Query | Type | Notes |
|---|---|---|
| AEO services | category | Answer Engine Optimization services |
| GEO services | category | Generative Engine Optimization services |
| AI search optimization | category | Primary ICP phrase |
| AI citation optimization | category | Closer to value prop |
| technical SEO for AI search | category | Matches dogfood content plan |
| AI visibility | category | High-intent research term |
| citation audit | category | Tied to verification layer |
| citation gap audit | category | Specific to scan outcome |
| AI SEO agency | category | Overlap with traditional SEO buyers |
| llms.txt and AI search | category | Hygiene label; not a ranking or citation signal; honest-broker framing required. Alias: "llms.txt implementation guide" → `/learn/llms-txt-implementation` |
| llms.txt vs robots.txt | category | Fan-out variant → `/learn/llms-txt-implementation` |
| entity optimization for AI search | category | SMB-focused → `/learn/entity-clarity-for-ai` |

---

## 3. Answer / Problem Queries

These align to Google's query fan-out: a user asks X, and the engine expands to related Y/Z.

| Term / Query | Type | Fan-Out Group | Notes |
|---|---|---|---|
| how to show up in ChatGPT | answer | citation | From dogfood plan |
| how to show up in Google AI Overviews | answer | citation | From dogfood plan |
| how to get cited by AI | answer | citation | Variant |
| how to get cited in ChatGPT | answer | citation | Variant |
| how to show up in AI search | answer | discovery | Broader |
| why am I not cited in AI Overviews | problem | troubleshooting | Diagnostic. See also: why-schema-not-enough (schema-done-still-uncited sub-case) and rank-but-not-cited (rank-vs-cite sub-case) |
| how to measure AI visibility | how-to | benchmark | Covers benchmark route |
| why ChatGPT not citing my content after schema markup | problem | troubleshooting | Diagnostic; targets post-implementation confusion → `/learn/why-schema-not-enough` |
| schema markup not getting cited | problem | troubleshooting | Fan-out variant → `/learn/why-schema-not-enough` |
| why business not appearing in Google AI Overviews no rank drop | problem | troubleshooting | Rank-vs-cite diagnostic → `/learn/rank-but-not-cited` |
| rank top 5 but not cited | problem | troubleshooting | Fan-out variant → `/learn/rank-but-not-cited` |
| AEO audit checklist for small agencies | answer | audit | Practitioner checklist → `/learn/aeo-audit-checklist` |
| how to audit a client site for AI search | answer | audit | Fan-out variant → `/learn/aeo-audit-checklist` |
| E-E-A-T signals for AI optimization expertise author credentials | answer | implementation | Author-schema + Person JSON-LD template; Article→author→Person pattern → `/learn/eeat-for-ai-search` |
| author schema for AI citations | answer | implementation | Fan-out variant → `/learn/eeat-for-ai-search` |
| how to get my brand entity recognised by AI | answer | discovery | Fan-out variant → `/learn/entity-clarity-for-ai` |

---

## 4. Compare / Selection Queries

| Term / Query | Type | Notes |
|---|---|---|
| AEO vs GEO | compare | Explicit explainer target |
| best AEO tools | compare | Product comparison queries |
| GEO tools | category+compare | Competitor-heavy |
| AI SEO agencies | compare | Service comparison |
| Prompt Goblin vs [competitor] | compare | Reactive; fill on competitor addition |

---

## 5. Local / Regional

| Term / Query | Type | Notes |
|---|---|---|
| Michigan SEO agency | geo+local | Owner-based geographic signal |
| Traverse City SEO | local | City-level |
| Michigan AEO agency | geo+local | Tie brand + geo |
| AI SEO agency Michigan | geo+crossover | Long-tail local intent |

---

## 6. Verification / Trust Signals

| Term / Query | Type | Notes |
|---|---|---|
| AI citation verification | verification | Mirrors fabrication crisis page |
| AI citation hallucination stats | verification | News/research term |
| how to verify AI citations | how-to | Actionable |
| E-E-A-T for AI search | verification | Author-schema implementation guide → `/learn/eeat-for-ai-search` |
| SEO audit with accessibility | solution | Tied to a11y lane |
| AI visibility dashboard | product | Route-target |

---

## 7. Platform Presence Targets (Supporting Routes)

These are not home/landing term targets, but supporting pages to exist and be indexed/cited.

- `/learn/aeo-vs-geo`
- `/learn/how-to-show-up-in-chatgpt`
- `/learn/technical-seo-for-ai-search`
- `/learn/bing-rank-and-ai-citations`
- `/learn/accessibility-seo-audit`
- `/learn/why-schema-not-enough`
- `/learn/aeo-audit-checklist`
- `/learn/rank-but-not-cited`
- `/learn/eeat-for-ai-search`
- `/learn/entity-clarity-for-ai`
- `/learn/llms-txt-implementation`
- `/docs/bing-webmaster-tools`
- `/benchmark`
- `/faq`

---

## 8. Query Expansion Notes (Fan-Out Ready)

For each top-level term above, expected fan-out queries to cover in generated content:

- how to …
- why …
- what is …
- best …
- vs …
- for [vertical]
- examples
- checklist
- tools
- agency / service / company

---

## 9. Maintenance Rules

- Review this map monthly from Search Console and Organic/Traffic drop signals.
- Add new rows when:
  - a new content/landing page ships,
  - a new competitor wins a target query,
  - a new ICP vertical is onboarded.
- Deprecate terms only when they stop driving traffic or citations for 90 days.

---

_This file is the source of truth for the dashboard intake Run Scan flow and for the generator’s citation-target pipeline._

---

## 10. Top 5 tracked (scan display)

> **Human-curated, not generated.** This list is the literal constant in `pipeline/goblin/nodes/term_expand.py::TOP_5_TRACKED` and is what the scan dashboard displays as the active tracking set. Edit deliberately; treat any AI-suggested change as a candidate that needs traffic validation first.

| # | Query |
|---|---|
| 1 | how to show up in ChatGPT |
| 2 | how to get cited by AI |
| 3 | Bing rank and AI citations |
| 4 | technical SEO for AI search |
| 5 | how to measure AI visibility |

These five queries span the core buyer journey: discovery ("show up"), mechanism ("cited by AI"), signal channel ("Bing rank"), category education ("technical SEO for AI"), and measurement ("measure AI visibility"). They are tracked across all four engines (ChatGPT, Perplexity, Claude, Gemini) on every scan run.
