import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * OAuth/OTP magic-link callback.
 * Exchanges the `code` query param for a session cookie, then redirects to
 * `next` (default: /dashboard). Handles both:
 *   - Magic-link OTP email landing
 *   - Google OAuth redirect
 *
 * Supabase dashboard → Authentication → URL Configuration (owner task):
 *   Site URL:        https://promptgoblin.io
 *   Redirect URLs:   https://promptgoblin.io/auth/callback
 *                    https://promptgoblin.io/**
 *                    http://localhost:3010/auth/callback   (local dev)
 * The dashboard ships on the APEX (promptgoblin.io), NOT app. — if these aren't
 * allow-listed, Supabase ignores emailRedirectTo and falls back to Site URL.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    try {
      const supabase = await createServerSupabase();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        // Redirect to the intended destination (or /dashboard)
        const redirectTo = new URL(next, origin);
        // Safety: only allow same-origin redirects
        if (redirectTo.origin === origin) {
          return NextResponse.redirect(redirectTo);
        }
      }
    } catch {
      // Supabase env not configured — fall through to error redirect
    }
  }

  // Auth failed or code missing — redirect to login with error
  const errorUrl = new URL("/login", origin);
  errorUrl.searchParams.set("error", "auth_callback_failed");
  return NextResponse.redirect(errorUrl);
}
