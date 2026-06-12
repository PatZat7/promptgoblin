import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { JsonLd } from "@/components/system/JsonLd";
import { whySchemaNotEnoughJsonLd } from "@/lib/structured-data";
import { FAQ_ITEMS } from "./why-schema-not-enough.data";

export const metadata: Metadata = {
  title: "Why Schema Markup Isn't Enough to Get Cited · Prompt Goblin",
  description:
    "You added JSON-LD, validated it, and still nothing changed. Schema labels content — it does not create the brand mentions, Bing rank, or extractable answers that drive AI citations. Here is the post-implementation diagnostic.",
  alternates: { canonical: "/learn/why-schema-not-enough" },
  openGraph: {
    type: "article",
    url: `${SITE.url}/learn/why-schema-not-enough`,
    title: "Why Schema Markup Isn't Enough to Get Cited",
    description:
      "Post-implementation diagnostic for the schema-done-still-uncited gap: what schema actually does, and which real levers are missing.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return (
    <>
      {whySchemaNotEnoughJsonLd().map((d, i) => (
        <JsonLd key={i} data={d} />
      ))}
      <article style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 80px" }}>
        <h1>Why schema markup isn&apos;t enough to get cited</h1>

        <p style={{ marginTop: "1.2em", lineHeight: 1.7 }}>
          If you added JSON-LD or FAQPage schema, validated it, and ChatGPT still does not cite
          your content — schema is not the problem and adding more will not fix it. Schema is
          parse hygiene: it labels what a page contains, like writing the address on an envelope.
          It does not create the retrieval signals — brand mentions, Bing rank, and crawlable
          answers — that determine whether an answer engine surfaces your page.
        </p>

        {/* ---- The misconception ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Where the misconception comes from</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Schema earned its reputation through rich results: star ratings, FAQ accordions, and
          recipe cards that appear directly in Google search results. That is a real, measurable
          effect — on visual presentation in SERPs. The confusion is understandable: if schema
          changes what Google shows, surely it changes what ChatGPT cites.
        </p>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          The two systems are different. Google rich results are a display layer on top of
          existing rank. AI citation retrieval depends on whether a page is indexed, ranked, and
          extractable as a passage. Schema contributes to parseability. It does not generate
          mentions, raise rank, or make a JavaScript-rendered page visible to a crawler.
        </p>

        {/* ---- What schema actually does ---- */}
        <h2 style={{ marginTop: "2.4em" }}>What schema actually does</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Think of a page as a storage box. Schema is the label on the outside: it tells anyone
          handling it what is inside and how to categorize it. The label is useful — it prevents
          misclassification and helps automated systems route the box correctly. But writing a
          better label does not change what is inside the box, does not move the box to a more
          prominent shelf, and does not make anyone else aware the box exists.
        </p>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Schema on a page with no third-party mentions, poor Bing rank, and JavaScript-rendered
          answers is a well-labeled box on an undiscovered shelf. The label is good practice.
          The shelf location is the work.
        </p>

        <h3 style={{ marginTop: "1.4em" }}>The label vs. lever distinction</h3>
        <table style={{ marginTop: "0.8em", width: "100%", borderCollapse: "collapse", lineHeight: 1.6 }}>
          <thead>
            <tr>
              <th scope="col" style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid currentColor" }}>What schema does</th>
              <th scope="col" style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid currentColor" }}>What people expect it to do</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Labels content type (Article, FAQPage, Service)</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Cause AI assistants to cite the page</td>
            </tr>
            <tr>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Reduces parser ambiguity about page structure</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Replace the need for Bing rank or indexing</td>
            </tr>
            <tr>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Enables rich results in Google SERPs (display layer)</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Boost page into AI Overviews or ChatGPT answers</td>
            </tr>
            <tr>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Provides machine-readable question/answer pairs</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Surface content that is not yet in the index</td>
            </tr>
            <tr>
              <td style={{ padding: "8px 12px", opacity: 0.8 }}>Describes entity relationships (author, publisher)</td>
              <td style={{ padding: "8px 12px", opacity: 0.8 }}>Earn brand authority or third-party mentions</td>
            </tr>
          </tbody>
        </table>

        {/* ---- Diagnostic ---- */}
        <h2 style={{ marginTop: "2.4em" }}>The post-implementation diagnostic: five checks</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Run these in order. Each one corresponds to a real lever that schema cannot replace.
        </p>

        <h3 style={{ marginTop: "1.4em" }}>Check 1 — Is the page in Bing&apos;s index at all?</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          Most AI assistants ground their retrieval on Bing-indexed content. Open Bing Webmaster
          Tools, run a URL inspection on the page, and confirm it is indexed. A page that
          validates schema perfectly but is absent from Bing&apos;s index has zero AI citation
          surface area for Bing-grounded assistants.
        </p>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          <strong>Fix:</strong> Submit the URL via IndexNow, verify your sitemap is current, and
          check for crawl errors in Bing Webmaster Tools. See{" "}
          <a href="/docs/bing-webmaster-tools">Bing Webmaster Tools setup</a> for the step-by-step.
        </p>

        <h3 style={{ marginTop: "1.4em" }}>Check 2 — Does the page render a direct answer in the first 100 words of server-rendered HTML?</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          Answer engines extract passages from crawl snapshots. If your core answer is buried
          after three paragraphs of introduction, or injected by JavaScript after load,
          a crawler may not retrieve it as a usable passage. Disable JavaScript in your browser
          and reload the page. What you see is approximately what a crawler sees.
        </p>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          <strong>Fix:</strong> Move the direct answer to the first paragraph in server-rendered
          HTML. Named entities, specific figures, and the question being answered should appear
          before any navigation or preamble.
        </p>

        <h3 style={{ marginTop: "1.4em" }}>Check 3 — Does any authoritative third-party source mention your brand in relation to this topic?</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          Answer engines do not synthesize brands from a single self-published page. They surface
          brands they have seen named on external sources — directories, industry roundups, press
          coverage, forum threads. Search for your brand name plus your topic in Bing, in
          ChatGPT, and in Perplexity. If only your own site appears, the gap is off-page.
        </p>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          <strong>Fix:</strong> Identify which external sources AI assistants already cite when
          answering queries in your category. Those are the sources where a mention matters.
          Submissions, community participation, and directory listings are the work — not
          additional schema.
        </p>

        <h3 style={{ marginTop: "1.4em" }}>Check 4 — Where does the page rank in Bing for the target query?</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          Rank is an imperfect but real signal of retrieval candidacy. A page ranking outside
          the top 20 in Bing for its target query is rarely retrieved as a first-choice passage
          for that query. Schema does not move rank. Topical depth, crawl freshness, and
          authoritative mentions move rank.
        </p>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          <strong>Fix:</strong> Run a content gap analysis against pages that do rank. What
          questions do they answer that yours does not? Is your page thin on the topic compared
          to what is already indexed? Structural depth and answer-first formatting are the
          on-page levers. See{" "}
          <a href="/learn/bing-rank-and-ai-citations">Bing rank and AI citations</a> for the
          direct connection.
        </p>

        <h3 style={{ marginTop: "1.4em" }}>Check 5 — Is the schema you added the right type for the page?</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          Mismatched schema is a minor mislabeling issue, not a citation blocker — but it is
          worth auditing. Service and government pages should use Service or OfferCatalog, not
          Product. FAQ schema should wrap actual question/answer pairs, not marketing bullets.
          Article schema should describe editorial content, not a landing page.
        </p>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          <strong>Fix:</strong> Match the schema type to what the page actually is. Correcting
          mislabeled schema is hygiene; it removes noise but does not create retrieval signals.
        </p>

        {/* ---- Symptom → cause → fix summary ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Symptom → cause → fix</h2>
        <table style={{ marginTop: "0.8em", width: "100%", borderCollapse: "collapse", lineHeight: 1.6 }}>
          <thead>
            <tr>
              <th scope="col" style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid currentColor" }}>Symptom</th>
              <th scope="col" style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid currentColor" }}>Actual cause</th>
              <th scope="col" style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid currentColor" }}>Fix</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Schema validates; no citation change</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Schema labels, it does not retrieve</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Address the three real levers</td>
            </tr>
            <tr>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Page indexed in Google but not cited in AI</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Likely absent from Bing index</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Bing Webmaster Tools + IndexNow</td>
            </tr>
            <tr>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Brand not surfaced despite correct schema</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>No third-party mentions on authoritative sources</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Directory submissions, community presence, outreach</td>
            </tr>
            <tr>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>FAQPage schema present; answer not surfaced</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Answer is JavaScript-rendered, not in crawl HTML</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Move answer to server-rendered HTML</td>
            </tr>
            <tr>
              <td style={{ padding: "8px 12px", opacity: 0.8 }}>Rich results appear in Google; no AI citation</td>
              <td style={{ padding: "8px 12px", opacity: 0.8 }}>Rich results are a display layer; AI retrieval is separate</td>
              <td style={{ padding: "8px 12px", opacity: 0.8 }}>Bing rank + extractable content + third-party mentions</td>
            </tr>
          </tbody>
        </table>

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
          This page makes no claims that require external citation. The relationship between
          schema markup and AI citation retrieval is described qualitatively, based on how
          schema, Bing indexing, and AI retrieval are documented to interact. The statement
          that most large-language model assistants ground retrieval on Bing-indexed content
          is consistent with publicly documented behavior of ChatGPT and Bing AI — no specific
          study is cited because the operational coupling changes as products update, and citing
          a stale study would misrepresent the current state.
        </p>

        {/* ---- Guarantee section ---- */}
        <h2 style={{ marginTop: "2.4em" }}>What this does not guarantee</h2>
        <ul style={{ marginTop: "0.8em", lineHeight: 1.8, paddingLeft: "1.4em" }}>
          <li>
            Schema markup — including JSON-LD, FAQPage, Article, or any schema.org type — is
            parse hygiene, not a citation lever. No action described on this page promises
            citation by an AI assistant.
          </li>
          <li>
            No specific citation count, Bing rank position, or AI-response outcome is promised
            by any fix described above.
          </li>
          <li>
            Fixing the technical issues on this checklist removes blockers. It does not guarantee
            that an answer engine will surface your content within any particular timeframe.
          </li>
          <li>
            Where Prompt Goblin engagement is mentioned: the refund covers the delivered
            work — audits, technical fixes, copy, measurement loop. It never covers a
            citation number or ranking position.
          </li>
        </ul>

        {/* ---- Scan CTA ---- */}
        <p style={{ marginTop: "2.4em", lineHeight: 1.7 }}>
          Not sure which check applies to your site?{" "}
          <Link href="/#contact">Get in touch</Link> and we will walk through the diagnostic —
          whether that is a Bing indexing gap, a JS-rendering blind spot, or an
          off-page mention deficit.
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
            <a href="/learn/bing-rank-and-ai-citations">
              Bing rank and AI citations — the direct connection
            </a>
          </li>
          <li>
            <a href="/learn/technical-seo-for-ai-search">
              Technical SEO for AI search — crawl conditions and citation blockers
            </a>
          </li>
          <li>
            <a href="/learn/rank-but-not-cited">
              Rank-but-not-cited diagnostic — if your page already ranks but is not cited
            </a>
          </li>
          <li>
            <a href="/methodology">How the Prompt Goblin scan works — methodology</a>
          </li>
          <li>
            <a href="/faq">Frequently asked questions</a>
          </li>
        </ul>
      </article>
    </>
  );
}
