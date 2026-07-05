# Alignment

This module establishes setup-only Alignment for a Blueprint project
that still requires agent setup. It runs when project-progress.md is
empty, and it also handles narrow setup repair when a populated project
is forced back through Alignment.

---

<AlignmentFlow>
  PURPOSE: Assess enough project context to establish agent setup,
  confirm the setup with the user, write the approved setup blocks,
  mark alignment complete, and stop.

  HARD BOUNDARY:
    Alignment is setup-only.
    It does NOT produce PRDs, SRS docs, milestone docs, phase docs,
    test plans, tracker tasks, board mutations, or docs/project-progress.md.
    It does NOT continue into Foundation Planning from Alignment.

  STEP 1 -- ASSESS SETUP CONTEXT
    Choose the narrowest setup path that matches the project state:

    EMPTY OR NEW SETUP
    Run a light scan of the project to gather setup context:

    CHECK -- existing supported root entry-point files and prior
    agent guidance
    CHECK -- project conventions, tech stack, testing, file layout,
    coding standards, anti-patterns, release notes, and
    project-specific constraints if present
    CHECK -- codebase structure and file organization only as needed
    to ground the setup guidance in the real project

    MIGRATED-STATE FAST-TRACK
    This branch applies only to populated progress plus `alignment-required` plus `blueprint-origin: legacy-migration`.
    Treat it as a fast-track supported root entry-point setup repair.
    Use this as the post-migration fast-track repair path.
    Skip product discovery, codebase discovery, and git discovery.
    Focus only on supported root entry-point setup repair for:
      - existing supported root entry-point files and prior setup guidance
      - <ProjectConventions>
      - <AgentOrchestration>
      - migration-created setup gaps that must be repaired

    INCOMPLETE-ALIGNMENT REPAIR
    This branch applies to populated progress plus `alignment-required` without `blueprint-origin: legacy-migration`.
    Treat this as an inconsistent state.
    Block normal workflows.
    Alignment must be rerun or repaired before normal routing resumes.
    This is a stop-state, not a normal routing case.
    Keep the repair narrow and limited to supported root entry-point
    setup state.

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

    Do NOT ask setup questions that try to draft PRDs, SRS docs, milestone docs, phase docs, test plans, tracker tasks, or board mutations.

    For migrated-state fast-track repair:
      - Read old/root guidance where available.
      - Present what can be preserved in the repaired setup blocks.
      - Ask for approval before preserving, correcting, or dropping any migrated guidance.
      - Alignment owns preservation and correction of old guidance.
      - Keep the conversation limited to confirmed setup repair.

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
    Do NOT let `migrate` perform smart merge work.
    Any stricter `migrate` command behavior stays deferred to Phase 4.

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
    After explicit user approval, write only the approved
    <ProjectConventions> and <AgentOrchestration> blocks into the
    supported root entry-point files that exist in the project.

    For migrated-state fast-track repair, write only the confirmed
    <ProjectConventions> and <AgentOrchestration> blocks.

    Scan these supported root entry-point files first:
      - CLAUDE.md
      - AGENTS.md
      - GEMINI.md
      - QWEN.md

    Respect absent supported files.
    Write every existing supported file.
    <ProjectConventions> must remain byte-identical across those files.
    <AgentOrchestration> must be present in every written supported file, but its contents are not required to be byte-identical and may differ by harness or file.

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
    Do NOT create milestone docs, phase docs, test plans, tracker tasks, or board mutations during Alignment.
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
