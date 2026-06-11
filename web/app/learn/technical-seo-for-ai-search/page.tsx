import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Technical SEO for AI search · Prompt Goblin",
  description:
    "The technical conditions that determine whether an answer engine can find, crawl, and cite your content.",
  alternates: { canonical: "/learn/technical-seo-for-ai-search" },
};

export default function Page() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
      <h1>Technical SEO for AI Search</h1>
      <p>
        AI search does not remove the old rules — it adds harder ones. Discoverable content
        requires crawlable URLs, stable canonical targets, and structured data that doesn't
        disagree with the prose.
      </p>

      <h2>The minimum pass</h2>
      <ul>
        <li>Every primary page returns 200, not soft 404.</li>
        <li>One canonical URL declared consistently in HTML, HTTP header, and sitemap.</li>
        <li>Structured data matches the page content and validates JSON-LD.</li>
        <li>Sitemap is submitted and kept accurate after each publish.</li>
        <li>Core Web Vitals meet field thresholds: LCP ≤2.5s, CLS ≤0.1, INP ≤200ms.</li>
        <li>HTTPS with a valid certificate and no mixed-content warnings.</li>
        <li>Mobile layout returns the same content as desktop, without hiding core text.</li>
      </ul>

      <h2>High-risk patterns</h2>
      <ul>
        <li>Client-rendered content hidden behind user interaction or infinite scroll.</li>
        <li>Framework-level routing that changes canonical without a server redirect.</li>
        <li>Duplicate or thin content created at scale, especially for generative AI targets.</li>
      </ul>

      <h2>The semantic-floor checklist</h2>
      <ul>
        <li>Semantic HTML5 landmarks are used: `header`, `main`, `article`, `section`, `nav`.</li>
        <li>Headings are in order with no skipped levels.</li>
        <li>Keyboard-accessible controls have visible focus states.</li>
        <li>Images that communicate meaning include descriptive `alt` text.</li>
        <li>Interactive elements use real buttons or links rather than styled divs.</li>
      </ul>

      <h2>Why this matters for AI overviews</h2>
      <p>
        Answer engines still depend on a reconstructed crawl snapshot. Clean technical hygiene
        raises the probability that your content is included in that snapshot and that the
        engine can assign it to the right answer slot.
      </p>
    </main>
  );
}