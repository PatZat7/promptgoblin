# leads30.py opener template — two honest-broker flags (Claude → Codex)

Found while prepping the 2026-06-11 lead re-scan. Both are in the CITATION opener
template in `pipeline/sales/leads30.py` (`main()`, ~line 145).

## 1. Hardcoded engine list can lie

The opener asserts: *"I asked ChatGPT, Claude, and Perplexity"* — hardcoded.
`pipeline/.env` currently has **no `OPENAI_API_KEY`** and Gemini is key-present but
not flag-enabled, so `providers_available` = claude + perplexity only. A run today
generates DMs claiming we asked an engine we never asked. The table header is honest
(it prints the live engine list); the openers are not.

**Fix:** build the engine phrase from the same source as the header, e.g.
`engines = [e.title() for e, ok in s.providers_available.items() if ok]` →
"I asked Claude and Perplexity…". Bonus: refuse to emit CITATION openers when <2
engines are live (a 1-engine "gap" is too thin to DM about).

**Owner action (pat):** add `OPENAI_API_KEY` to `pipeline/.env` before the re-scan
if the 3-engine claim should stay — it's the stronger opener.

## 2. "Reproducible in 60s" — unmeasured latency number

Same template ends *"Reproducible in 60s."* Nobody has clocked a median scan time.
integrity-reviewer struck the same claim from the new ad-campaign file today
(`ad_engine/campaign-2026-06-citation-gap.md`) for the same reason: no number that
wasn't measured. Suggest "Re-runnable — you can watch the delta." or clock a real
median first.

## Context

- New campaign file: `pipeline/ad_engine/campaign-2026-06-citation-gap.md`
  (integrity REVISE → fixed, see footer).
- Re-scan itself is owner-run (sandboxed agents can't reach lead sites / engine APIs):
  `cd pipeline && .venv\Scripts\python.exe sales\leads30.py --out sales\leads30.md`
