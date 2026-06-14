# Leads pipeline (Track 2 — local, compliant, manual-send)

A zero-budget, **honest-broker-clean** outbound pipeline. No browser scraping, no
ESP cold-blast. You generate or export the lead list from permitted sources; these
scripts ingest it, run a **real** Tier-1 hygiene scan on each domain, and write a
LinkedIn connect note / DM **draft** you review and send **manually**.

## What this is NOT

- ❌ No LinkedIn automation. No headless browser drives any platform.
- ❌ No "rotate keywords to dodge limits" scraping. Scale comes from permitted
  JSON/CSV/Apollo exports, referrals, manual research, or other licensed sources.
- ❌ No Resend / ESP sending. Nothing here fires an email.
- ❌ No fabricated "AI visibility score". Tier-1 measures **hygiene** (parse/crawl
  health) — table stakes, not a citation guarantee. A site we can't read is a
  **blind spot (NULL)**, never a 0.

## Flow

```
pending_leads.json  ──import-local-leads──▶  leads_queue (status 'new')
leads_queue 'new'   ──process-leads──────▶  real Tier-1 scan
                                              ├─ ok  → hygiene_score + DM draft  (status 'drafted')
                                              └─ not → honest scan_status        (status 'scan_failed', NULL score)
you, in /crm        ──work the pipeline─▶  review drafts, send by hand, advance stages
```

## The CRM dashboard (`/crm`)

A full in-app CRM over `leads_queue`, gated to operator seats (`canReview`, same as
`/approvals`). Open **/crm** in the signed-in dashboard:

- **Stat strip** — funnel counts (total, needs scan, ready to send, in flight, replied,
  won, follow-ups due).
- **Table or Pipeline view** — toggle in the toolbar (`?view=pipeline`). The Kanban board
  has one column per pipeline stage; the table is sortable by recent activity / priority /
  hygiene score / company. Filter by status, search company/domain/contact.
- **Lead detail drawer** — click any lead: the **real** hygiene scan (score or honest blind
  spot, never a 0), the **connect note** (≤300-char cold opener) and **follow-up DM** drafts
  (editable, with copy buttons), private notes, priority, a follow-up reminder date, and the
  pipeline stage controls. **Open profile ↗** opens their LinkedIn so you paste + send by hand.
- **Add lead** — manual single-lead entry (stored in Supabase, owner-scoped via RLS).

Every write goes through your user session (RLS = `owner_user_id = auth.uid()`); nothing in
the CRM sends a message, emails anyone, or drives LinkedIn. Stages past `drafted`
(`connect_sent → connected → contacted → replied → won/lost`) only **record** what you did by
hand off-platform.

## Apollo import (compliant, licensed data)

Apollo.io is a **licensed** B2B data provider — pulling your leads via its API/MCP or a CSV
export is not scraping and not LinkedIn automation. LinkedIn URLs come from Apollo's own field.

- **Your enriched Contacts** (saved + email/phone-enriched in Apollo) are pullable via the MCP
  `apollo_contacts_search`. 25 were imported on 2026-06-14.
- **Net-new prospecting** (`mixed_people` search) is **blocked on a free API plan** — the MCP
  token returns `API_INACCESSIBLE` even though the Apollo UI is Tier 2. So scale via a **CSV
  export from the Apollo UI** (prospect → select → Export), then:
  ```bash
  node scripts/import-apollo-leads.mjs path/to/apollo-export.csv --owner-id <uuid>
  # or: --owner-email <you@example.com>   ·   add --dry-run to preview
  ```
  The importer maps Apollo's export columns, derives the domain from Website/email, dedupes by
  apollo_person_id / linkedin_url / email (idempotent), and inserts with `source='apollo-csv'`.
  Emails/phones come through the CSV; if you exported un-enriched rows, emails stay NULL and you
  enrich the priority ones in Apollo (costs lead credits).
- Migration `0018_leads_apollo_people.sql` made `leads_queue` people-centric (one row per
  person, not per domain) and added `email`, `phone`, `headline`, `location`, Apollo ids.

## Setup (once)

1. Apply the migration `supabase/migrations/0017_leads_queue.sql`
   (via the Supabase MCP connector or `supabase db push` — it's human-gated, not auto-applied).
   **Already applied live** (2026-06-14) — the enriched schema adds the connect note,
   pipeline-stage timestamps, priority, tags, and follow-up reminder columns.
2. Make sure secrets are present: `pwsh scripts/doppler-pull-env.ps1`
   (populates `web/.env.local` with `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`).
3. Tell the scripts whose leads these are — add ONE of these to `web/.env.local`:
   ```
   LEADS_OWNER_USER_ID=<your auth.users uuid>
   # or
   LEADS_OWNER_EMAIL=<your login email>
   ```
   Optional: `LEADS_REPORT_LINK=https://promptgoblin.io/#scan` (where the draft sends them).

## Use

```bash
# from web/
cp scripts/pending_leads.example.json scripts/pending_leads.json   # then fill it in by hand

node scripts/import-local-leads.mjs --dry-run     # preview
node scripts/import-local-leads.mjs               # insert new leads (idempotent; skips dupes)

node scripts/process-leads.mjs --limit 10 --dry-run   # scan + print drafts, write nothing
node scripts/process-leads.mjs --limit 10             # scan + store drafts
node scripts/process-leads.mjs --rescan               # retry transient scan_failed rows
```

Run via Doppler instead of `.env.local` if you prefer: `doppler run -- node scripts/process-leads.mjs`.

## Scaling to 200+ permitted leads

Use a local JSON array or Apollo CSV export and let the importer do the boring
parts: normalize domains, tolerate same-company contacts, skip duplicates, and
leave existing scanned/drafted rows untouched. People dedupe prefers Apollo person
ID, then LinkedIn URL, then email, then domain+contact fallback.

```bash
# Preview a large local JSON import without writing anything.
node scripts/import-local-leads.mjs path/to/pending_leads.json --dry-run

# Insert only new people. Existing rows are never clobbered.
node scripts/import-local-leads.mjs path/to/pending_leads.json

# Process in batches so the live scan function is treated gently.
node scripts/process-leads.mjs --limit 25
```

For 200+ rows, run `process-leads.mjs --limit 25` repeatedly until the queue is
clear, or pick a limit that matches the available runtime. Failed scans remain
`scan_failed` with a NULL hygiene score; retry transient failures with `--rescan`.

## Input shape

Array of objects (or `{ "leads": [...] }`). Required: `company_name`, `domain`.
Optional: `contact_name`, `contact_title`, `linkedin_url`, `email`, `phone`,
`headline`, `location`, `apollo_person_id`, `competitor`, `icp_segment`, `source`.
See `pending_leads.example.json`.

## Sending (manual, by you)

In **/crm**, open each lead, review the connect note / DM draft (edit freely — they're built
only from findings the scan actually returned), hit **Open profile ↗**, paste + send by hand,
then advance the stage (Connect sent → Connected → DM sent → Replied → Won/Lost). The
matching timestamp is stamped automatically when you move a stage.
