# Dashboard MVP — `app.promptgoblin.io` (Next.js + Supabase)

A client-facing dashboard at **`app.promptgoblin.io`**: log in, see your scan-run
history with score deltas, drill into one run's citation scorecard
(you-vs-competitor, per-platform breakdown, verified/unverifiable/fabricated
counts, scan-proof thumbnails), and work a **human-gated fix queue** where a
recommendation's paste-ready snippet stays locked until a human has reviewed it.

This spec defines **API contracts + RLS policies + component contracts** only —
NOT full implementation. It is the read/render layer over the data the pipeline
already writes; it adds **no scoring, no gap detection, no new measurement**.

> **Scope discipline:** this is a *contracts* spec. Where it names a function,
> field, table, policy, route, or component, that name is the contract. Where it
> shows a body, that body is illustrative shape, not the final code.

## Goal

Give a paying client one honest place to:

1. **Authenticate** (`/login`) — Supabase Auth **magic-link** (passwordless OTP
   email) with **optional Google OAuth**, using **SSR cookie sessions**.
   Unauthenticated requests to any `/dashboard*` route redirect to `/login`;
   an already-authed user hitting `/login` is redirected to `/dashboard`.
2. **Overview** (`/dashboard`) — latest run summary per owned domain, current
   visibility, and the headline "what changed since last run" delta.
3. **Run history** (`/runs`) — every *client-visible* run for the user's
   domain(s), each row showing the **score delta** vs. the prior run.
4. **Run detail** (`/runs/[runId]`) — the citation scorecard for one run:
   you-vs-competitor share, **per-platform (engine) breakdown**, a
   **verified / unverifiable / fabricated** integrity tally, and **scan-proof
   thumbnails** served via short-lived **Supabase Storage signed URLs**.
5. **Fix queue** (`/runs/[runId]/fixes`) — recommendations ranked **HIGH→LOW**,
   behind a **human-approval gate**: a row with `human_reviewed=false` is
   **locked** (no snippet shown / no copy button); approval (`human_reviewed=true`
   **and** `approved=true`) **unlocks the snippet**.
6. **Eval badge** — a verification badge sourced from `verification_results`
   (the pipeline's per-fix re-check), shown on the run and per fix.

Hard constraints that shape everything below:

- **Server-side secrets only.** No `NEXT_PUBLIC_` secret of any kind. The browser
  gets the Supabase **anon key + URL** (both publishable by design) and nothing
  more; every privileged read is mediated by **RLS** under the user's JWT. The
  `service_role` key is used **only** by the pipeline writer and (if needed) a
  server-only signed-URL minter — never shipped to the client bundle.
- **`web/` must leave static export.** The current site is
  `output: 'export'` (see `web/next.config.ts`) — **no server at runtime**, so
  no `cookies()`, middleware, route handlers, or Server Actions. SSR cookie auth
  + RLS + signed URLs are **impossible under static export**. The dashboard
  requires the **web/ cutover to a server runtime** (App Platform Node
  component). This is the top blocker (see Prerequisites).
- **Sample data is labelled `[sample]`** and reads as illustrative until a real
  run exists for that user — never rendered as a real, earned result.

## Files touched (exact paths + which repo)

`multi` — three repos: **`web`** (Next.js dashboard), **`supabase`**
(SQL migrations: schema is owned by the depended-on `supabase-pgvector-schema`
spec; THIS spec owns only the **RLS policies, Storage bucket policy, and
dashboard-read views**), and **`pipeline`** (a tiny writer addition so runs land
in Supabase as the dashboard's source of truth).

> Repo layout note: `web/` and `supabase/` live in **this** repo
> (`promptgoblin/`); `pipeline/` is a **separate nested git repo** at
> `promptgoblin/pipeline/` (gate: `graph-keeper` for any `pipeline/goblin/`
> change).

### `web` (Next.js — the dashboard)

> Prereq: `web/next.config.ts` drops `output: 'export'` for the app subtree (see
> Design §0). New deps: `@supabase/supabase-js`, `@supabase/ssr`.

| Path | Change |
|---|---|
| `web/next.config.ts` | Remove static-export for the dashboard runtime (server component on App Platform). Keep the marketing site static if split; otherwise unify on the Node runtime. |
| `web/middleware.ts` | **New.** Auth gate: refresh the Supabase session cookie and redirect unauthenticated `/dashboard*` + `/runs*` → `/login`; redirect authed `/login` → `/dashboard`. |
| `web/lib/supabase/server.ts` | **New.** `createServerSupabase()` — SSR client bound to request cookies (`@supabase/ssr`), anon key, used by Server Components / route handlers. |
| `web/lib/supabase/client.ts` | **New.** `createBrowserSupabase()` — browser client (anon key) for the client islands that call `signInWithOtp` / `signInWithOAuth` / `signOut`. |
| `web/lib/supabase/signed-urls.ts` | **New, server-only** (`import "server-only"`). `getScanProofSignedUrl(path)` — mints a short-TTL Storage signed URL for a scan-proof thumbnail. |
| `web/lib/dashboard-types.ts` | **New.** TS types mirroring the read views (`RunSummary`, `RunDetail`, `FixRow`, `PlatformBreakdown`, `IntegrityTally`, `EvalBadge`). Mirror pipeline field names exactly. |
| `web/lib/dashboard-api.ts` | **New.** Server-side data accessors: `listRuns(domainId)`, `getRunDetail(runId)`, `listFixes(runId)`, `getEvalBadge(runId)`. Each returns typed data or an honest empty/`[sample]` shape. |
| `web/app/(dashboard)/layout.tsx` | **New.** Authed shell (nav, sign-out, domain switcher); a Server Component that redirects if `getUser()` is null. |
| `web/app/login/page.tsx` + `LoginForm.tsx` (island) | **New.** Magic-link form + optional "Continue with Google"; redirect-if-authed. |
| `web/app/auth/callback/route.ts` | **New.** Route handler: exchange the OAuth/OTP `code` for a session cookie, then redirect to `/dashboard`. |
| `web/app/auth/signout/route.ts` | **New.** POST-only sign-out. |
| `web/app/(dashboard)/dashboard/page.tsx` | **New.** Overview. |
| `web/app/(dashboard)/runs/page.tsx` | **New.** Run history + score delta. |
| `web/app/(dashboard)/runs/[runId]/page.tsx` | **New.** Run detail (scorecard / you-vs-competitor / platform breakdown / integrity tally / proof thumbnails). |
| `web/app/(dashboard)/runs/[runId]/fixes/page.tsx` | **New.** Fix queue (HIGH→LOW, locked/unlocked). |
| `web/components/dashboard/*` | **New.** `RunHistoryTable`, `ScoreDelta`, `CitationScorecard`, `YouVsCompetitor`, `PlatformBreakdown`, `IntegrityTally`, `ScanProofThumb`, `FixQueue`, `FixCard`, `EvalBadge`, `SampleBadge`. |
| `web/e2e/dashboard.spec.ts` | **New.** Playwright auth-gate + render + a11y (axe) + deterministic screenshots. |
| `web/__tests__/dashboard-*.test.ts(x)` | **New.** Vitest unit tests for accessors, RLS-shape mapping, delta math, lock logic, sample-fallback. |
| `web/.env.example` | **New/append.** Document `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (both publishable), and the **server-only** `SUPABASE_SERVICE_ROLE_KEY` (never `NEXT_PUBLIC_`). |

### `supabase` (RLS + Storage + read views — schema is the *other* spec)

| Path | Change |
|---|---|
| `supabase/migrations/<ts>_dashboard_rls.sql` | **New.** Enable RLS + per-table SELECT policies (owner-scoped via `domains.owner_id = auth.uid()`); see Design §3. Depends on tables from `supabase-pgvector-schema`. |
| `supabase/migrations/<ts>_dashboard_views.sql` | **New.** Read views the dashboard queries: `v_run_summary`, `v_run_platform_breakdown`, `v_run_integrity`, `v_fix_queue`. RLS-respecting (`security_invoker = true`). |
| `supabase/migrations/<ts>_scan_proofs_bucket.sql` | **New.** Private Storage bucket `scan-proofs` + a SELECT storage policy scoped to the owner's runs (signed URLs only; no public read). |

### `pipeline` (writer — runs become the dashboard's source of truth)

> Gate: `graph-keeper` (this touches `pipeline/goblin/`).

| Path | Change |
|---|---|
| `pipeline/goblin/nodes/ship_pr.py` | After writing the local `report.json`/`.md`, **optionally** upsert the run into Supabase via the **service-role** client when `settings.supabase_enabled`. No-op (honest skip) when unconfigured — never blocks a local run. Maps the existing report dict → the `runs`/`fixes`/`verification_results` rows. |
| `pipeline/goblin/config.py` | Add `supabase_enabled: bool`, `supabase_url`, `supabase_service_key` (env-driven; default off). |
| `pipeline/goblin/supabase_writer.py` | **New.** Thin, well-tested mapper + upsert (idempotent on `run_id`). Pure mapping function is unit-tested offline; the network call is skipped in mock/tests. |
| `pipeline/tests/test_supabase_writer.py` | **New.** Unit-test the report→rows mapping (offline; no network), incl. the integrity tally and `client_visible` gating. |

**No marketing-site copy changes. No auto-deploy. No auto-send.**

## Design

### 0. Why `web/` must leave static export (the architectural pivot)

The dashboard's three load-bearing features each require a **server at request
time**:

- **SSR cookie sessions** (`@supabase/ssr` + `middleware.ts`) need
  `cookies()`/middleware — unavailable under `output: 'export'`.
- **RLS under the user's JWT** needs the request's auth cookie forwarded to
  Supabase from a server context.
- **Signed URLs** for private scan-proof thumbnails must be minted server-side
  (TTL-limited, per-request) — never baked into a static build.

So the dashboard runs as a **Node server** on DigitalOcean App Platform. Two
viable shapes (decide at cutover, does not change these contracts):

- **(A) Split deploy:** marketing site stays static (`promptgoblin.io`), the
  dashboard is a separate Next server app on `app.promptgoblin.io`. Cleanest;
  keeps the public site's static a11y/perf guarantees intact.
- **(B) Unified server app:** one Next app, marketing routes statically
  generated, dashboard routes dynamic. Simpler infra, but the whole site loses
  the pure-static guarantee.

This spec assumes **(A)** by default (route group `(dashboard)` could also live
in a dedicated app); the data contracts are identical either way.

### 1. Auth (`/login`, middleware, callback)

**Provider:** Supabase Auth. **Methods:** magic-link (`signInWithOtp`, email) +
optional Google OAuth (`signInWithOAuth({ provider: 'google' })`). **Session:**
SSR cookies via `@supabase/ssr` (`createServerClient` / `createBrowserClient`).

- `web/lib/supabase/server.ts` → `createServerSupabase()` reads/writes the auth
  cookie through Next's cookie store; used in Server Components, route handlers,
  middleware.
- `web/lib/supabase/client.ts` → `createBrowserSupabase()` for the `LoginForm`
  island only (the three auth calls + nothing privileged).
- `web/middleware.ts`:
  ```ts
  // pseudo-contract
  const { data: { user } } = await supabase.auth.getUser(); // refreshes cookie
  const path = req.nextUrl.pathname;
  if (!user && (path.startsWith("/dashboard") || path.startsWith("/runs")))
    return NextResponse.redirect(new URL("/login", req.url));
  if (user && path === "/login")
    return NextResponse.redirect(new URL("/dashboard", req.url));
  ```
  `matcher` covers `/dashboard/:path*`, `/runs/:path*`, `/login`.
- `web/app/auth/callback/route.ts`: `exchangeCodeForSession(code)` → redirect to
  `next` (default `/dashboard`). Handles both the OTP magic-link landing and the
  Google OAuth redirect.
- `(dashboard)/layout.tsx` re-checks `getUser()` server-side and redirects to
  `/login` if null (defense-in-depth; middleware is not the only gate).

**Redirect URLs** (must be allow-listed in the Supabase project — owner task):
`https://app.promptgoblin.io/auth/callback` (+ `http://localhost:3010/auth/callback`
for dev).

### 2. Data source of truth: the pipeline report → Supabase rows

The dashboard does **not** call the LangGraph pipeline or the DO scan functions.
It reads **Supabase rows the pipeline already produced**. The mapping is grounded
in the *real* report JSON the pipeline writes today (verified against
`pipeline/out/goblin-acme-com-*.json` — top-level keys `snapshot_schema`,
`domain`, `competitors`, `generated_at`, `mode`, `queries`, `visibility`,
`visibility_by_engine`, `surface_coverage`, `confidence`, `low_confidence`,
`retrieval_grade`, `heal_attempts`, `approved_fixes[]`,
`community_opportunities[]`, `disclaimer`).

**Table mapping (tables owned by `supabase-pgvector-schema`; field names mirror
the pipeline `state.py` / report dict):**

- `runs` — one row per scan run. Columns the dashboard reads:
  `id (run_id)`, `domain_id (fk→domains)`, `generated_at`, `mode`
  (`live`|`mock`), `confidence`, `low_confidence`, `visibility jsonb`
  (`{domain: share}`), `visibility_by_engine jsonb` (`{engine: share}`),
  `surface_coverage jsonb` (`{query: bool}`), `snapshot_schema`, `disclaimer`,
  `client_visible bool`, `score numeric` (the client-visibility score, see §6.1),
  `prev_run_id (fk, nullable)`.
- `fixes` — one row per `approved_fixes[]` entry: `id`, `run_id`, `fix_id`
  (`FIX-NNN`), `title`, `kind`, `rationale`, `impact`, `effort`, `score`,
  `snippet`, `approved bool`, **`human_reviewed bool`** (the gate),
  `engine_lane` (if the per-platform-rec-tagging spec has landed; tolerated
  absent → `both`).
- `verification_results` — one row per pipeline `verifications[]` entry:
  `id`, `run_id`, `fix_id`, `status` ∈
  `{verified, failed, unverifiable, skipped, regressed}`, `verdict`, `detail`,
  `method`, `kind`. (Status vocab is taken verbatim from `state.py` /
  `eval/metrics.py`.)
- `scan_proofs` — `id`, `run_id`, `label`, `storage_path` (object key in the
  private `scan-proofs` bucket), `width`, `height`, `engine`/`surface` (optional
  context). The dashboard never stores a public URL — only the object key, which
  it turns into a **signed URL** at render.
- `domains` — `id`, `owner_id (fk→auth.users)`, `domain`, `display_name`.
  **`owner_id` is the RLS anchor.**

> **`human_reviewed` is the lock.** The pipeline writes fixes with
> `human_reviewed=false` by default. A human flips it (via the existing
> `human_review` interrupt → writer, OR a future admin action — out of scope
> here). The dashboard NEVER writes `human_reviewed`; it only reads it. A fix is
> **unlocked (snippet shown) iff `human_reviewed=true AND approved=true`.**

### 3. RLS — owner-scoped, anon-key-safe

RLS is the *only* thing standing between the browser's anon key and another
client's data. Every dashboard-read table gets RLS **enabled** with a
**SELECT-only** policy anchored on `domains.owner_id = auth.uid()`. No INSERT/
UPDATE/DELETE policy for the anon/authenticated role on any of these tables
(writes are service-role-only, bypassing RLS, done by the pipeline writer).

```sql
-- domains: a user sees only domains they own
alter table public.domains enable row level security;
create policy domains_select_own on public.domains
  for select to authenticated
  using (owner_id = auth.uid());

-- runs: visible iff you own the domain AND the run is client_visible
alter table public.runs enable row level security;
create policy runs_select_own on public.runs
  for select to authenticated
  using (
    client_visible = true
    and exists (select 1 from public.domains d
                where d.id = runs.domain_id and d.owner_id = auth.uid())
  );

-- fixes / verification_results / scan_proofs: visible iff you own the run's domain
alter table public.fixes enable row level security;
create policy fixes_select_own on public.fixes
  for select to authenticated
  using (exists (
    select 1 from public.runs r join public.domains d on d.id = r.domain_id
    where r.id = fixes.run_id and d.owner_id = auth.uid()
      and r.client_visible = true));
-- (identical shape for verification_results, scan_proofs)
```

**Read views** (`security_invoker = true` so RLS still applies through the view):
`v_run_summary`, `v_run_platform_breakdown`, `v_run_integrity`, `v_fix_queue`.
They pre-shape JSON for the dashboard but never widen access beyond the policies.

**Storage policy** (`scan-proofs`, private bucket): a SELECT policy on
`storage.objects` that allows reading an object only when its first path segment
is a `run_id` the user owns:
```sql
create policy scan_proofs_select_own on storage.objects
  for select to authenticated
  using (
    bucket_id = 'scan-proofs'
    and exists (
      select 1 from public.runs r join public.domains d on d.id = r.domain_id
      where d.owner_id = auth.uid()
        and r.id::text = split_part(name, '/', 1)
        and r.client_visible = true));
```
Signed URLs are minted server-side (`getScanProofSignedUrl`) with a short TTL
(e.g. 60s); even the signed URL only works because the *minting* request is
authorized. **No object is ever public.**

### 4. Component contracts (`web/components/dashboard/`)

Server Components render data; `"use client"` only on the smallest interactive
leaves (login form, copy button, domain switcher) — per `web/AGENTS.md`. All
copy honors the honest-broker code (see notes). Contracts (props in → render):

- **`ScoreDelta`** `{ current: number|null; previous: number|null }` → renders
  `▲/▼ Δ` vs prior run, or `New run — no prior baseline` when `previous == null`.
  **Never invents a baseline.** Δ uses the visibility-derived score (§6.1), and
  the label says *visibility delta*, not "citations gained."
- **`RunHistoryTable`** `{ runs: RunSummary[] }` → date · mode badge
  (`live`/`[sample]`/`mock`) · score · `ScoreDelta` · confidence pill
  (`low_confidence` → "low-confidence" pill, never hidden). Empty → empty-state
  CTA, never fabricated rows.
- **`CitationScorecard`** `{ run: RunDetail }` → headline visibility for the
  client domain + `confidence`/`low_confidence` surfaced honestly. If the run was
  **WAF-blocked / unreadable / SPA-only**, render the **blind-spot flag** ("we
  couldn't fully read this site server-side"), **never a 0 score**.
- **`YouVsCompetitor`** `{ client: {domain, share}; competitors: {domain, share}[] }`
  from `visibility`. Competitor shares that came from a *research inference*
  carry the "verify" framing inherited from the report (not asserted fact).
- **`PlatformBreakdown`** `{ byEngine: Record<engine, share> }` from
  `visibility_by_engine` → per-engine (chatgpt/claude/gemini/perplexity) bars.
  An engine that wasn't queried reads `not measured`, not `0%`.
- **`IntegrityTally`** `{ verified: number; unverifiable: number; fabricated: number }`
  → the three-bucket count. **"fabricated" here means "gaps the verify loop
  flagged as not real / regressed"** — it is an *honesty* metric (good = 0), and
  the label/tooltip must say so; it is never a brag number. Sourced from
  `verification_results.status` (`verified`; `unverifiable`+`skipped`;
  `failed`+`regressed`→the "fabricated/unconfirmed" bucket).
- **`ScanProofThumb`** `{ signedUrl: string; label: string; width; height }` →
  thumbnail with `alt` = the honest label. Receives an already-minted signed URL
  from the server; the client never sees the object key or service key. Broken/
  expired URL → graceful "proof expired, refresh" placeholder.
- **`FixQueue`** `{ fixes: FixRow[] }` → fixes sorted **HIGH→LOW by `score`**
  (then `impact` desc, `effort` asc as tie-break), each a `FixCard`. Groups by
  `engine_lane` *only if* that field is present (forward-compat with the
  per-platform-rec-tagging spec).
- **`FixCard`** `{ fix: FixRow }` → title · kind · impact/effort/score · rationale.
  **Snippet gating:** `locked = !(fix.human_reviewed && fix.approved)`.
  - locked → snippet hidden behind a **"Pending human review"** lock state; no
    copy button; explanatory line ("a human reviews every fix before it ships").
  - unlocked → snippet block + copy-to-clipboard (the only client island here).
- **`EvalBadge`** `{ status: EvalBadgeStatus }` where status is derived from the
  run's `verification_results`: `all-verified` | `partly-unverified` |
  `low-confidence` | `not-run`. Each maps to honest copy; **never** a green
  "verified" badge when any fix is `failed`/`regressed` or the run is
  `low_confidence`.
- **`SampleBadge`** `{}` → the literal **`[sample]`** chip; rendered on every
  card/row whose data is sample/mock, so illustrative data can never be mistaken
  for an earned result.

### 5. Accessor contracts (`web/lib/dashboard-api.ts`, server-only)

All accessors run in a Server Component / route handler via
`createServerSupabase()` (RLS applies automatically under the user's JWT):

- `listRuns(domainId): Promise<RunSummary[]>` → from `v_run_summary`, newest
  first, each joined to its `prev_run_id` score for the delta. Returns `[]`
  (→ empty state) when the user has no real runs; the page may then render a
  single clearly-marked `[sample]` row to illustrate the UI.
- `getRunDetail(runId): Promise<RunDetail | null>` → `v_run_summary` +
  `v_run_platform_breakdown` + `v_run_integrity` + `scan_proofs` (object keys).
  `null` when not found / not owned (RLS makes them indistinguishable on purpose).
- `listFixes(runId): Promise<FixRow[]>` → `v_fix_queue`, HIGH→LOW. The accessor
  evaluates `locked = !(fix.human_reviewed && fix.approved)` **server-side** and
  returns **`snippet: null` for every locked fix** — the snippet string is never
  serialized into the response sent to the browser. The `FixCard` component derives
  its lock state purely from `snippet === null` (a locked fix has no snippet to
  render and shows no copy button); the snippet is sent to the browser **only** for
  unlocked fixes (`human_reviewed && approved`). This is the authoritative gate:
  CSS hiding is never relied on, because the locked snippet does not exist in the
  payload.
- `getEvalBadge(runId): Promise<EvalBadge>` → aggregate `verification_results`.
- Signed URLs are resolved in the page (server) via
  `getScanProofSignedUrl(storage_path)` and passed to `ScanProofThumb` as
  ready-to-use URLs.

### 6. Derived values (no new measurement — read-side only)

#### 6.1 Score + delta
The dashboard does not invent a score. It surfaces the **client's
share-of-citations** for the run's own domain from `visibility[clientDomain]`
(0..1, shown as a percentage), and the **delta** = `current − previous` between a
run and its `prev_run_id`. If `prev_run_id` is null → "no prior baseline." The
score column is explicitly a **visibility share**, framed as "measured share of
answer-engine citations," never "guaranteed citations" or a quality grade.

#### 6.2 Integrity buckets
From `verification_results.status`:
`verified` → **verified**; `unverifiable`+`skipped` → **unverifiable**
(kind isn't live-confirmable — honest, not a failure); `failed`+`regressed` →
**fabricated/unconfirmed** (the verify loop could NOT confirm the gap was real or
the fix held — this is the honesty signal, target 0). Tooltip states this exactly.

### Data shapes (TS, `web/lib/dashboard-types.ts`)
```ts
export type Engine = "chatgpt" | "claude" | "gemini" | "perplexity";
export type RunMode = "live" | "mock" | "sample";
export type VerifyStatus = "verified" | "failed" | "unverifiable" | "skipped" | "regressed";

export type RunSummary = {
  runId: string; domain: string; generatedAt: string; mode: RunMode;
  clientShare: number | null;            // visibility[clientDomain]
  prevClientShare: number | null;        // for ScoreDelta
  confidence: string; lowConfidence: boolean;
  isSample: boolean;
};
export type PlatformBreakdown = Partial<Record<Engine, number | null>>; // null = not measured
export type IntegrityTally = { verified: number; unverifiable: number; fabricated: number };
export type FixRow = {
  fixId: string; title: string; kind: string;
  impact: number; effort: number; score: number; rationale: string;
  approved: boolean; humanReviewed: boolean;
  snippet: string | null;                // null when locked (stripped server-side)
  engineLane?: "chatgpt" | "google_aio" | "both";
  isSample: boolean;
};
export type EvalBadgeStatus = "all-verified" | "partly-unverified" | "low-confidence" | "not-run";
export type RunDetail = {
  summary: RunSummary;
  youVsCompetitor: { domain: string; share: number }[];
  byEngine: PlatformBreakdown;
  integrity: IntegrityTally;
  proofs: { label: string; storagePath: string; width: number; height: number }[];
  evalBadge: EvalBadgeStatus;
  blindSpot: null | { reason: "waf" | "unreadable" | "spa"; detail: string };
};
```

## Acceptance criteria

- [ ] `/login` offers magic-link **and** Google OAuth; both complete via
      `/auth/callback` and set an SSR session cookie.
- [ ] Unauthenticated GET of `/dashboard`, `/runs`, `/runs/[id]`,
      `/runs/[id]/fixes` → **302 to `/login`** (middleware) **and** the page's
      own server-side `getUser()` redirect (defense-in-depth).
- [ ] Authenticated GET of `/login` → **302 to `/dashboard`**.
- [ ] **No `NEXT_PUBLIC_` secret** exists; `git grep NEXT_PUBLIC` shows only the
      Supabase URL + anon key (publishable) and the PostHog ingest key. The
      `SUPABASE_SERVICE_ROLE_KEY` appears **only** in server-only modules
      (`import "server-only"`) and never in the client bundle (verified by a
      bundle-grep test).
- [ ] RLS is **enabled** on `domains`, `runs`, `fixes`, `verification_results`,
      `scan_proofs`; a user authenticated as A receives **zero rows** for B's
      domain across every table and view (negative RLS test passes).
- [ ] A run with `client_visible = false` is invisible to its owner via the
      dashboard (pipeline-internal runs never leak).
- [ ] `/runs` lists the user's runs newest-first; each shows a **score delta**
      vs `prev_run_id`, and the first-ever run shows **"no prior baseline,"**
      not a fabricated Δ.
- [ ] Run detail shows you-vs-competitor (`visibility`), per-engine breakdown
      (`visibility_by_engine`, `not measured` for unqueried engines), the
      verified/unverifiable/fabricated tally, and scan-proof thumbnails via
      **signed URLs** (no public object URL anywhere in markup/network).
- [ ] A WAF-blocked / unreadable / SPA-only run renders the **blind-spot flag**,
      **never a 0 score**.
- [ ] Fix queue is ordered **HIGH→LOW**; a `human_reviewed=false` fix is
      **locked** (snippet absent from the DOM *and* from the network payload, no
      copy button); a `human_reviewed=true AND approved=true` fix shows its
      snippet + copy button.
- [ ] The dashboard never writes `human_reviewed`/`approved` (read-only on those
      columns; no UPDATE policy for the authenticated role).
- [ ] Eval badge reflects `verification_results`: it is **not** green-verified
      when any fix is `failed`/`regressed` or the run is `low_confidence`.
- [ ] Every sample/mock datum carries a visible **`[sample]`** badge; no sample
      value is presented as a real, earned result.
- [ ] `npm run build` succeeds for the server runtime; `npm run lint` clean.
- [ ] Vitest suite green; Playwright dashboard spec green (or its deterministic
      fallback — see caveat); **axe = 0 violations** on `/login`, `/dashboard`,
      `/runs`, run detail, fix queue.
- [ ] `pipeline` writer: `supabase_enabled=false` is a clean no-op (local runs
      unaffected); the report→rows mapping unit test passes offline; 186 pytest
      tests + eval gate stay green; **`graph-keeper` review passed**.
- [ ] Gates passed: **integrity-reviewer** (all client-facing copy),
      **qa/axe**, **schema review** (RLS + views + storage policy).

## Unit-test plan

### `web` — Vitest (offline, Supabase client mocked)
1. `listRuns_maps_visibility_to_clientShare` — given a `v_run_summary` fixture
   built from the **real** `goblin-acme-com-*.json` shape, `clientShare ===
   visibility["acme.com"]` and rows are newest-first.
2. `scoreDelta_no_prior_baseline` — `previous == null` → renders "no prior
   baseline," **no numeric Δ**.
3. `scoreDelta_up_and_down` — Δ sign + arrow correct for + / − / 0.
4. `fix_lock_logic` — `humanReviewed=false` ⇒ `locked`, `snippet === null`;
   `humanReviewed=true && approved=true` ⇒ unlocked with snippet; the
   `approved=false` + `humanReviewed=true` edge stays **locked**.
5. `listFixes_strips_locked_snippet` — accessor returns `snippet: null` for
   locked rows (snippet never leaves the server).
6. `fix_queue_ordering` — HIGH→LOW by `score`, tie-break `impact` desc then
   `effort` asc.
7. `integrity_bucketing` — `verified→verified`; `unverifiable`+`skipped`→
   unverifiable; `failed`+`regressed`→fabricated-bucket; tooltip copy asserts the
   honesty framing (good = 0).
8. `eval_badge_not_green_when_failed` — any `failed`/`regressed` OR
   `low_confidence` ⇒ status ≠ `all-verified`.
9. `blind_spot_never_zero` — a WAF/unreadable/SPA run → `blindSpot != null` and
   the score is **rendered as a flag, not `0`**.
10. `platform_breakdown_not_measured` — an engine absent from
    `visibility_by_engine` → `null` → renders "not measured," never "0%".
11. `sample_badge_present` — `isSample` rows render `[sample]`.
12. `no_service_key_in_client_bundle` — build the client entry and assert the
    string `SUPABASE_SERVICE_ROLE_KEY` and its value pattern do not appear; only
    server modules import `signed-urls.ts` / `supabase/server.ts`.

### `supabase` — RLS / policy tests (pgTAP or a Supabase test script)
13. `rls_owner_isolation` — seed two owners; as A, `select` on every table/view
    returns only A's rows, zero of B's.
14. `rls_client_visible_gate` — a `client_visible=false` run is not selectable by
    its owner.
15. `rls_no_write_for_authenticated` — INSERT/UPDATE/DELETE as `authenticated`
    on `fixes`/`runs` is denied (no policy) — confirms `human_reviewed` can't be
    flipped from the client.
16. `storage_signed_url_scope` — the `scan-proofs` SELECT storage policy permits
    only objects under a `run_id` the user owns.
17. `rls_views_enforce_owner_isolation` — seed two owners (A, B). Assert that the
    four dashboard read views — `v_run_summary`, `v_run_platform_breakdown`,
    `v_run_integrity`, `v_fix_queue` — are each created with
    **`security_invoker = true`**, and that, queried as A, every view returns
    **only A's rows and zero of B's** (i.e. the underlying table RLS policies are
    enforced *through* the view, not bypassed by the view owner's privileges).
    Includes the `security_definer` regression guard: if any of the four views is
    (re)created without `security_invoker = true`, this test **fails** — proving
    the views never widen access beyond §3's policies.

### `pipeline` — Vitest-equivalent pytest (offline)
18. `test_report_maps_to_rows` — feed the canonical mock report dict to
    `supabase_writer.map_report(...)`; assert `runs`/`fixes`/`verification_results`
    row shapes, `client_visible` default, and the integrity tally derivation.
19. `test_writer_noop_when_disabled` — `supabase_enabled=false` ⇒ no network,
    returns an honest skip; mock runs and the 186-test suite + eval gate unaffected.

### Playwright + screenshots (`web/e2e/dashboard.spec.ts`)
Auth is faked with a **seeded test session cookie** (a service-role-minted JWT
for a fixture user against a local/preview Supabase) so tests never hit a real
mailbox. Cases:
- `redirects_unauthed_to_login` — visiting `/dashboard` lands on `/login`.
- `authed_sees_runs` — with the seeded cookie, `/runs` lists the fixture's runs +
  deltas; first run shows "no prior baseline."
- `locked_fix_has_no_snippet` — assert the locked `FixCard` has **no** snippet
  text in the DOM and no copy button; the unlocked one does.
- `blind_spot_run_not_zero` — the WAF fixture shows the blind-spot flag.
- `sample_badge_visible` — `[sample]` chip present on sample data.
- **axe**: `@axe-core/playwright` → **0 violations** on `/login`, `/dashboard`,
  `/runs`, run detail, fix queue (matches the site's existing axe gate).
- **Screenshots**: full-page deterministic captures of each route (desktop 1280×800
  + Pixel-7 mobile), reusing the existing `playwright.config.ts` projects. Each
  screenshot case is **named with an explicit pass criterion** (the assertion that
  must hold for the capture to count as passing — the image is evidence, the
  assertion is the gate):
  - `screenshot_login_form_visible` — **passes** when `/login` renders the
    magic-link email input **and** the "Continue with Google" control, both
    visible and enabled, in the captured viewport.
  - `screenshot_run_history_delta_sign_correct` — **passes** when the `/runs`
    capture shows each row's `ScoreDelta` with the correct arrow/sign for its
    `current − previous`, and the first-ever run reads **"no prior baseline"**
    (no fabricated Δ glyph).
  - `screenshot_run_detail_score_and_delta_visible` — **passes** when the run-detail
    capture shows the visibility **share** and its **delta vs `prev_run_id`**
    together (or the blind-spot flag instead of a 0 for a WAF/SPA/unreadable run),
    with the confidence/`low_confidence` pill present.
  - `screenshot_locked_fix_no_copy_button_visible` — **passes** when the fix-queue
    capture shows a `human_reviewed=false` `FixCard` in its **"Pending human
    review"** lock state with **no snippet text and no copy button** anywhere in the
    captured card (and an unlocked card, if present, shows its snippet + copy
    button).
  - `screenshot_fallback_to_dom_snapshot_on_hang` — see the CRT/grain caveat below;
    this is a **named PASS path** (a documented degradation), not a skipped or
    failed case.

> **CRT/grain headless-hang caveat (carried from sibling specs).** The site's
> CRT/grain visual effects can **hang headless Chromium** during Playwright
> screenshot runs. **Deterministic fallback:** force the **reduced-motion path**
> and **disable the CRT/grain layer** (via `prefers-reduced-motion` emulation +
> a `[data-grain=off]` test hook) **before** any screenshot. If a render still
> hangs, the run **does not fail and does not block CI** — instead the named test
> `screenshot_fallback_to_dom_snapshot_on_hang` takes over and **PASSES** by
> asserting on the **serialized DOM (`preview_inspect`/`preview_snapshot`) plus
> the accessor's returned JSON** for the same route: it verifies the same
> load-bearing facts the pixel capture would have (e.g. login controls present,
> delta sign correct, locked fix carries `snippet: null` with no copy affordance)
> against the DOM/JSON rather than the rendered image. This is an explicitly
> **documented degradation that passes**, not a blocker — the pixel image is
> simply unavailable, while the assertion still holds. The functional + a11y + RLS
> assertions (cases 1–19) are the real gate; screenshots are evidence, not the
> gate.

## Prerequisites / blocked-on

**`blocked = true`.** Cannot be fully implemented *and* tested until owner
resources exist:

- **Supabase project provisioning (owner).** A real Supabase project: URL + anon
  key + **service-role key** (server-only), Auth email (magic-link) sender
  configured, Google OAuth client (id/secret) for the optional provider, and the
  `/auth/callback` redirect URLs allow-listed (prod + localhost). No Supabase
  project exists yet — `supabase/migrations/` contains only `.gitkeep`.
- **Depends on the `supabase-pgvector-schema` spec** (the `domains`, `runs`,
  `fixes`, `verification_results`, `scan_proofs` tables + the `pgvector` columns
  the pipeline writes). **That spec is not yet authored** in `specs/` — it must
  land first; this spec owns only the RLS/views/storage-policy + dashboard reads
  on top of it.
- **`web/` cutover deploy (owner + infra).** `web/` is currently
  `output: 'export'` (static, no server). The dashboard requires a **Node server
  runtime** on DigitalOcean App Platform at `app.promptgoblin.io`, plus the
  `app.` DNS record (Cloudflare). Until the cutover, SSR cookie auth + RLS +
  signed URLs cannot run. (Coordinates with the in-flight `promptgoblin.io`
  domain migration.)
- **New web deps:** `@supabase/supabase-js`, `@supabase/ssr` (not yet in
  `web/package.json`).
- **Pipeline writer config (owner):** `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
  in the pipeline's gitignored `.env` for the writer to push real runs. Until
  then the dashboard shows only `[sample]` data (which is the intended honest
  pre-launch state).

**Gates before merge:** `integrity-reviewer` (every client-facing string),
`qa` (axe + Playwright), and **schema review** (RLS policies, views,
storage policy). Pipeline-writer changes additionally require `graph-keeper`.

## Honest-broker notes

- **No fabricated metrics/clients/citations.** Every number shown
  (share, delta, integrity counts) traces to a real `runs`/`verification_results`
  row. With no real run, the dashboard shows **`[sample]`** data, never a
  manufactured client result.
- **Schema + llms.txt are HYGIENE, never a promised citation lever.** Fix cards
  of `kind=schema`/`seo` keep the existing "crawlability hygiene, not a citation
  guarantee" framing; the eval badge and score must not imply "schema → citation."
- **An unreadable / JS-rendered (SPA) / WAF-blocked site is NEVER scored 0.**
  `CitationScorecard` renders the **blind-spot flag** for such runs (we caught
  this on our own site). A 0 is a bug, not a verdict.
- **Never tell a service/gov site it's "missing Product schema."** The dashboard
  only *renders* gaps the pipeline produced; the pipeline already respects
  Service/Offer/OfferCatalog. No new schema assertions are introduced here.
- **Nothing auto-deploys / auto-sends, and nothing auto-approves.** The
  `human_reviewed` lock is load-bearing: a fix's snippet is hidden — *and not
  even sent to the browser* — until a human has reviewed it. The dashboard is
  read-only on the approval columns.
- **`[sample]` reads as illustrative.** The `SampleBadge` chip is mandatory on
  every sample/mock card and row; sample data can never be mistaken for an earned
  pass.
- **The integrity "fabricated" bucket is an HONESTY metric, not a brag.** It
  counts gaps the verify loop could not confirm (target 0); the label/tooltip
  must say so, never spun as a positive count.
- **The refund guarantees the WORK, never a citation number.** No dashboard
  surface promises a citation count or a guaranteed delta; the score is an
  honest *measured share* with a confidence pill, and `low_confidence` runs say
  so plainly.
- **Server-side secrets only.** RLS is the security boundary for the anon key;
  the service-role key never reaches the client. A bundle-grep test enforces it.

## Out of scope

- The **pgvector schema / table definitions** themselves (owned by
  `supabase-pgvector-schema`) — this spec only adds RLS, views, storage policy,
  and the read layer on top.
- **Mutating** anything from the dashboard: approving fixes, flipping
  `human_reviewed`, editing snippets, re-running scans, or triggering the
  pipeline. (Approval stays in the pipeline's `human_review` interrupt; an admin
  approval UI is a future, separately-gated spec.)
- **Billing / subscription / refund** flows and any payment surface.
- **Real-time** updates (Supabase Realtime), notifications, or email digests.
- **Multi-seat / org / team** roles — MVP is one owner per domain
  (`owner_id = auth.uid()`).
- **The DigitalOcean App Platform deploy mechanics / DNS cutover** themselves
  (owner/infra task; this spec depends on them but does not perform them).
- **Marketing-site (`promptgoblin.io`) copy or layout** changes.
- **Per-engine lane rendering** beyond opportunistically grouping by
  `engine_lane` when present — the lane taxonomy is owned by the
  `per-platform-rec-tagging` spec.
- **Surfacing community opportunities** in the dashboard (the report carries
  `community_opportunities[]`, but the human-post-only workflow is a separate,
  separately-gated surface).
