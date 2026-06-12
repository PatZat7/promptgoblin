import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { JsonLd } from "@/components/system/JsonLd";
import { eeatForAiSearchJsonLd } from "@/lib/structured-data";
import { FAQ_ITEMS, SOURCES } from "./eeat-for-ai-search.data";

export const metadata: Metadata = {
  title: "E-E-A-T for AI Search — Encoding Author Expertise Machines Can Read · Prompt Goblin",
  description:
    "E-E-A-T is Google’s quality-rater framework, not an injectable score. Structuring author credentials as Article–Person JSON-LD gives parsers a consistent extraction path — but the credibility must exist off-page first.",
  alternates: { canonical: "/learn/eeat-for-ai-search" },
  openGraph: {
    type: "article",
    url: `${SITE.url}/learn/eeat-for-ai-search`,
    title: "E-E-A-T for AI Search — Encoding Author Expertise Machines Can Read",
    description:
      "How to structure author credentials as Article–author–Person JSON-LD so AI systems can reliably extract them — and why real third-party presence is the credibility, not the markup.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return (
    <>
      {eeatForAiSearchJsonLd().map((d, i) => (
        <JsonLd key={i} data={d} />
      ))}
      <article style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 80px" }}>
        <h1>E-E-A-T for AI search &mdash; encoding author expertise machines can read</h1>

        <p style={{ marginTop: "1.2em", lineHeight: 1.7 }}>
          E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) is Google&apos;s
          quality-rater framework &mdash; a guide for human evaluators, not a direct algorithmic
          score. What you can do is structure author credentials so parsers reliably extract them:
          a visible byline backed by Article&ndash;author&ndash;Person JSON-LD, credential
          properties like <code>jobTitle</code>, <code>alumniOf</code>, and <code>sameAs</code>{" "}
          pointing to real external profiles. The credibility must exist off-page first; markup
          encodes it, it does not invent it.
        </p>

        {/* ---- What E-E-A-T is (and is not) ---- */}
        <h2 style={{ marginTop: "2.4em" }}>What E-E-A-T is, and what it is not</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Google&apos;s Search Quality Rater Guidelines define E-E-A-T as the lens human raters
          use when evaluating whether a page demonstrates real-world experience, subject-matter
          expertise, authoritativeness within the field, and overall trustworthiness. The
          guidelines are public; the rater verdicts inform quality signals over time but are not
          themselves a score you submit.
        </p>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          AI retrieval systems do not read rater guidelines. They do benefit from the same
          underlying signals: real authors with verifiable histories, consistent identity across
          sources, and credentials corroborated by third parties. Structuring that information
          as machine-readable markup is extraction hygiene &mdash; it makes the signal parseable.
          It does not manufacture the signal.
        </p>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Markup describing credentials that exist nowhere else on the web is an empty label.
          Engines increasingly cross-reference authors against external sources &mdash; a
          <code>sameAs</code> link pointing to a LinkedIn profile that has no activity, or an
          author whose name returns no results outside the publisher&apos;s own domain, provides
          little corroboration.
        </p>

        {/* ---- Visible signal vs markup ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Visible signals and the markup that encodes them</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Every credential signal has two layers: the visible content a human can read, and the
          structured markup that makes the same signal reliably machine-extractable. Both are
          required. Markup without a visible byline is a ghost annotation. A visible byline
          without markup is a string of text parsers may or may not associate with an author
          entity.
        </p>

        <table style={{ marginTop: "1em", width: "100%", borderCollapse: "collapse", lineHeight: 1.6 }}>
          <thead>
            <tr>
              <th scope="col" style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid currentColor" }}>Visible signal</th>
              <th scope="col" style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid currentColor" }}>Markup that encodes it</th>
              <th scope="col" style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid currentColor" }}>What it does for extraction</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Author byline on the article page</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}><code>Article.author</code> &rarr; <code>Person</code> node</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Links article to a named, typed entity</td>
            </tr>
            <tr>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Job title in author bio</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}><code>Person.jobTitle</code></td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Machine-readable role without prose parsing</td>
            </tr>
            <tr>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Degree or institution in bio</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}><code>Person.alumniOf</code> &rarr; <code>Organization</code></td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Explicit, dereferenceable credential</td>
            </tr>
            <tr>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Subject areas listed in bio</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}><code>Person.knowsAbout</code></td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Topical scope without string-matching</td>
            </tr>
            <tr>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Link to LinkedIn / university profile page</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}><code>Person.sameAs</code> (array)</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Corroboration path to external identity</td>
            </tr>
            <tr>
              <td style={{ padding: "8px 12px", opacity: 0.8 }}>Dedicated author page on the same domain</td>
              <td style={{ padding: "8px 12px", opacity: 0.8 }}><code>Person.url</code> pointing at that page</td>
              <td style={{ padding: "8px 12px", opacity: 0.8 }}>Canonical home for the author entity on your domain</td>
            </tr>
          </tbody>
        </table>

        {/* ---- How to implement ---- */}
        <h2 style={{ marginTop: "2.4em" }}>How to implement Article&ndash;author&ndash;Person JSON-LD</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          The pattern is a nested graph: an <code>Article</code> node whose{" "}
          <code>author</code> property points to a <code>Person</code> node. The{" "}
          <code>Person</code> node carries credential properties and{" "}
          <code>sameAs</code> links to authoritative external profiles. Both nodes are in the
          same <code>@graph</code> or embedded inline.
        </p>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          The example below is a realistic template &mdash; replace every placeholder with real
          values for a real author. Do not copy the name, institution, or profile URLs as-is;
          they are illustrative and do not refer to any real person.
        </p>

        <pre
          aria-label="Article author Person JSON-LD template"
          tabIndex={0}
          style={{ marginTop: "1em", padding: "1.2em", overflowX: "auto", lineHeight: 1.6, fontSize: "0.88em", borderRadius: 4, border: "1px solid currentColor" }}
        >
          <code>{`{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": "https://example.com/learn/topic-slug#article",
      "headline": "Your article headline here",
      "description": "One-sentence description of what the article covers.",
      "url": "https://example.com/learn/topic-slug",
      "inLanguage": "en",
      "author": { "@id": "https://example.com/authors/jane-doe#person" },
      "publisher": {
        "@type": "Organization",
        "name": "Your Organisation Name",
        "url": "https://example.com"
      },
      "isPartOf": {
        "@type": "WebSite",
        "name": "Your Organisation Name",
        "url": "https://example.com"
      }
    },
    {
      "@type": "Person",
      "@id": "https://example.com/authors/jane-doe#person",
      "name": "Jane Doe",
      "jobTitle": "Senior Content Strategist",
      "alumniOf": {
        "@type": "Organization",
        "name": "University of Michigan"
      },
      "knowsAbout": [
        "Answer Engine Optimization",
        "Technical SEO",
        "Structured Data"
      ],
      "url": "https://example.com/authors/jane-doe",
      "sameAs": [
        "https://www.linkedin.com/in/janedoe-example",
        "https://journalism.university.edu/staff/janedoe"
      ]
    }
  ]
}`}</code>
        </pre>

        <p style={{ marginTop: "1em", lineHeight: 1.7 }}>
          Key points in this structure:
        </p>
        <ul style={{ marginTop: "0.6em", lineHeight: 1.8, paddingLeft: "1.4em" }}>
          <li>
            The <code>Article</code> links to the <code>Person</code> via <code>@id</code>
            &mdash; no duplication, just a graph reference.
          </li>
          <li>
            The <code>Person</code> node is reusable: place it on the author bio page and
            reference the same <code>@id</code> from every article that person authored.
          </li>
          <li>
            <code>sameAs</code> values must resolve to real, live pages that actually describe
            this person. A dead link or a generic profile with no activity does not corroborate.
          </li>
          <li>
            <code>alumniOf</code> and <code>knowsAbout</code> are optional but add
            extractable credential depth that plain prose bios do not provide.
          </li>
          <li>
            This markup must match what is visible on the page. If the byline shows
            &ldquo;Jane Doe&rdquo; but the markup says a different name, the inconsistency
            undermines the signal.
          </li>
        </ul>

        {/* ---- Author pages ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Author pages as entity anchors</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          An author page (<code>/authors/jane-doe</code>) serves as the canonical home for the
          author entity on your domain. It should carry the same <code>Person</code> JSON-LD
          node with the same <code>@id</code> used in article markup. This creates a consistent,
          crawlable identity graph: the article says &ldquo;authored by this person&rdquo;, the
          author page says &ldquo;this is who that person is&rdquo;, and the{" "}
          <code>sameAs</code> links say &ldquo;here is where that person exists elsewhere
          on the web.&rdquo;
        </p>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          A single generic &ldquo;Editorial Team&rdquo; byline on every article gives parsers
          nothing to work with. Named, consistent authors with stable profile pages and real
          external presence are the foundation.
        </p>

        {/* ---- Common mistakes ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Common mistakes</h2>

        <h3 style={{ marginTop: "1.4em" }}>Markup-only credentials</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          Adding impressive-sounding <code>jobTitle</code> or <code>alumniOf</code> values to
          markup without those credentials being visible anywhere on the page or anywhere else
          on the web. Parsers that corroborate authors against external sources will find nothing.
          The markup is an unverified assertion.
        </p>

        <h3 style={{ marginTop: "1.4em" }}>Invented author personas</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          Creating fictional author names, biographies, and credentials for content produced
          without an identified author. Engines increasingly cross-reference author names against
          external signals &mdash; a name that returns no results outside the publisher&apos;s
          own pages is a weak corroboration signal at best, a deception risk at worst. Real
          authorship is the work; markup encodes it.
        </p>

        <h3 style={{ marginTop: "1.4em" }}>Inconsistency between visible byline and markup</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          The <code>name</code> in the <code>Person</code> node must match the visible byline
          exactly. A mismatch tells a parser the markup and the visible content disagree about
          who wrote the article. This is a hygiene failure that undercuts everything else.
        </p>

        <h3 style={{ marginTop: "1.4em" }}>Treating author schema as a citation lever</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          Article&ndash;author&ndash;Person JSON-LD is extraction hygiene and a corroboration
          surface &mdash; it makes real credentials consistently parseable. It does not cause
          an AI assistant to cite the article. Real levers are brand mentions on authoritative
          sources, Bing rank, and crawlable answer-shaped content.
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
        <ul style={{ marginTop: "0.8em", lineHeight: 1.9, paddingLeft: "1.4em" }}>
          {SOURCES.map((s) => (
            <li key={s.url}>
              <a href={s.url} rel="noopener noreferrer">{s.label}</a>
              {" — "}{s.note}
            </li>
          ))}
        </ul>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Observations about how AI systems corroborate authors against external sources are
          qualitative, based on publicly documented behavior as of mid-2025. No specific
          study claiming a measured corroboration rate is cited because no such study is
          referenced here; the observation is directional and consistent with how entity
          resolution works in knowledge graphs.
        </p>

        {/* ---- What this does not guarantee ---- */}
        <h2 style={{ marginTop: "2.4em" }}>What this does not guarantee</h2>
        <ul style={{ marginTop: "0.8em", lineHeight: 1.8, paddingLeft: "1.4em" }}>
          <li>
            Article&ndash;author&ndash;Person JSON-LD is extraction hygiene and a corroboration
            surface, not a citation lever. No markup described on this page causes an AI
            assistant to cite the page.
          </li>
          <li>
            E-E-A-T is Google&apos;s quality-rater framework. Implementing the structured data
            patterns described here does not produce an E-E-A-T score, does not raise a quality
            signal directly, and does not guarantee any change in how Google or any AI system
            evaluates the page.
          </li>
          <li>
            No specific citation count, Bing rank position, or AI-response outcome is promised
            by any action described on this page.
          </li>
          <li>
            Where Prompt Goblin engagement is mentioned: the refund covers the delivered
            work &mdash; audits, technical fixes, copy, measurement loop. It never covers a
            citation number or ranking position.
          </li>
        </ul>

        {/* ---- Scan CTA ---- */}
        <p style={{ marginTop: "2.4em", lineHeight: 1.7 }}>
          Want to know whether your author markup is consistent, your bylines are machine-readable,
          and your author entities have external corroboration?{" "}
          <Link href="/#contact">Get in touch</Link> and we will run the diagnostic.
        </p>

        {/* ---- Go deeper ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Go deeper</h2>
        <ul style={{ marginTop: "0.6em", lineHeight: 2, paddingLeft: "1.4em" }}>
          <li>
            <a href="/learn/entity-clarity-for-ai">
              Entity clarity for AI search &mdash; organisation-level disambiguation and sameAs strategy
            </a>
          </li>
          <li>
            <a href="/learn/why-schema-not-enough">
              Why schema markup is not enough to get cited &mdash; the post-implementation diagnostic
            </a>
          </li>
          <li>
            <a href="/learn/technical-seo-for-ai-search">
              Technical SEO for AI search &mdash; crawl conditions and citation blockers
            </a>
          </li>
          <li>
            <a href="/learn/how-to-show-up-in-chatgpt">
              How to show up in ChatGPT &mdash; the three mechanical levers
            </a>
          </li>
          <li>
            <a href="/learn/aeo-audit-checklist">
              AEO audit checklist &mdash; the full readiness checklist for small agencies
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
