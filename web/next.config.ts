import type { NextConfig } from "next";

/**
 * SSR / Node runtime — static export is REMOVED to enable dashboard SSR.
 *
 * Architectural note: `output: 'export'` is intentionally absent.
 * The dashboard at /dashboard*, /runs*, /login needs:
 *   - middleware.ts (auth cookie refresh + redirects)
 *   - cookies() / Server Components with per-request data
 *   - Supabase RLS under the user's JWT
 *   - Server-side signed URL minting for scan proofs
 * None of these are available under static export. All marketing pages
 * (/, /learn/*, /methodology) continue to work fine under the Node runtime
 * — they simply render as dynamic routes (still server-rendered to HTML).
 *
 * Deploy impact: DO App Platform must be reconfigured from "Static Site"
 * to "Web Service (Node)" before merging to main. This is a human-gated
 * infra change — see PLAN.md Prerequisites. Do NOT merge to main until
 * the DO component type is switched.
 */
const nextConfig: NextConfig = {
  // No `output: 'export'` — Node server runtime required for dashboard SSR.
  images: { unoptimized: true },
  // trailingSlash removed: static-host workaround not needed under SSR.
  devIndicators: false,
};

export default nextConfig;
