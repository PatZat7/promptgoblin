export type FaqItem = { q: string; a: string };

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "How is an AEO audit different from a standard SEO audit?",
    a: "A standard SEO audit focuses on rank signals: crawlability, canonicals, page speed, backlink profile. An AEO audit adds two layers those miss: whether the brand is named on the external sources answer engines already retrieve for your category, and whether the page content is shaped so an engine can extract a direct answer rather than a ranking-page passage.",
  },
  {
    q: "Should schema markup be the first thing I fix?",
    a: "No. Schema is hygiene — it helps crawlers label what a page is. It does not cause citations. Fix crawlability and Bing indexing first, then work on content shape (direct answers, heading hierarchy, named entities). Schema belongs in a final hygiene pass, not at the top of the priority queue.",
  },
  {
    q: "What do I do if a client page returns a 403 or blocks crawlers?",
    a: "Flag it as a blind spot, not a zero score. A page you cannot read cannot be audited honestly. Note the blocker in your findings, attempt a stealth or render fallback if the platform supports it, and report the access gap explicitly. Never assign a score based on a failed read.",
  },
  {
    q: "Does Prompt Goblin guarantee that fixing audit findings will produce citations?",
    a: "No. Audit findings address structural inputs — crawlability, content shape, Bing indexing, brand-mention surface. These raise the probability an answer engine can retrieve and cite a page. No specific citation count, ranking position, or AI-response outcome is promised. The refund covers the delivered work, not a citation number.",
  },
];
