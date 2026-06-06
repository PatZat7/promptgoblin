"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client — uses the publishable anon key.
 * Used ONLY in client islands: LoginForm (signInWithOtp / signInWithOAuth /
 * signOut). Never used for privileged reads; RLS handles access control.
 *
 * If env vars are absent at runtime the client is still created (Supabase
 * handles the missing-URL case gracefully with a clear console error) so the
 * build doesn't hard-fail.
 */
export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  );
}
