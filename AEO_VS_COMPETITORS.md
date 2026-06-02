# How to See Your AEO/SEO Working vs. Competitors

> A practical, honest, repeatable guide. Use it on your own site before/after a fix, and show it to prospects so they can verify the work themselves. Last updated 2026-06-02.

## The honest baseline (read this first)
Schema/markup is **hygiene** — it makes your content machine-readable, but there is **no evidence markup alone earns AI citations**. The real, measurable levers are:
1. **Being in the index the engine reads** — Bing first (ChatGPT/Copilot lean on it), then Google.
2. **Brand mentions across credible third‑party sources** — the "web consensus" signal engines actually weight.
3. **Content that is factually dense, structured for extraction, and fresh.**

Everything below measures *those* levers. Anyone who promises citations from schema alone is selling you hygiene as magic.

---

## 1. Answer‑engine citation checks (the core test)

**What you're testing:** for a given buyer question, does the engine name *you*, a *competitor*, or *nobody* — and which sources does it cite?

### How each engine sources answers
| Engine | Retrieval | Primary index | Citations |
|---|---|---|---|
| ChatGPT (Search on) | RAG, live web | **Bing** (primary, confirmed) + partial Google | numbered footnotes when Search is active |
| Microsoft Copilot | RAG, Bing‑grounded | **Bing** | inline numbered |
| Perplexity | retrieval‑first, ~20 sources fetched, ~3–4 cited | own crawler + Bing | inline, highest citation volume |
| Gemini | Google index + Knowledge Graph | **Google** | inline links |
| Google AI Overviews | Google index, normal Search eligibility | **Google** | expandable source list |

*(Citation‑volume/share figures circulating online come from vendor studies — Yext 2025, Conductor, arXiv Yang et al. — treat as directional, not engine‑confirmed.)*

### Prompt templates — run these in each engine
Record: (a) were you cited? (b) which competitors were cited? (c) what position?

**Category / vendor discovery**
```
Who are the best [your category] in [city/region]?
Who provides [service] for [industry] businesses?
What companies help with [job-to-be-done]?
```
**Hiring intent**
```
Who should I hire to [outcome the buyer wants]?
Which [agency/tool/specialist] is best for [problem]?
I need help with [problem] — who does that?
```
**Problem‑aware**
```
Why isn't my business showing up in ChatGPT/AI answers?
How do I get my brand mentioned in AI search?
```
**Comparison / reputation**
```
Compare [Your Brand] vs [Competitor] for [service].
What do people say about [Your Brand]? Is it reputable?
```

### Run them correctly
- **ChatGPT:** paid tier, Search **on** (globe icon). A training‑only answer doesn't reflect today's index.
- **Perplexity:** default mode; count the "Sources" panel — yours vs. competitors'.
- **Gemini:** gemini.google.com (not the API).
- **Google AI Overviews:** exact query in Google, logged‑out/incognito. AI Overview only fires on some queries — absence isn't a fail; note when it appears.
- **Copilot:** bing.com/chat; compare its citations to plain Bing results for the same query.

### Read the result
- **Cited by name** → positive signal.
- **Described but not named** → you exist in training but lack web consensus to be named.
- **Competitor cited instead** → log which competitor + which engine + which query. That's your gap, named.
- **Nobody cited / answered without you** → both index presence *and* mention volume are thin.

### Track over time (this is the proof)
Keep a fixed log — same 8–10 queries × 5 engines, same wording, same day each month:
```
Date | Engine | Query | You cited? | Position | Competitors cited | Notes
```
Don't change query wording between months. Don't re‑ask in one session (engines adapt to context). Expect **6–12 weeks** before mention‑driven changes show up *(estimate from crawl/index cycles — not an engine‑published guarantee)*.

---

## 2. Traditional SEO vs. competitor

**Google, no tools:**
```
"[Your Brand]"                     → do you own your brand SERP / Knowledge Panel?
site:competitor.com                → their indexed page count
site:yourdomain.com                → yours, for comparison
[service] near me                  → who's in positions 1–3 / the Local Pack?
how to [topic]                     → who owns the featured snippet & People‑Also‑Ask?
```

**Free tools (your own site):**
- **Google Search Console** — Performance ▸ Queries; filter to positions 5–15 for "striking‑distance" wins. (No competitor data — hard limit.)
- **Bing Webmaster Tools** — same data for Bing (see §3; critical).
- **Ahrefs Webmaster Tools** — your backlinks + ranking keywords, free for verified sites.

**Paid (only when you need competitor rank tracking — pick one):** SE Ranking (~$52/mo) or Mangools/SerpWatcher (~$29/mo) for budget; Semrush (~$139/mo) or Ahrefs (~$129/mo) for depth (keyword/backlink gap vs. competitors).

**Practical minimum:** GSC + Bing WMT + Ahrefs WMT (all free) cover your own site fully; add a ~$30–50/mo tracker when you need competitor positions.

---

## 3. Why Bing matters for AEO (don't skip this)
Microsoft's Prometheus system grounds Copilot/Bing Chat in the **Bing index**; ChatGPT Search's confirmed primary partner is **Bing**. **If you're not in Bing, ChatGPT Search and Copilot can't cite you — no matter your Google rank.**

**Verify + fix Bing indexing:**
1. `site:yourdomain.com` at **bing.com** — zero results = an indexing problem.
2. **bing.com/webmasters** — verify ownership; submit your XML sitemap; check the Sitemap Index Coverage report (indexed vs. excluded + reasons); use URL Inspection per page.
3. **IndexNow** — Microsoft explicitly recommends sitemaps **+** IndexNow for instant crawl signals; submit new/changed URLs via Bing WMT or `api.indexnow.org`.
4. Bingbot won't execute JS‑gated content (accordions, login walls); keep key content in static HTML, with accurate ISO‑8601 `lastmod` in the sitemap.

---

## 4. Brand‑mention tracking (the real lever)
Engines weight what *multiple independent sources* say about you. Mentions on credible domains move citations; markup doesn't.

**Free:** Google Alerts + Talkwalker Alerts for `"[Your Brand]"`, each competitor, and your main service term. Manual Reddit (Perplexity cites it heavily):
```
site:reddit.com "[Your Brand]"      (run in Google)
site:reddit.com "[competitor]"
```
**Paid (when volume justifies):** Awario (~$39/mo), Mention (~$41/mo), Brand24 (~$99/mo).

**Do:** log every mention (domain, date, sentiment, linked?); find which domains carry authority in your category; earn mentions there (digital PR, contributed posts, directories, authentic forum participation); submit each new mention URL to Bing via IndexNow.
**Don't:** manufacture mentions (fake reviews, astroturf). Google flags inauthentic mentions; Perplexity downweights low‑credibility sources.

---

## 5. The monthly scorecard (you vs. 3 competitors)
Same day each month, incognito. Fill these in.

**A — AI citation tracker** (5 fixed queries × 5 engines)
| Engine | Query | You (Y/N + pos) | Comp A | Comp B | Comp C |
|---|---|---|---|---|---|
| ChatGPT | … | | | | |
| Perplexity | … | | | | |
| Gemini | … | | | | |
| Copilot | … | | | | |
| Google AIO | … | | | | |

**Citation rate** = your Y's ÷ (queries × engines). One run is noise; a 0%→20% move over 3 months is real progress.

**B — Index health**
| Your Bing pages (`site:`) | Comp A Bing | Your Google (GSC) | New pages indexed this month |
|---|---|---|---|

**C — Rank snapshot** (3 fixed queries)
| Query | You (Google) | Comp A (Google) | You (Bing) | Comp A (Bing) | Featured‑snippet owner |
|---|---|---|---|---|---|

**D — Brand mentions**
| Your mentions | Comp A | Comp B | New high‑authority (DA 40+) | Reddit threads mentioning you |
|---|---|---|---|---|

**Summary trend row**
| Metric | M1 | M2 | M3 | Trend |
|---|---|---|---|---|
| AI citation rate — you | | | | |
| AI citation rate — best competitor | | | | |
| Bing indexed pages | | | | |
| Google rank — primary query | | | | |
| Bing rank — primary query | | | | |
| Brand mentions | | | | |

**Diagnosing the trend**
- Citation rate up, mentions flat → index/content quality is the bottleneck.
- Mentions up, citation rate flat → normal 6–12 wk lag, *or* mentions are on low‑trust sources.
- Competitor cited, low Bing rank for you → Bing is the gap (run §3).
- Strong Google, weak Bing, low citation → fix Bing first.

---

## How this maps to Prompt Goblin's product
This scorecard **is** the retainer's proof loop: the pipeline's `rescan` verb diffs two visibility snapshots and reports the measured before→after delta (overall, per‑engine, per‑surface) — movement, never attribution. The forthcoming client dashboard surfaces exactly these tables (citation rate per engine, you‑vs‑competitor gap, Bing/index health, the human‑gated fix queue). "You see the gap, then you watch it close."

## Sources
Google Search Central (AI features / AI optimization) · Microsoft "Reinventing search… Prometheus" + Bing Search Quality Insights · Bing Webmaster Blog (sitemaps + IndexNow, Jul 2025) · OpenAI Help Center (ChatGPT Search) · Search Engine Land (how AI engines cite) · Yext 2025 + Conductor + arXiv Yang et al. (vendor/independent studies — directional) · ZipTie (Perplexity pipeline analysis) · brand‑monitoring tool comparisons. *(Vendor figures labeled as such; primary‑source claims drawn from the engines' own docs.)*
