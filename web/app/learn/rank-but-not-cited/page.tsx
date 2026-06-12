import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { JsonLd } from "@/components/system/JsonLd";
import { rankButNotCitedJsonLd } from "@/lib/structured-data";
import { FAQ_ITEMS } from "@/app/learn/rank-but-not-cited/rank-but-not-cited.data";

export const metadata: Metadata = {
  title: "You Rank But AI Overviews Don't Cite You · Prompt Goblin",
  description:
    "Ranking proves crawlability and relevance — but citation selection also weighs passage extractability, direct-answer shape, and third-party corroboration. Here is how to diagnose the gap.",
  alternates: { canonical: "/learn/rank-but-not-cited" },
  openGraph: {
    type: "article",
    url: `${SITE.url}/learn/rank-but-not-cited`,
    title: "You Rank But AI Overviews Don't Cite You",
    description:
      "The rank-vs-citation gap: why a top-5 page can still lose the AI Overview citation and how to diagnose and fix it.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return (
    <>
      {rankButNotCitedJsonLd().map((d, i) => (
        <JsonLd key={i} data={d} />
      ))}
      <article style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 80px" }}>
        <h1>You rank, but AI Overviews don&apos;t cite you</h1>

        <p style={{ marginTop: "1.2em", lineHeight: 1.7 }}>
          Ranking in the top 5 confirms that Google considers your page relevant and crawlable
          — but citation selection runs a separate test. AI Overviews and answer engines also
          weigh whether the page front-loads a direct extractable answer, whether that answer is
          plain server-rendered text, and whether third-party sources corroborate your brand for
          this specific topic. A page can pass all ranking signals and still lose the citation.
        </p>

        {/* ---- Why ranking and citation diverge ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Why ranking and citation are different decisions</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Traditional ranking is a retrieval problem: which pages are relevant to this query and
          authoritative enough to surface? Citation selection is a passage-extraction problem:
          which passages can be lifted and assembled into a direct answer without further
          interpretation?
        </p>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Answer engines composing a response often pull passages from several sources and
          synthesise them. A page that ranks first may contribute zero passages if its answer is
          buried in prose, rendered in JavaScript, or structured for a human reader rather than
          for direct extraction. Meanwhile a page ranking eighth — with a crisp one-sentence
          definition at the top — may supply the opening line of the AI Overview.
        </p>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Third-party corroboration amplifies this effect. If no external source associates your
          brand with the specific sub-topic of the query, engines have less confidence attributing
          the answer to you even when your page ranks well.
        </p>

        {/* ---- Side-by-side table ---- */}
        <h2 style={{ marginTop: "2.4em" }}>What ranking measures vs. what citation selection weighs</h2>
        <div style={{ overflowX: "auto", marginTop: "1em" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", lineHeight: 1.6 }}>
            <thead>
              <tr>
                <th
                  scope="col"
                  style={{
                    textAlign: "left",
                    padding: "10px 14px",
                    borderBottom: "2px solid currentColor",
                    fontWeight: 700,
                  }}
                >
                  Ranking signal
                </th>
                <th
                  scope="col"
                  style={{
                    textAlign: "left",
                    padding: "10px 14px",
                    borderBottom: "2px solid currentColor",
                    fontWeight: 700,
                  }}
                >
                  Citation selection also weighs
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                [
                  "Page-level relevance to query intent",
                  "Passage-level extractability — does a single sentence or short paragraph answer the question?",
                ],
                [
                  "Domain and page authority (backlinks, age, trust)",
                  "Third-party corroboration — do authoritative external sources associate this brand with this specific topic?",
                ],
                [
                  "Keyword and entity coverage across the page",
                  "Answer position — is the direct answer in the first 100 words or buried after preamble?",
                ],
                [
                  "Core Web Vitals and technical hygiene (server-rendered, canonical, sitemap)",
                  "Rendering mode — is the answer in the HTML response body, or injected by JavaScript a crawler never runs?",
                ],
                [
                  "Google Search Console indexing status",
                  "Bing index presence — many AI assistants retrieve from Bing; Google rank does not imply Bing indexing.",
                ],
              ].map(([rank, cite], i) => (
                <tr key={i}>
                  <td style={{ padding: "10px 14px", verticalAlign: "top", borderBottom: "1px solid currentColor", opacity: 0.8 }}>{rank}</td>
                  <td style={{ padding: "10px 14px", verticalAlign: "top", borderBottom: "1px solid currentColor", opacity: 0.8 }}>{cite}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ---- Diagnostic checklist ---- */}
        <h2 style={{ marginTop: "2.4em" }}>The 5-check diagnostic for a ranked-but-uncited page</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Run these in order before changing page structure, targeting a different query, or
          attempting off-page work.
        </p>

        <h3 style={{ marginTop: "1.6em" }}>Check 1 — Is the answer front-loaded or buried?</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          Open the page and read the first 100 words. Does it answer the query directly, name the
          thing, and give a usable fact? Or does it start with context-setting, preamble, or a
          table of contents?
        </p>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          <strong>Fix:</strong> rewrite the opening paragraph as a direct-answer sentence. Name
          the entity, state the mechanism, give the number or definition. The rest of the page
          can stay.
        </p>

        <h3 style={{ marginTop: "1.6em" }}>Check 2 — Is the answer in plain, extractable HTML?</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          Use <code>curl -A &quot;Googlebot&quot; https://yourdomain.com/your-page</code> and read the
          response body. If the answer text is absent from that output, it is JavaScript-rendered
          and invisible to most crawler snapshots.
        </p>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          <strong>Fix:</strong> ensure the direct-answer passage is in the server-rendered HTML
          response, not dependent on client-side hydration. For Next.js and similar frameworks,
          this means keeping answer content in Server Components, not client islands.
        </p>

        <h3 style={{ marginTop: "1.6em" }}>Check 3 — Do third-party sources corroborate your brand for this topic?</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          Search the query in an AI assistant and read the sources it does cite. Are those
          sources industry directories, press coverage, or comparison articles that mention the
          cited brand explicitly alongside the topic? If yes, that is the corroboration gap.
        </p>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          <strong>Fix:</strong> this is an off-page problem. Target the publications and
          directories the engine already cites for your query category. Authoritative external
          pages that associate your brand name with the topic directly increase citation
          probability over time. This is the highest-leverage lever but the slowest to move.
        </p>

        <h3 style={{ marginTop: "1.6em" }}>Check 4 — Is the page in Bing&apos;s index?</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          Google rank does not imply Bing presence. Open Bing Webmaster Tools and use URL
          Inspection to check whether the page is indexed. Many AI assistants, including
          ChatGPT&apos;s Browse mode and Bing AI, retrieve primarily from Bing-indexed content.
          A page absent from Bing has near-zero citation probability in those tools regardless
          of its Google position.
        </p>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          <strong>Fix:</strong> submit the URL via Bing Webmaster Tools URL submission, verify
          the sitemap is submitted, and signal the URL via IndexNow on next publish. See{" "}
          <a href="/docs/bing-webmaster-tools">Bing Webmaster Tools setup</a> for the step-by-step.
        </p>

        <h3 style={{ marginTop: "1.6em" }}>Check 5 — What query class is this?</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          Some query classes structurally favour aggregators and third-party comparison sources
          over brand-owned pages — particularly &ldquo;best X&rdquo;, &ldquo;X vs Y&rdquo;, and
          &ldquo;reviews of X&rdquo; queries. For these, engines frequently prefer G2, Clutch,
          Reddit, or vertical directories because those pages aggregate multiple viewpoints.
        </p>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          <strong>Fix:</strong> if the query class inherently favours third-party aggregators,
          on-page changes are unlikely to move the citation. The more effective path is earning
          presence on the aggregator pages the engine already cites — directory listings, expert
          roundups, community mentions. This is honest framing: not every ranked page can win a
          citation for every query type.
        </p>

        {/* ---- When it's not fixable on-page ---- */}
        <h2 style={{ marginTop: "2.4em" }}>When the gap is not fixable on-page</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Certain query patterns — category comparisons, multi-vendor reviews, and &ldquo;top
          N&rdquo; lists — are structurally designed to cite sources that aggregate multiple
          brands, not sources that are one of the brands being compared. Engines are answering
          &ldquo;which of these should I choose&rdquo; rather than &ldquo;what does Brand X
          say about itself.&rdquo;
        </p>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          In those cases, the citation gap is an off-page presence problem. The work is earning
          mentions on the sources that already get cited: industry directories, neutral comparison
          guides, and community discussions where your brand appears alongside competitors. That
          work is slower and harder to measure in the short term, but it is the correct lever.
          Optimising your own page further does not change what kind of source an engine prefers
          for that query.
        </p>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          If you want to understand how to close that off-page gap, the{" "}
          <a href="/learn/why-schema-not-enough">why schema is not enough</a> page covers the
          schema-done-still-uncited version of this same diagnostic from a different angle.
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
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          This page makes no claims tied to external measured statistics. The diagnostic logic —
          passage extraction, Bing indexing, front-loaded answers, third-party corroboration — is
          drawn from the same three-lever framework described in{" "}
          <a href="/learn/how-to-show-up-in-chatgpt">How to show up in ChatGPT</a> and the{" "}
          <a href="/methodology">Prompt Goblin methodology</a>. These represent point-in-time
          practitioner observations about how answer engines behave, not peer-reviewed studies.
          No external statistics are quoted here. Any numeric figures added in future revisions
          will include a named source and retrieval date.
        </p>

        {/* ---- What this does not guarantee ---- */}
        <h2 style={{ marginTop: "2.4em" }}>What this does not guarantee</h2>
        <ul style={{ marginTop: "0.8em", lineHeight: 1.8, paddingLeft: "1.4em" }}>
          <li>
            Schema and markup (JSON-LD, FAQPage, Article) are hygiene — they help parsers label
            page content. They are not citation levers and do not cause answer engines to cite a
            page.
          </li>
          <li>
            No action described on this page guarantees a specific citation count, ranking
            position, or AI Overview appearance. These are structural inputs; effects depend on
            crawl timing, domain age, and signals outside any page owner&apos;s control.
          </li>
          <li>
            The Prompt Goblin refund guarantee covers the delivered work — audits, copy, technical
            fixes, and the measurement loop — never a citation number or a ranking position.
          </li>
          <li>
            &ldquo;We measure delta, not ETA.&rdquo; Citation changes in weight-based models may
            take months after the underlying signals improve. Retrieval-grounded tools may
            respond faster. No timeline is promised.
          </li>
        </ul>

        {/* ---- Scan CTA ---- */}
        <p style={{ marginTop: "2.4em", lineHeight: 1.7 }}>
          Want to know whether your page fails the extraction or Bing-presence check?{" "}
          <Link href="/#scan">Run the free Prompt Goblin scan</Link> — it checks server-rendered
          HTML, crawlability, and schema hygiene in one pass.
        </p>

        {/* ---- Go deeper ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Go deeper</h2>
        <ul style={{ marginTop: "0.6em", lineHeight: 2, paddingLeft: "1.4em" }}>
          <li>
            <a href="/learn/how-to-show-up-in-chatgpt">
              How to show up in ChatGPT — the three mechanical levers
            </a>
          </li>
          <li>
            <a href="/learn/why-schema-not-enough">
              Why schema is not enough — the post-implementation diagnostic
            </a>
          </li>
          <li>
            <a href="/learn/bing-rank-and-ai-citations">
              Bing rank and AI citations — the direct connection
            </a>
          </li>
          <li>
            <a href="/docs/bing-webmaster-tools">Bing Webmaster Tools setup guide</a>
          </li>
          <li>
            <a href="/methodology">How the Prompt Goblin scan works — methodology</a>
          </li>
          <li>
            <a href="/faq">FAQ</a>
          </li>
        </ul>
      </article>
    </>
  );
}
