# Email templates

Branded HTML emails for leads. Dark + lime, table-based with inline styles so
they render in Gmail, Outlook, and Apple Mail.

## `scan-report.html` — the free-scan report reply

Sent (by hand, for now) to a lead after their free scan. Replace every
`{{PLACEHOLDER}}` with the lead's **real, measured** data:

| Placeholder | What goes there |
|---|---|
| `{{FIRST_NAME}}` | lead's first name |
| `{{DOMAIN}}` | the domain you scanned |
| `{{SCORE}}` / `{{HIGH}}` / `{{MEDIUM}}` / `{{LOW}}` | hygiene score + finding counts from the scan |
| `{{FINDING_1..3}}` | the top things the scan actually found |
| `{{TECH_STACK}}` | detected/entered stack (so fixes are mapped to it) |
| `{{FIX_1..3}}` | what you'd fix first, ranked |

### How to send (so it arrives STYLED)

Gmail and most webmail have **no "paste HTML source" option** — pasting the raw
`.html` as text is exactly what sends it unstyled. Send the **rendered** email:

1. Fill in every `{{PLACEHOLDER}}` with real, measured data.
2. Open the filled `scan-report.html` in a browser (double-click the file).
3. Click in the page, **select all** (Ctrl/Cmd+A), then **copy** (Ctrl/Cmd+C).
4. In Gmail hit Compose, click the message body, **paste** (Ctrl/Cmd+V), and send
   from `goblins@promptgoblin.io`. The dark card, lime, and layout survive: it's
   all `bgcolor` tables + inline styles, which Gmail keeps. (Pasting the *file* or
   its *source code* does not work — you must copy the *rendered* page.)

Alternatives:
- A Chrome extension that accepts pasted HTML (e.g. "Send as HTML email", GMass).
- **`send.mjs`** — fills the placeholders and sends pixel-perfect over an email
  API. Best for volume. See below.

## Automated send — `send.mjs`

Zero-deps Node script (native `fetch`). Fills every `{{PLACEHOLDER}}` from a JSON
data file and sends via **Resend** (default) or **Postmark**.

### One-time setup
1. `cp email-templates/.env.example email-templates/.env`
2. In Resend (or Postmark): create an API key **and verify the sending domain**
   (SPF/DKIM) — without this, mail spams or bounces. The from-domain in `MAIL_FROM`
   must be the one you verified. If you only control `promptgoblin.io` DNS, set
   `MAIL_FROM=Prompt Goblin <goblins@promptgoblin.io>` rather than `.com`.
3. Paste the key into `email-templates/.env` (gitignored — never commit it).

### Per-lead send
1. `cp lead.example.json lead.json` and replace with the lead's **real, measured**
   values (it's gitignored — it holds their data).
2. Dry run (writes a filled `.html`, sends nothing):
   `node email-templates/send.mjs --data email-templates/lead.json`
3. Open the printed preview, proof-read it, then send:
   `node email-templates/send.mjs --data email-templates/lead.json --send`

### Built-in guards
- **Dry run by default** — never sends without `--send`.
- Refuses to send with any **unfilled `{{PLACEHOLDER}}`**.
- Refuses a **0 / blank / non-numeric `SCORE`** (the SPA static-fetch blind spot).
  Override with `--allow-zero` only when the score is genuinely real.
- Values are HTML-escaped; dev comments are stripped from the outgoing email.

### Honest-broker rules (non-negotiable)

- Never invent a score, finding, or number. If it wasn't measured, it doesn't go in.
- Hygiene is **not** a citation guarantee. The disclaimer block says so; keep it.
- The refund covers the **work**, never a citation number.
- An unreadable / JS-rendered (SPA) site is never scored 0: flag the static-fetch
  blind spot and ask them to confirm their stack instead.

### Images (logo + stack icon)

Email clients strip inline `<svg>`, so `send.mjs` attaches images **inline as CID
attachments** (not hosted) — they render even when the recipient blocks remote
images, and need no deploy. It inlines `assets/logo.png` (`cid:logo`) and, when
`TECH_STACK` matches a known brand, that brand's icon (`cid:stackicon`).

Regenerate the assets after a logo change or to add/update brand icons:

```
cd web && node scripts/gen-email-icons.mjs   # needs the `sharp` devDependency
```

This writes `email-templates/assets/` (logo.png, one PNG per curated brand icon,
and `icons.json` for matching). Icons render in their brand color, falling back to
lime for near-black marks so they stay visible on the dark card.

> The template still references the hosted logo URL for the browser/copy-paste
> preview path; `send.mjs` swaps it to `cid:logo` automatically at send time.
