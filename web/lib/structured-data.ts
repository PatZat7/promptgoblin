import { SITE, TIERS } from "@/lib/site";

/**
 * JSON-LD graph — the AEO payload. This is the product thesis applied to our
 * own site: clean, parseable structured data so answer engines and crawlers
 * can read us. Rendered server-side into <script type="application/ld+json">.
 *
 * Honest-broker note: schema is hygiene, not a citation lever — it earns no
 * promise. As a service business we use ProfessionalService / Service /
 * OfferCatalog (never Product).
 */

const address = {
  "@type": "PostalAddress",
  addressLocality: SITE.locality,
  addressRegion: SITE.region,
  addressCountry: SITE.country,
};

const offers = TIERS.map((t) => ({
  "@type": "Offer",
  name: t.name,
  priceCurrency: "USD",
  price: t.price,
}));

export const structuredData: object[] = [
  {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: SITE.name,
    alternateName: SITE.altName,
    url: SITE.url,
    email: SITE.email,
    description:
      "Agentic AI-search visibility and technical SEO. Prompt Goblin improves how ChatGPT, Claude, Gemini, and Perplexity see your brand through citation acquisition, technical SEO, and answer-engine hygiene — every change human-reviewed.",
    areaServed: "Worldwide",
    knowsAbout: [
      "Generative Engine Optimization",
      "Answer Engine Optimization",
      "Technical SEO",
      "Schema.org structured data",
      "llms.txt",
      "Core Web Vitals",
      "Entity SEO",
    ],
    address,
    makesOffer: offers,
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    alternateName: SITE.altName,
    url: SITE.url,
    email: SITE.email,
    slogan: SITE.tagline,
    description: "A one-goblin AI-search-visibility (AEO/GEO) and technical-SEO shop in Chicago.",
    areaServed: "Worldwide",
    address,
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE.url}/` },
      { "@type": "ListItem", position: 2, name: "Services", item: `${SITE.url}/#services` },
      { "@type": "ListItem", position: 3, name: "Pricing", item: `${SITE.url}/#pricing` },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "AI search visibility (AEO/GEO) & technical SEO",
    provider: { "@type": "Organization", name: SITE.name, url: SITE.url },
    areaServed: "Worldwide",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Goblin tiers",
      itemListElement: offers,
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is AI search visibility (AEO/GEO)?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Answer Engine Optimization (AEO) / Generative Engine Optimization (GEO) is getting your brand cited inside AI answers — ChatGPT, Claude, Gemini, Perplexity, and Google AI Overviews — rather than only ranking in blue links.",
        },
      },
      {
        "@type": "Question",
        name: "Does schema markup get me cited by AI?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Schema and llms.txt are hygiene — necessary so engines can parse you, but not a citation lever on their own. The real levers are brand mentions and Bing ranking; we work all of it, and every change is human-reviewed.",
        },
      },
      {
        "@type": "Question",
        name: "How much does a Prompt Goblin audit cost?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Goblin Scout is a one-time visibility audit at $2,950. Ongoing retainers are Goblin Warband ($4,800/mo) and Goblin Warlord ($12,500/mo). Flat fee — no credits, no meter.",
        },
      },
      {
        "@type": "Question",
        name: "Is there a money-back guarantee?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes — a 100% money-back guarantee on the work, not on the algorithm. If we don't deliver your audit, or you're not happy with it within 14 days of delivery, you get a full refund, no argument. We can't promise a specific citation number — AI citation share is volatile and partly outside anyone's control — so we never sell one. We guarantee the work, and we measure the result honestly.",
        },
      },
    ],
  },
];
