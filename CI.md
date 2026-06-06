# CI / CD — Prompt Goblin

Two repos, two GitHub Actions pipelines. Everything runs on every pull request
and on push to the default branch. **Nothing auto-deploys** — deploys are
human-gated (see below).

## What runs

### `PatZat7/promptgoblin` (parent) — `.github/workflows/ci.yml`
| Job | What | Gate |
|---|---|---|
| **functions** | `functions/` node unit tests (138 checks — WAF/SSRF envelope, schema, Tier-2) | blocking |
| **web-unit** | `web/` vitest (honest-envelope) + `next build` (typecheck) | blocking |
| **web-lint** | `web/` eslint | **advisory** (see *Known non-blocking* below) |
| **web-ui** | Playwright UI on desktop + mobile, axe-core a11y, **screenshots uploaded as artifacts** | **advisory** (see below) |

Playwright artifacts (screenshots + HTML report) upload under the run's
**Artifacts** as `web-ui-screenshots-and-report`, kept 14 days.

### `PatZat7/pipeline` — `.github/workflows/ci.yml`
| Job | What | Gate |
|---|---|---|
| **pytest** | full LangGraph suite (279 tests, mock/keyless) | blocking |
| **eval-gate** | `python -m goblin.eval` — golden cases @ 1.000 + heal-loop / verify-strand convergence | blocking |
| **ruff** | Python lint | **advisory** |

## CodeRabbit (AI review)
Config is committed: `.coderabbit.yaml` (parent) + `pipeline/.coderabbit.yaml`,
both pre-loaded with the honest-broker review rules. **You must install the
CodeRabbit GitHub App once** (it needs your GitHub account — it can't be scripted):
1. https://github.com/marketplace/coderabbitai → install.
2. Grant it `PatZat7/promptgoblin` **and** `PatZat7/pipeline`.
It then auto-reviews every PR using the committed config.

## Deploy (manual, human-gated)
- **Web** already deploys via DigitalOcean App Platform **deploy-on-push** to `main`.
- **Functions** deploy via `.github/workflows/deploy.yml` — a **manual**
  `workflow_dispatch`: Actions tab → *Deploy scan functions (manual)* → Run
  workflow → type `deploy` to confirm. Requires one secret:
  - Repo → Settings → Secrets and variables → Actions → New secret
  - `DIGITALOCEAN_ACCESS_TOKEN` = a **scoped** DO API token (not a full-access
    personal token). Rotate if it ever leaks.
  - If you have more than one serverless namespace, set the explicit
    `doctl serverless connect promptgoblin` line in `deploy.yml`.

You can also keep deploying locally with `doctl serverless deploy functions --remote-build`.

## Known non-blocking items (fix, then harden the gate)
These are real findings, parked as advisory so the pipeline ships green today.
Flip `continue-on-error: false` on the relevant job after fixing:
- **web eslint — 7 errors** (`Loader.tsx`/`Pricing.tsx` set-state-in-effect, a JSX
  comment). Fixing the set-state-in-effect ones may touch animation behavior —
  do it deliberately.
- **web a11y — mobile hero fails axe `color-contrast`** (kicker / h1 / titleAccent
  < 4.5:1 at the Pixel-7 viewport) and the **mobile primary nav is
  `visibility:hidden` with no hamburger/disclosure** (keyboard + AT users can't
  navigate on mobile). Both are genuine WCAG 2.1 AA failures on the site that
  *sells* accessibility — worth prioritizing.

## Run it locally
```bash
# functions
npm --prefix functions test
# web unit + build + lint
npm --prefix web ci && npm --prefix web run test && npm --prefix web run build && npm --prefix web run lint
# web UI (build first, then Playwright)
npm --prefix web run build && (cd web && npx playwright install chromium && npm run test:ui)
# pipeline (from inside pipeline/, using its venv)
cd pipeline && .venv/Scripts/python.exe -m pytest tests -q && .venv/Scripts/python.exe -m goblin.eval
```
