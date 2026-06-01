# Front-end wiring (PROPOSED — not applied)

This lane owns `functions/` only. Below are the exact, minimal `app.jsx` changes to wire the
Summon/scan form to the two functions. Today `LiveScan` (`app.jsx` ~line 1106) plays a
*scripted* demo (`scanScript`); these changes make it render a **real** Tier-1 report and,
behind the email gate, a **real** Tier-2 teaser.

## 1. Add config near the other integration config (top of `app.jsx`, ~line 11)

```js
// Prompt Goblin scan backend (DO Functions web actions). Fill after `doctl serverless deploy`.
const SCAN_API = {
  tier1: "https://<your-namespace>.<region>.functions.digitalocean.com/api/v1/web/fn-.../scan/tier1",
  tier2: "https://<your-namespace>.<region>.functions.digitalocean.com/api/v1/web/fn-.../scan/tier2",
};
```

(Get each URL from `doctl serverless functions get scan/tier1 --url`.)

## 2. Tier-1 helper (place beside `captureLead`)

```js
async function runHygieneScan(url) {
  if (!SCAN_API.tier1 || SCAN_API.tier1.includes("<your-namespace>")) {
    console.info("[scan] tier1 endpoint not configured");
    return null; // falls back to the existing scripted demo
  }
  try {
    const r = await fetch(SCAN_API.tier1, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

async function runCitationTeaser({ email, domain, competitor }) {
  if (!SCAN_API.tier2 || SCAN_API.tier2.includes("<your-namespace>")) return null;
  try {
    const r = await fetch(SCAN_API.tier2, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, domain, competitor }),
    });
    return await r.json(); // 200 even on no-key path; 429 when rate-limited
  } catch {
    return null;
  }
}
```

## 3. In `LiveScan.onScan` (~line 1154), call Tier-1 and build the terminal lines from the
real report instead of the static `scanScript`

```js
const onScan = async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  if (data.botcheck) return; // honeypot
  captureLead("free_scan_requested", { domain: data.domain, email: data.email });
  setEmail(data.email || "");
  setDone(false);

  const report = await runHygieneScan(data.domain || "");
  if (report?.ok) {
    setTarget(data.domain.trim());
    setReportLines(reportToTerminal(report)); // see helper below; feed into the existing render
    // email-gated Tier-2 teaser (honest no-op if backend/key absent)
    const teaser = await runCitationTeaser({
      email: data.email,
      domain: data.domain,
      competitor: data.competitor || "", // add a competitor field to the form, or infer
    });
    if (teaser?.ok && teaser.configured) setTeaser(teaser);
  } else {
    setTarget((data.domain || "").trim()); // keep the scripted demo as graceful fallback
  }
};
```

## 4. Map the report into the existing terminal line shape (`{ t, text, sev }`)

```js
function reportToTerminal(resp) {
  const r = resp.report;
  const out = [
    { t: "cmd", text: "goblin scan --surface hygiene --url " + r.url },
    { t: "kv", k: "hygiene", v: r.hygieneScore + "/100" },
    { t: "info", text: "schema found: " + (r.schema.found.join(", ") || "none") },
  ];
  r.findings.slice(0, 6).forEach((f) =>
    out.push({ t: "issue", sev: f.severity >= 4 ? "HIGH" : f.severity === 3 ? "MED" : "LOW", text: f.detail })
  );
  out.push({ t: "sep" });
  out.push({ t: "ok", text: resp.summary }); // carries the honesty caveat verbatim
  return out;
}
```

## 5. Add a `competitor` input + keep the honeypot

The Summon form already has `email`, `domain`, and a `botcheck` honeypot. Add one optional
field so Tier-2 has a named rival to diff against:

```jsx
<input name="competitor" placeholder="a competitor domain (optional)" autoComplete="off" />
```

## Notes

- All helpers degrade silently when the endpoints are placeholders, so committing this with
  unfilled URLs does not break the live site — the existing scripted demo still plays.
- The Tier-1 `summary` and the report's `disclaimer` carry the honest "hygiene ≠ citation
  guarantee" language; render the `summary` line as-is so the brand promise stays intact.
- Tier-2 returns HTTP 429 with `retryAfterHours` when the per-IP+email cap is hit — surface
  that as a nudge toward Goblin Scout rather than an error.
```
