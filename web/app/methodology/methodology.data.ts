export const LAYERS = [
  {
    id: "technical-hygiene",
    name: "Technical hygiene",
    measures: "Crawl path, robots and llms.txt presence, indexability, head tags, canonical tags, and static Core Web Vitals proxies.",
    finding: "A hygiene issue means a crawler or answer engine may have trouble reading, summarizing, or trusting the page shell.",
    honestNote: "Static fetches have a blind spot: an unreadable, JS-rendered, SPA, or WAF-blocked site is flagged, never scored 0.",
  },
  {
    id: "schema",
    name: "Schema",
    measures: "JSON-LD types present, parseable, and appropriate for the business model.",
    finding: "A schema issue means the page is harder to parse as an entity or service.",
    honestNote: "Schema is hygiene, not a citation lever. It helps engines parse you; it does not earn a citation.",
  },
  {
    id: "ai-visibility",
    name: "AI visibility",
    measures: "Answer-engine citation gaps, competitor citation graph differences, freshness, topical depth, and third-party platform presence.",
    finding: "A visibility issue means the answer surface currently points elsewhere or lacks a verifiable source pattern we can work on.",
    honestNote: "Citation movement is measured over re-runs. No citation number is guaranteed.",
  },
  {
    id: "accessibility",
    name: "Accessibility",
    measures: "Static WCAG 2.1 AA and Section 508 pre-screen signals such as labels, image alt text, language, and landmarks.",
    finding: "An accessibility issue means the page may block assistive technology or fail compliance review.",
    honestNote: "Automated checks catch only part of WCAG; full conformance needs rendered axe checks and human review.",
  },
] as const;

export const FINDINGS = [
  ["HIGH", "A live blocker, noindex, unreadable surface, or missing critical entity path that needs human review first."],
  ["MED", "A fixable issue that can materially improve crawlability, clarity, accessibility, or measurement quality."],
  ["LOW", "A cleanup or supporting signal that improves the surface without being a standalone citation lever."],
] as const;

export const HONEST_BROKER = [
  "We never fabricate metrics, clients, testimonials, or citations.",
  "Schema and llms.txt are hygiene, never a promised citation lever.",
  "Unreadable, JS-rendered, SPA, or WAF-blocked pages are flagged, never scored 0.",
  "Service and government sites correctly use Service, Offer, and OfferCatalog patterns; we do not prescribe commerce schema for them.",
  "Every recommended change is human-reviewed and human-gated. Nothing auto-deploys or auto-sends.",
  "Mock, sample, and demo paths are illustrative and are never reported as real passes.",
  "The refund covers the work, never a citation number.",
] as const;

export const RECON_NOTES = [
  "Recon infers category, topic, summary, early stack fingerprints, and up to two competitors when the operator did not provide competitors.",
  "Auto-discovered competitors are flagged research inferences the client confirms, never asserted facts.",
  "The first homepage fetch is cached so later audit nodes do not repeatedly probe the same site.",
] as const;
