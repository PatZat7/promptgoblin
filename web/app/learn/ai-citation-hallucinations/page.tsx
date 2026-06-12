import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { JsonLd } from "@/components/system/JsonLd";
import { aiCitationHallucinationsJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "AI citation fabrications · Prompt Goblin",
  description:
    "Why AI-generated citations are unreliable without verification, how fabrications surface in practice, and how Prompt Goblin's verification layer flags them before they reach decisions.",
  alternates: { canonical: "/learn/ai-citation-hallucinations" },
  openGraph: {
    type: "article",
    url: `${SITE.url}/learn/ai-citation-hallucinations`,
    title: "AI citation fabrications",
    description:
      "Independent investigations find significant rates of unsupported AI citations. Here is the verification model.",
    images: ["/og-image.png"],
  },
};

const AiCitationHallucinationsPage = () => (
  <>
    {aiCitationHallucinationsJsonLd().map((d, i) => <JsonLd key={i} data={d} />)}
    <article style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 80px" }}>
      <h1>AI citation fabrications</h1>

      <p style={{ marginTop: "1.2em", lineHeight: 1.7 }}>
        Language models can generate confident, well-formatted citations to sources that do
        not exist, cannot be retrieved, or do not support the claim attached to them.
        Independent investigations across a range of AI-assisted research tools have found
        meaningful rates of unsupported or fabricated citations. The practical consequence:
        any AI-generated citation should be treated as unverified until it has been checked
        against the actual source. This page explains what fabrication looks like, why it
        happens, and how Prompt Goblin&apos;s verification layer addresses it.
      </p>

      {/* ---- What fabrication looks like ---- */}
      <h2 style={{ marginTop: "2.4em" }}>What AI citation fabrication looks like in practice</h2>

      <h3 style={{ marginTop: "1.2em" }}>Plausible but non-existent sources</h3>
      <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
        The most common form: a correctly formatted citation (author, year, journal, title)
        to a paper that does not exist. The title sounds plausible; the journal is real; the
        author may be real with genuine publications on adjacent topics. The specific paper
        does not exist and cannot be retrieved.
      </p>

      <h3 style={{ marginTop: "1.2em" }}>Real source, wrong claim</h3>
      <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
        The URL resolves and the source is legitimate, but the cited claim does not appear in
        the source, contradicts the source, or is a significant overstatement of what the
        source actually says. This is harder to catch than a broken URL because the source
        appears credible on surface inspection.
      </p>

      <h3 style={{ marginTop: "1.2em" }}>Resolved URL, wrong content</h3>
      <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
        The URL returns a 200 and leads to a real page, but the page no longer contains the
        cited content (it was updated), or was never a reliable source for that claim. This
        pattern is common with news articles that are updated after an AI&apos;s training
        data was collected.
      </p>

      <h3 style={{ marginTop: "1.2em" }}>Domain squatting and content mismatch</h3>
      <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
        A cited domain resolves, but the content has changed hands and now serves unrelated
        or adversarial content. The crawl check passes; the content match fails.
      </p>

      {/* ---- Why it happens ---- */}
      <h2 style={{ marginTop: "2.4em" }}>Why language models fabricate citations</h2>
      <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
        Language models generate tokens based on learned statistical patterns. A well-formed
        citation is a specific syntactic pattern the model has seen many times. When a model
        is asked to produce a citation for a claim, it generates a token sequence that looks
        like a valid citation — because generating a plausible citation sequence is exactly
        what it is trained to do. Whether the citation resolves to a real, supporting source
        is a separate question that requires an external lookup, not a probability
        distribution over tokens.
      </p>
      <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
        Retrieval-augmented models (RAG, live search grounding) reduce but do not eliminate
        fabrication. A grounded model can misattribute a claim from the retrieved snippet to
        a different source, or retrieve a source that partially supports the claim and
        overstate the support. Verification is necessary in all cases.
      </p>

      {/* ---- Real-world consequences ---- */}
      <h2 style={{ marginTop: "2.4em" }}>Real-world consequences</h2>
      <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
        AI citation fabrications have produced documented harms. US federal courts have
        sanctioned attorneys for filing briefs containing AI-generated citations to cases
        that do not exist. Researchers have found fabricated references embedded in
        published papers that had passed peer review. Journalists have published AI-assisted
        stories citing sources that, on checking, did not exist or did not support the
        claim. In each case, the failure mode was the same: the citation looked plausible and
        no one checked it.
      </p>
      <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
        For businesses, the stakes are reputational and operational: a prospect who follows
        a fabricated citation to a competitor, a partner who catches a false reference in a
        proposal, a compliance team that finds unsupported claims in AI-generated policy
        documents. The risk is not theoretical.
      </p>

      {/* ---- What Prompt Goblin does ---- */}
      <h2 style={{ marginTop: "2.4em" }}>How Prompt Goblin handles citation verification</h2>
      <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
        The Prompt Goblin pipeline includes a verification pass on every citation it
        generates or surfaces. The check has three layers:
      </p>

      <h3 style={{ marginTop: "1.2em" }}>1. HTTP status check</h3>
      <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
        Each cited URL is fetched. 404, 410, redirect chains over three hops, and
        non-200 responses are flagged as unresolvable. Soft 404s (200 status with
        &ldquo;page not found&rdquo; body) are detected by content inspection, not just
        status code.
      </p>

      <h3 style={{ marginTop: "1.2em" }}>2. Canonical resolution</h3>
      <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
        The URL is checked against its canonical. If it redirects to a significantly
        different domain or path, the citation is flagged for review — this catches domain
        changes, content migrations, and squatted domains.
      </p>

      <h3 style={{ marginTop: "1.2em" }}>3. Content match</h3>
      <p style={{ marginTop: "0.6em", lineHeight: 1.7 }}>
        Key terms from the cited claim are checked against the retrieved page text. A citation
        that resolves but whose content does not contain the claimed terms is marked as
        unverified — not removed, but surfaced with low confidence so the human reviewer can
        evaluate it.
      </p>

      <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
        Citations that fail one or more checks appear explicitly in the dashboard with a
        confidence level and the failure reason. They are never silently discarded and never
        reported as passing when they have not. The engineer review step covers verification
        flags before anything is published.
      </p>

      {/* ---- What this means for your site ---- */}
      <h2 style={{ marginTop: "2.4em" }}>What this means for your own site&apos;s citation health</h2>
      <p style={{ marginTop: "0.8em", lineHeight: 1.7 }}>
        If AI assistants are citing your competitors with fabricated or weak sources, the
        citation graph in your space is unreliable — and that is measurable. The Prompt
        Goblin pipeline maps which sources AI assistants actually retrieve for your target
        topics and checks their resolvability. You can see which competitor citations are
        phantom, which of your pages are retrieved but not cited, and which sources you
        should earn mentions from because they are the credible, consistently-resolved
        references in your category.
      </p>

      {/* ---- FAQ ---- */}
      <h2 style={{ marginTop: "2.4em" }}>Frequently asked questions</h2>

      <h3 style={{ marginTop: "1.2em" }}>Can I prevent AI assistants from citing fabricated sources about my brand?</h3>
      <p style={{ marginTop: "0.5em", lineHeight: 1.7 }}>
        You cannot directly control what an AI assistant cites. You can increase the signal
        of real, verifiable sources associated with your brand: press coverage with stable
        URLs, directory listings, forum mentions. The stronger the real-source signal, the
        less likely a model is to fill the gap with a fabricated reference.
      </p>

      <h3 style={{ marginTop: "1.2em" }}>Does Prompt Goblin guarantee citation accuracy?</h3>
      <p style={{ marginTop: "0.5em", lineHeight: 1.7 }}>
        No. We verify citations we surface and flag failures — we cannot control what an
        external AI assistant generates on its own. The refund guarantees the delivered
        work: audits, copy, technical fixes, the verification pass. It does not guarantee a
        citation count or the behaviour of third-party AI systems.
      </p>

      <h3 style={{ marginTop: "1.2em" }}>Are retrieval-augmented systems (RAG) safe from fabrication?</h3>
      <p style={{ marginTop: "0.5em", lineHeight: 1.7 }}>
        Safer, but not immune. RAG systems ground generation in retrieved snippets, which
        reduces hallucination rates. But they can still misattribute, overstate, or combine
        claims from multiple sources in ways that are not fully supported by any single
        source. Verification is still required.
      </p>

      {/* ---- Internal links ---- */}
      <h2 style={{ marginTop: "2.4em" }}>Go deeper</h2>
      <ul style={{ marginTop: "0.6em", lineHeight: 2, paddingLeft: "1.4em" }}>
        <li><a href="/learn/how-to-show-up-in-chatgpt">How to show up in ChatGPT — the three levers</a></li>
        <li><a href="/learn/aeo-vs-geo">AEO vs GEO — what gets cited and why</a></li>
        <li><a href="/methodology">How the Prompt Goblin scan works — methodology</a></li>
        <li><a href="/benchmark">Benchmark — compare citation coverage</a></li>
        <li><a href="/faq">FAQ</a></li>
      </ul>
    </article>
  </>
);

export default AiCitationHallucinationsPage;
