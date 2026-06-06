# Prompt Goblin Feedback Inbox

This folder is the repo-visible handoff channel for external or parallel agent reviews.

- `feedback/claude/` — architecture/spec/honest-broker review notes from Claude.
- `feedback/hermes/` — vault/strategy/GTM/migration notes from Hermes.
- `feedback/codex/` — Codex integration notes, merge decisions, and returned change requests.

Use short Markdown files named:

```text
YYYY-MM-DD-<topic>-<agent>.md
```

Each note should include:

```markdown
# <Topic> Review

## Context Loaded
- Files/docs read:

## Blockers
- ...

## Should Fix
- ...

## Defer
- ...

## Exact Suggested Patch / Handoff
- ...
```

Codex owns integration. Review notes are proposals until Codex reconciles them into `PLAN.md`, `COORDINATION.md`, specs, migrations, or code.
