import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { JsonLd } from "@/components/system/JsonLd";
import { faqVsHowToSchemaJsonLd } from "@/lib/structured-data";
import { FAQ_ITEMS, SOURCES } from "./faq-schema-vs-howto-schema.data";

export const metadata: Metadata = {
  title: "FAQ Schema vs HowTo Schema — What Each Does for AI Search · Prompt Goblin",
  description:
    "Google deprecated HowTo rich results entirely and restricted FAQ rich results to government and health sites in 2023. Neither type causes AI citations. This guide covers what each type still does and when to use it.",
  alternates: { canonical: "/learn/faq-schema-vs-howto-schema" },
  openGraph: {
    type: "article",
    url: `${SITE.url}/learn/faq-schema-vs-howto-schema`,
    title: "FAQ Schema vs HowTo Schema — What Each Does for AI Search",
    description:
      "The rich-result era for FAQPage and HowTo is over for most sites. Here is what each type still does, when to use which, and why neither causes AI citations.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return (
    <>
      {faqVsHowToSchemaJsonLd().map((d, i) => (
        <JsonLd key={i} data={d} />
      ))}
      <article style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 80px" }}>
        <h1>FAQ schema vs HowTo schema — what each does for AI search</h1>

        <p style={{ marginTop: "1.2em", lineHeight: 1.7 }}>
          Google&apos;s 2023 Search Central updates deprecated HowTo rich results entirely
          (mobile in August, desktop in September) and restricted FAQ rich results to
          well-known government and health websites. For most
          sites, the &ldquo;which performs better&rdquo; question is moot: neither type earns rich
          results today. What remains is parse hygiene — labeling content so crawlers extract it
          cleanly — and neither type has ever caused AI citations.
        </p>

        {/* ---- What each type is ---- */}
        <h2 style={{ marginTop: "2.4em" }}>What each type is</h2>

        <h3 style={{ marginTop: "1.4em" }}>FAQPage (schema.org/FAQPage)</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          FAQPage is a schema.org type that marks up a page containing one or more question-and-answer
          pairs where both the question and answer are authored by the same party. It maps each Q&amp;A
          pair as a <code>Question</code> with an <code>acceptedAnswer</code>. Valid use: a support page
          where your team wrote both the questions and the answers. Invalid use: a page of marketing
          claims formatted to look like questions, or a community forum where users supply the answers.
        </p>

        <h3 style={{ marginTop: "1.4em" }}>HowTo (schema.org/HowTo)</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          HowTo marks up a page that describes how to accomplish a task through a sequence of steps.
          Each step is a <code>HowToStep</code> with a name and optional text, image, and url. Valid
          use: a numbered guide with discrete, actionable steps toward a specific outcome. Invalid use:
          a blog post with loosely related tips, a listicle, or a feature description page.
        </p>

        {/* ---- The 2023 deprecation ---- */}
        <h2 style={{ marginTop: "2.4em" }}>The 2023 deprecation — what it means</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Google Search Central announced two changes in August 2023. First, HowTo
          rich results were deprecated — on mobile in the August announcement, with the desktop
          deprecation following in September 2023; today no site, regardless of authority, earns
          HowTo carousel or step cards in Google search results. Second, FAQ rich results were restricted
          to well-known, authoritative government and health websites. For the overwhelming majority
          of commercial sites, both changes mean the same thing: these schema types will not produce
          any visual enhancement in Google search results.
        </p>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          The practical effect: any SEO guide written before August 2023 recommending FAQPage or
          HowTo schema for rich-result benefit is describing a path that no longer works for most
          sites. The optimization advice you may have read — &ldquo;add FAQ schema to win the FAQ
          accordion in Google&rdquo; — is outdated.
        </p>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          The honest summary: using these types is still fine where the content is genuinely Q&amp;A
          or procedural. Adding them just for rich results no longer has a payoff.
        </p>

        {/* ---- Use-case matrix ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Use-case matrix — question type to markup choice</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          The decision is not &ldquo;FAQ vs HowTo&rdquo; for performance — it is &ldquo;does this
          content fit either type at all?&rdquo;
        </p>

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
                style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid currentColor" }}
              >
                Content type
              </th>
              <th
                scope="col"
                style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid currentColor" }}
              >
                Correct markup
              </th>
              <th
                scope="col"
                style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid currentColor" }}
              >
                What it actually does now
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>
                Real Q&amp;A pairs authored by the same party
              </td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>
                FAQPage
              </td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>
                Parse hygiene — labels Q&amp;A structure for crawlers; enforces answer-shaped
                content discipline; no rich result for most sites
              </td>
            </tr>
            <tr>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>
                Procedural steps toward a specific outcome
              </td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>
                HowTo, or a plain <code>&lt;ol&gt;</code>
              </td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>
                Step-extraction clarity for parsers; HowTo rich results deprecated — plain list
                achieves similar clarity without schema overhead
              </td>
            </tr>
            <tr>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>
                Marketing bullets or feature list formatted as questions
              </td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>
                Neither — omit schema
              </td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>
                Applying FAQPage here is a false claim to parsers; schema/visible-text divergence
                is a quality signal problem
              </td>
            </tr>
            <tr>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>
                Community Q&amp;A (user-supplied answers)
              </td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>
                QAPage, not FAQPage
              </td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>
                Correct labeling; FAQPage requires a single authoritative answerer
              </td>
            </tr>
            <tr>
              <td style={{ padding: "8px 12px", opacity: 0.8 }}>
                Government or accredited health site with real Q&amp;A
              </td>
              <td style={{ padding: "8px 12px", opacity: 0.8 }}>
                FAQPage
              </td>
              <td style={{ padding: "8px 12px", opacity: 0.8 }}>
                FAQ rich result still possible per Google&apos;s post-2023 policy
              </td>
            </tr>
          </tbody>
        </table>

        {/* ---- Honest-broker angle ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Neither type causes AI citations</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          The schema types themselves — FAQPage or HowTo — do not cause an answer engine to cite your
          page. The underlying answer-shaped content is what matters. A page with clearly written
          Q&amp;A pairs will surface in AI responses because the answers are crawlable, extractable,
          and appropriately indexed — not because FAQPage markup is present. A page with weak, vague
          answers will not be cited, regardless of how precisely the schema validates.
        </p>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          One genuine side effect of using FAQPage markup correctly: to write valid FAQPage schema,
          you must write a real question and a direct answer in the visible page text (markup that
          diverges from visible text is a quality problem). That discipline — writing actual direct
          answers, not marketing hedges — is what improves extractability. The schema is the side
          effect; the answer quality is the cause.
        </p>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          For a deeper treatment of why schema generally is not a citation lever, see{" "}
          <a href="/learn/why-schema-not-enough">why schema markup is not enough to get cited</a>.
          This page focuses on the type-choice decision specifically.
        </p>

        {/* ---- Common mistakes ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Common mistakes</h2>

        <h3 style={{ marginTop: "1.4em" }}>FAQ-stuffing for rich results that no longer exist</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          The most common pattern we audit: commercial pages with 8&ndash;12 FAQPage-marked
          questions that were added specifically to win the FAQ accordion in Google search results.
          That accordion is gone for most sites. The markup remains, often covering questions that
          are actually marketing copy, not genuine Q&amp;A. This is dead schema weight — it adds no
          value and creates divergence risk.
        </p>

        <h3 style={{ marginTop: "1.4em" }}>Marking up content that is not real Q&amp;A</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          FAQPage requires that the question and answer are authored by the same party and that the
          content is genuinely a question-and-answer pair. &ldquo;Why choose us?&rdquo; followed by
          three marketing bullet points is not a Q&amp;A pair. Applying FAQPage to it tells parsers
          the page contains structured Q&amp;A when it does not — that divergence between markup and
          content is a quality signal problem, not just a missed optimization.
        </p>

        <h3 style={{ marginTop: "1.4em" }}>Schema/visible-text divergence</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          FAQPage schema must match the visible text exactly. If the JSON-LD contains a question and
          answer that does not appear in the rendered page, or if the answer text in the schema is
          substantially different from what the user reads, the markup is making a false claim to
          parsers. Every FAQPage question and its acceptedAnswer must be present verbatim in the
          visible HTML.
        </p>

        <h3 style={{ marginTop: "1.4em" }}>Using HowTo for general blog posts or tips lists</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          HowTo is for discrete steps toward a specific outcome. A blog post titled &ldquo;10 tips
          for better email open rates&rdquo; is not a HowTo — tips are not steps, and there is no
          single defined outcome achieved by completing the list in order. Applying HowTo to this
          content mislabels the page type and, given that HowTo rich results are deprecated anyway,
          provides no benefit.
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
          The August 2023 Search Central post restricted FAQ rich results to government/health
          sites and deprecated HowTo on mobile; the desktop HowTo deprecation followed in
          September 2023. Both are sourced from Google Search Central (linked above).
          Schema.org type definitions are sourced from schema.org directly. No citation counts,
          rank positions, or performance claims appear on this page.
        </p>

        {/* ---- What this does not guarantee ---- */}
        <h2 style={{ marginTop: "2.4em" }}>What this does not guarantee</h2>
        <ul style={{ marginTop: "0.8em", lineHeight: 1.8, paddingLeft: "1.4em" }}>
          <li>
            FAQPage and HowTo schema — like all schema.org markup — are parse hygiene, not citation
            levers. No action described on this page promises citation by an AI assistant, a rich
            result in Google, or any improvement in AI-response frequency.
          </li>
          <li>
            No specific citation count, Bing rank position, Google search position, or AI-response
            outcome is promised by any recommendation on this page.
          </li>
          <li>
            Applying the correct schema type removes mislabeling noise. It does not guarantee that
            an answer engine will surface your content within any particular timeframe.
          </li>
          <li>
            Where Prompt Goblin engagement is mentioned: the refund covers the delivered work —
            audits, technical fixes, copy, measurement loop. It never covers a citation number or
            ranking position.
          </li>
        </ul>

        {/* ---- Scan CTA ---- */}
        <p style={{ marginTop: "2.4em", lineHeight: 1.7 }}>
          Not sure whether your structured data matches your visible content?{" "}
          <Link href="/#scan">Run a free scan</Link> and we will flag any schema/visible-text
          divergence, wrong type use, and the citation-gap levers that actually matter.
        </p>

        {/* ---- Go deeper ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Go deeper</h2>
        <ul style={{ marginTop: "0.6em", lineHeight: 2, paddingLeft: "1.4em" }}>
          <li>
            <a href="/learn/why-schema-not-enough">
              Why schema markup is not enough to get cited — the post-implementation diagnostic
            </a>
          </li>
          <li>
            <a href="/learn/technical-seo-for-ai-search">
              Technical SEO for AI search — crawl conditions and citation blockers
            </a>
          </li>
          <li>
            <a href="/learn/aeo-audit-checklist">
              AEO audit checklist — the full citation-readiness framework
            </a>
          </li>
          <li>
            <a href="/learn/site-structure-ai-citations">
              Site structure and internal linking for AI citation visibility
            </a>
          </li>
          <li>
            <a href="/learn/eeat-for-ai-search">
              E-E-A-T signals for AI search — author and publisher schema
            </a>
          </li>
          <li>
            <a href="/methodology">How the Prompt Goblin scan works — methodology</a>
          </li>
        </ul>
      </article>
    </>
  );
}
