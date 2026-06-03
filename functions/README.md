# Prompt Goblin — Tiered Free Scan Backend (DigitalOcean Functions)

The serverless backend behind the site's **Summon / `goblin scan`** form. The static
marketing site (`../index.html` + `../app.jsx`) can't hold API keys, so the scan's
network + LLM work lives here as two DO Functions web actions.

Honest-broker constraint baked in at the data layer (not just the prose): Tier-1 is
**technical hygiene**, explicitly *not* a citation guarantee. The real levers for AI-answer
citation are brand mentions + Bing ranking, proven via the weekly re-run loop — see each
report's `disclaimer` field and the goblin-voiced `summary`.

## Why Node.js (not Python)

The pipeline is Python, but this backend is **Node.js 24**, deliberately:

- **Zero third-party deps.** Schema/head/robots parsing is done with regex + `URL` +
  global `fetch` (Node 18+), so there's nothing to `pip`/`npm install`. The Python schema
  audit needs `httpx` + `beautifulsoup4`, which on DO Functions requires a `build.sh` +
  remote build (Python has no automatic dependency builder). Node's `package.json` is an
  automatic build trigger and our deps are empty — the simplest, fastest cold start.
- **Native citations with no SDK.** Perplexity's OpenAI-compatible API is a plain HTTPS
  POST; `fetch` is enough. We mirror the pipeline's `PerplexityClient` shape
  (`base_url https://api.perplexity.ai`, top-level `citations` array) without importing
  the OpenAI SDK.

We still **reuse the pipeline's proven logic**: the expected-schema-type list and severity
heuristics come straight from `pipeline/goblin/nodes/schema_audit.py`, and the Perplexity
adapter mirrors `pipeline/goblin/llm_clients.py`.

## Layout

```
functions/
  project.yml                 # DO Functions config (2 web actions, env binding)
  .env.example                # PERPLEXITY_API_KEY (Tier-2 only); never commit .env
  lib/                        # canonical shared source (single source of truth)
    util.js                   # CORS, input validation, SSRF guard, domain normalize
    hygiene.js                # Tier-1 analysis (pure functions, offline-testable)
    voice.js                  # goblin-voiced summaries (deterministic, no LLM)
    perplexity.js             # Tier-2 adapter (native citations via fetch)
    ratelimit.js              # in-memory per-IP+email throttle
  packages/scan/
    tier1/                    # free hygiene scan — no keys, runs for everyone
      index.js  package.json  build.sh
    tier2/                    # email-gated, rate-limited, 1 engine teaser
      index.js  package.json  build.sh
  test/
    scan.test.js              # local mock test — ZERO keys, ZERO network
    invoke-local.js           # invoke a handler locally like DO would
```

`build.sh` copies `lib/*` into each action at deploy time, because the deployer only zips
an action's own directory — it can't reach `../../lib`. The synced copies are gitignored.

## Endpoints

### Tier 1 — `POST /scan/tier1` (free, no keys)

```jsonc
// request
{ "url": "https://example.com" }
// response (200)
{ "ok": true, "tier": 1, "report": { /* see below */ }, "summary": "goblin sniffed…" }
```

`report` includes: `hygieneScore` (0-100), `schema` (found/missing JSON-LD `@type`s +
malformed-block count), `head` (title/meta/canonical/OG/viewport/h1/lang), `crawlability`
(robots.txt presence, per-AI-bot welcome status, sitemap), `llmsTxt` (presence + spec
validity), `coreWebVitalsProxies` (page weight, render-blocking scripts/styles, CLS-risk
images), a severity-sorted `findings[]`, and an honesty `disclaimer`.

### Tier 2 — `POST /scan/tier2` (email-gated, rate-limited, 1 engine)

```jsonc
// request
{ "email": "you@co.com", "domain": "you.com", "competitor": "rival.com" }
// response (200, key configured)
{ "ok": true, "tier": 2, "configured": true, "teaser": { "engine": "perplexity",
  "results": [ { "query", "answer", "sources": ["…"], "clientCited", "competitorCited" } ] },
  "summary": "live Perplexity check…" }
// response (200, NO key) — honest degradation, nothing fabricated
{ "ok": true, "tier": 2, "configured": false, "teaser": null, "summary": "lantern unlit…" }
```

Guards: valid-email gate, `domain != competitor`, 1 free run per IP+email per 24h
(HTTP 429 when exceeded), 1–2 capped queries, single engine. The key is read from
`process.env.PERPLEXITY_API_KEY`, never hardcoded, and never echoed in any response.

## Local test (zero keys, zero network)

```bash
cd functions
npm test                 # syncs lib + runs 33 offline assertions
# or directly:
node test/scan.test.js
```

Eyeball real output locally (Tier-1 does a real fetch; Tier-2 uses the no-key path unless
you export a key):

```bash
node test/invoke-local.js tier1 https://promptgoblin.io
node test/invoke-local.js tier2
PERPLEXITY_API_KEY=pplx-… node test/invoke-local.js tier2 you.com   # live Tier-2
```

## Deploy (`doctl serverless deploy`)

Prereqs: `doctl` installed + `doctl auth init` (token with `function:admin` scope) +
`doctl serverless install`.

```bash
# 1. connect to your Functions namespace (auto if you have exactly one)
doctl serverless connect

# 2. set the Tier-2 key on the namespace (NEVER commit it). project.yml binds
#    PERPLEXITY_API_KEY=${PERPLEXITY_API_KEY} from the deploy environment:
export PERPLEXITY_API_KEY="pplx-…"        # bash/zsh
#   PowerShell:  $env:PERPLEXITY_API_KEY = "pplx-…"

# 3. deploy (remote build runs each action's build.sh to sync lib/)
doctl serverless deploy . --remote-build -o json

# 4. get the invoke URLs
doctl serverless functions get scan/tier1 --url
doctl serverless functions get scan/tier2 --url
```

`build.sh` replaces the automatic `npm install` (we have no deps), so the remote build just
syncs `lib/` into each action and zips it. To rotate the key later, re-export and redeploy,
or set it in the DO control panel (Functions → namespace → Settings → Environment Variables).

CORS is locked to `https://promptgoblin.io` (localhost allowed for dev) in
`lib/util.js → corsHeaders`.

## Wiring to the site

See `WIRING.md` (proposed `app.jsx` changes) — the Summon/scan form should POST the URL to
the Tier-1 URL on submit, render the report in the existing `LiveScan` terminal, then POST
email+domain+competitor to the Tier-2 URL behind the email gate.

## Notes / future hardening

- The rate limiter is **in-memory** (warm-container best-effort), an accepted trade-off for
  a free teaser. For hard cost caps across cold starts / multiple containers, swap
  `lib/ratelimit.js`'s `Map` for a DO Managed Redis / KV store.
- Tier-2 is one engine (Perplexity) by design — the cheapest honest citation signal with the
  best Bing overlap. Adding engines is a paid-tier concern, not the free teaser.
