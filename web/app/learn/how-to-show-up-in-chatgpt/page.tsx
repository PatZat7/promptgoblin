import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { JsonLd } from "@/components/system/JsonLd";
import { howToShowUpInChatGptJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "How to show up in ChatGPT · Prompt Goblin",
  description:
    "The three levers that determine whether an answer engine cites your site: brand mentions on authoritative sources, Bing rank, and crawlable extractable content.",
  alternates: { canonical: "/learn/how-to-show-up-in-chatgpt" },
  openGraph: {
    type: "article",
    url: `${SITE.url}/learn/how-to-show-up-in-chatgpt`,
    title: "How to show up in ChatGPT",
    description:
      "What actually gets cited in AI assistants — and the three mechanical levers that move citation probability.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return (
    <>
      {howToShowUpInChatGptJsonLd().map((d, i) => <JsonLd key={i} data={d} />)}
      <article style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 80px" }}>
        <h1>How to show up in ChatGPT</h1>

        <p style={{ marginTop: "1.2em", lineHeight: 1.7 }}>
          There are three mechanical inputs that raise the probability an answer engine cites
          your site: <strong>brand mentions on authoritative sources</strong>,{" "}
          <strong>Bing/web rank</strong>, and{" "}
          <strong>crawlable, extractable, answer-shaped content</strong>. Schema markup and
          &ldquo;LLM-friendly&rdquo; meta tags are hygiene — they help parsers label what a
          page is, but they do not cause citations. Understanding the difference saves months
          of effort pointing at the wrong lever.
        </p>

        {/* ---- Lever 1 ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Lever 1 — Brand mentions on authoritative sources</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Answer engines don&apos;t invent brands from a single website. They surface brands
          they have seen referenced on third-party pages — press, industry directories, niche
          forums, vertical publications. The more credible external pages associate your brand
          name with a topic, the more surface area a model has to retrieve you when that topic
          comes up in a prompt.
        </p>
        <h3 style={{ marginTop: "1.4em" }}>What counts as an authoritative mention?</h3>
        <ul style={{ marginTop: "0.6em", lineHeight: 1.8, paddingLeft: "1.4em" }}>
          <li>Indexed pages that themselves rank for relevant queries</li>
          <li>Niche directories and tool roundups that LLMs already cite for your category</li>
          <li>Forum threads (Reddit, Hacker News, niche communities) where your brand or product is named</li>
          <li>Press coverage on publications with independent topical authority</li>
        </ul>
        <h3 style={{ marginTop: "1.4em" }}>What to do</h3>
        <ol style={{ marginTop: "0.6em", lineHeight: 1.8, paddingLeft: "1.4em" }}>
          <li>Identify which publications AI assistants already cite when answering queries in your space.</li>
          <li>Check whether your brand appears in those sources. If not, that is the gap.</li>
          <li>Draft outreach copy, directory submissions, and community contributions — in your own voice.</li>
          <li>Measure brand-name retrieval before and after over a 30–90 day window.</li>
        </ol>

        {/* ---- Lever 2 ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Lever 2 — Bing / web rank</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Most large-language model assistants ground their retrieval on Bing-indexed content.
          If your pages are not in Bing&apos;s index, citation probability drops sharply
          regardless of Google rank. Google indexing is necessary but not sufficient. Bing is
          the under-managed lever for most teams, and it connects directly to ChatGPT, Bing
          Chat, and Copilot citations.
        </p>
        <h3 style={{ marginTop: "1.4em" }}>Getting indexed and staying there</h3>
        <ol style={{ marginTop: "0.6em", lineHeight: 1.8, paddingLeft: "1.4em" }}>
          <li>Create and verify a Bing Webmaster Tools account.</li>
          <li>Submit your XML sitemap — once to seed, then keep it accurate after each publish.</li>
          <li>Add IndexNow to your deployment pipeline so every URL change is signaled immediately.</li>
          <li>Check crawl errors and coverage quarterly in Bing Webmaster Tools.</li>
        </ol>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Rank in Bing follows the same signals as Google: topical authority, entity density,
          fresh crawl signals, clean technical hygiene. Soft 404s, broken canonicals, and
          thin duplicate pages suppress both.
        </p>

        {/* ---- Lever 3 ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Lever 3 — Crawlable, extractable, answer-shaped content</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Answer engines extract passages. A page that front-loads a direct answer in plain
          text — with named entities, headings in order, and no critical content hidden behind
          JavaScript — is dramatically easier to cite than a page that buries its answer three
          scrolls down or renders it in a JS framework that a crawler never executes.
        </p>
        <h3 style={{ marginTop: "1.4em" }}>The content checklist</h3>
        <ul style={{ marginTop: "0.6em", lineHeight: 1.8, paddingLeft: "1.4em" }}>
          <li>Direct answer to the target question in the first 100 words</li>
          <li>Named entities (people, products, organizations, locations) called out explicitly</li>
          <li>H1 → H2 → H3 heading hierarchy in logical order, no skipped levels</li>
          <li>Key facts in extractable plain text — not image text, not CSS-generated content</li>
          <li>Server-rendered HTML: the core answer must be in the response body, not injected by JavaScript</li>
          <li>JSON-LD that matches the prose (hygiene — does not cause citations on its own)</li>
        </ul>
        <h3 style={{ marginTop: "1.4em" }}>What blocks citation regardless of content quality</h3>
        <ul style={{ marginTop: "0.6em", lineHeight: 1.8, paddingLeft: "1.4em" }}>
          <li>JS-only rendering: if a crawler cannot read the HTML response, the page does not exist in the index</li>
          <li>Blocked in <code>robots.txt</code> or <code>noindex</code></li>
          <li>Missing from sitemap and undiscovered by links</li>
          <li>Soft-404 responses (200 status with &ldquo;page not found&rdquo; body)</li>
        </ul>

        {/* ---- Schema clarification ---- */}
        <h2 style={{ marginTop: "2.4em" }}>What schema does (and doesn&apos;t do)</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Schema markup (JSON-LD, schema.org types) is <strong>parse hygiene</strong>. It
          helps crawlers label what a page contains — Organization, Service, FAQPage, Article —
          so the meaning is unambiguous. It is a good practice and we add it to every client
          site. But adding schema to a page that ranks poorly, has no third-party mentions, and
          renders in JavaScript will not get that page cited. The three levers above are the
          work. Schema is the label on the box.
        </p>

        {/* ---- FAQ ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Frequently asked questions</h2>

        <h3 style={{ marginTop: "1.2em" }}>Does adding llms.txt help?</h3>
        <p style={{ marginTop: "0.5em", lineHeight: 1.7 }}>
          No — <code>llms.txt</code> is not a ranking or retrieval signal. It was proposed as
          a human-readable site guide for LLM sessions, but Google has explicitly stated it is
          not a factor, and no current evidence shows it influences citation. We do not score
          sites down for missing it.
        </p>

        <h3 style={{ marginTop: "1.2em" }}>How long does it take to show up in ChatGPT?</h3>
        <p style={{ marginTop: "0.5em", lineHeight: 1.7 }}>
          There is no guaranteed timeline. Citation changes depend on when model weights are
          updated (for ChatGPT) or when retrieval snapshots refresh (for Perplexity, Bing AI).
          Measurable Bing rank changes typically appear within weeks of indexing; citation
          changes in weight-based models may take months. We measure delta, not ETA.
        </p>

        <h3 style={{ marginTop: "1.2em" }}>Does Prompt Goblin guarantee citations?</h3>
        <p style={{ marginTop: "0.5em", lineHeight: 1.7 }}>
          No — and you should be suspicious of any service that does. We guarantee the work:
          the audits, the copy, the technical fixes, the measurement loop. The refund
          guarantees the delivered work, never a citation count.
        </p>

        {/* ---- Internal links ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Go deeper</h2>
        <ul style={{ marginTop: "0.6em", lineHeight: 2, paddingLeft: "1.4em" }}>
          <li><a href="/learn/bing-rank-and-ai-citations">Bing rank and AI citations — the direct connection</a></li>
          <li><a href="/learn/technical-seo-for-ai-search">Technical SEO for AI search</a></li>
          <li><a href="/methodology">How the Prompt Goblin scan works — methodology</a></li>
          <li><a href="/benchmark">Benchmark: compare citation coverage across platforms</a></li>
          <li><a href="/faq">FAQ</a></li>
        </ul>
      </article>
    </>
  );
}
