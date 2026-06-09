import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Report Guide · Prompt Goblin",
  description:
    "How to read a Prompt Goblin scan report, severity levels, stack-specific fix snippets, and the AI-prompt artifact.",
  alternates: { canonical: "/docs/report-guide" },
  openGraph: {
    type: "article",
    url: `${SITE.url}/docs/report-guide`,
    title: "Report Guide",
    description:
      "Severity levels, finding types, stack-specific fix snippets, and how to use the delivered AI-prompt artifact.",
    images: ["/og-image.png"],
  },
};

const ReportGuidePage = () => (
  <div className="os">
    <section>
      <h1>Report Guide</h1>
      <p>
        Each delivered scan report contains a prioritized fix queue, platform
        lanes, a stack-specific implementation snippet, and an AI-prompt artifact
        meant for the client&apos;s own coding or CMS workflow.
      </p>

      <h2>What the severity levels mean</h2>
      <ul>
        <li>High: blockers for crawl, index, or citation eligibility.</li>
        <li>Medium: hygiene and structure gaps.</li>
        <li>Low: improvements that reduce friction.</li>
      </ul>
    </section>
  </div>
);

export default ReportGuidePage;
