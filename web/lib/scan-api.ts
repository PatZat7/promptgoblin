/**
 * Prompt Goblin scan backend (DigitalOcean Functions). Tier-1 = free no-key
 * hygiene scan; Tier-2 = email-gated Perplexity citation teaser. These run from
 * the browser; the deployed functions send `Access-Control-Allow-Origin: *`, so
 * they work from localhost too. On a network failure these helpers return null
 * and the UI shows the honest error path (never demo theater).
 */

const SCAN_API = {
  tier1: "https://faas-nyc1-2ef2e6cc.doserverless.co/api/v1/web/fn-d4c19df5-3777-4a5d-9843-92f3ebf1f8e7/scan/tier1",
  tier2: "https://faas-nyc1-2ef2e6cc.doserverless.co/api/v1/web/fn-d4c19df5-3777-4a5d-9843-92f3ebf1f8e7/scan/tier2",
};

export type ScanFinding = { severity: number; detail?: string };
export type ScanReport = {
  hygieneScore?: number;
  disclaimer?: string;
  findings?: ScanFinding[];
  schema?: { found?: string[]; missing?: string[] };
  techStack?: {
    detected?: { name?: string; confidence?: string; evidence?: string }[];
    note?: string;
  };
  crawlability?: { present?: boolean; welcomesAiBots?: boolean };
  llmsTxt?: { present?: boolean; valid?: boolean };
  coreWebVitalsProxies?: { htmlKilobytes?: number };
};
export type ScanResponse = { ok?: boolean; report?: ScanReport; summary?: string; error?: string };

/** Live Tier-1 hygiene scan. Returns the parsed response, or null on failure. */
export const runHygieneScan = async (url: string): Promise<ScanResponse | null> => {
  try {
    const r = await fetch(SCAN_API.tier1, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    return r.ok ? ((await r.json()) as ScanResponse) : null;
  } catch {
    return null;
  }
};

export type TeaserResponse = {
  ok?: boolean;
  tier?: number;
  configured?: boolean;
  retryAfterHours?: number;
  error?: string;
  summary?: string;
  teaser?: {
    engine?: string;
    results?: {
      query?: string;
      answer?: string;
      sources?: string[];
      clientCited?: boolean;
      competitorCited?: boolean;
    }[];
  };
};

/** Email-gated Tier-2 citation teaser. Returns null on network failure. */
export const runCitationTeaser = async (args: {
  email: string;
  domain: string;
  competitor: string;
}): Promise<TeaserResponse | null> => {
  try {
    const r = await fetch(SCAN_API.tier2, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args),
    });
    return (await r.json()) as TeaserResponse;
  } catch {
    return null;
  }
};
