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

  STEP 1 — CHECK FOR EXISTING WORKTREE
    Run: git worktree list
    IF the worktree for this gate or stream already exists
    (e.g., resuming after an interrupted session):
      → Navigate to it. Do not recreate.
      → Continue to task execution.

  STEP 2 — VERIFY DEPENDENCIES (dependent streams only)
    IF the gate or stream has dependencies on other streams:
      a. Check the kanban board — all dependency streams' tasks
         must be in DONE. This confirms review passed and the
         reviewer merged the branch.
      b. Run: git log main --oneline
         Confirm the dependency branch's commits are present
         on main.

    IF any dependency is not merged:
      → STOP. Inform user: "Stream <X> depends on <Y>, but
        <Y> has not been merged to main yet."

  STEP 3 — CREATE THE WORKTREE
    git worktree add worktrees/<n> -b <n>

    This branches from main (or the project's primary branch).
    For dependent streams, main already includes the merged work
    of all dependencies.

  STEP 4 — NAVIGATE
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

  FOR BUG FIX TASKS (on main, no worktree):
    git add .
    git commit -m "[BUG] <task title>: fix complete, ready for review"

  RULES:
  - The executing agent ALWAYS commits before moving tasks to
    IN-REVIEW. This is not optional.
  - One commit per handoff. Do not commit per-task during
    execution — commit once when the full gate or stream is
    ready for review, or when all review notes are addressed.
  - Commit messages must identify the gate, stream, or bug task
    so the reviewer and git history are traceable.
</CommitOnCompletion>
