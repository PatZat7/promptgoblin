import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bing rank and AI citations · Prompt Goblin",
  description:
    "How Bing indexing and IndexNow accelerate AI Overview and assistant citations.",
  alternates: { canonical: "/learn/bing-rank-and-ai-citations" },
};

export default function Page() {
  return (
    <article style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
      <h1>Bing Rank and AI Citations</h1>
      <p>
        Bing remains the practical on-ramp for many assistant and AI-search citation systems.
        If your site is not in Bing, your citation odds drop sharply.
      </p>

      <h2>What to do first</h2>
      <ol>
        <li>Create and verify a Bing Webmaster Tools account.</li>
        <li>Submit your sitemap once to establish ownership.</li>
        <li>Add IndexNow so every new or changed URL can be signaled the instant it ships.</li>
      </ol>

      <h2>What Bing rewards</h2>
      <ul>
        <li>Stable URL history and low churn.</li>
        <li>Named entities in JSON-LD, headlines, and first paragraphs.</li>
        <li>Third-party references to the same URL from authoritative sources.</li>
        <li>Low soft-404 rate and consistent response shape.</li>
      </ul>

      <h2>IndexNow as a habit</h2>
      <p>
        Use the site’s <code>/indexnow</code> endpoint after every publish. Pair this with a
        quarterly review in Bing Webmaster Tools for crawl errors, indexed pages, and
        query coverage.
      </p>
    </article>
  );
}
