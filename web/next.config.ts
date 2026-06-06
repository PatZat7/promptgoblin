import type { NextConfig } from "next";

/**
 * Static export — the marketing site ships as plain HTML/CSS/JS to
 * DigitalOcean App Platform (no Node runtime). Server Components still
 * render at build time; only interactive islands hydrate on the client.
 * See: node_modules/next/dist/docs/01-app/02-guides/static-exports.md
 */
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true }, // required: the default image loader needs a server
  // Emit /route/index.html for static hosts. PRODUCTION ONLY: with trailingSlash
  // on, Turbopack's dev HMR socket (/_next/webpack-hmr) 308-redirects to a
  // trailing-slash URL that WebSocket can't follow, killing hot-reload. The
  // export still gets clean URLs because `next build` runs with NODE_ENV=production.
  trailingSlash: process.env.NODE_ENV === "production",
  devIndicators: false, // hide the dev-only Next.js logo/route indicator (never in the export anyway)
};

export default nextConfig;
