/**
 * Tests for lib/scan-api.ts — runHygieneScan honest-parse contract.
 *
 * Contract (from the module docstring):
 *   - Parse the JSON body on ANY HTTP status (2xx or non-2xx).
 *   - Return null ONLY on a genuine network throw or JSON-parse failure.
 *   - Never fabricate; a WAF/blocked response is returned as-is (ok:false,
 *     outcome:'blocked_by_waf'), NOT null and NOT a zero hygiene score.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runHygieneScan, runCitationTeaser, runCitationTeaserAuto } from "@/lib/scan-api";

// Minimal Response-like mock that satisfies the fetch contract used in scan-api.
function makeFetchResponse(status: number, body: unknown) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// runHygieneScan
// ---------------------------------------------------------------------------
describe("runHygieneScan", () => {
  it("returns the parsed body on HTTP 502 with {ok:false, outcome:'blocked_by_waf'}", async () => {
    const wafBody = { ok: false, outcome: "blocked_by_waf", error: "WAF refused" };
    vi.mocked(fetch).mockResolvedValueOnce(makeFetchResponse(502, wafBody) as unknown as Response);

    const result = await runHygieneScan("walgreens.com");

    expect(result).not.toBeNull();
    expect(result?.ok).toBe(false);
    expect(result?.outcome).toBe("blocked_by_waf");
    expect(result?.error).toBe("WAF refused");
  });

  it("returns the parsed body on HTTP 200 with ok:false (non-2xx-envelope)", async () => {
    const nonOkBody = { ok: false, outcome: "unreachable", error: "DNS lookup failed" };
    vi.mocked(fetch).mockResolvedValueOnce(makeFetchResponse(200, nonOkBody) as unknown as Response);

    const result = await runHygieneScan("dead-domain-xyz.test");

    expect(result).not.toBeNull();
    expect(result?.ok).toBe(false);
    expect(result?.outcome).toBe("unreachable");
  });

  it("returns the parsed body on HTTP 403 with outcome blocked_by_waf", async () => {
    const blockedBody = { ok: false, blocked: true, outcome: "blocked_by_waf", status: 403 };
    vi.mocked(fetch).mockResolvedValueOnce(makeFetchResponse(403, blockedBody) as unknown as Response);

    const result = await runHygieneScan("example.com");

    expect(result).not.toBeNull();
    expect(result?.ok).toBe(false);
    expect(result?.blocked).toBe(true);
    expect(result?.status).toBe(403);
  });

  it("returns null on a thrown network error (fetch rejects)", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const result = await runHygieneScan("offline.example.com");

    expect(result).toBeNull();
  });

  it("returns null on a JSON-parse failure (body is not valid JSON)", async () => {
    const badResponse = {
      status: 200,
      ok: true,
      json: async () => { throw new SyntaxError("Unexpected token < in JSON"); },
    };
    vi.mocked(fetch).mockResolvedValueOnce(badResponse as unknown as Response);

    const result = await runHygieneScan("bad-json.example.com");

    expect(result).toBeNull();
  });

  it("returns a successful scan report on 200 with ok:true", async () => {
    const successBody = {
      ok: true,
      report: { hygieneScore: 82 },
      summary: "looks healthy",
    };
    vi.mocked(fetch).mockResolvedValueOnce(makeFetchResponse(200, successBody) as unknown as Response);

    const result = await runHygieneScan("healthy.example.com");

    expect(result?.ok).toBe(true);
    expect(result?.report?.hygieneScore).toBe(82);
  });
});

// ---------------------------------------------------------------------------
// runCitationTeaser
// ---------------------------------------------------------------------------
describe("runCitationTeaser", () => {
  it("returns null on network failure", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError("Network error"));

    const result = await runCitationTeaser({ email: "test@test.com", domain: "example.com", competitor: "rival.com" });

    expect(result).toBeNull();
  });

  it("returns the parsed body on success", async () => {
    const teaserBody = { ok: true, tier: 2, configured: true, teaser: { engine: "perplexity", results: [] } };
    vi.mocked(fetch).mockResolvedValueOnce(makeFetchResponse(200, teaserBody) as unknown as Response);

    const result = await runCitationTeaser({ email: "a@b.com", domain: "myfirm.com", competitor: "rival.com" });

    expect(result?.ok).toBe(true);
    expect(result?.tier).toBe(2);
    expect(result?.configured).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// runCitationTeaserAuto
// ---------------------------------------------------------------------------
describe("runCitationTeaserAuto", () => {
  it("returns null on a network throw", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError("Network error"));

    const result = await runCitationTeaserAuto("example.com");

    expect(result).toBeNull();
  });

  it("returns null on a JSON-parse failure", async () => {
    const badResponse = {
      status: 200,
      ok: true,
      json: async () => { throw new SyntaxError("Unexpected token"); },
    };
    vi.mocked(fetch).mockResolvedValueOnce(badResponse as unknown as Response);

    const result = await runCitationTeaserAuto("example.com");

    expect(result).toBeNull();
  });

  it("returns the parsed body on success with clientCited=true", async () => {
    const autoBody = {
      ok: true,
      tier: 2,
      configured: true,
      teaserMode: true,
      teaser: {
        domain: "myfirm.com",
        engine: "perplexity",
        queriesRun: 2,
        clientCited: true,
        citedDomains: ["rival.com", "other.io"],
      },
    };
    vi.mocked(fetch).mockResolvedValueOnce(makeFetchResponse(200, autoBody) as unknown as Response);

    const result = await runCitationTeaserAuto("myfirm.com");

    expect(result?.ok).toBe(true);
    expect(result?.configured).toBe(true);
    expect(result?.teaserMode).toBe(true);
    expect(result?.teaser?.clientCited).toBe(true);
    expect(result?.teaser?.citedDomains).toContain("rival.com");
  });

  it("returns configured:false body on no-key response", async () => {
    const noKeyBody = {
      ok: true,
      tier: 2,
      configured: false,
      teaserMode: true,
      teaser: null,
    };
    vi.mocked(fetch).mockResolvedValueOnce(makeFetchResponse(200, noKeyBody) as unknown as Response);

    const result = await runCitationTeaserAuto("myfirm.com");

    expect(result?.ok).toBe(true);
    expect(result?.configured).toBe(false);
    expect(result?.teaser).toBeNull();
  });
});
