# Long-tail page targets

`specs/longtail-page-targets.md`

## Context

`promptgoblin.io` is barely indexed (site: query returned near-zero results as of
the date of this research). robots.txt and sitemap are technically sound — the
gap is authority and age. Google Search Console and Bing Webmaster Tools are
verified and sitemaps submitted; that work is complete. This spec assumes that
baseline and builds from it.

Three mechanical inputs determine whether an answer engine cites a page. Everything
in this spec is in service of one or more of them:

1. **Brand mentions on authoritative sources** — third-party pages that name
   "Prompt Goblin" alongside the agency descriptor and link to promptgoblin.io.
   Priority #1 because promptgoblin.com (an unrelated prompt-generator SaaS) owns
   the SERP for the brand query. Bare brand mentions without context may resolve
   to the wrong domain.
2. **Bing / web rank** — crawlable, indexed, structurally clean pages that can
   rank for longtail queries. Most LLM assistants ground retrieval on
   Bing-indexed content.
3. **Crawlable, extractable, answer-shaped content** — server-rendered HTML with
   direct answers in the first 50–60 words, logical heading hierarchy, and named
   entities.

Schema, FAQPage markup, `llms.txt`, and IndexNow are hygiene labels and structural signals.
They are not citation levers on their own. No page in this spec promises citations
or rankings.

The head term "ai search visibility" is owned by Semrush / SE Ranking / HubSpot —
out of reach until the domain has authority. This spec targets only longtail
queries where SERP research (point-in-time qualitative, not tracked keyword data)
suggests current results are weak or undefended.

Implementation is done directly (Claude as integrator). Gates that apply:
`integrity-reviewer` on all public copy; `qa` (axe-core 0 violations); vitest +
build green before merge; deploy-on-push discipline (nothing auto-deploys).

---

## Goal

1. **Win the brand SERP.** Establish enough crawlable third-party mentions tying
   "Prompt Goblin" + "AEO/GEO agency" to promptgoblin.io that answer engines
   resolve the brand query to the right site.
2. **Rank for longtail queries** in the AEO/GEO/technical-SEO/accessibility space
   before the domain has authority for head terms.
3. **Fix internal-link dead ends** that already exist — several pages are
   structurally orphaned from each other.
4. **Extend the term map** (`docs/promptgoblin-aeo-seo-term-map.md`) with newly
   targeted rows.

---

## Priority 0: Brand-query rescue

The promptgoblin.com collision means bare mentions of "Prompt Goblin" may
surface the wrong site. Every off-site action must tie the brand name to the
agency description and URL explicitly: "Prompt Goblin (promptgoblin.io) — AEO
and technical-SEO agency."

All drafts below are agent-draftable for human review. None auto-post. Community
mentions are disclosed as coming from the company per platform norms.

### Actions (ordered by effort)

| Action | Source / platform | Effort | Owner split |
|---|---|---|---|
| `llms.txt` — verify `/llms.txt` is current; add new pages from this spec as they ship | `public/llms.txt` | Low | Implementer executes; no integrity gate needed for file updates |
| GitHub awesome-list — open PR on an existing `awesome-aeo` or `awesome-llm-seo` repo; description must include "Prompt Goblin (promptgoblin.io) — AEO/GEO + WCAG 2.1 AA agency" | GitHub | Low | Agent drafts PR text; human submits |
| Business directory listings — G2, Sortlist, BBB Michigan | G2 / Sortlist / BBB | Low–medium | Agent drafts profile copy; human submits |
| Clutch.co — claim/create agency profile, service tags: AEO, GEO, technical SEO, WCAG | Clutch.co | Medium | Agent drafts copy; human submits |
| GoodFirms.co — register, multi-level verification | GoodFirms | Medium | Agent drafts copy; human submits |
| DigitalA11Y directory — accessibility-agency roundup inclusion | digitala11y.com | Low | Agent drafts; human emails |
| HARO / Qwoted — respond to AEO/GEO/accessibility queries with original insight linking to promptgoblin.io | HARO, Qwoted | Medium (per response) | Agent drafts pitch; human submits within 30-minute window |
| Reddit participation — r/SEO, r/webdev, r/accessibility, r/marketing | Reddit | Medium | Agent drafts comment text; human posts when on-topic and helpful |

**What none of these do:** auto-post, pay for placement, or represent sponsored
content as editorial. Community mentions are disclosed.

**What this does not guarantee:** any specific citation count, ranking position,
or brand-SERP ownership timeline. These are structural signals; effects are
measured over the re-run loop described in §6.

---

## Page targets

Coverage audit (from the research) identified 6 existing `/learn/` pages that are
in good shape, 4 pages with structural gaps (stubs or missing links), and a large
set of uncovered term-map rows. The table below prioritises ~9 new or substantially
upgraded targets. Topics the research flagged as **saturated** (generic AEO agency
positioning, enterprise citation-monitoring dashboards, ChatGPT/Perplexity
citation-tracking at scale) are excluded.

The "winnability" notes are qualitative, derived from point-in-time SERP
observations by the researcher — not tracked keyword data.

### New pages (in priority order)

| # | Route (new file path) | Primary query | Fan-out queries covered | Page type | Winnability rationale (qualitative) | Term-map section extended | Differentiation note |
|---|---|---|---|---|---|---|---|
| 1 | `web/app/learn/why-schema-not-enough/page.tsx` | "why ChatGPT not citing my content after schema markup" | "schema markup not getting cited"; "ChatGPT ignores my structured data"; "why am I not cited despite implementing FAQ schema" | Diagnostic guide | Researcher observation: results address "why not cited" broadly or "what schema helps" separately, but no dedicated post-implementation diagnostic for the schema-done-still-uncited gap. Directly addresses the most common prospect misconception and delivers the honest-broker message. | §3 Answer/problem queries — new sub-case row under §3; annotate existing parent row (unchanged otherwise) | **Angle: post-implementation diagnostic** — "I added schema, nothing changed." The direct-answer opening must frame this as a schema-done-still-uncited scenario. Do not reproduce the rank-vs-citation gap framing that belongs to page 3. |
| 2 | `web/app/learn/aeo-audit-checklist/page.tsx` | "AEO audit checklist for small agencies" | "how to audit for AEO"; "AEO checklist"; "answer engine optimization audit steps"; "how to audit a client site for AI search" | Checklist / procedural guide | Researcher observation: top results lean enterprise or vendor guides; no independent, practitioner-focused framework for small agencies. Matches Prompt Goblin's ICP (agencies validating client readiness). | §2 Category/ICP terms — extends "AEO services", "citation audit", "citation gap audit" | — |
| 3 | `web/app/learn/rank-but-not-cited/page.tsx` | "why business not appearing in Google AI Overviews no rank drop" | "rank top 5 but not cited"; "AI Overviews ignoring my content"; "ranked page not in AI Overviews"; "how to fix AI citation gap despite good rank" | Diagnostic guide | Researcher observation: existing results explain structural/author/freshness factors but few directly diagnose the "rank vs. cite" gap with a side-by-side framework. High-intent troubleshooting query. | §3 Answer/problem — new sub-case row under §3; annotate existing parent row (unchanged otherwise) | **Angle: rank-vs-citation gap** — "I rank top 5 but I'm not cited." The direct-answer opening must frame this as a ranking-page-not-cited scenario. Do not reproduce the post-schema-implementation framing that belongs to page 1. |
| 4 | `web/app/learn/eeat-for-ai-search/page.tsx` | "E-E-A-T signals for AI optimization expertise author credentials" | "how to show E-E-A-T to AI"; "author schema for AI citations"; "encoding expertise for answer engines"; "Article schema author markup AI citations" | Implementation guide | Researcher observation: E-E-A-T is heavily discussed in general SEO; fewer posts address how to *structure* it so AI systems reliably extract it. Combines Article→author→Person JSON-LD template with byline and credential-schema patterns. | §3 Answer queries — new row; §6 Verification/trust signals | — |
| 5 | `web/app/learn/entity-clarity-for-ai/page.tsx` | "Google Knowledge Graph optimization small business entity" | "entity optimization for non-household brands"; "Wikidata for small business SEO"; "entity disambiguation AEO"; "how to get my brand entity recognised by AI" | Strategic guide | Researcher observation: existing guides use large-brand examples; SMB-focused entity-clarity content is sparse. Directly relevant to Prompt Goblin's ICP (solo agencies and small B2B brands). | §2 Category/ICP — new row; §3 Answer queries | — |
| 6 | `web/app/learn/llms-txt-implementation/page.tsx` | "llms.txt implementation guide AEO" | "how to write llms.txt"; "llms.txt best practices"; "llms.txt template"; "llms.txt vs robots.txt" | Implementation guide + template | Researcher observation: results explain what llms.txt is; fewer address how to build one that is well-structured and kept current. Prompt Goblin has hands-on experience implementing its own. **Honest-broker framing is mandatory** — see copywriter note below. | §2 Category — new row ("llms.txt and AI search" as primary label, "llms.txt implementation guide" as alias in Notes column) | — |
| 7 | `web/app/learn/faq-schema-vs-howto-schema/page.tsx` | "FAQ schema vs HowTo schema AI Overviews which performs better" | "when to use FAQ schema"; "HowTo schema for AI citations"; "structured data for AI Overviews comparison"; "which schema type gets cited more" | Comparison guide | Researcher observation: separate guides exist; direct side-by-side with use-case matrix for question type is sparse. Doubles as a hygiene-reminder page (honest-broker angle: neither type *causes* citations). | §2 Category — extends "citation audit"; §3 Answer queries | — |
| 8 | `web/app/learn/site-structure-ai-citations/page.tsx` | "site structure internal linking AI citation visibility" | "how site architecture affects AI citations"; "internal linking for AI search"; "topical authority content cluster strategy AI search"; "how to map sub-questions for cluster retrieval" | Technical / strategic guide | Researcher observation: existing results explain hierarchy but fewer address the specific internal-link patterns that maximise passage retrieval or minimise topical isolation. Closes a gap that directly affects Prompt Goblin's own site (see orphaned pages in §1). **Differentiation from `/learn/technical-seo-for-ai-search`** — see note below. | §2 Category — new row; §3 Answer queries | **This page vs. `/learn/technical-seo-for-ai-search`:** the existing page covers the technical floor (crawlability, canonicals, sitemap accuracy, Core Web Vitals). This page focuses specifically on topical clustering and sub-question mapping for passage retrieval: the "cluster vs. isolated page" frame, hub-and-spoke internal linking, and how orphaned or thinly interlinked pages are excluded from passage retrieval even when they are technically crawlable. These are distinct frames targeting different reader moments. Sections must not overlap: the new page does not re-cover canonicals, sitemap hygiene, or Core Web Vitals; the existing page does not need to add cluster/topical mapping. |
| 9 | `web/app/learn/wcag-aeo-overlap/page.tsx` | "Section 508 government procurement accessibility AEO technical requirements" | "Section 508 compliance SEO implications"; "WCAG 2.1 AA government contractor AI search"; "Section 508 criteria semantic HTML AI visibility"; "government site AEO checklist Section 508" | Educational guide / checklist | Researcher observation: existing results address WCAG/SEO overlap generally; no dedicated content targets government-procurement buyers who must satisfy Section 508 and want to understand what AEO requirements overlap. **Differentiation from `/learn/accessibility-seo-audit`** — see note below. | §6 Verification/trust signals — new row ("Section 508 AEO overlap") | **This page vs. `/learn/accessibility-seo-audit`:** the existing page is general-audience (any site, WCAG 2.1 AA framing, landmark roles, heading hierarchy, semantic HTML as crawl hygiene). This page is scoped to **Section 508 government procurement buyers**: federal contractors and agencies who must certify 508 conformance and want to understand which specific 508/WCAG criteria — 1.3.1 Info and Relationships, 2.4.2 Page Titled, 4.1.2 Name Role Value, 4.1.1 Parsing — have a direct AEO impact. The primary query, audience framing, and call-to-action are entirely different. These criteria must NOT appear in the existing `/learn/accessibility-seo-audit` page without the government-procurement framing that belongs here. **Pre-ship step (not optional):** before shipping page 9, grep `/learn/accessibility-seo-audit/page.tsx` for criteria 1.3.1, 2.4.2, 4.1.2, and 4.1.1. If any are present without government-procurement framing, either remove them from the existing page or add a scoped note directing readers to the new page. |

> **Copywriter note — page 6 (`/learn/llms-txt-implementation`):** This page must open with an explicit honest-broker statement: "llms.txt is a hygiene label, not a ranking or citation signal. No current evidence shows it influences whether an answer engine cites your content." Do not soften that language or introduce any phrase implying llms.txt improves discoverability or citation probability (including "discoverability aid"). The reference sentence to match is the corrected phrasing above — if `/learn/how-to-show-up-in-chatgpt` is updated, both pages must be updated together using the same corrected hygiene-label wording. The two pages must not contradict each other.

> **Copywriter note — pages 1 and 3:** Page 1 (`why-schema-not-enough`) and page 3 (`rank-but-not-cited`) both extend the same §3 term-map row ("why am I not cited in AI Overviews") and share adjacent fan-out queries. Each page must not reproduce the other's direct-answer opening. Page 1 opens from the schema-done-still-uncited angle; page 3 opens from the ranked-but-not-cited angle. These are distinct diagnostic frames.

### Existing pages with structural gaps (upgrades, not new routes)

| Route | Gap | Upgrade scope |
|---|---|---|
| `web/app/docs/bing-webmaster-tools/page.tsx` | Stub (~110 words, no JSON-LD, no cross-links) | Expand to full guide; add Article JSON-LD; add cross-links to `/learn/bing-rank-and-ai-citations` and `/learn/technical-seo-for-ai-search` |
| `web/app/benchmark/page.tsx` | Orphaned from all `/learn/*` routes; OG description does not carry illustrative caveat; explicitly marked illustrative in body | Add context section linking to methodology + three learn pages that explain what gets measured; keep illustrative label prominent; **update `metadata.openGraph.description` to:** `"Illustrative benchmark snapshot — updates as pipeline runs accumulate. Shows how Prompt Goblin measures citation gaps: visibility score, structural blockers, and platform distribution."` Note: the current live `metadata.openGraph.description` also overclaims quarterly data — patch it in the same PR as the cross-link upgrade. |
| `web/app/faq/page.tsx` | No FAQPage JSON-LD on the page itself; no links to `/learn/*`; `lib/faq.ts` defines `FaqItem[]` but is not imported | Import `FAQ` from `web/lib/faq.ts` (`FaqItem[]` already defined there); wire to a new `faqPageJsonLd()` export in `web/lib/structured-data.ts` following the `howToShowUpInChatGptJsonLd` pattern (do not duplicate FAQ content); add "Learn more" section linking to `/learn/aeo-vs-geo`, `/learn/how-to-show-up-in-chatgpt`, and `/learn/bing-rank-and-ai-citations`. **Important:** a `FAQPage` node is already present in `structuredData` (the homepage block in `structured-data.ts` lines 93–99), sourced from `lib/faq.ts`. The new `faqPageJsonLd()` function for `/faq/page.tsx` must be a **separate named export** — do NOT modify `structuredData`. This preserves the `toHaveLength(6)` assertion in `web/__tests__/content-pages.test.ts` (line 47). The new export is a standalone `FAQPage` array (just the FAQPage node plus a BreadcrumbList), following the same pattern as `howToShowUpInChatGptJsonLd`. The `/faq` route renders it via `<JsonLd>`; the homepage continues to render from `structuredData`. |
| `web/app/docs/report-guide/page.tsx` | Stub; no internal links | Link to `/methodology`, `/faq`, and one relevant `/learn/*` page |

---

## Page shape contract

Every new `/learn/*` page must follow this anatomy in order. Existing pages
already conform — use `/learn/how-to-show-up-in-chatgpt/page.tsx` as the
reference implementation.

### 1. Direct-answer opening (40–60 words)
The first `<p>` after `<h1>` answers the primary query without preamble. No "In
this article we will cover…". The answer names the thing and the mechanic.

### 2. Body sections (h2-level)
Ordered by user need, not by what's easy to write. For diagnostic pages:
problem → causes → fixes. For guides: what it is → how to implement → common
mistakes. For comparisons: define both things → comparison table → use-case
matrix.

### 3. Comparison table (where natural)
Plain `<table>` in server-rendered HTML. Column headers must be `<th>` with
`scope="col"`. No JS-rendered tables.

### 4. FAQ block
**Only** if questions can be single-sourced into `web/lib/faq.ts` or a
page-specific `.data.ts` file with the same `FaqItem` type. FAQPage JSON-LD
must match the visible text exactly (no divergence). If questions are too
page-specific to centralise, use a plain `<dl>` without FAQPage schema rather
than duplicating schema and copy. Pages using a plain `<dl>` require no FAQPage
sync test — document this decision in the page's `.data.ts` with the comment:
`// plain <dl> — no FAQPage schema, no sync test needed`.

### 5. Sources section (h2: "Sources cited on this page")
Every factual claim attributable to an external source gets a citation.
No numbers without a measured source. Qualitative observations are labelled
as such ("point-in-time observation" or similar). No fabricated stats.

### 6. "What this does not guarantee" section
Required on every page. Must include:
- Schema/markup is hygiene, not a citation lever.
- No specific citation count, rank position, or AI response outcome is
  promised by any action described on this page.
- Where relevant: the refund covers the work, never a citation number.

### 7. Scan CTA
Single `<a>` or `<button>` pointing to the scan or contact flow. Not a
wall of CTAs.

### 8. Internal links (h2: "Go deeper" or inline)
Minimum 3 internal links per page to related `/learn/*` routes,
`/methodology`, or `/faq`. See the link map in §5.

### JSON-LD pattern
Add a named export to `web/lib/structured-data.ts` following the existing
`howToShowUpInChatGptJsonLd` pattern: `Article` + `BreadcrumbList`, plus
`FAQPage` only when questions are wired to `lib/faq.ts` or a `.data.ts`
source file. Import and render with `<JsonLd>` in the page RSC. Never
inline JSON-LD as a string.

### Metadata export
```ts
export const metadata: Metadata = {
  title: "<Page title> · Prompt Goblin",
  description: "<40–60 word direct answer matching the page opening>",
  alternates: { canonical: "/learn/<slug>" },
  openGraph: { type: "article", url: `${SITE.url}/learn/<slug>`, ... },
};
```

### Page file convention
RSC (no `"use client"`). Arrow function, default export (Next.js page
convention). Data arrays in a co-located `<slug>.data.ts`. No inline
magic strings for copy.

---

## Plumbing per publish

For each new or substantially upgraded page, all five steps run before
the page ships:

### 1. `web/app/sitemap.ts`
Add entry for each new page:
```ts
{ url: `${SITE.url}/learn/<slug>`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 }
```
Upgraded existing pages (benchmark, faq, docs/*): update `lastModified`.

Note: `/learn/ai-citation-hallucinations` is already present in `sitemap.ts` at line 18 — no action needed. Do NOT add it again; adding it creates a duplicate entry that breaks sitemap validity.

Note on `lastModified`: existing `sitemap.ts` entries currently omit `lastModified`. When adding it to upgraded pages, also add `lastModified: new Date()` to all existing entries in the same PR to keep the sitemap shape consistent. Alternatively, omit `lastModified` from all entries until a deliberate date-management strategy is in place — the Next.js `MetadataRoute.Sitemap` type does not require it.

### 2. `public/llms.txt`
**If `public/llms.txt` does not exist, create it with the following template
before adding any entries:**

```
# Prompt Goblin
> AEO/GEO and technical-SEO agency.

## Resources
- [How to show up in ChatGPT](https://promptgoblin.io/learn/how-to-show-up-in-chatgpt): The three mechanical levers that determine AI citation.
```

Then, for each new or substantially upgraded page, add a line under the
`## Resources` section:
```
- [<Page title>](<https://promptgoblin.io/learn/<slug>>): <one-sentence description>
```

### 3. IndexNow submit
After deploy, submit the new URL via Bing Webmaster Tools IndexNow
(manual, one URL at a time — no automation). Log the submission date in
the `PLAN.md` measurement table.

For substantially upgraded existing pages (benchmark, faq, docs/*), also submit
via IndexNow and log the submission in `PLAN.md` under the same measurement table.

### 4. Term-map rows (`docs/promptgoblin-aeo-seo-term-map.md`)
Add rows to the appropriate section for each new primary query and at
least one fan-out query. Follow the existing table format. Do not
deprecate existing rows.

New rows to add (copy into the term map when the page ships):

**§3 Answer/Problem Queries:**
- "why ChatGPT not citing my content after schema markup" | problem | troubleshooting | Diagnostic; targets post-implementation confusion
- "why business not appearing in Google AI Overviews no rank drop" | problem | troubleshooting | Rank-vs-cite diagnostic
- "AEO audit checklist for small agencies" | answer | audit | Practitioner checklist
- "E-E-A-T signals for AI optimization expertise author credentials" | answer | implementation | Author-schema + Person JSON-LD template; Article→author→Person pattern

Also update the existing §3 row "why am I not cited in AI Overviews" — append to its Notes column: "See also: why-schema-not-enough (schema-done-still-uncited sub-case) and rank-but-not-cited (rank-vs-cite sub-case)." This keeps the map navigable without deprecating the parent row.

**§2 Category/ICP Terms:**
- "llms.txt and AI search" | category | Hygiene label; not a ranking or citation signal; honest-broker framing required. Alias: "llms.txt implementation guide"
- "entity optimization for AI search" | category | SMB-focused; new row
- "site structure for AI citations" | category | Technical/strategic

**§4 Compare/Selection:**
- "FAQ schema vs HowTo schema AI citations" | compare | Structured-data decision guide

Note: the dogfood plan already lists "FAQPage schema and AI answers" as a target query. When adding the "FAQ schema vs HowTo schema AI citations" row to §4, also add "FAQPage schema and AI answers" as an alias/variant in the Notes column for that row, or add it as a standalone row in §3 pointing to the same page. Do not leave the dogfood plan query unrepresented in the term map.

**§6 Verification/Trust Signals:**
- "E-E-A-T for AI search" | verification | Author-schema implementation guide
- "Section 508 AEO overlap" | solution | Government-procurement buyer audience; Section 508 criteria with direct AEO impact

### 5. Internal links from existing pages

Add the following cross-links. Changes are surgical — one `<li>` or inline
`<a>` per gap, no page restructuring:

| Source page | Add link to | Location in source |
|---|---|---|
| `web/app/docs/bing-webmaster-tools/page.tsx` | `/learn/bing-rank-and-ai-citations` | "Go deeper" or inline |
| `web/app/docs/bing-webmaster-tools/page.tsx` | `/learn/technical-seo-for-ai-search` | "Go deeper" |
| `web/app/benchmark/page.tsx` | `/methodology`, `/learn/how-to-show-up-in-chatgpt`, `/learn/bing-rank-and-ai-citations` | New "Context" section |
| `web/app/faq/page.tsx` | `/learn/aeo-vs-geo`, `/learn/how-to-show-up-in-chatgpt` | After FAQ list |
| `web/app/methodology/page.tsx` | `/learn/technical-seo-for-ai-search`, `/learn/bing-rank-and-ai-citations`, `/faq` | "Go deeper" section |
| `/learn/aeo-vs-geo` | `/docs/bing-webmaster-tools` | Under the `<h2>` "The three citation levers" (confirmed present at line 91 of `web/app/learn/aeo-vs-geo/page.tsx`) |
| `/learn/technical-seo-for-ai-search` | `/docs/bing-webmaster-tools` | Under Bing/IndexNow section. Note: the existing page mentions Bing Webmaster Tools in prose (line 62) but contains no `<a href="/docs/bing-webmaster-tools">` anchor. Add the link as an anchor on the inline mention, or add it to the existing "Go deeper" list (line 156 already links to `/learn/bing-rank-and-ai-citations`). Confirm with grep that the link does not already exist before adding. |
| Any new `/learn/<slug>` | ≥ 3 related pages per page shape contract | "Go deeper" section |

---

## Measurement loop

GSC and Bing WMT are verified and sitemaps submitted (complete — not re-queued
here). The loop below is the ongoing cadence.

### Cadence

| Interval | Action |
|---|---|
| On publish | IndexNow submit for the new URL; log date in PLAN.md |
| 2 weeks post-publish | Check Bing WMT URL inspection: indexed? any crawl errors? |
| 4 weeks post-publish | GSC: impressions and clicks for the primary query; Bing WMT: same |
| Monthly | Re-run the Prompt Goblin pipeline scan on promptgoblin.io; compare citation-share delta against previous run |
| Monthly | Review term map: any new queries surfacing in GSC that aren't in the map? |
| 90 days | Evaluate whether brand SERP for "Prompt Goblin" is resolving to promptgoblin.io in answer engines; check off-site mention count |

### What to check in GSC

- **Impressions** for each page's primary query — a page with zero impressions at
  4 weeks is either not indexed or not matched by the query. Check coverage
  report for errors first.
- **Average position** — directional; longtail new pages often start in positions
  20–50, not top 10. Do not act on single data points.
- **Click-through rate** — evaluate against position; a CTR lower than expected
  for position may indicate a title/description mismatch.

### What to check in Bing WMT

- **Indexed status** — URL inspection confirms whether Bing has crawled the page.
- **AI Performance** (if available in the WMT account) — whether queries related
  to the page's primary query are generating AI impressions.
- **Crawl errors** — any 4xx or redirect chains that would block indexing.

### The honest re-run loop

The pipeline scan re-run measures: citation share for the top-5-tracked queries,
which source domains are cited for those queries, and whether promptgoblin.io
appears. The delta between runs is the gap the work is closing. No target
citation count is set — the measurement is descriptive, not a goal metric.
Results are logged in `PLAN.md` as "run N — date — delta observation."

### What this does not guarantee

No cadence, no IndexNow submission, and no content improvement on this list
guarantees a specific citation count, impression volume, or answer-engine
mention. These are structural inputs. Effects depend on crawl timing, domain
age, and signals outside Prompt Goblin's control.

---

## Acceptance criteria

### Per new page

- [ ] Opens with a direct 40–60 word answer to the primary query (no preamble).
- [ ] JSON-LD exported from `web/lib/structured-data.ts`, rendered via `<JsonLd>`,
      matching the `Article` + `BreadcrumbList` pattern (plus `FAQPage` only
      when single-sourced).
- [ ] `metadata` export includes `title`, `description` (≤160 chars),
      `alternates.canonical`, and `openGraph.type: "article"`.
- [ ] "What this does not guarantee" section present; does not promise citations
      or rankings.
- [ ] Sources section: every external claim has a named source; no fabricated
      statistics.
- [ ] Minimum 3 internal links to related pages.
- [ ] Scan CTA present.
- [ ] No `"use client"` unless a genuinely interactive leaf requires it.
- [ ] `sitemap.ts` entry added before merge.
- [ ] `llms.txt` updated before merge (create file from template if it does not exist).

### Per existing-page upgrade

- [ ] Cross-links added (surgical, no page restructuring).
- [ ] If JSON-LD was missing, it is now added.
- [ ] `sitemap.ts` `lastModified` updated.
- [ ] If FAQPage JSON-LD is added, it is single-sourced from `lib/faq.ts` or a
      `.data.ts` file — no inline copy. For `/faq/page.tsx` specifically: import
      `FAQ` from `web/lib/faq.ts` (`FaqItem[]` already defined there) and wire to
      a new `faqPageJsonLd()` export in `web/lib/structured-data.ts` following the
      `howToShowUpInChatGptJsonLd` pattern. This must be a **separate named export**
      — do NOT modify `structuredData`, which already contains a FAQPage node for the
      homepage (lines 93–99 of `structured-data.ts`). Modifying `structuredData`
      breaks the `toHaveLength(6)` test in `web/__tests__/content-pages.test.ts`.

### Build and quality gates

- [ ] `npm run build` (in `web/`) passes with no TypeScript errors.
- [ ] `npm run lint` passes.
- [ ] axe-core: 0 violations on the new/upgraded page (run via `qa` agent or
      `@axe-core/playwright` in the existing a11y test suite).
- [ ] Contrast: all text ≥ 4.5:1 against background (WCAG AA small text).
- [ ] `integrity-reviewer` sign-off on all copy before merge (required for any
      page a prospect will read).

---

## Test plan

### Unit / build

1. **TypeScript** — `npm run build` in `web/`. Any new `.data.ts` file must
   export typed arrays (`FaqItem[]`, `SourceItem[]`, etc.) — no `any`.
2. **JSON-LD shape** — for each new `*JsonLd()` export in `structured-data.ts`,
   add a vitest test asserting: `@type` is `"Article"` or `"TechArticle"`;
   `headline` is non-empty; if `FAQPage` is included, `mainEntity` length matches
   the source data array length. Add these assertions to the existing
   `web/__tests__/content-pages.test.ts` — do NOT create a separate
   `web/__tests__/structured-data.test.ts`. Note: FAQPage sync for `structuredData`
   is already covered at lines 51–60 of `content-pages.test.ts` — only add a new
   FAQPage sync block for `faqPageJsonLd()` (the `/faq`-route-specific export).
3. **FAQPage sync** — if a page adds FAQPage JSON-LD from a `.data.ts` source,
   the test asserts that `mainEntity[i].name === data[i].q` and
   `mainEntity[i].acceptedAnswer.text === data[i].a` for every item. Pages that
   use a plain `<dl>` instead of FAQPage JSON-LD require no FAQPage sync test.
   The test is only required when FAQPage schema is present. Document the decision
   in the page's `.data.ts` with a comment:
   `// plain <dl> — no FAQPage schema, no sync test needed`.

### Accessibility

4. **axe-core** — `qa` agent runs axe against each new/upgraded page URL on the
   local dev server. Zero violations required. Any `aria-label`, landmark, or
   heading-hierarchy issue found is a blocker (not a warning).
5. **Keyboard navigation** — manually verify: Tab reaches the scan CTA and all
   internal links; Enter activates links; no keyboard trap.

### Integrity gate

6. **`integrity-reviewer`** reads the final draft of each page's copy before the
   PR merges. Checklist:
   - No fabricated statistics (every number has a named source in the Sources
     section or is removed).
   - No ranking or citation promise in copy or in the "what this does not
     guarantee" section (which must not be hedged away).
   - Schema not described as a citation lever anywhere on the page.
   - `llms.txt` not described as a ranking or citation signal anywhere on any
     page (including `/learn/llms-txt-implementation`).
   - "Prompt Goblin" mentions that could mislead about capabilities are absent.

### Manual smoke

7. After deploy, verify:
   - The page renders with content visible in `curl -A "Googlebot" <url>` output
     (server-rendered, not JS-only).
   - JSON-LD is present in page source as `<script type="application/ld+json">`.
   - Canonical URL in `<link rel="canonical">` matches `metadata.alternates.canonical`.
   - Internal links resolve (no 404).

---

## Out of scope

- **Head terms** ("ai search visibility", "AEO agency" as a standalone head term)
  — out of reach until domain authority grows.
- **Social media / Reels / video** — per the dogfood plan ordering, this comes
  after the content + Bing-rank work.
- **Paid placement or sponsored content presented as editorial** — not a Prompt
  Goblin channel.
- **Auto-posting of any community mention drafts** — all community content is
  human-reviewed and human-submitted.
- **Per-stack fix-implementation guides** (`/docs/fixes/[stack]`) — DOCS_PLAN.md
  §2.3; deferred to after first client engagement.
- **Citation Landscape Benchmark data population** — the `/benchmark` upgrade in
  this spec is limited to cross-linking and context copy; real benchmark data
  requires 10+ pipeline runs (DOCS_PLAN.md §1.4).
- **Dashboard / product pages** ("AI visibility dashboard" term-map row) — gated
  on the dashboard feature being user-facing.
- **Local/geo landing pages** (Michigan SEO agency, Traverse City SEO) — in the
  term map but deferred; these require local-signal content that is not ready.
- **Competitor comparison pages** ("Prompt Goblin vs X") — deferred; no
  competitor has been formally added.
- **Pipeline or functions changes** — this spec touches `web/` only.
