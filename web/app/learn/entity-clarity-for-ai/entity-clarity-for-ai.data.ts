export type FaqItem = { q: string; a: string };

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "Does Organization schema tell Google to create a Knowledge Graph panel for my brand?",
    a: "No. Organization schema is a hygiene label — it tells a parser that your page represents an organisation. Knowledge Graph inclusion depends on notability signals Google finds across the web: third-party references, entity co-occurrence in crawled text, and cross-linked profiles. Markup is one input; it is not a trigger.",
  },
  {
    q: "We have a Wikidata entry. Does that guarantee engine recognition?",
    a: "Not on its own. A Wikidata entry is a useful corroborating signal — particularly if it links to your verified profiles and domain — but engines weigh it alongside many other signals. A thin Wikidata record with no corroborating external references does little. Real notability criteria must be met first; Wikidata should document notability, not manufacture it.",
  },
  {
    q: "Our brand name collides with an unrelated product. What is the fastest fix?",
    a: "Consistent co-occurrence of your name with a disambiguating descriptor everywhere it appears in crawlable text: on your site, in directory listings, in third-party mentions, and in sameAs profile bios. The pattern 'Brand Name — descriptor (domain.tld)' repeated across authoritative sources is the signal engines use to resolve ambiguity. There is no instant fix — it is a coverage-building exercise.",
  },
  {
    q: "Is entity markup different from brand SEO?",
    a: "Entity clarity is the prerequisite for brand retrieval. An engine that cannot resolve your brand string to a distinct, unambiguous node cannot reliably surface you — even if your pages rank. Brand SEO focuses on rank and mentions; entity work makes sure the brand string those mentions use actually resolves to you and not to a collision.",
  },
];

export type SourceItem = { label: string; url: string; note: string };

export const SOURCES: SourceItem[] = [
  {
    label: "schema.org — Organization",
    url: "https://schema.org/Organization",
    note: "Canonical definition of the Organization type and its sameAs property.",
  },
  {
    label: "schema.org — sameAs",
    url: "https://schema.org/sameAs",
    note: "sameAs links an entity to its canonical external identifiers (Wikipedia, Wikidata, social profiles, etc.).",
  },
  {
    label: "Wikidata — notability criteria",
    url: "https://www.wikidata.org/wiki/Wikidata:Notability",
    note: "Wikidata's own notability policy — the basis for whether a new item is accepted.",
  },
  {
    label: "Google Search Central — Understand how structured data works",
    url: "https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data",
    note: "Google's documentation on what structured data does and does not do in Search.",
  },
];
