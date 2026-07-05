---
name: align
description: Establish setup-only Alignment by assessing project context, writing approved agent setup blocks, marking alignment complete, and stopping; routes alignment intent when project-progress.md is empty
---
# Alignment

This module establishes setup-only Alignment for a new Blueprint
project. It runs when project-progress.md is empty, meaning Blueprint
has been scaffolded but planning has not started yet.

---

<AlignmentFlow>
  PURPOSE: Assess enough project context to establish agent setup,
  confirm the setup with the user, write the approved setup blocks,
  mark alignment complete, and stop.

  HARD BOUNDARY:
    Alignment is setup-only.
    It does NOT produce PRDs, SRS docs, milestone docs, phase docs,
    test plans, tracker tasks, board updates, or docs/project-progress.md.
    It does NOT continue into Foundation Planning from Alignment.

  STEP 1 -- ASSESS SETUP CONTEXT
    Run a light scan of the project to gather setup context:

    CHECK -- existing supported root entry-point files and prior
    agent guidance
    CHECK -- project conventions, tech stack, testing, file layout,
    coding standards, anti-patterns, release notes, and
    project-specific constraints if present
    CHECK -- codebase structure and file organization only as needed
    to ground the setup guidance in the real project

    The goal is only enough context to draft:
      - <ProjectConventions>
      - <AgentOrchestration>

    Do NOT expand this into product discovery, feature inventory,
    milestone reconstruction, phase reconstruction, SRS authoring,
    or any other downstream planning flow.

  STEP 2 -- CONFIRM SETUP WITH USER
    Present a concise setup summary:
      - project conventions, tech stack, and key libraries
      - testing approach, test infrastructure, or the lack of it
      - file layout and coding standards
      - anti-patterns, release notes, or deployment constraints if found
      - project-specific constraints if found
      - agent workflow expectations and orchestration guidance if found

    Ask focused questions in small chunks. Close one setup topic at a
    time, let each answer close gaps in the setup guidance, and get
    explicit confirmation before writing any approved setup blocks.

    Do NOT ask setup questions that try to draft PRDs, SRS docs, milestone docs, phase docs, test plans, tracker tasks, or board activity.

    For <AgentOrchestration>, interview and confirm these locked headings:
      ## Harness Capabilities
      ## Role Defaults
      ## Failure Escalation
      ## Skills and MCPs
      ## Notes

    Provide defaults for each section and confirm them with the user before writing.
    Use Role Defaults to cover execution, review, and phase-completion defaults.
    Planning does not require subagent model defaults.
    Record only the skills and MCPs the user explicitly names.
    Do NOT scan installed skills or MCPs during Alignment.

    Do NOT write approved setup blocks without explicit user approval.
    Do NOT treat the setup summary as final until the user confirms it
    is accurate.

  STEP 3 -- DRAFT SETUP BLOCKS
    Draft only the approved setup blocks:
      - <ProjectConventions>
      - <AgentOrchestration>

    Keep the draft grounded in the confirmed setup context.
    Treat these blocks as agent setup guidance, not as planning artifacts.

  STEP 4 -- WRITE APPROVED SETUP BLOCKS
    After explicit user approval, write the approved
    <ProjectConventions> and <AgentOrchestration> blocks into the
    supported root entry-point files that exist in the project.

    Scan these supported root entry-point files first:
      - CLAUDE.md
      - AGENTS.md
      - GEMINI.md
      - QWEN.md

    Respect absent supported files.
    Write every existing supported file.
    <ProjectConventions> must remain byte-identical across those files.
    <AgentOrchestration> may differ by harness or file.

    Do NOT write approved setup blocks without explicit user approval.
    Do NOT write partial drafts, placeholder planning docs, or
    downstream workflow artifacts during Alignment.

  STEP 5 -- COMPLETE ALIGNMENT AND STOP
    After the approved setup block edits are written, run `blueprint alignment-complete`.
    This flips the `<!-- blueprint-status: alignment-required -->`
    marker to `<!-- blueprint-status: alignment-complete -->` and
    reports already-complete, missing-marker, and absent-file cases.

    Then tell the user to start a fresh session or clear context before Foundation Planning.
    Alignment stops after this handoff.
    Legacy mode does not gain a Foundation Planning route.
    Do NOT create milestone docs, phase docs, test plans, tracker tasks, or board activity during Alignment.
    Do NOT continue into Foundation Planning from Alignment.
</AlignmentFlow>

---

## Anti-Patterns

<AntiPatterns>
  <AntiPattern name="Don't Rush">
    <BadExample>The agent writes `<ProjectConventions>` or `<AgentOrchestration>` to disk before the user explicitly approves the current setup draft.</BadExample>
    <BadExample>The agent gets partial feedback on setup guidance but still pushes ahead to write files or move into Foundation Planning before the current setup stage is approved.</BadExample>
    <BadExample>The agent turns setup alignment into product planning by drafting PRD, SRS, milestone, phase, test-plan, tracker-task, board, or project-progress artifacts.</BadExample>
    <Why>Alignment exists to establish agent setup only. Writing setup blocks before approval or leaking into planning artifacts creates unapproved project state and skips the clean handoff that Foundation Planning depends on.</Why>
  </AntiPattern>
</AntiPatterns>
