import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "How to show up in ChatGPT · Prompt Goblin",
  description:
    "What actually makes a brand show up inside ChatGPT answers — and why 80% of cited pages don't rank in Google's top 100.",
  alternates: { canonical: "/learn/how-to-show-up-in-chatgpt" },
  openGraph: {
    type: "article",
    url: `${SITE.url}/learn/how-to-show-up-in-chatgpt`,
    title: "How to Show Up in ChatGPT",
    description:
      "The levers that predict AI citations: direct-answer frontloading, entity density, HTML tables, freshness, and third-party platform presence.",
    images: ["/og-image.png"],
  },
};

const HowToShowUpInChatGPTPage = () => (
  <div className="os">
    <section>
      <h1>How to show up in ChatGPT</h1>
      <p>
        When a user asks an LLM for recommendations or listicles, the model
        returns sourced statements, not a ranked page of blue links. Prompt
        Goblin measures the gap between being discoverable on the web and being
        cited inside answers.
      </p>

      <h2>What predicts ChatGPT citations</h2>
      <ul>
        <li>A direct answer in the first 50 words.</li>
        <li>Named-entity density: 15+ linked entities on the page.</li>
        <li>HTML tables: citation lift versus equivalent prose.</li>
        <li>Topical authority signal: connected entities and depth (r=0.41).</li>
        <li>Freshness: finance and news segments update within 30 days.</li>
        <li>Third-party presence: G2 / Capterra / Google Business Profile.</li>
      </ul>

      <h2>How Bing feeds ChatGPT</h2>
      <p>
        Bing powers a large share of discoverable citations for AI summaries. A
        clean Bing presence increases the crawlable surface that AI engines draw
        from.
      </p>
    </section>
  </div>
);

export default HowToShowUpInChatGPTPage;
