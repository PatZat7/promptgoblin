import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Bing Webmaster Tools guide · Prompt Goblin",
  description:
    "How to verify a Bing property, submit sitemaps, inspect URLs, and use IndexNow for faster discovery.",
  alternates: { canonical: "/docs/bing-webmaster-tools" },
  openGraph: {
    type: "article",
    url: `${SITE.url}/docs/bing-webmaster-tools`,
    title: "Bing Webmaster Tools Guide",
    description:
      "Practical steps to boost Bing index coverage and AI citation discovery.",
    images: ["/og-image.png"],
  },
};

const BingWebmasterToolsPage = () => (
  <div className="os">
    <section>
      <h1>Bing Webmaster Tools guide</h1>
      <p>
        Bing preserves a web-scale index that feeds answer engines and LLM
        discovery. This guide covers the minimum verification and submission
        workflow.
      </p>

      <h2>Steps</h2>
      <ol>
        <li>Claim and verify the site property in Bing Webmaster Tools.</li>
        <li>Submit the sitemap.</li>
        <li>Use URL Inspection for coverage gaps.</li>
        <li>Enable IndexNow for instant change notification.</li>
      </ol>

      <h2>Honest broker</h2>
      <p>
        Submission and verification improve discovery and diagnostics. They do
        not guarantee ranking, indexing, or AI citation outcomes.
      </p>
    </section>
  </div>
);

export default BingWebmasterToolsPage;
