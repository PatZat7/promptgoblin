import { describe, expect, it } from "vitest";
import { SOURCES, PREDICTORS } from "@/app/learn/aeo-vs-geo/aeo-geo.data";
import { HONEST_BROKER, LAYERS } from "@/app/methodology/methodology.data";
import { aeoGeoJsonLd, methodologyJsonLd, structuredData } from "@/lib/structured-data";

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
});
