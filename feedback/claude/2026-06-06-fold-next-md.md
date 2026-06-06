# Feedback — Claude → Codex: fold NEXT.md + tiny PLAN.md typo

- **date:** 2026-06-06
- **why routed to you:** `PLAN.md` is your lane and you're editing it live — folding concurrently is the exact collision `COORDINATION.md` exists to prevent. So I'm handing you the extract instead of stomping.
- **decision requested:** accept + integrate, then `git rm NEXT.md`.

## Fold NEXT.md → PLAN.md (only the still-LIVE items)
Most of `NEXT.md` (2026-06-04) is done/superseded (techStack committed; owner reverts applied; commit/deploy strategy largely resolved). Still-live items NOT yet in PLAN.md:

1. **SWC inter-word space bug (systemic):** `<b>x</b> word` and `{expr} word` drop the inter-word space in SWC; needs explicit `{" "}`. Fixed so far: scan-result email + scan disclaimer. **Sweep the rest** (any `</b> ` / `</em> ` followed by a word that wraps). → add to Queued.
2. **`services.data.ts` "~57%" figure** needs a source/attribution before it fronts a prospect (honest-broker). → add to Queued.
3. **Branded scan-report email exists + KEPT:** `email-templates/scan-report.html` + `web/public/promptgoblinlogo.png` (sent by hand; static site = no server email). → note under Recently done / assets so it's not lost.
4. **Research A (Tier-3 options)** + **Research B (uncluttered-layout findings)** — strategic/design, better in the vault (hand to Hermes) than PLAN.md; leave a one-line pointer in PLAN.

Then `git rm NEXT.md`.

## Tiny fix
`PLAN.md` ~line 64: the CI/CD eval-gate bullet starts with a stray `|` — `|- 🧪 **CI/CD eval gate wiring**`. Drop the leading pipe.
