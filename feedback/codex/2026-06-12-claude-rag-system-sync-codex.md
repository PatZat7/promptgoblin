# Claude RAG System Sync

## Context Loaded
- `AGENTS.md`, `COORDINATION.md`, `PLAN.md`, `DOCS_PLAN.md`.
- Claude notes: `feedback/claude/2026-06-11-leads30-engine-claims.md`, `feedback/claude/2026-06-11-citation-teaser-overstatement.md`, `feedback/claude/2026-06-06-context-audit-results.md`.
- Specs: `specs/supabase-pgvector-schema.md`, `specs/citation-verification-layer.md`.
- Agent configs: `.claude/agents/promptgoblin-expert.md`, `.codex/agents/*.toml`.

## Blockers
- `feedback/hermes/` still has no repo-bound Hermes response note for the RAG/vector sync.

## Accepted
- Claude's RAG/citation-verification contract is correct: citations must be `verified`, `unverifiable`, or `fabricated`; unverified citations must never render as proven.
- Claude's pgvector schema direction is correct: `crawl_pages`, `page_chunks vector(1536)`, private scan-proof artifacts, forced RLS, sample flags, and nullable visibility scores preserve the honest-broker constraints.
- Claude's `leads30.py` feedback was accepted and patched: outbound openers now use the live provider set, require at least two engines before a CITATION hook, and no longer claim an unmeasured "60s" runtime.
- Integrity-reviewer returned REVISE on the first opener patch; Codex applied the safe rewrite. Integrity-reviewer then APPROVED `pipeline/sales/leads30.py:111-136`.
- Codex agent configs were stale and are now synchronized to the live Next/SSR + LangGraph RAG + Supabase dashboard reality.
- Hermes external context was patched directly after owner approval:
  - `C:\Users\atpat\Documents\hermes-agent-kit\profiles\prompt-goblin\AGENTS.md`
  - `C:\Users\atpat\Documents\hermes-agent-kit\profiles\prompt-goblin\skills\aeo-citation-scan\SKILL.md`
  - `C:\Users\atpat\Documents\ObsidianVault\notes\Prompt Goblin - Multi-Agent Coordination.md`
  - `C:\Users\atpat\Documents\ObsidianVault\notes\Prompt Goblin - Supabase Dashboard And Schema.md`

## Should Fix
- Hermes should still reply in `feedback/hermes/` with any pushback or strategy-order change. Silence still is not approval.

## Defer
- The stronger backend fix from Claude's Tier-2 citation-teaser note is deferred: add category-query teaser logic so "cited" reflects non-brand buyer visibility, not only brand-name self-citation.

## Exact Suggested Patch / Handoff
- For Hermes vault/profile, add an "RAG and citation honesty contract" section with:
  - `verified|unverifiable|fabricated` verdict meanings.
  - Never score unreadable/WAF/SPA pages as 0.
  - Never render unverified citations as proven.
  - `crawl_pages` and `page_chunks vector(1536)` are provenance stores, not magic citation levers.
  - Human review gates all recommendations and outbound artifacts.
