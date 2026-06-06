export type Source = {
  id: string;
  claim: string;
  value: string;
  source: string;
  url: string;
  asOf: string;
};

export const SOURCES: Source[] = [
  {
    id: "seer-ctr",
    claim: "Seer Interactive reported organic CTR of 0.84% when AI Overviews appeared versus 2.94% without them in its study window.",
    value: "0.84% vs 2.94%",
    source: "Seer Interactive AI Overviews CTR study",
    url: "https://www.seerinteractive.com/insights/how-ai-overviews-are-impacting-ctr-5-initial-takeaways",
    asOf: "2025",
  },
  {
    id: "geo-citation-absorption",
    claim: "A 2026 measurement framework analyzed 602 prompts and more than 21,000 valid search-layer citations across AI search platforms.",
    value: "602 prompts; 21,143 citations",
    source: "arXiv:2604.25707",
    url: "https://arxiv.org/abs/2604.25707",
    asOf: "2026",
  },
  {
    id: "aio-quality-impact",
    claim: "A 2026 Google AI Overviews study issued 55,393 trending queries across 19 topical categories over 40 days.",
    value: "55,393 queries; 19 categories; 40 days",
    source: "arXiv:2605.14021",
    url: "https://arxiv.org/abs/2605.14021",
    asOf: "2026",
  },
] as const;

export const DEFINITIONS = [
  {
    term: "AEO",
    title: "Answer Engine Optimization",
    body: "Structuring pages so an answer engine can extract the answer directly: short answer first, clear entities, comparison tables, and visible provenance.",
  },
  {
    term: "GEO",
    title: "Generative Engine Optimization",
    body: "Earning and measuring citations inside generated summaries, then improving the off-page and on-page signals that make a source worth citing.",
  },
] as const;

export const PREDICTORS = [
  "Topical coverage and prompt-content alignment are stronger working signals than generic authority scores.",
  "Answer-first copy in the opening section helps engines extract a useful passage without guessing.",
  "Visible tables, citations, and methodology notes make claims easier for humans and crawlers to audit.",
  "Brand mentions and third-party platform presence are real work items; schema remains parseability hygiene.",
] as const;
