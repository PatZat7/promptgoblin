/**
 * The three levers that actually move AEO citations.
 *
 * Honest-broker note: schema is parseability hygiene, not a citation lever.
 * These three are the real causal inputs — documented here so the UI copy
 * and any downstream structured data stay consistent.
 */

export type Lever = {
  num: string;
  tag: string;
  headline: string;
  body: string;
  /** One-liner on how the pipeline moves this lever specifically. */
  pipeline: string;
  /** Honest caveat — no citation-number promises. */
  caveat: string;
};

export const LEVERS: Lever[] = [
  {
    num: "01",
    tag: "lever.mentions",
    headline: "Brand mentions on authoritative sources",
    body: "Answer engines don't invent brands from your site alone. They surface brands they've seen referenced on third-party pages — press, industry directories, niche forums, vertical publications. The more credible external pages associate your brand with a topic, the more surface area the model has to retrieve you when that topic comes up.",
    pipeline:
      "Goblin scouts which publications already cite your competitors for your target topics, then drafts pitch-ready outreach copy, directory listing text, and forum-contribution starters — all in your brand voice. Every draft is human-reviewed before anything is published.",
    caveat: "Mentions build reach over weeks to months. We measure the before/after citation delta — we promise the work and the measurement, never a citation count.",
  },
  {
    num: "02",
    tag: "lever.rank",
    headline: "Bing / web rank",
    body: "Most large-language models ground their retrieval on Bing-indexed content. Higher Bing rank expands the set of queries where your pages are candidate sources. Google rank helps too — but Bing is the under-managed lever for most teams, and it's directly wired to AI assistant citation.",
    pipeline:
      "GSC and Bing Webmaster sitemaps are generated and submitted for you. IndexNow pings go out every time content ships. Technical hygiene gaps — soft 404s, broken canonicals, thin pages — are surfaced ranked by their Bing crawl impact, with paste-ready fix prompts a dev can act on the same day.",
    caveat: "Rank moves on crawl cadence and competitive dynamics. We measure position deltas, not rank guarantees.",
  },
  {
    num: "03",
    tag: "lever.content",
    headline: "Crawlable, extractable, Q&A-shaped content",
    body: "Answer engines extract passages. Pages that front-load a direct answer in plain text — with clear entities, headers in order, and machine-readable structure — are dramatically easier to cite than pages that bury the answer three scrolls deep in prose or, worse, render it in JavaScript that a crawler never sees. Schema markup helps parsers label what they find; it is hygiene, not magic. JS-only rendering is invisible to most crawlers and will never be cited regardless of how good the schema is.",
    pipeline:
      "Your copy is rewritten (in your own brand voice, from your existing material) to lead with the answer, hit the right entity density, and pass a plain-text extraction check. Stack-specific code snippets are generated for structured data that matches what the prose actually says. Nothing auto-publishes — engineer review, then PR.",
    caveat: "Schema earns no citation promises. The lift comes from extractable content, not the markup wrapper.",
  },
];
