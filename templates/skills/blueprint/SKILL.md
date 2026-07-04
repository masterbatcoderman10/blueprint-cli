---
name: blueprint
description: Use when doing any Blueprint project work — planning milestones, phases, tests, or revisions; executing or orchestrating gates and streams; reviewing; addressing review notes; completing phases; resolving bugs; managing SRS; handling scope changes or new features; tweaking; performing git operations and commits; or discussing. Invoke before any Blueprint action.
---

## Setup Gate

Before routing any intent, verify the project scaffold exists and apply the
bootstrap state machine:

1. **Project progress file** — `docs/project-progress.md` must exist. If it is
   missing, STOP and inform the user that Blueprint has not been initialized.
   Instruct them to install `blueprint-cli` if needed and run `blueprint init`.
2. **Tracker** — `docs/.blueprint/tasks.db` must exist. If it is missing, STOP
   and instruct the user to install `blueprint-cli` and run `blueprint init` to
   provision the tracker database and project scaffold.
3. **Context brief** — From this installed skill directory, run
   `node scripts/load-context.mjs` to load current project state into context.
4. **Bootstrap state machine** — Use the context brief plus supported root-file
   marker state to apply exactly one outcome:
   - missing scaffold or tracker -> STOP with install/init guidance
   - empty progress + `alignment-required` -> Alignment only (`reference/align.md`)
   - empty progress + `alignment-complete` -> Foundation Planning only (`reference/foundation-planning.md`)
   - populated progress + `alignment-required` -> STOP normal routing and rerun or repair Alignment; if `blueprint-origin: legacy-migration` is present, treat that as fast-track migrated-state context for the repair
   - populated progress + no marker -> continue with normal routing
   - empty progress + no marker -> STOP with repair guidance

If the setup gate returns a STOP outcome, do not proceed with normal routing.

## Shared Laws

All routing targets follow the anti-pattern laws defined in [reference/anti-patterns.md](reference/anti-patterns.md). Every `<AntiPatterns>` block across reference modules conforms to the canonical shape specified there.

## Commands

| Intent | Load |
|--------|------|
| Plan a milestone | `reference/planning.md` → then `reference/plan-milestone.md` |
| Plan a phase | `reference/planning.md` → then `reference/plan-phase.md` |
| Foundation Planning | `reference/foundation-planning.md` |
| Plan tests for a phase | `reference/plan-test.md` |
| Execute tasks (start gate/stream) | `reference/execute.md` |
| Orchestrate phase/stream execution | `reference/orchestrate.md` |
| Review gate/stream | `reference/review.md` |
| Address review notes | `reference/execute.md` (ApplyReviewNotes section) |
| Phase completion | `reference/phase-complete.md` |
| Bug report or broken functionality | `reference/bug.md` |
| New feature or idea (not in current plan) | `reference/scope-change.md` |
| Change existing behavior (revision) | `reference/revision.md` |
| SRS discussion/planning | `reference/srs.md` |
| Quick change / tweak (small, contained, single concern) | `reference/tweak.md` |
| Commit / git operations | `reference/commit.md` or `reference/commit-review.md` |
| Modify docs structure | `reference/blueprint-structure.md` |
| Discuss / clarify | No module needed. Use loaded context. |

## Routing Rules

- Load ONLY the module(s) required for the current intent.
- NEVER preload all modules.
- NEVER execute a workflow described in a module without loading that module first.
- Apply the setup-gate bootstrap outcome before loading any normal-routing module.
- If intent is unclear, ASK the user. Do not guess.
- TWEAK INTENT CLASSIFICATION: The agent must apply general intelligence to every incoming change request — assessing scope, surface area, feature-ness, and test-plan need — and proactively route to tweak planning when the request qualifies, even when the user did not say "tweak". The agent must surface the classification to the user before drafting.
- When tweak intent is confirmed, the agent enters **Tweak Mode** and follows the change-first loop: understand → restate → confirm → change → cycle → verify → post-hoc doc. No tracker tasks, no planning artifacts, no ceremony. The user is the live review loop.
- IF the user's request spans multiple intents (e.g., "finish this task and commit"): Load each required module before executing its corresponding workflow. Execute in logical order. Do not batch.
