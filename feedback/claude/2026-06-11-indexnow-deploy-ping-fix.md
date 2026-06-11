# Spec: IndexNow deploy-ping fix + proper site-publish automation

**Author:** Claude (specs lane) · **Date:** 2026-06-11 · **Branch:** `fix/indexnow-canonicals`
**For:** Codex (integrator) — the CI fix is applied; the web-side automation is yours to implement.

---

## Context

Reviewing "is everything done for Bing?" surfaced one real bug and one design gap
in the IndexNow path. Site verification (`msvalidate.01` + `BingSiteAuth.xml`),
the IndexNow key (`public/indexnow.txt`), the `/indexnow` POST endpoint, and the
`/learn/*` canonicals are all done on this branch — but **not merged/deployed**,
and the deploy-time ping was a silent no-op.

## Bug (FIXED in this commit — CI/infra, my lane)

`.github/workflows/deploy.yml` pinged IndexNow with `{"host":"promptgoblin.io"}`
and **no `urlList`**. The `/indexnow` route (`web/app/indexnow/route.ts:46`)
returns **400 "Missing urlList"** when `urlList` is absent/empty, and the step's
`|| echo 'IndexNow ping skipped'` swallowed the 400 — so every deploy silently
failed to submit anything.

**Fix applied:** the step now fetches the live `/sitemap.xml`, extracts `<loc>`
URLs, and POSTs them as `urlList`. Failures are no longer masked
(`continue-on-error: true` keeps a ping failure visible without rolling back a
successful functions deploy).

## UPDATE 2026-06-11 — web automation IMPLEMENTED (owner said "do everything")

The design gap below is now addressed in code (normally Codex's lane; done here on
explicit owner instruction):

- `web/scripts/indexnow-submit.mjs` — fetches the deployed `/sitemap.xml`, filters
  to deduped same-host https URLs (mirrors the server's `ownSiteUrls` guard), and
  POSTs them to `/indexnow`. Supports `--dry-run` and `--base`. Pure helpers
  (`extractLocs`, `sameHostHttps`, `buildSubmission`) are exported for testing.
- `web/package.json` — `npm run indexnow:submit` script.
- `web/__tests__/indexnow-submit.test.ts` — 4 unit tests (extract, host/https
  filtering, dedupe, malformed-URL skip).

Verified: `npm test` 86/86 · `npm run lint` clean (also fixed a pre-existing
unescaped-apostrophe error in `learn/technical-seo-for-ai-search`) · `npm run build`
clean (24 routes) · `--dry-run` against live prod sitemap returned all 12 URLs.
Chosen trigger = **deliberate human-run / CI step** (not silent auto-fire), per
honest-broker. Submits full sitemap; changed-URLs-only remains a later optimization.

## Design gap (original — now implemented above)

The ping lives in the **functions** deploy workflow (manual `workflow_dispatch`).
But functions deploys don't change site content, and the **site** (`web/`) deploys
separately via DO App Platform deploy-on-push. So the only automated trigger we
control fires on the wrong event. The CI fix makes the manual ping a useful
"resubmit the whole sitemap" button, but **TODO S-15 ("submit changed URLs on
every publish") is still not satisfied** for the real site-publish path.

### Recommended implementation (web/ — honest-broker delivery code, Codex's lane)

Add a standalone submit script + wire it to the web publish, e.g.
`web/scripts/indexnow-submit.mjs`:

- Read the same URL list the sitemap uses (import from `lib/site.ts` /
  `app/sitemap.ts` so there's a single source of truth — do **not** hardcode a
  second list).
- POST `{ urlList }` to `https://promptgoblin.io/indexnow` (reuse the existing
  own-host-validated endpoint; don't duplicate the api.indexnow.org call).
- Surface non-2xx as a non-zero exit; log the count submitted.

Trigger options (pick one, document the choice):
1. **`postbuild` npm script** — runs in the DO build container. Simplest, but
   fires before the new content is actually live (Bing may crawl stale content)
   and depends on outbound network from the build container.
2. **Post-deploy / manual** — keep it a deliberate step the human runs (or the
   App Platform post-deploy job, if available) after the deploy is live. Aligns
   with the honest-broker "nothing auto-ships" posture and crawls fresh content.

I lean **(2)**: a `npm run indexnow:submit` script the human runs post-deploy,
mirrored by the now-fixed CI step. Avoid full auto-fire on every push.

"Changed URLs only" (true S-15) is a later optimization — submitting the full
sitemap (~12 URLs) on publish is well within IndexNow limits and is honest.

## Remaining Bing gaps (not code — flagged for the owner)

- **S-13 — Bing Webmaster Tools:** placing the meta/XML ≠ verified. Still must
  click *Verify* in BWT and submit the sitemap manually.
- **Confirm the verification GUID is real.** `540C5A89…` (in `layout.tsx` +
  `BingSiteAuth.xml`) must be the token from the owner's actual BWT account, not
  a placeholder — otherwise verification fails.
- **Merge + deploy.** None of this branch is live on promptgoblin.io yet.

## Verification for the CI fix

- `grep -oE '<loc>[^<]+</loc>'` against the deployed sitemap yields the 12 URLs
  in `web/app/sitemap.ts`; all are `https://promptgoblin.io/...`, so they pass
  the endpoint's `ownSiteUrls` host check (cap is 100; we send 12).
- `jq` is preinstalled on `ubuntu-latest` runners.
