# Tweak Planning

This module defines the **change-first tweak workflow** — a lightweight, fast-paced
contract for small, contained corrections and adjustments. The agent makes the change
first, iterates with the user as the live review loop, and writes a minimal audit record
after the user approves. No tracker tasks, no planning artifacts, no ceremony.

---

<TweakDefinition>
  PURPOSE: Define exactly what a tweak is, what it is not, and how to
  recognize one. This is the contract every agent and reviewer reads
  before classifying or entering Tweak Mode.

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
      not a tweak — escalate.
    - **Standalone-documented (post-hoc).** After the change is accepted,
      a minimal audit record is written under `docs/tweaks/tweak-<n>-<slug>.md`.
      The document is written after the change, not before.

  A tweak is NOT:
    - **A new feature.** New capabilities, new commands, new endpoints,
      new user-visible surfaces → revision or milestone planning.
    - **A revision.** Multi-phase, cross-cutting, or contract-level
      change → revision planning.
    - **A bug.** A defect in implemented behavior with a reproduction
      path → bug-resolution.
    - **A scope addition.** An additive new ask the user has just raised
      that did not exist in the plan → scope-change.
    - **A way to skip planning rigor.** Tweaks are fast-paced but still
      require user review, code-change test validation, and a post-hoc
      audit record.

  ### Positive examples

  These are positive examples — each one qualifies as a tweak:

  - **UI copy fix.** A button label reads "Sumbit"; the tweak corrects
    it to "Submit", updates one screen test snapshot, and ships.
  - **Add a single anti-pattern to a core module.** A reviewer notices a
    recurring foot-gun missing from `docs/core/execution.md`'s
    anti-patterns block; the tweak appends one new entry.
  - **Lock a previously vague convention.** An agent entry point's
    `<ProjectConventions>` section says "Use strict TypeScript settings"
    but does not point to the existing type-check command; the tweak adds
    one clarifying bullet plus an example.
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

  1. The agent must classify the request proactively before acting.
     The user is NOT required to say the word "tweak". Even when the
     user says "just change X", "quickly fix Y", "tweak the wording",
     "add this small thing", "redo this", or simply describes a small
     change, the agent runs the classification.

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
     drafting or acting, in one of these forms:

     - "I'm classifying this as a tweak — small, contained, non-feature,
       no new test plan needed. I'll enter Tweak Mode and make the
       change. OK to proceed?"
     - "This looks like a revision, not a tweak — it touches multiple
       phases / adds a new feature / would need its own test plan.
       I'd route this to `docs/core/revision-planning.md`. Confirm?"
     - "This looks like a bug, not a tweak — there's a reproducible
       defect in implemented behavior. I'd route to
       `docs/core/bug-resolution.md`. Confirm?"

  4. The user may overrule the classification, but the agent must record
     the override in the post-hoc tweak document's Status section,
     naming what was overridden and why.

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

<TweakMode>
  PURPOSE: Define the anti-ceremony operating mode the agent enters
  after classifying a request as a tweak. Tweak Mode is fast-paced
  and direct. The user is the live review loop.

  WHILE TWEAK MODE IS ACTIVE, THE AGENT:

  - Does NOT create tracker/board tasks.
  - Does NOT load full planning modules (phase-planning, test-planning,
    revision-planning, milestone-planning).
  - Does NOT subdivide the work into gates, streams, or task tables.
  - Does NOT scaffold a formal test plan section.
  - Does NOT write a planning artifact in advance of the change.
  - Does NOT detour through ModuleRouting again to reroute the tweak
    through another flow.

  Edits are fast-paced and direct: read → restate → confirm → change →
  cycle. The agent treats the user as the live review loop.

  Tweak Mode ends when:
    (a) the user approves the completed change and the post-hoc tweak
        document is written, OR
    (b) the escalation rule triggers a hard stop.

  HARD RULES:
    - No tracker/board task creation during Tweak Mode — ever.
    - No planning-module loads (phase/test/revision/milestone) during
      Tweak Mode.
    - No gate or stream subdivision during Tweak Mode.
    - No formal test plan section drafted during Tweak Mode.
    - No pre-execution planning artifact written during Tweak Mode.
    - No re-routing through ModuleRouting while in Tweak Mode.
</TweakMode>

---

<TweakChangeFirstLoop>
  PURPOSE: Walk through the change-first loop end-to-end. This is the
  execution flow for every tweak once Tweak Mode is active.

  STEP 1 — UNDERSTAND
    Read the user request. Read only the files needed to act. Do not
    load unrelated modules. If the request is ambiguous, ask one focused
    clarifying question before proceeding.

  STEP 2 — RESTATE
    Briefly state the agent's understanding back to the user in one or
    two sentences. Name what will change and what will stay the same.
    Do not produce a long document.

  STEP 3 — CONFIRM
    Get explicit confirmation before changing behavior or files.
    Wait for a clear yes: "yes", "proceed", "looks fine", "go ahead".
    Silence or ambiguous responses do not count. Re-present the restate
    and wait again.

  STEP 4 — CHANGE
    Make the requested change. Touch only the files needed.
    Do not refactor unrelated code. Do not add new features.

  STEP 5 — CYCLE
    Present the result to the user. Show what changed (a diff summary
    or the updated content is sufficient). Iterate — the user may
    request adjustments. Return to STEP 4 for each adjustment.
    Repeat until the user signals the change is complete.

  STEP 6 — VERIFY (code changes only)
    When the change touches code (any file outside `docs/**`):
    - Run `npm test`. A green result is required before creating the
      tweak document.
    - Both `npm test` green AND explicit user approval are required
      before proceeding to STEP 7.
    - If `npm test` fails, loop with the user to fix the failures before
      proceeding. Do not create the tweak document while tests are red.

    Docs-only tweaks (changes limited to `docs/**` only) skip the test
    gate. The agent proceeds directly to user approval and STEP 7.

  STEP 7 — DOCUMENT (post-hoc)
    After the user confirms the completed change is accepted:
    - Create the post-hoc tweak document under `docs/tweaks/` using the
      audit-only shape defined in `<TweakPostHocDocShape>`.
    - Do not create the document before this step.
    - Do not create the document before tests are green (for code changes).
    - Do not create the document before explicit user approval.

  HARD RULES:
    - CONFIRM (STEP 3) is mandatory before CHANGE (STEP 4).
    - The post-hoc document is created AFTER the change, never before.
    - For code changes: `npm test` green AND user approval are both
      required before STEP 7. Neither alone is sufficient.
    - For docs-only changes: user approval alone gates STEP 7.
</TweakChangeFirstLoop>

---

<TweakPostHocDocShape>
  PURPOSE: Define the minimal audit-only shape of the post-hoc tweak
  document. This document is an audit record, not a plan.

  FILE NAMING (locked):
    `docs/tweaks/tweak-<n>-<slug>.md`

  NUMBERING:
    Monotonically increasing across the project. Assign the next free
    integer by scanning `docs/tweaks/` for the highest existing
    `tweak-<n>-*.md` and incrementing by one. Superseded tweaks retain
    their original number.

  REQUIRED SECTIONS (exactly these, in order, no more):

  1. **Status**
     Current state of the tweak: Complete | Superseded.
     Post-hoc tweak documents are written after the change; the default
     state is Complete. Include any classification-override notes here.

  2. **Summary of Change**
     1–3 sentences describing what changed and why.

  3. **Files Touched**
     Bullet list of file paths modified by this tweak.

  4. **User Acceptance Note**
     One line confirming the user approved the change. Reference the date.
     Example: "User approved on 2026-05-20."

  FORBIDDEN SECTIONS:
    - No Goals section.
    - No Dependencies section.
    - No Task tables.
    - No Acceptance Criteria section.
    - No Verification section.
    - No Definition of Done section.
    - No Test Plan section.

  The document is an audit record. It does not plan; it records.
</TweakPostHocDocShape>

---

<TweakEscalationRule>
  PURPOSE: Define the hard-stop condition that ends Tweak Mode when
  the scope has grown beyond a contained change.

  ESCALATION TRIGGERS — any one of these conditions ends Tweak Mode:

  - The work surfaces a new feature that the system did not previously offer.
  - The change becomes cross-cutting: it touches contracts, APIs, or
    behavior across multiple phases or modules.
  - The change requires multi-phase coordination to implement safely.
  - A formal Test Plan section is required to verify the work.
  - A regressive behavior change emerges that was not in the original request.
  - Multiple distinct concerns are found bundled in what appeared to be
    a single tweak.

  ESCALATION PROTOCOL:

  1. The agent performs a **hard stop** on Tweak Mode immediately.
     No further implementation steps. No partial tweak doc created.
     No tracker/board tasks created.

  2. The agent surfaces the escalation to the user with a one-line
     explanation of why the work no longer fits the tweak shape.
     Example: "This change now requires a new feature surface — I need
     to hard-stop Tweak Mode. It no longer fits a tweak."

  3. The user decides how to proceed:
     - Shrink the scope back into a contained tweak (return to STEP 1).
     - Route through `docs/core/revision-planning.md`.
     - Route through `docs/core/milestone-planning.md`.

  HARD RULES:
    - No automatic rerouting. The agent presents the situation and waits
      for the user to decide.
    - No partial tweak document is written when escalation triggers.
    - No board or tracker task is created during or after escalation.
    - The agent does NOT decide unilaterally which route to take.
    - User decides means the user decides.
</TweakEscalationRule>

---

<AntiPatterns>
  <AntiPattern name="Creating Tracker Tasks for a Tweak">
    <BadExample>The agent creates board tasks for a tweak. Tweaks do not generate board tasks; the user is the live review loop and the tracker is for gates and streams in planned phases.</BadExample>
    <Why>The user is the live review loop; the tracker is for gates and streams in planned phases.</Why>
  </AntiPattern>
  <AntiPattern name="Writing Tweak Doc Before Change">
    <BadExample>The agent writes a tweak document before the change is made. The post-hoc document is an audit record, not a plan; writing it before the change inverts the workflow and adds ceremony with no value.</BadExample>
    <Why>The post-hoc document is an audit record, not a plan; writing it before the change inverts the workflow and adds ceremony with no value.</Why>
  </AntiPattern>
  <AntiPattern name="Loading Planning Modules in Tweak Mode">
    <BadExample>The agent loads phase/test/revision/milestone planning modules during Tweak Mode. Loading planning modules triggers full-scale planning rigor that is incompatible with the fast-paced tweak contract.</BadExample>
    <Why>Loading planning modules triggers full-scale planning rigor that is incompatible with the fast-paced tweak contract.</Why>
  </AntiPattern>
  <AntiPattern name="Carving Tweak into Gates or Streams">
    <BadExample>The agent carves the tweak into gates, streams, or task tables. Tweaks are a single unit of work; subdividing them into gates and streams is overhead that belongs to revision planning, not tweaks.</BadExample>
    <Why>Tweaks are a single unit of work; subdividing them into gates and streams is overhead that belongs to revision planning, not tweaks.</Why>
  </AntiPattern>
  <AntiPattern name="Drafting Formal Test Plan for Tweak">
    <BadExample>The agent drafts a formal test plan for a tweak. The absence of a formal test plan is a defining property of a tweak; needing one is an escalation signal.</BadExample>
    <Why>The absence of a formal test plan is a defining property of a tweak; needing one is an escalation signal.</Why>
  </AntiPattern>
  <AntiPattern name="Skipping Change-First Confirm Step">
    <BadExample>The agent skips the change-first confirm step and edits immediately. CONFIRM before CHANGE is mandatory; making a change without explicit user confirmation skips the core safety check of the tweak flow.</BadExample>
    <Why>CONFIRM before CHANGE is mandatory; making a change without explicit user confirmation skips the core safety check of the tweak flow.</Why>
  </AntiPattern>
  <AntiPattern name="Skipping npm test Before Doc Creation">
    <BadExample>The agent skips npm test for a code-touching tweak before doc creation. The code-change test gate is mandatory for any tweak that touches files outside docs/**; creating the post-hoc document before npm test is green is forbidden.</BadExample>
    <Why>The code-change test gate is mandatory for any tweak that touches files outside docs/**; creating the post-hoc document before npm test is green is forbidden.</Why>
  </AntiPattern>
  <AntiPattern name="Continuing in Tweak Mode After Escalation">
    <BadExample>The agent continues in Tweak Mode after escalation criteria are met. When any escalation trigger is detected, the agent must hard-stop immediately; continuing to implement after escalation criteria are met corrupts scope and bypasses the revision planning guard.</BadExample>
    <Why>Continuing to implement after escalation criteria are met corrupts scope and bypasses the revision planning guard.</Why>
  </AntiPattern>
</AntiPatterns>

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

  RULE 1 — STANDALONE-DOCUMENTED (POST-HOC)
    Every tweak produces a post-hoc audit record at
    `docs/tweaks/tweak-<n>-<slug>.md`. Tweaks are never documented
    inside a phase or revision document. The audit record is written
    after the change is accepted, not before.

  RULE 2 — CHANGE-FIRST LOOP
    The agent follows the change-first loop: understand → restate →
    confirm → change → cycle → verify → post-hoc doc. No planning
    artifact is written before STEP 4 (change).

  RULE 3 — NO PRE-CHANGE DOCUMENT
    No tracker tasks, no tweak doc, no planning artifact is created
    before the change is confirmed as accepted by the user.

  RULE 4 — NO FORMAL TEST PLAN
    Tweak documents must not include a `## Test Plan` section. Needing
    one is an escalation signal: route the work to revision/milestone
    planning.

  RULE 5 — CODE-CHANGE TEST GATE
    For any tweak that touches code (files outside `docs/**`): both
    `npm test` green AND explicit user approval are required before
    the post-hoc document is written. Docs-only tweaks are exempt
    from `npm test` but still require user approval.

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

  RULE 9 — ESCALATION HARD STOP
    When any escalation trigger fires mid-cycle, the agent hard-stops
    Tweak Mode immediately, surfaces the reason to the user, and waits
    for the user to decide on routing. No automatic rerouting.
</TweakRules>

---

<TweakWorkedExample>
  PURPOSE: A complete worked example showing the change-first flow
  end-to-end, including the post-hoc audit record in audit-only shape.

  ### Scenario

  A developer notices that `AGENTS.md`'s `<ProjectConventions>` section
  says "Use strict TypeScript settings" but does not point to the existing
  type-check command. The fix is to add one clarifying bullet with an
  example.

  This is a positive-example tweak: small, contained, single concern,
  docs-only, no formal test plan needed.

  ### Step-by-step trace

  **STEP 1 — UNDERSTAND**
  Agent reads `AGENTS.md`. The TypeScript rule is in the
  `<ProjectConventions>` section. No command example is present. Single
  file, single section.

  **STEP 2 — RESTATE**
  > "I'll add one clarifying bullet to the `<ProjectConventions>` section
  > of `AGENTS.md` specifying that strict TypeScript checks run through
  > `npm run typecheck`. No other changes."

  **STEP 3 — CONFIRM**
  User: "Yes, go ahead."

  **STEP 4 — CHANGE**
  Agent appends the clarifying bullet to `AGENTS.md`.

  **STEP 5 — CYCLE**
  Agent shows the diff. User: "Looks good — accepted."

  **STEP 6 — VERIFY**
  This is a docs-only tweak (only `docs/**` touched). The test gate is
  skipped. User approval already given in STEP 5.

  **STEP 7 — DOCUMENT (post-hoc)**
  Agent creates `docs/tweaks/tweak-6-project-conventions-typecheck.md`:

  ---

  ### Sample post-hoc tweak document

  Below is the complete post-hoc audit record for this worked example,
  in the audit-only shape:

  ```markdown
  ## Status

  Complete

  ---

  ## Summary of Change

  Added a clarifying bullet to the `<ProjectConventions>` section of
  `AGENTS.md` specifying that strict TypeScript checks run through
  `npm run typecheck`. Change requested after the existing rule was found
  ambiguous in code review.

  ---

  ## Files Touched

  - `AGENTS.md`

  ---

  ## User Acceptance Note

  User approved on 2026-05-20.
  ```

  ### Why this example qualifies

  - **Small.** One file, one section, one new bullet.
  - **Contained.** Localized to `AGENTS.md`'s `<ProjectConventions>`
    section.
  - **Single concern.** One ambiguity resolved.
  - **Non-feature.** Documentation clarification only.
  - **Docs-only.** No code touched; test gate skipped per the exemption.
  - **Post-hoc doc.** The audit record is written after the user
    accepts the change, not before.
</TweakWorkedExample>

---

## See also

- `docs/core/revision-planning.md` — for multi-phase or cross-cutting
  changes.
- `docs/core/scope-change.md` — for additive new asks the user has just
  raised.
- `docs/core/bug-resolution.md` — for reproducible defects in
  implemented behavior.
- `docs/core/tracker.md` — for tracker API recipes used by phase
  execution tasks (not tweaks).
