import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

const sitemap = (): MetadataRoute.Sitemap => [
  { url: `${SITE.url}/`, changeFrequency: "weekly", priority: 1.0 },
  { url: `${SITE.url}/methodology`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${SITE.url}/learn/aeo-vs-geo`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${SITE.url}/faq`, changeFrequency: "monthly", priority: 0.6 },
  { url: `${SITE.url}/benchmark`, changeFrequency: "monthly", priority: 0.6 },
  { url: `${SITE.url}/learn/how-to-show-up-in-chatgpt`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${SITE.url}/learn/technical-seo-for-ai-search`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${SITE.url}/learn/bing-rank-and-ai-citations`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${SITE.url}/learn/accessibility-seo-audit`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${SITE.url}/docs/bing-webmaster-tools`, changeFrequency: "monthly", priority: 0.6 },
  { url: `${SITE.url}/docs/report-guide`, changeFrequency: "monthly", priority: 0.5 },
  { url: `${SITE.url}/learn/ai-citation-hallucinations`, changeFrequency: "monthly", priority: 0.6 },
  { url: `${SITE.url}/learn/why-schema-not-enough`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${SITE.url}/learn/aeo-audit-checklist`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${SITE.url}/learn/rank-but-not-cited`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${SITE.url}/learn/eeat-for-ai-search`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${SITE.url}/learn/entity-clarity-for-ai`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${SITE.url}/learn/llms-txt-implementation`, changeFrequency: "monthly", priority: 0.7 },
];

export default sitemap;
