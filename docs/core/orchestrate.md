# Orchestration

This module defines how an agent becomes a phase or stream orchestrator.
Orchestration is an opt-in role: an agent that receives orchestration intent
routes here, while direct execution intent continues to route to
`docs/core/execution.md` as the default path.

The orchestrator does not replace execution, review, or git workflow rules.
It consumes the phase plan — especially the parallelization map — and
dispatches subagents or parallel tasks to run gates and streams according to
their declared dependencies and scopes.

---

## Session Management in Orchestration

Orchestration often manages multiple parallel streams. Each stream runs as an independent session (or set of sessions) with its own execution, review, and rework loops. 

**Key principle:** Do not try to hold all phase state in the orchestrator's context. Instead:

1. **Delegate to the tracker.** Query tracker state to see which streams are done, blocked, or in review. See `docs/core/tracker.md` for API details.
2. **Use implementation notes.** When execution or review agents update task implementation notes in the tracker, the orchestrator reads those (not git history) to understand blockers and progress.
3. **Spawn sessions per stream.** Each execution/review agent gets only its stream's scope (not the whole phase). See `docs/core/context-and-sessions.md` for session best practices.
4. **Coordinate through state.** The orchestrator signals when dependencies are met (by reading tracker state and notifying waiting streams), not by coordinating context between agents.

This approach prevents the orchestrator from burning context on code details that execution agents already understand. The orchestrator's budget is for **coordination**, delegated to the tracker and git state.

For detailed session management patterns, see: `[Context Rot & Session Management](context-and-sessions.md)`

---

<OrchestratorInvocation>
  PURPOSE: Define when and how an agent enters orchestration mode.

  TRIGGER:
    The user issues a command that implies orchestration scope:
      - "Orchestrate phase 3"
      - "Run the full phase"
      - "Start all streams for this phase"
      - Any command that names a phase rather than a single gate or stream

  ROUTING:
    All live and templated agent entry points (`AGENTS.md`, `CLAUDE.md`,
    `GEMINI.md`, `QWEN.md`) must include a row that routes orchestration
    intent to `docs/core/orchestrate.md`.

    IF the user's command names a single gate or stream:
      → Route to `docs/core/execution.md` (direct execution).

    IF the user's command names a phase or implies multi-stream scope:
      → Route to `docs/core/orchestrate.md` (orchestration).

  ORCHESTRATOR RESPONSIBILITIES:
    - Read the phase document and its parallelization map.
    - Spawn work in dependency order.
    - Manage the execute→review→address→rereview lifecycle per stream.
    - Report progress, blockers, and completion without merging branches.

  ORCHESTRATOR BOUNDARIES:
    - The orchestrator does NOT execute individual tasks. It delegates
      task execution to execution agents per `execution.md`.
    - The orchestrator does NOT review code. It delegates review to
      review agents per `review.md`.
    - The orchestrator does NOT directly merge branches. The review
      subagent carries out the merge and worktree cleanup as part of
      its final clean review / rereview pass per
      `docs/core/git-review-workflow.md`.
    - The orchestrator does NOT run phase completion itself. It
      delegates phase completion to an independent phase-completion
      subagent per `docs/core/phase-completion.md`.

  TWEAK ORCHESTRATION:
    When a tweak document contains a gate/stream map, the orchestrator
    may run that map using the same per-stream execute → review →
    address → rereview loop defined in <StreamLifecycle>. Tweak
    orchestration follows the same spawn rules, dependency checks,
    and lifecycle management as phase orchestration. The orchestrator
    does not treat tweaks differently — it consumes the map faithfully
    and delegates execution and review to the same subagents.
</OrchestratorInvocation>

---

<ParallelizationMap>
  PURPOSE: Consume the phase document's parallelization map faithfully.

  The parallelization map is the source of truth for spawn order.
  The orchestrator must not invent, reorder, or skip streams.

  MAP SEMANTICS:

    Gate (e.g., Gate 3.0)
      → Always runs first.
      → Contains sequential tasks that establish foundations
        (schemas, contracts, shared configuration).
      → No stream may start until the gate is fully closed out
         (all tasks DONE, branch merged to main).

    Independent Streams (e.g., Stream A, Stream B)
      → Spawn in parallel immediately after the gate closes.
      → Have no unsatisfied dependencies.
      → Each stream gets its own worktree per `git-execution-workflow.md`.

    Dependent Streams (e.g., Stream C depends on Stream A)
      → Spawn only after their named prerequisite stream is fully
        closed out: all tasks DONE, branch merged to main, and any
        needed rereview loops completed.
      → A stream with multiple dependencies waits until ALL prerequisites
        are fully closed out.

  SPAWN RULES:
    - Spawn only what the map authorizes.
    - Never spawn a dependent stream before its prerequisite is merged.
    - Never hold an independent stream waiting for an unrelated stream
      to finish.
</ParallelizationMap>

---

<StreamLifecycle>
  PURPOSE: Define the independent execute→review→address→rereview loop
  that each stream runs.

  Each stream is a parallel execution path with its own worktree, branch,
  and tracker tasks. Streams do not wait for each other during execution
  or review unless the parallelization map declares a dependency.

  The tracker state machine for every stream follows the five canonical
  states:

  ```
  TO-DO → IN-PROGRESS → IN-REVIEW → REWORK → DONE
  ```

  Canonical forward transition after review rejection:
  REWORK → IN-PROGRESS → IN-REVIEW

  LOOP STEPS:

    1. EXECUTE
       - Delegate to `execution.md` StartGateOrStream.
       - The execution agent works inside the stream's worktree.
       - When all tasks are IN-REVIEW, execution is complete.

    2. REVIEW
       - Delegate to `review.md` ReviewProcess.
       - The review agent examines the stream's worktree.
       - Clean tasks move to DONE; tasks with issues move to REWORK.

    3. ADDRESS (conditional)
       - If review found issues, delegate to `execution.md` ApplyReviewNotes.
       - The execution agent picks up tasks in REWORK, addresses
         notes, and returns tasks to IN-REVIEW.
       - If all tasks were clean, skip this step.

    4. REREVIEW (conditional)
       - If notes were addressed, delegate to `review.md` ReReview.
       - The review agent verifies fixes.
       - Clean tasks move to DONE; tasks with remaining issues
         move to REWORK.
       - This loop repeats until all tasks are clean and in DONE.
       - Rereview is conditional: it only occurs when the prior review
         found unresolved issues.

    5. CLOSEOUT
       - When all tasks are DONE, the stream is ready for merge.
       - The review subagent merges the branch and cleans up the
         worktree as part of its final clean review / rereview
         pass per `docs/core/git-review-workflow.md`.
       - The orchestrator reports that the stream is fully closed out
         (merged and cleaned up).

  INDEPENDENCE RULE:
    - One stream finishing its loop must trigger its own review
      immediately, without waiting for slower streams in the same phase.
    - A stream blocked by review notes (tasks in REWORK) does NOT
      block unrelated streams that are already clean.
</StreamLifecycle>

---

<FailureClassification>
  PURPOSE: Distinguish failure types so the orchestrator responds
  appropriately.

  INSTITUTIONAL FAILURE
    Definition: The subagent (execution or review) cannot complete its
    work because of missing information, unavailable tooling, or an
    external dependency failure that is outside the subagent's control.
    Examples: tracker server unreachable, missing environment variable,
    network outage during test run, ambiguous phase document.

    Response: Report-and-stop for that subagent path.
    - The orchestrator records the failure.
    - The orchestrator does NOT retry the same subagent with the same
      configuration.
    - The orchestrator reports the blocker to the user and waits.
    - Other ready streams continue unaffected.

  COMPETENCE FAILURE
    Definition: The subagent produces output that is incorrect,
    incomplete, or violates conventions, but the environment and
    instructions are sound.
    Examples: wrong logic, missing tests, convention violations,
    repeated review failures on the same issue.

    Response: Escalation candidate.
    - First occurrence: route back through the normal
      address→rereview loop.
    - Repeated similar failures: escalate per <EscalationPolicy>.
</FailureClassification>

---

<EscalationPolicy>
  PURPOSE: Define how the orchestrator escalates when a subagent path
  repeatedly fails.

  REVIEW EFFORT ESCALATION
    When the harness supports configurable effort levels:
    - Review agents should use higher effort than execution agents.
    - If a stream fails review twice on similar issues, the third
      review attempt should use the highest available effort setting.

    When the harness does NOT support effort levels:
    - Report the constraint: "Harness does not support effort escalation.
      Proceeding with default review configuration."
      Continue with the best default configuration available.

  MODEL ESCALATION
    When the harness supports model or agent switching:
    - After two similar review failures on the same stream, escalate
      to a more capable model or agent for the next review pass.
    - The escalation applies only to the failing stream, not to all
      streams in the phase.

    When the harness does NOT support model switching:
    - Report the constraint: "Harness does not support model escalation.
      Proceeding with current agent."
    - Continue with the current agent.

  STREAM ABANDONMENT
    If a stream has gone through three full review→address→rereview
    cycles and still has unresolved issues:
    - The orchestrator reports the stream as blocked.
    - The orchestrator does NOT abandon the stream silently.
    - The orchestrator asks the user for direction:
      "Stream X has failed three review cycles. Options: continue
      with current agent, escalate if available, or pause this stream."
</EscalationPolicy>

---

<BlockedDependentStreams>
  PURPOSE: Define behavior when a prerequisite stream fails permanently.

  IF an upstream prerequisite stream fails and cannot be resolved
  (institutional failure that stops the path, or user-directed abandonment):

    - Dependent streams that named the failed stream as a prerequisite
      remain BLOCKED.
    - The orchestrator must NOT spawn a blocked dependent stream.
    - The orchestrator reports which streams are blocked and why.
    - Unrelated ready streams continue unaffected.

  IF the failed stream is later recovered (e.g., user resolves the
  blocker, a new execution agent succeeds):

    - The orchestrator rechecks dependency satisfaction.
    - Once the prerequisite stream is fully closed out, blocked
      dependent streams become eligible for spawn.
</BlockedDependentStreams>

---

<PhaseCompletionLoop>
  PURPOSE: Define the loop that runs after all streams are closed out
  to verify the phase as a whole, handle any regressions, and update
  project state.

  The phase completion loop is the final stage of phase-level
  orchestration. It runs only after all gates and streams in the
  phase have been fully closed out (merged and cleaned up).

  LOOP STEPS:

    1. RUN PHASE COMPLETION
       - Delegate to an independent phase-completion subagent per
         `docs/core/phase-completion.md`.
       - The subagent verifies all tracker tasks are DONE, checks the
         Definition of Done, runs the full project test suite, and
         either confirms completion or reports regressions.

    2. EVALUATE RESULT
       IF phase completion passes (full suite green, DoD satisfied):
         → `project-progress.md` is updated by the phase-completion
           subagent. The orchestrator reports that the phase is
           fully complete.
         → Loop ends.

       IF phase completion is blocked by test failures / regressions:
         → The phase-completion subagent creates [BUG] tasks on the
           tracker per `docs/core/phase-completion.md`.
         → Proceed to step 3.

    3. BUG RESOLUTION STREAM
       - Treat the created bug tasks as a stream that runs after the
         phase completion failure.
       - Delegate task execution to an execution agent per
         `docs/core/execution.md` and `docs/core/bug-resolution.md`.
       - Delegate review to a review agent per `docs/core/review.md`.
       - Run the full execute → review → address → rereview lifecycle
         until all bug tasks are DONE and merged.
       - The review subagent merges the bug-fix branch and cleans up
         the worktree per `docs/core/git-review-workflow.md`.

    4. RE-RUN PHASE COMPLETION
       - Return to step 1 and re-run the phase-completion subagent.
       - The loop repeats until phase completion passes or the user
         explicitly stops the loop.

  LOOP RULES:
    - The orchestrator does not diagnose regressions or write fixes.
      It delegates to execution and review subagents.
    - Each iteration of the loop may create a new bug-resolution stream.
      Multiple loops may occur if regressions are interdependent or
      if fixes introduce new failures.
    - The user may stop the loop at any time. If stopped, the phase
      remains incomplete and `project-progress.md` is not updated.
</PhaseCompletionLoop>

---

<PhaseLevelInvocation>
  PURPOSE: Define orchestration scope when the user names a full phase.

  When the user says "orchestrate phase N", the orchestrator:

    1. Reads the phase document and parallelization map.
    2. Runs Gate N.0 to completion (execute → review → address →
       rereview → merge).
    3. Spawns all independent streams in parallel.
    4. As each independent stream closes out, checks whether any
       dependent streams become eligible.
    5. Spawns eligible dependent streams.
    6. Repeats until all streams in the phase are closed out or
       explicitly blocked.
    7. Runs the `<PhaseCompletionLoop>` to verify the phase,
       handle any regressions through bug-resolution streams, and
       update `project-progress.md`. This is the final stage of
       phase-level orchestration.

  STREAM-LEVEL INVOCATION
    When the user says "orchestrate stream X", the orchestrator:
    - Runs only that stream's lifecycle.
    - Does not manage other streams.
    - Still respects dependencies: if Stream X has prerequisites that
      are not closed out, report the blocker and wait.
    - Does NOT run phase completion. Phase completion is only for
      full phase orchestration.
</PhaseLevelInvocation>

---

<OrchestrationCloseout>
  PURPOSE: Define the cleanup step after phase or stream orchestration finishes.

  WHEN phase or stream orchestration finishes:
    - Report the final status first: complete, blocked, or user-stopped.
    - Stop the board after phase or stream orchestration finishes so the
      orchestration session does not leave background tracker processes
      running unnecessarily.
    - If the board is already stopped or the lock is gone, treat closeout
      as already satisfied and continue.
</OrchestrationCloseout>

---

<ModuleBoundaries>
  PURPOSE: Clarify what this module references vs. defines.

  THIS MODULE DEFINES:
    - Orchestrator invocation and routing
    - Parallelization map consumption
    - Stream lifecycle orchestration
    - Failure classification and escalation
    - Blocked stream handling
    - Phase-level vs stream-level scope

  THIS MODULE REFERENCES (does not duplicate):
    - `execution.md` for task creation, execution, and review note application
    - `review.md` for review criteria, review note format, and re-review
    - `git-execution-workflow.md` for worktree creation and commit discipline
    - `git-review-workflow.md` for branch merge and worktree cleanup
    - `phase-completion.md` for phase verification, regression handling, and project state updates
    - `bug-resolution.md` for diagnostic process on bug tasks created by phase completion
    - `phase-planning.md` for parallelization map semantics

  RULE:
    The orchestrator must not redefine per-task rules, tracker state
    transitions, or git operations that are already specified in the
    modules above. It consumes those modules as subroutines.
</ModuleBoundaries>

---

<AntiPatterns>
  <AntiPattern name="Orchestrator Acting as Executor">
    <BadExample>The orchestrator writes implementation code, creates tests, or runs linting directly instead of delegating to an execution agent.</BadExample>
    <Why>The orchestrator's job is coordination, not implementation. Mixing orchestration with execution creates a single point of failure, prevents parallel stream execution, and makes the orchestrator's logic harder to reason about. If implementation work is needed, route it to `docs/core/execution.md` (`StartGateOrStream` or `ApplyReviewNotes`) instead of doing the work directly.</Why>
  </AntiPattern>

  <AntiPattern name="Orchestrator Acting as Reviewer">
    <BadExample>The orchestrator inspects code diffs, decides whether tasks are clean, and writes acceptance or rejection notes itself instead of delegating review.</BadExample>
    <Why>Execution and review are separate control points. When the orchestrator performs review directly, it collapses that separation and weakens the quality gate. Route review work to `docs/core/review.md` (`ReviewProcess` or `ReReview`) instead of reviewing inside the orchestrator session.</Why>
  </AntiPattern>

  <AntiPattern name="Orchestrator Acting as Bug Fixer">
    <BadExample>The orchestrator sees a phase-completion regression, diagnoses the failing code path, and starts writing the fix itself instead of dispatching a bug-resolution stream.</BadExample>
    <Why>Phase-completion failures are handled by a separate verification and repair loop. When regressions appear, re-run `docs/core/phase-completion.md` to create the follow-up bug tasks, then route diagnosis and implementation through `docs/core/bug-resolution.md` and `docs/core/execution.md` rather than fixing the bug inside the orchestrator session.</Why>
  </AntiPattern>

  <AntiPattern name="Oversized Custom Subagent Prompts">
    <BadExample>The orchestrator writes long custom prompts that restate the entire phase document, review criteria, and git workflow every time it delegates a stream action.</BadExample>
    <Why>Oversized prompts waste context budget and make it harder for execution and review agents to isolate the work they actually own. Delegation prompts should name only the action (`execute`, `review`, `address`, `rereview`, or `phase completion`) plus the relevant phase/stream context. Let the delegated module carry the detailed workflow rules.</Why>
  </AntiPattern>

  <AntiPattern name="Map Infidelity">
    <BadExample>The orchestrator spawns Stream C before Stream A has merged because 'it looks like the work is independent' even though the parallelization map declares a dependency.</BadExample>
    <Why>The parallelization map is the contract between planning and execution. Violating it risks integration failures, missing prerequisites, and undefined behavior in downstream streams. The orchestrator must faithfully consume the map as written.</Why>
  </AntiPattern>

  <AntiPattern name="Cross-Stream Blockage">
    <BadExample>Stream B is held in review because Stream A has tasks in REWORK, even though the parallelization map shows no dependency between them.</BadExample>
    <Why>Streams are independent execution paths. One stream's review cycle must not gate another stream's progress unless there is an explicit dependency. This preserves parallelism and prevents slower streams from starving faster ones.</Why>
  </AntiPattern>

  <AntiPattern name="Silent Abandonment">
    <BadExample>A stream fails three review cycles and the orchestrator stops mentioning it without informing the user or recording the blocker.</BadExample>
    <Why>Blocked streams are a project risk. Silent abandonment hides problems from the user and wastes planning effort. The orchestrator must always report blocked streams explicitly and ask for direction.</Why>
  </AntiPattern>
</AntiPatterns>
