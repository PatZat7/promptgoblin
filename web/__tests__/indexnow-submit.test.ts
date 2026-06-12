import { describe, it, expect } from "vitest";
// @ts-expect-error — plain ESM script, no type declarations needed for runtime test
import { extractLocs, sameHostHttps, buildSubmission } from "../scripts/indexnow-submit.mjs";

const SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://promptgoblin.io/</loc></url>
  <url><loc>https://promptgoblin.io/learn/bing-rank-and-ai-citations</loc></url>
  <url><loc>https://www.promptgoblin.io/faq</loc></url>
  <url><loc>http://promptgoblin.io/insecure</loc></url>
  <url><loc>https://evil.example.com/spam</loc></url>
</urlset>`;

describe("indexnow-submit", () => {
  it("extracts every <loc> value", () => {
    expect(extractLocs(SAMPLE)).toEqual([
      "https://promptgoblin.io/",
      "https://promptgoblin.io/learn/bing-rank-and-ai-citations",
      "https://www.promptgoblin.io/faq",
      "http://promptgoblin.io/insecure",
      "https://evil.example.com/spam",
    ]);
  });

  it("keeps only same-host https URLs (www-insensitive), drops http + foreign", () => {
    const out = buildSubmission(SAMPLE, "https://promptgoblin.io");
    expect(out).toContain("https://promptgoblin.io/");
    expect(out).toContain("https://promptgoblin.io/learn/bing-rank-and-ai-citations");
    expect(out).toContain("https://www.promptgoblin.io/faq"); // www matches base host
    expect(out).not.toContain("http://promptgoblin.io/insecure"); // not https
    expect(out.some((u) => u.includes("evil.example.com"))).toBe(false); // foreign host
    expect(out).toHaveLength(3);
  });

  it("dedupes repeated URLs", () => {
    const dupes = `${SAMPLE}<url><loc>https://promptgoblin.io/</loc></url>`;
    expect(buildSubmission(dupes, "https://promptgoblin.io").filter((u) => u === "https://promptgoblin.io/")).toHaveLength(1);
  });

  it("ignores malformed loc entries", () => {
    expect(sameHostHttps(["not a url", "https://promptgoblin.io/ok"], "promptgoblin.io")).toEqual([
      "https://promptgoblin.io/ok",
    ]);
  });
});
