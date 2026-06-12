import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { JsonLd } from "@/components/system/JsonLd";
import { aeoGeoJsonLd } from "@/lib/structured-data";
import { DEFINITIONS, PREDICTORS, SOURCES } from "./aeo-geo.data";

export const metadata: Metadata = {
  title: "AEO vs GEO · Prompt Goblin",
  description:
    "Answer Engine Optimization vs Generative Engine Optimization — the zero-click shift, how AI citations work, and what actually predicts being cited.",
  alternates: { canonical: "/learn/aeo-vs-geo" },
  openGraph: {
    type: "article",
    url: `${SITE.url}/learn/aeo-vs-geo`,
    title: "AEO vs GEO",
    description:
      "What gets cited, what doesn't, and the signals that predict AI citation outcomes.",
    images: ["/og-image.png"],
  },
};

const AeoVsGeoPage = () => (
  <>
    {aeoGeoJsonLd().map((d, i) => <JsonLd key={i} data={d} />)}
    <article style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 80px" }}>
      <h1>AEO vs GEO</h1>

      <p style={{ marginTop: "1.2em", lineHeight: 1.7 }}>
        The market conflates these terms. They describe related but distinct objectives,
        and the levers that move them are different. Getting clear on the difference tells
        you where to focus effort — and why most &ldquo;AI SEO&rdquo; advice misses the point.
      </p>

      {/* ---- Definitions ---- */}
      <h2 style={{ marginTop: "2.4em" }}>The definitions</h2>
      <dl style={{ marginTop: "0.8em" }}>
        {DEFINITIONS.map((d) => (
          <div key={d.term} style={{ marginBottom: "1.4em" }}>
            <dt style={{ fontWeight: 700, lineHeight: 1.4 }}>
              {d.term} — {d.title}
            </dt>
            <dd style={{ marginTop: "0.4em", lineHeight: 1.7, marginLeft: "1.2em" }}>
              {d.body}
            </dd>
          </div>
        ))}
        <div style={{ marginBottom: "1.4em" }}>
          <dt style={{ fontWeight: 700, lineHeight: 1.4 }}>Traditional SEO</dt>
          <dd style={{ marginTop: "0.4em", lineHeight: 1.7, marginLeft: "1.2em" }}>
            Optimising for blue-link ranking in Google organic results. Still necessary as a
            foundation — Bing rank (which feeds most AI assistants) follows similar signals.
            But Google rank alone does not determine AI citation.
          </dd>
        </div>
      </dl>

      {/* ---- The zero-click shift ---- */}
      <h2 style={{ marginTop: "2.4em" }}>The zero-click shift</h2>
      <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
        AI Overviews and assistant responses answer queries directly. Users get the answer
        without clicking through to a source page. This compresses organic CTR for queries
        where AI Overviews appear. Seer Interactive&apos;s study found organic CTR of roughly
        0.84% when AI Overviews appear versus 2.94% without them — a substantial compression.
        (Source: Seer Interactive AI Overviews CTR study, 2025.)
      </p>
      <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
        The implication is not that SEO stops mattering. It is that the value of a position
        shifts from the click to the citation: being named as a source inside the AI response
        is the new visibility event, regardless of whether the user clicks through.
      </p>

      {/* ---- What predicts citation ---- */}
      <h2 style={{ marginTop: "2.4em" }}>What predicts AI citation</h2>
      <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
        Research on AI citation behaviour consistently points to a small set of working
        signals. These are the predictors we build our work around:
      </p>
      <ul style={{ marginTop: "0.8em", lineHeight: 1.9, paddingLeft: "1.4em" }}>
        {PREDICTORS.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>
      <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
        Note what is absent from this list: schema markup. Structured data is parse hygiene —
        it helps crawlers label what a page is. It is a good technical practice and we add
        it to every client site. But schema alone does not cause citations. The levers above
        are the work.
      </p>

      {/* ---- The three levers in this context ---- */}
      <h2 style={{ marginTop: "2.4em" }}>The three citation levers</h2>
      <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
        Across the AEO and GEO tracks, citation probability is moved by three mechanical
        inputs:
      </p>
      <ol style={{ marginTop: "0.8em", lineHeight: 1.9, paddingLeft: "1.4em" }}>
        <li>
          <strong>Brand mentions on authoritative sources</strong> — third-party pages that
          reference your brand in the context of your target topics. Answer engines surface
          brands they have seen referenced elsewhere.
        </li>
        <li>
          <strong>Bing / web rank</strong> — most LLM assistants ground on Bing-indexed
          content. Higher rank in Bing expands the set of queries where your pages are
          retrieval candidates.{" "}
          <a href="/docs/bing-webmaster-tools">Bing Webmaster Tools setup guide.</a>
        </li>
        <li>
          <strong>Crawlable, extractable, answer-shaped content</strong> — pages that
          front-load the answer in plain server-rendered HTML, with named entities and
          logical heading hierarchy. JS-only pages are not in the index and will not be cited.
        </li>
      </ol>

      {/* ---- How to measure ---- */}
      <h2 style={{ marginTop: "2.4em" }}>How to measure AEO and GEO progress</h2>
      <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
        Traditional SEO is measured by rank and CTR. AEO and GEO require different
        measurement:
      </p>
      <ul style={{ marginTop: "0.8em", lineHeight: 1.9, paddingLeft: "1.4em" }}>
        <li>
          <strong>Citation frequency</strong> — how often your brand or domain is named in
          AI responses to your target queries, across platforms. Measured by sampling queries
          systematically over time.
        </li>
        <li>
          <strong>Retrieval candidacy</strong> — whether your pages appear in the retrieved
          source set for your target queries (visible in Perplexity source attribution, Bing
          AI footnotes, and similar surfaces).
        </li>
        <li>
          <strong>Source quality delta</strong> — whether the sources AI engines use for
          your category are resolvable, accurate, and — where possible — yours.
        </li>
      </ul>
      <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
        The Prompt Goblin pipeline samples target queries across ChatGPT, Claude, Gemini,
        and Perplexity, tracks your Bing rank (the grounding Copilot and Google AI Overviews
        lean on), maps the citation graph, and diffs it against your domain. The delta is the
        gap the work addresses. We measure before and after; we do not promise a citation number.
      </p>

      {/* ---- Sources ---- */}
      <h2 style={{ marginTop: "2.4em" }}>Sources cited on this page</h2>
      <ul style={{ marginTop: "0.8em", lineHeight: 1.9, paddingLeft: "1.4em" }}>
        {SOURCES.map((s) => (
          <li key={s.id}>
            {s.claim}{" "}
            <a
              href={s.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              [{s.source}, {s.asOf}]
            </a>
          </li>
        ))}
      </ul>

      {/* ---- Internal links ---- */}
      <h2 style={{ marginTop: "2.4em" }}>Go deeper</h2>
      <ul style={{ marginTop: "0.6em", lineHeight: 2, paddingLeft: "1.4em" }}>
        <li><a href="/learn/how-to-show-up-in-chatgpt">How to show up in ChatGPT — the three levers</a></li>
        <li><a href="/learn/bing-rank-and-ai-citations">Bing rank and AI citations</a></li>
        <li><a href="/learn/ai-citation-hallucinations">AI citation fabrications</a></li>
        <li><a href="/methodology">How the Prompt Goblin scan works — methodology</a></li>
        <li><a href="/benchmark">Benchmark — compare citation coverage across platforms</a></li>
        <li><a href="/faq">FAQ</a></li>
      </ul>

      <p style={{ marginTop: "1.6em" }}>
        <Link href="/#scan">Get a citation gap scan</Link>
      </p>

      {/* ---- What this does not guarantee ---- */}
      <h2 style={{ marginTop: "2.4em" }}>What this does not guarantee</h2>
      <ul style={{ marginTop: "0.8em", lineHeight: 1.9, paddingLeft: "1.4em" }}>
        <li>Schema and markup are hygiene — not citation levers. Adding structured data to a page does not cause AI engines to cite it.</li>
        <li>No specific citation count, rank position, or AI response outcome is promised by anything on this page.</li>
        <li>The refund covers the delivered work, never a citation number.</li>
      </ul>
    </article>
  </>
);

export default AeoVsGeoPage;
