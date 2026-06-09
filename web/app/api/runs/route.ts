import "server-only";

import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import type { RunDetail } from "@/lib/dashboard-types";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const domain = String(form.get("domain") || "").trim();
    const mode = String(form.get("mode") || "live");
    const keyword = String(form.get("keyword") || "").trim();
    const citationTargetsRaw = String(form.get("citation_targets") || "");

    if (!domain) return NextResponse.json({ ok: false, error: "Domain required" }, { status: 400 });

    const supabase = await createServerSupabase();

    const payload = {
      domain,
      mode: mode === "sample" ? "sample" : "live",
      keyword,
      citation_targets: citationTargetsRaw
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    };

    const { data, error } = await supabase
      .from("runs")
      .insert({
        ...payload,
      })
      .select("*")
      .single();

    if (error || !data)
      return NextResponse.json(
        { ok: false as const, error: error?.message ?? "insert failed" },
        { status: 400 }
      );

    const runId = (data as Record<string, string>).id;
    return NextResponse.json({ ok: true as const, runId });
  } catch (err) {
    return NextResponse.json({ ok: false as const, error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("runs")
    .select("*")
    .order("created_at", { ascending: false });

  return NextResponse.json({ ok: true, runs: data ?? [] });
}
