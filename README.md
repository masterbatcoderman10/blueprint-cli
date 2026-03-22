# Blueprint

**Vibe coding is the future. Shipping broken software isn't.** Blueprint is the software engineering framework built for the age of AI-aided development — bringing the rigour, structure, and discipline of real engineering practice to the way you work with AI agents, without slowing you down.

Most developers using AI tools are building faster than ever and accumulating risk faster than ever. Features shipped without test contracts. Agents that lose context between sessions. Plans that can't survive a scope change. Blueprint is the engineering philosophy that makes vibe coding production-grade.

> Blueprint doesn't slow down AI development. It gives it the foundation that makes the output trustworthy.

---

## Why Blueprint

### Write software you can stand behind

Blueprint enforces test-driven development at the task level — not as a rule you impose after the fact, but as the structure your agents work within. Before any agent writes a line of implementation code, it writes the test. The test fails. The implementation makes it pass. This is not optional: if a test passes before implementation, Blueprint flags it as invalid and asks you to fix the test.

Every task carries acceptance criteria. Every phase ends at a validation gate that won't open until every task is in DONE, the Definition of Done is satisfied, and the full test suite is green. Cross-phase regressions are caught at phase completion, turned into tracked bug tasks, and resolved before the project moves forward. There is no path through Blueprint that produces untested, unreviewed software.

### Run agents in parallel without chaos

Blueprint's planning hierarchy — Project → Milestone → Phase → Gate → Stream → Task — is designed from the ground up for concurrent execution. Within a phase, a Gate establishes the blocking foundation that must complete first. Once the Gate is closed, independent Streams run in parallel: each stream is a scoped, bounded track of work with explicit file ownership and dependencies, so multiple agents can execute simultaneously without stepping on each other.

Tasks marked Independent in a phase doc can be handed to sub-agents and run concurrently. Tasks marked Dependent wait only until their upstream tasks reach IN-REVIEW. The structure tells your agents exactly what they can parallelise and exactly what they must sequence — no guesswork, no conflicts.

### Plans that survive reality

Requirements change mid-flight. Blueprint is built for that. When scope shifts, Blueprint revises the downstream plan structure, flags dependency conflicts, and keeps the spec coherent. Agents are always working from an accurate, up-to-date specification — not stale instructions from three sessions ago. Progressive planning means you commit to the level of detail each stage actually requires, no more and no less.

---

## The Full Development Workflow

Blueprint structures AI-aided development into a repeating cycle. Here is how a project moves from idea to shipped phase.

### 1. Plan your PRD and milestones

Start with a product requirements document. Blueprint interviews you — asking about scope, user outcomes, and what is explicitly out — until it has enough to draft. You confirm the draft before anything is written. Milestones group related phases into coherent product increments. At this stage, plans stay intentionally high-level: milestones describe capabilities, not implementations.

```
User intent: "I want to plan my project"
→ Blueprint asks clarifying questions in small batches
→ Drafts PRD → you confirm → PRD committed to repo
→ Milestones drafted → you confirm → milestone docs committed
```

### 2. Plan a phase in detail

When you're ready to build, you plan the next phase in full. Blueprint helps you decompose the feature area into a Gate (the blocking foundation) and one or more Streams (parallel tracks). Every task gets an ID, a duration estimate, dependencies, acceptance criteria, and a type (`Independent` or `Dependent`). The phase also produces a Test Plan — mapping tests to tasks before execution starts.

```
User intent: "Plan phase 2"
→ Blueprint interviews you about scope, dependencies, edge cases
→ Draft phase doc with gate, streams, tasks, acceptance criteria
→ Test Plan written alongside tasks
→ You confirm → phase doc committed
```

### 3. Execute a gate or stream

With a planned phase in hand, you tell your agent to start a gate or stream. The agent creates tasks on the kanban board, sets up a git worktree, and begins executing in dependency order. For each task: write the test first (it should fail), implement until it passes, lint the modified files, run the stream's tests, leave implementation notes, move to IN-REVIEW.

Independent tasks within a stream can be handed to sub-agents and run concurrently. Each sub-agent follows the same TDD discipline — no shortcuts for parallel work.

```
User command: "Start stream A"
→ Tasks created on kanban (TO-DO)
→ Worktree set up for this stream
→ For each task: write test → fail → implement → pass → lint → move to IN-REVIEW
→ All tasks in IN-REVIEW → commit → agent stops and waits
```

**The executing agent never marks a task DONE. Only the reviewer does.**

### 4. Review the completed work

Once a stream is in IN-REVIEW, you trigger a review. The reviewer reads each task's requirements from the phase doc, examines the implementation, and evaluates against criteria that go well beyond linting: correctness, logic, conventions, anti-patterns, library usage, and test quality. Clean tasks move to DONE. Tasks with issues receive structured review notes — each note tagged MAJOR or MINOR with an explanation of why the issue matters.

The reviewer also verifies the stream's acceptance criteria as a whole — individual tasks can each be clean but the stream can still fail a criterion if pieces don't integrate correctly.

```
User command: "Review stream A"
→ Reviewer reads phase doc requirements
→ Examines code, tests, and implementation notes for each task
→ Clean → moves task to DONE
→ Issues found → leaves structured MAJOR/MINOR notes → task stays IN-REVIEW
→ Acceptance criteria verified across the stream
→ If all clean: branch merged to main
```

### 5. Address review notes

For tasks that received notes, the executing agent works through them one at a time: move to IN-PROGRESS, address each note, run tests, respond inline to every note explaining what was changed, move back to IN-REVIEW. No note is silently skipped.

```
User command: "Address review notes for stream A"
→ Agent reads each note on IN-REVIEW tasks
→ Addresses MAJOR and MINOR issues
→ Responds to each note inline with what changed
→ Moves tasks back to IN-REVIEW
→ Commits → stops and waits for re-review
```

### 6. Re-review until clean

The reviewer re-checks every task that was returned. Each note is verified against the actual code — the reviewer does not take the agent's response at face value. If the fix is correct, the note is resolved. If incomplete or a new issue was introduced, a new note is left. The cycle repeats — execute → review → address → re-review — until every task in the stream is in DONE and the branch is merged.

```
Review cycle (repeats as many times as needed):
→ Reviewer verifies each fix against the code
→ Resolved: note marked clean, task moves to DONE when all notes resolved
→ Not resolved: new note left, agent addresses again
→ All tasks DONE → branch merged to main
```

### 7. Close the phase

When all streams and the gate are complete, you run phase completion. This is the full verification gate for the entire phase: all tasks must be in DONE, the Definition of Done must be satisfied, and the full test suite for the entire project must be green. If tests from previous phases now fail (regressions), phase completion surfaces them as bug tasks on the kanban board and stops. The phase does not close until the project is clean.

```
User command: "Phase completion"
→ Verifies all tasks are in DONE
→ Checks Definition of Done
→ Runs full project test suite (not just this phase)
→ All green → phase marked Complete in project-progress.md
→ Regressions found → [BUG] tasks created → phase stays open → bugs resolved → re-run
```

### 8. Debug and resolve bugs

Bugs enter the system two ways: as [BUG] tasks created automatically by phase completion from failing tests, or as user-reported issues. For user-reported bugs, Blueprint walks through symptom clarification, reproduction, and root cause diagnosis before any fix is attempted — and presents the diagnosis to you before making changes. For test-identified bugs, the failing test is the reproduction; diagnosis begins immediately.

Every bug fix follows the same TDD discipline: write a regression test that fails, implement the fix, make the test pass. Bug fixes go through the same review cycle as feature work. If diagnosis reveals the code is correct but the design is wrong, Blueprint escalates to revision planning rather than applying a workaround.

```
Bug reported → clarify symptom → reproduce → diagnose root cause
→ Present diagnosis to user → confirm fix approach
→ Write regression test (should fail) → implement fix → test passes
→ Move to IN-REVIEW → review cycle → DONE
```

---

## The Planning Hierarchy

```
Project
└── Milestone  (M1, M2, M3…)         — a major product increment
    └── Phase  (Phase 1, Phase 2…)   — a feature area with full task detail
        └── Gate  (Gate N.0)          — blocking foundation that must complete first
        └── Stream  (A, B, C…)        — parallel tracks of work, run after the gate
            └── Task                  — one deliverable unit with tests and acceptance criteria
```

Gates block. Streams parallelise. Tasks are the unit of agent execution.

---

## Install

```bash
npm install -g @splitwireml/blueprint
```

Requires Node.js `>=20.0.0`.

---

## Quick Start

```bash
mkdir my-project && cd my-project
blueprint init
```

This scaffolds the full Blueprint docs and templates into your repository — PRD, milestone tracker, phase docs, testing contracts, conventions file, and managed agent files — giving you and your AI tools a shared foundation from day one.

### Getting Help

Blueprint provides contextual help at every level:

```bash
blueprint           # Show root help with available commands
blueprint --help   # Same as above
blueprint -h       # Same as above
blueprint help init    # Show help for init command
blueprint help doctor  # Show help for doctor command
blueprint init --help   # Same as above
blueprint doctor --help # Same as above
```

Run `blueprint doctor` at any time to validate your project structure and repair any drift:

```bash
blueprint doctor
```

---

## Commands

### `blueprint init`

Scaffolds a new or existing repository for Blueprint-driven development.

- Creates the `docs/` structure with Blueprint's full suite of planning modules
- Scaffolds editable project docs: `docs/prd.md`, `docs/project-progress.md`, `docs/conventions.md`, and phase templates
- Copies bundled templates that ship with the package
- Sets up managed agent files so your AI tools have structured, consistent entry points

### `blueprint doctor`

Audits your Blueprint project and optionally repairs drift.

- Inspects canonical Blueprint files and manifest state
- Reports missing, malformed, or out-of-sync files
- Builds a targeted repair plan when fixes are available
- Re-validates after repairs are applied

### `blueprint link` *(coming soon)*

Cross-project linking — connecting related repositories under a shared planning context so agents can reason across repo boundaries.

### `blueprint context` *(coming soon)*

Cross-project context surfacing — giving agents and developers a full picture across a multi-repo project without manual coordination overhead.

---

## Release Info

- **Package:** `@splitwireml/blueprint`
- **Executable:** `blueprint`
- **Node.js:** `>=20.0.0`
- **Versioning:** stable semver `vMAJOR.MINOR.PATCH`
- [Release contract](docs/release-contract.md)
