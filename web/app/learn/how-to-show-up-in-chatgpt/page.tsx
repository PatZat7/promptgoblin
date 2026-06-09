import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to show up in ChatGPT · Prompt Goblin",
  description:
    "What actually makes a website show up inside ChatGPT and other answer engines — and what almost everyone gets wrong.",
};

export default function Page() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
      <h1>How to Show Up in ChatGPT</h1>
      <p>
        The fastest way to get an AI assistant to cite your site is to create the kind of page it
        can’t safely ignore: a direct, named, verifiable answer — then make that answer trivially
        parseable.
      </p>

      <h2>What actually gets cited</h2>
      <ul>
        <li>Pages where a specific entity is the clear subject of the URL, title, headings, and body.</li>
        <li>Pages that answer one question in one place, in plain language, in the first 150 words.</li>
        <li>Pages with JSON-LD that matches what they say in prose.</li>
        <li>Pages that Bing has actually indexed. For many assistants, Bing-index is the filter.</li>
      </ul>

      <h2>What doesn’t work</h2>
      <ul>
        <li>Relying on Google alone. Google indexing is necessary but not sufficient.</li>
        <li>“LLM-only” markup tricks. The official guidance is to publish the same good content for
            humans and crawlers; no special wrapper format is needed.</li>
        <li>Thin summary pages created for machines. Those are treated as low-value and ignored.</li>
      </ul>

      <h2>The actionable sequence</h2>
      <ol>
        <li>Pick one entity or claim you want quoted.</li>
        <li>Publish a dedicated page named after that exact claim.</li>
        <li>Front-load the answer in the first paragraph.</li>
        <li>Add one or more JSON-LD blocks: Organization, FAQPage, or Service.</li>
        <li>Submit the page to Bing via IndexNow or sitemap.</li>
        <li>Track whether the term appears in your AEO scorecard over the next 30–90 days.</li>
      </ol>
    </main>
  );
}
