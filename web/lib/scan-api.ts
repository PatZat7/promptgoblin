/**
 * Prompt Goblin scan backend (DigitalOcean Functions). Tier-1 = free no-key
 * hygiene scan; Tier-2 = email-gated Perplexity citation teaser. These run from
 * the browser; the deployed functions send `Access-Control-Allow-Origin: *`, so
 * they work from localhost too. The functions return an honest JSON envelope
 * ({ ok:false, error, outcome? }) even on non-2xx statuses, so these helpers
 * parse the body regardless of HTTP status and return null ONLY on a genuine
 * network/parse failure — never demo theater.
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
/** Why a scan couldn't produce a report. NOT a hygiene verdict — a
 *  blocked/unreachable/non-public host is never scored. */
export type ScanOutcome = "blocked_by_waf" | "unreachable" | "non_public" | "timeout";

export type ScanResponse = {
  ok?: boolean;
  report?: ScanReport;
  summary?: string;
  error?: string;
  /** Set by the function when the upstream WAF/bot-protection refused our fetch
   *  (403/429/503…). The site isn't broken — our server-side fetch can't reach it. */
  blocked?: boolean;
  /** Typed failure cause so the UI can pick honest copy deterministically. */
  outcome?: ScanOutcome;
  /** Upstream HTTP status we observed (e.g. 403), when relevant. */
  status?: number;
};

/**
 * Live Tier-1 hygiene scan. Parses the JSON envelope on ANY HTTP status — the
 * function returns { ok:false, error, outcome } even on 4xx/5xx (e.g. a 502/200
 * when the target's WAF returns 403). Returns null ONLY on a true network or
 * JSON-parse failure, which the callers treat as an unreachable host.
 */
export const runHygieneScan = async (url: string): Promise<ScanResponse | null> => {
  try {
    const r = await fetch(SCAN_API.tier1, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    // Do NOT gate on r.ok — that dropped the function's honest error body on
    // non-2xx and forced the UI into a vague "host unreachable" message.
    return (await r.json()) as ScanResponse;
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

/** Shape of the `.teaser` object returned by the domain-only auto path. */
export type CitationTeaserData = {
  domain?: string;
  engine?: string;
  queriesRun?: number;
  clientCited?: boolean;
  /** Domains cited in answer-engine results, excluding the client's own domain. */
  citedDomains?: string[];
};

export type TeaserAutoResponse = {
  ok?: boolean;
  tier?: number;
  configured?: boolean;
  teaserMode?: boolean;
  retryAfterHours?: number;
  error?: string;
  teaser?: CitationTeaserData | null;
};

/**
 * Domain-only (no competitor, no email) Tier-2 citation teaser.
 * Returns null only on a genuine network or parse failure.
 */
export const runCitationTeaserAuto = async (domain: string): Promise<TeaserAutoResponse | null> => {
  try {
    const r = await fetch(SCAN_API.tier2, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain }),
    });
    return (await r.json()) as TeaserAutoResponse;
  } catch {
    return null;
  }
};
