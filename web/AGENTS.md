<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Prompt Goblin — `web/` (public site)

The marketing site, rebuilt as a modern Next.js app. Shared by Claude Code and
Codex — both read this file. Honor the repo-root `CLAUDE.md` **honest-broker
code** (never fabricate metrics; schema is hygiene, not a citation lever; never
flag a service/gov site for "missing Product schema"; nothing auto-ships).

## Stack (locked)
- **Next.js 16** App Router · **React 19** · **TypeScript** (strict)
- **Node/SSR runtime** (deploys as a DigitalOcean App Platform **Web Service**,
  `npm run start`). `output:'export'` was **removed** (2026-06-08) so the
  dashboard (#5) can use `cookies()`/route handlers/SSR — required for Supabase
  cookie auth, RLS under the user JWT, and signed URLs. **Do NOT re-add
  `output:'export'`** — it breaks the dashboard and the deploy. The DO spec is a
  Node service in `.do/app.yaml`, not a `static_sites` block.
- **Marketing routes still prerender to static HTML** (SSG) inside the Node app
  — keep them server-componenty + statically renderable; only `/dashboard`,
  `/runs*`, `/login`, `/auth/*` are dynamic. Public-site client data still hits
  the DigitalOcean scan functions over `fetch`.
- **Tailwind CSS v4** (CSS-first `@theme inline`) + **co-located CSS Modules**
- **Zustand** (factory + Context provider) for global UI prefs
- Turbopack is the default bundler — no flags.

## Conventions
- **Arrow functions + functional components**, named exports. `export default`
  only where Next requires it (`page`, `layout`).
- **Server Components by default.** Add `"use client"` only on the smallest
  interactive leaf (animation, an input, a toggle, anything touching
  `window`/`localStorage`). Push it as far down the tree as possible; pass
  server-rendered content into client islands via `children`/props.
- **Readable names** everywhere — `goblinMesh`, `stepTitle`, not `sr-2`/`mnode`.
- **Styling split:**
  - Design tokens + base reset + truly-global chrome (`.os`, `.grain`) live in
    `app/globals.css`. Tokens are CSS vars on `:root`, overridden per
    `[data-palette]`, and mapped to Tailwind utilities via `@theme inline`
    (so `bg-bg`, `text-fg`, `border-line`, `text-lime`, `font-mono` stay
    palette-reactive).
  - Everything else is a co-located `Component.module.css` next to its `.tsx`,
    with semantic class names, using `var(--token)` for colors/fonts.
  - Reach for Tailwind utilities for layout/spacing; reach for a module when a
    component has real structure or stateful/animated styles.
- **Theme/prefs:** `lib/ui-store.ts` (Zustand vanilla factory) →
  `components/providers/UiStoreProvider.tsx` (provider + `useUiStore` hook).
  Prefs mirror to `data-*` on `<html>` + `localStorage`. The no-flash restore
  is `components/system/ThemeScript.tsx` (blocking inline script in `<head>`).
- **JSON-LD / metadata:** structured data in `lib/structured-data.ts`, rendered
  by `components/system/JsonLd.tsx` (native `<script>`, not `next/script`).
  Page `<head>` tags via the `metadata` export.
- **a11y:** WCAG 2.1 AA is the product — keep contrast ≥4.5:1, visible focus,
  full keyboard, and a `prefers-reduced-motion` path for every animation.

## Layout
```
app/                  layout.tsx · page.tsx · globals.css · fonts.ts
components/
  sections/<Name>/    <Name>.tsx (server shell) + island(s) + .module.css + .data.ts
  ui/                 reusable primitives (Panel, GoblinHead, …)
  hud/                top/bottom status bars
  system/             ThemeScript · JsonLd · Grain
  providers/          UiStoreProvider
lib/                  ui-store.ts · site.ts · structured-data.ts
```
Reference section to copy: **`components/sections/GoblinMesh/`** — server shell
(`GoblinMesh.tsx`) renders static panel + steps; the animated diagram is the one
client island (`MeshCanvas.tsx`).

## Commands
- `npm run dev` — dev server (port 3010 via `.claude/launch.json`)
- `npm run build` — typecheck + static export to `out/`
- `npm run lint` — ESLint (flat config; `next lint` is removed in 16)
