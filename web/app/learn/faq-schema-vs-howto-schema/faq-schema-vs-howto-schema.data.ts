export type FaqItem = { q: string; a: string };

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "Does FAQ schema or HowTo schema still earn rich results in Google?",
    a: "For most sites, no. Google's 2023 Search Central updates deprecated HowTo rich results entirely (mobile in August, desktop in September) and restricted FAQ rich results to well-known government and health websites. If your site is not in those categories, neither type will trigger a rich-result enhancement in Google search.",
  },
  {
    q: "Is there any remaining reason to use FAQPage schema if rich results are gone?",
    a: "Yes, but a narrow one: parse hygiene. FAQPage markup labels question-and-answer pairs so crawlers and parsers can extract them cleanly. It does not cause AI citations — the underlying answer-shaped content is what matters — but it does reduce structural ambiguity. Only mark up real Q&A pairs; never use it on marketing bullets.",
  },
  {
    q: "What does HowTo schema do now that rich results are deprecated?",
    a: "HowTo markup signals that a page contains procedural steps, which helps parsers extract step text as structured content. A plain ordered list achieves similar step-extraction clarity without schema overhead. Neither approach causes AI citations; the quality and specificity of the step content is the actual signal.",
  },
  {
    q: "Is it harmful to add FAQPage or HowTo schema to a page that does not qualify?",
    a: "Yes. Marking up content that is not actually Q&A pairs (for FAQPage) or procedural steps (for HowTo) is a false claim to parsers. Schema-to-visible-text divergence — where the markup describes content that does not match the rendered page — is a quality signal problem, not just a missed opportunity.",
  },
];

export type SourceItem = { label: string; url: string };

export const SOURCES: SourceItem[] = [
  {
    label: "Google Search Central — FAQPage, Q&A, and HowTo rich results update (August 2023)",
    url: "https://developers.google.com/search/blog/2023/08/howto-faq-changes",
  },
  {
    label: "schema.org — FAQPage type definition",
    url: "https://schema.org/FAQPage",
  },
  {
    label: "schema.org — HowTo type definition",
    url: "https://schema.org/HowTo",
  },
];
