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
  From the output, verify ALL of the following legacy-invariant items exist:

    - docs/project-progress.md
    - docs/prd.md
    - docs/conventions.md
    - docs/core/ (directory)
    - docs/core/blueprint-structure.md
    - docs/core/srs-planning.md

  CHECK — docs/srs.md
    IF docs/srs.md exists:
      → Continue.

    IF docs/srs.md is missing but the legacy-invariant items above exist:
      → STOP with a compatibility-path message, not a structural-invalid message.
        Inform user: "This Blueprint project predates SRS integration.
        Add docs/srs.md by repairing from templates/srs.md or rerunning
        blueprint init before continuing with SRS-aware workflows."

    IF docs/srs.md is missing AND other legacy-invariant items are missing:
      → Continue to the general structural failure below.

  IF any legacy-invariant items are missing → STOP.
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

    CHECK — Tracker project id is present
      project-progress.md must contain a non-empty tracker project id.
      FAIL → STOP. "No tracker project id found. This must be set
              before any work can begin. Run `blueprint init` if the
              project has not been set up yet."

    CHECK — tasks.db exists
      Verify docs/.blueprint/tasks.db exists on disk.
      FAIL → STOP. "Tracker database not found at docs/.blueprint/tasks.db.
              Run `blueprint init` to provision the tracker, or verify
              the project was set up correctly."

    CHECK — Tracker HTTP server is reachable
      Attempt a read operation against the local tracker:
        curl -s http://127.0.0.1:7300/project
      If the server responds with project metadata, the check PASSES.

      If the server is NOT reachable BUT tasks.db exists:
        → Boot the board in the background:

          ```bash
          blueprint board &
          ```

          After spawning, poll `GET /project` until it succeeds
          (retry every 500 ms for up to 10 seconds).

          The browser-open side-effect is benign — it does not interfere
          with agent operation.

          Once the server responds, the check PASSES.

      If the server is NOT reachable AND tasks.db does not exist:
        → This case is already caught by the tasks.db check above.

  ───────────────────────────────────────────────────────────────

  ALL CHECKS PASSED → Health check complete.
  Return control to AGENTS.md <SessionStart>.
</HealthCheck>

---

<FailureHandling>
  STOP → Agent MUST NOT proceed. Inform user. Wait for resolution.
</FailureHandling>
