/**
 * FAQ content — the single source for BOTH the visible FAQ section and the
 * FAQPage JSON-LD (lib/structured-data.ts). Keeping them in sync is the dogfood:
 * humans and answer engines read the exact same answers. Honest-broker copy —
 * no promised citation number, schema framed as hygiene, guarantee on the work.
 */
export type FaqItem = { q: string; a: string };

export const FAQ: FaqItem[] = [
  {
    q: "What is AI search visibility (AEO/GEO)?",
    a: "Answer Engine Optimization (AEO) / Generative Engine Optimization (GEO) is getting your brand cited inside AI answers (ChatGPT, Claude, Gemini, Perplexity, and Google AI Overviews), not only ranking in blue links.",
  },
  {
    q: "Does schema markup get me cited by AI?",
    a: "Schema and llms.txt are hygiene: necessary so engines can parse you, but not a citation lever on their own. The real levers are brand mentions and Bing ranking. We work all of it, and every change is human-reviewed.",
  },
  {
    q: "How much does a Prompt Goblin audit cost?",
    a: "Goblin Scout is a one-time visibility audit at $2,950. Ongoing retainers are Goblin Warband ($4,800/mo) and Goblin Warlord ($12,500/mo). Flat fee, no credits, no meter.",
  },
  {
    q: "Is there a money-back guarantee?",
    a: "Yes: a 100% money-back guarantee on the work, not on the algorithm. If we don't deliver your audit, or you're not happy with it within 14 days of delivery, you get a full refund, no argument. We can't promise a specific citation number (AI citation share is volatile and partly outside anyone's control), so we never sell one. We guarantee the work, and we measure the result honestly.",
  },
];
