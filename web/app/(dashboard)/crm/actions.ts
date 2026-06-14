"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { getDashboardSeat } from "@/lib/dashboard-seat";
import { LEAD_STATUS_ORDER, type LeadStatus } from "@/lib/leads-types";

/**
 * CRM mutations for the leads_queue table.
 *
 * Authorization is enforced in TWO layers:
 *   1. RLS — every write runs through the user-JWT client (createServerSupabase),
 *      so `owner_user_id = auth.uid()` is the hard tenant boundary. No service-role
 *      escalation here.
 *   2. Seat gate — Server Actions are independently invocable POST endpoints, so
 *      we ALSO re-check seat.canReview (the same gate as the /crm page + nav).
 *      RLS already prevents cross-tenant access; this stops a non-operator seat
 *      from using leads_queue as personal storage by calling the action directly.
 *
 * Honest-broker: nothing here sends a message or contacts a lead. Status moves
 * past "drafted" only RECORD that the owner did something by hand off-platform.
 */

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

const CRM_PATH = "/crm";

type Supa = Awaited<ReturnType<typeof createServerSupabase>>;
type Gate = { ok: true; supabase: Supa; userId: string } | { ok: false; error: string };

/** Authenticated + operator (canReview) gate shared by every mutation. */
async function operatorGate(): Promise<Gate> {
  let supabase: Supa;
  try {
    supabase = await createServerSupabase();
  } catch {
    return { ok: false, error: "Supabase is not configured." };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in required." };
  const seat = await getDashboardSeat();
  if (!seat?.canReview) return { ok: false, error: "Not authorized." };
  return { ok: true, supabase, userId: user.id };
}

function normalizeDomain(raw: string): string {
  let d = String(raw || "").trim().toLowerCase();
  if (!d) return "";
  d = d.replace(/^https?:\/\//, "").replace(/^www\./, "");
  d = d.split("/")[0].split("?")[0].split("#")[0];
  return d.trim();
}

const str = (v: FormDataEntryValue | null): string | null => {
  const s = (v ?? "").toString().trim();
  return s.length ? s : null;
};

function isLeadStatus(v: string): v is LeadStatus {
  return (LEAD_STATUS_ORDER as string[]).includes(v);
}

// ─── create ──────────────────────────────────────────────────────────────────

export async function addLead(formData: FormData): Promise<ActionResult> {
  const gate = await operatorGate();
  if (!gate.ok) return gate;
  const { supabase, userId } = gate;

  const company = str(formData.get("company_name"));
  const domain = normalizeDomain(String(formData.get("domain") ?? ""));
  if (!company || !domain) {
    return { ok: false, error: "Company name and domain are required." };
  }

  const priorityRaw = parseInt(String(formData.get("priority") ?? "0"), 10);
  const priority = Number.isFinite(priorityRaw)
    ? Math.min(3, Math.max(0, priorityRaw))
    : 0;

  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("leads_queue")
    .insert({
      owner_user_id: userId,
      company_name: company,
      domain,
      contact_name: str(formData.get("contact_name")),
      contact_title: str(formData.get("contact_title")),
      linkedin_url: str(formData.get("linkedin_url")),
      competitor: str(formData.get("competitor"))
        ? normalizeDomain(String(formData.get("competitor")))
        : null,
      icp_segment: str(formData.get("icp_segment")),
      source: str(formData.get("source")) ?? "manual-crm",
      priority,
      status: "new",
      last_activity_at: nowIso,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: `A lead for ${domain} already exists.` };
    }
    return { ok: false, error: error.message };
  }
  revalidatePath(CRM_PATH);
  return { ok: true, id: (data as { id: string }).id };
}

// ─── status / pipeline ─────────────────────────────────────────────────────────

const STAGE_STAMP: Partial<Record<LeadStatus, string>> = {
  drafted: "drafted_at",
  connect_sent: "connect_sent_at",
  connected: "connected_at",
  contacted: "contacted_at",
  replied: "replied_at",
};

/**
 * Move a lead to a new status. `last_activity_at` always bumps. The milestone
 * timestamp is stamped only on FIRST arrival into the stage — re-entering a stage
 * (e.g. connected → connect_sent → connected) never clobbers the original date,
 * so the timeline stays an accurate "when did this first happen" record.
 */
export async function updateLeadStatus(
  id: string,
  status: string
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing lead id." };
  if (!isLeadStatus(status)) return { ok: false, error: "Unknown status." };

  const gate = await operatorGate();
  if (!gate.ok) return gate;
  const { supabase } = gate;

  const nowIso = new Date().toISOString();
  const patch: Record<string, unknown> = { status, last_activity_at: nowIso };

  const stampCol = STAGE_STAMP[status as LeadStatus];
  if (stampCol) {
    const { data: existing } = await supabase
      .from("leads_queue")
      .select(stampCol)
      .eq("id", id)
      .maybeSingle();
    const current = (existing as Record<string, unknown> | null)?.[stampCol] ?? null;
    if (!current) patch[stampCol] = nowIso; // first arrival only
  }

  const { error } = await supabase.from("leads_queue").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(CRM_PATH);
  return { ok: true };
}

// ─── drafts (connect note + DM) ──────────────────────────────────────────────

export async function saveLeadDrafts(
  id: string,
  fields: { connectNote?: string | null; dmDraft?: string | null }
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing lead id." };
  const gate = await operatorGate();
  if (!gate.ok) return gate;
  const { supabase } = gate;

  const patch: Record<string, unknown> = { last_activity_at: new Date().toISOString() };
  if (fields.connectNote !== undefined)
    patch.connect_note = fields.connectNote?.trim() || null;
  if (fields.dmDraft !== undefined)
    patch.linkedin_dm_draft = fields.dmDraft?.trim() || null;

  const { error } = await supabase.from("leads_queue").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(CRM_PATH);
  return { ok: true };
}

// ─── notes / priority / follow-up ────────────────────────────────────────────

export async function saveLeadNotes(id: string, notes: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing lead id." };
  const gate = await operatorGate();
  if (!gate.ok) return gate;
  const { supabase } = gate;

  const { error } = await supabase
    .from("leads_queue")
    .update({ notes: notes.trim() || null, last_activity_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(CRM_PATH);
  return { ok: true };
}

export async function setLeadPriority(id: string, priority: number): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing lead id." };
  const p = Math.min(3, Math.max(0, Math.trunc(Number(priority) || 0)));
  const gate = await operatorGate();
  if (!gate.ok) return gate;
  const { supabase } = gate;

  const { error } = await supabase
    .from("leads_queue")
    .update({ priority: p, last_activity_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(CRM_PATH);
  return { ok: true };
}

/** Set or clear the self-reminder. `value` is "YYYY-MM-DD" (from <input type=date>) or null. */
export async function setLeadFollowup(id: string, value: string | null): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing lead id." };
  const gate = await operatorGate();
  if (!gate.ok) return gate;
  const { supabase } = gate;

  let iso: string | null = null;
  if (value) {
    const v = value.trim();
    // A bare YYYY-MM-DD parses as UTC midnight, which can read as due a day
    // early/late depending on the operator's timezone. Anchor it at 12:00 UTC
    // so a date-granular reminder lands on the intended calendar day everywhere.
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(v);
    const parsed = dateOnly ? Date.parse(`${v}T12:00:00Z`) : Date.parse(v);
    if (Number.isNaN(parsed)) return { ok: false, error: "Invalid date." };
    iso = new Date(parsed).toISOString();
  }

  const { error } = await supabase
    .from("leads_queue")
    .update({ next_followup_at: iso, last_activity_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(CRM_PATH);
  return { ok: true };
}

// ─── identity edits ──────────────────────────────────────────────────────────

export async function updateLeadIdentity(
  id: string,
  fields: {
    companyName?: string;
    contactName?: string | null;
    contactTitle?: string | null;
    linkedinUrl?: string | null;
    competitor?: string | null;
    icpSegment?: string | null;
  }
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing lead id." };
  const gate = await operatorGate();
  if (!gate.ok) return gate;
  const { supabase } = gate;

  const patch: Record<string, unknown> = { last_activity_at: new Date().toISOString() };
  const clean = (v: string | null | undefined) =>
    v === undefined ? undefined : v?.trim() || null;

  if (fields.companyName !== undefined) {
    const c = fields.companyName.trim();
    if (!c) return { ok: false, error: "Company name can't be empty." };
    patch.company_name = c;
  }
  if (fields.contactName !== undefined) patch.contact_name = clean(fields.contactName);
  if (fields.contactTitle !== undefined) patch.contact_title = clean(fields.contactTitle);
  if (fields.linkedinUrl !== undefined) patch.linkedin_url = clean(fields.linkedinUrl);
  if (fields.competitor !== undefined) {
    const comp = clean(fields.competitor);
    patch.competitor = comp ? normalizeDomain(comp) : null;
  }
  if (fields.icpSegment !== undefined) patch.icp_segment = clean(fields.icpSegment);

  const { error } = await supabase.from("leads_queue").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(CRM_PATH);
  return { ok: true };
}

// ─── delete ──────────────────────────────────────────────────────────────────

export async function deleteLead(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing lead id." };
  const gate = await operatorGate();
  if (!gate.ok) return gate;
  const { supabase } = gate;

  const { error } = await supabase.from("leads_queue").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(CRM_PATH);
  return { ok: true };
}
