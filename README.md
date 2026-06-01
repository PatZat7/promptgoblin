# Prompt Goblin — marketing site

> Get found by robots. Stay usable by humans. AI-search visibility & technical SEO.

The public marketing site for **Prompt Goblin** (`Prompt_Goblin™`). A dark, awwwards-grade
single-page site built as a **zero-build static site**: `index.html` loads React +
Babel-standalone + the component files from a CDN and transpiles `.jsx` in the browser —
the same pattern used for Zatgeist. No bundler, no `package.json`.

## Layout

| File | What it is |
|------|------------|
| `index.html` | Entry point. Loads fonts + React/Babel CDN, then the `.jsx` files in order. |
| `styles.css` | All styling. Dark + lime theme (palettes: `bone` light, `noir`, `rust`). |
| `sprites.jsx` | Pixel-art sprite library (fire / ice / lightning / goblin head). |
| `goblin-logo.jsx` | Inlined Prompt Goblin head SVG (inherits `currentColor`). |
| `tweaks-panel.jsx` | Floating design-tweaks panel (motion / density / display size / grain / cursor). |
| `app.jsx` | The whole site: HUD, Hero, Spellbook, **Live Scan**, **Visibility Mesh**, Stats, Marquee, Index/Now, Work, Services, Quotes, Scrolls, Contact. |

### Sections added from the handoff (re-skinned dark + lime)
- **Live Scan** (`#scan`) — the `goblin@visibility-mesh /scan` terminal that types out a live
  LLM-visibility scan (competitor vs. your-brand citations, schema/content gaps), ported from
  the handoff hero terminal.
- **Visibility Mesh** (`#mesh`) — the `goblin-graph.runtime` agentic LangGraph node graph
  (intent → expand → retrieve → weave citations → diff schema → recommend → human-reviewed PR),
  ported from the handoff agent graph.

## Local development

`.jsx` is transpiled in-browser by Babel, so it **must be served over HTTP** — opening
`index.html` via `file://` renders a blank page. Use any static server:

```powershell
# Python
python -m http.server 8123
# or Node
npx --yes serve -l 8123
```

Then open <http://localhost:8123> and **hard-refresh** (Ctrl+Shift+R) after changes.

## Deploy (DigitalOcean App Platform)

Push-to-deploy static site, identical to the Zatgeist setup:

1. Create a GitHub repo and push this folder to `main`.
2. Apply the spec: `doctl apps create --spec .do/app.yaml` (set the real `github.repo` first),
   or create the app in the DO dashboard as a **Static Site** with:
   - source dir `/`, build command *empty*, output dir `/`
   - index document `index.html`, catchall `index.html`
3. Every push to `main` auto-deploys.

> ⚠️ App Platform serves through a CDN. After a deploy, hard-refresh or use incognito to
> bypass stale cache — a green deploy can still look "missing" purely from caching.

## Roadmap / related docs
- Business plan, pricing, GTM, competitive landscape → Obsidian vault: **Prompt Goblin** MOC.
- The agentic AEO pipeline (scan → diff → recommend → human-review → PR) → `pipeline/` + the
  **Prompt Goblin - Agentic AEO Pipeline Master Plan** vault note.
- Analytics (PostHog) and payment/intake form are wired in `index.html` / the Contact section.
