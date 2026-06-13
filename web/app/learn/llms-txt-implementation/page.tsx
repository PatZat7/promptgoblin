import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { JsonLd } from "@/components/system/JsonLd";
import { llmsTxtImplementationJsonLd } from "@/lib/structured-data";
import { FAQ_ITEMS, SOURCES } from "./llms-txt-implementation.data";

export const metadata: Metadata = {
  title: "llms.txt Implementation Guide — What It Is and How to Write One · Prompt Goblin",
  description:
    "llms.txt is a plain-text site summary some AI agents read in-session. Here is what it is, how to write one, and how it differs from robots.txt.",
  alternates: { canonical: "/learn/llms-txt-implementation" },
  openGraph: {
    type: "article",
    url: `${SITE.url}/learn/llms-txt-implementation`,
    title: "llms.txt Implementation Guide — What It Is and How to Write One",
    description:
      "What llms.txt is, the llmstxt.org spec, the template, the comparison with robots.txt, and how to keep it current.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return (
    <>
      {llmsTxtImplementationJsonLd().map((d, i) => (
        <JsonLd key={i} data={d} />
      ))}
      <article style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 80px" }}>
        <h1>llms.txt implementation guide</h1>

        <p style={{ marginTop: "1.2em", lineHeight: 1.7 }}>
          llms.txt is a voluntary plain-text file proposed at{" "}
          <a href="https://llmstxt.org" rel="noopener noreferrer">llmstxt.org</a>{" "}
          as a human-readable summary of your site. Some AI agents read it in-session when given
          a URL as context; some do not. It is nearly free to create and easy to keep current.
        </p>

        {/* ---- What it is ---- */}
        <h2 style={{ marginTop: "2.4em" }}>What llms.txt is</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          The <a href="https://llmstxt.org" rel="noopener noreferrer">llmstxt.org proposal</a>{" "}
          describes a plain Markdown file placed at{" "}
          <code>/llms.txt</code> on your domain. Its purpose is to give LLM
          tools — and human readers — a curated one-page summary of what your site is, what it
          covers, and which pages matter most. Some tools that accept a URL as context will fetch
          and read it. Most will not, and none are required to.
        </p>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          The value is narrow but real: it documents your canonical self-description in a
          machine-legible and human-legible format, it takes minutes to write, and a
          well-maintained file costs nothing to keep current. Prompt Goblin&apos;s own live file
          is at{" "}
          <a href="https://promptgoblin.io/llms.txt" rel="noopener noreferrer">
            promptgoblin.io/llms.txt
          </a>{" "}
          and serves as a worked example of the format described below.
        </p>

        <h3 style={{ marginTop: "1.4em" }}>What llms.txt is not</h3>
        <ul style={{ marginTop: "0.6em", lineHeight: 1.8, paddingLeft: "1.4em" }}>
          <li>Not a crawl directive — it does not tell any crawler what to index or skip.</li>
          <li>Not an index submission — it does not register pages with any search engine.</li>
          <li>
            Not enforced by anyone — no tool, crawler, or engine is required to read or obey it.
          </li>
          <li>
            Not robots.txt — they share a naming pattern but serve entirely different purposes
            (see the comparison table below).
          </li>
        </ul>

        {/* ---- llms.txt vs robots.txt ---- */}
        <h2 style={{ marginTop: "2.4em" }}>llms.txt vs robots.txt</h2>
        <table
          style={{ marginTop: "0.8em", width: "100%", borderCollapse: "collapse", lineHeight: 1.6 }}
        >
          <thead>
            <tr>
              <th
                scope="col"
                style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid currentColor" }}
              >
                Property
              </th>
              <th
                scope="col"
                style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid currentColor" }}
              >
                llms.txt
              </th>
              <th
                scope="col"
                style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid currentColor" }}
              >
                robots.txt
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>
                Purpose
              </td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>
                Human-readable site summary for LLM sessions and curious readers
              </td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>
                Crawl access directives for web crawlers
              </td>
            </tr>
            <tr>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>
                Format
              </td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>
                Plain Markdown (h1, blockquote, section headings, link lines)
              </td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>
                Custom directive syntax (User-agent, Disallow, Allow, Sitemap)
              </td>
            </tr>
            <tr>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>
                Enforcement
              </td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>
                None — voluntary, no tool required to read it
              </td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>
                Respected by compliant crawlers (Googlebot, Bingbot, etc.)
              </td>
            </tr>
            <tr>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>
                Who reads it
              </td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>
                LLM tools that accept a URL as context; human developers
              </td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>
                Web crawlers from all major search engines
              </td>
            </tr>
            <tr>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>
                What happens without it
              </td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>
                Nothing — no penalty, no crawl change
              </td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>
                Crawlers assume full access (all paths allowed)
              </td>
            </tr>
            <tr>
              <td style={{ padding: "8px 12px", opacity: 0.8 }}>
                SEO/AEO impact
              </td>
              <td style={{ padding: "8px 12px", opacity: 0.8 }}>
                Not a crawl or ranking signal; read or not read by individual tools
              </td>
              <td style={{ padding: "8px 12px", opacity: 0.8 }}>
                Direct impact on what gets crawled and indexed
              </td>
            </tr>
          </tbody>
        </table>

        {/* ---- How to write one ---- */}
        <h2 style={{ marginTop: "2.4em" }}>How to write an llms.txt file</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          The{" "}
          <a href="https://llmstxt.org" rel="noopener noreferrer">llmstxt.org specification</a>{" "}
          defines a lightweight structure. The file uses standard Markdown: one{" "}
          <code>h1</code> for the site or brand name, a blockquote for the one-paragraph
          summary, and one or more <code>h2</code> sections each containing link-plus-description
          lines. That&apos;s the full structure — nothing proprietary.
        </p>

        <h3 style={{ marginTop: "1.4em" }}>The four elements</h3>
        <ol style={{ marginTop: "0.6em", lineHeight: 1.8, paddingLeft: "1.4em" }}>
          <li>
            <strong>h1 — site or brand name.</strong> One line. This is the name an LLM session
            would use to refer to your site.
          </li>
          <li>
            <strong>Blockquote — summary paragraph.</strong> Two to four sentences. Who you are,
            what you do, who you serve. Written for a reader who has never seen your site.
          </li>
          <li>
            <strong>h2 sections — topic or resource groups.</strong> Each section groups related
            pages. Common sections: &ldquo;Services&rdquo;, &ldquo;Learn&rdquo;,
            &ldquo;Methodology&rdquo;, &ldquo;Pricing&rdquo;. Use whatever matches your actual
            site structure.
          </li>
          <li>
            <strong>Link lines — URL plus description.</strong> Each line in a section is a
            Markdown link followed by a colon and one sentence describing what that page covers.
            Be accurate — this is what a tool will use to decide whether to fetch the page.
          </li>
        </ol>

        <h3 style={{ marginTop: "1.4em" }}>Worked template</h3>
        <pre
          aria-label="llms.txt worked template"
          tabIndex={0}
          style={{
            marginTop: "0.8em",
            padding: "16px 20px",
            overflowX: "auto",
            lineHeight: 1.6,
            fontSize: "0.9em",
            borderLeft: "3px solid currentColor",
          }}
        >
          <code>{`# Your Brand Name
> One-paragraph summary of what your site is, what it covers, and who
> it is for. Write this for a reader — human or LLM — who has never
> seen your site. Two to four sentences is enough.

## Services
- [Service overview](https://yourdomain.com/services): What you offer, who it is for, and the delivery model.
- [Pricing](https://yourdomain.com/pricing): Current tier names and prices.

## Learn
- [How to show up in ChatGPT](https://yourdomain.com/learn/how-to-show-up-in-chatgpt): The three mechanical inputs that raise citation probability.
- [Why schema markup is not enough](https://yourdomain.com/learn/why-schema-not-enough): Post-implementation diagnostic for the schema-done-still-uncited gap.

## Methodology
- [How the scan works](https://yourdomain.com/methodology): What the audit measures, how findings are scored, and what the refund covers.`}</code>
        </pre>

        <p style={{ marginTop: "1em", lineHeight: 1.7 }}>
          Place the finished file at <code>/public/llms.txt</code> in your project (so it
          serves at <code>yourdomain.com/llms.txt</code>) and deploy. That is the entire
          implementation — no build step, no plugin, no configuration.
        </p>

        {/* ---- Keeping it current ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Keeping it current</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          A stale llms.txt that contradicts your actual site is worse than no file at all: any
          tool that does read it will receive an inaccurate summary and may pass that summary
          to users. Update the file whenever:
        </p>
        <ul style={{ marginTop: "0.6em", lineHeight: 1.8, paddingLeft: "1.4em" }}>
          <li>Pricing tiers or prices change.</li>
          <li>A service is added, renamed, or retired.</li>
          <li>A significantly new page ships that you want included in the summary.</li>
          <li>Your canonical self-description changes (new ICP, repositioned offering).</li>
        </ul>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          A monthly review takes under five minutes. Treat it the same way you treat updating
          your LinkedIn or directory profiles: a quick check whenever something meaningful
          changes.
        </p>

        {/* ---- Common mistakes ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Common mistakes</h2>

        <h3 style={{ marginTop: "1.4em" }}>Keyword-stuffing the summary</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          The blockquote summary is for human and LLM readers, not for search-engine keyword
          density. A summary that reads as a keyword list is less useful and no more likely to
          cause citations. Write a plain English description of what you actually do.
        </p>

        <h3 style={{ marginTop: "1.4em" }}>Treating it as a ranking or retrieval signal</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          llms.txt is a site-summary file, not a crawl or ranking signal. The real levers for
          AI citation probability are covered in{" "}
          <a href="/learn/how-to-show-up-in-chatgpt">
            How to show up in ChatGPT
          </a>
          .
        </p>

        <h3 style={{ marginTop: "1.4em" }}>Letting it contradict the actual site</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          Listing a retired service, a changed price, or a page that no longer exists creates
          an inaccurate record. If a tool passes that summary to a user, the user receives bad
          information. The honest-broker standard: the file must match what the site actually
          offers right now.
        </p>

        <h3 style={{ marginTop: "1.4em" }}>Writing it for crawlers instead of readers</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          Robots.txt is for crawlers. Sitemaps are for crawlers. llms.txt is explicitly for
          humans and LLM sessions. Structured in the way the specification describes — readable
          prose, clear descriptions, logical sections — it serves both audiences. Structured
          like a sitemap or a robots directive, it serves neither.
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
              <a href={s.url} rel="noopener noreferrer">
                {s.label}
              </a>
              {" — "}
              {s.note}
            </li>
          ))}
        </ul>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          All other claims on this page are qualitative observations about the llms.txt
          specification. No statistics are cited because none are asserted.
        </p>

        {/* ---- Guarantee ---- */}
        <h2 style={{ marginTop: "2.4em" }}>What this does not guarantee</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Nothing on this page promises a citation by any answer engine. Where Prompt Goblin
          engagement is mentioned: the refund covers the delivered work — audits, technical
          fixes, copy, measurement loop — never a citation number or ranking position.
        </p>

        {/* ---- Scan CTA ---- */}
        <p style={{ marginTop: "2.4em", lineHeight: 1.7 }}>
          Want to know which levers actually move citation probability for your site?{" "}
          <Link href="/#scan">Run a free scan</Link> and get a ranked list of the gaps
          that matter — not a hygiene checklist.
        </p>

        {/* ---- Go deeper ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Go deeper</h2>
        <ul style={{ marginTop: "0.6em", lineHeight: 2, paddingLeft: "1.4em" }}>
          <li>
            <a href="/learn/how-to-show-up-in-chatgpt">
              How to show up in ChatGPT — the three mechanical levers that actually move citations
            </a>
          </li>
          <li>
            <a href="/learn/why-schema-not-enough">
              Why schema markup is not enough — post-implementation diagnostic
            </a>
          </li>
          <li>
            <a href="/learn/technical-seo-for-ai-search">
              Technical SEO for AI search — robots.txt, canonicals, and crawl hygiene
            </a>
          </li>
          <li>
            <a href="/learn/aeo-audit-checklist">
              AEO audit checklist — full structural audit for AI-search readiness
            </a>
          </li>
          <li>
            <a href="/learn/entity-clarity-for-ai">
              Entity clarity for AI — how to make your brand unambiguous to answer engines
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
