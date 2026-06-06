import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Auth-gate proxy (Next.js 16: renamed from middleware → proxy).
 * - Refreshes the Supabase session cookie on every matched request.
 * - Unauthenticated → /dashboard* | /runs* redirect to /login.
 * - Authenticated  → /login redirect to /dashboard.
 *
 * This is the first gate; (dashboard)/layout.tsx adds a second server-side
 * getUser() check as defense-in-depth.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase is not yet configured, allow all requests through so the
  // marketing site and build continue to work. Dashboard pages will show their
  // own "not configured" state.
  if (!url || !anon) {
    return response;
  }

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh session — getUser() validates the JWT server-side (not just reads cookie)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Unauthenticated → protected route: redirect to /login
  if (
    !user &&
    (path.startsWith("/dashboard") || path.startsWith("/runs"))
  ) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated → /login: redirect to /dashboard
  if (user && path === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/runs/:path*", "/login"],
};
