import "server-only";

import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";
import { getDashboardSeat } from "@/lib/dashboard-seat";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const domain = String(form.get("domain") || "")
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/+$/, "");
    const mode = String(form.get("mode") || "live");
    const keyword = String(form.get("keyword") || "").trim();
    const citationTargets = String(form.get("citation_targets") || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (!domain) {
      return NextResponse.json(
        { ok: false as const, error: "Domain required." },
        { status: 400 }
      );
    }

    if (mode !== "live") {
      return NextResponse.json(
        {
          ok: false as const,
          error:
            "Dashboard sample mode is read-only fallback data. Launch a live scan instead.",
        },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false as const, error: "Sign in required." },
        { status: 401 }
      );
    }

    const seat = await getDashboardSeat();
    if (!seat?.clientId || !seat.clientDomain || !seat.ownerUserId) {
      return NextResponse.json(
        { ok: false as const, error: "No dashboard seat is provisioned for this account." },
        { status: 403 }
      );
    }

    if (!seat.canRunScans) {
      return NextResponse.json(
        {
          ok: false as const,
          error: "This seat can view reports but cannot launch scans.",
        },
        { status: 403 }
      );
    }

    if (domain !== seat.clientDomain.toLowerCase()) {
      return NextResponse.json(
        {
          ok: false as const,
          error: `This seat is scoped to ${seat.clientDomain}.`,
        },
        { status: 403 }
      );
    }

    const admin = createServiceRoleSupabase();
    const graphSnapshot = {
      requested_via: "dashboard",
      requested_at: new Date().toISOString(),
      requested_by: user.id,
      keyword,
      citation_targets: citationTargets,
    };

    const { data, error } = await admin
      .from("runs")
      .insert({
        client_id: seat.clientId,
        owner_user_id: seat.ownerUserId,
        graph_snapshot: graphSnapshot,
        snapshot_schema: 1,
        mode: "live",
        confidence: "high",
        low_confidence: false,
        approved: false,
        status: "pending",
        is_sample: false,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { ok: false as const, error: error?.message ?? "Run queue insert failed." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true as const,
      runId: (data as { id: string }).id,
      message:
        "Run queued. It will appear in history after the pipeline completes and the result is approved.",
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false as const, error: String(err) },
      { status: 500 }
    );
  }
}

export async function GET() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, runs: [], error: "Sign in required." },
      { status: 401 },
    );
  }

  const { data, error } = await supabase
    .from("runs")
    .select("*")
    .order("created_at", { ascending: false });

  return NextResponse.json({ ok: !error, runs: data ?? [], error: error?.message ?? null });
}
