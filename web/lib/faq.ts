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
    q: "What is an AI Search Visibility Diagnostic?",
    a: "It's the first thing we run: we measure who the answer engines actually cite for your category — including which competitors get named when you don't — then hand you a ranked, engineer-reviewed fix queue. With Goblin Scout, month one is your diagnostic; after that we work the fixes.",
  },
  {
    q: "Does schema markup get me cited by AI?",
    a: "Schema and llms.txt are hygiene: necessary so engines can parse you, but not a citation lever on their own. The real levers are brand mentions and Bing ranking. We work all of it, and every change is human-reviewed.",
  },
  {
    q: "So how do you actually get me cited?",
    a: "We measure the gap across the answer engines, then work the two levers that move it — earning brand mentions on sources the models trust, and lifting your Bing rank — while making your content clean and extractable. We don't promise a citation number; we ship the work and measure the before/after delta on a re-run loop.",
  },
  {
    q: "How much does a Prompt Goblin audit cost?",
    a: "Goblin Scout is $997/mo — month one is your AI Search Visibility Diagnostic, then we work the fix queue. Warband is $3,500/mo and Warlord $9,500/mo. Monthly, cancel anytime, no credits, no meter.",
  },
];
