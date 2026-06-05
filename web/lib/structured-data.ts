import { SITE, TIERS } from "@/lib/site";
import { FAQ } from "@/lib/faq";

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
      "Agentic AI-search visibility and technical SEO. Prompt Goblin improves how ChatGPT, Claude, Gemini, and Perplexity see your brand through citation acquisition, technical SEO, and answer-engine hygiene. Every change human-reviewed.",
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
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  },
];
