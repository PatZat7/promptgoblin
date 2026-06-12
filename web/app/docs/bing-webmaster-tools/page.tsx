import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { JsonLd } from "@/components/system/JsonLd";
import { bingWebmasterToolsDocJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Bing Webmaster Tools guide · Prompt Goblin",
  description:
    "How to verify a Bing property, submit your sitemap, inspect URLs for index coverage gaps, and use IndexNow to notify Bing of changed pages — the discovery and diagnostics workflow for the Bing-rank side of the AEO loop.",
  alternates: { canonical: "/docs/bing-webmaster-tools" },
  openGraph: {
    type: "article",
    url: `${SITE.url}/docs/bing-webmaster-tools`,
    title: "Bing Webmaster Tools Guide",
    description:
      "Verification, sitemap submission, URL inspection, and IndexNow — the four steps that give Bing the signals it needs to crawl and index your site.",
    images: ["/og-image.png"],
  },
};

export default function BingWebmasterToolsPage() {
  return (
    <>
      {bingWebmasterToolsDocJsonLd().map((d, i) => (
        <JsonLd key={i} data={d} />
      ))}
      <article style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 80px" }}>
        <h1>Bing Webmaster Tools guide</h1>

        <p style={{ marginTop: "1.2em", lineHeight: 1.7 }}>
          Bing Webmaster Tools is the control panel for your site&apos;s presence in Bing&apos;s
          index. The four workflows that matter for AEO are: verifying the property so Bing
          accepts your submissions, submitting the sitemap so it knows what pages exist,
          running URL Inspection to confirm coverage, and enabling IndexNow so changed pages
          are discovered faster. This is diagnostics and discovery infrastructure — not an
          indexing, ranking, or citation guarantee.
        </p>

        {/* ---- Step 1: Verify property ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Step 1 — Verify the property</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Sign in to{" "}
          <a
            href="https://www.bing.com/webmasters"
            target="_blank"
            rel="noopener noreferrer"
          >
            Bing Webmaster Tools
          </a>{" "}
          with a Microsoft account and add your canonical domain as a new property. Bing
          offers several verification methods; pick the one that is least fragile for your
          stack:
        </p>
        <ul style={{ marginTop: "0.8em", lineHeight: 1.8, paddingLeft: "1.4em" }}>
          <li>
            <strong>XML file</strong> — download the provided file and host it at the site
            root (e.g. <code>https://example.com/BingSiteAuth.xml</code>). Works for any
            stack; survives deploys as long as the file is included in the build output.
          </li>
          <li>
            <strong>Meta tag</strong> — paste the provided <code>&lt;meta&gt;</code> tag
            into your <code>&lt;head&gt;</code>. Easy for SSR frameworks; remove it after
            verification and Bing will lose verification — leave it in permanently.
          </li>
          <li>
            <strong>CNAME record</strong> — add a DNS CNAME entry. Most robust option for
            teams; does not require a code change.
          </li>
          <li>
            <strong>Auto-verify via Google Search Console</strong> — if your Google Search
            Console account is verified for the same property, Bing can import that
            verification automatically.
          </li>
        </ul>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          After verification, the property dashboard becomes active. You will see crawl
          stats, indexing status, and error reports once Bing has crawled the site.
        </p>

        {/* ---- Step 2: Submit sitemap ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Step 2 — Submit the sitemap</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          In the verified property, go to <strong>Sitemaps</strong> and submit the full URL
          of your sitemap file (for example{" "}
          <code>https://example.com/sitemap.xml</code>). Bing will fetch the sitemap on its
          own schedule and discover the URLs listed there.
        </p>
        <ul style={{ marginTop: "0.8em", lineHeight: 1.8, paddingLeft: "1.4em" }}>
          <li>Submit once; Bing re-fetches the sitemap automatically on each crawl cycle.</li>
          <li>
            If you have multiple sitemaps (an index, a news sitemap, an image sitemap),
            submit each separately.
          </li>
          <li>
            A sitemap tells Bing which pages exist and their last-modified date — it does
            not force crawling or guarantee indexing on any particular schedule.
          </li>
        </ul>

        {/* ---- Step 3: Inspect URLs ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Step 3 — Inspect URLs for coverage gaps</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Use <strong>URL Inspection</strong> on your highest-priority pages — homepage,
          core service or product pages, and any page you want AI assistants to cite. The
          tool shows whether Bing has crawled the URL, whether it is indexed, and any
          crawl error it encountered.
        </p>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Common findings and what they mean:
        </p>
        <table style={{ marginTop: "0.8em", width: "100%", borderCollapse: "collapse", lineHeight: 1.6 }}>
          <thead>
            <tr>
              <th scope="col" style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid currentColor" }}>Status</th>
              <th scope="col" style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid currentColor" }}>What it means</th>
              <th scope="col" style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid currentColor" }}>Next step</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.85 }}>Indexed</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.85 }}>Bing has crawled and accepted the page</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.85 }}>No action needed; monitor crawl freshness</td>
            </tr>
            <tr>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.85 }}>Crawled, not indexed</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.85 }}>Bing fetched the page but chose not to include it</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.85 }}>Review content quality and crawlability; submit via URL Submission after any fix</td>
            </tr>
            <tr>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.85 }}>Not crawled</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.85 }}>Bing has not attempted the URL yet</td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.85 }}>Submit via URL Submission; ensure the URL is in the sitemap</td>
            </tr>
            <tr>
              <td style={{ padding: "8px 12px", opacity: 0.85 }}>Error (4xx / redirect chain)</td>
              <td style={{ padding: "8px 12px", opacity: 0.85 }}>Server returned an error or redirect loop</td>
              <td style={{ padding: "8px 12px", opacity: 0.85 }}>Fix the server error or redirect before resubmitting</td>
            </tr>
          </tbody>
        </table>

        {/* ---- Step 4: IndexNow ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Step 4 — Submit changed URLs with IndexNow</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          IndexNow is an open protocol that notifies Bing (and other participating search
          engines) the moment a URL is added or materially changed. This shortens the gap
          between publishing and Bing having a fresh crawl snapshot — which matters for the
          AEO loop, where you want the current version of a page available as a retrieval
          candidate.
        </p>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Setup:
        </p>
        <ol style={{ marginTop: "0.8em", lineHeight: 1.8, paddingLeft: "1.4em" }}>
          <li>
            Generate an IndexNow key in Bing Webmaster Tools (
            <a
              href="https://www.bing.com/indexnow/IndexNowView/IndexNowGetStartedView"
              target="_blank"
              rel="noopener noreferrer"
            >
              IndexNow setup guide
            </a>
            ) or generate a UUID key yourself.
          </li>
          <li>
            Host the key as a plain UTF-8 text file at the site root:{" "}
            <code>https://example.com/&lt;your-key&gt;.txt</code>. The file content must
            be exactly the key string.
          </li>
          <li>
            When a URL changes, POST a submission to the IndexNow API with the URL, your
            key, and the key location. Many CMS plugins and deploy hooks support this
            automatically — check your platform&apos;s documentation.
          </li>
          <li>
            Verify receipt in Bing Webmaster Tools under <strong>URL Submission</strong>.
            Successful IndexNow pings appear in the submission log.
          </li>
        </ol>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Use IndexNow for pages you added or substantially changed — not for historical
          backfill. Bing&apos;s own IndexNow FAQ states that submission does not guarantee
          crawling or indexing on any particular schedule.
        </p>

        {/* ---- Ongoing checks ---- */}
        <h2 style={{ marginTop: "2.4em" }}>What to check on an ongoing basis</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          After initial setup, revisit Bing Webmaster Tools at these intervals:
        </p>
        <ul style={{ marginTop: "0.8em", lineHeight: 1.8, paddingLeft: "1.4em" }}>
          <li>
            <strong>Two weeks after publishing a new page:</strong> run URL Inspection to
            confirm the page is indexed. If it is still &ldquo;not crawled,&rdquo; resubmit via
            URL Submission and check for crawl errors in the Crawl section.
          </li>
          <li>
            <strong>Monthly:</strong> review the Crawl Errors report for new 4xx entries,
            redirect chains, or blocked resources. Crawl errors on priority pages are a
            direct indexing blocker.
          </li>
          <li>
            <strong>Monthly:</strong> check the Indexed pages count against your sitemap
            count. A significant gap between submitted and indexed URLs indicates either
            quality signals blocking indexing or crawl errors you haven&apos;t caught.
          </li>
          <li>
            <strong>After each material content update:</strong> submit the changed URL via
            IndexNow and note the submission date. Log it in your measurement notes so you
            can compare citation share before and after the crawl window passes.
          </li>
        </ul>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          If Bing Webmaster Tools shows an <strong>AI Performance</strong> report in your
          account, use it to see whether queries related to your priority pages are
          generating AI-grounded impressions. This is a diagnostic view — low numbers
          reflect the combined effect of index coverage, rank, and content extractability,
          not a single lever you can pull.
        </p>

        {/* ---- What this does not guarantee ---- */}
        <h2 style={{ marginTop: "2.4em" }}>What this does not guarantee</h2>
        <ul style={{ marginTop: "0.8em", lineHeight: 1.8, paddingLeft: "1.4em" }}>
          <li>
            Submission via Bing Webmaster Tools or IndexNow is for discovery and
            diagnostics. It is not an indexing, ranking, or AI-citation guarantee. Bing
            decides whether and when to crawl and index a submitted URL.
          </li>
          <li>
            A page that is indexed in Bing is a candidate for AI-assistant retrieval.
            Indexing alone does not determine citation — the page also needs to rank
            for the relevant query and contain extractable, direct-answer content.
          </li>
          <li>
            No action described on this page promises a specific citation count, rank
            position, or AI-response outcome.
          </li>
          <li>
            Where Prompt Goblin engagement covers this work: the refund covers the
            delivered work — verification, submission, diagnostics, measurement loop.
            It never covers a citation number or ranking position.
          </li>
        </ul>

        {/* ---- Sources ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Sources cited on this page</h2>
        <ul style={{ marginTop: "0.8em", lineHeight: 1.8, paddingLeft: "1.4em" }}>
          <li>
            <a
              href="https://www.bing.com/webmasters/help/URL-Submission-62f2860b"
              target="_blank"
              rel="noopener noreferrer"
            >
              Bing Webmaster Tools — URL Submission help
            </a>
          </li>
          <li>
            <a
              href="https://www.bing.com/indexnow/IndexNowView/IndexNowGetStartedView"
              target="_blank"
              rel="noopener noreferrer"
            >
              IndexNow — Get Started (Bing)
            </a>
          </li>
          <li>
            <a
              href="https://learn.microsoft.com/en-us/bingwebmaster/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Bing Webmaster API overview (Microsoft Learn)
            </a>
          </li>
        </ul>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          The claim that IndexNow submission does not guarantee crawling or indexing is
          sourced from Bing&apos;s own IndexNow FAQ (linked above). No statistics on crawl
          timing or citation rates are cited because those change with Bing&apos;s crawl
          schedule — citing a specific figure would misrepresent the current state.
        </p>

        {/* ---- Contact CTA ---- */}
        <p style={{ marginTop: "2.4em", lineHeight: 1.7 }}>
          Questions about your Bing index coverage or what a crawl error means for your
          AEO work?{" "}
          <Link href="/#contact">Get in touch</Link> and we will walk through the
          diagnostics together.
        </p>

        {/* ---- Go deeper ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Go deeper</h2>
        <ul style={{ marginTop: "0.6em", lineHeight: 2, paddingLeft: "1.4em" }}>
          <li>
            <Link href="/learn/bing-rank-and-ai-citations">
              Bing rank and AI citations — the direct connection
            </Link>
          </li>
          <li>
            <Link href="/learn/technical-seo-for-ai-search">
              Technical SEO for AI search — crawl conditions and citation blockers
            </Link>
          </li>
          <li>
            <Link href="/methodology">How the Prompt Goblin scan works — methodology</Link>
          </li>
        </ul>
      </article>
    </>
  );
}
