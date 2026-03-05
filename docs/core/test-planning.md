# Test Planning

This module defines how to create a test plan for a phase. It takes
a completed phase document as input and appends a Test Plan section
to that document. The test plan maps specific tests to tasks, making
test expectations explicit before execution begins.

Test planning runs AFTER phase planning and BEFORE execution.
A phase cannot begin execution without a completed Test Plan section.

---

<TestPlanningProcess>
  PURPOSE: Analyze every task in a phase and produce a test plan
  that defines what to verify, how, and what the expected result is.

  PRECONDITIONS:
  - The phase document exists and is complete (goals, gate, streams,
    tasks, acceptance criteria, and Definition of Done are all present)
  - docs/conventions.md is loaded (tech stack, testing framework,
    test file conventions)

  FLOW:

  STEP 1 — LOAD THE PHASE DOCUMENT
    Read the complete phase document. Identify all tasks in the gate
    and every stream.

  STEP 2 — ANALYZE EACH TASK
    For each task in dependency order (gate first, then streams):

    a. Read the task description and its acceptance criteria.
    b. Determine testability per <TestabilityGuidance>.
    c. IF testable:
       - Define one or more tests that verify the task's behavior.
       - Each test gets a test ID, a description of what it checks,
         and the expected result.
       - Choose the appropriate test type per <TestTypeGuidance>.
    d. IF not testable:
       - Record the task as not testable with a brief reason.

  STEP 3 — CONFIRM WITH USER
    Present the test plan to the user before writing it into the
    phase document. The user may want to:
      - Add tests the agent missed
      - Remove tests they consider unnecessary
      - Change test types or expected results
      - Override testability decisions

    Do not write the Test Plan section until the user confirms.

  STEP 4 — APPEND TO PHASE DOCUMENT
    Add the Test Plan section to the phase document, after the
    streams and before the Definition of Done.

    Update the Definition of Done to include:
      - "All tests in the Test Plan pass"
</TestPlanningProcess>

---

<TestPlanSection>
  The Test Plan section uses the following format when added to
  the phase document:

  ## Test Plan

  > Generated from task analysis. Each testable task has one or more
  > tests mapped to it. Tests are written before implementation (TDD)
  > during task execution.

  ### Gate {{N}}.0 Tests

  | Test ID | Task | Type | Description | Expected Result |
  |---------|------|------|-------------|-----------------|
  | T-{{N}}.0.1 | {{N}}.0.1 | {{unit}} | {{What the test checks}} | {{What passes}} |
  | T-{{N}}.0.2 | {{N}}.0.2 | {{integration}} | {{What the test checks}} | {{What passes}} |
  | — | {{N}}.0.3 | — | Not testable: {{reason}} | — |

  ### Stream A Tests

  | Test ID | Task | Type | Description | Expected Result |
  |---------|------|------|-------------|-----------------|
  | T-A.1 | A.1 | {{unit}} | {{What the test checks}} | {{What passes}} |
  | T-A.2.1 | A.2 | {{unit}} | {{What test 1 checks}} | {{What passes}} |
  | T-A.2.2 | A.2 | {{integration}} | {{What test 2 checks}} | {{What passes}} |

  ### Stream B Tests

  | Test ID | Task | Type | Description | Expected Result |
  |---------|------|------|-------------|-----------------|
  | T-B.1 | B.1 | {{unit}} | {{What the test checks}} | {{What passes}} |
  | — | B.2 | — | Not testable: {{reason}} | — |

  ### Test Summary

  | Component | Total Tasks | Testable | Not Testable |
  |-----------|-------------|----------|--------------|
  | Gate {{N}}.0 | {{count}} | {{count}} | {{count}} |
  | Stream A | {{count}} | {{count}} | {{count}} |
  | Stream B | {{count}} | {{count}} | {{count}} |
  | **Total** | {{count}} | {{count}} | {{count}} |
</TestPlanSection>

---

<TestIDConvention>
  Test IDs mirror task IDs with a T- prefix.

  FORMAT:
    Single test for a task:   T-<task ID>        →  T-4.0.1, T-A.3
    Multiple tests for a task: T-<task ID>.<seq>  →  T-A.2.1, T-A.2.2

  This makes it trivial to trace from a failing test back to the
  task it verifies and the stream it belongs to.
</TestIDConvention>

---

<TestTypeGuidance>
  Test types describe what level of the system the test exercises.
  The agent chooses the appropriate type based on what the task does.

  UNIT — Tests a single function, method, or component in isolation.
    Use for: data transformations, validation logic, utility functions,
    pure business rules, individual component rendering.

  INTEGRATION — Tests how multiple units work together.
    Use for: API endpoint that reads/writes to a database, a service
    that coordinates multiple modules, a component that depends on
    a data provider or store.

  END-TO-END — Tests a complete user flow from entry point to outcome.
    Use for: multi-step workflows, critical user journeys, flows that
    span multiple services or screens.

  The test type informs how the test is written during execution but
  does not change the test plan format. All types use the same table
  structure.

  Not every task needs the same type. A gate task that creates a
  database migration might need an integration test, while a stream
  task that adds a validation function might only need a unit test.
  Choose the type that most directly verifies the task's behavior.
</TestTypeGuidance>

---

<TestabilityGuidance>
  Most tasks are testable. The default assumption is that a task
  IS testable unless it falls into one of the categories below.

  TESTABLE — the task produces behavior that can be verified
  programmatically. This includes:
    - Any task that creates or modifies logic, data processing,
      or control flow
    - API endpoints (request/response verification)
    - Data model changes (schema validation, migration verification)
    - Business rules and validation
    - Component behavior (rendering, state changes, user interaction)
    - Configuration that affects runtime behavior

  NOT TESTABLE — the task produces output that cannot be verified
  programmatically with the project's current tooling. Common cases:
    - Visual design work (UI layout, styling, animations) unless
      the project has visual regression testing set up
    - Documentation or copy changes
    - Asset creation (icons, images, fonts)
    - Environment or deployment configuration that requires
      infrastructure access to verify
    - Tasks whose sole output is a design artifact (Figma, sketch)

  PARTIALLY TESTABLE — the task has both testable and non-testable
  aspects. In this case, create tests for the testable parts and
  note what is not covered.
    Example: A task that builds a form with validation. The
    validation logic is testable. The visual layout is not (unless
    visual regression tools are available). Create tests for the
    validation; note the layout as not testable.

  When in doubt, default to testable. It is better to plan a test
  and discover during execution that it is impractical than to
  skip planning and have no test at all.
</TestabilityGuidance>

---

<TestPlanningRules>
  RULES:
  - Test planning runs AFTER phase planning is complete, BEFORE
    execution begins.
  - The Test Plan section is added to the phase document, not to
    a separate file.
  - Every task must appear in the test plan — either with tests
    mapped to it or explicitly marked as not testable with a reason.
  - Test IDs follow the T-<task ID> convention. Do not invent
    alternative naming schemes.
  - The user must confirm the test plan before it is written to
    the phase document.
  - If conventions.md does not specify a testing framework, flag
    this to the user before proceeding. A testing framework must
    be chosen and recorded in conventions.md before test planning
    can produce meaningful results.
  - During execution, tests are written BEFORE implementation (TDD)
    for all tasks marked as testable. The test plan provides the
    specification; the agent writes the test code from it.
</TestPlanningRules>
