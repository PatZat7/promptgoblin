# How to Show Up in ChatGPT: AEO in Practice

> What actually gets cited, what the engines ignore, and how to test whether your site shows up in LLM responses.

## What actually gets cited

AI assistants pull from pages they have crawled, parsed, and trusted. The short answer is not “better SEO” — it is “better source material.”

The pages that get cited share a small set of real signals:

- Entity clarity: one named entity is the clear subject of the URL, title, headings, and body.
- Direct answer: one question answered in plain language in the first 150 words.
- Parseable structure: JSON-LD matches the prose, instead of contradicting it.
- Indexation: the page is in Bing’s index. For many assistant systems, Bing index is the practical filter.

## What doesn’t work

- Browser-only auth, infinite scroll, or heavy client-side rendering. Assistants typically fetch a static or lightly rendered version of the page.
- “LLM-only” markup tricks. Google’s guidance is plain: optimize for humans first, use the same structured signals crawlers understand.
- Thin hub pages. Short AI-generated summaries created only for machines are treated as low-value and ignored.

## The actionable sequence

1. Name the entity or claim you want quoted.
2. Publish a dedicated page named after that exact claim.
3. Put the answer in the first paragraph.
4. Add JSON-LD that matches the prose.
5. Submit the page to Bing via IndexNow or sitemap.
6. Track the term in your AEO scorecard over 30–90 days.

## What Prompt Goblin checks

- Entity coverage and AEO hygiene score.
- JSON-LD validity.
- Bing indexation probability.
- Citation target presence.