import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { JsonLd } from "@/components/system/JsonLd";
import { entityClarityJsonLd } from "@/lib/structured-data";
import { FAQ_ITEMS, SOURCES } from "./entity-clarity-for-ai.data";

export const metadata: Metadata = {
  title: "Entity Clarity for AI Search — Getting Your Brand Recognised as a Thing · Prompt Goblin",
  description:
    "An engine that cannot resolve your brand string to a distinct entity cannot retrieve you reliably — and may retrieve a collision instead. The SMB disambiguation toolkit: consistent naming, sameAs profiles, Wikidata when warranted, and co-occurrence in crawlable text.",
  alternates: { canonical: "/learn/entity-clarity-for-ai" },
  openGraph: {
    type: "article",
    url: `${SITE.url}/learn/entity-clarity-for-ai`,
    title: "Entity Clarity for AI Search — Getting Your Brand Recognised as a Thing",
    description:
      "How small businesses with ambiguous or unknown brand names can build the entity signals engines use for disambiguation — without big-brand shortcuts.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return (
    <>
      {entityClarityJsonLd().map((d, i) => (
        <JsonLd key={i} data={d} />
      ))}
      <article style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 80px" }}>
        <h1>Entity clarity for AI search &mdash; getting your brand recognised as a thing</h1>

        <p style={{ marginTop: "1.2em", lineHeight: 1.7 }}>
          Answer engines maintain a graph of named entities &mdash; brands, people, places, products &mdash; and use
          it to disambiguate retrieval. If your brand string does not resolve to a distinct, consistent node
          in that graph, engines either skip you or, worse, surface a collision. The work is not schema or
          keyword density: it is making your brand name, descriptor, and domain appear together
          consistently enough across crawlable sources that disambiguation becomes reliable.
        </p>

        {/* ---- What entity resolution is ---- */}
        <h2 style={{ marginTop: "2.4em" }}>What entity resolution is</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          When a search engine or AI assistant encounters a brand name in a query, it does not
          match a string &mdash; it looks up a node. That node is an entity: a distinct,
          identified &ldquo;thing&rdquo; with properties (type, description, related entities)
          and pointers to canonical sources (a website, a Wikidata record, social profiles).
        </p>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Resolution is the process of mapping a string &mdash; &ldquo;Prompt Goblin&rdquo; &mdash;
          to the correct node. If two entities share a name, or if the entity has too few
          corroborating signals, resolution fails or returns the wrong match. The engine
          either omits you from the response or attributes a mention to a different entity
          that happens to share your name.
        </p>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          This is the disambiguation problem. For household brands, the graph is rich enough
          that resolution almost never fails. For small businesses and new agencies, the node
          may be thin, absent, or contested by a collision.
        </p>

        {/* ---- The collision problem ---- */}
        <h2 style={{ marginTop: "2.4em" }}>The collision problem — our own working example</h2>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Prompt Goblin has a live brand collision: <strong>promptgoblin.com</strong> is an unrelated
          prompt-generator tool, and the string &ldquo;Prompt Goblin&rdquo; can resolve to that
          site rather than to this agency at <strong>promptgoblin.io</strong>. An off-site mention
          that names us only as &ldquo;Prompt Goblin&rdquo; &mdash; without a descriptor or domain
          &mdash; may strengthen the wrong entity&apos;s signal.
        </p>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          Our working practice &mdash; still in progress, not a solved case study &mdash; is to pair
          the name with a descriptor and the domain everywhere it appears in crawlable text:
          &ldquo;Prompt Goblin (promptgoblin.io) &mdash; AEO and technical-SEO agency.&rdquo; That
          triplet gives engines the co-occurrence signal needed to separate two entities
          that share a name. We treat this as a coverage exercise, not a one-time fix.
        </p>

        {/* ---- The disambiguation toolkit ---- */}
        <h2 style={{ marginTop: "2.4em" }}>The SMB disambiguation toolkit</h2>

        <h3 style={{ marginTop: "1.4em" }}>1 &mdash; Consistent name + descriptor + domain pairing</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          The highest-signal action is also the simplest: every mention of your brand in
          crawlable text &mdash; your site, directory listings, press releases, community
          posts &mdash; should include your name, a short descriptor of what you do, and your
          domain. The pattern does not need to be identical every time, but the three elements
          should co-occur consistently.
        </p>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          This is not about keyword stuffing. It is about giving the entity graph enough
          co-occurrence data to collapse ambiguity: &ldquo;Brand Name&rdquo; +
          &ldquo;what you do&rdquo; + &ldquo;domain.tld&rdquo; appearing together
          on multiple independent crawled pages is the disambiguation signal.
        </p>

        <h3 style={{ marginTop: "1.4em" }}>2 &mdash; Organization JSON-LD with sameAs (hygiene framing)</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          Organization schema on your homepage is a hygiene label. It tells a parser that
          your page represents an organisation and provides machine-readable properties:
          name, URL, description. The <code>sameAs</code> property links your entity to
          its canonical external identifiers &mdash; your LinkedIn company page, your GitHub
          organisation, your Crunchbase or G2 profile, your Wikidata item if one exists.
        </p>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          A minimal example (sameAs links must point to live, accurate profiles):
        </p>
        <pre
          aria-label="Organization sameAs JSON-LD example"
          tabIndex={0}
          style={{ marginTop: "0.6em", background: "transparent", border: "1px solid currentColor", borderRadius: 4, padding: "12px 16px", overflowX: "auto", lineHeight: 1.6, fontSize: "0.9em" }}
        ><code>{`{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Your Agency Name",
  "url": "https://yourdomain.io",
  "description": "One sentence — what you do.",
  "sameAs": [
    "https://www.linkedin.com/company/your-agency",
    "https://github.com/your-agency",
    "https://g2.com/products/your-agency"
  ]
}`}</code></pre>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          <strong>Critical:</strong> sameAs to a dead URL, a blank profile, or the wrong
          entity is worse than no sameAs at all. Audit every link before shipping.
        </p>

        <h3 style={{ marginTop: "1.4em" }}>3 &mdash; Consistent third-party profiles</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          Directories, social profiles, and listing pages that engines already crawl and
          cite are the corroboration layer. Your name, descriptor, and domain should
          match exactly across them &mdash; not &ldquo;Acme SEO&rdquo; on LinkedIn,
          &ldquo;Acme Search&rdquo; on G2, and &ldquo;Acme Digital&rdquo; on Clutch.
          Inconsistent naming across profiles fragments the entity signal; the engine
          cannot confidently merge them into one node.
        </p>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          Useful profile targets for B2B agencies: LinkedIn (company page), GitHub,
          Crunchbase, G2, Clutch, GoodFirms, relevant vertical directories. Quantity
          matters less than consistency and link health.
        </p>

        <h3 style={{ marginTop: "1.4em" }}>4 &mdash; Wikidata, only when notability criteria are genuinely met</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          Wikidata is a collaboratively maintained open knowledge base that search engines
          treat as a high-confidence entity source. A Wikidata item for your brand that
          links to your verified profiles and domain is a strong disambiguation signal.
        </p>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          <strong>But notability criteria must be genuinely met.</strong> Wikidata has
          an explicit notability policy: an item should be created only when the subject
          is already referenced by a significant number of independent, reliable sources
          &mdash; not because you want the SEO benefit. Creating a thin or unsupported
          Wikidata item to game entity recognition is a violation of the platform&apos;s
          norms and is likely to be deleted. Do not advise clients to create Wikidata
          entries as a tactic unless they can already point to the supporting references.
        </p>

        <h3 style={{ marginTop: "1.4em" }}>5 &mdash; Brand + descriptor co-occurrence in crawlable text</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          Every piece of crawlable content that names your brand is an opportunity to
          reinforce the entity: your own learn pages, case study snippets, GitHub README
          files, directory listing descriptions, press release boilerplates. Write the
          descriptor into the natural prose &mdash; not as a forced tag but as context
          any reader would need. Search engines reading those pages accumulate the
          co-occurrence signal over time.
        </p>

        {/* ---- Signal table ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Entity signal reference</h2>
        <div role="region" aria-label="Entity signal summary table" tabIndex={0} style={{ overflowX: "auto" }}>
          <table style={{ marginTop: "0.8em", width: "100%", borderCollapse: "collapse", lineHeight: 1.6 }}>
            <thead>
              <tr>
                <th scope="col" style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid currentColor" }}>Entity signal</th>
                <th scope="col" style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid currentColor" }}>Where it lives</th>
                <th scope="col" style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid currentColor" }}>What it does</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Name + descriptor + domain co-occurrence</td>
                <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Crawlable text on your site and third-party pages</td>
                <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Gives engines co-occurrence data to separate collisions</td>
              </tr>
              <tr>
                <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Organization JSON-LD + sameAs</td>
                <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Your homepage &lt;head&gt; or body</td>
                <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Machine-readable entity declaration; links to canonical external profiles</td>
              </tr>
              <tr>
                <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Consistent third-party profiles</td>
                <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>LinkedIn, GitHub, G2, Clutch, directories</td>
                <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Corroborating nodes engines can merge into one entity record</td>
              </tr>
              <tr>
                <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>Wikidata item (when notability is met)</td>
                <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>wikidata.org</td>
                <td style={{ padding: "8px 12px", borderBottom: "1px solid currentColor", opacity: 0.8 }}>High-confidence, independently maintained entity reference</td>
              </tr>
              <tr>
                <td style={{ padding: "8px 12px", opacity: 0.8 }}>Authoritative third-party mentions</td>
                <td style={{ padding: "8px 12px", opacity: 0.8 }}>Press, directories, community threads crawled by engines</td>
                <td style={{ padding: "8px 12px", opacity: 0.8 }}>Off-site co-occurrence that builds entity confidence over time</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ---- Common mistakes ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Common mistakes</h2>

        <h3 style={{ marginTop: "1.4em" }}>Inconsistent naming across profiles</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          &ldquo;Acme SEO&rdquo; on one platform, &ldquo;Acme Search Solutions&rdquo; on another,
          and &ldquo;Acme Digital&rdquo; in your schema. Engines cannot confidently merge these
          into one entity. Pick the canonical name and use it everywhere, exactly.
        </p>

        <h3 style={{ marginTop: "1.4em" }}>sameAs links pointing to dead or empty profiles</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          A sameAs property that resolves to a 404, a blank LinkedIn stub, or a Crunchbase page
          with no description is worse than no sameAs. Engines that follow the link and find
          nothing &mdash; or find content that contradicts your schema &mdash; get noise, not signal.
          Audit every sameAs URL before shipping; audit again quarterly.
        </p>

        <h3 style={{ marginTop: "1.4em" }}>Expecting Organization schema alone to create recognition</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          Organization JSON-LD is a hygiene label. It tells a crawler &ldquo;this page represents
          an organisation named X.&rdquo; It does not instruct an engine to add your brand to its
          knowledge graph, create a panel, or increase retrieval probability. The label is good
          practice; the underlying entity signals &mdash; external references, consistent profiles,
          co-occurrence &mdash; are what the engine actually builds the graph from.
        </p>

        <h3 style={{ marginTop: "1.4em" }}>Conflating a Knowledge Graph panel with entity resolution</h3>
        <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
          A Knowledge Graph panel in Google Search is a display artefact &mdash; the visible panel
          on the right side of a results page. It is evidence that entity resolution succeeded for
          a query, but it is not the resolution itself. Most successful entity disambiguation
          happens below that threshold: engines correctly attribute mentions, citations, and
          retrievals to your brand without ever showing a panel. Do not use &ldquo;I have a
          Knowledge Graph panel&rdquo; as a proxy for &ldquo;entity resolution is working.&rdquo;
          Conversely, not having a panel does not mean resolution is broken.
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
              <a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a>
              {" "}&mdash; {s.note}
            </li>
          ))}
        </ul>
        <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
          The description of how engines build entity graphs and perform disambiguation is
          qualitative, based on publicly documented behaviour of Google Search and on
          schema.org specifications. No proprietary signals or internal documentation are
          referenced. The Prompt Goblin collision example is our own observed situation,
          presented honestly as an in-progress working practice, not a completed case study
          with outcomes.
        </p>

        {/* ---- What this does not guarantee ---- */}
        <h2 style={{ marginTop: "2.4em" }}>What this does not guarantee</h2>
        <ul style={{ marginTop: "0.8em", lineHeight: 1.8, paddingLeft: "1.4em" }}>
          <li>
            Organization schema, sameAs markup, and any other structured data described on
            this page is hygiene &mdash; a parse label, not a citation lever. No markup
            action promises Knowledge Graph inclusion, retrieval, or citation by any
            answer engine.
          </li>
          <li>
            Knowledge Graph panels are not controllable or promised. Engines decide whether
            to surface a panel based on signals that include, but extend beyond, anything
            described here.
          </li>
          <li>
            No specific citation count, rank position, entity-resolution outcome, or
            AI-response inclusion is promised by any action described on this page.
          </li>
          <li>
            Wikidata inclusion is not a service Prompt Goblin performs or promises.
            Notability determinations are made by the Wikidata community against their
            own criteria, not by this agency.
          </li>
          <li>
            Where Prompt Goblin engagement is involved: the refund covers the delivered
            work &mdash; audits, schema implementation, profile consistency review,
            measurement loop. It never covers a citation number, a Knowledge Graph
            panel, or a ranking position.
          </li>
        </ul>

        {/* ---- Scan CTA ---- */}
        <p style={{ marginTop: "2.4em", lineHeight: 1.7 }}>
          Want to know whether your brand string is resolving correctly, and where the
          entity gaps are?{" "}
          <Link href="/#contact">Get in touch</Link> and we will audit your current
          entity signals &mdash; naming consistency, sameAs health, and third-party
          co-occurrence &mdash; as part of the scan.
        </p>

        {/* ---- Go deeper ---- */}
        <h2 style={{ marginTop: "2.4em" }}>Go deeper</h2>
        <ul style={{ marginTop: "0.6em", lineHeight: 2, paddingLeft: "1.4em" }}>
          <li>
            <a href="/learn/eeat-for-ai-search">
              E-E-A-T for AI search &mdash; author credentials and expertise signals (person and author-level disambiguation; see this sibling page)
            </a>
          </li>
          <li>
            <a href="/learn/why-schema-not-enough">
              Why schema markup isn&apos;t enough to get cited &mdash; what schema does and does not do
            </a>
          </li>
          <li>
            <a href="/learn/how-to-show-up-in-chatgpt">
              How to show up in ChatGPT &mdash; the three mechanical levers
            </a>
          </li>
          <li>
            <a href="/learn/aeo-audit-checklist">
              AEO audit checklist for small agencies &mdash; full readiness framework
            </a>
          </li>
          <li>
            <a href="/learn/llms-txt-implementation">
              llms.txt implementation &mdash; hygiene label for LLM sessions
            </a>
          </li>
          <li>
            <a href="/methodology">How the Prompt Goblin scan works &mdash; methodology</a>
          </li>
          <li>
            <a href="/faq">Frequently asked questions</a>
          </li>
        </ul>
      </article>
    </>
  );
}
