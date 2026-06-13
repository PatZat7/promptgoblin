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
    a: "Goblin Scout is a monthly visibility audit at $997/mo. Warband is $3,500/mo and Warlord $9,500/mo. Monthly, cancel anytime, no credits, no meter.",
  },
];
