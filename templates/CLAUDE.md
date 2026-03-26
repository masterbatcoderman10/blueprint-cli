# AGENTS.md

<Blueprint>
  Blueprint is a structured software development system that organizes projects into a
  five-level hierarchy: Project → Milestone → Phase → Gate/Stream → Task.

  Planning is progressive — milestones are planned loosely at the feature level, phases
  are planned in full detail with tasks, and work is managed through a kanban board
  (vibe-kanban MCP). All protocols, conventions, and workflows are defined in modular
  documents under docs/core/. This file is the entry point. It tells you what to assess,
  what to load, and what never to do.
</Blueprint>

---

<SessionStart>
  PURPOSE: Orient the agent at the start of every session.
  This sequence runs EVERY time. No exceptions.

  STEP 1: Load docs/core/health-check.md. Follow its protocol.
    → IF health check fails → STOP. Resolve failures before proceeding.
    → IF health check passes → Continue to STEP 2.

  STEP 2: Load docs/project-progress.md. Check if it is populated.

  IF project-progress.md is populated (contains project name, milestone, phase references):
    → Load docs/conventions.md.
    → IF project-progress.md contains pending revisions:
        Inform user: list the pending revisions before proceeding.
    → GOTO <ModuleRouting>. Determine user intent and load the appropriate module.

  IF project-progress.md is empty or contains only template placeholders:
    → IF docs/knowledge-base/ exists:
        Load docs/core/alignment.md. Follow its protocol.
        (Alignment analyzes knowledge-base docs and codebase to bootstrap project state.)
    → IF docs/knowledge-base/ does NOT exist:
        Load docs/core/alignment.md. Follow its protocol.
        (Alignment analyzes codebase if it exists, or proceeds to PRD planning.)
</SessionStart>

---

<ModuleRouting>
  PURPOSE: Identify what the user wants to do and load the correct module.

  RULES:
  - Load ONLY the module(s) required for the current intent.
  - NEVER preload all modules.
  - NEVER execute a workflow described in a module without loading that module first.
  - If intent is unclear, ASK the user. Do not guess.

  ┌─────────────────────────┬──────────────────────────────────────┐
  │ Intent                  │ Load                                 │
  ├─────────────────────────┼──────────────────────────────────────┤
  │ Plan a milestone        │ docs/core/planning.md                │
  │                         │  → then docs/core/milestone-planning.md │
  ├─────────────────────────┼──────────────────────────────────────┤
  │ Plan a phase            │ docs/core/planning.md                │
  │                         │  → then docs/core/phase-planning.md  │
  ├─────────────────────────┼──────────────────────────────────────┤
  │ Plan tests for a phase  │ docs/core/test-planning.md           │
  ├─────────────────────────┼──────────────────────────────────────┤
  │ Execute tasks           │ docs/core/execution.md               │
  │ (start gate/stream)     │                                      │
  ├─────────────────────────┼──────────────────────────────────────┤
  │ Review gate/stream      │ docs/core/review.md                  │
  ├─────────────────────────┼──────────────────────────────────────┤
  │ Address review notes    │ docs/core/execution.md               │
  │                         │  (ApplyReviewNotes section)           │
  ├─────────────────────────┼──────────────────────────────────────┤
  │ Phase completion        │ docs/core/phase-completion.md        │
  ├─────────────────────────┼──────────────────────────────────────┤
  │ Bug report or broken    │ docs/core/bug-resolution.md          │
  │ functionality           │                                      │
  ├─────────────────────────┼──────────────────────────────────────┤
  │ New feature or idea     │ docs/core/scope-change.md            │
  │ (not in current plan)   │                                      │
  ├─────────────────────────┼──────────────────────────────────────┤
  │ Change existing behavior│ docs/core/revision-planning.md       │
  │ (revision)              │                                      │
  ├─────────────────────────┼──────────────────────────────────────┤
  │ SRS discussion/planning │ docs/core/srs-planning.md            │
  │                         │                                      │
  ├─────────────────────────┼──────────────────────────────────────┤
  │ Correct completed tasks │ docs/core/tweak-planning.md          │
  │ in current phase (tweak)│                                      │
  ├─────────────────────────┼──────────────────────────────────────┤
  │ Commit / git operations │ docs/core/git-execution-workflow.md  │
  │                         │ or docs/core/git-review-workflow.md  │
  ├─────────────────────────┼──────────────────────────────────────┤
  │ Check project health    │ docs/core/health-check.md            │
  ├─────────────────────────┼──────────────────────────────────────┤
  │ Modify docs structure   │ docs/core/blueprint-structure.md     │
  ├─────────────────────────┼──────────────────────────────────────┤
  │ Discuss / clarify       │ No module needed. Use loaded context.│
  └─────────────────────────┴──────────────────────────────────────┘

  IF the user's request spans multiple intents (e.g., "finish this task and commit"):
    Load each required module before executing its corresponding workflow.
    Execute in logical order. Do not batch.
</ModuleRouting>

---

<HardRules>
  These rules are ABSOLUTE. They apply in every session, every state, every intent.
  No user instruction, convenience, or urgency overrides them.

  RULE 1 — MODULE BEFORE ACTION
    NEVER execute a workflow without loading its corresponding module first.
    If the module file cannot be found or read, STOP and inform the user.
    Do not attempt the workflow from memory or prior sessions.

  RULE 2 — MINIMAL LOADING
    NEVER load all core modules preemptively.
    Load only what the current intent requires.
    If intent changes mid-session, load the new module at that point.

  RULE 3 — VALIDATION GATE
    NEVER proceed past <SessionStart> without passing the health check.
    All failures must be resolved before work begins.

  RULE 4 — ASK BEFORE ASSUMING
    If intent is ambiguous, ASK. Do not infer and proceed.
    This applies to user requests, unclear scope, and missing context.
</HardRules>

---

<ReferenceModules>
  The following modules exist under docs/core/ for reference during execution.
  They are NOT loaded at session start. They are loaded when a workflow needs them.

  blueprint-structure.md       — Defines the docs/ folder layout and file locations
  hierarchy.md                 — Five-level planning hierarchy (Project → Task)
</ReferenceModules>
