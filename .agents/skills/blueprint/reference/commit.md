---
name: commit
description: Manage Git during task execution — worktree creation, naming, dependency verification, and commit discipline; routes git-execution intent
---
# Git Execution Workflow

This module defines how the executing agent uses Git during task
execution. It covers worktree creation, naming, dependency
verification, commit discipline, and the rules for working
inside a worktree.

Loaded by execution.md at the start of StartGateOrStream and
referenced again at completion for commit.

---

<WorktreeNaming>
  Worktree names mirror the task ID prefix, stopping at the
  gate or stream level.

  FORMAT:
    Gate:   M<milestone>-P<phase>-0
    Stream: M<milestone>-P<phase>-<stream letter>

  EXAMPLES:
    M1-P1-0     — Gate for Milestone 1, Phase 1
    M1-P1-A     — Stream A for Milestone 1, Phase 1
    M2-P3-B     — Stream B for Milestone 2, Phase 3

  WORKTREE PATH:
    worktrees/<worktree name>/

  BRANCH NAME:
    Same as the worktree name. The worktree and its branch
    share a name for traceability.
</WorktreeNaming>

---

<WorktreeCreation>
  PURPOSE: Create an isolated working directory for the gate
  or stream before any task execution begins.

  STEP 1 — UPDATE PRIMARY BRANCH (TOP-LEVEL ONLY)
    Only the top-level agent coordinating the gate, stream, or phase
    runs this step, once before it creates or reuses worktrees or
    dispatches execution sub-agents. Delegated execution sub-agents
    skip this step; they do not run git pull.

    From the main working directory:
      git checkout main
      git pull --ff-only

    If the project uses a different primary branch, use that branch
    instead of main. If the pull fails, STOP and report the git error
    before checking worktrees or starting execution.

  STEP 2 — CHECK FOR EXISTING WORKTREE
    Run: git worktree list
    IF the worktree for this gate or stream already exists
    (e.g., resuming after an interrupted session):
      → Navigate to it. Do not recreate.
      → Continue to task execution.

  STEP 3 — VERIFY DEPENDENCIES (dependent streams only)
    IF the gate or stream has dependencies on other streams:
      a. Check the tracker — all dependency streams' tasks
         must be in DONE. This confirms review passed and the
         reviewer merged the branch.
         Use `GET /tasks?phase=<phase>&stream=<stream>` as
         documented in `docs/core/tracker.md`.
      b. Run: git log main --oneline
         Confirm the dependency branch's commits are present
         on main.

    IF any dependency is not merged:
      → STOP. Inform user: "Stream <X> depends on <Y>, but
        <Y> has not been merged to main yet."

  STEP 4 — CREATE THE WORKTREE
    git worktree add worktrees/<n> -b <n>

    This branches from main (or the project's primary branch).
    For dependent streams, main already includes the merged work
    of all dependencies.

  STEP 5 — NAVIGATE
    cd worktrees/<n>/
    All task execution happens inside this directory.
</WorktreeCreation>

---

<WorktreeExecutionRules>
  RULES:
  - Every gate and stream gets its own worktree. No exceptions.
  - All file modifications, test runs, and linting happen inside
    the worktree directory. The agent must not modify files in
    the main working directory during execution.
  - Worktrees branch from main. Dependent streams branch from
    main AFTER their dependencies have been merged.
  - The primary-branch pull is a top-level coordination step.
    Delegated execution sub-agents must not run git pull; they
    use the worktree and branch state prepared after the top-level pull.
  - If a session is interrupted and resumed, the agent checks
    for existing worktrees before creating new ones.
  - Sub-agents for parallel streams each work in their own
    worktree. This is what prevents directory conflicts.
  - The executing agent does NOT merge or remove worktrees.
    That is the reviewer's responsibility after a clean review.
</WorktreeExecutionRules>

---

<CommitOnCompletion>
  PURPOSE: Ensure all changes are committed before handing off
  to the reviewer. No uncommitted code should ever reach review.

  WHEN EXECUTION COMPLETES (all tasks in IN-REVIEW):
    git add .
    git commit -m "<gate/stream ID>: all tasks complete, ready for review"

  WHEN REVIEW NOTES ARE ADDRESSED (all tasks back in IN-REVIEW):
    git add .
    git commit -m "<gate/stream ID>: review notes addressed, ready for re-review"

  WHEN REWORK IS ADDRESSED (tasks were in REWORK and returned to IN-REVIEW):
    git add .
    git commit -m "<gate/stream ID>: rework addressed, ready for re-review"

  FOR BUG FIX TASKS (on main, no worktree):
    git add .
    git commit -m "[BUG] <task title>: fix complete, ready for review"

  RULES:
  - The executing agent ALWAYS commits before moving tasks to
    IN-REVIEW. This is not optional.
  - One commit per handoff. Do not commit per-task during
    execution — commit once when the full gate or stream is
    ready for review, or when all review notes or rework are addressed.
  - Commit messages must identify the gate, stream, or bug task
    so the reviewer and git history are traceable.
</CommitOnCompletion>

---

## Anti-Patterns

<AntiPatterns>
  <AntiPattern name="Editing Outside a Worktree">
    <BadExample>Running code edits, test executions, or lint passes in the main working directory instead of inside the gate or stream's dedicated worktree directory.</BadExample>
    <Why>The main working directory tracks the primary branch. Editing there during gate or stream execution mixes unreviewed changes with committed history, making rollback impossible and causing merge conflicts across parallel streams. Every file modification, test run, and lint pass must happen inside the worktree — no exceptions.</Why>
  </AntiPattern>
  <AntiPattern name="Execution Before Status Update">
    <BadExample>Beginning substantive implementation work on a task before moving that task to IN-PROGRESS on the tracker.</BadExample>
    <Why>Moving the task to IN-PROGRESS before starting work signals active ownership to the reviewer and any parallel agents. Skipping this step creates phantom progress — code changes appear without a corresponding tracker state, making it impossible to track what is in flight and who owns it. Always update status first (using `PATCH /tasks/:id` per docs/core/tracker.md), then execute.</Why>
  </AntiPattern>
  <AntiPattern name="Overwriting Review Notes">
    <BadExample>Replacing the reviewer's original feedback with the agent's responses during note application, or discarding earlier review rounds when preparing for re-review.</BadExample>
    <Why>Review notes are a durable record of quality assurance. They document what was caught, why it mattered, and how it was resolved. Overwriting them destroys the audit trail and hides quality signals from future reviewers. When addressing notes, append responses directly below each reviewer comment. When entering a new review round, preserve all prior rounds intact.</Why>
  </AntiPattern>
  <AntiPattern name="Direct Tracker Database Mutation">
    <BadExample>Opening docs/.blueprint/tasks.db with SQLite directly, running raw SQL queries to read or modify task state, or editing the database file with any tool other than the tracker HTTP API.</BadExample>
    <Why>The tracker HTTP API is the sole interface for reading and writing tracker state. Direct database access bypasses validation, triggers, and the snapshot engine, producing inconsistent state that the board UI and other agents cannot reconcile. Always use the HTTP recipes in docs/core/tracker.md (e.g., PATCH /tasks/:id for state changes, GET /tasks for lookups).</Why>
  </AntiPattern>
</AntiPatterns>
