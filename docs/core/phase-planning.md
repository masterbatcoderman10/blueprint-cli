# Phase Planning

This module defines how to plan and structure a phase document.
A phase is the primary unit of day-to-day development planning.
It breaks a milestone's feature area into a gate (blocking foundation)
and parallel streams of tasks.

---

<PhasePrinciples>
  A phase is the first level where technical detail belongs.

  A phase document contains:
    - Specific goals for what this phase delivers
    - Dependencies on previous phases
    - A gate — blocking foundation work that unlocks everything else
    - Streams — parallel tracks of work that run after the gate
    - Tasks with IDs, durations, dependencies, and acceptance criteria
    - A definition of done and test scenarios

  A phase document does NOT contain:
    - Milestone-level scope (that is the milestone doc's job)
    - PRD-level feature descriptions
    - Tasks belonging to other phases

  Every phase has exactly one gate and one or more streams.
  Streams run in parallel after the gate completes.
  If a stream depends on another stream, document it explicitly.
</PhasePrinciples>

---

<PhaseProcess>
  PRECONDITIONS:
  - The milestone document for the target milestone is loaded
    (the phase must map to a milestone's feature area)
  - docs/conventions.md is loaded (tech stack informs task design)

  DURING QUESTIONS:
    - Identify what data models or schemas this phase introduces or modifies
    - Clarify migration needs — are schema changes required?
    - Confirm what must exist from previous phases (dependencies)
    - Ask about new configuration — environment variables, secrets, settings
    - Identify the endpoints, routes, or surfaces this phase exposes
    - Determine what can be parallelized vs what must be sequential

  DURING DRAFTING:
    - Start with the gate — what foundational work unlocks the streams?
    - Group remaining work into independent streams
    - OPTIMIZE FOR PARALLELISM — structure streams so that the maximum
      amount of work can run concurrently. If two tasks do not depend
      on each other, they belong in separate streams. If a task only
      depends on part of another stream's output, make that dependency
      explicit rather than blocking on the entire stream.
    - Break streams into tasks — each task should be completable
      in a single focused session (≤ 2 duration units)
    - Write acceptance criteria for each gate and stream
    - Draw a parallelization map showing gate → streams → completion
      with inter-stream dependencies clearly marked
    - Include a definition of done that aggregates critical criteria
    - List test scenarios — happy path and edge cases

  WHEN UPDATING AN EXISTING PHASE:
    - New tasks may be added to a stream — update the stream's
      acceptance criteria if scope changed
    - Do not restructure gate/stream boundaries without discussing
      with the user — this affects parallelism
    - If scope grows significantly, consider splitting into
      a new phase rather than expanding the current one
</PhaseProcess>

---

<PhaseTemplate>

  # Phase {{N}} — {{Phase Name}} Plan

  **Status**: {{Planning | In Progress | Complete}}
  **Milestone**: {{Milestone N — Name}}

  ---

  ## Goals

  - {{Goal 1 — what the user/system can do after this phase}}
  - {{Goal 2}}
  - {{Goal 3}}

  ---

  ## Dependencies

  | Dependency | Status |
  |------------|--------|
  | {{Phase N-1 — specific capability required}} | {{Complete | In Progress | Pending}} |
  | {{External service or config}} | {{Available | Not Available}} |

  ---

  ## Gate {{N}}.0 — {{Foundation Name}}

  | Task ID | Task | Duration | Dependencies | Type |
  |---------|------|----------|--------------|------|
  | {{N}}.0.1 | {{Task}} | {{0.5}} | None | Independent |
  | {{N}}.0.2 | {{Task}} | {{1.0}} | {{N}}.0.1 | Dependent |

  ### Gate Acceptance Criteria

  - [ ] {{Observable, verifiable condition}}
  - [ ] {{Observable, verifiable condition}}

  ---

  ## Stream A — {{Name}}

  > {{One sentence — what this stream delivers}}

  | Task ID | Task | Duration | Dependencies | Type |
  |---------|------|----------|--------------|------|
  | A.1 | {{Task}} | {{1.0}} | Gate | Dependent |
  | A.2 | {{Task}} | {{0.75}} | A.1 | Dependent |

  ### Stream A Acceptance Criteria

  - [ ] {{Condition}}
  - [ ] {{Condition}}

  ---

  ## Stream B — {{Name}}

  > {{One sentence — what this stream delivers}}

  | Task ID | Task | Duration | Dependencies | Type |
  |---------|------|----------|--------------|------|
  | B.1 | {{Task}} | {{0.5}} | Gate | Dependent |
  | B.2 | {{Task}} | {{1.0}} | B.1 | Dependent |

  ### Stream B Acceptance Criteria

  - [ ] {{Condition}}
  - [ ] {{Condition}}

  ---

  ## Stream C — {{Name}}

  > {{One sentence — what this stream delivers}}
  > **Depends on:** {{Stream A (specific output) and/or Stream B (specific output)}}

  | Task ID | Task | Duration | Dependencies | Type |
  |---------|------|----------|--------------|------|
  | C.1 | {{Task}} | {{0.5}} | A.x, B.x | Dependent |
  | C.2 | {{Task}} | {{1.0}} | C.1 | Dependent |

  ### Stream C Acceptance Criteria

  - [ ] {{Condition}}
  - [ ] {{Condition}}

  ---

  ## Parallelization Map

  ```
  Gate {{N}}.0 ──────────────────────────────┐
                                              │
                 ┌────────────────────────────┤
                 │                            │
  Stream A ─────────────────────────────────► │
  Stream B ─────────────────────────────────► │
                 │                            │
                 └── Stream C (depends A + B) │
                     ────────────────────────►│
                                              │
                                              ▼
                                    Phase {{N}} complete
  ```

  ---

  ## Definition of Done

  - [ ] Gate acceptance criteria pass
  - [ ] All stream acceptance criteria pass
  - [ ] No lint errors in files touched by this phase
  - [ ] {{Additional project-specific DoD items}}

  ---

  ## Test Scenarios

  ### Happy Path
  - [ ] {{Primary success scenario}}
  - [ ] {{Secondary success scenario}}

  ### Edge Cases
  - [ ] {{Failure or boundary condition}}
  - [ ] {{Validation / error state}}

  ---

</PhaseTemplate>

---

<TaskConventions>
  Reference for task IDs, durations, and dependency notation
  used in phase documents.

  TASK ID FORMATS:
    Gate tasks:   <phase>.<gate>.<seq>     →  4.0.1, 4.0.2, 4.0.3
    Stream tasks: <stream letter>.<seq>    →  A.1, A.2, B.1, C.3

  DURATION UNITS:
    All durations use abstract units, not hours or days.

    0.25  — Verify, delete, or rename an existing component
    0.5   — Simple wrapper, minor refactor, single endpoint
    0.75  — Compose 2–3 components, small hook or utility
    1.0   — New component with moderate logic, standard API endpoint
    1.5   — Complex component, state machine, multi-concern logic
    2.0   — Maximum single-task size. If larger, split the task.

  DEPENDENCY NOTATION:
    None        — No dependencies, can start immediately
    Gate        — Depends on entire gate completing
    A.2         — Depends on a specific task
    A.4, B.3   — Depends on multiple specific tasks

  TYPE:
    Independent — No dependencies within the current gate or stream
    Dependent   — Blocked by one or more prior tasks
</TaskConventions>

---

<PhaseExample>
  The following is an example of a well-structured phase document.

  # Phase 4 — Permissions & Sharing Plan

  **Status**: Planning
  **Milestone**: Collaborative Editing

  ---

  ## Goals

  - Document owners can share documents with specific users
  - Shared users receive the correct access level (view, comment, edit)
  - Permission checks enforce access rules across all document operations
  - Users can see which documents have been shared with them
  - Sharing activity is logged for audit and display

  ---

  ## Dependencies

  | Dependency | Status |
  |------------|--------|
  | Phase 2 — Real-Time Editing (document sync operational) | Complete |
  | User accounts and authentication exist | Complete |

  ---

  ## Gate 4.0 — Permission Model

  | Task ID | Task | Duration | Dependencies | Type |
  |---------|------|----------|--------------|------|
  | 4.0.1 | Define permission levels enum (view, comment, edit, owner) | 0.25 | None | Independent |
  | 4.0.2 | Create document_permissions table and migration | 0.75 | 4.0.1 | Dependent |
  | 4.0.3 | Build permission checking service | 1.0 | 4.0.2 | Dependent |
  | 4.0.4 | Add permission middleware to document routes | 0.75 | 4.0.3 | Dependent |

  ### Gate Acceptance Criteria

  - [ ] Permission levels are defined and stored per user-document pair
  - [ ] Permission checks run on every document access endpoint
  - [ ] Unauthorized access returns appropriate error responses
  - [ ] Document creators automatically receive owner permission

  ---

  ## Stream A — Sharing Flow

  > Users can share documents with others and manage who has access.

  | Task ID | Task | Duration | Dependencies | Type |
  |---------|------|----------|--------------|------|
  | A.1 | Build share endpoint (invite user by email with permission level) | 1.0 | Gate | Dependent |
  | A.2 | Build permission update endpoint (change user's access level) | 0.75 | A.1 | Dependent |
  | A.3 | Build revoke access endpoint | 0.5 | A.1 | Dependent |
  | A.4 | Build list collaborators endpoint for a document | 0.5 | A.1 | Dependent |

  ### Stream A Acceptance Criteria

  - [ ] Owner can share a document with another user at a specific permission level
  - [ ] Owner can change a collaborator's permission level
  - [ ] Owner can revoke a collaborator's access entirely
  - [ ] Collaborator list returns all users with access and their permission levels

  ---

  ## Stream B — Shared With Me

  > Users can discover and access documents that others have shared with them.

  | Task ID | Task | Duration | Dependencies | Type |
  |---------|------|----------|--------------|------|
  | B.1 | Build shared-with-me list endpoint | 0.75 | Gate | Dependent |
  | B.2 | Add permission level display to document metadata | 0.5 | B.1 | Dependent |
  | B.3 | Filter shared documents by permission level | 0.5 | B.1 | Dependent |

  ### Stream B Acceptance Criteria

  - [ ] Users see all documents shared with them in a dedicated list
  - [ ] Each shared document shows the user's permission level
  - [ ] Users can filter shared documents by access level

  ---

  ## Stream C — Sharing Activity Log

  > Tracks and surfaces sharing events for document owners.
  > **Depends on:** Stream A (share/revoke events) and Stream B (shared-with-me data).

  | Task ID | Task | Duration | Dependencies | Type |
  |---------|------|----------|--------------|------|
  | C.1 | Create sharing_events table and migration | 0.5 | A.4, B.3 | Dependent |
  | C.2 | Emit sharing events on share, update, and revoke actions | 0.75 | C.1 | Dependent |
  | C.3 | Build activity log endpoint for a document | 1.0 | C.2 | Dependent |

  ### Stream C Acceptance Criteria

  - [ ] Every share, permission change, and revoke creates an activity record
  - [ ] Document owners can view a chronological log of sharing activity
  - [ ] Activity log includes who, what permission level, and when

  ---

  ## Parallelization Map

  ```
  Gate 4.0 (Permission Model) ───────────────┐
                                              │
                 ┌────────────────────────────┤
                 │                            │
  Stream A (Sharing Flow) ──────────────────► │
  Stream B (Shared With Me) ────────────────► │
                 │                            │
                 └── Stream C (Activity Log)  │
                     depends on A + B ──────► │
                                              │
                                              ▼
                                    Phase 4 complete
  ```

  ---

  ## Definition of Done

  - [ ] Gate 4.0 acceptance criteria pass
  - [ ] Stream A acceptance criteria pass
  - [ ] Stream B acceptance criteria pass
  - [ ] Stream C acceptance criteria pass
  - [ ] No lint errors in files touched by this phase
  - [ ] All permission checks tested against unauthorized access attempts

  ---

  ## Test Scenarios

  ### Happy Path
  - [ ] Owner shares a document → recipient sees it in shared-with-me list
  - [ ] Owner changes permission from view to edit → recipient can now edit
  - [ ] Share and revoke actions appear in the document's activity log

  ### Edge Cases
  - [ ] User tries to share with themselves → rejected
  - [ ] User with view permission tries to edit → denied
  - [ ] Owner revokes access → document disappears from shared-with-me
  - [ ] Non-existent email in share request → appropriate error
  - [ ] Activity log is empty for a document that has never been shared

  ---

</PhaseExample>
