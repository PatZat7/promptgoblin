import "server-only";

import { createServerSupabase } from "@/lib/supabase/server";
import type { DashboardSeat } from "@/lib/dashboard-types";

type MembershipRow = {
  client_id: string;
  role: "admin" | "member";
  scan_tier: "none" | "tier1" | "tier2" | "tier3";
  can_run_scans: boolean;
  can_review: boolean;
  clients: { domain: string; owner_user_id: string } | { domain: string; owner_user_id: string }[] | null;
};

type ClientRow = {
  id: string;
  domain: string;
  owner_user_id: string;
};

function firstJoinRow<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function getDashboardSeat(): Promise<DashboardSeat | null> {
  let supabase: Awaited<ReturnType<typeof createServerSupabase>>;
  try {
    supabase = await createServerSupabase();
  } catch {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: memberships, error: membershipError } = await supabase
    .from("client_memberships")
    .select(
      "client_id, role, scan_tier, can_run_scans, can_review, clients!inner(domain, owner_user_id)"
    )
    .order("created_at", { ascending: true })
    .limit(1);

  if (!membershipError && memberships && memberships.length > 0) {
    const membership = memberships[0] as unknown as MembershipRow;
    const client = firstJoinRow(membership.clients);
    return {
      clientId: membership.client_id,
      clientDomain: client?.domain ?? null,
      ownerUserId: client?.owner_user_id ?? null,
      role: membership.role,
      scanTier: membership.scan_tier,
      seatLabel:
        membership.role === "admin"
          ? `admin · ${membership.scan_tier}`
          : `member · ${membership.scan_tier}`,
      canRunScans: Boolean(membership.can_run_scans),
      canReview: Boolean(membership.can_review),
    };
  }

  const { data: clients } = await supabase
    .from("clients")
    .select("id, domain, owner_user_id")
    .order("created_at", { ascending: true })
    .limit(1);

  if (!clients || clients.length === 0) {
    return {
      clientId: null,
      clientDomain: null,
      ownerUserId: null,
      role: null,
      scanTier: null,
      seatLabel: null,
      canRunScans: false,
      canReview: false,
    };
  }

  const client = clients[0] as unknown as ClientRow;
  return {
    clientId: client.id,
    clientDomain: client.domain,
    ownerUserId: client.owner_user_id,
    role: "admin",
    scanTier: "tier3",
    seatLabel: "admin · tier3",
    canRunScans: true,
    canReview: true,
  };
}
