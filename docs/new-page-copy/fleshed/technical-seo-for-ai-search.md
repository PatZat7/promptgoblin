# Technical SEO for AI Search

> The technical conditions that determine whether an answer engine can find, crawl, and cite your content.

## What’s different in 2026

AI search does not replace the old rules — it tightens them. Discoverable content still needs crawlable URLs, stable canonicals, and structured data that agrees with the prose.

Without crawl, there is no citation.

## Minimum pass

- Every primary page returns a 200 status, not a soft 404.
- One canonical URL declared consistently in HTML, header, and sitemap.
- Structured data is valid JSON-LD and matches the page content.
- Sitemap is submitted and kept accurate after each publish.
- Core Web Vitals pass in field data: LCP <= 2.5s, CLS <= 0.1, INP <= 200ms.
- HTTPS is valid and there are no mixed-content issues.
- Mobile returns the same core content as desktop.

## High-risk patterns

- Content hidden behind interaction, lazy loading, or infinite scroll.
- Framework-level routing that changes the canonical without a server redirect.
- Duplicate or thin content created at scale for generative AI targets.
- Reliance on client-only rendering for first-load content discovery.

## The semantic-floor checklist

- Semantic HTML5 landmarks are used: `header`, `main`, `article`, `section`, `nav`.
- Headings are in order with no skipped levels.
- Keyboard-accessible controls have visible focus states.
- Images that communicate meaning include descriptive `alt` text.
- Interactive elements use real buttons or links rather than styled divs.

## Why this matters for AI overviews

Answer engines still depend on a reconstructed crawl snapshot. Clean technical hygiene raises the probability that your content is included in that snapshot and that the engine can assign it to the right answer slot.