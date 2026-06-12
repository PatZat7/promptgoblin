import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { JsonLd } from "@/components/system/JsonLd";
import { bingRankJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Bing rank and AI citations · Prompt Goblin",
  description:
    "Why Bing indexing is the most under-managed lever for AI assistant citations, and how IndexNow and Bing Webmaster Tools close the gap.",
  alternates: { canonical: "/learn/bing-rank-and-ai-citations" },
  openGraph: {
    type: "article",
    url: `${SITE.url}/learn/bing-rank-and-ai-citations`,
    title: "Bing rank and AI citations",
    description:
      "The direct connection between Bing/web rank and whether AI assistants cite your content.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return (
    <>
      {bingRankJsonLd().map((d, i) => <JsonLd key={i} data={d} />)}
      <article style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 80px" }}>
        <h1>Bing rank and AI citations</h1>

        <p style={{ marginTop: "1.2em", lineHeight: 1.7 }}>
          Most large-language model assistants — including ChatGPT, Copilot, and Bing AI —
          ground their retrieval on Bing-indexed content. A page that does not appear in
          Bing&apos;s index is not a candidate for citation, regardless of its Google rank,
          schema quality, or content depth. Bing is the under-managed lever for most teams,
          and it has a direct mechanical connection to AI assistant citations.
        </p>

        {/* ---- Why Bing ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Why Bing specifically?</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          OpenAI&apos;s ChatGPT uses Bing as its live-search grounding layer. Microsoft Copilot
          is built on Bing. Perplexity and similar retrieval-augmented assistants pull from
          multiple indices, with Bing being a primary source for web results. The practical
          consequence: Google-only indexing is insufficient if you want AI assistant coverage.
        </p>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Google AI Overviews pull from Google&apos;s own index — so Google rank matters there.
          The point is that these are <em>separate signals</em> requiring separate hygiene,
          not a single universal search optimisation target.
        </p>

        {/* ---- Getting indexed ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Getting into Bing&apos;s index</h2>
        <h3 style={{ marginTop: "1.2em" }}>Step 1 — Bing Webmaster Tools</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          Create an account at webmaster.bing.com and verify ownership of your domain. The
          verification options (DNS TXT record, meta tag, XML file) are identical to Google
          Search Console. Without verification, Bing has no ownership signal and may
          de-prioritise crawl resources for your domain.
        </p>

        <h3 style={{ marginTop: "1.4em" }}>Step 2 — Submit a sitemap</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          Submit an XML sitemap once from Bing Webmaster Tools to establish the initial seed
          set. Keep the sitemap accurate — pages removed from your site should be removed from
          the sitemap promptly to avoid soft-404 crawl debt. Bing uses the sitemap
          last-modified date as a freshness hint.
        </p>

        <h3 style={{ marginTop: "1.4em" }}>Step 3 — IndexNow</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          IndexNow is an open protocol supported by Bing, Yandex, and a growing list of
          search engines (notably not Google, which has its own equivalent). When you publish
          or update a URL, an IndexNow ping tells participating engines immediately rather
          than waiting for their next crawl cycle. This reduces the lag between publish and
          indexed state — which reduces the lag between publish and AI retrieval candidacy.
        </p>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Prompt Goblin generates IndexNow pings as part of the publishing workflow. The
          endpoint at{" "}
          <code>/indexnow</code> on this site is a live example: every page change triggers
          an immediate ping.
        </p>

        {/* ---- Rank signals ---- */}
        <h2 style={{ marginTop: "2.4em" }}>What Bing ranks on</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Bing&apos;s ranking signals overlap substantially with Google&apos;s, with a few
          differences in weight:
        </p>
        <ul style={{ marginTop: "0.8em", lineHeight: 1.9, paddingLeft: "1.4em" }}>
          <li>
            <strong>Named entities in JSON-LD and headings</strong> — Bing has strong
            entity-matching behaviour; explicit entity annotation in structured data is
            noticeably effective.
          </li>
          <li>
            <strong>Third-party references to the same URL</strong> — inbound links from
            indexed, authoritative sources are a strong signal on both engines.
          </li>
          <li>
            <strong>Stable URL history</strong> — Bing rewards URL consistency; frequent
            URL changes without proper 301 redirects cause crawl debt.
          </li>
          <li>
            <strong>Low soft-404 rate</strong> — pages returning 200 with &ldquo;not
            found&rdquo; body content suppress domain crawl budget.
          </li>
          <li>
            <strong>Consistent canonical declaration</strong> — canonical in the HTML head,
            HTTP header, and sitemap must agree.
          </li>
          <li>
            <strong>Core Web Vitals</strong> — field data from the CrUX dataset feeds Bing
            quality signals similarly to how Page Experience signals feed Google.
          </li>
        </ul>

        {/* ---- High-risk patterns ---- */}
        <h2 style={{ marginTop: "2.4em" }}>High-risk patterns that suppress Bing indexing</h2>
        <ul style={{ marginTop: "0.8em", lineHeight: 1.9, paddingLeft: "1.4em" }}>
          <li>
            <strong>JS-only rendering</strong> — Bing&apos;s crawler executes JavaScript,
            but many pages are pre-rendered from the crawl snapshot before JS runs. Server-side
            rendering is the reliable path.
          </li>
          <li>
            <strong>Duplicate content at scale</strong> — thin or near-duplicate pages dilute
            crawl budget and suppress the authority of the canonical version.
          </li>
          <li>
            <strong>Redirect chains longer than two hops</strong> — each extra hop in a chain
            introduces latency and crawl failure risk.
          </li>
          <li>
            <strong>robots.txt blocking high-value pages accidentally</strong> — wildcard
            rules that block CSS/JS directories or the main content paths are common and easy
            to miss.
          </li>
        </ul>

        {/* ---- Measurement ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Measuring Bing coverage</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Bing Webmaster Tools provides an index coverage report, crawl stats, and a query
          report. Useful baseline checks:
        </p>
        <ul style={{ marginTop: "0.6em", lineHeight: 1.8, paddingLeft: "1.4em" }}>
          <li>Indexed page count vs. sitemap URL count — large gaps indicate crawl problems</li>
          <li>Crawl error rate — spike after a deploy often means a redirect or 500 was introduced</li>
          <li>Query impressions for brand terms — a baseline of zero brand impressions means Bing doesn&apos;t have you</li>
        </ul>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Prompt Goblin pulls this data as part of the audit and surfaces Bing gaps alongside
          the citation gap report, so both tracks are measured in the same loop.
        </p>

        {/* ---- FAQ ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Frequently asked questions</h2>

        <h3 style={{ marginTop: "1.2em" }}>My site ranks well on Google — why isn&apos;t it cited in ChatGPT?</h3>
        <p style={{ marginTop: "0.5em", lineHeight: 1.7 }}>
          ChatGPT&apos;s web retrieval grounds on Bing, not Google. A site invisible to Bing
          is invisible to ChatGPT&apos;s live search layer. Check Bing Webmaster Tools for
          your indexed page count and crawl errors first.
        </p>

        <h3 style={{ marginTop: "1.2em" }}>Does Prompt Goblin guarantee Bing rank improvements?</h3>
        <p style={{ marginTop: "0.5em", lineHeight: 1.7 }}>
          No — rank depends on competitive dynamics, freshness, and Bing&apos;s own quality
          evaluation that we cannot control. We guarantee the technical work: sitemap hygiene,
          IndexNow wiring, crawl error remediation, and the measurement loop. We report
          measurable delta; we never promise a rank position.
        </p>

        {/* ---- Internal links ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Go deeper</h2>
        <ul style={{ marginTop: "0.6em", lineHeight: 2, paddingLeft: "1.4em" }}>
          <li><a href="/learn/how-to-show-up-in-chatgpt">How to show up in ChatGPT — the three levers</a></li>
          <li><a href="/learn/technical-seo-for-ai-search">Technical SEO for AI search</a></li>
          <li><a href="/methodology">How the Prompt Goblin scan works — methodology</a></li>
          <li><a href="/benchmark">Benchmark — compare citation coverage</a></li>
          <li><a href="/faq">FAQ</a></li>
        </ul>
      </article>
    </>
  );
}
