# Prompt Goblin — marketing site

> Get found by robots. Stay usable by humans. AI-search visibility & technical SEO.

The public marketing site for **Prompt Goblin** (`Prompt_Goblin™`) — a dark, awwwards-grade
site built with **Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4**, in `web/`.
It ships as a **static export** (`output: 'export'` → `web/out/`) to DigitalOcean App Platform,
**deploy-on-push from `main`** (live on `promptgoblin.io`).

> _History: the original zero-build, Babel-in-browser SPA (`index.html` + `app.jsx` +
> `styles.css`) was retired when the `web/` cutover went live._

## Layout (`web/`)

| Path | What it is |
|------|------------|
| `web/app/` | App Router pages (`/`, `/methodology`, `/learn/aeo-vs-geo`) + `robots`/`sitemap`/icons. |
| `web/components/sections/` | The page sections — Hero · Spellbook · HowItWorks · GoblinMesh · **LiveScan** · Stats · Marquee · IndexNow · Services · Pricing · Contact — each an RSC server shell + minimal `'use client'` island + co-located `*.module.css`. |
| `web/lib/` | `scan-api.ts` (DO Functions client), `analytics.ts` (PostHog), `site.ts`, `faq.ts`, `structured-data.ts`. |
| `web/public/` | Static assets, `llms.txt`, OG image. |
| `functions/` | DigitalOcean serverless scan API (Tier-1 hygiene + Tier-2 Perplexity citation check). |
| `pipeline/` | The agentic LangGraph AEO pipeline (separate repo). |

Conventions for agents live in **`web/AGENTS.md`**.

## Local development

```bash
npm --prefix web install
npm --prefix web run dev     # http://localhost:3010
npm --prefix web run build   # typecheck + static export → web/out/
npm --prefix web test        # vitest
```

## Deploy (DigitalOcean App Platform)

Deploy-on-push: pushing `main` rebuilds `web/` and ships `web/out/`. The DO app component is a
**Static Site** (build `npm run build`, output `out/`).

> _A future client dashboard (Supabase + auth) needs SSR — switching the component to a
> **Node Web Service** — see `specs/dashboard-mvp.md`. That's a separate, owner-gated cutover._

## Related docs
- **`PLAN.md`** — living status + work queue · **`COORDINATION.md`** — multi-agent lanes.
- **`DOCS_PLAN.md`** — documentation plan · **`specs/`** — implementation specs (gate-verified).
- Business plan, pricing, GTM, competitive landscape → Obsidian vault **Prompt Goblin** MOC.
- The agentic AEO pipeline (scan → diff → recommend → human-review → PR) → `pipeline/` + the
  **Prompt Goblin - Agentic AEO Pipeline Master Plan** vault note.
