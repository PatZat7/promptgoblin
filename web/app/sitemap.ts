import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

const sitemap = (): MetadataRoute.Sitemap => [
  { url: `${SITE.url}/`, changeFrequency: "weekly", priority: 1.0 },
  { url: `${SITE.url}/methodology`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${SITE.url}/learn/aeo-vs-geo`, changeFrequency: "monthly", priority: 0.7 },
];

export default sitemap;
