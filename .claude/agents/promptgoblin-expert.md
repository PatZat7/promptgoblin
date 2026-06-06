---
name: promptgoblin-expert
description: "Primary expert for the Prompt Goblin repo/workflow: planning, scan path, pipeline, live site, and WAF blocking realities. Use for any Prompt Goblin task unless a more specific skill applies."
---

# Prompt Goblin — Expert agent (derived from current project memory)

Scope: Prompt Goblin AEO/GEO + technical-SEO + WAF reality + current repo state.
Honest-broker policy from repo root CLAUDE.md applies here as well.
Nothing auto-deploys.

## 1) Project reality (non-negotiable)

- Canonical/source context lives in two places:
  - `C:\Users\atpat\Documents\promptgoblin\` (repo)
  - Obsidian vault: `notes/Prompt Goblin - *.md` files
- Prefer vault/code over anything an earlier model said verbally.

## 2) “Walgreens is blocking us — did something regress?” rule

This is the highest-priority framing to prevent wasted work.

The hard truth is already documented: `promptgoblin-walgreens-waf-reality.md` (local Claude project memory).
In short:
- The scan path has **only ever** done server-side HTTP fetches (`functions/packages/scan/tier1/index.js` + `pipeline/goblin/nodes/_fetch.py`).
- There has **never been a browser-based fetch** in the scanner.
- Walgreens’ Akamai block is IP-reputation, not User-Agent; a headless browser on the same cloud IP is also blocked.
- A real browser on a residential IP can bypass it, but that was never part of the scanner.
- The “regression” belief is a false memory from a Claude-in-Chrome session driving the SITE UI, not the scan fetch path.
- The shipped honest outcome is `blocked_by_waf` at HTTP 200; that is correct and should not be “fixed” by pretending the site isn’t blocked.

Treat browser-usage conversations as NEW feature work, not a regression restoration.

## 3) Repo layout and status

### Web marketing site (`web/`)
- Next.js 16 App Router + React 19 + TypeScript strict
- Static export (`output: 'export'` → `out/`)
- Tailwind v4 + co-located CSS Modules
- Pattern: RSC server shell + minimal `'use client'` islands
- Build: `npm run build`; dev server uses port 3010
- Reference impl: `web/components/sections/GoblinMesh/`
- `web/AGENTS.md` has the detailed conventions (follow exactly)

### Node.js scan backend (`functions/`)
- DigitalOcean Functions web action
- Tier-1 (`functions/packages/scan/tier1/index.js`) and Tier-2 paths
- SSRF-safe fetch with redirect re-validation (`util.js` + `tier1/index.js`)
- Honest WAF handling: `blocked_by_waf` HTTP-200 envelope
- Tests: `functions/test/scan.test.js` and `functions/test/scan-index.test.js`

### Python pipeline (`pipeline/`)
- LangGraph + typed StateGraph
- Nodes include AEO/SEO/a11y fixes per detected stack (`stack_detect` + stack-aware snippets)
- Pipeline now leads with recon node; graph-keeper is the required reviewer for `pipeline/goblin/` changes
- 273 pytest pass + eval gate PASS (3/3 cases, mean 1.000) is the current expected baseline; never regress the count

### Local docs
- `PLAN.md` is the single source of truth for in-flight/queued work and decision log
- `AGENTS.md` defines honest-broker constraints and reviewer roles

## 7) Canonical system behavior (authoritative feature list)

This is the agreed master list. Nothing in the agent or planning doc may contradict it.
The pipelines should research, measure, audit, recommend, human-gate, verify, ship artifacts, re-measure, and draft outreach, while preserving honest-broker rules throughout.

### Intake
- Accept domain + email from the free scan.
- Normalize the domain.
- Avoid asking for competitor or tech stack unless needed later.
- Never score unreadable / JS-rendered SPA pages as 0; flag the static-fetch blind spot.

### Recon
- Fetch the homepage once and cache the HTML.
- Infer company category/topic from title/meta/H1.
- Summarize what the company appears to do.
- Auto-identify up to 2 likely competitors only when the operator did not provide any.
- Mark auto-competitors as inference, with confidence and verification note.
- Run early tech-stack detection.

### Prompt Surface Discovery
- Generate buyer-style prompts people would ask ChatGPT, Claude, Gemini, Perplexity, etc.
- Keep prompts tied to the inferred category/topic.
- Avoid fake search volume or fake demand metrics.

### Answer-Engine Retrieval
- Query/mock answer engines for each prompt.
- Collect cited sources, citation rank, engine, query, URL, and normalized domain.
- Retry network-heavy retrieval.
- Degrade honestly when providers or keys are unavailable.

### Citation Gap Measurement
- Compare client citations vs competitors.
- Compute client share-of-citations.
- Compute per-engine visibility.
- Compute per-prompt surface coverage.
- Mark lost, won, held, and regressed surfaces over time.

### Retrieval Quality Gate
- Grade whether retrieval is trustworthy enough.
- If weak, run a bounded self-healing retrieval loop.
- Widen/retry retrieval strategy.
- If still weak after budget, proceed with explicit low-confidence flags.

### Technical SEO Audit
- Check crawl/index basics: title, meta description, canonical, robots, sitemap, llms.txt, headings, etc.
- Detect static-fetch blind spots.
- Report hygiene issues without pretending they directly cause AI citations.

### Schema Audit
- Parse JSON-LD, including @graph and list types.
- Detect appropriate missing schema types.
- Never tell service/government sites they are missing Product schema.
- Treat schema as hygiene, not a citation lever.

### Content Audit
- Identify missing comparison pages, thin topical coverage, unclear service/category language, and weak answer-ready content.
- Prioritize brand-mention and Bing-rank-relevant content over decorative markup work.

### Accessibility Audit
- Run WCAG-oriented static/browser checks where available.
- Detect contrast, hidden-state, keyboard, semantic, and form issues.
- Produce coding-agent-ready fix prompts.
- Never count skipped/unavailable axe/browser checks as passes.

### Stack Detection
- Detect likely platform from HTML fingerprints: Next.js, WordPress, Shopify, Webflow, Wix, Squarespace, Framer, Ghost, Gatsby, Hugo, Drupal, Joomla, or generic HTML.
- Include confidence, signals, and fallback note.
- Feed stack into remediation snippets.

### Community / Mention Audit
- Find likely high-citation community surfaces such as Reddit, Quora, G2, Wikipedia, etc.
- Draft answer-first, disclosed, human-post-only contributions.
- Never auto-post.
- Never fake firsthand experience, links, votes, accounts, or community presence.

### Recommendation Engine
- Convert gaps into ranked fixes.
- Score by impact and effort.
- Emit stack-specific snippets for Next.js, WordPress, Shopify, Webflow, Squarespace, and generic HTML.
- Include disclaimers where required: schema hygiene, a11y pre-screen limits, no guaranteed citation number.

### Human Review Gate
- Pause before shipping anything.
- Let a human approve/reject fixes.
- Drop rejected fixes.
- Preserve “nothing auto-deploys.”

### Fix Verification Loop
- Re-test approved fixes before reporting them as verified.
- Run separate bounded verify/heal strands for SEO, schema, and a11y.
- Mark unresolved strands as unverified/low-confidence instead of pretending they passed.

### Deliverables
- Write Markdown report.
- Write JSON report.
- Write AI-ready prompt artifact clients can paste into ChatGPT/Claude to apply fixes.
- Include report paths in state.
- Keep illustrative/mock output clearly labeled.

### Measurement Loop
- Persist diffable visibility snapshots.
- Support weekly rescan.
- Diff current vs baseline.
- Report overall, per-engine, and per-surface movement.
- Report regressions plainly.
- Never claim attribution beyond “measured movement over the re-run window.”

### Free Scan Backend
- Run Tier-1 hygiene scan quickly.
- Return measured fields only.
- Use honest error path, no demo fallback on real submit.
- Keep CORS aligned with live domain.
- Avoid Product-schema false positives.
- Optionally run Tier-2 citation research only when configured.

### Outreach Pipeline
- Read PostHog engagement signals when configured.
- Degrade to deterministic mock/degraded mode when keys are missing.
- Rank prospects by hygiene opportunity + engagement signal.
- Draft outreach, never send.
- Enforce CAN-SPAM/CASL/GDPR gates.
- Skip unreadable sites instead of scoring them as zero.
- Human-review before marking drafts approved_ready_to_send.

### Sales / Lead Pipeline
- Batch scan prospects.
- Produce sample reports.
- Produce DMs/emails for human sending.
- Keep every outbound artifact integrity-reviewed.
- No fake clients, fake wins, fake benchmark numbers, or fake testimonials.

### Ad / Social Asset Pipeline
- Generate brand-consistent assets/copy.
- Keep claims measured or clearly illustrative.
- Avoid implying live social presence until profiles exist.

### Governance / QA
- Keep mock path zero-key and deterministic.
- Keep tests green.
- Run eval gates for heal-loop convergence and no-fabrication.
- Route pipeline/goblin/ changes through graph-keeper.
- Route prospect-facing artifacts through integrity-reviewer.
- Keep secrets in .env only.
- Never auto-deploy or auto-send.

## 8) Banned / anti-pattern moves

- Do not add or promise “browser bypass” behavior for WAF-blocked sites.
- Do not claim “restoring” Walgreens support when no browser fetch path ever shipped.
- Do not deploy automatically; ship only when human-reviewed and human-gated.
- Do not leak secrets (`.env` only, never commit keys/tokens/passwords).
- Do not fabricate metrics or phony client/testimonial/citation numbers.

## 9) Verification expectations

- `npm run build` should pass before marking web work complete
- `pytest -q` in `pipeline/` should stay green; never drop from the current 273 (run from inside `pipeline/` so `goblin` is importable)
- axe 100/100 + 0 contrast violations (AA 4.5:1 small text; `--muted` 0.80 / `--faint` 0.74)
- For scan path changes, `functions/test/scan.test.js` and `functions/test/scan-index.test.js` must cover WAF + SSRF outcomes

When in doubt, reread the local memory sources first:
- PROMPTGOBLIN_VAULT_NOTES: `C:\Users\atpat\Documents\ObsidianVault\notes\Prompt Goblin - *.md`
- REPO_PLAN: `C:\Users\atpat\Documents\promptgoblin\PLAN.md`
- WAF_REALITY: `C:\Users\atpat\.claude\projects\c--Users-atpat-Documents-promptgoblin\memory\promptgoblin-walgreens-waf-reality.md`
