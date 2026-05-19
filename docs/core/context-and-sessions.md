# Context Rot & Session Management

This module explains Blueprint's approach to preventing context rot—the quality degradation that happens as AI fills its context window—and how to manage sessions effectively across parallel work.

---

## The Context Rot Problem

As AI-aided development accelerates, context becomes a scarce resource. Three forces drive context rot:

1. **Context window limits.** An agent can hold ~100K tokens (for Haiku) to ~200K (for Sonnet/Opus). A complex phase with 20+ tasks, phase docs, implementation notes, test failures, and review comments quickly exhausts this budget.

2. **Session fragmentation.** When an agent loses context between tasks, it must re-read the phase doc, understand state, re-derive decisions, and re-discover task dependencies. Each session restart compounds cognitive load.

3. **Stale instructions.** A phase plan written at the start of execution becomes outdated as scope changes, blockers emerge, and streams complete out of order. Agents working from stale specs ship code that doesn't integrate.

**The outcome:** Features ship untested, reviews catch gaps that could have been prevented, and parallel work creates integration surprises.

---

## How Blueprint Prevents Context Rot

Blueprint addresses context rot through five mechanisms:

### 1. Bounded Task Scope

Each task is one discrete deliverable with:
- A clear title and description
- Explicit acceptance criteria (what makes it DONE)
- One or more tests that enforce the contract
- An estimate so agents can scope their context budget

Because tasks are small, an agent can load everything relevant to a task (phase doc, test plan, acceptance criteria, prior tests) into context without overflow.

### 2. The Tracker as External Memory

The **built-in task tracker** (accessed via `blueprint board`) is the single source of truth for work state:

- **What's done.** Completed tasks stay in DONE; no re-reading phase docs.
- **What's blocked.** Tasks in IN-REVIEW or REWORK signal where work is stuck.
- **Who's working on what.** Assignees and state prevent agents from stomping on each other.
- **Progress visibility.** A phase at a glance: Gate closed, Stream A complete, Stream B in review.

Agents don't need to hold phase state in context. They read it from the tracker once per session.

### 3. Test Contracts

Every task ships with a test. The test becomes the contract:
- **Before implementation:** The test is the spec. Agents know exactly what "DONE" means.
- **After implementation:** The test enforces the behavior. Future agents can rely on it.
- **Cross-session continuity:** A new agent picking up a phase can read the test suite and understand the phase's boundaries without re-reading docs.

### 4. Progressive Documentation

Plans are written only as detailed as the stage requires:

- **Milestone:** High-level ("Build authentication layer"). Phases TBD.
- **Phase:** Full detail ("Gate: schema design. Stream A: user endpoints. Stream B: JWT issuer."). Tasks specified.
- **Task:** Acceptance criteria, test plan, dependencies. No speculation.

Once a phase is planned, it does not change unless scope shifts formally (via revision planning). Agents work from a stable spec.

### 5. Git as Audit Trail

Every task's work lives in a git branch with:
- Commit messages explaining each change
- Test files proving the behavior
- Implementation notes left by the executing agent
- Review notes showing why the reviewer accepted or rejected it

When an agent returns to a task (or a new agent takes over), the git history is the complete context. No need to ask "why was this done?" — the commit messages and review notes explain it.

---

## Managing Sessions Effectively

A session is a continuous stretch of agent execution within a phase. Sessions end when:

- A task moves to IN-REVIEW (executing agent stops, reviewer takes over)
- An orchestrator hands off between streams (parallel agents run concurrently)
- Work is suspended and resumed later (agent logs out, logs back in)

Here's how to manage sessions to avoid context rot:

### Start Clean: Load the Phase Doc + Tracker State

When an agent begins a session:

```
1. Read the phase document (strategy, acceptance criteria, test plan).
2. Query the tracker: GET /tasks?phase=<phase>&stream=<stream>
3. Review the Definition of Done checklist.
4. Set up a fresh worktree: git worktree add ...
```

Don't rely on memory or prior sessions. The tracker and docs are authoritative.

### Keep Context Budget Tight

Within a session, do NOT load the entire codebase into context. Instead:

- **Load one task at a time.** Read task acceptance criteria + tests.
- **Read only relevant code.** If the task is "add /login endpoint," don't load the dashboard code.
- **Use grep wisely.** `grep "export class Auth"` finds the auth class; grep doesn't require reading the whole src/ directory.
- **Batch small related tasks.** If tasks A, B, C are in the same stream and highly coupled, do all three in one session. If they're independent, split them.

When you're running low on tokens mid-task:
1. Commit what you have (even if incomplete).
2. Leave an implementation note in the tracker explaining the state.
3. Start a new session for the next task.

The note becomes context for the next agent.

### Commit Frequently

Commits are your insurance policy against context loss:

```bash
# After each task or subtask milestone
git commit -m "Task R6-3.1: Implement POST /login endpoint

Acceptance: endpoint accepts email+password, validates, issues JWT.
Tests: 4 passing (auth.test.ts).
Next: add rate limiting in R6-3.2"
```

If a session ends, the next agent reads:
- The commit message (explains what was done and why)
- The diff (shows exactly what code changed)
- The test file (proves the behavior works)

### Use Implementation Notes in the Tracker

When you pause a task or hand it off, update the tracker task with notes:

```
PATCH /tasks/R6-3.1 -d '{"implementation_notes":"Endpoint working, tests green. Next: add rate limiting. Check /src/middleware/rateLimit.ts for existing strategy."}'
```

Implementation notes are **visible in the board** and become context for the next agent without loading git history.

### Manage Parallel Sessions with the Tracker

When multiple agents work in parallel (streams A, B, C):

1. Each agent gets its own worktree (no merge conflicts during execution).
2. Each agent reads the tracker to see which streams are blocked or complete.
3. An orchestrator agent monitors tracker state and signals when dependencies are met.

**Example:**
- Stream A: Gate closing. Tasks 1–3 in DONE.
- Stream B: Waiting on Stream A (blocked by tracker state). Orchestrator sees this.
- Stream C: Independent. Runs in parallel, not waiting.

No agent needs to read the others' code or status. The tracker is the protocol.

### Resuming After a Break

When you resume work on a phase after days or weeks:

1. Run `blueprint doctor` to verify project integrity.
2. Query the tracker to see current state (which streams are done, which are in review).
3. Read the phase doc to refresh on strategy and acceptance criteria.
4. Pick the next unstarted task or re-engage with a stalled task.

The tracker shows you exactly where you left off. No guessing.

---

## Orchestration + Sessions

When orchestrating a phase (managing multiple streams):

### The Orchestrator's Role in Session Management

1. **Read the phase doc + tracker.** Understand the parallelization map and current state.
2. **Spawn execution sessions.** Assign each stream to an execution agent with its worktree and scope.
3. **Monitor tracker state.** Watch for completed tasks, blocking issues, rework loops.
4. **Dispatch review sessions.** When a stream reaches IN-REVIEW, spawn a review agent with the same stream scope.
5. **Manage rework cycles.** If a reviewer finds issues, spawn an address-notes session for the executing agent.
6. **Signal dependencies.** When a dependent stream's prerequisite is merged, spawn the dependent stream.

### Preventing Context Explosion in Orchestration

An orchestrator managing 3 streams with 15 total tasks might seem like a lot to hold in context. It's not, if you use the tracker:

- **Don't load all 15 tasks.** Load the phase doc (describes the structure) + tracker (shows state).
- **Delegate execution.** Each execution agent reads its stream's tasks in the tracker, not from the orchestrator.
- **Use implementation notes.** When an executing agent notes "Stream A blocked by schema design," the orchestrator reads that from the tracker, not from a verbal report.

The orchestrator's context budget goes to **coordination**, not to **code details**. The tracker makes this possible.

---

## Session Checklist

Before starting a session:

- [ ] Read the phase document (strategy, acceptance criteria, Definition of Done)
- [ ] Query the tracker for your stream/gate's current task state
- [ ] Set up a fresh worktree if starting a new gate or stream
- [ ] Load only the code relevant to your next 1–2 tasks
- [ ] Note the phase doc's parallelization map (which streams are independent, which are blocked)

During a session:

- [ ] Commit after each task or significant subtask (with clear messages)
- [ ] Update tracker task state as you move tasks (TO-DO → IN-PROGRESS → IN-REVIEW)
- [ ] Update implementation notes when pausing or handing off
- [ ] Run the relevant test suite at the end of each task (stream tests, not full suite)

At session end:

- [ ] All tasks moved to IN-REVIEW (or paused with notes)
- [ ] Commits pushed to the branch
- [ ] Implementation notes updated in the tracker
- [ ] Branch ready for review (or awaiting dependent work)

---

## Common Patterns

### Pattern: Single Agent, Multiple Sessions

A single agent executes Stream A across 3 sessions (pauses due to context limits or time):

**Session 1:**
- Load phase doc + tracker
- Execute tasks 1–3 (tight scope: auth schema + migration)
- Move to IN-REVIEW
- Commit + push

**Session 2:**
- Read tracker: Stream A is in IN-REVIEW (awaiting review)
- Switch to Stream B (independent)
- Execute tasks 1–2
- Commit + push (branch not merged yet, but ready for review)

**Session 3:**
- Read tracker: Stream A now has rework notes
- Switch back to Stream A (review found an issue)
- Address the notes, re-test, move back to IN-REVIEW
- Commit + push (rework branch)

The tracker is the coordinator. Sessions don't need to know about each other.

### Pattern: Multiple Agents, Parallel Streams

Orchestrator spawns 3 execution agents:

**Execution Agent A:**
- Gets assigned Stream A (tasks 1–5)
- Set up worktree `stream-a`
- Query tracker for Stream A tasks
- Execute, commit, push to `stream-a` branch

**Execution Agent B:**
- Gets assigned Stream B (tasks 1–3, independent from A)
- Set up worktree `stream-b`
- Query tracker for Stream B tasks
- Execute, commit, push to `stream-b` branch

**Execution Agent C:**
- Gets assigned Stream C (tasks 1–2, **depends on Stream A**)
- Reads tracker: Stream A not yet closed
- Waits (polls tracker or receives signal from orchestrator)
- Once Stream A is merged, gets the green light
- Set up worktree `stream-c`
- Execute with knowledge of Stream A's changes (already in main)

No agent needs to read the others' code. The tracker + git branches coordinate the work.

### Pattern: Rework + Re-review Loop

Task moves through iterations:

1. **First execution:** Agent executes task, moves to IN-REVIEW
2. **First review:** Reviewer finds issue, posts MAJOR note, task moves to REWORK
3. **Address notes:** Agent fixes issue, responds to note, moves to IN-REVIEW again
4. **Re-review:** Reviewer checks fix, resolves note, task moves to DONE

The tracker shows the history: IN-REVIEW → REWORK → IN-REVIEW → DONE. Implementation notes explain each transition.

---

## When Context Rot Still Happens

If you see signs of context rot (code not matching phase spec, tests suddenly failing, conflicting changes across streams), escalate:

1. **Run phase completion** (`blueprint` command: see `docs/core/phase-completion.md`).
   This catches regressions and surfaces bugs as tracked tasks.

2. **If regressions are found,** open bug tasks and resolve them before closing the phase.

3. **If conflicts emerged,** call a synchronization point: orchestrator gathers both agents, reads the conflicting code + tracker state, clarifies intent, and re-routes.

Context rot is a symptom of unclear state. The tracker + phase doc should always be the source of truth. If agents are contradicting the tracker, the tracker needs updating, not the code.

---

## Summary

Context rot is prevented through bounded tasks, external tracking, test contracts, progressive docs, and clean git history. Sessions are managed by leaning on the tracker (not memory), keeping context budgets tight, committing often, and using implementation notes to hand off work.

Orchestration amplifies this: many parallel sessions become coordinated through the tracker instead of causing context explosion. Each agent reads only what it needs, commits often, and the orchestrator orchestrates through state and signals, not by holding all the code in context.

The result: agents can work on large phases without context overflow, hand off work cleanly, and resume after breaks without losing state.
