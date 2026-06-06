import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * SSR Supabase client — reads/writes the auth cookie through Next's cookie
 * store. Use in Server Components, route handlers, and middleware.
 *
 * Guards: if env vars are absent (pre-provisioning) the function throws a
 * clear error rather than silently passing an unconfigured client.
 * The build does NOT crash on missing vars — only runtime calls do — because
 * this module is never imported at build evaluation time (only inside async
 * RSC/handler bodies).
 */
export async function createServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      "[Supabase] NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required. " +
        "Add them to web/.env.local (see .env.example)."
    );
  }
  const cookieStore = await cookies();
  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // setAll is called from a Server Component — cookie mutation is only
          // possible in middleware or route handlers; the try/catch prevents a
          // crash when called from an RSC (the session refresh still works from
          // middleware).
        }
      },
    },
  });
}
