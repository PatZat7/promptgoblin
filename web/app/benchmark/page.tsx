import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Citation Landscape Benchmark · Prompt Goblin",
  description:
    "Prompt Goblin's own citation landscape benchmark: visibility score, citation gaps, and platform distribution across sample verticals.",
  alternates: { canonical: "/benchmark" },
  openGraph: {
    type: "article",
    url: `${SITE.url}/benchmark`,
    title: "Citation Landscape Benchmark",
    description:
      "Quarterly benchmark data from Prompt Goblin's own citation pipeline: average visibility score, common citation gaps, and platform distribution.",
    images: ["/og-image.png"],
  },
};

const BenchmarkPage = () => (
  <div className="os">
    <section>
      <h1>Citation Landscape Benchmark</h1>
      <p>
        We treat our own site as a benchmark domain and publish the aggregate
        findings. This page updates as the pipeline dataset grows. Current
        snapshot is illustrative until a real run exists.
      </p>

      <h2>What we measure</h2>
      <ul>
        <li>Average visibility score per vertical.</li>
        <li>Most common citation gaps.</li>
        <li>Platform distribution (ChatGPT vs Google AIO).</li>
        <li>Structural blockers.</li>
      </ul>

      <h2>Methodology</h2>
      <p>
        Sample domains are chosen without cherry-picking. The crawler reports
        what it can reach and flags JS-rendered blind spots. Results are labeled
        by pipeline version and date.
      </p>
    </section>
  </div>
);

export default BenchmarkPage;
