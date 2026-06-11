import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Called by the /auth/confirm interstitial after the user clicks "Sign in".
 * Uses verifyOtp with token_hash, not exchangeCodeForSession, so mail scanners
 * cannot consume the token with a bare GET request.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      token_hash?: unknown;
      type?: unknown;
    };

    if (typeof body.token_hash !== "string" || body.type !== "magiclink") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash: body.token_hash,
    });

    if (error) {
      // Don't leak internal verifyOtp detail (token format/expiry) to the client.
      console.error("[auth/confirm] verifyOtp failed:", error.message);
      return NextResponse.json(
        { error: "Invalid or expired link. Please request a new sign-in link." },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      redirect: "/dashboard",
    });
  } catch {
    return NextResponse.json({ error: "Confirmation failed" }, { status: 500 });
  }
}
