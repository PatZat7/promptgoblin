/**
 * Tests for components/sections/LiveScan/scan-report.ts — scanFailureCopy
 * honest-broker contract.
 *
 * Non-negotiables verified here:
 *   - blocked_by_waf / unreachable / non_public map to soft:true (amber, not red).
 *   - No numeric score is embedded in the copy strings.
 *   - The legacy "(HTTP 403)" error-string path classifies as blocked_by_waf.
 *   - A null response (network failure) classifies as unreachable, soft:true.
 *   - An unclassified failure falls through to soft:false with the raw error.
 */

import { describe, it, expect } from "vitest";
import { scanFailureCopy, scoreBand } from "@/components/sections/LiveScan/scan-report";
import type { ScanResponse } from "@/lib/scan-api";

// Helper: assert no digit run that looks like a score (e.g. "47/100" or "score: 0")
function assertNoScore(text: string) {
  // Patterns to disallow: "0/100", "47 / 100", "score: 42", a lone "0" next to "score"
  expect(text).not.toMatch(/\bscore\b.{0,10}\d+/i);
  expect(text).not.toMatch(/\d+\s*\/\s*100/);
}

// ---------------------------------------------------------------------------
// blocked_by_waf
// ---------------------------------------------------------------------------
describe("scanFailureCopy — blocked_by_waf", () => {
  it("maps outcome:'blocked_by_waf' to soft:true with no numeric score", () => {
    const resp: ScanResponse = { ok: false, outcome: "blocked_by_waf", error: "CDN refused" };
    const fail = scanFailureCopy(resp);
    expect(fail.soft).toBe(true);
    expect(fail.outcome).toBe("blocked_by_waf");
    assertNoScore(fail.card);
    assertNoScore(fail.line);
  });

  it("maps blocked:true (old function field) to blocked_by_waf, soft:true", () => {
    const resp: ScanResponse = { ok: false, blocked: true };
    const fail = scanFailureCopy(resp);
    expect(fail.soft).toBe(true);
    expect(fail.outcome).toBe("blocked_by_waf");
  });

  it("maps HTTP 403 in error string to blocked_by_waf, soft:true (legacy path)", () => {
    const resp: ScanResponse = { ok: false, error: "Host responded with (HTTP 403)" };
    const fail = scanFailureCopy(resp);
    expect(fail.soft).toBe(true);
    expect(fail.outcome).toBe("blocked_by_waf");
    assertNoScore(fail.card);
  });

  it("maps HTTP 429 via typed status field to blocked_by_waf", () => {
    const resp: ScanResponse = { ok: false, status: 429 };
    const fail = scanFailureCopy(resp);
    expect(fail.soft).toBe(true);
    expect(fail.outcome).toBe("blocked_by_waf");
  });

  it("maps HTTP 503 via typed status field to blocked_by_waf", () => {
    const resp: ScanResponse = { ok: false, status: 503 };
    const fail = scanFailureCopy(resp);
    expect(fail.soft).toBe(true);
    expect(fail.outcome).toBe("blocked_by_waf");
  });
});

// ---------------------------------------------------------------------------
// unreachable
// ---------------------------------------------------------------------------
describe("scanFailureCopy — unreachable", () => {
  it("maps outcome:'unreachable' to soft:true with no numeric score", () => {
    const resp: ScanResponse = { ok: false, outcome: "unreachable" };
    const fail = scanFailureCopy(resp);
    expect(fail.soft).toBe(true);
    expect(fail.outcome).toBe("unreachable");
    assertNoScore(fail.card);
    assertNoScore(fail.line);
  });

  it("maps null response (network/parse failure) to unreachable, soft:true", () => {
    const fail = scanFailureCopy(null);
    expect(fail.soft).toBe(true);
    expect(fail.outcome).toBe("unreachable");
  });
});

// ---------------------------------------------------------------------------
// non_public
// ---------------------------------------------------------------------------
describe("scanFailureCopy — non_public", () => {
  it("maps outcome:'non_public' to soft:true with no numeric score", () => {
    const resp: ScanResponse = { ok: false, outcome: "non_public" };
    const fail = scanFailureCopy(resp);
    expect(fail.soft).toBe(true);
    expect(fail.outcome).toBe("non_public");
    assertNoScore(fail.card);
  });

  it("maps 'non-public address' error string to non_public, soft:true", () => {
    const resp: ScanResponse = { ok: false, error: "Target resolves to a non-public address (RFC 1918)" };
    const fail = scanFailureCopy(resp);
    expect(fail.soft).toBe(true);
    expect(fail.outcome).toBe("non_public");
  });
});

// ---------------------------------------------------------------------------
// timeout
// ---------------------------------------------------------------------------
describe("scanFailureCopy — timeout", () => {
  it("maps outcome:'timeout' to soft:true with no numeric score", () => {
    const resp: ScanResponse = { ok: false, outcome: "timeout" };
    const fail = scanFailureCopy(resp);
    expect(fail.soft).toBe(true);
    expect(fail.outcome).toBe("timeout");
    assertNoScore(fail.card);
    assertNoScore(fail.line);
  });
});

// ---------------------------------------------------------------------------
// Unclassified failure (fallthrough)
// ---------------------------------------------------------------------------
describe("scanFailureCopy — unclassified", () => {
  it("falls through to soft:false for an unrecognised error", () => {
    const resp: ScanResponse = { ok: false, error: "Something deeply weird happened" };
    const fail = scanFailureCopy(resp);
    // soft:false means the UI can render it as a hard error (red) — that is correct
    // for genuinely unknown failures, but still no fabricated numeric score.
    expect(fail.outcome).toBeNull();
    assertNoScore(fail.card);
  });
});

// ---------------------------------------------------------------------------
// scoreBand — never returns a score band for a null/undefined hygiene score
// ---------------------------------------------------------------------------
describe("scoreBand", () => {
  it("returns warn label 'scan complete' when score is undefined (no numeric fabrication)", () => {
    const band = scoreBand(undefined);
    expect(band.key).toBe("warn");
    expect(band.label).toBe("scan complete");
  });

  it("classifies 80+ as ok/healthy", () => {
    expect(scoreBand(80).key).toBe("ok");
    expect(scoreBand(100).key).toBe("ok");
  });

  it("classifies 50-79 as warn/fixable", () => {
    expect(scoreBand(50).key).toBe("warn");
    expect(scoreBand(79).key).toBe("warn");
  });

  it("classifies below 50 as bad/cursed", () => {
    expect(scoreBand(49).key).toBe("bad");
    expect(scoreBand(0).key).toBe("bad");
  });
});
