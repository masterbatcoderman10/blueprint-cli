# SRS Planning

This module defines how to create, structure, and update a Software
Requirements Specification (SRS). The SRS is the persistent source of
truth that sits between the high-level PRD and the detailed milestone
and phase plans.

Unlike a traditional front-loaded specification, the Blueprint SRS is
progressive. It starts sparse, carries feature intent forward after
alignment, and grows as the project gains clarity.

---

<SRSPrinciples>
  The SRS answers THREE questions:
    1. What does each requirement mean?
    2. How important is it relative to the rest of the product?
    3. What is the current recorded understanding of the product's
       shared data shape?

  The SRS is:
    - Persistent - it replaces the knowledge base as the long-lived
      reference after alignment
    - Progressive - it begins with top-level requirement entries and
      gains detail over time
    - Traceable - each requirement has a stable identity and change
      history
    - Atomic - each requirement captures one meaningful capability
      or obligation
    - Intermediate - more detailed than the PRD, less detailed than
      a phase plan

  The SRS does NOT contain:
    - Gate/stream/task breakdowns
    - Execution sequencing
    - Kanban task state
    - Review notes
    - Implementation checklists
    - Code-level instructions

  Under-specified entries are valid. A requirement may begin as only
  a title and short summary. Missing detail is not a defect - it is
  a signal that later planning should ask clarifying questions.

  A single SRS requirement may map to:
    - A portion of one milestone
    - An entire milestone
    - Multiple phases within one milestone

  ATOMICITY RULE:
    A requirement should describe one meaningful capability.

    Good:
      - The system must allow users to save recipes manually.
      - The system must allow users to browse saved recipes.
      - The system must allow users to organize recipes into collections.

    Too dense:
      - The system must allow users to save, organize, and browse recipes.

    IF a requirement sentence contains multiple independent capabilities,
    split it into separate requirement IDs.

  The SRS stays focused on requirement meaning, requirement identity,
  and shared product traceability.
</SRSPrinciples>

---

<RequirementIdentity>
  PURPOSE: Give every requirement a stable identity and an audit trail.

  REQUIREMENT ID FORMAT:
    SRS-001
    SRS-002
    SRS-003

  RULES:
    - IDs are assigned sequentially within the document
    - IDs are stable once created
    - IDs are never reused
    - IDs are never renumbered to "clean up" the document

  ID DECISION RULE:
    SAME MEANING -> SAME ID
      Use the existing ID when:
        - Adding detail to an under-specified requirement
        - Reassigning the requirement to a different milestone
        - Refining wording without changing meaning
        - Linking the requirement to shared data-schema notes

    DIFFERENT MEANING -> NEW ID
      Create a new ID when:
        - The intended behavior changes materially
        - The user outcome changes
        - The requirement is being replaced rather than elaborated
        - A revision introduces a new approved target behavior

  REQUIRED METADATA FIELDS:
    Every requirement must have metadata recording:
      - Requirement ID
      - Title
      - Priority: Must | Should | Could | Won't
      - Status: active | approved-pending-implementation |
                superseded | retired
      - Assigned milestone: milestone name or TBD
      - Source: where this requirement came from
      - Introduced by: alignment, scope change, milestone planning,
        phase planning, or revision
      - Supersedes: optional prior requirement ID
      - Superseded by: optional later requirement ID
      - Change log: dated audit entries

  STATUS VOCABULARY:
    active
      The requirement is current product truth.

    approved-pending-implementation
      The requirement reflects an approved target state, but the
      implementation is not complete yet.

    superseded
      The requirement has been replaced by a newer requirement ID.
      Superseded entries remain in the document for audit trace.

    retired
      The requirement was intentionally removed without a replacement.
      The change log must explain why.

  AUDIT TRACE RULES:
    - No substantive requirement change is silent
    - Every material update gets a change-log entry
    - Reassignment across milestones is recorded in the change log
    - Supersession must be linked in both directions
    - The prior requirement remains visible; it is not deleted
</RequirementIdentity>

---

<SRSStructure>
  The SRS uses MoSCoW prioritization at the top level:
    - Must Have
    - Should Have
    - Could Have
    - Won't Have (this cycle)

  DOCUMENT SHAPE:

  # {{Project Name}} - Software Requirements Specification

  ## Purpose

  {{One paragraph describing why this SRS exists and how it should be used}}

  ## Requirement Index

  | ID | Title | Priority | Status | Assigned Milestone |
  |----|-------|----------|--------|--------------------|
  | SRS-001 | {{Title}} | Must | active | M1 - {{Name}} |

  ## Requirements

  ### Must Have

  #### SRS-001 - {{Requirement Title}}

  {{Human-readable requirement text. This section should stay clean and
  readable. It explains what the requirement means, not its metadata.}}

  ### Should Have
  ### Could Have
  ### Won't Have

  ## Requirement Metadata

  ### SRS-001

  - Title: {{Requirement title}}
  - Priority: Must
  - Status: active
  - Assigned milestone: {{Milestone name or TBD}}
  - Source: {{Knowledge base doc, user input, PRD feature, etc.}}
  - Introduced by: {{Alignment | Scope Change | Milestone Planning |
                     Phase Planning | Revision}}
  - Supersedes: None
  - Superseded by: None

  Change log:
  - YYYY-MM-DD - Created from {{source}}
  - YYYY-MM-DD - Reassigned from {{old milestone}} to {{new milestone}}
  - YYYY-MM-DD - Superseded by {{new requirement ID}}

  ## Data Schema

  > The shared data schema lives here and grows over time. It is not
  > repeated inside each requirement entry.

  ### {{Entity or Domain Area}}

  - Related requirements: {{SRS IDs or TBD}}
  - Notes: {{High-level meaning or TBD}}
  - Fields:
    - {{Field name}}: {{Meaning or TBD}}

  STRUCTURE RULES:
    - Every requirement appears under exactly one MoSCoW section
    - Requirement IDs remain unique across the full document, not
      per section
    - The readable Requirements section appears before Requirement
      Metadata so humans encounter the requirement text first
    - Requirement metadata lives in Requirement Metadata, not inside
      the readable requirement sections
    - Requirement Index must reflect the latest title, priority,
      status, and milestone assignment
    - The Data Schema section is shared across requirements and grows
      over time as more of the product becomes clear
    - Data-schema entries may reference requirement IDs for traceability
    - Each requirement should be atomic; if one line hides multiple
      independent capabilities, split it into separate requirement IDs

  DETAIL PROGRESSION:
    - The initial SRS may contain only short requirement text and
      minimal metadata
    - Later updates may deepen requirement text, metadata, and the
      shared Data Schema section without changing the document shape

  The SRS grows deeper over time, but it must still read as a
  requirement document, not an implementation backlog.
</SRSStructure>

---

<SRSProcess>
  PURPOSE: Define when the SRS is created and how it is updated.

  PRECONDITIONS:
    - Source material exists: user input, a knowledge base, a PRD,
      or a confirmed change request

  INITIAL CREATION:
    The first SRS draft is produced once the product problem and
    initial feature set are understood.

    CREATION RULES:
      - Distill requirements from source material; do not invent them
      - Start sparse when detail is not available
      - Use one requirement per meaningful capability
      - Split dense multi-capability statements into multiple
        requirement IDs
      - Assign the next available SRS ID to each new requirement
      - Record metadata for each requirement immediately
      - Write readable requirement text separately from metadata
      - Add shared Data Schema notes only when the source material
        explicitly supports them

  This module defines SRS representation and SRS update rules.
  It does not define how milestone planning, phase planning, bug
  handling, or tweak handling work. Those workflows belong to their
  own modules.
</SRSProcess>

---

<SRSModificationRules>
  PURPOSE: Define how an existing SRS changes after it has been created.

  ELABORATING AN EXISTING REQUIREMENT:
    IF new information deepens an existing requirement without changing
    its meaning:
      - Keep the same requirement ID
      - Update the readable requirement text
      - Update metadata if milestone assignment or status changed
      - Add a change-log entry

  ADDITIVE REQUIREMENT INSERTION:
    When docs/core/scope-change.md classifies a request as additive,
    this module defines how the SRS should be updated.

    STEP 1 - DETERMINE WHETHER THIS IS NEW OR EXISTING
      Ask:
        - Is this a new capability?
        - Or is it more detail for an existing requirement?

      IF it is more detail for an existing requirement:
        -> Update the existing requirement in place
        -> Keep the same ID
        -> Add a change-log entry

      IF it is a new capability:
        -> Create a new requirement ID
        -> Add metadata for the new requirement
        -> Add a readable requirement entry in the correct MoSCoW
           section

    STEP 2 - REEVALUATE MILESTONE ASSIGNMENT
      After the requirement exists in the SRS, determine where it belongs:
        - Does it fit an existing milestone's scope?
        - Or does it require a new milestone?

      IF it fits an existing milestone:
        -> Assign that milestone in requirement metadata
        -> Ensure the PRD reflects the requirement under that milestone

      IF it does not fit any existing milestone:
        -> Load docs/core/prd-planning.md
        -> Create or confirm a new milestone
        -> Update the requirement metadata with the final assignment

      REASSIGNMENT RULE:
        Reassigning a requirement to a different milestone does not
        create a new requirement ID. The same meaning remains the same
        requirement. Record the reassignment in the change log.

  REVISION HANDOFF:
    When the user wants an existing requirement to mean something
    different, do not silently rewrite the current requirement.

    STEP 1 - LOAD docs/core/revision-planning.md
      Revision planning owns impact analysis for behavior changes.

    STEP 2 - IDENTIFY IMPACTED REQUIREMENT IDS
      The revision analysis should name which SRS requirement IDs are
      affected.

    STEP 3 - APPLY THE REQUIREMENT ID RULE
      IF the revision confirms the requirement means something
      materially different:
        -> Create a new requirement ID for the approved target state
        -> Add metadata for the new requirement
        -> Mark the new requirement as approved-pending-implementation
        -> Link old and new requirement IDs in both directions
        -> Preserve the prior requirement for audit trace

      IF the revision only clarifies an under-specified requirement
      without changing meaning:
        -> Keep the same requirement ID
        -> Update in place after approval
</SRSModificationRules>

---

<SRSRules>
  RULES:
    - The SRS is progressive. Sparse entries are acceptable.
    - Requirement IDs are stable forever.
    - Same meaning means same ID.
    - Different meaning means new ID.
    - No substantive requirement change is silent.
    - Reassignment does not create a new ID.
    - Superseded requirements remain visible for audit trace.
    - Requirements should be atomic. One requirement should not hide
      multiple independent capabilities behind a single sentence.
    - Requirement metadata lives separately from readable requirement
      text.
    - The shared Data Schema lives in its own section and grows over time.
    - If the agent is unsure whether a change is elaboration or a
      new requirement, ask the user before editing the SRS.
    - If the agent is unsure whether a change is additive or
      modifying, route through docs/core/scope-change.md or
      docs/core/revision-planning.md before editing the SRS.
</SRSRules>

---

<SRSExample>
  The following is an example of a minimal SRS.

  # MealBoard - Software Requirements Specification

  ## Purpose

  This SRS captures the current shared understanding of MealBoard's
  product requirements between the PRD and later planning documents.

  ## Requirement Index

  | ID | Title | Priority | Status | Assigned Milestone |
  |----|-------|----------|--------|--------------------|
  | SRS-001 | Manual recipe saving | Must | active | M1 - Recipe Collection |
  | SRS-002 | URL recipe import | Must | active | M1 - Recipe Collection |
  | SRS-003 | Recipe browsing | Must | active | M1 - Recipe Collection |
  | SRS-004 | Recipe search | Should | active | M1 - Recipe Collection |
  | SRS-005 | Recipe collections | Should | active | M1 - Recipe Collection |
  | SRS-006 | Weekly meal planning | Should | active | M2 - Meal Planning & Shopping |

  ## Requirements

  ### Must Have

  #### SRS-001 - Manual recipe saving

  The system must allow users to save recipes manually.

  - The system must capture a recipe title.
  - The system must capture an ingredient list.
  - The system must capture ordered preparation steps.

  #### SRS-002 - URL recipe import

  The system must allow users to create a recipe by importing from a URL.

  #### SRS-003 - Recipe browsing

  The system must allow users to browse saved recipes from their library.

  ### Should Have

  #### SRS-004 - Recipe search

  The system should allow users to search saved recipes.

  #### SRS-005 - Recipe collections

  The system should allow users to organize saved recipes into collections.

  #### SRS-006 - Weekly meal planning

  The system should allow users to place recipes onto a weekly meal plan.

  ### Could Have

  _None yet._

  ### Won't Have

  _None yet._

  ## Data Schema

  ### Recipe

  - Related requirements: SRS-001, SRS-002, SRS-003, SRS-004, SRS-005
  - Notes: Core saved cooking entry owned by the user
  - Fields:
    - title: Human-readable recipe name
    - ingredients: Ingredient list for planning and cooking
    - steps: Ordered preparation instructions

  ### Meal Plan Entry

  - Related requirements: SRS-006
  - Notes: A scheduled recipe placed onto a calendar period
  - Fields:
    - recipeId: Linked recipe reference
    - date: Planned cooking date

  ## Requirement Metadata

  ### SRS-001

  - Title: Manual recipe saving
  - Priority: Must
  - Status: active
  - Assigned milestone: M1 - Recipe Collection
  - Source: Knowledge base summary
  - Introduced by: Alignment
  - Supersedes: None
  - Superseded by: None

  Change log:
  - 2026-03-26 - Created from knowledge-base recipe creation notes

  ### SRS-002

  - Title: URL recipe import
  - Priority: Must
  - Status: active
  - Assigned milestone: M1 - Recipe Collection
  - Source: Product planning conversation
  - Introduced by: Alignment
  - Supersedes: None
  - Superseded by: None

  Change log:
  - 2026-03-26 - Created from product planning conversation

  ### SRS-003

  - Title: Recipe browsing
  - Priority: Must
  - Status: active
  - Assigned milestone: M1 - Recipe Collection
  - Source: Knowledge base summary
  - Introduced by: Alignment
  - Supersedes: None
  - Superseded by: None

  Change log:
  - 2026-03-26 - Created from knowledge-base browsing notes

  ### SRS-004

  - Title: Recipe search
  - Priority: Should
  - Status: active
  - Assigned milestone: M1 - Recipe Collection
  - Source: Product planning conversation
  - Introduced by: Alignment
  - Supersedes: None
  - Superseded by: None

  Change log:
  - 2026-03-26 - Created from product planning conversation

  ### SRS-005

  - Title: Recipe collections
  - Priority: Should
  - Status: active
  - Assigned milestone: M1 - Recipe Collection
  - Source: Product planning conversation
  - Introduced by: Alignment
  - Supersedes: None
  - Superseded by: None

  Change log:
  - 2026-03-26 - Created from product planning conversation

  ### SRS-006

  - Title: Weekly meal planning
  - Priority: Should
  - Status: active
  - Assigned milestone: M2 - Meal Planning & Shopping
  - Source: Product planning conversation
  - Introduced by: Alignment
  - Supersedes: None
  - Superseded by: None

  Change log:
  - 2026-03-26 - Created from product planning conversation
</SRSExample>
