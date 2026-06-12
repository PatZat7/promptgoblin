import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { JsonLd } from "@/components/system/JsonLd";
import { siteStructureJsonLd } from "@/lib/structured-data";
import { FAQ_ITEMS } from "./site-structure-ai-citations.data";

export const metadata: Metadata = {
  title: "Site Structure for AI Citations — Clusters, Hubs, and Passage Retrieval · Prompt Goblin",
  description:
    "Isolated pages lose to clustered pages in AI passage retrieval. The hub-and-spoke pattern — one hub per topic, spokes answering one sub-question each — is how internal linking turns crawlable pages into retrievable ones.",
  alternates: { canonical: "/learn/site-structure-ai-citations" },
  openGraph: {
    type: "article",
    url: `${SITE.url}/learn/site-structure-ai-citations`,
    title: "Site Structure for AI Citations — Clusters, Hubs, and Passage Retrieval",
    description:
      "Hub-and-spoke internal linking, sub-question mapping, and how orphaned pages get excluded from retrieval even when technically crawlable.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return (
    <>
      {siteStructureJsonLd().map((d, i) => (
        <JsonLd key={i} data={d} />
      ))}
      <article style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 80px" }}>
        <h1>Site structure for AI citations — clusters, hubs, and passage retrieval</h1>

        <p style={{ marginTop: "1.2em", lineHeight: 1.7 }}>
          Answer engines retrieve passages, not sites. When two pages cover the same topic, the one
          embedded in a topic cluster — linked from a hub, cross-linked to sibling spokes — is more
          likely to surface than the one sitting alone. Structural isolation is a retrieval risk even
          on a technically sound, indexed page. The fix is intentional internal linking, not more
          content.
        </p>

        {/* ---- How answer engines retrieve passages, not sites ---- */}
        <h2 style={{ marginTop: "2.4em" }}>How answer engines retrieve passages, not sites</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          When an AI assistant answers a question, it does not evaluate your site as a whole. It
          retrieves candidate passages — short, extractable chunks of text — from its index and
          ranks them by how directly they match the query. Your homepage authority does not transfer
          to a product page buried three clicks deep. Each passage competes on its own extractability
          and the contextual signals that surround it.
        </p>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Internal links are one of those contextual signals. They tell crawlers which pages exist,
          how frequently to revisit them, and how they relate to each other. A page that receives
          many internal links from related pages signals topical relevance through co-occurrence. A
          page with no inbound internal links sends the opposite signal: it is hard to find,
          infrequently recrawled, and contextually isolated — a structurally orphaned page even if
          it is not technically blocked.
        </p>

        {/* ---- Why an isolated page loses to a clustered page ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Why an isolated page loses to a clustered page</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Two pages can cover the same topic equally well in terms of writing quality and keyword
          match. If one sits inside a cluster — linked from a hub, linked to sibling spokes, cross-
          linked reciprocally — and the other sits alone, the clustered page accumulates crawl
          depth and topical context the isolated page does not. This is not a ranking trick; it is
          how crawl queues and topical indexing work.
        </p>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Orphaned pages (no inbound internal links from any live page) are structurally
          deprioritized in crawl queues. The crawler may have visited once and never returned.
          The index entry may be stale or absent. A technically correct page with zero internal
          links pointing to it is invisible to the cluster retrieval pattern even if it would be an
          excellent passage answer.
        </p>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          This page covers topical clustering. If you are working on the technical prerequisites —
          canonical hygiene, Core Web Vitals, sitemap accuracy — see{" "}
          <a href="/learn/technical-seo-for-ai-search">Technical SEO for AI search</a> first. That
          is the floor this page builds on.
        </p>

        {/* ---- The hub-and-spoke pattern ---- */}
        <h2 style={{ marginTop: "2.4em" }}>The hub-and-spoke pattern</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          A topic cluster has one hub page and several spoke pages.
        </p>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          The <strong>hub page</strong> answers the topic-level question directly in its opening
          passage. It establishes the frame — &ldquo;here is what AI citation visibility means and
          why it matters&rdquo; — and then links to spoke pages for depth. The hub is not a table
          of contents; it must contain a direct, extractable answer to the top-level query.
        </p>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Each <strong>spoke page</strong> answers exactly one sub-question. It links back to the
          hub and links to two or three sibling spokes that answer related sub-questions. This
          reciprocal web tells crawlers: these pages are about the same topic, they answer different
          aspects of it, and they all connect to a central authority.
        </p>

        <h3 style={{ marginTop: "1.4em" }}>Linking rules for a hub-and-spoke cluster</h3>
        <ul style={{ marginTop: "0.6em", lineHeight: 1.9, paddingLeft: "1.4em" }}>
          <li>Every spoke links to the hub. No exceptions.</li>
          <li>Every spoke links to two or three sibling spokes covering adjacent sub-questions.</li>
          <li>The hub links to all spokes. The link text names the sub-question the spoke answers.</li>
          <li>
            Links are inline where the topic is introduced, not just collected at the bottom of
            the page. A link buried in a &ldquo;Related articles&rdquo; footer carries less
            contextual signal than a link in a body paragraph where the topic is named.
          </li>
        </ul>

        <h3 style={{ marginTop: "1.4em" }}>Prompt Goblin&apos;s own /learn cluster as a live example</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          The /learn section of this site is built as a hub-and-spoke cluster in progress. The
          hub topic is AI citation visibility. The spoke pages each answer a distinct sub-question:
          why schema is not enough, how Bing rank connects to citations, what the audit checklist
          looks like, how to fix a rank-but-not-cited gap, and so on. Each spoke links back to
          related spokes and to the methodology page. This page is one of those spokes. We are
          practicing what we measure — no claimed citation results, just honest structural work
          underway.
        </p>

        {/* ---- Sub-question mapping ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Sub-question mapping — giving each question one home</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Fan-out thinking is the practice of decomposing a topic into the questions users actually
          ask around it. For a topic like &ldquo;AI citation visibility,&rdquo; the fan-out might
          produce: Why am I not cited after adding schema? Why do I rank but not get cited? How do
          I audit for citation gaps? What does hub-and-spoke linking look like in practice? Each
          of those is a spoke candidate.
        </p>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          The discipline is giving each sub-question exactly one home. When two pages both attempt
          to answer the same sub-question, they compete with each other, divide internal link
          equity, and confuse both crawlers and retrievers. The fix is to identify the
          authoritative page for that sub-question, consolidate the duplicate content there, and
          redirect the weaker version.
        </p>

        <h3 style={{ marginTop: "1.4em" }}>How to run a sub-question map</h3>
        <ol style={{ marginTop: "0.6em", lineHeight: 1.9, paddingLeft: "1.4em" }}>
          <li>
            Start with the hub topic query. Write down the exact question a user would type.
          </li>
          <li>
            Fan out: list every related sub-question you know users ask. Use search autocomplete,
            &ldquo;People also ask&rdquo; in Google, and any support or sales questions you
            receive.
          </li>
          <li>
            Audit your existing pages: which sub-question does each page answer? Does any
            sub-question appear on more than one page?
          </li>
          <li>
            Assign each sub-question to exactly one page. If a page exists for it, reinforce it.
            If no page exists, create a spoke.
          </li>
          <li>
            Wire the links: every spoke links the hub and its two or three nearest sibling spokes.
          </li>
        </ol>

        {/* ---- Structure smell table ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Structure smells, retrieval consequences, and fixes</h2>
        <table style={{ marginTop: "0.8em", width: "100%", borderCollapse: "collapse", lineHeight: 1.6 }}>
          <thead>
            <tr>
              <th scope="col" style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid currentColor" }}>Structure smell</th>
              <th scope="col" style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid currentColor" }}>Retrieval consequence</th>
              <th scope="col" style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid currentColor" }}>Fix</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Page has zero inbound internal links</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Structurally orphaned — deprioritized in crawl queues; stale or absent index entry</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Add it to the hub as a spoke link; add inline links from two sibling pages</td>
            </tr>
            <tr>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Two pages answer the same sub-question</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Cannibalization — link equity split; retrieval selects one unpredictably</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Consolidate into the stronger page; 301-redirect the duplicate</td>
            </tr>
            <tr>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Hub page is a link list with no answer content</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>No extractable passage for the top-level topic query; hub cannot anchor the cluster</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Add a direct-answer opening paragraph before the spoke list</td>
            </tr>
            <tr>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Spoke does not link back to hub</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Topical relationship unresolved; spoke appears isolated despite quality content</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Add inline hub link where the topic is first introduced in the spoke</td>
            </tr>
            <tr>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Tag/category pages generate hundreds of thin archive URLs</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Crawl budget diluted across pages with no direct-answer content; none retrievable</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Noindex tag archives; consolidate topic navigation into hub pages</td>
            </tr>
            <tr>
              <td style={{ padding: "8px 12px", opacity: 0.8 }}>Spokes link only to hub, not to sibling spokes</td>
              <td style={{ padding: "8px 12px", opacity: 0.8 }}>Retriever sees a star pattern, not a semantic web; sibling co-relevance unreinforced</td>
              <td style={{ padding: "8px 12px", opacity: 0.8 }}>Add two or three inline links from each spoke to the most adjacent sibling spokes</td>
            </tr>
          </tbody>
        </table>

        {/* ---- Common mistakes ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Common mistakes</h2>

        <h3 style={{ marginTop: "1.4em" }}>Orphan pages</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          The most common structural failure is publishing a page and not linking to it from
          anywhere. This happens most often with resource pages, tool pages, and older blog posts
          that predate the current site structure. Audit for orphans by running a crawl of your
          own site and filtering for pages with zero inbound internal links.
        </p>

        <h3 style={{ marginTop: "1.4em" }}>Two pages answering the same question</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          When a site has both &ldquo;What is AEO?&rdquo; and &ldquo;AEO explained&rdquo; as
          separate pages, retrievers may select either one, reducing the probability of either
          being the dominant passage. Sub-question mapping prevents this by assigning every
          question to exactly one page before writing begins.
        </p>

        <h3 style={{ marginTop: "1.4em" }}>Hub pages that are link lists with no answer content</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          A hub page that opens with &ldquo;Here are our guides on X&rdquo; followed immediately
          by a list of links has no extractable passage for the top-level query. It cannot anchor
          a cluster because it answers nothing. Add a direct opening paragraph — the best 60-word
          answer to the topic question — before the spoke links.
        </p>

        <h3 style={{ marginTop: "1.4em" }}>Infinite tag and category sprawl</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          Blogging platforms and CMS tools auto-generate tag pages, category archives, author
          pages, and date archives. None of these contain direct-answer content. They dilute crawl
          budget across URLs that will never be retrieved as passages. Noindex them, or consolidate
          topic navigation into hub pages with real answer content.
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
          This page makes no claims that require external citation. The relationship between
          internal linking, crawl discovery, and topical indexing is described qualitatively,
          consistent with publicly documented crawler behavior. All structural guidance is
          framed as how crawl queues and retrieval patterns work — not as guaranteed outcomes.
          No fabricated statistics are used. Observations about passage retrieval are directional
          and based on documented indexing mechanics, not controlled experiments.
        </p>

        {/* ---- What this does not guarantee ---- */}
        <h2 style={{ marginTop: "2.4em" }}>What this does not guarantee</h2>
        <ul style={{ marginTop: "0.8em", lineHeight: 1.8, paddingLeft: "1.4em" }}>
          <li>
            Schema markup and internal linking are structural hygiene signals, not citation levers.
            No action described on this page promises citation by an AI assistant.
          </li>
          <li>
            No specific citation count, retrieval frequency, rank position, or AI-response
            outcome is promised by implementing the hub-and-spoke pattern or any other
            structural recommendation here.
          </li>
          <li>
            Fixing structural isolation removes a known retrieval risk. It does not guarantee
            that an answer engine will surface your content within any particular timeframe.
          </li>
          <li>
            Where Prompt Goblin engagement is mentioned: the refund covers the delivered
            work — audits, structural fixes, internal-link maps, measurement loop. It never
            covers a citation number or ranking position.
          </li>
        </ul>

        {/* ---- Scan CTA ---- */}
        <p style={{ marginTop: "2.4em", lineHeight: 1.7 }}>
          Want a structural audit of your site&apos;s cluster and orphan situation?{" "}
          <Link href="/#contact">Get in touch</Link> and we will map your internal-link
          gaps — which pages are orphaned, which sub-questions have two homes, and where
          the hub-and-spoke wiring is missing.
        </p>

        {/* ---- Go deeper ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Go deeper</h2>
        <ul style={{ marginTop: "0.6em", lineHeight: 2, paddingLeft: "1.4em" }}>
          <li>
            <a href="/learn/technical-seo-for-ai-search">
              Technical SEO for AI search — crawlability, canonicals, and the technical floor
            </a>
          </li>
          <li>
            <a href="/learn/aeo-audit-checklist">
              AEO audit checklist — structure checks and the full citation-readiness framework
            </a>
          </li>
          <li>
            <a href="/learn/rank-but-not-cited">
              Rank-but-not-cited diagnostic — when structure is fine but retrieval still misses you
            </a>
          </li>
          <li>
            <a href="/learn/why-schema-not-enough">
              Why schema markup isn&apos;t enough — what the real retrieval levers are
            </a>
          </li>
          <li>
            <a href="/learn/bing-rank-and-ai-citations">
              Bing rank and AI citations — the direct connection between indexing and retrieval
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
