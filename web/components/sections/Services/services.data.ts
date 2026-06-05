export type Service = {
  num: string;
  title: string;
  lead: string;
  items: string[];
};

/** Six disciplines, one goblin. Honest-broker framing throughout. */
export const SERVICES: Service[] = [
  {
    num: "(i)",
    title: "Technical SEO",
    lead: "The plumbing: crawl paths, indexation, canonicals, robots, sitemaps. Fixed so nothing leaks crawl budget.",
    items: ["Crawl audits", "Indexation", "Canonicals", "Robots & sitemaps"],
  },
  {
    num: "(ii)",
    title: "Schema & structured data",
    lead: "JSON-LD so crawlers and models parse who you are without guessing. Table-stakes hygiene: necessary, not magic. The citation levers are brand mentions and Bing rank; this clears the way for them.",
    items: ["JSON-LD", "Entity markup", "FAQ / HowTo", "Rich results"],
  },
  {
    num: "(iii)",
    title: "AI / answer-engine SEO",
    lead: "Get surfaced inside ChatGPT, Perplexity, and AI Overviews by earning the brand mentions and Bing-rank signals that drive citations, plus the llms.txt/AEO hygiene that lets them through.",
    items: ["llms.txt", "AEO strategy", "Citation tuning", "RAG-readiness"],
  },
  {
    num: "(iv)",
    title: "Core Web Vitals",
    lead: "Make it fast for humans and bots alike. Green vitals, real-device tested.",
    items: ["LCP / CLS / INP", "Asset budgets", "Edge & caching", "Lab + field"],
  },
  {
    num: "(v)",
    title: "Content for robots + humans",
    lead: "Pages that read well to a person and parse cleanly for a model. Both audiences, one draft.",
    items: ["Info architecture", "Heading logic", "Internal links", "Editorial passes"],
  },
  {
    num: "(vi)",
    title: "Accessibility (WCAG + 508)",
    lead: "Usable by people on assistive tech and legible to crawlers. The same fixes serve both. Automated axe-core audit across real component states (collapsed, open, error) plus a software-engineer pass, since tooling alone catches ~57%. Required for government (Section 508 / ADA Title II); never sold as compliance-by-tool.",
    items: [
      "WCAG 2.1 AA + Section 508",
      "Stateful axe-core audit",
      "Engineer-reviewed remediation",
      "Reviewed fix PRs",
    ],
  },
];
