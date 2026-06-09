import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "AEO vs GEO · Prompt Goblin",
  description:
    "Answer Engine Optimization vs Generative Engine Optimization — the zero-click shift, how AI citations work, and what actually predicts being cited.",
  alternates: { canonical: "/learn/aeo-vs-geo" },
  openGraph: {
    type: "article",
    url: `${SITE.url}/learn/aeo-vs-geo`,
    title: "AEO vs GEO",
    description:
      "What gets cited, what doesn't, and the signals that predict AI citation outcomes.",
    images: ["/og-image.png"],
  },
};

const AeoVsGeoPage = () => (
  <div className="os">
    <section>
      <h1>AEO vs GEO</h1>
      <p>
        The market still conflates these. The difference matters because the
        levers are different.
      </p>
      <ul>
        <li>
          <strong>AEO</strong> — optimizing for answer engines: ChatGPT, Claude,
          Gemini, Perplexity, Google AI Overviews.
        </li>
        <li>
          <strong>GEO</strong> — optimizing for generative engine summaries: the
          cited sources in an AI-written response.
        </li>
        <li>
          <strong>Traditional SEO</strong> — optimizing for blue-link ranking in
          Google organic results.
        </li>
      </ul>
      <p>
        80% of ChatGPT citations don't rank in Google's top 100. CTR fell from
        1.76% to 0.61% for AI Overview queries. The zero-click shift is real.
      </p>
      <p>
        What predicts AI citation: direct answer in first 50 words, named-entity
        density (15+ entities), HTML tables, topical authority signal, freshness
        cadence, and third-party platform presence.
      </p>
    </section>
  </div>
);

export default AeoVsGeoPage;
