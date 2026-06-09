# Bing Webmaster Tools Submission Guide

Use this for Prompt Goblin and for client handoffs when Bing visibility is part
of the work queue.

## What This Does

Bing Webmaster Tools and IndexNow help Bing discover changed URLs faster and give
us crawl/index diagnostics. This supports the Bing/web-rank side of the AEO loop
by showing whether Bing can crawl and index the pages we want evaluated. It is
not an indexing, ranking, or AI-citation guarantee and not a substitute for brand
mentions, useful content, or ranking work.

Official references:
- Bing Webmaster Tools URL submission: https://www.bing.com/webmasters/help/URL-Submission-62f2860b
- IndexNow setup: https://www.bing.com/indexnow/IndexNowView/IndexNowGetStartedView
- Bing Webmaster API overview: https://learn.microsoft.com/en-us/bingwebmaster/

## Manual Setup

1. Sign in to Bing Webmaster Tools.
2. Add the property for the canonical domain.
3. Verify ownership using the least fragile option available for the stack.
4. Submit the sitemap URL, for example `https://promptgoblin.io/sitemap.xml`.
5. Use URL Inspection on the highest-priority pages.
6. Use URL Submission for pages that were added or materially changed.
7. Record the date submitted and re-run the Prompt Goblin scan after the next
   crawl/index window.

## IndexNow Setup

Use IndexNow for changed URLs, not historical backfill.

1. Generate an IndexNow key.
2. Host the UTF-8 key file at the site root or a same-host key location.
3. Submit changed URLs with the key and key location.
4. Verify receipt in Bing Webmaster Tools.

IndexNow's own FAQ says submission does not guarantee crawling or indexing. In a
client report, phrase it as "submitted for discovery and diagnostic tracking,"
not "indexed."

## Prompt Goblin Dogfood Checklist

- Verify `promptgoblin.io` in Bing Webmaster Tools.
- Submit `https://promptgoblin.io/sitemap.xml`.
- Inspect and submit:
  - `https://promptgoblin.io/`
  - `https://promptgoblin.io/methodology`
  - `https://promptgoblin.io/learn/aeo-vs-geo`
  - `https://promptgoblin.io/faq`
- After each new authority/content page ships, submit that URL.
- Track the submission date in the live scan note before comparing citation
  movement.

## Report Wording

Use:

> Submitted the changed URLs through Bing Webmaster Tools / IndexNow so Bing can
> discover and recrawl them faster. This supports the Bing-rank side of the
> AEO loop, but it does not guarantee indexing, ranking, or AI citations.

Avoid:

> This will get the page indexed.

> This will make ChatGPT cite the page.
