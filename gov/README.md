# gov/ — Government Capability Statement

This folder holds Prompt Goblin's **government capability statement** — the
1-page document that federal/state/local contracting officers (COs) and agency
buyers expect before they'll talk to a vendor.

| File | What it is |
|---|---|
| `capability-statement.md` | The 1-pager. Real, structured, with clearly-marked `[TODO: ...]` placeholders for the things only you can supply (UEI, CAGE, certifications). |
| `README.md` | This file — how to use/customize it, what to fill in, the registration steps to actually transact, and the honest past-performance posture. |

> **Scope note:** This folder is documentation only. It does **not** touch
> `app.jsx` or the `pipeline/` code — it describes them.

---

## What's REAL vs. what's TODO

The statement is grounded in the actual product. These are **true today** and
safe to state to a buyer:

- Chicago, IL solo shop; `hi@promptgoblin.io`; `promptgoblin.zatgeist.com`.
- The accessibility tooling: a static-HTML pre-screen **plus** a stateful
  axe-core + headless-Chromium auditor (`pipeline/browser_audit/state_audit.mjs`)
  that re-runs axe in each component state. See `pipeline/browser_audit/README.md`.
- The honesty numbers: automated tooling catches **~57%** of WCAG criteria
  (Deque); the rest needs a human pass. We never certify by-tool.
- The AEO pipeline node sequence and the weekly before/after measurement loop
  (`pipeline/README.md`, `pipeline/goblin/graph.py`).
- The dogfood result: **96/100, 1 serious `color-contrast` finding (14
  elements)** on our own site.
- Engagement tiers Scout / Warband / Warlord.

Everything wrapped in `[TODO: ...]` is **yours to fill in and must not be
fabricated** — a UEI, CAGE code, certifications, clients, or contract history
you don't have. Inventing any of these on a federal document is a
false-statement risk, not just bad form.

---

## How to customize it (5 minutes)

1. Open `capability-statement.md`.
2. Search for `[TODO:` and replace each one. Start with: legal/DBA name,
   contact name, and (once you have it) **UEI**.
3. Confirm the **NAICS** set for your real scope (see next section) and delete
   any code you won't actually pursue. Keep **one** primary in SAM.gov.
4. Keep it to **one rendered page.** If it overflows, trim the longest core-
   competency bullets first — COs skim, they don't read.
5. Export to the format the buyer wants. Markdown is fine for email; for a
   polished PDF/Word 1-pager:
   ```bash
   pandoc gov/capability-statement.md -o gov/capability-statement.pdf
   # or open in Word/Docs and "Save as PDF"
   ```
   Optional: add the goblin-head mark and the dark/lime brand colors when you
   move it into a designed template (assets live in the site repo).

---

## NAICS codes — verified, and why one changed

The brief suggested **541511 / 541512 / 541990**. Those are valid, but after
checking how GSA/SBA classify this work, the statement leads with a slightly
corrected set:

- **541519 — Other Computer Related Services** → **primary** for Section 508 /
  WCAG accessibility audits & remediation (the code buyers expect for 508 work).
- **541511** (custom programming) and **541512** (systems design) → remediation
  / engineering.
- **541613 — Marketing Consulting Services** → the AI-search-visibility / SEO
  side (a marketing code fits AEO/SEO better than a pure-IT code).
- **541990 — All Other Professional, Scientific, and Technical Services** →
  catch-all for mixed-scope work.

In SAM.gov you pick **one primary NAICS** (it drives your small-business size
standard) and list the others as additional. **Verify the final set against the
solicitations you actually intend to chase before you register.**

---

## The registration steps to actually transact

You can hand someone a capability statement today, but to be **paid or awarded**
you need to be in the system. In order:

1. **SAM.gov registration + UEI (free, required, do this first).**
   - Register the entity at **SAM.gov**. You'll be assigned a **UEI** (12-char
     Unique Entity ID; replaced DUNS in 2022) and a **CAGE code** automatically.
   - Cost: $0. Do not pay a third party for this. Allow time — validation can
     take days to a few weeks.
   - Once active, put the UEI + CAGE into `capability-statement.md` (there are
     `[TODO:]` slots for both, plus a "SAM.gov registered — [date]" line).

2. **Start selling before a Schedule.** With an active SAM.gov registration you
   can already pursue **micro-purchases** (≤ $10,000), **simplified-acquisition**
   work, and respond to **Sources Sought / RFIs** on SAM.gov. You do **not**
   need a GSA Schedule to begin — many first contracts come this way.

3. **GSA MAS — SIN 54151S (the IT-services on-ramp).**
   - Apply to the **GSA Multiple Award Schedule**, **SIN 54151S — Information
     Technology Professional Services**, which covers accessibility/508 and the
     broader technical work.
   - This is a larger lift (pricing narrative, financials, often a past-
     performance expectation). Treat it as a *later* milestone, after a first
     win or two, not a day-one requirement.

4. **SBA set-aside / socioeconomic certifications (only if eligible).**
   - Evaluate **8(a)**, **WOSB/EDWOSB**, **SDVOSB/VOSB**, and **HUBZone**
     through SBA. Each has eligibility rules and its own application.
   - **Claim none of these on the capability statement until SBA has actually
     certified you.** Self-certification rules changed; misrepresentation is a
     serious finding.

> The capability statement's "Contract / Registration Readiness" table mirrors
> these four steps so a buyer sees an honest status, not an implied award.

---

## The honest note on past performance

**We have no government past performance yet, and the document says so plainly.**
That's the honest-broker posture — and it's not a dead end. Two things carry the
pitch in lieu of references:

1. **Lead with the dogfood case study.** We ran our own stateful axe-core
   auditor against `promptgoblin.zatgeist.com`: **96/100, 1 serious
   `color-contrast` violation across 14 elements** — a render-dependent finding
   a static scan can't catch — then queued a human-reviewed fix. It proves the
   tooling and the honesty in one move: we test on ourselves first.

2. **Offer a free, no-obligation pilot scan.** A reproducible Section 508 +
   AI-visibility read of the agency's own site, with every finding tied to its
   WCAG criterion. This is **pre-solicitation, informational** contact — allowed
   — and it doubles as a work sample. (The `pipeline/goblin/gov_finder.py`
   engine already drafts these compliantly: no item of value offered, FOIA-aware,
   SAM.gov registration noted as a prerequisite, and a **human reviews and sends
   every draft — the tool never sends.**)

As real engagements close, add them as past performance and retire the
"none yet" language.

---

## Compliance guardrails (already encoded, keep them)

When you do outreach to agencies, the rules are non-negotiable and the pipeline
enforces them:

- **No gifts / nothing of value** (FAR 3.104 / 5 CFR 2635). A free scan framed
  as informational is fine; anything resembling an inducement is not.
- **Pre-solicitation only** until a solicitation opens — capability statement,
  free scan, RFI/Sources-Sought responses. Don't solicit bid/proposal or
  source-selection information.
- **Everything is a public record.** Write every message as if it will be FOIA'd
  — because it can be. Factual, on the record, no manufactured urgency.
- **Human-in-the-loop.** Nothing auto-sends; nothing auto-deploys.

---

## Related, real artifacts to point buyers (or yourself) to

- `../pipeline/README.md` — the AEO/GEO pipeline + the measurement loop.
- `../pipeline/browser_audit/README.md` — the stateful axe-core accessibility
  auditor and the honesty contract.
- `../pipeline/goblin/gov_finder.py` — the compliant `goblin gov-scan` engine.
- `../llms.txt`, `../README.md` — the public positioning and brand voice.
