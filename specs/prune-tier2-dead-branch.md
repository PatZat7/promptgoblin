# prune-tier2-dead-branch

Small, behavior-preserving cleanup: remove the now-dead Tier-2 **competitor
live-fetch** branch and the two unused state slots from
`web/components/sections/LiveScan/LiveScan.tsx`. The competitor-comparative path
was kept as a hook for a recon-discovered competitor that was never wired into
this component; today the form is domain-only and only the **auto** (domain-only)
citation teaser ever runs. Deleting the dead code makes the file say what it
does. **No user-visible behavior changes** — the honest error path and the
render-diff stay exactly as they are.

## Goal

- Remove code in `LiveScan.tsx` that can never execute given the current
  domain-only form, specifically:
  - the unused `runCitationTeaser` import (the email+competitor function),
  - the two write-only state slots `competitorTarget` and `techStackInput`,
  - the hardcoded `competitor = ""` / `techStack = ""` locals and the dead
    `competitor ? scanHost(competitor) : ""` ternary they feed.
- Keep every live code path byte-for-byte equivalent in behavior:
  - the **honest failure path** (`scanFailureCopy` → `warn`/`err` line +
    `errorMsg` card + `fireAutoTier2()` on the blocked/unreachable branch),
  - the **auto Tier-2 teaser** (`runCitationTeaserAuto`) on both success and
    blocked paths,
  - the render-diff feature (which lives in `HeroScan.tsx` + `scan-api.ts`, not
    in `LiveScan.tsx` — confirm it is untouched).
- Leave the shared `lib/scan-api.ts` exports (`runCitationTeaser`,
  `TeaserResponse`) intact — they are exercised by the test suite and may still
  be wired by a future comparative path. (See Design → "scan-api.ts decision".)

## Files touched (exact paths + which repo)

Repo: **web** (`C:\Users\atpat\Documents\promptgoblin\web`).

| File | Change |
|---|---|
| `web/components/sections/LiveScan/LiveScan.tsx` | Remove dead import, two state slots, dead locals + ternary; thread `competitor=""` / `techStackInput=""` literals to the two child props that still require them. **Only file edited.** |

Read-only / referenced, NOT edited (call out so the reviewer can verify scope):

- `web/components/sections/LiveScan/ScanResult.tsx` — defines `Tier2State` and
  the `ScanResult` / `Tier2Card` prop contracts (`competitor: string`,
  `techStackInput: string`). **Props are kept; we pass literals.** Not edited.
- `web/lib/scan-api.ts` — `runCitationTeaser` / `TeaserResponse` exports. Not
  edited (see decision below).
- `web/__tests__/scan-api.test.ts` — covers `runCitationTeaser`. Stays green
  because the export is untouched. Not edited.
- `web/components/sections/Hero/HeroScan.tsx` — separate widget; owns the
  render-diff UI. Confirm untouched.

## Design (concrete approach, function/field names, data shapes)

### What is dead and why (grounded in the current source)

`LiveScan.tsx`'s `onScan` hardcodes:

```ts
const competitor = "";   // line ~170
const techStack = "";    // line ~171
```

with a comment that competitor + tech stack are auto-discovered, so the form
only asks for the domain. Consequences, traced through the file:

1. **`runCitationTeaser` import (line 7)** is never called — only
   `runCitationTeaserAuto` runs (via `fireAutoTier2`). Dead import.
2. **`competitorTarget` state (line 105)** is only ever set from
   `competitor ? scanHost(competitor) : ""` (line 186), `""` in `resetToIdle`
   (line 155), and `""` in the initial value — i.e. **always `""`**. It is read
   only as a prop into `<ScanResult competitor={competitorTarget} …>` (line 383)
   and `<Tier2Card competitor={competitorTarget} …>` (line 398).
3. **`techStackInput` state (line 106)** is only ever set to `techStack` (= `""`)
   at line 187 and `""` at line 156 — **always `""`**. Read only as
   `<ScanResult techStackInput={techStackInput} …>` (line 389).
4. The comparative `Tier2State` variants (`{ status: "ready"; competitor; data }`,
   `{ status: "skipped" }`) and the `competitor`-gated branches inside
   `Tier2Card` are **unreachable from this component**, because `fireAutoTier2`
   only ever sets `idle | loading | ready-auto | no-key | rate-limited | error`.

So the prop **values** are dead (always `""`), but the child **prop signatures**
(`competitor: string`, `techStackInput: string`) are part of `ScanResult` /
`Tier2Card` and we are NOT refactoring those in this task. The clean, minimal
move: delete the state, pass empty-string literals at the call sites.

### Edits to `LiveScan.tsx`

1. **Import (line 7).** Drop `runCitationTeaser` from the named import; keep
   `runCitationTeaserAuto`, `runHygieneScan`, `type ScanReport`:
   ```ts
   import { runCitationTeaserAuto, runHygieneScan, type ScanReport } from "@/lib/scan-api";
   ```

2. **State (lines 105–106).** Delete both:
   ```ts
   const [competitorTarget, setCompetitorTarget] = useState("");
   const [techStackInput, setTechStackInput] = useState("");
   ```

3. **`resetToIdle` (lines 155–156).** Delete the two now-orphaned setters:
   ```ts
   setCompetitorTarget("");
   setTechStackInput("");
   ```

4. **`onScan` dead locals + setters (lines ~168–188).** Remove the
   `competitor`/`techStack` locals, the two setters, and simplify the
   `captureLead` / `captureEvent` payloads that referenced them:
   - Delete `const competitor = "";` and `const techStack = "";` and the
     explanatory comment above them (replace with a one-line note that the form
     is domain-only; competitor + stack are auto-discovered downstream).
   - In the `captureLead("free_scan_requested", …)` call (line 183), drop
     `competitor` and `tech_stack: techStack` (both always `""`); keep
     `domain`, `email`, `scan_id`. *(Analytics shape change: two always-empty
     fields removed — see Honest-broker / Out-of-scope.)*
   - Delete `setCompetitorTarget(...)` (line 186) and `setTechStackInput(techStack)`
     (line 187).
   - In `captureEvent("scan_result_shown", …)` (line 275), drop
     `tech_stack_entered: techStack` (always `""`). Keep
     `tech_stack_detected` (real, measured from `r.techStack`).

5. **Call sites that still need the props.** `ScanResult` and `Tier2Card` keep
   their prop signatures, so pass literals:
   - `<ScanResult … competitor="" techStackInput="" … />` (was `competitorTarget`
     / `techStackInput`).
   - `<Tier2Card target={target} competitor="" tier2={tier2} />` (was
     `competitorTarget`).

   Net render effect: identical, because the removed state was always `""`.

### scan-api.ts decision (do NOT delete the export in this task)

`runCitationTeaser` and `TeaserResponse` in `lib/scan-api.ts` are:
- imported and asserted by `web/__tests__/scan-api.test.ts` (two `describe`
  cases: network-failure → `null`, and success → parsed body), and
- referenced by the comparative `Tier2State` variant + `Tier2Card` comparative
  render in `ScanResult.tsx`.

Removing the export would cascade into deleting tests and the comparative
`Tier2Card` branch — **out of scope** for a "prune the dead branch in
LiveScan.tsx" cleanup. This spec **keeps** the export; it only removes the dead
**import in LiveScan.tsx**. Leaving the lib function (with its tests) as a
ready, tested hook for a future wired competitor path is the honest, minimal
boundary. If a follow-up wants to fully retire comparative Tier-2, that is a
separate spec touching `scan-api.ts`, `ScanResult.tsx`, and the test.

### Data shapes (unchanged)

- `Tier2State` (in `ScanResult.tsx`) — **unchanged**. We still construct only the
  non-comparative variants from `LiveScan.tsx`; the comparative variants remain
  in the type for `ScanResult.tsx`'s own use.
- `ScanResponse` / `RenderDiff` / teaser response types in `scan-api.ts` —
  **unchanged**.

## Acceptance criteria (checklist)

- [ ] `runCitationTeaser` is no longer imported in `LiveScan.tsx`
      (`runCitationTeaserAuto`, `runHygieneScan`, `ScanReport` still imported).
- [ ] `competitorTarget` and `techStackInput` state declarations are gone from
      `LiveScan.tsx`; no `setCompetitorTarget` / `setTechStackInput` references
      remain anywhere in the file.
- [ ] `const competitor = ""` and `const techStack = ""` locals and their
      explanatory comment are gone; no remaining reference to `competitor` or
      `techStack` identifiers inside `onScan`.
- [ ] `<ScanResult>` and `<Tier2Card>` are passed `competitor=""` /
      `techStackInput=""` literals; their prop signatures in `ScanResult.tsx`
      are unchanged.
- [ ] The honest failure path is byte-for-byte behaviorally unchanged: blocked /
      unreachable / non-public host still renders the `warn`/`err` line +
      `errorMsg` card and still calls `fireAutoTier2()` (never scored 0, no demo
      fallback).
- [ ] The auto Tier-2 teaser still fires on both the success and blocked paths.
- [ ] `lib/scan-api.ts` is unmodified; `scan-api.test.ts` is unmodified and
      passes.
- [ ] `HeroScan.tsx` and its render-diff UI are unmodified.
- [ ] `npm run build` (typecheck + static export) passes with no new TS or lint
      errors; no `unused variable` / `unused import` warnings introduced.
- [ ] `npm run lint` passes.
- [ ] `npm test` (vitest) passes — same count as before (no tests added or
      removed by this change).
- [ ] Diff is small: one file, deletions + two literal substitutions only.

## Unit-test plan (exact test cases — UI screenshot plan + headless caveat)

This is a **dead-code deletion with zero behavior change**, so the gate is
primarily "the existing suite still passes + nothing regressed visually." No new
unit tests are required by the change itself; add the optional guard test only
if cheap.

### Static / build gate (primary — the merge gate)

1. `npm run build` — Next 16 static export. Must compile clean (strict TS); the
   removed-state edits must not leave dangling references. This is the
   load-bearing check that the prune is complete and type-correct.
2. `npm run lint` — ESLint flat config. Confirms no unused-import / unused-var
   left behind (and none newly introduced).

### Existing vitest suite (must stay green, unchanged)

3. `web/__tests__/scan-api.test.ts` — proves `runCitationTeaser` /
   `runCitationTeaserAuto` / `runHygieneScan` contracts are intact (the export
   we deliberately keep). Run `npm test`; expect the same pass count as before.
4. `web/__tests__/scan-report.test.ts` — `phaseTone` / `phaseValues` /
   `scanFailureCopy` / `scoreBand` helpers used by the live paths we preserve.
   Must stay green.

### Optional guard unit test (only if low-cost)

5. If a lightweight render test for `LiveScan` is added (jsdom via vitest +
   React Testing Library), assert: idle state renders the domain-only form with
   a `name="domain"` and a `name="email"` input and **no** competitor input
   (proving the form never grew a competitor field). This is a regression fence,
   not a requirement of the prune. Skip if RTL is not already wired (it is not
   in `devDependencies` today — do **not** add a dep for this; prefer the
   Playwright DOM assertion below instead).

### Playwright / screenshot plan (UI verification)

`LiveScan` renders on the homepage (`#scan` panel), so the existing
`web/e2e/homepage.spec.ts` suite (`npm run test:ui`) already exercises the page
that contains it. Plan:

6. Run the existing homepage e2e + axe-core suite unchanged — confirms structure
   + zero critical/serious WCAG 2.1 AA violations after the prune.
7. **Idle-state visual diff** of the `#scan` panel: capture a screenshot of the
   LiveScan section in idle mode before and after the change; they must be
   pixel-identical (the prune removes no rendered element — `competitor=""` and
   `techStackInput=""` were already the runtime values).
8. **DOM assertion (preferred over a new RTL dep):** in a Playwright check, scope
   to `#scan` and assert the form has exactly the domain + email + honeypot
   inputs and **no** visible competitor input — locking the "domain-only form"
   invariant.

### CRT / grain headless-hang caveat → deterministic fallback

The site has a global CRT/grain overlay and animated canvases (the Hero
particle-dissolve, the LiveScan idle SAMPLE-reveal loop driven by `setTimeout`,
and the scan progress animation). Under headless Chromium these
continuous-animation + rAF/`setTimeout` loops can keep the page from reaching a
network-idle / stable state, so a naive `waitForLoadState('networkidle')` or
full-page screenshot **can hang or flake**. Mitigations, in order:

- Follow the existing suite's pattern: wait on a concrete selector
  (`waitForSelector('main', { state: 'visible' })`) — **not** `networkidle` —
  exactly as `homepage.spec.ts` already does.
- For the idle-panel screenshot, inject `prefers-reduced-motion: reduce`
  (Playwright `use: { reducedMotion: 'reduce' }` or
  `page.emulateMedia({ reducedMotion: 'reduce' })`) to freeze the SAMPLE-reveal
  loop and grain animation, giving a deterministic frame. The components honor
  reduced-motion (HeroScan jumps straight to the pinned logo; CSS animations gate
  on the media query).
- **Deterministic eval/inspect fallback if screenshots still hang:** skip the
  pixel snapshot and assert structurally via
  `page.locator('#scan form input[name="domain"]')`, `…[name="email"]`, and
  `expect(page.locator('#scan form input[name="competitor"]')).toHaveCount(0)`,
  plus reading the rendered text of the disclaimer. This verifies the prune left
  the rendered tree intact without depending on a stable animation frame.

## Prerequisites / blocked-on (owner resources, other specs, separate-repo)

- **None blocking.** This is a self-contained, in-repo TypeScript edit verifiable
  entirely by local `npm run build` / `npm test` / `npm run lint`. No Supabase,
  no API keys, no `doctl`, no deploy, no live scan-function call (the e2e suite
  explicitly does **not** assert on live-scan results).
- The DigitalOcean scan functions and the live API keys are **not** needed —
  the change does not touch the network paths' behavior, and tests mock `fetch`.
- No dependency on other specs. A future "fully retire comparative Tier-2"
  effort (removing `runCitationTeaser` from `scan-api.ts` + its tests + the
  comparative `Tier2Card` branch) would be a **separate** spec and is explicitly
  out of scope here.

## Honest-broker notes

- **No fabricated metrics.** This removes two *always-empty* analytics fields
  (`competitor`, `tech_stack` / `tech_stack_entered`) that carried no measured
  signal; the real `tech_stack_detected` (measured from `r.techStack`) stays.
  No invented numbers, clients, or citations are added.
- **Schema / llms.txt stay hygiene, never a citation lever.** This change does
  not touch scoring, disclaimers, or any citation copy. The teaser copy that
  says "measured not guaranteed" and "a measurable gap we close, not a
  guaranteed outcome" is preserved verbatim.
- **WAF-blocked / unreachable / non-public host is never scored 0.** The honest
  failure path (`scanFailureCopy` + the blocked-path `fireAutoTier2`) is an
  explicit *keep* and a hard acceptance criterion. The SPA / static-fetch blind
  spot flagging (render-diff) lives in `HeroScan.tsx` and is untouched.
- **Nothing auto-deploys.** This spec is design-only; the edit is human-reviewed
  and human-gated (web `npm test` + build) before any deploy. No auto-send, no
  auto-deploy introduced.
- **No mock/demo path is dressed up as a real pass.** The change *removes*
  unreachable code; it does not add any illustrative-as-real path. The idle
  SAMPLE-reveal remains labeled "sample · enter your domain for a real scan".
- **Refund guarantees the work, not a citation number.** No CTA, pricing, or
  guarantee copy is changed.

## Out of scope

- Deleting `runCitationTeaser` / `TeaserResponse` from `lib/scan-api.ts` and
  their tests in `scan-api.test.ts` — kept as a tested hook; retiring them is a
  separate spec.
- Removing the comparative `Tier2State` variants (`"ready"`, `"skipped"`) or the
  comparative branches of `Tier2Card` / `ScanResult.tsx` — `ScanResult.tsx` is
  not edited beyond receiving the same props.
- Removing the `competitor` / `techStackInput` props from `ScanResult` /
  `Tier2Card` signatures (a broader refactor; this spec passes `""` literals to
  keep the diff minimal and the contracts stable).
- Any change to `HeroScan.tsx`, the render-diff UI, or `scan-report.ts`.
- Any change to the DigitalOcean scan functions (`functions/`) or the pipeline.
- Visual redesign, copy changes, new analytics events, or new tests beyond the
  optional DOM-invariant guard.
