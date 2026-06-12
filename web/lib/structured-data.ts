import { SITE, TIERS } from "@/lib/site";
import { FAQ } from "@/lib/faq";
import { SOURCES } from "@/app/learn/aeo-vs-geo/aeo-geo.data";

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

const breadcrumb = (...items: [string, string][]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, href], idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    name,
    item: `${SITE.url}${href === "/" ? "/" : href}`,
  })),
});

export const methodologyJsonLd = (): object[] => [
  {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "How the Prompt Goblin scan works - methodology",
    description: "What Prompt Goblin measures, what each finding means, where recon and human review sit, and what we do not claim.",
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
    url: `${SITE.url}/methodology`,
    inLanguage: "en",
  },
  breadcrumb(["Home", "/"], ["Methodology", "/methodology"]),
];

// ---- per-learn-page JSON-LD ------------------------------------------------

export const howToShowUpInChatGptJsonLd = (): object[] => [
  {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "How to show up in ChatGPT — what actually gets cited",
    description:
      "The three levers that determine whether an answer engine cites your site: brand mentions, Bing rank, and crawlable extractable content.",
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
    url: `${SITE.url}/learn/how-to-show-up-in-chatgpt`,
    inLanguage: "en",
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Does schema markup make ChatGPT cite my site?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Schema (JSON-LD / schema.org) is parse hygiene — it helps crawlers label what a page is. It does not cause citations. The real levers are brand mentions on authoritative sources, Bing/web rank, and crawlable answer-shaped content.",
        },
      },
      {
        "@type": "Question",
        name: "Does Google rank affect ChatGPT citations?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Partially. Most large-language model assistants ground their retrieval on Bing-indexed content, not just Google. High Google rank helps, but Bing indexing is the under-managed lever that directly connects to AI assistant citation.",
        },
      },
      {
        "@type": "Question",
        name: "Why do JS-only pages not get cited?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Answer engines retrieve from crawl snapshots. Pages whose content renders only in JavaScript are invisible to most crawlers and will not appear in those snapshots regardless of their schema.",
        },
      },
    ],
  },
  breadcrumb(
    ["Home", "/"],
    ["Learn", "/learn/how-to-show-up-in-chatgpt"],
    ["How to show up in ChatGPT", "/learn/how-to-show-up-in-chatgpt"],
  ),
];

export const bingRankJsonLd = (): object[] => [
  {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Bing rank and AI citations — the direct connection",
    description:
      "Why Bing indexing is the under-managed lever for AI assistant citations, and how IndexNow and Bing Webmaster Tools close the gap.",
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
    url: `${SITE.url}/learn/bing-rank-and-ai-citations`,
    inLanguage: "en",
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Why does Bing rank matter for AI citations?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Most large-language model assistants (including ChatGPT) ground their retrieval on Bing-indexed content. If your pages are not in Bing's index, your citation probability drops sharply regardless of Google rank.",
        },
      },
      {
        "@type": "Question",
        name: "What is IndexNow and does it help AI citations?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "IndexNow is an open protocol that lets you ping search engines — including Bing — the moment a URL changes. Faster indexing means the freshest version of your content is available as a retrieval candidate sooner. It is a hygiene practice, not a citation guarantee.",
        },
      },
    ],
  },
  breadcrumb(
    ["Home", "/"],
    ["Learn", "/learn/bing-rank-and-ai-citations"],
    ["Bing Rank and AI Citations", "/learn/bing-rank-and-ai-citations"],
  ),
];

export const technicalSeoForAiJsonLd = (): object[] => [
  {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "Technical SEO for AI search — the conditions that determine crawl and citation",
    description:
      "The technical prerequisites for AI search visibility: canonical hygiene, Core Web Vitals, structured data alignment, and the high-risk patterns that block citation.",
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
    url: `${SITE.url}/learn/technical-seo-for-ai-search`,
    inLanguage: "en",
  },
  breadcrumb(
    ["Home", "/"],
    ["Learn", "/learn/technical-seo-for-ai-search"],
    ["Technical SEO for AI Search", "/learn/technical-seo-for-ai-search"],
  ),
];

export const accessibilitySeoJsonLd = (): object[] => [
  {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Accessibility SEO audit — why WCAG hygiene is also crawl hygiene",
    description:
      "Accessible structure is machine-readable structure. The same semantic signals that help assistive technology also help crawlers and AI agents parse your content.",
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
    url: `${SITE.url}/learn/accessibility-seo-audit`,
    inLanguage: "en",
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How does accessibility relate to AI search visibility?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "AI agents and crawlers parse pages like assistive technology does: they rely on semantic HTML landmarks, heading hierarchy, image alt text, and accessible names for interactive elements. A page that fails WCAG often fails crawl too.",
        },
      },
      {
        "@type": "Question",
        name: "What WCAG standard does Prompt Goblin audit against?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "WCAG 2.1 Level AA and Section 508 — the two standards required for US federal contracts and most B2B accessibility policies.",
        },
      },
    ],
  },
  breadcrumb(
    ["Home", "/"],
    ["Learn", "/learn/accessibility-seo-audit"],
    ["Accessibility SEO Audit", "/learn/accessibility-seo-audit"],
  ),
];

export const aiCitationHallucinationsJsonLd = (): object[] => [
  {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "AI citation fabrications — the verification problem",
    description:
      "Why AI-generated citations are unreliable without verification, and how Prompt Goblin's verification layer surfaces fabricated or unresolvable sources before they reach decisions.",
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
    url: `${SITE.url}/learn/ai-citation-hallucinations`,
    inLanguage: "en",
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is an AI citation hallucination?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "An AI citation hallucination is a reference to a source that does not exist, cannot be retrieved, or does not support the claim made. Independent investigations of AI-assisted research tools have found meaningful rates of unsupported or fabricated citations.",
        },
      },
      {
        "@type": "Question",
        name: "How does Prompt Goblin verify citations?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The pipeline cross-checks each cited URL with an HTTP status check, canonical resolution, and a content-match pass. Citations that return 404, redirect to unrelated pages, or don't contain the claimed content are flagged as unverified in the dashboard.",
        },
      },
    ],
  },
  breadcrumb(
    ["Home", "/"],
    ["Learn", "/learn/ai-citation-hallucinations"],
    ["AI Citation Fabrications", "/learn/ai-citation-hallucinations"],
  ),
];

export const aeoGeoJsonLd = (): object[] => [
  {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "AEO vs GEO - the difference and what gets cited",
    description: "Answer Engine Optimization vs Generative Engine Optimization, the zero-click shift, and the signals that make AI citations measurable.",
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
    url: `${SITE.url}/learn/aeo-vs-geo`,
    inLanguage: "en",
    citation: SOURCES.map((s) => ({
      "@type": "CreativeWork",
      name: s.claim,
      url: s.url,
    })),
  },
  breadcrumb(["Home", "/"], ["Learn", "/learn/aeo-vs-geo"], ["AEO vs GEO", "/learn/aeo-vs-geo"]),
];
