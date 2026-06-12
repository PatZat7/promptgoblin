import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { JsonLd } from "@/components/system/JsonLd";
import { technicalSeoForAiJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Technical SEO for AI search · Prompt Goblin",
  description:
    "The technical conditions that determine whether an answer engine can find, crawl, and cite your content — and the high-risk patterns that silently block citation.",
  alternates: { canonical: "/learn/technical-seo-for-ai-search" },
  openGraph: {
    type: "article",
    url: `${SITE.url}/learn/technical-seo-for-ai-search`,
    title: "Technical SEO for AI search",
    description:
      "Canonicals, Core Web Vitals, structured data alignment, and the patterns that silently block AI citation.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return (
    <>
      {technicalSeoForAiJsonLd().map((d, i) => <JsonLd key={i} data={d} />)}
      <article style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 80px" }}>
        <h1>Technical SEO for AI search</h1>

        <p style={{ marginTop: "1.2em", lineHeight: 1.7 }}>
          AI search does not remove the classic technical SEO prerequisites — it raises the
          bar on them. Answer engines retrieve from crawl snapshots. A page that is not
          discoverable, not crawlable, or not correctly indexed cannot be cited regardless of
          its content quality or schema depth. The technical layer is the floor everything
          else stands on.
        </p>

        {/* ---- The minimum pass ---- */}
        <h2 style={{ marginTop: "2.4em" }}>The minimum technical pass</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          These are the conditions a page must meet before any content or citation work is
          meaningful. Failing any one of them will suppress the page in both traditional and
          AI search.
        </p>

        <h3 style={{ marginTop: "1.4em" }}>Status and indexability</h3>
        <ul style={{ marginTop: "0.6em", lineHeight: 1.8, paddingLeft: "1.4em" }}>
          <li>Every primary page returns HTTP 200 — no soft 404s (200 status with &ldquo;not found&rdquo; body)</li>
          <li>No accidental <code>noindex</code> in the meta robots tag or HTTP header</li>
          <li>No blocking by <code>robots.txt</code> on content pages (wildcard rules are a common source of accidental blocks)</li>
          <li>HTTPS with a valid, unexpired certificate and no mixed-content warnings</li>
        </ul>

        <h3 style={{ marginTop: "1.4em" }}>Canonical hygiene</h3>
        <ul style={{ marginTop: "0.6em", lineHeight: 1.8, paddingLeft: "1.4em" }}>
          <li>One canonical URL declared consistently in: <code>&lt;link rel=&quot;canonical&quot;&gt;</code>, the HTTP header, and the sitemap</li>
          <li>No conflicting canonicals across paginated or faceted variants</li>
          <li>No redirect chains longer than two hops pointing to canonicals</li>
          <li>Trailing-slash consistency: choose one form and enforce it with 301s</li>
        </ul>

        <h3 style={{ marginTop: "1.4em" }}>Sitemap accuracy</h3>
        <ul style={{ marginTop: "0.6em", lineHeight: 1.8, paddingLeft: "1.4em" }}>
          <li>Submitted and verified in both Google Search Console and Bing Webmaster Tools</li>
          <li>Only canonical, indexable 200 URLs are included — no noindex pages in the sitemap</li>
          <li>Updated automatically after every publish; <code>lastmod</code> reflects actual content change dates</li>
          <li>Size under the 50,000 URL and 50 MB limits; split into sub-sitemaps if needed</li>
        </ul>

        <h3 style={{ marginTop: "1.4em" }}>Structured data alignment</h3>
        <ul style={{ marginTop: "0.6em", lineHeight: 1.8, paddingLeft: "1.4em" }}>
          <li>JSON-LD blocks validate without errors in Google&apos;s Rich Results Test</li>
          <li>Schema type matches the actual content: <strong>service pages use Service / OfferCatalog, not Product</strong></li>
          <li>Every claim in structured data is also present in the visible page text</li>
          <li>No fabricated or aspirational data in structured markup</li>
        </ul>

        <h3 style={{ marginTop: "1.4em" }}>Core Web Vitals (field thresholds)</h3>
        <ul style={{ marginTop: "0.6em", lineHeight: 1.8, paddingLeft: "1.4em" }}>
          <li>LCP (Largest Contentful Paint) ≤ 2.5 s at the 75th percentile</li>
          <li>CLS (Cumulative Layout Shift) ≤ 0.1 at the 75th percentile</li>
          <li>INP (Interaction to Next Paint) ≤ 200 ms at the 75th percentile</li>
        </ul>

        <h3 style={{ marginTop: "1.4em" }}>Mobile parity</h3>
        <ul style={{ marginTop: "0.6em", lineHeight: 1.8, paddingLeft: "1.4em" }}>
          <li>Mobile layout returns the same core content as desktop — no hidden text, no collapsed critical copy</li>
          <li>Viewport meta tag present; touch targets ≥ 44 × 44 px</li>
        </ul>

        {/* ---- High-risk patterns ---- */}
        <h2 style={{ marginTop: "2.4em" }}>High-risk patterns for AI citation specifically</h2>

        <h3 style={{ marginTop: "1.2em" }}>JavaScript-only rendering</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          If the answer lives only in JavaScript that runs after page load, most crawlers never
          see it. The page exists in the visual DOM but not in the HTML response body — which
          is what gets stored in the crawl snapshot. Server-rendering the content (SSR or
          SSG) is the reliable fix. Client-side hydration on top of server-rendered HTML is
          fine; client-only rendering with no server HTML is the problem.
        </p>

        <h3 style={{ marginTop: "1.2em" }}>Infinite scroll and interaction-gated content</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          Content that loads only after a scroll event, a click, or a tab selection is
          structurally invisible to a crawler following a single HTTP GET. Break that content
          into separate indexable URLs or surface it in the initial HTML response.
        </p>

        <h3 style={{ marginTop: "1.2em" }}>Framework routing that breaks canonical</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          Client-side navigation in SPAs can change the displayed URL without issuing a
          server redirect. Crawlers follow HTTP redirects, not JS pushState — so two paths
          pointing at the same content without a server-level canonical or redirect create a
          duplicate-content split.
        </p>

        <h3 style={{ marginTop: "1.2em" }}>Thin or AI-generated duplicate content at scale</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          Pages generated programmatically with low variation — especially pages written to
          target AI assistants rather than humans — are treated as low-quality by search
          engines and increase the risk of domain-level quality suppression. The standard is
          the same one that has always applied: useful, accurate, distinctly informative pages
          for real queries.
        </p>

        {/* ---- Semantic HTML ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Semantic HTML: the overlap with accessibility</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          The same semantic structure that helps assistive technology also helps crawlers.
          A page built with proper landmarks, ordered headings, labelled images, and real
          interactive elements (buttons, links) is interpretable by any automated reader —
          human, crawler, or AI agent. This is why accessibility and AI visibility are
          measured in the same audit pass.
        </p>
        <ul style={{ marginTop: "0.8em", lineHeight: 1.9, paddingLeft: "1.4em" }}>
          <li>Use HTML5 landmarks: <code>header</code>, <code>main</code>, <code>article</code>, <code>section</code>, <code>nav</code>, <code>footer</code></li>
          <li>One <code>h1</code> per page; H2 → H3 → H4 hierarchy in strict order, no skipped levels</li>
          <li>All images that communicate meaning have descriptive <code>alt</code> text</li>
          <li>Interactive elements use real <code>&lt;button&gt;</code> or <code>&lt;a href&gt;</code> — not styled divs with click handlers</li>
          <li>Form controls have associated <code>&lt;label&gt;</code> elements</li>
        </ul>

        {/* ---- Schema reminder ---- */}
        <h2 style={{ marginTop: "2.4em" }}>A note on structured data</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Structured data is <strong>parse hygiene, not a citation lever</strong>. It helps
          crawlers understand what a page is. It is a good technical practice and we add it
          to every client site. But structured data on a page with poor rank, no third-party
          mentions, and JS-only rendering will not produce citations. Fix the floor before
          decorating the ceiling.
        </p>

        {/* ---- Internal links ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Go deeper</h2>
        <ul style={{ marginTop: "0.6em", lineHeight: 2, paddingLeft: "1.4em" }}>
          <li><a href="/learn/how-to-show-up-in-chatgpt">How to show up in ChatGPT — the three levers</a></li>
          <li><a href="/learn/bing-rank-and-ai-citations">Bing rank and AI citations</a></li>
          <li><a href="/learn/accessibility-seo-audit">Accessibility SEO audit</a></li>
          <li><a href="/methodology">How the Prompt Goblin scan works — methodology</a></li>
          <li><a href="/faq">FAQ</a></li>
        </ul>
      </article>
    </>
  );
}
