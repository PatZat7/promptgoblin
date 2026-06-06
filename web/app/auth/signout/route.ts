import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * POST-only sign-out. Clears the session cookie and redirects to /login.
 * GET is rejected to prevent CSRF-style sign-out via <img> or <link>.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    await supabase.auth.signOut();
  } catch {
    // Supabase env not configured — clear is best-effort; still redirect
  }
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(new URL("/login", origin), { status: 302 });
}
