export type FaqItem = { q: string; a: string };

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "Does internal linking actually affect whether AI retrieves my content?",
    a: "Internal links are how crawlers discover, recrawl, and contextualize pages. A page with few or no inbound internal links is structurally deprioritized in crawl queues — it is harder to find and its topical relationships are unclear. That is a retrieval risk even when the page is technically accessible.",
  },
  {
    q: "How many spokes should a topic cluster have?",
    a: "There is no fixed number. Each spoke should answer exactly one sub-question the audience actually asks. If you run a fan-out on the topic and find seven distinct sub-questions, build seven spokes. If two sub-questions are nearly identical, collapse them into one spoke rather than risking cannibalization.",
  },
  {
    q: "What is the difference between a hub page and a link list?",
    a: "A hub page directly answers the topic-level question in its opening passage and then links to spokes for depth. A link list has no answer content — it is just navigation. Answer engines can extract a passage from a hub; they cannot extract an answer from a list of links.",
  },
  {
    q: "Can two pages on my site target the same query without hurting retrieval?",
    a: "They can coexist if each answers a genuinely distinct sub-question and cross-links to the other. If both pages open with the same direct answer to the same query, they compete. Consolidate them into one definitive page and redirect the duplicate.",
  },
];
