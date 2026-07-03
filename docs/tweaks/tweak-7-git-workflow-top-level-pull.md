## Status

Complete

---

## Summary of Change

Git execution workflow now requires the top-level coordinating agent to update the primary branch with `git pull --ff-only` before worktree preparation. Delegated execution subagents are explicitly forbidden from pulling and must use the worktree state prepared by the coordinator.

---

## Files Touched

- docs/core/git-execution-workflow.md
- templates/docs/core/git-execution-workflow.md
- templates/skills/blueprint/reference/commit.md
- skills/blueprint/reference/commit.md
- .claude/skills/blueprint/reference/commit.md
- .agents/skills/blueprint/reference/commit.md

---

## User Acceptance Note

User approved on 2026-07-03.
