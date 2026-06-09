# Prompt Goblin Dogfood AEO/SEO Plan

Status after the first live dashboard scan on 2026-06-08:

- The dashboard and Supabase write path worked.
- The recommendation quality did not. The scan mislabeled `promptgoblin.io` as
  an AI prompt utility and suggested prompt-generator terms and bad competitors.
- Fix before trusting the next recommendation set: recon and query expansion must
  use homepage facts first, clean LLM preambles/numbering, and reject bogus
  competitor domains.

## Real Levers

1. Brand mentions: authoritative, disclosed mentions and links from sources
   answer engines already cite.
2. Bing/web rank: crawlability, indexing diagnostics, and content that can rank
   for the relevant query set.
3. Crawlable, structured, answer-shaped content: server-rendered HTML, clear
   headings, direct answers, useful tables, FAQ content, and source-backed claims.

Schema, FAQPage, `llms.txt`, and IndexNow are hygiene and discovery aids. They
do not create citations on their own.

## Target Query Set

Own these before broad social/video work:

- AI search visibility consultant
- AEO agency
- GEO agency
- answer engine optimization agency
- generative engine optimization consultant
- technical SEO for AI search
- accessibility and SEO audit
- WCAG accessibility SEO audit
- how to show up in ChatGPT
- how to get cited by ChatGPT
- how to get cited in AI answers
- how to get cited in Google AI Overviews
- Bing ranking and ChatGPT citations
- llms.txt and AI search
- FAQPage schema and AI answers
- AI citation audit
- AI visibility dashboard
- AEO report with code snippets
- competitor citation gap audit
- technical SEO accessibility consultant Chicago

## Content Map

Existing:

- `/` - positioning, scan, pricing, FAQ section
- `/methodology` - what the scan measures and does not claim
- `/learn/aeo-vs-geo` - AEO vs GEO explainer
- `/faq` - dedicated FAQ route backed by the same FAQ source as FAQPage JSON-LD

Next pages:

- `/learn/how-to-show-up-in-chatgpt`
- `/learn/bing-rank-and-ai-citations`
- `/learn/technical-seo-for-ai-search`
- `/learn/accessibility-seo-audit`
- `/docs/bing-webmaster-tools`
- `/benchmark`

Each page should open with a direct 40-60 word answer, then include a comparison
table, FAQ block, source/proof notes, and a clear "what this does not guarantee"
section.

## Pipeline Requirements

- Recon must identify the actual business category from homepage title, meta,
  h1, and body before using live research.
- Competitor discovery must use a web-search/research step that validates direct
  competitors. Example: Walgreens should surface CVS/Rite Aid/Walmart Pharmacy,
  not generic health sites.
- Query expansion must produce clean buyer questions only. No preambles, numbered
  labels, or malformed query lines should enter retrieval.
- Reports must include the recon profile and platform-presence assumptions so a
  bad recommendation can be audited after the run.
- Community mention assistance should show where to post and provide text drafts
  for human review. It must never auto-post.

## Measurement Loop

1. Ship crawlable content and Bing submission hygiene.
2. Re-run the live scan on `promptgoblin.io`.
3. Reject recommendations that are not about AEO, GEO, technical SEO, WCAG, or
   AI citation audits.
4. Submit changed URLs in Bing Webmaster Tools / IndexNow.
5. After the next observed crawl/index window, re-run and compare measured
   citation share, cited source domains, and query-surface coverage.
6. Only then start the broader marketing asset/reels/content posting pipeline.
