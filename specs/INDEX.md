# Specs — implementation index

> Authored by Claude (spec/review lane), gate-verified to **APPROVE** (10/10, honest-broker clean) via a two-pass spec→verify→revise→re-verify workflow, 2026-06-06. **Codex implements through the gate; nothing here is merged or deployed.** Each spec carries its own acceptance criteria + named unit-test plan + honest-broker constraints.

## Status: all APPROVE

| Spec | Repo | Gate before merge | Ready now? |
|---|---|---|---|
| [freshness-cadence-check](freshness-cadence-check.md) | functions + pipeline | graph-keeper + `functions npm test` | ✅ yes |
| [per-platform-rec-tagging](per-platform-rec-tagging.md) | pipeline | graph-keeper | ✅ yes |
| [third-party-platform-presence](third-party-platform-presence.md) | pipeline | graph-keeper | ✅ yes |
| [topical-authority-proxy](topical-authority-proxy.md) | pipeline | graph-keeper | ✅ yes |
| [citation-verification-layer](citation-verification-layer.md) | pipeline + functions + supabase | graph-keeper + integrity | ◑ offline core now; live-verify + Supabase fields gated |
| [prune-tier2-dead-branch](prune-tier2-dead-branch.md) | web | `web npm test` + build | ✅ yes |
| [docs-methodology-and-aeo-geo](docs-methodology-and-aeo-geo.md) | web | integrity-reviewer (copy via copywriter) | ✅ yes (branch — deploy-on-push) |
| [supabase-pgvector-schema](supabase-pgvector-schema.md) | supabase (new) | schema review + RLS tests | ✅ creds in `.env` (`SUPABASE_CONNECTION_STRING` runs migrations) |
| [dashboard-mvp](dashboard-mvp.md) | web + supabase | integrity + qa(axe) + schema | ◑ Supabase ✓ — still needs `web/` cutover + service-role-vs-connection-string call |
| [vector-rag-ingestion](vector-rag-ingestion.md) | pipeline + supabase | graph-keeper + schema | ◑ Supabase ✓ — still needs an embeddings key (or reuse Gemini) + schema §0 sign-off |

## Implementation order (dependency-aware)

**Pre-req:** fix the pipeline pytest blocker first (Codex, `fix/pipeline-pytest-contract`) so pipeline is green before adding pipeline features.

**Wave 1 — ready now, each on its own branch, each gated, owner merges:**
- Pipeline (graph-keeper): `freshness` → `per-platform-rec-tagging` → `third-party-platform-presence` → `topical-authority-proxy`. Independent of each other; sequence by reviewer bandwidth. Each: implement → `pytest -q` + `goblin.eval` green → graph-keeper APPROVE → branch.
- `citation-verification-layer` **offline core** (pipeline + functions verdict logic + tests) can land now; the live-fetch verification, Supabase `citation_status` field, and dashboard surfacing wait on Wave 2.
- Web: `prune-tier2-dead-branch` (small) → `web npm test` + build.
- Docs: `docs-methodology-and-aeo-geo` — copy via copywriter → integrity-reviewer → branch (deploy-on-push, so do not merge to `main` until owner approves the cutover/content).

**Wave 2 — owner-unblock first, then:**
1. `supabase-pgvector-schema` — provision a Supabase project, run migrations, RLS tests green.
2. then `dashboard-mvp` (also needs the `web/` cutover deploy) **and** `vector-rag-ingestion` (also needs an embeddings key + the schema §0 channel-vs-role reconciliation signed off).

## Owner-unblock list (these gate Wave 2)
- ✅ **Supabase project + keys** — in root `.env` (`SUPABASE_PROJECT_URL`, `SUPABASE_KEY` = publishable, `SUPABASE_CONNECTION_STRING` = Postgres), gitignored. Unblocks `supabase-pgvector-schema`.
- **Embeddings API key** — still needed for `vector-rag` (no OpenAI/Voyage in `.env`; could reuse the existing Gemini key — decide).
- Decide the **`web/` static→Node cutover deploy** — blocks `dashboard-mvp`.
- **Service-role key decision** for the dashboard server client (or: privileged writes via the pipeline using `SUPABASE_CONNECTION_STRING`, client reads via publishable key + RLS).
- **Rotate sensitive secrets** — the `.env` screenshot exposed live values (Stripe live secret, DB connection string) into the chat transcript; rotate if it could leak. (DO token + WORKDAY_PASSWORD rotation already on PLAN.)

## Notes
- Specs are the **contract** (file paths, signatures, data shapes, thresholds, test names); illustrative code bodies in them are not final code.
- Every spec preserves the honest-broker line: schema = hygiene, never a citation lever; unreadable/WAF/SPA never scored 0; nothing auto-deploys; mock/sample reads as illustrative; refund covers the work, not a citation number.
