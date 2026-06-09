import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Accessibility SEO audit · Prompt Goblin",
  description:
    "Why an accessibility audit is a prerequisite for AI search visibility and search engine crawl hygiene.",
  alternates: { canonical: "/learn/accessibility-seo-audit" },
  openGraph: {
    type: "article",
    url: `${SITE.url}/learn/accessibility-seo-audit`,
    title: "Accessibility SEO Audit",
    description:
      "Accessible structure is machine-readable structure: the same signals that help assistive tech also help crawlers and agents.",
    images: ["/og-image.png"],
  },
};

const AccessibilitySeoAuditPage = () => (
  <div className="os">
    <section>
      <h1>Accessibility SEO audit</h1>
      <p>
        Accessibility and search visibility share a root cause: poorly
        structured, machine-unreadable markup. An accessibility audit is a
        reliable pre-publish signal for crawl and AI visibility quality.
      </p>

      <h2>What an accessibility audit catches SEO first</h2>
      <ul>
        <li>Semantic HTML, landmark roles, and heading hierarchy.</li>
        <li>Keyboard access and focus state for actionable elements.</li>
        <li>Image alt text and media labeling.</li>
        <li>Consistent accessible names for form controls.</li>
      </ul>
    </section>
  </div>
);

export default AccessibilitySeoAuditPage;
