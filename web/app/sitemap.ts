import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

const sitemap = (): MetadataRoute.Sitemap => [
  { url: `${SITE.url}/`, changeFrequency: "weekly", priority: 1.0 },
];

export default sitemap;
