import { SITE, TIERS } from "@/lib/site";
import { FAQ } from "@/lib/faq";
import { SOURCES } from "@/app/learn/aeo-vs-geo/aeo-geo.data";
import { FAQ_ITEMS as WHY_SCHEMA_FAQ } from "@/app/learn/why-schema-not-enough/why-schema-not-enough.data";
import { FAQ_ITEMS as AEO_CHECKLIST_FAQ } from "@/app/learn/aeo-audit-checklist/aeo-audit-checklist.data";
import { FAQ_ITEMS as RANK_NOT_CITED_FAQ } from "@/app/learn/rank-but-not-cited/rank-but-not-cited.data";
import { FAQ_ITEMS as EEAT_FAQ } from "@/app/learn/eeat-for-ai-search/eeat-for-ai-search.data";
import { FAQ_ITEMS as ENTITY_CLARITY_FAQ } from "@/app/learn/entity-clarity-for-ai/entity-clarity-for-ai.data";
import { FAQ_ITEMS as LLMS_TXT_FAQ } from "@/app/learn/llms-txt-implementation/llms-txt-implementation.data";
import { FAQ_ITEMS as FAQ_VS_HOWTO_FAQ } from "@/app/learn/faq-schema-vs-howto-schema/faq-schema-vs-howto-schema.data";
import { FAQ_ITEMS as SITE_STRUCTURE_FAQ } from "@/app/learn/site-structure-ai-citations/site-structure-ai-citations.data";
import { FAQ_ITEMS as WCAG_AEO_FAQ } from "@/app/learn/wcag-aeo-overlap/wcag-aeo-overlap.data";

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

export const rankButNotCitedJsonLd = (): object[] => [
  {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "You rank but AI Overviews don't cite you — diagnosing the gap",
    description:
      "Ranking proves crawlability and relevance — but citation selection also weighs passage extractability, direct-answer shape, and third-party corroboration. Here is how to diagnose the gap.",
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
    url: `${SITE.url}/learn/rank-but-not-cited`,
    inLanguage: "en",
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: RANK_NOT_CITED_FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  },
  breadcrumb(
    ["Home", "/"],
    ["Learn", "/learn/rank-but-not-cited"],
    ["Rank But Not Cited", "/learn/rank-but-not-cited"],
  ),
];

export const whySchemaNotEnoughJsonLd = (): object[] => [
  {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Why schema markup isn't enough to get cited",
    description:
      "You added JSON-LD, validated it, and still nothing changed. Schema labels content — it does not create the brand mentions, Bing rank, or extractable answers that drive AI citations. Here is the post-implementation diagnostic.",
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
    url: `${SITE.url}/learn/why-schema-not-enough`,
    inLanguage: "en",
  },
  breadcrumb(
    ["Home", "/"],
    ["Learn", "/learn/why-schema-not-enough"],
    ["Why Schema Markup Isn't Enough", "/learn/why-schema-not-enough"],
  ),
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: WHY_SCHEMA_FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  },
];

export const aeoAuditChecklistJsonLd = (): object[] => [
  {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "AEO audit checklist for small agencies",
    description:
      "The practical AEO audit framework small agencies use to check client sites for AI-search readiness: three citation levers, a hygiene pass, and honest scoring rules.",
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
    url: `${SITE.url}/learn/aeo-audit-checklist`,
    inLanguage: "en",
  },
  breadcrumb(
    ["Home", "/"],
    ["Learn", "/learn/aeo-audit-checklist"],
    ["AEO Audit Checklist", "/learn/aeo-audit-checklist"],
  ),
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: AEO_CHECKLIST_FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  },
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

export const entityClarityJsonLd = (): object[] => [
  {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Entity Clarity for AI Search — Getting Your Brand Recognised as a Thing",
    description:
      "An engine that cannot resolve your brand string to a distinct entity cannot retrieve you reliably — and may retrieve a collision instead. The SMB disambiguation toolkit: consistent naming, sameAs profiles, Wikidata when warranted, and co-occurrence in crawlable text.",
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
    url: `${SITE.url}/learn/entity-clarity-for-ai`,
    inLanguage: "en",
  },
  breadcrumb(
    ["Home", "/"],
    ["Learn", "/learn/entity-clarity-for-ai"],
    ["Entity Clarity for AI Search", "/learn/entity-clarity-for-ai"],
  ),
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: ENTITY_CLARITY_FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  },
];

export const eeatForAiSearchJsonLd = (): object[] => [
  {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "E-E-A-T for AI Search — Encoding Author Expertise Machines Can Read",
    description:
      "E-E-A-T is Google's quality-rater framework, not an injectable score. Structuring author credentials as Article–Person JSON-LD gives parsers a consistent extraction path — but the credibility must exist off-page first.",
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
    url: `${SITE.url}/learn/eeat-for-ai-search`,
    inLanguage: "en",
  },
  breadcrumb(
    ["Home", "/"],
    ["Learn", "/learn/eeat-for-ai-search"],
    ["E-E-A-T for AI Search", "/learn/eeat-for-ai-search"],
  ),
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: EEAT_FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  },
];

/**
 * Standalone FAQPage JSON-LD for /faq. This is a separate named export so it
 * does NOT modify structuredData (which already contains a FAQPage node for
 * the homepage at lines 97–105). Modifying structuredData would break the
 * toHaveLength(6) assertion in web/__tests__/content-pages.test.ts.
 */
export const faqPageJsonLd = (): object[] => [
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  },
  breadcrumb(["Home", "/"], ["FAQ", "/faq"]),
];

export const llmsTxtImplementationJsonLd = (): object[] => [
  {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "llms.txt Implementation Guide - What It Is and How to Write One",
    description:
      "llms.txt is a hygiene label, not a ranking or citation signal. No current evidence shows it influences whether an answer engine cites your content; it is useful because it is a low-cost canonical summary.",
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
    url: `${SITE.url}/learn/llms-txt-implementation`,
    inLanguage: "en",
  },
  breadcrumb(
    ["Home", "/"],
    ["Learn", "/learn/llms-txt-implementation"],
    ["llms.txt Implementation", "/learn/llms-txt-implementation"],
  ),
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: LLMS_TXT_FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  },
];

export const siteStructureJsonLd = (): object[] => [
  {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Site Structure for AI Citations — Clusters, Hubs, and Passage Retrieval",
    description:
      "Isolated pages lose to clustered pages in AI passage retrieval. The hub-and-spoke pattern — one hub per topic, spokes answering one sub-question each — is how internal linking turns crawlable pages into retrievable ones.",
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
    url: `${SITE.url}/learn/site-structure-ai-citations`,
    inLanguage: "en",
  },
  breadcrumb(
    ["Home", "/"],
    ["Learn", "/learn/site-structure-ai-citations"],
    ["Site Structure for AI Citations", "/learn/site-structure-ai-citations"],
  ),
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: SITE_STRUCTURE_FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  },
];

export const wcagAeoOverlapJsonLd = (): object[] => [
  {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Section 508 and AEO — Where Accessibility Compliance Overlaps AI Search",
    description:
      "Federal contractors meeting Section 508 conformance already satisfy most AI-search structural requirements. Four criteria — 1.3.1, 2.4.2, 4.1.2, 4.1.1 — carry direct AEO parseability effects. Schema is hygiene; 508 removes blockers, not citation gaps.",
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
    url: `${SITE.url}/learn/wcag-aeo-overlap`,
    inLanguage: "en",
  },
  breadcrumb(
    ["Home", "/"],
    ["Learn", "/learn/wcag-aeo-overlap"],
    ["Section 508 and AEO", "/learn/wcag-aeo-overlap"],
  ),
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: WCAG_AEO_FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  },
];

export const faqVsHowToSchemaJsonLd = (): object[] => [
  {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "FAQ Schema vs HowTo Schema — What Each Does for AI Search",
    description:
      "Google deprecated HowTo rich results entirely and restricted FAQ rich results to government and health sites in August 2023. Neither type causes AI citations. This guide covers what each type still does and when to use it.",
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
    url: `${SITE.url}/learn/faq-schema-vs-howto-schema`,
    inLanguage: "en",
  },
  breadcrumb(
    ["Home", "/"],
    ["Learn", "/learn/faq-schema-vs-howto-schema"],
    ["FAQ Schema vs HowTo Schema", "/learn/faq-schema-vs-howto-schema"],
  ),
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_VS_HOWTO_FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  },
];

export const bingWebmasterToolsDocJsonLd = (): object[] => [
  {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "Bing Webmaster Tools guide — verification, sitemap submission, URL inspection, and IndexNow",
    description:
      "How to verify a property in Bing Webmaster Tools, submit a sitemap, inspect URLs for indexing gaps, and use IndexNow to notify Bing of changed pages. Supports the Bing-rank side of the AEO loop; does not guarantee indexing, ranking, or AI citations.",
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
    url: `${SITE.url}/docs/bing-webmaster-tools`,
    inLanguage: "en",
  },
  breadcrumb(
    ["Home", "/"],
    ["Docs", "/docs/bing-webmaster-tools"],
    ["Bing Webmaster Tools", "/docs/bing-webmaster-tools"],
  ),
];
