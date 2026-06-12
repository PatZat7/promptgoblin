import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import sitemap from "@/app/sitemap";
import { SOURCES, PREDICTORS } from "@/app/learn/aeo-vs-geo/aeo-geo.data";
import { HONEST_BROKER, LAYERS } from "@/app/methodology/methodology.data";
import { FAQ } from "@/lib/faq";
import { DOCS, NAV, SITE } from "@/lib/site";
import {
  aeoGeoJsonLd,
  methodologyJsonLd,
  structuredData,
  aeoAuditChecklistJsonLd,
  whySchemaNotEnoughJsonLd,
  rankButNotCitedJsonLd,
  eeatForAiSearchJsonLd,
  entityClarityJsonLd,
  llmsTxtImplementationJsonLd,
} from "@/lib/structured-data";
import { FAQ_ITEMS as AEO_CHECKLIST_FAQ } from "@/app/learn/aeo-audit-checklist/aeo-audit-checklist.data";
import { FAQ_ITEMS as WHY_SCHEMA_FAQ } from "@/app/learn/why-schema-not-enough/why-schema-not-enough.data";
import { FAQ_ITEMS as RANK_NOT_CITED_FAQ } from "@/app/learn/rank-but-not-cited/rank-but-not-cited.data";
import { FAQ_ITEMS as EEAT_FAQ } from "@/app/learn/eeat-for-ai-search/eeat-for-ai-search.data";
import { FAQ_ITEMS as ENTITY_FAQ } from "@/app/learn/entity-clarity-for-ai/entity-clarity-for-ai.data";
import { FAQ_ITEMS as LLMS_TXT_FAQ } from "@/app/learn/llms-txt-implementation/llms-txt-implementation.data";

type FaqPageNode = { mainEntity: Array<{ name: string; acceptedAnswer: { text: string } }> };

const faqPageNodeOf = (graph: object[]): FaqPageNode =>
  graph.find((node) => (node as Record<string, unknown>)["@type"] === "FAQPage") as FaqPageNode;

describe("methodology content", () => {
  it("keeps the schema and WAF honesty lines", () => {
    const schema = LAYERS.find((l) => l.id === "schema");
    expect(schema?.honestNote.toLowerCase()).toContain("hygiene");
    expect(schema?.honestNote.toLowerCase()).toContain("not a citation lever");
    expect(HONEST_BROKER.join(" ").toLowerCase()).toContain("never scored 0");
    expect(HONEST_BROKER.join(" ")).toContain("Service");
    expect(HONEST_BROKER.join(" ")).not.toMatch(/missing Product schema/i);
    expect(HONEST_BROKER.join(" ").toLowerCase()).toContain("nothing auto-deploys");
  });

  it("methodology JSON-LD is TechArticle with breadcrumbs", () => {
    const graph = methodologyJsonLd();
    expect(graph[0]).toMatchObject({ "@type": "TechArticle" });
    expect(graph.some((node) => (node as Record<string, unknown>)["@type"] === "BreadcrumbList")).toBe(true);
  });
});

describe("longtail learn pages", () => {
  const cases: Array<[string, () => object[], { q: string; a: string }[]]> = [
    ["aeo-audit-checklist", aeoAuditChecklistJsonLd, AEO_CHECKLIST_FAQ],
    ["why-schema-not-enough", whySchemaNotEnoughJsonLd, WHY_SCHEMA_FAQ],
    ["rank-but-not-cited", rankButNotCitedJsonLd, RANK_NOT_CITED_FAQ],
    ["eeat-for-ai-search", eeatForAiSearchJsonLd, EEAT_FAQ],
    ["entity-clarity-for-ai", entityClarityJsonLd, ENTITY_FAQ],
    ["llms-txt-implementation", llmsTxtImplementationJsonLd, LLMS_TXT_FAQ],
  ];

  it.each(cases)("%s JSON-LD is an Article graph with breadcrumbs", (_slug, jsonLd) => {
    const graph = jsonLd();
    expect(graph[0]).toMatchObject({ "@type": "Article" });
    expect((graph[0] as { headline: string }).headline).toBeTruthy();
    expect(graph.some((node) => (node as Record<string, unknown>)["@type"] === "BreadcrumbList")).toBe(true);
  });

  it.each(cases)("%s FAQPage mainEntity matches visible FAQ_ITEMS exactly", (_slug, jsonLd, faq) => {
    const faqNode = faqPageNodeOf(jsonLd());
    expect(faqNode).toBeDefined();
    expect(faqNode.mainEntity.map((item) => item.name)).toEqual(faq.map((item) => item.q));
    expect(faqNode.mainEntity.map((item) => item.acceptedAnswer.text)).toEqual(faq.map((item) => item.a));
  });

  it("llms.txt page keeps the hygiene-label framing (no discoverability-aid claim)", () => {
    const corpus = JSON.stringify(LLMS_TXT_FAQ) + JSON.stringify(llmsTxtImplementationJsonLd());
    expect(corpus.toLowerCase()).not.toContain("discoverability aid");
    expect(corpus.toLowerCase()).not.toContain("citation lever");
  });

  it("all longtail routes are in the sitemap", () => {
    const urls = sitemap().map((entry) => entry.url);
    for (const slug of [
      "why-schema-not-enough",
      "aeo-audit-checklist",
      "rank-but-not-cited",
      "eeat-for-ai-search",
      "entity-clarity-for-ai",
      "llms-txt-implementation",
    ]) {
      expect(urls).toContain(`${SITE.url}/learn/${slug}`);
    }
  });
});

describe("shared navigation", () => {
  it("top navigation pricing link targets the homepage pricing section", () => {
    expect(NAV.find((item) => item.label === "Pricing")?.href).toBe("/#pricing");
  });

  it("footer pricing link targets the homepage pricing section", () => {
    const footer = readFileSync(path.join(process.cwd(), "components/ui/Footer.tsx"), "utf-8");
    expect(footer).toContain('href="/#pricing"');
    expect(footer).not.toContain('href="/pricing"');
  });
});

describe("public copy and scan loading states", () => {
  it("does not use the removed days-not-quarters phrase", () => {
    const files = [
      "components/sections/Hero/Hero.tsx",
      "public/llms.txt",
      path.join("..", "llms.txt"),
    ];
    const corpus = files.map((file) => readFileSync(path.join(process.cwd(), file), "utf-8")).join("\n");
    expect(corpus.toLowerCase()).not.toContain("days, not quarters");
  });

  it("uses scanning language for scan loading states", () => {
    const heroScan = readFileSync(path.join(process.cwd(), "components/sections/Hero/HeroScan.tsx"), "utf-8");
    const scanResult = readFileSync(path.join(process.cwd(), "components/sections/LiveScan/ScanResult.tsx"), "utf-8");

    expect(heroScan).toContain("scanning AI visibility");
    expect(heroScan).not.toContain("checking AI visibility");
    expect(scanResult).toContain("scanning");
    expect(scanResult).not.toContain("Perplexity is checking");
    expect(scanResult).not.toContain("running</span>");
  });
});

describe("aeo vs geo content", () => {
  it("derives JSON-LD citations from visible sources", () => {
    const graph = aeoGeoJsonLd();
    const article = graph[0] as { citation: { url: string }[] };
    expect(article).toMatchObject({ "@type": "Article" });
    expect(article.citation.map((c) => c.url)).toEqual(SOURCES.map((s) => s.url));
  });

  it("every source has provenance and every predictor is non-guaranteed", () => {
    for (const source of SOURCES) {
      expect(source.claim).toBeTruthy();
      expect(source.value).toMatch(/\d/);
      expect(source.source).toBeTruthy();
      expect(source.url).toMatch(/^https:\/\//);
      expect(source.asOf).toMatch(/^\d{4}$/);
    }
    expect(PREDICTORS.join(" ").toLowerCase()).not.toContain("guarantee");
  });

  it("home structured data remains the six-block service graph", () => {
    expect(structuredData).toHaveLength(6);
    expect(structuredData.map((node) => (node as Record<string, unknown>)["@type"])).not.toContain("Product");
  });

  it("FAQ route is discoverable and JSON-LD mirrors the visible FAQ", () => {
    expect(DOCS.map((link) => link.href)).toContain("/faq");
    expect(sitemap().map((entry) => entry.url)).toContain(`${SITE.url}/faq`);

    const faqNode = structuredData.find(
      (node) => (node as Record<string, unknown>)["@type"] === "FAQPage",
    ) as { mainEntity: Array<{ name: string; acceptedAnswer: { text: string } }> };

    expect(faqNode.mainEntity.map((item) => item.name)).toEqual(FAQ.map((item) => item.q));
    expect(faqNode.mainEntity.map((item) => item.acceptedAnswer.text)).toEqual(FAQ.map((item) => item.a));
  });
});
