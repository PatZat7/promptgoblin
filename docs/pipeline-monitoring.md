# Pipeline Monitoring — Weekly Measurement Loop

`pipeline/goblin/monitor.py` implements the two measurable AEO levers:

1. **Bing rank tracking** — where does the client domain appear for each target query?
2. **Brand-mention monitoring** — how many third-party pages mention the brand, and which authoritative domains cite it?

## Running a snapshot

```sh
# From the pipeline/ directory:
.venv/Scripts/python.exe -m goblin.cli monitor --domain example.com

# Custom queries (override the default top-5 AEO anchor terms):
.venv/Scripts/python.exe -m goblin.cli monitor \
  --domain example.com \
  --queries "how to show up in ChatGPT,best AEO tools,technical SEO for AI"

# Custom top-N rank window and output directory:
.venv/Scripts/python.exe -m goblin.cli monitor \
  --domain example.com \
  --top-n 30 \
  --out /path/to/snapshots
```

### Environment variables

| Variable | Purpose | Default |
|---|---|---|
| `BING_SEARCH_API_KEY` | Bing Web Search API key (Azure Cognitive Services) | unset (honest skip) |
| `GOBLIN_MONITOR_TOP_N` | Rank window depth (1-based; beyond = "not_found", not 0) | `20` |
| `GOBLIN_MONITOR_TOP_MENTION_DOMAINS` | How many top citing domains to record | `10` |
| `GOBLIN_OUT_DIR` | Where snapshot JSON files are written | `out` |

## Honest-broker constraints

- **No key => "skipped"** — `BING_SEARCH_API_KEY` absent means every query has
  `status: "skipped"` and `rank: null`. A rank of `0` is never emitted — it would
  imply "ranked last" (a different signal). `null` means "not measured".
- **Ranks and mentions are SIGNALS**, not guarantees. The re-run loop proves
  movement over time; no single run attributes movement to any fix.
- **Nothing auto-acts** — the CLI writes a snapshot and prints a summary. A human
  decides what to do with the delta.
- **Negative deltas are reported plainly** — a regression is never hidden.

## Scheduling

"Weekly" is not wired into the code — the code is the measurement, not the timer.
Use an external scheduler to fire the `monitor` verb on cadence:

**Linux/macOS cron** (weekly Monday 07:00 UTC):
```cron
0 7 * * 1 cd /path/to/promptgoblin/pipeline && \
  .venv/bin/python -m goblin.cli monitor --domain example.com \
  >> /var/log/goblin-monitor.log 2>&1
```

**Windows Task Scheduler**: create a weekly trigger pointing to:
```
Program: C:\path\to\promptgoblin\pipeline\.venv\Scripts\python.exe
Arguments: -m goblin.cli monitor --domain example.com --out out
Start in: C:\path\to\promptgoblin\pipeline
```

**GitHub Actions** (weekly cron):
```yaml
on:
  schedule:
    - cron: '0 7 * * 1'   # Monday 07:00 UTC
jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: |
          cd pipeline
          python -m venv .venv
          .venv/bin/pip install -e .
          .venv/bin/python -m goblin.cli monitor --domain example.com
        env:
          BING_SEARCH_API_KEY: ${{ secrets.BING_SEARCH_API_KEY }}
```

## Artifact schema

Each run writes `out/monitor-<slug>-<stamp>.json`:

```json
{
  "snapshot_schema": 1,
  "domain": "example.com",
  "generated_at": "2026-01-08T07:00:00+00:00",
  "top_n": 20,
  "ranks": [
    {
      "query": "how to show up in ChatGPT",
      "rank": 7,
      "status": "ranked",
      "note": ""
    },
    {
      "query": "how to get cited by AI",
      "rank": null,
      "status": "not_found",
      "note": "not found in top 20"
    }
  ],
  "mentions": {
    "brand_query": "\"example.com\"",
    "mention_count": 12400,
    "top_domains": ["techcrunch.com", "g2.com", "reddit.com"],
    "status": "ok",
    "note": ""
  }
}
```

`rank: null` means not found in the top-N window — never `0`.

## Delta logic

`delta_snapshots(baseline, current)` is a pure function (no network, no clock)
that compares the two most-recent snapshots for a domain. It returns a
`MonitorDelta` with:

- Per-query rank direction: `"up"` | `"down"` | `"unchanged"` | `"entered"` |
  `"exited"` | `"n/a"`
- Mention count change (+/-)
- New and lost citing domains

The `goblin monitor` command automatically computes and prints the delta when a
prior snapshot exists for the domain.
