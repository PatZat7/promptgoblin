export type FaqItem = { q: string; a: string };

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "Does adding llms.txt improve my chances of being cited by ChatGPT or Perplexity?",
    a: "No. llms.txt is a hygiene label, not a ranking or retrieval signal. No current evidence shows it influences whether an answer engine cites your content. The real levers remain brand mentions on authoritative sources, Bing rank, and crawlable answer-shaped content.",
  },
  {
    q: "Is llms.txt similar to robots.txt?",
    a: "They share a naming pattern but serve entirely different purposes. robots.txt gives directives to web crawlers — block this path, allow that one — and is enforced by crawlers that respect it. llms.txt is a voluntary plain-text guide for LLM sessions and human readers; it carries no crawl directive and no tool is required to read or obey it.",
  },
  {
    q: "How often should I update llms.txt?",
    a: "Update it whenever your canonical self-description changes: new pricing tiers, retired services, significantly new pages, or a renamed product. A stale llms.txt that contradicts your actual site misinforms the tools that do read it. Monthly review takes minutes.",
  },
  {
    q: "What happens if I never create a llms.txt?",
    a: "Nothing consequential. No penalty from any search engine, no crawl block, no reduction in citation probability. It is a low-effort hygiene step worth doing because it is nearly free — not because anything breaks without it.",
  },
];

export type SourceItem = { label: string; url: string; note: string };

export const SOURCES: SourceItem[] = [
  {
    label: "llmstxt.org — the llms.txt proposal",
    url: "https://llmstxt.org",
    note: "The original specification and rationale for the llms.txt file format.",
  },
  {
    label: "Google Search Central — robots.txt documentation",
    url: "https://developers.google.com/search/docs/crawling-indexing/robots/intro",
    note: "Official Google documentation confirming robots.txt as a crawl directive, distinct from any LLM-session file.",
  },
];
