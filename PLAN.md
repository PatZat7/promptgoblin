# Prompt Goblin — PLAN (living)

> The orchestration doc. The main thread keeps this current; subagents are dispatched from here. This is the "planner" — there is no planner subagent. Last touched: 2026-06-02.

## Status
- ✅ **Marketing site live** (promptgoblin.zatgeist.com) — DO App Platform, deploy-on-push from `main` (origin: github PatZat7/promptgoblin). axe 100/100, 0 violations. 2026-06-02: shipped the mobile fix + copy/mesh/share/favicon polish (`fix/mobile-and-copy` → main).
- ✅ **Pipeline task (c)** — done.
- ✅ **Pipeline task (a)** — per-discipline self-healing verify strands; eval gate green (seo + a11y `fires+converges@1`, `bounded@cap`), 186 tests pass. Committed.
- ✅ **Leads** — 27 sendable in `pipeline/sales/leads30.md`; prioritized, name-filled DMs in `pipeline/sales/dms_to_send.md`.
- ✅ **Agent team** — 8 specialists in `.claude/agents/` + this PLAN + project `CLAUDE.md`.

## In flight
- _(nothing in flight. Uncommitted in the tree: only the separate `functions/` Tier-2/SSRF WIP — held intentionally, deploys separately from the static site.)_

## Recently done
- ✅ **Pre-launch QA + ship** (2026-06-02): `qa` ran axe-core across 1440/768/375/360 → **0 violations**. One blocker found (Scrolls "soon" cards at 4.3:1) and fixed by `design-system` — dropped the `opacity:0.55` card dim for a dashed muted border so text stays full-contrast (~10.5:1, re-verified). **Favicon** redone per request: transparent (no box), theme-adaptive via `prefers-color-scheme` (white on dark / black on light browser UI) — both schemes verified. `fix/mobile-and-copy` (7 commits) merged to `main` + pushed → deploy-on-push.
- ✅ **Site polish batch** (2026-06-02 — copywriter + design-system → integrity-reviewer **APPROVE** → preview-verified at :8127, 0 console errors):
  - Mesh graph copy fixed: now 5 answer engines (was 3), `12 gaps · 4 a11y`, `you vs. 6 competitors` (was the cryptic `graph(82 edges)`), + a `sample run` illustrative marker (same misread risk we closed on the scan demo).
  - Hero sub-line A applied (DM message-match); footer social links → non-clickable `soon` spans.
  - STATS de-risked: dropped unproven `100% schema valid` + `180ms TTFB`; now `5 engines · 6 JSON-LD blocks · 7 nodes · 0 auto-deployed` (all provable).
  - Share assets ready: `og-image.png` (1200×630, real goblin logo) + `og:image`/`twitter:image` + sharper og:description; **SVG favicon** (real logo) wired (`favicon.svg`, source `og-card.html`). Both serve 200.
- ✅ **Site copy refresh** (2026-06-02, `copywriter` → `integrity-reviewer` **APPROVE** → main-thread render-verify, 0 console errors). Applied to `app.jsx` (+ tiny `.scard-soon` rule in `styles.css`): (1) Live Scan demo neutralized — `n=2,481 sources`→`[illustrative]`, `4 mentions · avg position 2.3`→`competitor cited · you're not — [sample output]`, issue block reordered so the citation gap is HIGH/first and schema demotes to MED (now matches "schema is hygiene"); (2) dead Scrolls `href="#"` cards → non-clickable `field note · soon`; (3) capacity unified (`taking 3 clients · Q3–Q4 26` + `3 slots · Q3–Q4 2026`); (4) `30+ tasks`→`scored by impact × effort`. Analytics diff preserved.
- ✅ **Mobile UI fix** (2026-06-02, `design-system` + main-thread verify) — CSS-only, 3 bugs closed, verified in `:8127` preview at 360/375/768px (0 doc overflow, 0 clipped lines):
  1. Work-grid clip — `.wcard{min-width:0}` lets the `1fr` track shrink (408→371px); `.wterm .ln` wraps @≤700px so the dogfood proof lines ("…not a promise", "…2 content") aren't ellipsis-truncated on phones (main-thread refinement after preview check — agent's `overflow-x:auto` couldn't engage, `.ln` clips itself at `styles.css:386`).
  2. Services sliver — span the class-less lead/desc wrapper @≤760px (`styles.css:429`); `.lead` 40→341px.
  3. Footer touch targets — `github`/`x.com`/`substack` 18→28px, `hi@` 40px (clears WCAG 2.5.8) @≤600px.
  - Kept the prior good work (HUD trim @600px, mesh flatten @700px). `app.jsx` untouched.

## Queued
- 📱 **Social-presence agent flow** — stand up real github / x.com / substack profiles, seed content, then wire the real URLs into the footer (`app.jsx` ~1193, currently non-clickable "soon" spans). Until then the footer honestly shows them as forthcoming.
- 📊 **Pipeline task (b)** — PostHog AI-recommendations engine + outreach agentic workflow in LangGraph (visually inspectable). Not started; needs user go-ahead. ("c then a then b" — b is next.)
- 📨 **Send DMs** — *user only* (I draft, never send). Start with Matt Aitken / Trigger.dev. Send 5–8, not 27.
- 🔑 **Rotate secrets** — *user only* — exposed DigitalOcean token + WORKDAY_PASSWORD.
- 🧹 Optional: drop the throwaway `browser_audit/_contrast_recheck.json` artifact.

## Decisions log
- 2026-06-02: mobile fix handed from user → `design-system` agent (user request). Sequence: plan → mobile → verify → apply copy. Diagnosed via `:8127` preview (screenshots unusable — CRT/grain effects hang the headless renderer; used deterministic `eval`/`inspect` layout measurement instead).
- 2026-06-02: roster = full 9-role team (a11y folded into `qa`, security into `stack-auditor`; planner = main thread + this file).
- 2026-06-02: copy = draft now, apply after the user's mobile fix (avoid file clobber).
- Leads: widen categories (B2B SaaS + ecom + local high-LTV service + agencies); leads before own-site fixes.
