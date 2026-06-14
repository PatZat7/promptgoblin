import "server-only";

import { createServerSupabase } from "@/lib/supabase/server";
import {
  CLOSED_STATUSES,
  LEAD_STATUS_ORDER,
  type Lead,
  type LeadListFilters,
  type LeadStats,
  type LeadStatus,
} from "@/lib/leads-types";

/**
 * Lead CRM data access — owner-scoped via RLS.
 *
 * Every query runs through the user-JWT Supabase client (createServerSupabase),
 * so RLS (`owner_user_id = auth.uid()`) is the isolation boundary — a user only
 * ever sees their own leads. We never use the service-role client here; that's
 * reserved for the headless import/scan scripts.
 *
 * Honest-broker: hygiene_score is HYGIENE, not visibility, and stays NULL (never
 * coerced to 0) when a page couldn't be read. This layer never invents a score.
 */

const LEAD_COLUMNS =
  "id, company_name, domain, contact_name, contact_title, linkedin_url, " +
  "competitor, icp_segment, source, email, email_status, phone, headline, " +
  "location, photo_url, apollo_contact_id, apollo_person_id, status, " +
  "hygiene_score, scan_status, scan_summary, scan_report, scanned_at, " +
  "connect_note, linkedin_dm_draft, drafted_at, connect_sent_at, connected_at, " +
  "contacted_at, replied_at, last_activity_at, next_followup_at, priority, tags, " +
  "notes, created_at, updated_at";

function rowToLead(row: Record<string, unknown>): Lead {
  return {
    id: row.id as string,
    companyName: (row.company_name as string) ?? "",
    domain: (row.domain as string) ?? "",
    contactName: (row.contact_name as string | null) ?? null,
    contactTitle: (row.contact_title as string | null) ?? null,
    linkedinUrl: (row.linkedin_url as string | null) ?? null,
    competitor: (row.competitor as string | null) ?? null,
    icpSegment: (row.icp_segment as string | null) ?? null,
    source: (row.source as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    emailStatus: (row.email_status as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    headline: (row.headline as string | null) ?? null,
    location: (row.location as string | null) ?? null,
    photoUrl: (row.photo_url as string | null) ?? null,
    apolloContactId: (row.apollo_contact_id as string | null) ?? null,
    apolloPersonId: (row.apollo_person_id as string | null) ?? null,
    status: ((row.status as string) ?? "new") as LeadStatus,
    // NULL stays NULL — a page we couldn't read is a blind spot, never a 0.
    hygieneScore:
      typeof row.hygiene_score === "number" ? (row.hygiene_score as number) : null,
    scanStatus: (row.scan_status as Lead["scanStatus"]) ?? null,
    scanSummary: (row.scan_summary as string | null) ?? null,
    scanReport: (row.scan_report as Record<string, unknown> | null) ?? null,
    scannedAt: (row.scanned_at as string | null) ?? null,
    connectNote: (row.connect_note as string | null) ?? null,
    dmDraft: (row.linkedin_dm_draft as string | null) ?? null,
    draftedAt: (row.drafted_at as string | null) ?? null,
    connectSentAt: (row.connect_sent_at as string | null) ?? null,
    connectedAt: (row.connected_at as string | null) ?? null,
    contactedAt: (row.contacted_at as string | null) ?? null,
    repliedAt: (row.replied_at as string | null) ?? null,
    lastActivityAt: (row.last_activity_at as string | null) ?? null,
    nextFollowupAt: (row.next_followup_at as string | null) ?? null,
    priority: typeof row.priority === "number" ? (row.priority as number) : 0,
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    notes: (row.notes as string | null) ?? null,
    createdAt: (row.created_at as string) ?? "",
    updatedAt: (row.updated_at as string) ?? "",
  };
}

/** List the signed-in owner's leads, filtered + sorted. RLS scopes to owner. */
export async function listLeads(filters: LeadListFilters = {}): Promise<Lead[]> {
  let supabase: Awaited<ReturnType<typeof createServerSupabase>>;
  try {
    supabase = await createServerSupabase();
  } catch {
    return []; // Supabase env not configured — degrade gracefully
  }

  let query = supabase.from("leads_queue").select(LEAD_COLUMNS);

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const q = (filters.q ?? "").trim();
  if (q) {
    // Match company, domain, or contact name. The term is interpolated into a
    // raw PostgREST .or() logic-tree string, so escape EVERY character that is
    // significant to that grammar — backslash, LIKE wildcards (% _), the
    // value/filter separator (,), and the grouping parens ( ). Missing any of
    // these lets a term like "Acme (US)" produce a malformed filter (→ 400 →
    // empty results) or reshape the boolean tree. RLS still scopes to the owner,
    // so this is feature-correctness hardening, not a tenant-isolation fix.
    const safe = q.replace(/[\\%_,()]/g, (m) => `\\${m}`);
    query = query.or(
      `company_name.ilike.%${safe}%,domain.ilike.%${safe}%,contact_name.ilike.%${safe}%,email.ilike.%${safe}%`
    );
  }

  switch (filters.sort) {
    case "priority":
      query = query
        .order("priority", { ascending: false })
        .order("last_activity_at", { ascending: false, nullsFirst: false });
      break;
    case "score":
      // NULLs last so blind spots don't masquerade as top or bottom scorers.
      query = query.order("hygiene_score", { ascending: false, nullsFirst: false });
      break;
    case "company":
      query = query.order("company_name", { ascending: true });
      break;
    case "recent":
    default:
      query = query
        .order("last_activity_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      break;
  }

  const { data, error } = await query.limit(1000);
  if (error) {
    console.error("[leads-api] listLeads error:", error.message);
    return [];
  }
  return (data ?? []).map((r) => rowToLead(r as unknown as Record<string, unknown>));
}

/** Fetch one lead by id. Returns null when not found or not owned (RLS). */
export async function getLead(id: string): Promise<Lead | null> {
  let supabase: Awaited<ReturnType<typeof createServerSupabase>>;
  try {
    supabase = await createServerSupabase();
  } catch {
    return null;
  }
  const { data, error } = await supabase
    .from("leads_queue")
    .select(LEAD_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return rowToLead(data as unknown as Record<string, unknown>);
}

/** Per-status counts + funnel rollups for the stat strip. RLS scopes to owner. */
export async function getLeadStats(): Promise<LeadStats> {
  const empty: LeadStats = {
    total: 0,
    byStatus: Object.fromEntries(
      LEAD_STATUS_ORDER.map((s) => [s, 0])
    ) as Record<LeadStatus, number>,
    needsScan: 0,
    readyToSend: 0,
    inFlight: 0,
    replied: 0,
    won: 0,
    followupsDue: 0,
  };

  let supabase: Awaited<ReturnType<typeof createServerSupabase>>;
  try {
    supabase = await createServerSupabase();
  } catch {
    return empty;
  }

  const { data, error } = await supabase
    .from("leads_queue")
    .select("status, next_followup_at")
    .limit(5000);
  if (error || !data) {
    if (error) console.error("[leads-api] getLeadStats error:", error.message);
    return empty;
  }

  const nowMs = Date.now();
  const stats: LeadStats = { ...empty, byStatus: { ...empty.byStatus } };
  for (const raw of data) {
    const row = raw as { status: string; next_followup_at: string | null };
    const status = (row.status as LeadStatus) ?? "new";
    if (status in stats.byStatus) stats.byStatus[status] += 1;
    stats.total += 1;

    if (status === "new") stats.needsScan += 1;
    if (status === "drafted") stats.readyToSend += 1;
    if (status === "connect_sent" || status === "connected" || status === "contacted")
      stats.inFlight += 1;
    if (status === "replied") stats.replied += 1;
    if (status === "won") stats.won += 1;

    if (
      row.next_followup_at &&
      !CLOSED_STATUSES.includes(status) &&
      Date.parse(row.next_followup_at) <= nowMs
    ) {
      stats.followupsDue += 1;
    }
  }
  return stats;
}
