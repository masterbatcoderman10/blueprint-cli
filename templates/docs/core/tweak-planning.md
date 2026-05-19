# Tweak Planning

This module defines the **standalone tweak workflow** — a top-level
quick-change contract for small, contained corrections and adjustments
that should move faster than revisions while preserving every Blueprint
planning, tracker, review, and verification guard.

Tweaks live at the top of the project tree under `docs/tweaks/`. They
are **not** sections inside phase documents and they are **not** owned
by any milestone or phase. They are the smallest formal change contract
in Blueprint.

A tweak gets its own standalone Markdown document, its own tracker
milestone, and its own execution → review → address-notes → re-review
lifecycle. What it does **not** get is a formal Test Plan section —
needing one is an escalation signal that the work should be routed to
revision or milestone planning instead.

---

<TweakDefinition>
  PURPOSE: Define exactly what a tweak is, what it is not, and how to
  recognize one. This is the contract every agent and reviewer reads
  before classifying or drafting a tweak.

  A tweak IS:
    - **Small.** A handful of file edits or a single targeted change.
    - **Contained.** Localized surface area; no cross-cutting contract
      changes; no new multi-phase work.
    - **Single concern.** One coherent intent. Not a basket of unrelated
      fixes bundled together.
    - **Non-feature.** It corrects, clarifies, adjusts, or polishes
      existing behavior or documentation. It does not introduce a new
      capability the system did not previously offer.
    - **No formal Test Plan.** A tweak relies on the existing project
      test suite plus any targeted assertions the author chooses to add
      inline. If the work needs its own formal Test Plan section, it is
      not a tweak.
    - **Standalone-documented.** Lives at `docs/tweaks/tweak-<n>-<slug>.md`,
      not inside a phase or revision document.
    - **Tracker-backed.** Every task lives on the built-in tracker under
      the milestone value `Tweak <n> — <name>` and moves through the
      normal five-state machine.

  A tweak is NOT:
    - **A new feature.** New capabilities, new commands, new endpoints,
      new user-visible surfaces → revision or milestone planning.
    - **A revision.** Multi-phase, cross-cutting, or contract-level
      change → revision planning.
    - **A bug.** A defect in implemented behavior with a reproduction
      path → bug-resolution.
    - **A scope addition.** An additive new ask the user has just raised
      that did not exist in the plan → scope-change.
    - **A way to skip planning rigor.** Tweaks still get a written
      document, user review, tracker tasks, and a green full test suite
      before they are marked DONE.

  ### Positive examples

  These are positive examples — each one qualifies as a tweak:

  - **UI copy fix.** A button label reads "Sumbit"; the tweak corrects
    it to "Submit", updates one screen test snapshot, and ships.
  - **Add a single anti-pattern to a core module.** A reviewer notices a
    recurring foot-gun missing from `docs/core/execution.md`'s
    `<AntiPatterns>` section; the tweak appends one new entry with name,
    bad example, and explanation.
  - **Lock a previously vague convention.** `docs/conventions.md` says
    "use kebab-case file names" but does not specify how to handle
    acronyms; the tweak adds one clarifying bullet plus an example.
  - **Tighten an error message.** An existing CLI error reads "Error:
    failed"; the tweak rewrites it to name the file and the failing
    operation. One assertion in the existing test file is updated.
  - **Bump a default value.** A timeout default rises from 5s to 10s
    after live observation; the tweak edits the constant, updates the
    one place documenting it, and adjusts a single existing test.

  ### Negative examples

  These are negative examples — each one looks small but is **not** a
  tweak:

  - **"Add a search bar to the board."** New user-visible feature with
    new state, new event handlers, new tests. → Revision (or milestone
    phase).
  - **"Rename the tracker's `milestone` column to `group`."** Schema
    change with cross-cutting impact on the CRUD service, the SPA, the
    JSON snapshot, and tests across multiple phases. → Revision.
  - **"Make the board work offline."** Cross-cutting contract change,
    new behavior surface, needs its own test plan. → Revision.
  - **"Fix the board crashing on `GET /tasks` when phase contains a
    slash."** A reproducible defect in implemented behavior. → Bug
    resolution (and a regression test).
  - **"Reword the entire tweak workflow."** Multi-section rewrite of a
    core module, cross-cutting contract redefinition; itself qualifies
    as a revision phase, not a tweak.
  - **"Add five small fixes across four modules."** Multiple unrelated
    concerns bundled — split into individual tweaks or escalate to a
    revision; a single tweak doc covers a single concern.
</TweakDefinition>

---

<TweakIntentClassification>
  PURPOSE: Force the agent to **proactively classify** every incoming
  change request for tweak suitability — applying general intelligence
  to scope, surface area, feature-ness, and test-plan need — regardless
  of whether the user used the word "tweak".

  CLASSIFICATION RULE — applies to every change request:

  1. The agent must classify the request proactively before drafting
     any plan. The user is NOT required to say the word "tweak". Even
     when the user says "just change X", "quickly fix Y", "tweak the
     wording", "add this small thing", "redo this", or simply describes
     a small change, the agent runs the classification.

  2. The agent applies general intelligence to four dimensions:

     a. **Scope.** How many concerns does the request cover? One coherent
        concern → tweak-candidate. Multiple unrelated concerns → split
        or escalate.

     b. **Surface area.** How many files, contracts, or user-visible
        surfaces does it touch? Localized → tweak-candidate.
        Cross-cutting → revision.

     c. **Feature-ness.** Does it add new capabilities the system did
        not previously offer? Yes → not a tweak (route to scope-change
        or revision). No → tweak-candidate.

     d. **Test-plan need.** Does the change need its own formal Test
        Plan section to be safely verified? If yes → not a tweak
        (escalation signal — route to revision/milestone planning).
        If no → tweak-candidate.

  3. The agent surfaces the classification to the user **before**
     drafting the tweak document, in one of these forms:

     - "I'm classifying this as a tweak — small, contained, non-feature,
       no new test plan needed. I'll draft it under
       `docs/tweaks/tweak-<n>-<slug>.md`. OK to proceed?"
     - "This looks like a revision, not a tweak — it touches multiple
       phases / adds a new feature / would need its own test plan.
       I'd route this to `docs/core/revision-planning.md`. Confirm?"
     - "This looks like a bug, not a tweak — there's a reproducible
       defect in implemented behavior. I'd route to
       `docs/core/bug-resolution.md`. Confirm?"

  4. The user may overrule the classification, but the agent must record
     the override in the tweak document's Status section, naming what
     was overridden and why.

  HARD RULES:
    - The agent NEVER skips classification because the user used or
      omitted the word "tweak".
    - The agent NEVER quietly downgrades a request to a tweak to skip
      revision planning rigor.
    - The agent NEVER quietly upgrades a tweak to a revision to inflate
      scope.
    - Classification is one short message; it is not a long document.
</TweakIntentClassification>

---

<TweakReviewGate>
  PURPOSE: Make user review of the drafted tweak plan **mandatory**
  before any task leaves TO-DO on the tracker. Mirrors the planning →
  review → commit discipline used by `planning.md` STEP 4–5.

  GATE — every tweak must satisfy this before execution begins:

  1. The agent drafts the tweak document at
     `docs/tweaks/tweak-<n>-<slug>.md` and creates the tracker tasks
     under milestone `Tweak <n> — <name>` in the **TO-DO** state.

  2. The agent presents the drafted tweak document to the user — full
     content, not a summary — and explicitly requests user confirmation
     of:

     - The tweak scope (Goals, Dependencies)
     - The task table
     - The Acceptance Criteria
     - The Verification approach
     - The Definition of Done

  3. No tracker task may transition from **TO-DO** to **IN-PROGRESS**
     until the user has explicitly confirmed the drafted tweak document.
     "Looks fine, continue" or "yes, proceed" both count. Silence or
     ambiguous responses do not.

  4. If the user requests changes, the agent **re-loops the draft**:
     - Updates the document.
     - Adjusts the tracker tasks if scope changed.
     - Re-presents the updated document.
     - Waits again for explicit confirmation.

     There is no upper limit on re-loops. The gate holds until the user
     explicitly confirms.

  5. Only after explicit confirmation may the agent move the first
     tracker task to **IN-PROGRESS** and begin execution per
     `<TweakExecutionLifecycle>`.

  HARD RULES:
    - Confirmation is **mandatory**, not optional. No work begins
      without it.
    - The gate phrasing on the tracker is the literal state machine:
      tasks stay in **TO-DO** until confirmed.
    - The agent never assumes confirmation from context. The agent asks
      directly and waits for an explicit yes.
    - Re-loops preserve the tracker tasks where possible — do not
      destroy and re-create unless the task list itself changed.
</TweakReviewGate>

---

<TweakProcess>
  PURPOSE: Walk through scoping, drafting, gating, executing, and
  completing a tweak end-to-end.

  PRECONDITIONS:
  - `docs/project-progress.md` is loaded.
  - `docs/conventions.md` is loaded.
  - The local tracker server is reachable.
  - The agent has classified the request per `<TweakIntentClassification>`
    and the user has confirmed the tweak route.

  STEP 1 — UNDERSTAND THE CHANGE
    Clarify with the user:
    - What needs to change?
    - Why (source of truth: convention, bug report, copy edit, etc.)?
    - What is the smallest possible scope that addresses the intent?

    If the answer to "what is the smallest possible scope" exceeds one
    coherent concern or escapes localized surface area, re-classify per
    `<TweakIntentClassification>`.

  STEP 2 — RESERVE THE TWEAK NUMBER AND SLUG
    Assign the next available `<n>` by scanning `docs/tweaks/` for the
    highest existing `tweak-<n>-*.md` and incrementing by one. Choose a
    short kebab-case `<slug>` describing the change.

    File path: `docs/tweaks/tweak-<n>-<slug>.md`
    Tracker milestone: `Tweak <n> — <name>` (em-dash, human-readable name)

  STEP 3 — DRAFT THE TWEAK DOCUMENT
    Create the tweak document using the structure defined in
    `<TweakDocumentStructure>`. The document is lightweight: Goals,
    Dependencies, one or more small Task tables, Acceptance Criteria,
    Verification, Definition of Done, Status.

    Do NOT include a formal Test Plan section. Add inline test notes in
    Verification if a targeted assertion is needed.

  STEP 4 — CREATE TRACKER TASKS
    For every task in the document's task table, create a tracker task
    via `POST /tasks` with:
    - `id`: tweak-scoped ID (e.g. `TW<n>.1`, `TW<n>.2`)
    - `milestone`: `Tweak <n> — <name>`
    - `phase`: same as milestone (or `TW<n>` if a short form is
      preferred), `stream`: `0`
    - `state`: `TO-DO`

    Tasks stay in TO-DO until `<TweakReviewGate>` is satisfied.

  STEP 5 — RUN THE REVIEW GATE
    Execute `<TweakReviewGate>` end-to-end. Do not proceed past this
    step without explicit user confirmation.

  STEP 6 — EXECUTE
    Execute the tweak per `<TweakExecutionLifecycle>`. All tasks move
    TO-DO → IN-PROGRESS → IN-REVIEW.

  STEP 7 — REVIEW AND ADDRESS NOTES
    Reviewer reviews each task, adds notes if needed. Tasks needing
    rework move IN-REVIEW → REWORK. Author addresses notes, returns
    REWORK → IN-PROGRESS → IN-REVIEW.

  STEP 8 — COMPLETE
    When all review notes are addressed and `npm test` is green for the
    project, the reviewer moves the terminal task to DONE. The tweak's
    Status section is updated to **Complete**. The tweak document is
    archived in place under `docs/tweaks/` and is never deleted.
</TweakProcess>

---

<TweakExecutionLifecycle>
  PURPOSE: Define the tracker-backed lifecycle for a tweak's tasks.
  This mirrors the standard execute → review → address → re-review
  loop used elsewhere in Blueprint.

  STATES:
    TO-DO → IN-PROGRESS → IN-REVIEW → (REWORK → IN-PROGRESS → IN-REVIEW)* → DONE

  TRANSITIONS (curl recipes per `docs/core/tracker.md`):

  - **TO-DO → IN-PROGRESS**: gated by `<TweakReviewGate>`. Only after
    explicit user confirmation of the drafted tweak document.

  - **IN-PROGRESS → IN-REVIEW**: when the author has implemented the
    task and the project test suite is green for the touched surface
    area.

  - **IN-REVIEW → REWORK**: reviewer rejects with notes.

  - **REWORK → IN-PROGRESS**: author addresses notes; canonical forward
    transition out of REWORK.

  - **IN-REVIEW → DONE**: reviewer accepts. The terminal task may only
    move to DONE when the full project test suite (`npm test`) is green.
    This is the **tweak-completion gate**.

  HARD RULES:
    - The executing agent NEVER moves a task to DONE. Only the reviewer
      does.
    - The terminal task cannot transition to DONE while `npm test` is
      failing.
    - Every task transition is recorded by the tracker; no informal
      side-channel state.
    - When a tweak touches work originally produced by a phase task,
      add a tracker note to the relevant phase task on the tracker
      referencing the tweak ID and naming what changed. This preserves
      traceability between the original task and the tweak that
      adjusted it.
</TweakExecutionLifecycle>

---

<TweakDocumentStructure>
  PURPOSE: Define the lightweight structure every tweak document uses.
  Mirrors the phase-plan shape but stripped to the minimum and **with no
  formal Test Plan section**.

  FILE NAMING (locked):
    `docs/tweaks/tweak-<n>-<slug>.md`

  TRACKER MILESTONE (locked):
    `Tweak <n> — <name>`

  REQUIRED SECTIONS (in order):

  1. **Title + header line.**
     `# Tweak <n> — <Name>`
     One line summarizing intent.

  2. **Goals.**
     `## Goals` — bulleted list of what the tweak achieves.

  3. **Dependencies.**
     `## Dependencies` — what must be true before the tweak can run
     (other tweaks complete, an external decision made, etc.). Use a
     small table with Dependency / Status columns.

  4. **Task table.**
     A small task table (one or two rows is typical). Columns:
     Task ID / Task / Dependencies. The ID format is `TW<n>.<seq>`.

  5. **Acceptance Criteria.**
     `## Acceptance Criteria` — observable, verifiable conditions.

  6. **Verification.**
     `## Verification` — how the change will be verified. Inline
     references to existing tests, ad-hoc commands to run, or targeted
     assertions to add. Not a formal Test Plan.

  7. **Definition of Done.**
     `## Definition of Done` — checklist gating completion. Must include
     "`npm test` is green for the project" as one of the items.

  8. **Status.**
     `## Status` — current state of the tweak: Draft / In Progress /
     Complete, plus any classification overrides or re-loop notes from
     `<TweakReviewGate>`.

  FORBIDDEN:
    - **No formal Test Plan section.** Needing one is an escalation
      signal — route to revision/milestone planning instead.
</TweakDocumentStructure>

---

<TweakBoundaryRules>
  PURPOSE: Hard boundary rules against revisions, scope-change, and
  bug-resolution. Use the decision guide whenever the boundary is
  unclear.

  ┌────────────────────────────────────────┬─────────┬───────────┬────────────┬─────────┐
  │ Question                               │ Tweak   │ Revision  │ Scope-     │ Bug     │
  │                                        │         │           │ change     │         │
  ├────────────────────────────────────────┼─────────┼───────────┼────────────┼─────────┤
  │ Adds a new feature?                    │ No      │ Sometimes │ Yes        │ No      │
  ├────────────────────────────────────────┼─────────┼───────────┼────────────┼─────────┤
  │ Spans multiple phases?                 │ No      │ Yes       │ Sometimes  │ No      │
  ├────────────────────────────────────────┼─────────┼───────────┼────────────┼─────────┤
  │ Touches a cross-cutting contract?      │ No      │ Yes       │ Sometimes  │ No      │
  ├────────────────────────────────────────┼─────────┼───────────┼────────────┼─────────┤
  │ Needs its own formal Test Plan?        │ No      │ Yes       │ Sometimes  │ No      │
  ├────────────────────────────────────────┼─────────┼───────────┼────────────┼─────────┤
  │ Fixes a reproducible defect?           │ No      │ No        │ No         │ Yes     │
  ├────────────────────────────────────────┼─────────┼───────────┼────────────┼─────────┤
  │ One coherent concern, localized?       │ Yes     │ No        │ Sometimes  │ Yes     │
  ├────────────────────────────────────────┼─────────┼───────────┼────────────┼─────────┤
  │ User just raised a NEW ask not in plan │ No      │ No        │ Yes        │ No      │
  └────────────────────────────────────────┴─────────┴───────────┴────────────┴─────────┘

  RULES:
    - If ANY column other than "Tweak" answers Yes to a non-tweak row,
      DO NOT classify as a tweak. Route to that column's module:
      - Revision → `docs/core/revision-planning.md`
      - Scope-change → `docs/core/scope-change.md`
      - Bug → `docs/core/bug-resolution.md`
    - When mixed signals appear, default to the heavier process. It is
      safer to over-scope (route to revision) than to under-scope
      (skip planning rigor).
    - A tweak NEVER replaces a missing feature, schema migration, or
      cross-phase refactor.
</TweakBoundaryRules>

---

<TweakRules>
  RULES:

  RULE 1 — STANDALONE-DOCUMENTED
    Every tweak lives at `docs/tweaks/tweak-<n>-<slug>.md`. Tweaks are
    never recorded inside a phase or revision document.

  RULE 2 — TRACKER-BACKED
    Every tweak has tracker tasks under the milestone value
    `Tweak <n> — <name>`. All state changes go through the tracker. No
    informal side-channel state.

  RULE 3 — REVIEW GATE BEFORE EXECUTION
    No task leaves TO-DO until `<TweakReviewGate>` is satisfied with
    explicit user confirmation. The agent re-loops on requested
    changes.

  RULE 4 — NO FORMAL TEST PLAN
    Tweak documents must not include a `## Test Plan` section. Needing
    one is an escalation signal: route the work to revision/milestone
    planning.

  RULE 5 — PROJECT SUITE GREEN BEFORE DONE
    The terminal tweak task cannot transition to DONE while `npm test`
    is failing for the project.

  RULE 6 — PROACTIVE CLASSIFICATION
    The agent classifies every change request per
    `<TweakIntentClassification>`, regardless of whether the user used
    the word "tweak".

  RULE 7 — NO NEW FEATURES
    Tweaks correct, clarify, adjust, or polish existing behavior or
    documentation. They do not introduce new capabilities. If the
    request adds a new capability, route to scope-change / revision.

  RULE 8 — SINGLE CONCERN
    One tweak = one coherent concern. Bundles of unrelated fixes split
    into multiple tweaks or escalate to a revision.
</TweakRules>

---

<TweakTemplate>
  PURPOSE: The literal template a tweak document uses. Copy this when
  drafting a new tweak; replace placeholders.

  Note: this template intentionally has **no `## Test Plan` section**.
  Needing one is an escalation signal to revision/milestone planning.

  ```markdown
  # Tweak <n> — <Name>

  One-line summary of intent.

  ---

  ## Goals

  - {{Goal 1 — what the tweak achieves}}
  - {{Goal 2 (optional)}}

  ---

  ## Dependencies

  | Dependency | Status |
  |------------|--------|
  | {{Other tweak or decision required}} | {{Complete | Pending}} |

  ---

  ## Tasks

  | Task ID | Task | Dependencies |
  |---------|------|--------------|
  | TW<n>.1 | {{Concrete task}} | None |
  | TW<n>.2 | {{Concrete task}} | TW<n>.1 |

  ---

  ## Acceptance Criteria

  - [ ] {{Observable, verifiable condition}}
  - [ ] {{Observable, verifiable condition}}

  ---

  ## Verification

  - {{How the change is verified — touched test, ad-hoc command, or
    targeted inline assertion. Not a formal Test Plan.}}

  ---

  ## Definition of Done

  - [ ] All acceptance criteria met.
  - [ ] All tracker tasks for `Tweak <n> — <name>` are DONE.
  - [ ] `npm test` is green for the project.
  - [ ] No lint errors in files touched by this tweak.

  ---

  ## Status

  Draft | In Progress | Complete

  - {{Any classification overrides recorded here.}}
  - {{Re-loop notes from <TweakReviewGate>, if any.}}
  ```
</TweakTemplate>

---

<TweakWorkedExample>
  PURPOSE: A complete worked example tweak document, end-to-end. Use it
  to see the lightweight structure applied to a real, small change.

  ### Scenario

  A reviewer notices that `docs/core/execution.md` does not warn agents
  against running commands outside their worktree directory mid-session
  (a recurring foot-gun across recent reviews). The fix is to append one
  new entry to the existing `<AntiPatterns>` block.

  This is a positive-example tweak: small, contained, single concern,
  no new feature, no formal test plan needed.

  ### Reserved identifiers

  - File: `docs/tweaks/tweak-1-execution-anti-pattern.md`
  - Tracker milestone: `Tweak 1 — Execution Anti-Pattern Addition`

  ### The worked example document

  Below is the complete worked example tweak document end-to-end,
  rendered exactly as the file at
  `docs/tweaks/tweak-1-execution-anti-pattern.md` would appear:

  ```markdown
  # Tweak 1 — Execution Anti-Pattern Addition

  Append a single new entry to the `<AntiPatterns>` block in
  `docs/core/execution.md` warning against running commands outside the
  active worktree.

  ---

  ## Goals

  - Make the worktree-isolation foot-gun explicit in `execution.md`'s
    `<AntiPatterns>` block.
  - Preserve existing anti-pattern entries byte-for-byte.

  ---

  ## Dependencies

  | Dependency | Status |
  |------------|--------|
  | `docs/core/execution.md` exists with current `<AntiPatterns>` block | Complete |

  ---

  ## Tasks

  | Task ID | Task | Dependencies |
  |---------|------|--------------|
  | TW1.1 | Add `<AntiPattern name="Editing Outside a Worktree">` entry to `<AntiPatterns>` in `docs/core/execution.md` with bad-example and why fields. | None |

  ---

  ## Acceptance Criteria

  - [ ] `<AntiPatterns>` in `docs/core/execution.md` contains a new
    `<AntiPattern>` named "Editing Outside a Worktree".
  - [ ] Existing anti-pattern entries are unchanged.
  - [ ] The bad-example and why fields name the worktree directory
    explicitly.

  ---

  ## Verification

  - Open `docs/core/execution.md`, scroll to `<AntiPatterns>`, confirm
    the new entry is present and existing entries are unchanged.
  - Run `npm test` — the project suite remains green; no test is
    expected to change.

  ---

  ## Definition of Done

  - [ ] Acceptance criteria met.
  - [ ] Tracker task `TW1.1` under milestone `Tweak 1 — Execution
    Anti-Pattern Addition` is DONE.
  - [ ] `npm test` is green for the project.
  - [ ] No lint errors in files touched by this tweak.

  ---

  ## Status

  Complete

  - Classified as tweak: small, contained, single concern, doc-only,
    no formal test plan needed. User confirmed before any task left
    TO-DO.
  - No re-loops; draft accepted on first review.
  ```

  ### Why this example qualifies

  - **Small.** One file, one block, one new sub-entry.
  - **Contained.** Localized to `docs/core/execution.md`'s anti-patterns
    section.
  - **Single concern.** One foot-gun documented.
  - **Non-feature.** Documentation clarification only.
  - **No formal Test Plan.** The project suite covers it; no targeted
    test required.
</TweakWorkedExample>

---

## See also

- `docs/core/revision-planning.md` — for multi-phase or cross-cutting
  changes.
- `docs/core/scope-change.md` — for additive new asks the user has just
  raised.
- `docs/core/bug-resolution.md` — for reproducible defects in
  implemented behavior.
- `docs/core/tracker.md` — for tracker API recipes used by tweak tasks.
