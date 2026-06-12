export type FaqItem = { q: string; a: string };

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "Does adding author schema to an Article cause AI assistants to cite it more?",
    a: "No. Article-to-author-to-Person JSON-LD is extraction hygiene: it gives parsers a consistent, machine-readable path to the credential information. It does not create the brand mentions, Bing rank, or real third-party presence that drive citation. A well-structured author markup on a page with no external corroboration is a label attached to nothing.",
  },
  {
    q: "What makes an author's credentials credible to an AI system?",
    a: "Corroboration. An author named in markup is only as credible as the external evidence for that person: a real LinkedIn profile, a university faculty page, a byline on a publication AI systems already index. Markup describes credentials; external sources confirm them. Without corroboration the markup is an unverified assertion.",
  },
  {
    q: "Is it enough to have an author byline on the page without JSON-LD?",
    a: "A visible byline is necessary but not sufficient for reliable machine extraction. Crawlers reading HTML may extract a byline from a <meta> tag, a recognisable author element, or surrounding text — but the extraction is fragile and inconsistent. JSON-LD backed by a Person entity with sameAs links gives parsers an unambiguous, dereferenceable path to author identity.",
  },
  {
    q: "What is the difference between E-E-A-T for Google's quality raters and E-E-A-T for AI systems?",
    a: "Google's Search Quality Rater Guidelines use E-E-A-T as a framework for human evaluators assessing page quality — it is not a direct algorithmic score you can inject. AI retrieval systems do not read rater guidelines, but they benefit from the same underlying signals: real authors, verifiable credentials, consistent identity across sources. Structuring that information as machine-readable markup is extraction hygiene, not a lever that directly raises a score.",
  },
];

export type SourceItem = { label: string; url: string; note: string };

export const SOURCES: SourceItem[] = [
  {
    label: "Google Search Quality Rater Guidelines — E-E-A-T definition",
    url: "https://static.googleusercontent.com/media/guidelines.raterhub.com/en//searchqualityevaluatorguidelines.pdf",
    note: "Defines Experience, Expertise, Authoritativeness, and Trustworthiness as the quality-rater framework. Not a direct algorithmic score.",
  },
  {
    label: "Google Search Central — Article structured data",
    url: "https://developers.google.com/search/docs/appearance/structured-data/article",
    note: "Documents the Article schema type, required and recommended properties including author, and how to link to a Person entity.",
  },
  {
    label: "schema.org — Person type",
    url: "https://schema.org/Person",
    note: "Defines the Person type and its properties: name, jobTitle, alumniOf, knowsAbout, sameAs, url.",
  },
  {
    label: "schema.org — Article type",
    url: "https://schema.org/Article",
    note: "Defines the Article type and its author property, which expects a Person or Organization.",
  },
];
