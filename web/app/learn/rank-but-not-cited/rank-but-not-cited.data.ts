export type FaqItem = { q: string; a: string };

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "Why does my page rank top 5 but not appear in Google AI Overviews?",
    a: "Ranking measures relevance and authority. Citation selection additionally weighs whether the page front-loads a direct extractable answer, whether the passage is in plain server-rendered text, and whether third-party sources corroborate the brand for that specific topic. A page can satisfy all ranking signals while failing the passage-extraction test.",
  },
  {
    q: "Does Google rank guarantee Bing indexing?",
    a: "No. Google and Bing maintain independent indexes. Many AI assistants ground retrieval on Bing-indexed content. A page that ranks on Google but is absent from Bing's index has near-zero citation probability in those tools regardless of its Google position.",
  },
  {
    q: "Can I fix the rank-vs-citation gap on-page?",
    a: "Sometimes. If the gap is caused by a buried answer, JS-dependent rendering, or a missing plain-text passage, on-page fixes help. If the query class inherently favours aggregators or comparison sites (e.g. 'best X' or 'X vs Y' queries), engines may prefer third-party review sources regardless of your content quality. That is an off-page problem, not an on-page one.",
  },
  {
    q: "Does adding schema markup close the rank-vs-citation gap?",
    a: "No. Schema is parse hygiene — it helps crawlers label what a page contains, but it does not influence citation selection. The citation levers are brand mentions on authoritative sources, Bing/web rank, and crawlable answer-shaped content.",
  },
];
