import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Methodology · Prompt Goblin",
  description:
    "How the scan works, what each finding means, what we don't claim, and where human review sits in the process.",
  alternates: { canonical: "/methodology" },
  openGraph: {
    type: "article",
    url: `${SITE.url}/methodology`,
    title: "Scan Methodology",
    description:
      "What Prompt Goblin measures, what each finding means, and what we do not claim.",
    images: ["/og-image.png"],
  },
};

const MethodologyPage = () => (
  <div className="os">
    <section>
      <h1>Methodology</h1>
      <p>
        The scan is a four-layer pipeline: technical hygiene → schema → AI
        visibility → accessibility.
      </p>
      <ul>
        <li>Recon auto-discovers company profile and up to two competitors.</li>
        <li>Tier-1 static fetch scores hygiene: crawlability, canonicals, links, structured data.</li>
        <li>Tier-2 live fetch checks citations and platform presence.</li>
        <li>Human review gates every delivered fix.</li>
      </ul>
      <p>
        Honest broker: schema and llms.txt are hygiene, not citation levers. We
        do not promise a citation number. Refund covers the work, not the
        outcome.
      </p>

      <h2>Go deeper</h2>
      <ul>
        <li><a href="/learn/technical-seo-for-ai-search">Technical SEO for AI search — the crawl and indexation floor</a></li>
        <li><a href="/learn/bing-rank-and-ai-citations">Bing rank and AI citations — why platform distribution matters</a></li>
        <li><a href="/faq">FAQ — pricing, guarantee, and what we don&apos;t promise</a></li>
      </ul>
    </section>
  </div>
);

export default MethodologyPage;
