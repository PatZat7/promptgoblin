import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

// AI answer-engine crawlers we explicitly welcome (we want to be cited).
const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "PerplexityBot",
  "Google-Extended",
];

const robots = (): MetadataRoute.Robots => ({
  rules: [
    { userAgent: "*", allow: "/" },
    ...AI_BOTS.map((userAgent) => ({ userAgent, allow: "/" })),
  ],
  sitemap: `${SITE.url}/sitemap.xml`,
});

export default robots;
