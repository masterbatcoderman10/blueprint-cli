# Health Check

This module validates that the project is in a workable state.
It runs at the start of EVERY session before any other action.

---

<HealthCheck>
  PURPOSE: Confirm project structure and dependencies are in place.

  ───────────────────────────────────────────────────────────────
  STRUCTURAL CHECKS
  ───────────────────────────────────────────────────────────────

  Run a single listing of the project docs directory (e.g., ls -R docs/).
  From the output, verify ALL of the following exist:

    - docs/project-progress.md
    - docs/prd.md
    - docs/conventions.md
    - docs/srs.md
    - docs/core/ (directory)
    - docs/core/blueprint-structure.md
    - docs/core/srs-planning.md

  IF any are missing → STOP.
    Inform user which items are missing.
    The project cannot proceed without a complete Blueprint structure.

  ───────────────────────────────────────────────────────────────
  OPERATIONAL CHECKS (only if project-progress.md is populated)
  ───────────────────────────────────────────────────────────────

  Read docs/project-progress.md.

  IF it is empty or contains only template placeholders:
    → Structural checks are sufficient. Health check PASSES.
      Return control to AGENTS.md (which routes to alignment.md).

  IF it is populated:

    CHECK — Kanban project name is present
      project-progress.md must contain a non-empty kanban project name.
      FAIL → STOP. "No kanban project name found. This must be set
              before any work can begin."

    CHECK — vibe-kanban MCP is reachable
      Attempt a read operation against the kanban project.
      FAIL → STOP. "Kanban MCP is unreachable. Task execution,
              review, and status changes cannot proceed."

  IF legacy Blueprint projects missing `docs/srs.md`:
    Treat this as a repairable compatibility path, not a silent gap.
    The agent should scaffold docs/srs.md from templates/srs.md or
    rerun blueprint init so the project regains the SRS root doc.

  ───────────────────────────────────────────────────────────────

  ALL CHECKS PASSED → Health check complete.
  Return control to AGENTS.md <SessionStart>.
</HealthCheck>

---

<FailureHandling>
  STOP → Agent MUST NOT proceed. Inform user. Wait for resolution.
</FailureHandling>
