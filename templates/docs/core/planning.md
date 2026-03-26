# Planning

This module defines how planning works in Blueprint. It is loaded before
any planning activity — PRD, SRS, milestone, or phase — and stays in context
throughout the planning session.

---

<PlanningPhilosophy>
  Planning in Blueprint is progressive. Each level adds detail, but never
  more than that level requires. Rushing to detail too early produces
  brittle plans that break on contact with implementation.

  The granularity progression:

  PRD
    → WHAT to build. Features, user outcomes, product scope.
    → No technical detail. No implementation. No task breakdown.
    → Written in the language of the product, not the codebase.

  SRS
    → WHAT the product requirements mean and how they are grouped.
    → More detailed than the PRD, less detailed than milestone planning.
    → SRS between PRD and milestone planning.
    → Still a requirement document, not a task list.

  Milestone
    → HOW to group it. Feature areas organized into tracks.
    → Semi-technical — names capabilities, not implementations.
    → Example: "Auth & Roles" not "Set up Prisma schema for users table"
    → Phases are listed by name and scope, not broken into tasks.

  Phase
    → HOW to execute it. Detailed planning with gate, streams, and tasks.
    → Technical — references specific models, endpoints, components.
    → Every task has an ID, duration, dependencies, and acceptance criteria.

  Task
    → WHAT files to touch. Exact implementation scope.
    → One task = one deliverable unit of work.

  RULE: Never plan at a lower level's granularity.
    A milestone that contains task-level detail is wrong.
    A PRD that specifies database schemas is wrong.
    Each level trusts the next level down to handle its own detail.
</PlanningPhilosophy>

---

<PlanningProcess>
  PURPOSE: Ensure plans are accurate, complete, and validated before creation.

  STEP 1 — ASK BEFORE DRAFTING
    NEVER produce a planning document without first asking clarifying questions.
    This applies to PRDs, SRS documents, milestones, and phases equally.

    Ask until you understand:
      - Scope — what is in, what is explicitly out
      - Dependencies — what must exist before this work starts
      - Open decisions — are there choices the user needs to make

    QUESTION STYLE:
      Ask in small, digestible chunks — 2-3 questions at a time,
      not a wall of 10 questions in one message. Each exchange
      should be readable and conversational.

      Do NOT front-load every possible question into one message.
      Ask the most important questions first. Let the user's
      answers guide the next round of questions. This is a
      conversation, not a questionnaire.

    IF the user's answers raise new questions → ask those too.
    IF the user's answers are complete and cover the scope → stop asking.
    There is no fixed number of questions. The goal is full understanding
    at the appropriate level of detail for that planning tier.

  STEP 2 — CONFIRM BEFORE WRITING
    After gathering answers, summarize your understanding back to the user.
    Do not begin drafting until the user confirms the summary is correct.

  STEP 3 — DRAFT
    Load the appropriate planning module:
      - PRD → docs/core/prd-planning.md
      - SRS → docs/core/srs-planning.md
      - Milestone → docs/core/milestone-planning.md
      - Phase → docs/core/phase-planning.md
    Follow that module's structure and conventions.

  STEP 4 — REVIEW WITH USER
    Present the draft. Ask if anything needs adjustment.
    Do not treat the first draft as final.

  STEP 5 — COMMIT
    After the user confirms the document is final, commit it.
    Planning documents must be committed before the next
    workflow step begins. This preserves the planning state
    and ensures the document is in version control before
    execution or further planning builds on it.

  RULE — ONE DOCUMENT PER CYCLE
    Each planning document goes through its own full cycle:
    ask → confirm understanding → draft → review → commit.

    Never batch-generate multiple planning documents. Even when
    several documents are needed in sequence (e.g., during
    alignment), complete and confirm each one before starting
    the next. Each document may surface new questions, missing
    scope, or corrections that change what comes after it.
</PlanningProcess>

---

<ScopeEscalation>
  During any planning activity, new features or capabilities may surface.

  IF a feature is identified that:
    - Does not belong to any existing milestone
    - Represents a new product capability, not a refinement of existing scope
    - Cannot be reasonably absorbed into any planned or active milestone

  THEN:
    - Flag it to the user: "This looks like a new product capability
      that isn't covered by any existing milestone."
    - Confirm with the user whether it should be added to the PRD.
    - IF confirmed → Load docs/core/prd-planning.md to update the PRD.
    - IF not confirmed → Note it and continue with current planning.

  Normal refinements — additional phases, adjusted scope within a milestone,
  new edge cases — are NOT escalations. They stay at the level where they
  were discovered.
</ScopeEscalation>

---

<ModuleDispatch>
  Planning always begins here, then dispatches to the appropriate module.

  ┌─────────────────────┬──────────────────────────────────────┐
  │ Planning for        │ Load                                 │
  ├─────────────────────┼──────────────────────────────────────┤
  │ PRD                 │ docs/core/prd-planning.md            │
  ├─────────────────────┼──────────────────────────────────────┤
  │ SRS                 │ docs/core/srs-planning.md            │
  ├─────────────────────┼──────────────────────────────────────┤
  │ Milestone           │ docs/core/milestone-planning.md      │
  ├─────────────────────┼──────────────────────────────────────┤
  │ Phase               │ docs/core/phase-planning.md          │
  └─────────────────────┴──────────────────────────────────────┘

  The dispatched module handles structure, templates, and conventions
  for that level. This module (planning.md) handles process and philosophy.
</ModuleDispatch>
