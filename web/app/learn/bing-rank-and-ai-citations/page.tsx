import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Bing rank and AI citations · Prompt Goblin",
  description:
    "How Bing indexes influence AI citation share and the practical steps to improve it.",
  alternates: { canonical: "/learn/bing-rank-and-ai-citations" },
  openGraph: {
    type: "article",
    url: `${SITE.url}/learn/bing-rank-and-ai-citations`,
    title: "Bing Rank and AI Citations",
    description:
      "Bing's index is an important source for AI citation discovery and verification.",
    images: ["/og-image.png"],
  },
};

const BingRankAndAiCitationsPage = () => (
  <div className="os">
    <section>
      <h1>Bing rank and AI citations</h1>
      <p>
        Bing remains a primary discovery and verification surface for AI engines
        that rely on web search results. Strong Bing presence increases the odds
        of being surfaced, cited, and listed.
      </p>

      <h2>Why Bing matters for AEO</h2>
      <ul>
        <li>Bing Webmaster Tools diagnostics and index coverage.</li>
        <li>IndexNow for instant change notification.</li>
        <li>Third-party profile presence on Bing-indexed platforms.</li>
      </ul>

      <h2>Submission is not a citation guarantee</h2>
      <p>
        Submitting to Bing improves discovery and crawl coverage. Citation remains
        a content quality, authority, and trust signal — not a protocol reset.
      </p>
    </section>
  </div>
);

export default BingRankAndAiCitationsPage;
