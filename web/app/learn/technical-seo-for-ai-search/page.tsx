import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Technical SEO for AI search · Prompt Goblin",
  description:
    "The technical SEO levers that feed AI Overviews and generative engine visibility: crawlability, canonicals, structured data, and page experience.",
  alternates: { canonical: "/learn/technical-seo-for-ai-search" },
  openGraph: {
    type: "article",
    url: `${SITE.url}/learn/technical-seo-for-ai-search`,
    title: "Technical SEO for AI Search",
    description:
      "What the crawler must reach first before AI citation is possible.",
    images: ["/og-image.png"],
  },
};

const TechnicalSEOForAISearchPage = () => (
  <div className="os">
    <section>
      <h1>Technical SEO for AI search</h1>
      <p>
        AI engines still depend on a crawlable, parseable web. Before citation
        is possible, the engine must reach and trust your page.
      </p>

      <h2>Minimum viable technical baseline</h2>
      <ul>
        <li>Public access: no auth wall on content meant to be cited.</li>
        <li>Canonical URL stable across HTML and JS.</li>
        <li>Structured data accurate and validated.</li>
        <li>Core Web Vitals: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1.</li>
        <li>Crawlable links with descriptive anchor text.</li>
      </ul>

      <h2>Indexation first</h2>
      <p>
        An uncrawlable page is an uncitable page. Submit sitemaps and use
        Search Console to verify Google can reach the authoritative landing.
      </p>
    </section>
  </div>
);

export default TechnicalSEOForAISearchPage;
