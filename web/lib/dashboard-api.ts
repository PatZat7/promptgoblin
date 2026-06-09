import "server-only";

import { createServerSupabase } from "@/lib/supabase/server";
import type {
  RunSummary,
  RunDetail,
  FixRow,
  EvalBadge,
  EvalBadgeStatus,
  IntegrityTally,
  PlatformBreakdown,
  Engine,
  VerifyStatus,
  ApprovalQueueItem,
} from "@/lib/dashboard-types";

// ─── helpers ──────────────────────────────────────────────────────────────────

function deriveBlindSpot(
  blindSpotNote: string | null
): RunSummary["blindSpot"] {
  if (!blindSpotNote) return null;
  const note = blindSpotNote.toLowerCase();
  if (note.includes("waf") || note.includes("blocked") || note.includes("403"))
    return { reason: "waf", detail: blindSpotNote };
  if (note.includes("spa") || note.includes("js-rendered"))
    return { reason: "spa", detail: blindSpotNote };
  return { reason: "unreadable", detail: blindSpotNote };
}

function rowToRunSummary(
  row: Record<string, unknown>,
  prevRow: Record<string, unknown> | null
): RunSummary {
  const visibility = (row.visibility ?? {}) as Record<string, number>;
  // domain is the client domain; clientShare is their share from visibility jsonb
  const domain = (row.domain as string) ?? "";
  const clientShare: number | null =
    Object.prototype.hasOwnProperty.call(visibility, domain)
      ? (visibility[domain] as number)
      : null;
  const prevVisibility = prevRow
    ? ((prevRow.visibility ?? {}) as Record<string, number>)
    : null;
  const prevClientShare: number | null =
    prevVisibility && Object.prototype.hasOwnProperty.call(prevVisibility, domain)
      ? (prevVisibility[domain] as number)
      : null;

  return {
    runId: row.id as string,
    clientId: row.client_id as string,
    domain,
    generatedAt: row.created_at as string,
    mode: (row.is_sample ? "sample" : row.mode) as RunSummary["mode"],
    clientShare,
    prevClientShare,
    confidence: (row.confidence as string) ?? "high",
    lowConfidence: Boolean(row.low_confidence),
    isSample: Boolean(row.is_sample),
    blindSpot: deriveBlindSpot((row.blind_spot as string | null) ?? null),
  };
}

function deriveIntegrity(
  verifications: Array<{ status: VerifyStatus }>
): IntegrityTally {
  let verified = 0;
  let unverifiable = 0;
  let fabricated = 0;
  for (const v of verifications) {
    if (v.status === "verified") verified++;
    else if (v.status === "unverifiable" || v.status === "skipped")
      unverifiable++;
    else if (v.status === "failed" || v.status === "regressed") fabricated++;
  }
  return { verified, unverifiable, fabricated };
}

function deriveEvalBadgeStatus(
  integrity: IntegrityTally,
  lowConfidence: boolean
): EvalBadgeStatus {
  if (lowConfidence) return "low-confidence";
  if (integrity.fabricated > 0) return "partly-unverified";
  if (integrity.verified === 0 && integrity.unverifiable === 0) return "not-run";
  if (integrity.unverifiable > 0) return "partly-unverified";
  return "all-verified";
}

// ─── SAMPLE DATA — shown when a user has no real runs yet ─────────────────────
// Every [sample] row is clearly marked isSample:true; no manufactured result.

const SAMPLE_RUN_SUMMARY: RunSummary = {
  runId: "sample-run-00000000",
  clientId: "sample-client",
  domain: "example.com",
  generatedAt: new Date().toISOString(),
  mode: "sample",
  clientShare: 0.23,
  prevClientShare: null,
  confidence: "high",
  lowConfidence: false,
  isSample: true,
  blindSpot: null,
};

const SAMPLE_FIX: FixRow = {
  fixId: "FIX-001",
  title: "Add FAQ schema to /faq page",
  kind: "schema",
  impact: 4,
  effort: 2,
  score: 8,
  rationale:
    "FAQ-formatted content on this page is not wrapped in FAQPage schema. " +
    "Adding it improves crawlability hygiene — note: schema is hygiene, not a citation guarantee.",
  approved: false,
  humanReviewed: false,
  snippet: null, // locked — human_reviewed=false
  engineLane: "both",
  isSample: true,
};

// ─── ACCESSORS ────────────────────────────────────────────────────────────────

/**
 * List all client-visible runs for a client, newest first.
 * Returns [] when the client has no real runs yet; callers render [sample] UI.
 *
 * When clientId is "__none__" (the MVP placeholder), the function looks up the
 * authenticated user's first client automatically so that seeded test data and
 * real production data surface without a hardcoded ID.
 *
 * RLS enforces owner isolation — the anon key + user JWT means only the
 * authenticated user's rows are ever returned.
 */
export async function listRuns(clientId: string): Promise<RunSummary[]> {
  let supabase: Awaited<ReturnType<typeof createServerSupabase>>;
  try {
    supabase = await createServerSupabase();
  } catch {
    // Supabase env not configured yet — degrade gracefully
    return [];
  }

  // Resolve "__none__" placeholder to the user's first real client
  let resolvedClientId = clientId;
  if (clientId === "__none__") {
    const { data: clientRows } = await supabase
      .from("clients")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1);
    if (!clientRows || clientRows.length === 0) {
      // No clients yet → sample UI
      return [];
    }
    resolvedClientId = (clientRows[0] as Record<string, unknown>).id as string;
  }

  const { data, error } = await supabase
    .from("runs")
    .select(
      "id, client_id, created_at, mode, visibility, confidence, low_confidence, blind_spot, is_sample, clients!inner(domain)"
    )
    .eq("client_id", resolvedClientId)
    .eq("approved", true) // client_visible equivalent: only approved runs shown
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[dashboard-api] listRuns error:", error.message);
    return [];
  }
  if (!data || data.length === 0) return [];

  // Attach domain from joined clients table
  return data.map((row, i) => {
    const r = row as Record<string, unknown>;
    // clients join is an object
    const clientsJoin = r.clients as Record<string, unknown> | null;
    const domain = (clientsJoin?.domain as string) ?? "";
    const prevRow =
      i + 1 < data.length ? (data[i + 1] as Record<string, unknown>) : null;
    return rowToRunSummary({ ...r, domain }, prevRow ? { ...prevRow, domain } : null);
  });
}

/**
 * Fetch full detail for one run (scorecard + platform breakdown + integrity +
 * proof storage paths). Returns null when not found or not owned (RLS makes
 * them indistinguishable on purpose).
 */
export async function getRunDetail(runId: string): Promise<RunDetail | null> {
  if (runId === "sample-run-00000000") {
    // Sample placeholder — no DB needed
    return {
      summary: SAMPLE_RUN_SUMMARY,
      youVsCompetitor: [
        { domain: "example.com", share: 0.23 },
        { domain: "competitor-a.com", share: 0.31 },
      ],
      byEngine: { chatgpt: 0.18, perplexity: 0.29, gemini: null, claude: null },
      integrity: { verified: 2, unverifiable: 1, fabricated: 0 },
      proofs: [],
      evalBadge: "all-verified",
      blindSpot: null,
    };
  }

  let supabase: Awaited<ReturnType<typeof createServerSupabase>>;
  try {
    supabase = await createServerSupabase();
  } catch {
    return null;
  }

  const { data: runData, error: runError } = await supabase
    .from("runs")
    .select(
      "id, client_id, created_at, mode, visibility, confidence, low_confidence, blind_spot, is_sample, clients!inner(domain)"
    )
    .eq("id", runId)
    .single();

  if (runError || !runData) return null;

  const r = runData as Record<string, unknown>;
  const clientsJoin = r.clients as Record<string, unknown> | null;
  const domain = (clientsJoin?.domain as string) ?? "";

  // Get prev run for delta (same client, older than this run)
  const { data: prevRuns } = await supabase
    .from("runs")
    .select("id, visibility")
    .eq("client_id", r.client_id as string)
    .eq("approved", true)
    .lt("created_at", r.created_at as string)
    .order("created_at", { ascending: false })
    .limit(1);
  const prevRow =
    prevRuns && prevRuns.length > 0
      ? (prevRuns[0] as Record<string, unknown>)
      : null;

  const summary = rowToRunSummary({ ...r, domain }, prevRow ? { ...prevRow, domain } : null);

  // visibility jsonb → you-vs-competitor
  const visibility = (r.visibility ?? {}) as Record<string, number>;
  const youVsCompetitor = Object.entries(visibility)
    .map(([d, share]) => ({ domain: d, share }))
    .sort((a, b) => (a.domain === domain ? -1 : b.domain === domain ? 1 : b.share - a.share));

  // Fetch verification_results for integrity tally
  const { data: verifications } = await supabase
    .from("verification_results")
    .select("status")
    .eq("run_id", runId);

  const integrity = deriveIntegrity(
    ((verifications ?? []) as Array<{ status: VerifyStatus }>)
  );
  const evalBadge = deriveEvalBadgeStatus(integrity, summary.lowConfidence);

  // Fetch scan-proof artifacts (storage paths only — never public URLs)
  const { data: artifacts } = await supabase
    .from("run_artifacts")
    .select("storage_path, stage, viewport")
    .eq("run_id", runId);

  const proofs = (artifacts ?? []).map((a) => ({
    label: `${a.stage ?? "proof"} @ ${a.viewport ?? "?"}px`,
    storagePath: a.storage_path as string,
    width: (a.viewport as number) ?? 1440,
    height: Math.round(((a.viewport as number) ?? 1440) * 0.5625),
  }));

  // PlatformBreakdown — null for engines not in visibility_by_engine
  // (The runs table stores visibility_by_engine inside graph_snapshot jsonb;
  //  we surface it from the visibility field which the pipeline populates.)
  const byEngine: PlatformBreakdown = {};
  const engines: Engine[] = ["chatgpt", "claude", "gemini", "perplexity"];
  // graph_snapshot may contain visibility_by_engine sub-key
  const snap = (r.graph_snapshot ?? {}) as Record<string, unknown>;
  const vbe = (snap.visibility_by_engine ?? {}) as Record<string, number | null>;
  for (const eng of engines) {
    byEngine[eng] = Object.prototype.hasOwnProperty.call(vbe, eng)
      ? vbe[eng]
      : null;
  }

  return {
    summary,
    youVsCompetitor,
    byEngine,
    integrity,
    proofs,
    evalBadge,
    blindSpot: summary.blindSpot,
  };
}

/**
 * List fixes (recommendations) for a run, HIGH→LOW by score.
 * CRITICAL: snippet is stripped server-side for every locked fix
 * (locked = !(human_reviewed && approved)). The snippet string is NEVER
 * serialized into the response for locked rows — not hidden in the DOM,
 * absent from the payload entirely.
 */
export async function listFixes(runId: string): Promise<FixRow[]> {
  if (runId === "sample-run-00000000") {
    return [SAMPLE_FIX];
  }

  let supabase: Awaited<ReturnType<typeof createServerSupabase>>;
  try {
    supabase = await createServerSupabase();
  } catch {
    return [];
  }

  const { data, error } = await supabase
    .from("recommendations")
    .select(
      "id, fix_id, title, kind, impact, effort, score, rationale, status, human_reviewed, snippet, engine_lane, is_sample"
    )
    .eq("run_id", runId)
    .order("score", { ascending: false })
    .order("impact", { ascending: false })
    .order("effort", { ascending: true });

  if (error) {
    console.error("[dashboard-api] listFixes error:", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    const humanReviewed = Boolean(r.human_reviewed);
    const approved =
      r.status === "approved" || r.status === "shipped" || r.status === "verified";
    const unlocked = humanReviewed && approved;

    return {
      fixId: (r.fix_id as string) ?? (r.id as string),
      title: (r.title as string) ?? "",
      kind: (r.kind as string) ?? "citation",
      impact: (r.impact as number) ?? 3,
      effort: (r.effort as number) ?? 3,
      score: (r.score as number) ?? 0,
      rationale: (r.rationale as string) ?? "",
      approved,
      humanReviewed,
      // SERVER-SIDE LOCK: snippet is null for locked fixes — never sent to client
      snippet: unlocked ? ((r.snippet as string) ?? null) : null,
      engineLane: (r.engine_lane as FixRow["engineLane"]) ?? undefined,
      isSample: Boolean(r.is_sample),
    };
  });
}

/**
 * Aggregate verification_results into an EvalBadge for a run.
 * Never returns "all-verified" when any fix is failed/regressed or
 * the run is low_confidence.
 */
export async function getEvalBadge(runId: string): Promise<EvalBadge> {
  if (runId === "sample-run-00000000") {
    return { status: "all-verified" };
  }

  let supabase: Awaited<ReturnType<typeof createServerSupabase>>;
  try {
    supabase = await createServerSupabase();
  } catch {
    return { status: "not-run" };
  }

  const { data: verifications } = await supabase
    .from("verification_results")
    .select("status")
    .eq("run_id", runId);

  const { data: runData } = await supabase
    .from("runs")
    .select("low_confidence")
    .eq("id", runId)
    .single();

  const integrity = deriveIntegrity(
    ((verifications ?? []) as Array<{ status: VerifyStatus }>)
  );
  const lowConfidence = Boolean(runData?.low_confidence);
  return { status: deriveEvalBadgeStatus(integrity, lowConfidence) };
}

export async function listApprovalQueue(): Promise<ApprovalQueueItem[]> {
  let supabase: Awaited<ReturnType<typeof createServerSupabase>>;
  try {
    supabase = await createServerSupabase();
  } catch {
    return [];
  }

  const { data, error } = await supabase
    .from("recommendations")
    .select(
      "id, run_id, title, kind, score, status, human_reviewed, runs!inner(client_id, clients!inner(domain))"
    )
    .eq("human_reviewed", false)
    .order("score", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[dashboard-api] listApprovalQueue error:", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    const runJoin = r.runs as Record<string, unknown> | Record<string, unknown>[] | null;
    const run = Array.isArray(runJoin) ? runJoin[0] : runJoin;
    const clientJoin = (run?.clients as Record<string, unknown> | Record<string, unknown>[] | null) ?? null;
    const client = Array.isArray(clientJoin) ? clientJoin[0] : clientJoin;

    return {
      recommendationId: (r.id as string) ?? "",
      runId: (r.run_id as string) ?? "",
      clientId: (run?.client_id as string) ?? "",
      domain: (client?.domain as string) ?? "",
      title: (r.title as string) ?? "Untitled recommendation",
      kind: (r.kind as string) ?? "citation",
      score: Number(r.score ?? 0),
      status: (r.status as string) ?? "proposed",
      humanReviewed: Boolean(r.human_reviewed),
    };
  });
}

/** Re-export sample data for pages that need a fallback when no runs exist. */
export { SAMPLE_RUN_SUMMARY, SAMPLE_FIX };
