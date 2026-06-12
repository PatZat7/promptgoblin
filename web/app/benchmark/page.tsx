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
      "Illustrative benchmark snapshot — updates as pipeline runs accumulate. Shows how Prompt Goblin measures citation gaps: visibility score, structural blockers, and platform distribution.",
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

      <h2>Context</h2>
      <p>
        The metrics on this page — visibility score, structural blockers, and
        platform distribution — reflect the measurements described in the pages
        below. Read them to understand what each number means before drawing
        conclusions from the snapshot.
      </p>
      <ul>
        <li><a href="/methodology">Scan methodology — how each finding is measured</a></li>
        <li><a href="/learn/how-to-show-up-in-chatgpt">How to show up in ChatGPT — the three levers the benchmark tracks</a></li>
        <li><a href="/learn/bing-rank-and-ai-citations">Bing rank and AI citations — why platform distribution matters</a></li>
      </ul>
    </section>
  </div>
);

export default BenchmarkPage;
