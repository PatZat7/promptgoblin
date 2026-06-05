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
  trailingSlash: true, // emit /route/index.html — friendliest for static hosts
  devIndicators: false, // hide the dev-only Next.js logo/route indicator (never in the export anyway)
};

export default nextConfig;
