# Prompt Goblin — Master TODO (Living)

> **Source of truth** for cross-agent coordination. Tracks *all* in-flight + queued work across auth, SEO/AEO, dashboard, pipeline, marketing, and infrastructure. Updated by the main thread; subagents read this to claim work.
>
> **Convention**: `✅` = done + verified; `🟡` = in progress (claimed); `⬜` = queued; `🔴` = blocked; `🟣` = research/design needed.
>
> **Last sync**: 2026-06-09 (Hermes session)

---

## 1. Authentication & Account Provisioning (Production-Ready)

### 1.1 Core Auth Infrastructure
| ID | Task | Status | Owner | Notes |
|---|---|---|---|---|
| A-01 | Magic-link email + Google OAuth login flow | ✅ | web | `/login` + `/auth/callback` + `/auth/signout` live; SSR cookies via `@supabase/ssr` |
| A-02 | Dashboard route protection (middleware) | ✅ | web | `(dashboard)/layout.tsx` redirects unauthenticated → `/login` |
| A-03 | Seat-based access control (`client_memberships`) | ✅ | supabase | Migrations `0013` + `0014` applied live; RLS widened for members |
| A-04 | Dashboard nav with seat label + tier | ✅ | web | `DashboardNav.tsx` shows `seatLabel`, `canRunScans`, `canReview` |
| A-05 | Tier-gated scan launch API (`/api/runs`) | ✅ | web | Checks `seat.canRunScans` + domain scoping + `approved=false` init |
| A-06 | **Stripe webhook → auto-provision account** | ⬜ | web/functions | **MISSING** — `app/api/webhooks/stripe/route.ts` needed. On `checkout.session.completed`: create user via service role, upsert `clients` + `client_memberships` (admin, tier3), send magic-link welcome email via Resend |
| A-07 | **Login button → modal on public site** | ⬜ | web | Header CTA should open a modal (not redirect) with `LoginForm` island |
| A-08 | **Post-checkout profile completion** | ⬜ | web | After first login, prompt 2–4 Q survey (Role, Company Size, ICP) → save to `profiles` table |
| A-09 | **Google OAuth + custom sender config** | ⬜ | infra | Supabase project settings: enable Google provider, set `goblins@promptgoblin.io` via Resend/Postmark SMTP |
| A-10 | **Secret rotation (exposed keys)** | 🔴 | infra | **BLOCKER** — rotate Stripe `sk_live_*` + DB password before any new deploy automation |

### 1.2 Email & Transactional Infrastructure
| ID | Task | Status | Owner | Notes |
|---|---|---|---|---|
| A-11 | Provision Resend/Postmark account | ⬜ | infra | Developer-centric transactional mailer (not Zoho) |
| A-12 | Configure DNS (SPF/DKIM/DMARC) at Cloudflare | ⬜ | infra | Append to existing Zoho records; no conflict |
| A-13 | Enable Custom SMTP in Supabase Auth | ⬜ | infra | Settings → Auth → Providers → SMTP → paste Resend creds |
| A-14 | Whitelist redirect URLs in Supabase | ⬜ | infra | `https://promptgoblin.io/auth/callback`, `http://localhost:3010/auth/callback` |
| A-15 | Branded welcome email (magic link) | ⬜ | web/email | React Email template matching neo-brutalist aesthetic |
| A-16 | Branded scan-report email (already designed) | ✅ | email | `email-templates/scan-report.html` — verify styling in live send |

### 1.3 Stripe Integration
| ID | Task | Status | Owner | Notes |
|---|---|---|---|---|
| A-17 | Stripe Checkout/Pricing Table with prefilled email | ✅ | web | Pricing page uses Stripe Payment Links (live, monthly) |
| A-18 | Stripe webhook signature verification | ⬜ | web | `stripe.webhooks.constructEvent` against `STRIPE_WEBHOOK_SECRET` |
| A-19 | Idempotent `checkout.session.completed` handling | ⬜ | web | Upsert user/client/membership; `approved=false` by default |
| A-20 | Stripe Customer Portal for billing self-serve | ⬜ | web | Route past_due/canceled users to portal on login |

---

## 2. SEO / AEO / GEO — Dogfood Loop (Priority: Fix Before Marketing)

### 2.1 Pipeline Accuracy Fixes (Blocker for Trust)
| ID | Task | Status | Owner | Notes |
|---|---|---|---|---|
| S-01 | Recon uses homepage facts first (not live research) | ⬜ | pipeline | Current scan mislabels Prompt Goblin as "AI prompt utility" |
| S-02 | Clean LLM preambles/numbering from query expansion | ⬜ | pipeline | Malformed queries enter retrieval → bad competitors |
| S-03 | Reject bogus competitor domains (e.g., urbandictionary.com) | ⬜ | pipeline | Validation step: must be direct competitor, not generic reference |
| S-04 | Report includes recon profile + platform-presence assumptions | ⬜ | pipeline | Auditability: bad rec → traceable to bad recon |
| S-05 | **Re-run live scan after fixes + verify recommendations** | ⬜ | pipeline | Only accept recs that improve real levers (brand mentions, Bing rank, crawlable answer content, a11y) |

### 2.2 Content Target Pages (from term map)
| ID | Task | Status | Owner | Notes |
|---|---|---|---|---|
| S-06 | `/learn/how-to-show-up-in-chatgpt` | ⬜ | web | Direct 40–60 word answer → comparison table → FAQ → "what this doesn't guarantee" |
| S-07 | `/learn/bing-rank-and-ai-citations` | ⬜ | web | Covers IndexNow, Bing Webmaster Tools, citation layer |
| S-08 | `/learn/technical-seo-for-ai-search` | ⬜ | web | Server-rendered HTML, headings, direct answers, tables, FAQ |
| S-09 | `/learn/accessibility-seo-audit` | ⬜ | web | WCAG 2.1 AA as SEO lever for AI crawlers |
| S-10 | `/docs/bing-webmaster-tools` (public route) | ⬜ | web | Internal guide exists at `docs/bing-webmaster-tools-submission-guide.md` |
| S-11 | `/benchmark` (quarterly citation landscape report) | ⬜ | pipeline/web | Needs 10–20 pipeline runs per vertical first |

### 2.3 Search Engine Submission Hygiene
| ID | Task | Status | Owner | Notes |
|---|---|---|---|---|
| S-12 | Google Search Console: verify + submit sitemap | ⬜ | infra | `sitemap.ts` generates; submit in GSC |
| S-13 | Bing Webmaster Tools: verify + submit sitemap | ⬜ | infra | Same sitemap; Bing powers partner citation layer |
| S-14 | Enable IndexNow with real key | ⬜ | infra | POST changed URLs on every deploy; validate via `api.indexnow.org/check` |
| S-15 | Submit changed URLs via IndexNow on every publish | ⬜ | infra | Automate in deploy pipeline or post-build script |

### 2.4 Authority & Citation Building
| ID | Task | Status | Owner | Notes |
|---|---|---|---|---|
| S-16 | Create G2 / Capterra profiles | ⬜ | marketing | Third-party platform presence = citation signal for B2B SaaS |
| S-17 | Guest posting plan (SEMrush guide) | 🟣 | marketing | Research targets → pitch → publish → track backlinks |
| S-18 | Get first quality backlinks | ⬜ | marketing | G2/Capterra + guest posts + partner mentions |
| S-19 | Track: Bing index-growth rate, crawl error diff WoW, citation target presence | ⬜ | pipeline | Measurement loop in dogfood plan |

---

## 3. Dashboard — Client-Facing Features

### 3.1 Run History & Scan Management
| ID | Task | Status | Owner | Notes |
|---|---|---|---|---|
| D-01 | `/runs` list page (timestamp, status, score delta) | ⬜ | web | Skeleton exists (`page.tsx`); needs data + UI |
| D-02 | Run detail view (`/runs/[runId]`) — full snapshot | ⬜ | web | `graph_snapshot` + score columns + `citation gap count` + platform breakdown |
| D-03 | "Run your own scan" button on dashboard | 🟡 | web | API exists (`POST /api/runs`); needs UI + tier-gating (tier2/3 only) |
| D-04 | Auto Tier-2 scan on account creation | ⬜ | pipeline/web | Provision → enqueue full pipeline run (not just Tier-2 function); `approved=false` |
| D-05 | Scan visual proof artifacts (Playwright screenshots) | ⬜ | web/qa | Before/after of terminal + results card on 3 viewports per run |

### 3.2 Fix Queue & Approval UI
| ID | Task | Status | Owner | Notes |
|---|---|---|---|---|
| D-06 | Approval UI (human gate for recommendations) | ⬜ | web | `approvals/` route exists; needs list + approve/reject + `human_reviewed` toggle |
| D-07 | Fix queue: prioritized (HIGH→MED→LOW) with stack-specific snippets | ⬜ | web | `recommendations` table → UI with status chips (pending/approved/implemented/verified) |
| D-08 | Eval status badge per run (PASS/FAIL + which checks) | ⬜ | web | From `verification_results` table |
| D-09 | Sample data clearly marked (`[sample]` chip + CTA) | ⬜ | web | Until real run exists for client |

### 3.3 Report Delivery & Styling
| ID | Task | Status | Owner | Notes |
|---|---|---|---|---|
| D-10 | Verify emailed scan styling (HTML email renders in Gmail/Outlook/Apple) | ⬜ | email | Send test via Resend; check dark/light mode |
| D-11 | Dashboard report shows code snippets + fixes per stack | ⬜ | web | Next.js `metadata`/`JsonLd`, WP `functions.php`/Yoast, Shopify Liquid, etc. |
| D-12 | Prove full report flow: scan → pipeline → approve → email → dashboard | ⬜ | qa | End-to-end test with real domain |

---

## 4. Public Site UX & Conversion

### 4.1 CTA & Summon Flow
| ID | Task | Status | Owner | Notes |
|---|---|---|---|---|
| P-01 | Replace redirect-style summon with in-page email reveal | ⬜ | web | "Cool transition" — email field appears inline, not redirect to `/#summon` |
| P-02 | Prioritize pricing cards + "Unleash the Goblins" primary CTA | ⬜ | web | Funnel: scan → results → pricing CTA (not just email capture) |
| P-03 | Hero sub-line + primary CTA alignment | ✅ | web | "Get found by robots. Stay usable by humans." + pricing anchor |

### 4.2 Performance & SSR
| ID | Task | Status | Owner | Notes |
|---|---|---|---|---|
| P-04 | Fix blink on site load (SSR optimization) | ⬜ | web | Check hydration mismatch, `next/font`, blocking scripts |
| P-05 | Performance audit (Lighthouse + Web Vitals) | ⬜ | qa | Target: 90+ perf, 100 a11y, 100 SEO, 100 best practices |

---

## 5. Pipeline — Competitor Research Agent

| ID | Task | Status | Owner | Notes |
|---|---|---|---|---|
| PL-01 | Web-search research agent for direct competitors | ⬜ | pipeline | `walgreens.com` → surfaces CVS/Rite Aid/Walmart Pharmacy, not generic health |
| PL-02 | Competitor validation step (explicit always wins; auto-cap at 2) | ✅ | pipeline | Already implemented in `recon` node (2026-06-05) |
| PL-03 | Map `icp_segment` → `platform_checklist` (G2/Capterra for B2B, etc.) | ⬜ | pipeline | Third-party presence check from research |

---

## 6. Marketing Asset Generation Pipeline

| ID | Task | Status | Owner | Notes |
|---|---|---|---|---|
| M-01 | Research: where to post, what to post, content angles | 🟣 | marketing | Reddit, LinkedIn, X, industry blogs, newsletters |
| M-02 | Set up design system (tokens, components, brand guidelines) | ⬜ | design | Prerequisite for visual asset automation |
| M-03 | Text draft generation pipeline (LLM + human review) | ⬜ | marketing | Never auto-post; approval gate mandatory |
| M-04 | Visual asset generation (after design system) | ⬜ | design | Figma/Codex → automated export pipeline |

---

## 7. Documentation & Knowledge

| ID | Task | Status | Owner | Notes |
|---|---|---|---|---|
| DOC-01 | `llms.txt` — keep current with pricing/capabilities | ✅ | web | Updated 2026-06-05; review on every tier/price change |
| DOC-02 | Pipeline README (node order + `recon` node) | ⬜ | pipeline | Needs pass |
| DOC-03 | Functions README (Tier-1/Tier-2 API contract, SSRF guard, CORS) | ⬜ | functions | Needs creation |
| DOC-04 | Client onboarding doc (day-1 expectations) | ⬜ | copywriter | Before first client |
| DOC-05 | Scan report explainer (finding types, severity, AI-prompt artifact) | ⬜ | copywriter | Before first report |
| DOC-06 | Fabrication crisis explainer (`/learn/ai-citation-hallucinations`) | ⬜ | researcher/copywriter | **Wait for verification layer** — don't publish until product backs claim |

---

## 8. Infrastructure & Secrets

| ID | Task | Status | Owner | Notes |
|---|---|---|---|---|
| I-01 | **Rotate exposed secrets (Stripe `sk_live_*` + DB password)** | 🔴 | infra | **HIGH-RISK BLOCKER** — do before any CI/CD wiring |
| I-02 | Audit `NEXT_PUBLIC_` prefixes (no secrets in client bundle) | ✅ | web | Verified in PLAN.md |
| I-03 | DigitalOcean MCP for Claude/Hermes (per vault note) | ⬜ | infra | Add `@digitalocean/mcp` via `npx` to `~/.hermes/config.yaml` → restart |
| I-04 | Push pipeline repo (local `master` ahead by ~6 commits) | ⬜ | pipeline | Task (b) + Product-schema fix not pushed to origin |
| I-05 | Email DNS at Cloudflare (Zoho free plan for `goblins@promptgoblin.com`) | ⬜ | user | MX mx/mx2/mx3.zoho.com; SPF; DKIM `zmail._domainkey`; DMARC `_dmarc` p=none |

---

## 9. Quality Gates (Non-Negotiable)

| Gate | Command | Must Pass Before |
|---|---|---|
| Pipeline | `cd pipeline && .venv\Scripts\python.exe -m pytest -q && .venv\Scripts\python.exe -m goblin.eval` | Any `pipeline/goblin/` merge, "pipeline green" claim |
| Functions | `cd functions && npm test` | Any functions redeploy, `doctl serverless deploy` |
| Web | `cd web && npm test && npm run build` | Any public-site/UI merge to `main` |
| Visual Regression | Playwright MCP screenshots (1440/768/375) + `axe` 100/100 | Any public-site or dashboard UI change |
| Honest-Broker | No fabricated metrics; schema=hygiene hedges; refund=work not citations | Every outbound artifact (site, email, report, DM) |

---

## 10. Coordination Board (from `COORDINATION.md`)

| Agent | Lane | Current Focus |
|---|---|---|
| **Codex (you)** | Integrator + Implementation | Merge to `main`; implement `functions/` · `web/` · `pipeline/goblin/`; integrate Hermes migrations |
| **Claude** | Specs + Review | Proposes specs; reviews PRs; records decisions in `feedback/claude/` |
| **Hermes** | Vault + Migrations | Authors migration SQL; maintains Obsidian vault; records in `feedback/hermes/` |

**Per-turn sync**: Run `node scripts/coordination-watch.js --agent codex` at start of each task.

---

## Priority Order (Owner's Stated Intent)

1. **Fix auth provisioning end-to-end** (Stripe webhook + modal login + email infrastructure) — blocks paid signups
2. **Fix dogfood scan accuracy** (recon, queries, competitors) — blocks trust in our own tool
3. **Ship target content pages** (how-to-show-up-in-ChatGPT, Bing rank, etc.) — builds AEO authority
4. **Search engine submission hygiene** (GSC, Bing, IndexNow) — discovery + diagnostics
5. **Dashboard approval UI + run-your-own-scan + report styling** — client retention
6. **Marketing asset pipeline** (after SEO stable) — content → backlinks → citations
7. **Guest posting + backlink acquisition** — authority loop
8. **Performance audit + blink fix** — conversion optimization

---

## Quick Wins (Can Ship This Week)

- [ ] Add login modal to public site header (reuse `LoginForm` island)
- [ ] Create `/api/webhooks/stripe/route.ts` with signature verification + provisioning
- [ ] Provision Resend + configure DNS + Supabase SMTP
- [ ] Submit sitemap to GSC + Bing Webmaster Tools
- [ ] Enable IndexNow key + post-deploy submission script
- [ ] Wire "Run your own scan" button in dashboard (tier-gated)
- [ ] Push pipeline repo to origin
- [ ] Rotate exposed secrets (user action required)

---

## Notes for Subagents

> **When claiming work**: Update this file — change `⬜` → `🟡` with your agent ID in Notes.
> **When completing**: Change `🟡` → `✅` + add verification receipt (test output, deploy URL, screenshot).
> **If blocked**: Change to `🔴` + explain blocker in Notes.
> **If research needed**: Change to `🟣` + link research doc or vault note.

**Vault references** (Obsidian):
- `Prompt Goblin - AEO GEO Industry Deep Research 2026`
- `Citation Market Research Compilation 2026`
- `Citation Tools And Integrity Research 2026`
- `Reddit Community Signal 2026`
- `Prompt Goblin - Supabase + Vector DB Plan`
- `Zat - DigitalOcean MCP Setup`

**Repo docs**:
- `PLAN.md` (execution contract)
- `DOCS_PLAN.md` (documentation authority)
- `COORDINATION.md` (multi-agent board)
- `CLAUDE.md` (honest-broker code + agent roster)
- `web/AGENTS.md` (Next.js conventions)
- `docs/promptgoblin-dogfood-aeo-seo-plan.md`
- `docs/promptgoblin-aeo-seo-term-map.md`
- `docs/bing-webmaster-tools-submission-guide.md`