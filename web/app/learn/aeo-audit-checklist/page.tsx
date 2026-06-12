import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { JsonLd } from "@/components/system/JsonLd";
import { aeoAuditChecklistJsonLd } from "@/lib/structured-data";
import { FAQ_ITEMS } from "./aeo-audit-checklist.data";

export const metadata: Metadata = {
  title: "AEO Audit Checklist for Small Agencies · Prompt Goblin",
  description:
    "The practical AEO audit framework small agencies use to check client sites for AI-search readiness: three citation levers, a hygiene pass, and honest scoring rules.",
  alternates: { canonical: "/learn/aeo-audit-checklist" },
  openGraph: {
    type: "article",
    url: `${SITE.url}/learn/aeo-audit-checklist`,
    title: "AEO Audit Checklist for Small Agencies",
    description:
      "A practitioner checklist for auditing a client site against the three levers that determine AI-search citation: brand mentions, Bing rank, and answer-shaped content.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return (
    <>
      {aeoAuditChecklistJsonLd().map((d, i) => (
        <JsonLd key={i} data={d} />
      ))}
      <article style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 80px" }}>
        <h1>AEO audit checklist for small agencies</h1>

        <p style={{ marginTop: "1.2em", lineHeight: 1.7 }}>
          An AEO audit checks whether a client site is positioned for AI-search citation across
          three mechanical levers: <strong>brand-mention surface</strong> on the sources answer
          engines already retrieve,{" "}
          <strong>Bing/web rank</strong> with verified indexing and a clean crawl record, and{" "}
          <strong>answer-shaped content</strong> — server-rendered HTML with direct answers
          up front, logical heading hierarchy, and named entities. Schema, canonicals, and{" "}
          <code>llms.txt</code> are a hygiene pass, not citation levers.
        </p>

        {/* ---- AEO vs SEO comparison ---- */}
        <h2 style={{ marginTop: "2.4em" }}>How an AEO audit differs from a classic SEO audit</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          A classic technical SEO audit focuses on rank signals. An AEO audit adds the
          off-page retrieval layer — the sources an answer engine consults before it decides
          what to surface — and checks whether the page content is shaped for passage extraction,
          not just for ranking.
        </p>

        <div
          style={{ overflowX: "auto", marginTop: "1.2em" }}
          tabIndex={0}
          role="region"
          aria-label="AEO audit vs classic SEO audit comparison"
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.93em",
              lineHeight: 1.6,
            }}
          >
            <thead>
              <tr>
                <th
                  scope="col"
                  style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid var(--line, #333)" }}
                >
                  Audit area
                </th>
                <th
                  scope="col"
                  style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid var(--line, #333)" }}
                >
                  Classic SEO audit
                </th>
                <th
                  scope="col"
                  style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid var(--line, #333)" }}
                >
                  AEO audit (adds or shifts)
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Off-page signals", "Backlink profile, domain authority", "Brand mentions on sources answer engines already cite for your category"],
                ["Indexing", "Google Search Console coverage", "Bing Webmaster Tools verified, sitemap submitted, IndexNow active"],
                ["Content shape", "Keyword density, word count, EEAT signals", "Direct answer in first 100 words, named entities explicit, server-rendered HTML"],
                ["Schema / markup", "Schema.org types, rich result eligibility", "Hygiene pass only — schema does not cause citations; flag mismatched types (e.g. Product on a service page)"],
                ["Crawlability", "Robots.txt, canonical, redirect chains", "Same, plus: JS-only rendering = page does not exist for most AI crawlers"],
                ["Scoring blocked pages", "Score 0 if unreadable", "Flag as blind spot; never score a page you could not read"],
              ].map(([area, classic, aeo]) => (
                <tr key={area} style={{ borderBottom: "1px solid var(--line, #222)" }}>
                  <td style={{ padding: "8px 12px", verticalAlign: "top", fontWeight: 600 }}>{area}</td>
                  <td style={{ padding: "8px 12px", verticalAlign: "top" }}>{classic}</td>
                  <td style={{ padding: "8px 12px", verticalAlign: "top" }}>{aeo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ---- The checklist ---- */}
        <h2 style={{ marginTop: "2.4em" }}>The AEO audit checklist</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Work through each group in order. The three lever groups determine citation
          probability; the hygiene group is a final pass. Note each item as: pass, gap, or
          blind spot (could not read). Blind spots are findings, not zeros.
        </p>

        {/* Lever 1 */}
        <h3 style={{ marginTop: "1.6em" }}>Lever 1 — Brand-mention surface</h3>
        <p style={{ marginTop: "0.5em", lineHeight: 1.7 }}>
          Answer engines surface brands they have seen referenced on third-party sources.
          This group checks whether the client brand is present on those sources.
        </p>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.93em",
            lineHeight: 1.6,
            marginTop: "0.8em",
          }}
        >
          <thead>
            <tr>
              <th
                scope="col"
                style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid var(--line, #333)", width: "60%" }}
              >
                Checklist item
              </th>
              <th
                scope="col"
                style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid var(--line, #333)" }}
              >
                How to check
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              [
                "Identify which publications or directories answer engines cite when answering queries in the client's category",
                "Run 5–10 representative queries in Perplexity and ChatGPT; note which domains appear as citations",
              ],
              [
                "Check whether the client brand is named on those cited sources",
                "Site-search or Google query: site:<cited-domain> \"<client brand>\"",
              ],
              [
                "Check whether any brand mention ties the name to the agency descriptor and the client's canonical URL",
                "Bare brand mentions without context may resolve to a competitor with a similar name",
              ],
              [
                "Count distinct third-party indexed pages that name the brand",
                "Google: \"<client brand>\" -site:<client domain>; note result count as a baseline",
              ],
              [
                "Flag any brand mentions that link to the wrong domain or a competitor",
                "Check each top-result anchor href manually; log corrections as gap items",
              ],
            ].map(([item, how]) => (
              <tr key={item} style={{ borderBottom: "1px solid var(--line, #222)" }}>
                <td style={{ padding: "8px 12px", verticalAlign: "top" }}>{item}</td>
                <td style={{ padding: "8px 12px", verticalAlign: "top", color: "var(--muted, #aaa)" }}>{how}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Lever 2 */}
        <h3 style={{ marginTop: "1.6em" }}>Lever 2 — Bing/web rank and indexing</h3>
        <p style={{ marginTop: "0.5em", lineHeight: 1.7 }}>
          Most large-language model assistants ground their retrieval on Bing-indexed content.
          Google indexing alone is not sufficient.
        </p>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.93em",
            lineHeight: 1.6,
            marginTop: "0.8em",
          }}
        >
          <thead>
            <tr>
              <th
                scope="col"
                style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid var(--line, #333)", width: "60%" }}
              >
                Checklist item
              </th>
              <th
                scope="col"
                style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid var(--line, #333)" }}
              >
                How to check
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              [
                "Bing Webmaster Tools account verified and sitemap submitted",
                "Log into BWT; confirm ownership verified and sitemap URL shows no errors",
              ],
              [
                "Key pages indexed in Bing",
                "BWT URL inspection for homepage, top service pages, and the 5 pages most relevant to target queries",
              ],
              [
                "No crawl errors on key pages",
                "BWT > Crawl > Crawl errors; log any 4xx or redirect chains",
              ],
              [
                "IndexNow configured or manual submission in place",
                "Check whether an IndexNow key file exists at the root; if not, log as a gap and note the setup cost is low",
              ],
              [
                "Bing rank for primary queries (directional baseline)",
                "Search each target query in Bing; note approximate position; this is a snapshot, not a tracked metric",
              ],
            ].map(([item, how]) => (
              <tr key={item} style={{ borderBottom: "1px solid var(--line, #222)" }}>
                <td style={{ padding: "8px 12px", verticalAlign: "top" }}>{item}</td>
                <td style={{ padding: "8px 12px", verticalAlign: "top", color: "var(--muted, #aaa)" }}>{how}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Lever 3 */}
        <h3 style={{ marginTop: "1.6em" }}>Lever 3 — Content shape</h3>
        <p style={{ marginTop: "0.5em", lineHeight: 1.7 }}>
          Answer engines extract passages. Check whether the page content is structured so
          an engine can identify and pull a direct answer without guessing.
        </p>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.93em",
            lineHeight: 1.6,
            marginTop: "0.8em",
          }}
        >
          <thead>
            <tr>
              <th
                scope="col"
                style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid var(--line, #333)", width: "60%" }}
              >
                Checklist item
              </th>
              <th
                scope="col"
                style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid var(--line, #333)" }}
              >
                How to check
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              [
                "Content is server-rendered HTML — the core answer is in the HTTP response body, not injected by JavaScript",
                "curl -A \"Googlebot\" <url> | grep -i <key phrase>; if the phrase is absent from the curl output, flag as JS-rendering gap",
              ],
              [
                "Direct answer to the target question appears in the first 100 words",
                "Read the page; note how many words precede the answer sentence; flag if >100",
              ],
              [
                "Heading hierarchy is logical: h1 → h2 → h3, no skipped levels",
                "Run axe-core or inspect heading order in DevTools; skipped levels are a blocker",
              ],
              [
                "Named entities (brand, product, location, person) are called out explicitly in prose, not only in markup",
                "Search the HTML body for entity names; markup-only entities are not reliably extracted",
              ],
              [
                "Key facts are in extractable plain text — not image text, CSS-generated content, or hidden elements",
                "View source; check that the claimed answer text is in the DOM as plain text",
              ],
              [
                "Tables and lists are in plain HTML — not JS-rendered or image-based",
                "Check table markup: <table>, <th>, <td>; if tables are missing from curl output, flag",
              ],
            ].map(([item, how]) => (
              <tr key={item} style={{ borderBottom: "1px solid var(--line, #222)" }}>
                <td style={{ padding: "8px 12px", verticalAlign: "top" }}>{item}</td>
                <td style={{ padding: "8px 12px", verticalAlign: "top", color: "var(--muted, #aaa)" }}>{how}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Hygiene group */}
        <h3 style={{ marginTop: "1.6em" }}>Hygiene pass — schema, canonicals, robots, llms.txt</h3>
        <p style={{ marginTop: "0.5em", lineHeight: 1.7 }}>
          This group is parse hygiene and structural signaling — not citation levers. A page
          that passes every item below but fails the three lever groups above will not be cited.
          Run this pass last.
        </p>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.93em",
            lineHeight: 1.6,
            marginTop: "0.8em",
          }}
        >
          <thead>
            <tr>
              <th
                scope="col"
                style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid var(--line, #333)", width: "60%" }}
              >
                Checklist item
              </th>
              <th
                scope="col"
                style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid var(--line, #333)" }}
              >
                How to check
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              [
                "JSON-LD schema type matches page content — service/professional-service pages use Service or ProfessionalService, not Product",
                "View source; check @type values; flag any mismatch (e.g. Product on a government service page is incorrect)",
              ],
              [
                "Schema validates without errors",
                "Google Rich Results Test or schema.org validator; errors are blockers, warnings are informational",
              ],
              [
                "Canonical tag is self-referential (or correct) on key pages",
                "View source; check <link rel=\"canonical\"> href; flag any canonical pointing to a different URL than the page",
              ],
              [
                "robots.txt does not block key pages or the sitemap",
                "Fetch /robots.txt; confirm Disallow rules do not cover target pages",
              ],
              [
                "XML sitemap is present, submitted, and includes key pages",
                "Fetch /sitemap.xml; confirm target pages are listed; cross-check with BWT submission status",
              ],
              [
                "llms.txt is present and current",
                "Fetch /llms.txt; confirm it lists current key pages with descriptions. Note: llms.txt is a hygiene label, not a ranking or citation signal — absence does not suppress citations",
              ],
            ].map(([item, how]) => (
              <tr key={item} style={{ borderBottom: "1px solid var(--line, #222)" }}>
                <td style={{ padding: "8px 12px", verticalAlign: "top" }}>{item}</td>
                <td style={{ padding: "8px 12px", verticalAlign: "top", color: "var(--muted, #aaa)" }}>{how}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ---- Scoring ---- */}
        <h2 style={{ marginTop: "2.4em" }}>How to score and prioritize findings</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Score each finding on two axes: <strong>impact</strong> (how much this gap is likely
          suppressing citation probability) and <strong>effort</strong> (time and skill to fix).
          Prioritize high-impact, low-effort fixes first. Three rules keep the output honest:
        </p>
        <ol style={{ marginTop: "0.8em", lineHeight: 1.8, paddingLeft: "1.4em" }}>
          <li>
            <strong>Lever gaps outrank hygiene gaps.</strong> A missing IndexNow integration
            (Lever 2) ranks above a schema validation warning (hygiene) regardless of effort.
          </li>
          <li>
            <strong>Blocked or unreadable pages are blind spots, not zeros.</strong> If a page
            returns a 403, blocks crawlers, or renders critical content only in JavaScript, log it
            as a blind spot with the specific access failure. Never assign a score you cannot
            support with a successful read.
          </li>
          <li>
            <strong>Qualitative observations are labelled as such.</strong> If you note a gap
            based on a point-in-time search-result check rather than measured data, say so
            explicitly in the findings.
          </li>
        </ol>

        {/* Impact vs effort table */}
        <div
          style={{ overflowX: "auto", marginTop: "1.2em" }}
          tabIndex={0}
          role="region"
          aria-label="Finding priority: impact versus effort"
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.93em",
              lineHeight: 1.6,
            }}
          >
            <thead>
              <tr>
                <th
                  scope="col"
                  style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid var(--line, #333)" }}
                >
                  Finding type
                </th>
                <th
                  scope="col"
                  style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid var(--line, #333)" }}
                >
                  Impact
                </th>
                <th
                  scope="col"
                  style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid var(--line, #333)" }}
                >
                  Typical effort
                </th>
                <th
                  scope="col"
                  style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid var(--line, #333)" }}
                >
                  Priority
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                ["JS-only rendering on key pages", "High — page is invisible to most crawlers", "Medium–high (requires dev)", "1 — fix first"],
                ["No Bing WMT verification or sitemap", "High — Bing cannot index reliably", "Low (30 min setup)", "1 — fix first"],
                ["Brand absent from cited sources", "High — no retrieval surface", "Medium–high (off-page work)", "1 — address in parallel"],
                ["Answer buried past 100 words", "Medium", "Low (copy edit)", "2 — second pass"],
                ["Missing heading hierarchy", "Medium", "Low (markup)", "2 — second pass"],
                ["Schema type mismatch", "Low–medium (parse confusion)", "Low", "3 — hygiene pass"],
                ["Missing llms.txt", "Low (no evidence of citation impact)", "Low", "3 — hygiene pass, optional"],
              ].map(([finding, impact, effort, priority]) => (
                <tr key={finding} style={{ borderBottom: "1px solid var(--line, #222)" }}>
                  <td style={{ padding: "8px 12px", verticalAlign: "top" }}>{finding}</td>
                  <td style={{ padding: "8px 12px", verticalAlign: "top" }}>{impact}</td>
                  <td style={{ padding: "8px 12px", verticalAlign: "top" }}>{effort}</td>
                  <td style={{ padding: "8px 12px", verticalAlign: "top", fontWeight: 600 }}>{priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ---- Common mistakes ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Common mistakes when auditing for AEO</h2>

        <h3 style={{ marginTop: "1.4em" }}>Auditing schema first</h3>
        <p style={{ marginTop: "0.5em", lineHeight: 1.7 }}>
          Schema is the fastest item to check and the lowest-leverage item to fix. Auditors who
          open the Rich Results Test before checking Bing indexing or brand-mention surface are
          optimizing the label on a box that hasn&apos;t been delivered yet. Run the lever checks
          first.
        </p>

        <h3 style={{ marginTop: "1.4em" }}>Promising citation counts</h3>
        <p style={{ marginTop: "0.5em", lineHeight: 1.7 }}>
          No structural fix guarantees a specific citation count. Citation depends on crawl timing,
          model update cycles, retrieval snapshot freshness, and signals outside the site
          owner&apos;s control. Report findings as gaps that suppress citation probability, not as
          items that will produce a citation count when fixed.
        </p>

        <h3 style={{ marginTop: "1.4em" }}>Treating one engine as all engines</h3>
        <p style={{ marginTop: "0.5em", lineHeight: 1.7 }}>
          Google AI Overviews, Perplexity, ChatGPT, and Bing Copilot each have different retrieval
          pipelines. A page that appears in Google AI Overviews may not appear in Perplexity, and
          vice versa. An honest audit notes which engine a finding applies to and avoids
          generalizing across all platforms from a single check.
        </p>

        <h3 style={{ marginTop: "1.4em" }}>Scoring a blocked page as zero</h3>
        <p style={{ marginTop: "0.5em", lineHeight: 1.7 }}>
          A page behind a login wall, a WAF block, or JS-only rendering is a page you
          could not read. Log the access failure as the finding. Assigning a low score based on
          metadata alone misrepresents the confidence level of the result.
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
          This page makes no claims that require an external quantitative source. The checklist
          items and prioritization framework are based on Prompt Goblin&apos;s own audit practice
          and qualitative observations of how answer engines retrieve content. All observations
          are point-in-time and labelled as such. No fabricated statistics are used.
        </p>

        {/* ---- What this does not guarantee ---- */}
        <h2 style={{ marginTop: "2.4em" }}>What this does not guarantee</h2>
        <ul style={{ marginTop: "0.8em", lineHeight: 1.9, paddingLeft: "1.4em" }}>
          <li>
            <strong>Schema and markup are hygiene, not citation levers.</strong> Implementing
            JSON-LD, FAQPage markup, or <code>llms.txt</code> does not cause answer engines to
            cite a page. These are structural signals that help parsers label content; they do not
            raise citation probability on their own.
          </li>
          <li>
            <strong>No specific citation count, rank position, or AI-response outcome is
            promised</strong> by any action described on this page. Fixing gaps described here
            addresses structural inputs. Effects depend on crawl timing, model update cycles, and
            signals outside the site owner&apos;s control.
          </li>
          <li>
            <strong>The refund covers the work, never a citation number.</strong> We measure
            the gap, deliver the fixes, and track the delta. We do not guarantee a citation
            appears or persists in any answer engine.
          </li>
          <li>
            <strong>We measure delta, not ETA.</strong> There is no guaranteed timeline from
            structural fix to observable citation change in any answer engine.
          </li>
        </ul>

        {/* ---- CTA ---- */}
        <p style={{ marginTop: "2em", lineHeight: 1.7 }}>
          Run the Prompt Goblin scan on a client site and get a structured report of technical
          and hygiene gaps — crawlability, Bing indexing, content shape, and schema issues:{" "}
          <Link href="/#scan" style={{ fontWeight: 600 }}>
            start a free AEO scan
          </Link>
          .
        </p>

        {/* ---- Go deeper ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Go deeper</h2>
        <ul style={{ marginTop: "0.6em", lineHeight: 2, paddingLeft: "1.4em" }}>
          <li>
            <a href="/learn/how-to-show-up-in-chatgpt">
              How to show up in ChatGPT — the three citation levers explained
            </a>
          </li>
          <li>
            <a href="/learn/bing-rank-and-ai-citations">
              Bing rank and AI citations — why Bing indexing is the under-managed lever
            </a>
          </li>
          <li>
            <a href="/learn/technical-seo-for-ai-search">
              Technical SEO for AI search — crawlability, canonicals, and Core Web Vitals
            </a>
          </li>
          <li>
            <a href="/docs/bing-webmaster-tools">
              Bing Webmaster Tools setup guide
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
