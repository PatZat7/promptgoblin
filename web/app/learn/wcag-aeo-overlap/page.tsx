import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { JsonLd } from "@/components/system/JsonLd";
import { wcagAeoOverlapJsonLd } from "@/lib/structured-data";
import { FAQ_ITEMS, SOURCES } from "./wcag-aeo-overlap.data";

export const metadata: Metadata = {
  title: "Section 508 and AEO — Where Accessibility Compliance Overlaps AI Search · Prompt Goblin",
  description:
    "Section 508 conformance satisfies most AI-search structural requirements. Criteria 1.3.1, 2.4.2, 4.1.2, 4.1.1 have direct AEO effects. Schema is hygiene.",
  alternates: { canonical: "/learn/wcag-aeo-overlap" },
  openGraph: {
    type: "article",
    url: `${SITE.url}/learn/wcag-aeo-overlap`,
    title: "Section 508 and AEO — Where Accessibility Compliance Overlaps AI Search",
    description:
      "Which Section 508 criteria a federal contractor already maintains also carry AI-search parseability weight — and what 508 conformance does not do for citations.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return (
    <>
      {wcagAeoOverlapJsonLd().map((d, i) => (
        <JsonLd key={i} data={d} />
      ))}
      <article style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 80px" }}>
        <h1>Section 508 and AEO &mdash; where accessibility compliance overlaps AI search</h1>

        <p style={{ marginTop: "1.2em", lineHeight: 1.7 }}>
          The Section 508 refresh (2017/2018) incorporates WCAG 2.0 Level AA by reference.
          Federal contractors and agencies who certify 508 conformance already maintain semantic
          HTML, accessible names, and valid markup &mdash; the same structural conditions that
          make a page parseable to an AI crawler. The marginal AEO work is content shape, not
          re-engineering.
        </p>

        {/* ---- Why the overlap exists ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Why the overlap exists</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Assistive technology and web crawlers consume content through the same path: the
          accessibility tree built from semantic HTML. A screen reader resolving a heading
          hierarchy and an AI crawler extracting a passage are both reading programmatic structure
          &mdash; not visual layout. WCAG 2.0 AA criteria that enforce semantic structure also
          enforce the conditions that allow a crawler to reliably extract named entities, question
          answers, and navigational context.
        </p>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          This mechanic is the same one described at{" "}
          <a href="/learn/accessibility-seo-audit">Accessibility SEO audit (general audience)</a>.
          This page is scoped to the specific 508/WCAG criteria a procurement buyer must certify
          and what each one carries in AEO terms. The general accessibility-SEO case &mdash;
          landmark roles, skip links, focus management &mdash; lives at that companion page.
        </p>

        {/* ---- The four criteria ---- */}
        <h2 style={{ marginTop: "2.4em" }}>
          Four 508/WCAG criteria with direct AEO-relevant structure
        </h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          These are not the only 508 criteria worth maintaining &mdash; they are the four whose
          compliance requirement and parseability effect most directly overlap. Each is a WCAG 2.0
          Level AA success criterion incorporated into the 508 refresh.
        </p>

        <h3 style={{ marginTop: "1.4em" }}>
          1.3.1 Info and Relationships (Level A)
        </h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          <strong>What 508 requires:</strong> Information, structure, and relationships conveyed
          through presentation must be determinable programmatically or available in text. In
          practice: heading hierarchy (&lt;h1&gt;&ndash;&lt;h6&gt;), list semantics (&lt;ul&gt;,
          &lt;ol&gt;), table structure (&lt;th&gt;, &lt;caption&gt;, &lt;scope&gt;), and form
          label association (&lt;label for&gt;) must be marked up, not merely styled.
        </p>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          <strong>What it also gives a parser:</strong> A correctly marked-up heading tree is
          extractable structure. A crawler reading &lt;h2&gt;Eligibility requirements&lt;/h2&gt;
          followed by a &lt;ul&gt; of criteria can parse that as a discrete passage. The same
          content rendered as &lt;div class=&quot;heading&quot;&gt; styled to look like a heading
          is opaque to both assistive technology and a passage extractor. 1.3.1 conformance is,
          structurally, the most direct AEO contribution on this list.
        </p>

        <h3 style={{ marginTop: "1.4em" }}>
          2.4.2 Page Titled (Level A)
        </h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          <strong>What 508 requires:</strong> Web pages have titles that describe topic or
          purpose. Every page must carry a meaningful, unique &lt;title&gt; element.
        </p>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          <strong>What it also gives a parser:</strong> The &lt;title&gt; element is a primary
          retrieval surface for Bing and other indexers. It is one of the first signals used to
          match a query to a candidate URL. A page conforming to 2.4.2 has, by definition, a
          descriptive, unique title &mdash; which is also the title that appears in a Bing search
          result and in AI citation surfaces. Empty, generic, or duplicated titles block both
          screen readers and index retrieval.
        </p>

        <h3 style={{ marginTop: "1.4em" }}>
          4.1.2 Name, Role, Value (Level AA)
        </h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          <strong>What 508 requires:</strong> For all user interface components, the name and
          role must be programmatically determinable; states, properties, and values that can be
          set by the user must be programmatically determinable. Concretely: every button, link,
          form field, and interactive widget must expose an accessible name (via &lt;label&gt;,
          aria-label, or aria-labelledby) and a semantic role (via native HTML or ARIA role).
        </p>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          <strong>What it also gives a parser:</strong> Accessible names are machine-readable
          interactive semantics. An AI agent or automated testing tool reading a page can
          determine what a &ldquo;Submit application&rdquo; button does, what a &ldquo;Search
          procurement portal&rdquo; input expects, and which links navigate to substantive
          content versus decorative icons. This is the criterion most relevant to
          tool-using AI agents that interact with government forms and portals &mdash; not just
          crawlers reading static content.
        </p>

        <h3 style={{ marginTop: "1.4em" }}>
          4.1.1 Parsing (Level A) &mdash; note its WCAG 2.2 removal
        </h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          <strong>What 508 requires:</strong> In content implemented using markup languages,
          elements must have complete start and end tags, be nested according to spec, not contain
          duplicate attributes, and have unique IDs. This is valid markup &mdash; no broken HTML
          structure.
        </p>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          <strong>What it also gives a parser:</strong> Invalid markup (unclosed tags, duplicate
          IDs, illegal nesting) forces parsers to guess DOM structure through error recovery.
          Different parsers recover differently, so the accessibility tree a crawler sees may not
          match the visual page. Valid markup removes that variance.
        </p>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          <strong>Important version note:</strong> 4.1.1 Parsing is present in WCAG 2.0 and
          WCAG 2.1, which are the versions Section 508 incorporates. It was{" "}
          <strong>removed in WCAG 2.2</strong> (published October 2023) because modern HTML
          parsers effectively satisfy it by default &mdash; W3C concluded it was no longer a
          meaningful distinct criterion. Agencies whose policy references WCAG 2.2 no longer
          track 4.1.1 as a separate success criterion. Those on WCAG 2.0 or 2.1 baselines
          retain it. The Section 508 standard itself still points at WCAG 2.0 AA, so the
          criterion formally applies to 508 conformance claims regardless of an agency&apos;s
          internal WCAG version policy.
        </p>

        {/* ---- Comparison table ---- */}
        <h2 style={{ marginTop: "2.4em" }}>
          508/WCAG criterion &rarr; compliance requirement &rarr; parseability effect
        </h2>
        <table
          style={{
            marginTop: "0.8em",
            width: "100%",
            borderCollapse: "collapse",
            lineHeight: 1.6,
          }}
        >
          <thead>
            <tr>
              <th
                scope="col"
                style={{
                  textAlign: "left",
                  padding: "8px 12px",
                  borderBottom: "2px solid currentColor",
                }}
              >
                Criterion
              </th>
              <th
                scope="col"
                style={{
                  textAlign: "left",
                  padding: "8px 12px",
                  borderBottom: "2px solid currentColor",
                }}
              >
                508/WCAG 2.0 requirement
              </th>
              <th
                scope="col"
                style={{
                  textAlign: "left",
                  padding: "8px 12px",
                  borderBottom: "2px solid currentColor",
                }}
              >
                Parseability effect
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                style={{
                  padding: "8px 12px",
                  borderBottom: "1px solid currentColor",
                  opacity: 0.8,
                }}
              >
                1.3.1 Info and Relationships (A)
              </td>
              <td
                style={{
                  padding: "8px 12px",
                  borderBottom: "1px solid currentColor",
                  opacity: 0.8,
                }}
              >
                Structure conveyed via semantic HTML, not presentation alone
              </td>
              <td
                style={{
                  padding: "8px 12px",
                  borderBottom: "1px solid currentColor",
                  opacity: 0.8,
                }}
              >
                Heading tree &amp; list structure are extractable passages
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "8px 12px",
                  borderBottom: "1px solid currentColor",
                  opacity: 0.8,
                }}
              >
                2.4.2 Page Titled (A)
              </td>
              <td
                style={{
                  padding: "8px 12px",
                  borderBottom: "1px solid currentColor",
                  opacity: 0.8,
                }}
              >
                Each page has a descriptive, unique &lt;title&gt;
              </td>
              <td
                style={{
                  padding: "8px 12px",
                  borderBottom: "1px solid currentColor",
                  opacity: 0.8,
                }}
              >
                Title is a primary Bing index and AI citation retrieval surface
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "8px 12px",
                  borderBottom: "1px solid currentColor",
                  opacity: 0.8,
                }}
              >
                4.1.2 Name, Role, Value (AA)
              </td>
              <td
                style={{
                  padding: "8px 12px",
                  borderBottom: "1px solid currentColor",
                  opacity: 0.8,
                }}
              >
                Interactive elements expose accessible name and role
              </td>
              <td
                style={{
                  padding: "8px 12px",
                  borderBottom: "1px solid currentColor",
                  opacity: 0.8,
                }}
              >
                Machine-readable interactive semantics for AI agents &amp; tools
              </td>
            </tr>
            <tr>
              <td
                style={{ padding: "8px 12px", opacity: 0.8 }}
              >
                4.1.1 Parsing (A) &mdash; in WCAG 2.0/2.1; removed in 2.2
              </td>
              <td
                style={{ padding: "8px 12px", opacity: 0.8 }}
              >
                Valid markup: complete tags, correct nesting, unique IDs
              </td>
              <td
                style={{ padding: "8px 12px", opacity: 0.8 }}
              >
                Eliminates parser-recovery variance in DOM interpretation
              </td>
            </tr>
          </tbody>
        </table>

        {/* ---- Honest section ---- */}
        <h2 style={{ marginTop: "2.4em" }}>
          What 508 conformance does not do for AI citations
        </h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Section 508 conformance removes structural blockers. It does not cause an AI assistant
          to cite your page. The three real citation levers &mdash; brand mentions on authoritative
          sources, Bing/web rank, and crawlable answer-shaped content &mdash; operate independently
          of accessibility certification.
        </p>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          A perfectly 508-conformant page that is absent from Bing&apos;s index has zero AI
          citation surface area for Bing-grounded assistants. A page that ranks in Bing but
          provides no direct answer in its first paragraphs is less likely to be retrieved as a
          passage. Schema markup &mdash; including Service, GovernmentService, and OfferCatalog
          &mdash; is hygiene: it labels what a page is, it does not move it into cited results.
        </p>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          <strong>Schema type note for government and service sites:</strong> Federal agencies and
          contractors correctly use Service, GovernmentService, or OfferCatalog schema &mdash;
          never Product. These are service entities, not commercial products. Any audit that
          flags a government page for &ldquo;missing Product schema&rdquo; is a category error
          and should be disregarded.
        </p>

        {/* ---- Procurement-angle close ---- */}
        <h2 style={{ marginTop: "2.4em" }}>
          The procurement angle: marginal AEO work for conformant sites
        </h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          If your site already maintains 508 conformance, the structural foundation for AI
          parseability is in place. The marginal AEO work is content shape, not re-engineering:
        </p>
        <ul style={{ marginTop: "0.6em", lineHeight: 1.8, paddingLeft: "1.4em" }}>
          <li>
            <strong>Answer-first paragraph structure</strong> &mdash; place the direct answer to
            each page&apos;s primary query in the first paragraph of server-rendered HTML, before
            navigational boilerplate.
          </li>
          <li>
            <strong>Consistent entity naming</strong> &mdash; use the same legal name or program
            name consistently across headings, body text, and schema markup so parsers can
            resolve the entity without disambiguation.
          </li>
          <li>
            <strong>Bing indexing verification</strong> &mdash; confirm pages are indexed in Bing
            via Webmaster Tools. A 508-conformant page that is absent from Bing is invisible to
            most AI assistant retrieval pipelines regardless of its structural quality.
          </li>
          <li>
            <strong>Correct schema type</strong> &mdash; Service, GovernmentService, or
            OfferCatalog for service and program pages. FAQPage schema where actual Q&amp;A pairs
            exist. Article or TechArticle for editorial guidance. Never Product for a government
            service.
          </li>
        </ul>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          The heading hierarchy, semantic markup, and accessible names your conformance program
          already enforces are the same structural prerequisites an AEO audit checks. You are not
          starting from zero; you are adding content-shape discipline to an existing accessible
          foundation.
        </p>

        {/* ---- FAQ ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Frequently asked questions</h2>
        {FAQ_ITEMS.map((item) => (
          <div key={item.q}>
            <h3 style={{ marginTop: "1.2em" }}>{item.q}</h3>
            <p style={{ marginTop: "0.5em", lineHeight: 1.7 }}>{item.a}</p>
          </div>
        ))}

        {/* ---- Sources ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Sources cited on this page</h2>
        <ul style={{ marginTop: "0.8em", lineHeight: 1.8, paddingLeft: "1.4em" }}>
          {SOURCES.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          The claim that Section 508 (2017/2018 refresh) incorporates WCAG 2.0 Level AA by
          reference is documented by the U.S. Access Board at the first link above. The removal
          of SC 4.1.1 Parsing from WCAG 2.2 is documented in the W3C WCAG 2.2 specification.
          No external statistics are cited on this page; the AEO-parseability relationship
          described is qualitative, derived from how the accessibility tree, HTML semantics, and
          crawler behavior are documented to interact.
        </p>

        {/* ---- What this does not guarantee ---- */}
        <h2 style={{ marginTop: "2.4em" }}>What this does not guarantee</h2>
        <ul style={{ marginTop: "0.8em", lineHeight: 1.8, paddingLeft: "1.4em" }}>
          <li>
            Schema markup &mdash; including Service, GovernmentService, OfferCatalog, or any
            schema.org type &mdash; is parse hygiene, not a citation lever. No schema action
            described on this page promises citation by an AI assistant.
          </li>
          <li>
            Section 508 conformance is not a citation lever. Maintaining the criteria described
            here removes structural blockers; it does not cause an answer engine to cite your
            pages.
          </li>
          <li>
            No specific citation count, Bing rank position, or AI-response outcome is promised
            by any action described on this page.
          </li>
          <li>
            Where Prompt Goblin engagement is mentioned: the refund covers the delivered work
            &mdash; audits, technical fixes, copy, measurement loop. It never covers a citation
            number or ranking position.
          </li>
        </ul>

        {/* ---- Scan CTA ---- */}
        <p style={{ marginTop: "2.4em", lineHeight: 1.7 }}>
          Want to know which structural blockers remain on your government or contractor site?{" "}
          <Link href="/#contact">Get in touch</Link> and we will run the scan &mdash; checking
          Bing indexing, semantic structure, and content shape against the AEO checklist,
          scoped to your 508 baseline.
        </p>

        {/* ---- Go deeper ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Go deeper</h2>
        <ul style={{ marginTop: "0.6em", lineHeight: 2, paddingLeft: "1.4em" }}>
          <li>
            <a href="/learn/accessibility-seo-audit">
              Accessibility SEO audit &mdash; WCAG hygiene as crawl hygiene (general audience)
            </a>
          </li>
          <li>
            <a href="/learn/technical-seo-for-ai-search">
              Technical SEO for AI search &mdash; crawl conditions and citation blockers
            </a>
          </li>
          <li>
            <a href="/learn/why-schema-not-enough">
              Why schema markup isn&apos;t enough to get cited
            </a>
          </li>
          <li>
            <a href="/learn/aeo-audit-checklist">
              AEO audit checklist &mdash; the practitioner framework
            </a>
          </li>
          <li>
            <a href="/learn/site-structure-ai-citations">
              Site structure and internal linking for AI citation visibility
            </a>
          </li>
          <li>
            <a href="/methodology">How the Prompt Goblin scan works &mdash; methodology</a>
          </li>
        </ul>
      </article>
    </>
  );
}
