import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Citation Fabrications · Prompt Goblin",
  description:
    "Why unverified AI citations are unsafe and how verification prevents fabricated sources from reaching decisions.",
  alternates: { canonical: "/learn/ai-citation-hallucinations" },
  openGraph: {
    type: "article",
    url: "https://promptgoblin.io/learn/ai-citation-hallucinations",
    title: "AI Citation Fabrications",
    description:
      "The fabrication crisis in AI citations: independent findings, growth trend, and why verification is the answer.",
    images: ["/og-image.png"],
  },
};

const AiCitationHallucinationsPage = () => (
  <div className="os">
    <section>
      <h1>AI Citation Fabrications</h1>
      <p>
        Independent investigations find roughly half of AI system citations are
        unsupported. Trust-eroded environments require verification, not volume.
      </p>

      <h2>Key signals</h2>
      <ul>
        <li>Hallucination rate in independent investigations: ~51%.</li>
        <li>Growth trend: increase in affected papers and citations over time.</li>
        <li>Real-world consequence: court sanctions and professional harm.</li>
      </ul>

      <h2>What Prompt Goblin does differently</h2>
      <p>
        Our verification layer cross-checks each cited URL with HTTP status,
        canonical resolution, and content match. Fabricated or unverifiable
        citations lower confidence in the report and appear explicitly in the
        dashboard.
      </p>
    </section>
  </div>
);

export default AiCitationHallucinationsPage;
