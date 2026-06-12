import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { JsonLd } from "@/components/system/JsonLd";
import { accessibilitySeoJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Accessibility SEO audit · Prompt Goblin",
  description:
    "Accessible structure is machine-readable structure. Why a WCAG 2.1 AA audit is a prerequisite for AI search visibility, and what it catches that a traditional SEO tool misses.",
  alternates: { canonical: "/learn/accessibility-seo-audit" },
  openGraph: {
    type: "article",
    url: `${SITE.url}/learn/accessibility-seo-audit`,
    title: "Accessibility SEO audit",
    description:
      "The same semantic signals that help assistive tech also help crawlers and AI agents parse your content.",
    images: ["/og-image.png"],
  },
};

const AccessibilitySeoAuditPage = () => (
  <>
    {accessibilitySeoJsonLd().map((d, i) => <JsonLd key={i} data={d} />)}
    <article style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 80px" }}>
      <h1>Accessibility SEO audit</h1>

      <p style={{ marginTop: "1.2em", lineHeight: 1.7 }}>
        Accessible structure is machine-readable structure. The same semantic signals that
        help a screen reader understand your page — landmark roles, heading hierarchy, image
        alt text, labelled controls — also help crawlers, AI agents, and language models
        parse and extract your content. An accessibility audit is therefore a reliable
        pre-publish signal for crawl quality and AI visibility — not a parallel compliance
        track, but the same track.
      </p>

      {/* ---- Why they share a root cause ---- */}
      <h2 style={{ marginTop: "2.4em" }}>Why accessibility and AI visibility share a root cause</h2>
      <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
        Both assistive technology and web crawlers parse the HTML structure of a page, not
        the visual rendering. A heading that looks big because of CSS but is marked up as a
        <code> &lt;div class=&quot;big-text&quot;&gt;</code> communicates nothing about document
        structure. A button that is a styled <code>&lt;div&gt;</code> is keyboard-inaccessible
        and semantically opaque. An image without <code>alt</code> text is invisible to any
        automated reader. In each case, the fix for accessibility <em>is</em> the fix for
        crawlability.
      </p>

      {/* ---- What an a11y audit catches ---- */}
      <h2 style={{ marginTop: "2.4em" }}>What an accessibility audit catches that a standard SEO tool misses</h2>

      <h3 style={{ marginTop: "1.2em" }}>Heading hierarchy violations</h3>
      <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
        Skipped heading levels (going from H1 directly to H3, or using multiple H1s) break
        the document outline that crawlers use to understand content relationships. Standard
        keyword tools do not flag this. axe-core and manual accessibility audits catch it
        immediately.
      </p>

      <h3 style={{ marginTop: "1.2em" }}>Missing or inadequate alt text</h3>
      <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
        Images that communicate meaning — charts, diagrams, product photos, screenshots — are
        invisible to any automated reader without descriptive alt text. Google can sometimes
        infer image subject from surrounding context, but the information in the image is lost.
        For AI extraction, the rule is simpler: if the meaning is in the image and not in the
        text, it will not be cited.
      </p>

      <h3 style={{ marginTop: "1.2em" }}>Non-semantic interactive elements</h3>
      <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
        <code>&lt;div&gt;</code> and <code>&lt;span&gt;</code> elements styled as buttons or
        links are invisible to keyboard navigation and to accessibility trees. They also
        confuse crawlers that try to map the interactive elements on a page. Real{" "}
        <code>&lt;button&gt;</code> and <code>&lt;a href&gt;</code> elements with visible
        focus states solve both problems simultaneously.
      </p>

      <h3 style={{ marginTop: "1.2em" }}>Landmark structure</h3>
      <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
        HTML5 landmark elements — <code>&lt;header&gt;</code>, <code>&lt;main&gt;</code>,{" "}
        <code>&lt;nav&gt;</code>, <code>&lt;article&gt;</code>, <code>&lt;section&gt;</code>,{" "}
        <code>&lt;footer&gt;</code> — tell any automated reader which part of the page
        contains the primary content versus navigation, supplementary content, or site chrome.
        Without landmarks, a crawler must guess. With them, the primary content slot is
        explicitly labelled.
      </p>

      <h3 style={{ marginTop: "1.2em" }}>Colour contrast and legibility</h3>
      <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
        WCAG 2.1 AA requires a contrast ratio of at least 4.5:1 for small text and 3:1 for
        large text. This does not affect crawl directly, but contrast violations are a
        reliable signal that the visual hierarchy of a page was built for looks over
        legibility — which correlates with other structural shortcuts that do affect crawl.
        An audit that finds contrast issues will usually find structure issues in the same
        pass.
      </p>

      <h3 style={{ marginTop: "1.2em" }}>Focus management and keyboard navigation</h3>
      <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
        Keyboard-accessible navigation is required for WCAG 2.1 AA and Section 508. It is
        also the navigation model that many automated agents use when interacting with pages.
        Broken focus traps, missing focus indicators, and skip-navigation failures leave both
        human keyboard users and automated agents unable to reach parts of the page.
      </p>

      {/* ---- WCAG 2.1 AA vs Section 508 ---- */}
      <h2 style={{ marginTop: "2.4em" }}>WCAG 2.1 AA and Section 508</h2>
      <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
        Prompt Goblin audits to WCAG 2.1 Level AA — the standard required for US federal
        procurement (Section 508) and most enterprise B2B accessibility policies. The two
        standards are closely aligned: Section 508 incorporates WCAG 2.0 by reference and
        most organisations treat WCAG 2.1 AA as the practical target.
      </p>
      <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
        Government and institutional sites selling to the US public sector need Section 508
        compliance as a contract prerequisite. The accessibility audit is the evidence
        artifact. We provide it as part of the scan report.
      </p>

      {/* ---- The audit checklist ---- */}
      <h2 style={{ marginTop: "2.4em" }}>Accessibility audit checklist (abridged)</h2>
      <ul style={{ marginTop: "0.8em", lineHeight: 1.9, paddingLeft: "1.4em" }}>
        <li>One <code>&lt;h1&gt;</code> per page; heading levels in strict order (no skips)</li>
        <li>All landmark roles present: <code>banner</code>, <code>main</code>, <code>navigation</code>, <code>contentinfo</code></li>
        <li>All informative images have non-empty, descriptive <code>alt</code> attributes</li>
        <li>Decorative images have <code>alt=&quot;&quot;</code> (empty, not missing)</li>
        <li>All interactive elements are reachable and operable by keyboard alone</li>
        <li>Visible focus ring on every focusable element (not just <code>:focus-visible</code>)</li>
        <li>All form inputs have associated <code>&lt;label&gt;</code> elements or <code>aria-label</code></li>
        <li>Colour contrast ≥ 4.5:1 for body text; ≥ 3:1 for large text (18px+ bold or 24px+)</li>
        <li>No auto-playing audio without a pause control</li>
        <li>No flashing content faster than 3 Hz (seizure risk)</li>
        <li>Skip navigation link available for keyboard users</li>
        <li>Language declared on <code>&lt;html lang=&quot;en&quot;&gt;</code></li>
        <li>Page title (<code>&lt;title&gt;</code>) is descriptive and unique</li>
      </ul>

      {/* ---- How Prompt Goblin runs this ---- */}
      <h2 style={{ marginTop: "2.4em" }}>How Prompt Goblin runs the accessibility audit</h2>
      <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
        The scan pipeline runs axe-core against the rendered page across multiple component
        states — not just a single viewport snapshot — and against real rendered HTML, not a
        source-code static analysis. Each finding is ranked by impact (critical / serious /
        moderate / minor) with a specific WCAG criterion, a code reference, and a fix prompt
        a developer can act on directly.
      </p>
      <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
        Accessibility findings are included in the same ranked task list as the citation and
        technical SEO findings. The engineer review step covers all three tracks in a single
        pass.
      </p>

      {/* ---- FAQ ---- */}
      <h2 style={{ marginTop: "2.4em" }}>Frequently asked questions</h2>

      <h3 style={{ marginTop: "1.2em" }}>Does fixing accessibility directly improve AI citations?</h3>
      <p style={{ marginTop: "0.5em", lineHeight: 1.7 }}>
        Fixing structural accessibility issues — heading order, landmark roles, semantic
        HTML — improves the machine-readability of the page. This raises the probability that
        a crawler correctly parses the content hierarchy, which is a prerequisite for
        citation. It is not a sufficient condition on its own; the three citation levers
        (mentions, rank, extractable content) still apply.
      </p>

      <h3 style={{ marginTop: "1.2em" }}>Do government sites need Product schema?</h3>
      <p style={{ marginTop: "0.5em", lineHeight: 1.7 }}>
        No. Service and government organisations correctly use Service, OfferCatalog, and
        GovernmentOrganization schema types. We never flag a service or government site for
        &ldquo;missing Product schema&rdquo; — that would be incorrect advice.
      </p>

      <h3 style={{ marginTop: "1.2em" }}>What tools does the audit use?</h3>
      <p style={{ marginTop: "0.5em", lineHeight: 1.7 }}>
        axe-core for automated rule checking (catches roughly 30–40% of WCAG issues
        mechanically), combined with manual review of heading structure, landmark roles,
        keyboard navigation, and colour contrast. Automated tools alone are not sufficient;
        manual review is required for a complete audit.
      </p>

      {/* ---- Internal links ---- */}
      <h2 style={{ marginTop: "2.4em" }}>Go deeper</h2>
      <ul style={{ marginTop: "0.6em", lineHeight: 2, paddingLeft: "1.4em" }}>
        <li><a href="/learn/technical-seo-for-ai-search">Technical SEO for AI search</a></li>
        <li><a href="/learn/how-to-show-up-in-chatgpt">How to show up in ChatGPT — the three levers</a></li>
        <li><a href="/methodology">How the Prompt Goblin scan works — methodology</a></li>
        <li><a href="/faq">FAQ</a></li>
      </ul>
    </article>
  </>
);

export default AccessibilitySeoAuditPage;
