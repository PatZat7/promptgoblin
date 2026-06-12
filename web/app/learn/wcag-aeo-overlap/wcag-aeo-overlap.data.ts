export type FaqItem = { q: string; a: string };

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "Does meeting Section 508 conformance guarantee AI citations for a government site?",
    a: "No. Section 508 conformance removes structural blockers — it ensures parsers and assistive technology can navigate the page. Citation by an AI assistant depends on Bing indexing, third-party mentions, and answer-shaped content. 508 is a prerequisite floor, not a citation lever.",
  },
  {
    q: "Should a federal agency or contractor add Product schema to improve AI visibility?",
    a: "No. Government and service sites correctly use Service, OfferCatalog, or GovernmentService schema — never Product. Flagging a government site as missing Product schema is a category error. The correct schema type for a service entity is one of the service types.",
  },
  {
    q: "WCAG 2.2 removed Success Criterion 4.1.1 Parsing. Does that affect Section 508 compliance?",
    a: "Section 508 (2017/2018 refresh) incorporates WCAG 2.0 Level AA by reference, and 4.1.1 is present in WCAG 2.0 and 2.1. WCAG 2.2 removed it as obsolete — modern HTML parsers effectively satisfy it by default. Agencies adopting WCAG 2.2 by policy no longer track 4.1.1 as a distinct criterion, but those still on WCAG 2.0/2.1 baselines retain it.",
  },
  {
    q: "If a site is already 508-conformant, how much additional AEO work is needed?",
    a: "Structurally, very little re-engineering. The main additional work is content shape: answer-first paragraph structure, direct responses to likely queries, and consistent entity naming. The semantic scaffolding 508 requires is already the parser-friendly foundation AEO needs.",
  },
];

export type SourceItem = { label: string; url: string };

export const SOURCES: SourceItem[] = [
  {
    label: "U.S. Access Board — Section 508 Standards (2017/2018 refresh incorporating WCAG 2.0 AA)",
    url: "https://www.access-board.gov/ict/",
  },
  {
    label: "Section508.gov — Understanding the Section 508 Standards",
    url: "https://www.section508.gov/manage/laws-and-policies/",
  },
  {
    label: "W3C WCAG 2.0 — Success Criterion 1.3.1 Info and Relationships",
    url: "https://www.w3.org/TR/WCAG20/#content-structure-separation-programmatic",
  },
  {
    label: "W3C WCAG 2.0 — Success Criterion 2.4.2 Page Titled",
    url: "https://www.w3.org/TR/WCAG20/#navigation-mechanisms-title",
  },
  {
    label: "W3C WCAG 2.0 — Success Criterion 4.1.2 Name, Role, Value",
    url: "https://www.w3.org/TR/WCAG20/#ensure-compat-rsv",
  },
  {
    label: "W3C WCAG 2.0 — Success Criterion 4.1.1 Parsing",
    url: "https://www.w3.org/TR/WCAG20/#ensure-compat-parses",
  },
  {
    label: "W3C WCAG 2.2 — About SC 4.1.1 Parsing (removed in 2.2 as obsolete)",
    url: "https://www.w3.org/TR/WCAG22/#parsing",
  },
];
