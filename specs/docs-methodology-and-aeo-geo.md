# Docs: `/methodology` + `/learn/aeo-vs-geo` content pages

## Goal

Ship the two highest-leverage public content pages from `DOCS_PLAN.md` (items
**1.1** and **1.3**) as real Next.js routes in `web/`:

1. **`/methodology`** — the single public page a prospect, CTO, or AI crawler
   reads to understand exactly what the scan measures, what each finding means,
   what `recon` does, where the human-review gate sits, and — critically — what
   we **do not** claim. This is the trust artifact that closes the DM
   conversation (DOCS_PLAN §1.1: "needed before DM follow-up conversations").
2. **`/learn/aeo-vs-geo`** — a sourced explainer that teaches the AEO/GEO
   distinction, the zero-click crisis, and what actually predicts AI citation
   (topical authority >> domain authority). Citation-bait that makes
   `promptgoblin.io` its own citation target (the dogfood loop), with **every
   stat sourced inline** (DOCS_PLAN §1.3 + §"Honest-broker rules for all docs").

Both pages are **static-export** routes (the `web/` stack is locked to Next 16
`output: 'export'` — see `web/AGENTS.md`), each carrying its own page-level
`metadata` + scoped JSON-LD, both honoring the honest-broker code, both gated
through `integrity-reviewer` before merge, and both shipping to a **deploy-on-push
`main`** — so the work is done on a branch and only merged after owner +
integrity-reviewer sign-off (PLAN.md "⚠️ Deploy note": merging to `main` ships
live).

This spec covers **page structure + copy outline + JSON-LD/SEO + sitemap/nav
wiring + the test plan**. It does not write the final prose (that is the
`copywriter` → `integrity-reviewer` chain); it specifies the slots, the
non-negotiable honest-broker content, the sourced-stat table, and the build/QA
contract the implementer must hit.

---

## Files touched (exact paths + which repo)

**All paths are in the `web` repo** (`C:\Users\atpat\Documents\promptgoblin\web`).
No `functions/`, no `pipeline/`, no root-`index.html` changes — the live site
still builds from root until the Next.js cutover, but these routes are authored
in `web/` so they ship with that cutover (or with `web/` once it is the deploy
target). See Prerequisites.

| Path | Repo | Change |
|---|---|---|
| `web/app/methodology/page.tsx` | web | **New.** Server Component route. `metadata` export + page-scoped JSON-LD + the section composition. `export default` (Next requires it for `page`). |
| `web/app/methodology/Methodology.module.css` | web | **New.** Co-located CSS Module, semantic class names, `var(--token)` colors/fonts (matches the `web/AGENTS.md` styling split). |
| `web/app/methodology/methodology.data.ts` | web | **New.** Typed content data (layer descriptions, finding-type glossary, honest-broker bullets) — the single source for both the rendered page and its JSON-LD, mirroring the `faq.ts` ⇄ `structured-data.ts` dogfood pattern. |
| `web/app/learn/aeo-vs-geo/page.tsx` | web | **New.** Server Component route + `metadata` + page-scoped JSON-LD + sections. `export default`. |
| `web/app/learn/aeo-vs-geo/AeoVsGeo.module.css` | web | **New.** Co-located CSS Module. |
| `web/app/learn/aeo-vs-geo/aeo-geo.data.ts` | web | **New.** Typed content data **including a `SOURCES` array** (every stat → `{ claim, value, source, url, asOf }`) so no number can appear without a citation. Single source for the visible cited-stat table AND the JSON-LD `citation` field. |
| `web/lib/structured-data.ts` | web | **Edit.** Add two **exported helper builders** (`methodologyJsonLd`, `aeoGeoJsonLd`) returning the page-scoped `object[]` (Article/TechArticle + BreadcrumbList; FAQPage where applicable). Keep the existing home `structuredData` export untouched. |
| `web/app/sitemap.ts` | web | **Edit.** Add `/methodology` and `/learn/aeo-vs-geo` URL entries (currently sitemap lists only `/`). |
| `web/lib/site.ts` | web | **Edit (small).** Add a `DOCS`/`LEARN` link list (or extend `NAV`) so the footer/colophon links to the two pages. Keep `NAV` anchor-links to the homepage sections intact. |
| `web/tests/content-pages.spec.ts` | web | **New.** First file under `web/tests/` (none exist yet — `web npm test` today runs the existing 23 unit tests elsewhere; confirm test runner + dir with the implementer). Route-render + metadata + JSON-LD validity + honest-broker copy-guard assertions. See Unit-test plan. |
| `web/components/sections/Faq/Faq.tsx` *(optional, out-of-scope-flag)* | web | Optionally surface a "Read the methodology" link from the existing FAQ schema answer. **Out of scope** unless trivially inline; noted so it is not forgotten. |

**Explicitly NOT touched:** `web/components/system/JsonLd.tsx` (reused as-is — it
already renders one block and escapes `</script>`), `app/robots.ts` (already
`allow: "/"` for `*` + the AI bots; new routes inherit it), the homepage
`page.tsx` and its sections, the root `index.html`, `functions/`, `pipeline/`.

---

## Design

### 0. Routing + rendering model (the constraint that shapes everything)

`web/` is **Next 16 App Router, static export** (`output: 'export'`, `web/AGENTS.md`
"Stack (locked)"). Consequences this spec must respect:

- Each page is a **Server Component** (`web/AGENTS.md`: "Server Components by
  default"). No `'use client'` at the route level. If a page needs an
  interactive leaf later (e.g. a collapsible glossary), it is pushed to the
  smallest island via `children`/props — but **MVP needs no island**: these are
  prose + tables + static diagrams, fully server-renderable. This also keeps the
  **CRT/grain headless-hang** problem out of these routes (see Unit-test plan).
- No `cookies()`/`headers()`/middleware/route handlers (static export forbids
  them). Theme/palette comes from the existing `ThemeScript` + `[data-palette]`
  tokens already in `app/layout.tsx`; the pages just use `var(--token)`.
- `metadata` is a per-page export (the `title` template `"%s · Prompt Goblin"`
  from `layout.tsx` automatically suffixes the page title).
- JSON-LD is rendered by mapping the page-scoped array through the existing
  `JsonLd` component (same call site pattern as `layout.tsx`).

### 1. `/methodology` — structure + copy outline

Server shell reuses the existing primitives (`Panel`/`PanelBar`, `Reveal`,
`grid-lines`, `.btn`) so it reads as the same product, not a bolted-on doc. The
page is a vertical stack of sections; content lives in `methodology.data.ts` and
is rendered by `page.tsx`.

**Page `metadata`:**
```ts
export const metadata: Metadata = {
  title: "Methodology — what the scan measures (and what we don't claim)",
  description:
    "How Prompt Goblin's 4-layer scan works: technical hygiene, schema, " +
    "AI-visibility, and accessibility — what each finding means, the recon " +
    "step, the human-review gate, and the honest-broker limits.",
  alternates: { canonical: "/methodology" },
  openGraph: { type: "article", url: `${SITE.url}/methodology`, /* reuse og-image */ },
};
```

**Section outline (slots — `copywriter` fills the prose):**

1. **Hero / thesis.** One line: "Here's exactly what we measure — and exactly
   what we won't promise." Sub-line ties to the site tagline ("Get found by
   robots. Stay usable by humans.").
2. **The 4-layer scan.** A `layers[]` array in `methodology.data.ts`, one entry
   per layer, each `{ id, num, name, measures, finding, honestNote }`:
   - `technical-hygiene` — crawl path, robots/llms presence, indexability,
     Core Web Vitals signals. (Grounds to `functions/lib/hygiene.js` Tier-1.)
   - `schema` — JSON-LD types present/parseable. **`honestNote` (REQUIRED):**
     "Schema is hygiene, not a citation lever — it lets engines parse you; it
     does not earn a citation." Mirrors `faq.ts` + `structured-data.ts` copy.
   - `ai-visibility` — the 5-surface citation check (ChatGPT/Claude/Gemini/
     Perplexity/Google AIO), competitor citation-graph diff, topical-authority
     **structural signal** (label as structural, never a guarantee — matches the
     `topical-authority-proxy` spec posture).
   - `accessibility` — WCAG 2.1 AA / Section 508 static pre-screen. Honest note:
     a static pre-screen catches ~57% of issues (the disclaimer the pipeline
     already uses); full audit is human-driven.
3. **What each finding means.** A `findingGlossary[]` table: severity
   (HIGH/MED/LOW) + finding kinds (citation gap, schema gap, a11y issue, hygiene
   issue, topical-authority signal, freshness flag, third-party-platform
   absence) → plain-language meaning. Keys align with the pipeline's `Gap.kind`
   vocabulary so the doc and the product speak the same language.
4. **The recon step.** What `recon` auto-discovery does (infers category/topic +
   one-line summary; auto-identifies up to 2 competitors **only when the operator
   passes none**; early tech-stack fingerprint; caches the single homepage fetch).
   **Honest note (REQUIRED):** auto-discovered competitors are a *flagged
   inference the client confirms*, never asserted fact (matches PLAN.md
   2026-06-05 decision + the `recon` honest-broker wording).
5. **The human-review gate.** Every recommended fix halts for a software-engineer
   review before it reaches a client; nothing auto-deploys/auto-sends. Reuse the
   engine narrative from `HowItWorks`/`engine.data.ts` ("halt · awaiting engineer
   approval. nothing auto-ships.").
6. **Honest-broker section (the load-bearing block).** A dedicated, visually
   distinct section enumerating the limits — see "Honest-broker notes" below for
   the exact non-negotiable bullets. This section is the reason the page exists.
7. **CTA.** Link to the free scan (`/#scan`) + summon (`/#contact`). No promised
   number.

### 2. `/learn/aeo-vs-geo` — structure + copy outline

Same primitives. Content + **sources** live in `aeo-geo.data.ts`.

**Page `metadata`:**
```ts
export const metadata: Metadata = {
  title: "AEO vs GEO — the difference, the zero-click crisis, what gets cited",
  description:
    "Answer Engine Optimization vs Generative Engine Optimization: what each " +
    "means, why they differ from classic SEO, the zero-click shift, and what " +
    "actually predicts AI citation (topical authority over domain authority). " +
    "All stats sourced.",
  alternates: { canonical: "/learn/aeo-vs-geo" },
  openGraph: { type: "article", url: `${SITE.url}/learn/aeo-vs-geo` },
};
```

**Section outline:**

1. **Hero / definition split.** AEO = optimizing to be the *answer* in answer
   engines; GEO = being *cited* in generative summaries. One clean two-column
   definition (a `definitions[]` array).
2. **Why they differ from classic SEO.** The "80% of ChatGPT citations don't
   rank in Google's top 100" point — **sourced inline**.
3. **The zero-click crisis.** CTR shift for AI-Overview queries — **sourced
   inline** (DOCS_PLAN §1.3 cites 1.76% → 0.61%; the implementer must verify the
   exact figure + source against the vault research and let `integrity-reviewer`
   confirm before publish; if a number can't be sourced, it is cut, not guessed).
4. **What predicts citation.** `predictors[]` — topical authority (the dominant
   signal) >> domain authority; direct answer in the first ~50 words; HTML
   tables; entity density. Each predictor carries a **`source`** and is framed as
   a **structural correlation, not a guarantee** (the `topical-authority-proxy`
   spec already established "structural signal, never a citation guarantee" — the
   public copy must match).
5. **Cited-stat table.** Render the `SOURCES` array as a visible table
   (`claim · value · source · as-of`) so the citations are on-page, not just in
   JSON-LD — this is itself the AEO move (HTML table + entity density + visible
   provenance) and it lets a reader verify every number.
6. **How Prompt Goblin measures this for you.** Bridge to the methodology page +
   free scan. No proprietary-data claim we don't have (DOCS_PLAN §1.3: "Don't
   inflate numbers or claim proprietary access to data we don't have").

**The `SOURCES` shape (sourcing is enforced by the data type):**
```ts
export type Source = {
  id: string;
  claim: string;     // "80% of ChatGPT citations don't rank in Google's top 100"
  value: string;     // "80%"
  source: string;    // "arXiv:2311.09735" | "Conductor 2026" | "ZipTie.dev"
  url: string;       // canonical link to the source
  asOf: string;      // "2026" — keeps it honest about recency
};
export const SOURCES: Source[] = [ /* every on-page stat, 1:1 */ ];
```
A unit test asserts **every numeric/percentage claim rendered on the page traces
to a `SOURCES` entry** (see Unit-test plan) — making "all stats sourced" a build
invariant, not a reviewer's memory.

### 3. JSON-LD / SEO (per page)

Add to `web/lib/structured-data.ts` (do not touch the existing home
`structuredData` export):

```ts
export const methodologyJsonLd = (): object[] => [
  {
    "@context": "https://schema.org",
    "@type": "TechArticle",          // methodology = technical doc
    headline: "How the Prompt Goblin scan works — methodology",
    description: "...",
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
    url: `${SITE.url}/methodology`,
    inLanguage: "en",
  },
  breadcrumb(["Home", "/"], ["Methodology", "/methodology"]),
  // optional FAQPage if the page carries Q&A slots; DO NOT duplicate the home FAQ
];

export const aeoGeoJsonLd = (): object[] => [
  {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "AEO vs GEO — the difference and what gets cited",
    description: "...",
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    url: `${SITE.url}/learn/aeo-vs-geo`,
    inLanguage: "en",
    // citation -> the real research sources, built from aeo-geo.data SOURCES:
    citation: SOURCES.map((s) => ({
      "@type": "CreativeWork", name: s.claim, url: s.url,
    })),
  },
  breadcrumb(["Home", "/"], ["Learn", "/learn"], ["AEO vs GEO", "/learn/aeo-vs-geo"]),
];
```
- `@type` choice is honest: **TechArticle** for methodology, **Article** for the
  explainer. Both `provider`/`author`/`publisher` = the Organization (a
  **ProfessionalService/Organization**, never Product — consistent with the
  existing graph's comment "As a service business we use ProfessionalService /
  Service / OfferCatalog (never Product)").
- A small shared `breadcrumb(...pairs)` helper avoids repeating the
  `BreadcrumbList` boilerplate; positions are 1-indexed (matches the existing
  home BreadcrumbList).
- `aeoGeoJsonLd` derives its `citation` array from `SOURCES` so the structured
  data and the visible table are the same provenance (dogfood: humans and
  crawlers read the same citations) — and so JSON-LD can never silently carry an
  unsourced claim.
- **Schema-as-hygiene caveat applies to OUR pages too:** these blocks help
  crawlers parse us; they are not asserted to *earn* a citation. The page copy
  says so. (Don't let the explainer about citation become a page that implies
  its own schema guarantees its citation.)

### 4. Sitemap + nav wiring

- `app/sitemap.ts`: add the two URLs (`/methodology`, `/learn/aeo-vs-geo`),
  `changeFrequency: "monthly"`, `priority: 0.7` (home stays `1.0`).
- `lib/site.ts`: add a `DOCS` link array (`{ href: "/methodology", label }`,
  `{ href: "/learn/aeo-vs-geo", label }`) and surface it in the
  footer/colophon. Internal links from the homepage + footer are the cheap
  internal-link signal these pages need to get crawled. (Do not clutter the top
  `NAV`, which is the homepage section anchors.)
- `robots.ts` already allows `/` for `*` + the AI bots — new routes are crawlable
  with no change.

### 5. `public/llms.txt` parity (review trigger, light)

`DOCS_PLAN` makes `llms.txt` a first-class doc target with a review trigger on
"pipeline capabilities / methodology" changes. Adding a public methodology page
is exactly that trigger. **In scope (one line):** add a `## Methodology` /
`## Learn` pointer line to `web/public/llms.txt` (and the root mirror if the
implementer confirms both are served) linking the two new URLs, so AI crawlers
discover them. **Out of scope:** rewriting llms.txt.

---

## Acceptance criteria

- [ ] `web/app/methodology/page.tsx` and `web/app/learn/aeo-vs-geo/page.tsx`
      exist, are **Server Components** (no `'use client'` at route level), and
      `next build` (static export) emits `out/methodology/index.html` and
      `out/learn/aeo-vs-geo/index.html`.
- [ ] Each page exports `metadata` with a **page-specific** `title`,
      `description`, and `alternates.canonical` pointing at its own path.
- [ ] Each page renders its **page-scoped JSON-LD** via the existing `JsonLd`
      component; the JSON parses; `@type` is TechArticle (methodology) / Article
      (explainer); each has a correct `BreadcrumbList`; the home
      `structuredData` export is unchanged.
- [ ] `/methodology` covers all six required topics: the 4-layer scan (with each
      layer's "what it measures" + "what the finding means"), the finding
      glossary, the recon step, the human-review gate, **and** a dedicated
      honest-broker section.
- [ ] `/learn/aeo-vs-geo` covers: the AEO/GEO distinction, why they differ from
      SEO, the zero-click crisis, and the citation predictors (topical authority
      framed above domain authority).
- [ ] **Every numeric/percentage claim** on `/learn/aeo-vs-geo` resolves to a
      `SOURCES` entry with a non-empty `source` + `url` + `asOf` (enforced by a
      unit test). No unsourced number renders.
- [ ] Honest-broker copy present and exact (see Honest-broker notes): schema =
      hygiene; no guaranteed citation number; static-fetch / WAF / JS-render
      blind spot disclosed and "never scored 0"; never "missing Product schema"
      for service/gov; nothing auto-deploys; mock/sample reads as illustrative;
      refund covers the work, not a citation count.
- [ ] `app/sitemap.ts` lists both new URLs; footer/colophon links to both.
- [ ] `web npm run build` passes (0 TS errors, static export succeeds);
      `web npm run lint` passes; existing `web npm test` (23 tests) still green
      plus the new content-page tests.
- [ ] **`qa` axe-core gate: 100/100, 0 contrast violations** on both pages in
      **both palettes** (dark + bone), desktop + mobile — the dogfooded a11y bar
      (CLAUDE.md "Verification"; `qa` agent). AA 4.5:1 small text, `--muted`/
      `--faint` honored.
- [ ] **`integrity-reviewer` APPROVE** recorded before merge (every outbound
      artifact a prospect/public sees is gated — CLAUDE.md gates; DOCS_PLAN
      §"Honest-broker rules").
- [ ] Branch-only until approved; **no merge to `main`** (deploy-on-push ships
      live) without owner + integrity-reviewer sign-off.

---

## Unit-test plan

New file `web/tests/content-pages.spec.ts` (confirm the runner — the repo runs
`web npm test` for 23 existing tests; the implementer wires these into the same
runner / `next build` type-check, no new framework). All tests are
**deterministic, offline, no network, no rendered-animation screenshots.**

**Build / structure (run against `next build` output or by importing the route
modules):**
1. `methodology page exports metadata with canonical /methodology` — assert
   `metadata.alternates.canonical === "/methodology"` and `title`/`description`
   are non-empty and page-specific (not the home defaults).
2. `aeo-vs-geo page exports metadata with canonical /learn/aeo-vs-geo` — same.
3. `static export emits both route html` — after `next build`, assert
   `out/methodology/index.html` and `out/learn/aeo-vs-geo/index.html` exist and
   contain the page `<title>` and an `application/ld+json` block.

**JSON-LD validity:**
4. `methodologyJsonLd is valid + TechArticle + breadcrumb` —
   `JSON.parse(JSON.stringify(...))` round-trips; first block `@type` is
   `TechArticle`; a `BreadcrumbList` block exists with 1-indexed positions; no
   `Product`/`Offer` type leaks in (service-business invariant).
5. `aeoGeoJsonLd is valid + Article + citation derived from SOURCES` — `@type`
   `Article`; `citation.length === SOURCES.length`; every `citation[i].url ===
   SOURCES[i].url`.
6. `home structuredData unchanged` — snapshot/equality guard that the existing
   home graph export still has its 6 blocks and types (regression guard for the
   `structured-data.ts` edit).

**Honest-broker copy guards (the core of this suite — assert against the
`.data.ts` content strings so a future copy edit can't silently drop a
guarantee):**
7. `methodology data states schema is hygiene not a lever` — the schema layer's
   `honestNote` contains "hygiene" AND ("not a citation lever" OR "does not earn").
8. `methodology data discloses the static-fetch blind spot` — some section
   asserts an unreadable/JS-rendered/WAF-blocked site is **flagged, never scored
   0** (regex for "blind spot" + "never" + "0"/"zero").
9. `methodology data never prescribes Product schema for service/gov` — the
   schema/finding copy mentions service/gov sites correctly use Service/Offer/
   OfferCatalog and **does not** tell them to add Product.
10. `methodology data states nothing auto-deploys` — contains "human-reviewed" /
    "nothing auto-ships" / "human-gated".
11. `methodology data refund covers the work not a number` — contains the
    work-not-a-citation-number phrasing (mirror `faq.ts`).
12. `aeo-geo every rendered stat is in SOURCES` — extract every `%`/number token
    from the rendered `predictors`/`definitions`/body strings and assert each is
    present in some `SOURCES` entry's `value`/`claim`. **This is the "all stats
    sourced" invariant.**
13. `aeo-geo predictors are framed as structural, not guarantees` — predictor
    copy contains "structural"/"correlated" and never "guarantee"/"will be
    cited"/"guaranteed citation".
14. `sample/illustrative markers read as illustrative` — if either page reuses
    any sample/demo figure, it carries an `[illustrative]`/`[sample]` marker
    (matches the site-wide convention).

**Playwright / screenshot plan (and the headless-hang caveat):**
- **a11y gate (required):** `qa` runs **axe-core** against both routes in dark +
  bone palettes at 1440 / 768 / 375 — the established gate (100/100, 0
  violations). axe runs against the DOM and **does not require an animated
  pixel-screenshot**, so it is safe.
- **CRT/grain headless-hang caveat → deterministic fallback (carried from PLAN.md
  2026-06-02 decision):** full-page **pixel screenshots hang the headless
  renderer** because of the site's CRT/grain/scanline effects. These two pages
  are **deliberately animation-free at the content level** (no mesh/terminal
  islands), which sidesteps the hang — but the global `Grain`/`Cursor` chrome
  still mounts from `layout.tsx`. Therefore **do NOT rely on animated full-page
  screenshots for verification.** Use the **deterministic eval/inspect fallback**:
  - `mcp__Claude_Preview__preview_inspect` / `preview_eval` for DOM + computed-
    style + text assertions (heading present, JSON-LD block present, link hrefs,
    contrast values), exactly as the mobile-fix work did.
  - If a visual baseline is wanted for the visual-regression queue, capture with
    **`data-grain="off"`** (the documented attribute toggles grain) and the
    reduced-motion path, to a stable name under `web/tests/visual/` — and treat a
    failed/hanging screenshot as a tooling issue to route around via inspect, not
    a page bug.
- No screenshot is a *gate*; the gates are `next build` + lint + unit tests +
  axe + `integrity-reviewer`.

---

## Prerequisites / blocked-on

**Not blocked on owner credentials/resources — implementable AND testable today.**
Everything is static content + JSON-LD + Tailwind/CSS-module styling in `web/`;
no Supabase, no API key, no `doctl`, no live deploy is needed to build, type-
check, lint, axe-test, or unit-test these pages. `next build` static export +
the offline test suite run locally with zero keys. Hence **`blocked = false`**.

Non-blocking dependencies / sequencing:
- **Copy source.** The prose is authored by `copywriter`; this spec provides the
  slots + the mandatory honest-broker strings + the sourced-stat contract. The
  **`integrity-reviewer` gate is a hard merge gate** (not a build blocker): the
  page can be built and tested, but **must not merge to `main`** until
  integrity-reviewer APPROVE + owner sign-off (deploy-on-push = merge ships
  live).
- **Stat sourcing.** Every `/learn/aeo-vs-geo` number must trace to a real
  source (DOCS_PLAN lists arXiv:2311.09735, Conductor 2026, ZipTie.dev as the
  seed sources; the exact CTR 1.76%→0.61% figure and the 80%/topical-authority
  numbers must be verified by `researcher` against the vault research before
  `integrity-reviewer` signs off). Any number that can't be sourced is **cut, not
  guessed**. This is a content prerequisite, not a code blocker.
- **Deploy sequencing (informational).** The live site still builds from root
  `index.html`; `web/` does not deploy yet (PLAN.md "In flight"). These routes
  go live when the **Next.js cutover** points DO App Platform at `web/`. They can
  be merged to `main` on the `web/` branch lineage and will ship with the cutover
  (owner-gated). No new infra.
- **Gate:** `integrity-reviewer` (per task + CLAUDE.md gates). The pipeline
  `graph-keeper` gate does **not** apply (no `pipeline/goblin/` change). `qa`
  runs the axe gate.

---

## Honest-broker notes

These bind the page content (the reason `/methodology` exists is to *state the
limits*). The copy-guard unit tests (7–14) enforce the testable ones; the
remainder are `integrity-reviewer`'s call.

- **Never fabricate metrics, clients, testimonials, or citations.** No number on
  either page that wasn't measured or sourced. `/learn/aeo-vs-geo` stats are
  third-party-sourced inline; `/methodology` makes **no** outcome claims at all.
- **Schema (and llms.txt) is HYGIENE, never a promised citation lever.** Stated
  on `/methodology`'s schema layer and again in the honest-broker section.
  Reinforced for our own pages: the JSON-LD we add helps crawlers parse us; it is
  not asserted to earn us a citation. (Mirrors `faq.ts`, `structured-data.ts`,
  `llms.txt`.)
- **No guaranteed citation number.** Neither page promises a citation count or
  ranking outcome. The real levers (brand mentions + Bing-overlap rank, measured
  over a re-run loop) are described as *worked, not guaranteed*.
- **An unreadable / JS-rendered (SPA) / WAF-blocked site is NEVER scored 0.**
  `/methodology` discloses the **static-fetch blind spot** explicitly: when the
  quick static fetch can't read a page (SPA hydration, Akamai/Cloudflare
  datacenter-IP block, JS-rendered content), we **flag the blind spot**, we do
  not emit a 0 or a fake "shallow" verdict. (This is the rule we caught on our
  own site; grounds to `functions/lib/hygiene.js` `looksLikeBotWall` + the
  `topical-authority-proxy` unknown-not-zero path.)
- **Never tell a service/government site it's "missing Product schema."** The
  schema-layer + finding-glossary copy states service/gov sites correctly use
  Service / Offer / OfferCatalog and Product is flagged **only** on real commerce
  signals. (Grounds to the 2026-06-02 backend false-flag fix.)
- **Nothing auto-deploys / auto-sends.** The human-review-gate section makes the
  "every change halts for engineer approval; nothing auto-ships" promise concrete
  — and this very page ships only after `integrity-reviewer` + owner approval to a
  deploy-on-push `main` (we hold ourselves to the gate we advertise).
- **Mock / sample / demo reads as illustrative.** Any reused sample figure (e.g.
  an example finding) carries an `[illustrative]`/`[sample]` marker; no sample is
  styled to look like a measured client result.
- **The refund guarantees the WORK, never a citation number.** `/methodology`'s
  honest-broker section restates the `faq.ts` guarantee verbatim-in-spirit: 100%
  back on the work, never on a citation count (AI citation share is volatile and
  partly outside anyone's control).
- **Topical authority is a STRUCTURAL signal, not a citation guarantee.** Both
  pages frame it as *correlated structure* (consistent with the
  `topical-authority-proxy` spec); `/learn/aeo-vs-geo` may say "topical authority
  predicts citation better than domain authority" **with the source**, but never
  "topical authority guarantees a citation," and never surfaces an un-measured
  internal figure (e.g. a raw "r=0.41") to a prospect as if it were our published
  result.
- **No proprietary-data claim we don't have.** `/learn/aeo-vs-geo` cites public
  research; it must not imply Prompt Goblin has proprietary benchmark data until
  the `/benchmark` page (DOCS_PLAN §1.4) actually ships that data.

---

## Out of scope

- **Final prose.** This spec defines slots, data shapes, and mandatory strings;
  `copywriter` writes the voice, `integrity-reviewer` approves it.
- **The other DOCS_PLAN pages:** `/pricing` tier-detail expansion (§1.2),
  `/benchmark` (§1.4), client onboarding doc (§2.1), scan-report explainer
  (§2.2), per-stack fix guides (§2.3), and the fabrication-crisis explainer
  (§3.1, explicitly gated on the verification layer). Separate specs.
- **Any pipeline/functions change.** No new scan capability, no `Gap.kind`
  additions, no `recon`/`seo_audit`/`recommend` edits. The pages *describe*
  existing behavior; they do not change it. (`graph-keeper` gate N/A.)
- **A CMS / MDX content system.** MVP is typed `.data.ts` + a Server Component —
  no markdown pipeline, no headless CMS. Revisit if the doc count grows.
- **Interactive islands** (collapsible glossary, animated diagrams) on these
  pages — MVP is static prose + tables to stay server-rendered and dodge the
  CRT/grain headless-hang surface. A later spec can add a minimal `'use client'`
  leaf if needed.
- **The Next.js deploy cutover itself** (pointing DO App Platform at `web/`) —
  that is the separate owner-gated cutover in PLAN.md; these pages ride it.
- **Root `index.html` (legacy live site).** Not edited; it is the
  source-of-truth reference until the cutover, but these pages are authored only
  in `web/`.
- **`/learn/index` hub page.** A `/learn` landing that lists explainers is a
  nice-to-have once there are ≥2 learn pages; deferred (the breadcrumb references
  `/learn` but the MVP need not build a hub route — verify the breadcrumb doesn't
  imply a 404 to crawlers, or point it at `/learn/aeo-vs-geo`).
