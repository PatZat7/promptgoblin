# Prompt Goblin — Design Update Plan (incl. dashboard + tooling proposal)

> Internal plan that pairs with `REDESIGN_BRIEF.md` (the hand-to-Claude-Design prompt). Covers: the stack decision, the skills/plugins/connectors to adopt, the phased sequence, the dashboard architecture, risks, and the open sign-offs. Last updated 2026-06-02.

## The goal (restated plainly)
Same soul (8-bit terminal × dark-fantasy, the logo, the cursor), but **minimal, clean, plain-language, awwwards-level with purposeful animation**, with **unique diagrams** that explain (a) AI-answer-engine citability and (b) the 3-loop self-healing engine, **public-sector proof** (USDA / City of Chicago / State of Texas / State of Illinois), and a **client login + dashboard**. Try **two directions**, pick the best.

---

## 1. Stack decision (the honest call)
**An awwwards site is fine on/near the current zero-build SPA. A real login + per-user dashboard is NOT.** Auth, sessions, secrets, and per-user data cannot live safely in a Babel-in-browser static page. So:

- **Marketing site** → stays lean. **Direction A** can remain near-zero-build (CDN GSAP/Lenis acceptable). **Direction B** (WebGL hero, GSAP choreography) wants a **real build (Vite)** for code-splitting/perf — recommended if we pick B.
- **Dashboard** → **separate app on a real stack.** Recommended: **Next.js + Supabase** (Postgres + auth/magic-link) — or Clerk/Auth0 for auth if we prefer. Deploys to a subdomain (e.g. `app.promptgoblin.zatgeist.com`). **Never put API keys client-side** (honest-broker + the leaked-token history — DO token + WORKDAY_PASSWORD already leaked once; secrets stay server-side only).

**Net:** marketing site and dashboard are **decoupled deployables.** Pick the marketing direction first (fast win); build the dashboard MVP second (bigger lift).

## 2. Tooling to adopt (skills / plugins / MCP — researched)
- **`impeccable`** *(verified real — Paul Bakaus' Claude Code design skill)* → install: `/plugin marketplace add pbakaus/impeccable`. Anti-"AI-slop" design critique, `/audit` `/polish` `/critique` `/animate`; deterministic + LLM rule passes; saves `.impeccable.md`. **Adopt now** — this is the single highest-leverage tool for hitting awwwards quality with our existing `design-system` agent.
- **Figma MCP** → design source-of-truth + design-to-code; wire if we do real Figma mockups.
- **Playwright MCP** → e2e + visual-regression + a11y-tree (complements our `qa` axe-core gate).
- **a11y MCP** (e.g. ronantakizawa/a11ymcp) → live contrast/ARIA/keyboard scans during build.
- **Supabase MCP** → auth + DB for the dashboard (adopt when Phase 3 starts).
- **GitHub MCP** → CI/CD + PR context (we already deploy-on-push).
- **Animation libs:** GSAP + ScrollTrigger (scroll choreography), Lenis (smooth scroll, ~3KB), Motion/motion.dev (component micro-interactions), Three.js (Direction-B hero only, lazy-loaded), `vasturiano/3d-force-graph` if we want a force-directed mesh. All gated behind `prefers-reduced-motion`.

## 3. Phases & sequence
- **P0 — Lock inputs (now):**
  - `COPY_V2.md` written → **integrity-reviewer gate** (in progress) → owner confirms the **public-sector wording** (the one hard blocker).
  - `REDESIGN_BRIEF.md` finalized → hand to Claude Design.
  - Install `impeccable`.
- **P1 — Two prototypes:** Claude Design returns Direction A + Direction B (mobile-first frames, hero + 2 diagrams animated, login + dashboard view, token sheet, stack note).
- **P2 — Evaluate & pick:** score A vs. B on the awwwards rubric (Design 40 / Usability 30 / Creativity 20 / Content 10) + mobile + a11y + load. Pick one or graft. **Decision is the owner's.**
- **P3 — Implement marketing redesign:** build chosen direction mobile-first → `design-system` + `impeccable` polish → **`qa` gate (axe 100/100, Playwright e2e, 0 contrast)** → ship via deploy-on-push.
- **P4 — Dashboard MVP:** Next.js + Supabase on the app subdomain. Wire to the pipeline's `rescan` snapshot JSON (read) + fix-queue approve/reject (write-back). Auth → citation scorecard → you-vs-competitor → run status + eval badge → human-gated fix queue. Secure review (stack-auditor) → ship.

## 4. Dashboard architecture (MVP sketch)
```
[ Pipeline (LangGraph) ] --rescan--> snapshot JSON (visibility, per-engine, per-surface, fix queue)
            |                                   |
   (human-gated fixes)                          v
            |                          [ Supabase Postgres ]  <-- per-client, RLS-isolated
            v                                   ^
   approve/reject  <-----------------  [ Next.js dashboard ]  <-- Supabase auth (magic-link/OAuth)
                                          app.promptgoblin.zatgeist.com
```
- Pipeline writes snapshots/fix-queue per client; dashboard reads them; approvals write back to the queue the human reviews. **Nothing auto-deploys** — the dashboard is the human gate's UI.
- Row-level security per client. No third-party API keys in the browser. Sample data clearly labeled until real client data flows.

## 5. Pipeline status (the "make sure our own pipelines work" item)
**VERIFIED GREEN — 2026-06-02.** `186 passed, 1 skipped` (skip = key-gated live Perplexity smoke), eval gate `RESULT: PASS` (3/3 golden cases, mean 1.000 / threshold 0.999). Convergence proofs green: LOOP 1 `heal-loop fires@0 / converges@1 / bounded@cap(2)`; LOOP 2 per-discipline `seo` + `a11y` `fires+converges@1 / bounded@cap(2)` (schema strand scaffolded, vacuous-pass until wired). This is the truthful basis for the "self-healing, eval-gated, human-approved" story in the brief — **do not overstate it** (one pipeline, three bounded loops; schema loop not yet live).

## 6. Risks / watch-items
- **Scope:** awwwards site + a real dashboard is a large solo lift. Ship the marketing redesign first; treat the dashboard as a separate milestone.
- **Perf vs. flash (Direction B):** Three.js is ~160KB+ — lazy-load, hero-only; protect Core Web Vitals (we sell CWV).
- **A11y under motion:** reduced-motion + PEAT seizure check + contrast-under-grain are mandatory, not afterthoughts.
- **Secrets:** dashboard backend keys server-side only. (Rotate the already-exposed DO token + WORKDAY_PASSWORD regardless.)
- **Honest-broker on the dashboard:** "movement, never attribution"; sample data marked sample.

## 7. Sign-offs — RESOLVED 2026-06-02
1. ✅ **Public-sector wording** — owner-confirmed (approved as shown in the Direction-A prototype). Caveat: keep "audited by real compliance reviewers" only if substantiable; else "built to Section 508 acceptance criteria".
2. ✅ **Stack** — approved: dashboard on **Next.js + Supabase** (separate `app.` subdomain).
3. ✅ **Direction** — **lead with Option A (Refined Terminal)**; borrow from B only where it doesn't compromise the minimal/clean bar.

## Deliverables produced this round
- `REDESIGN_BRIEF.md` — the mobile-first prompt for Claude Design (2 directions + dashboard).
- `COPY_V2.md` — plain-language site copy (copywriter; integrity gate pending).
- `AEO_VS_COMPETITORS.md` — how to measure your AEO/SEO vs. competitors (answers the "what to search" ask).
- `DESIGN_PLAN.md` — this file.
