# Revision 12 Working Notes - Alignment Split and Foundation Planning Q&A

Status: working notes only, not the formal revision document.
Captured: 2026-07-05.

These notes record the Q1+ grilling decisions from the revision-planning
discussion. They are intended as source material for the formal Blueprint
impact analysis and revision document.

## Q&A Decision Log

### Q1 - New Module Boundary

Question: Should document production become a first-class Blueprint module or
remain a named stage inside `alignment.md`?

Answer: It should become a new module for a different section. Alignment ends
by telling the user to start a new session / clear context and run the new
module.

Locked decision:
- Create a separate Foundation Planning module, not an alignment subsection.
- Alignment points to it after setup is complete.
- The handoff explicitly tells the user to start fresh / clear context.

### Q2 - Handoff Artifact

Question: Should alignment leave a durable handoff document such as
`docs/alignment-brief.md`?

Answer: No. Keep the flow like current Step 5 begins. Alignment writes
conventions and setup into the entry-point files; no extra handoff document.

Locked decision:
- No alignment brief.
- Foundation Planning begins from existing project files and the approved
  entry-point blocks.

### Q3 - Technical Setup Block Location

Question: Should technical setup live inside `<ProjectConventions>` or in a
separate block?

Answer: Definitely a different bracket.

Locked decision:
- Add a separate `<AgentOrchestration>` block.
- Keep `<ProjectConventions>` for project/coding conventions.

### Q4 - Model Defaults

Question: Should Blueprint provide default model/effort recommendations or only
record user choices?

Answer: Query the user with defaults and require confirmation.

Locked decision:
- Alignment proposes defaults for execution, review, phase completion, effort,
  fallback, and promotion rules.
- Alignment writes only after explicit confirmation.

### Q5 - Harness Without Model Selection

Question: If the harness does not support model/effort selection, should
`<AgentOrchestration>` still be created?

Answer: Yes, maybe for drop-in skills or MCPs.

Locked decision:
- Still create `<AgentOrchestration>`.
- Record capabilities as available/unavailable/unknown.
- If direct selection is unavailable, use harness defaults and record relevant
  skills/MCPs.

### Q6 - Fallback Rules

Question: Should fallback rules be role-based or failure-based?

Answer: All of them. Role-based defaults, and failure-based upgrades when the
same stream fails repeatedly.

Locked decision:
- Role defaults: execution, review, phase completion.
- Failure escalation: repeated failure promotes model/effort and may promote
  executor/reviewer path.

### Q7 - Completion Meaning

Question: What does "completion" mean in the model profile?

Answer: Phase completion only for now.

Locked decision:
- Completion row means phase completion gate only.
- It does not mean arbitrary task closeout, revision completion, or milestone
  completion.

### Q8 - Subagent Policy

Question: Should technical setup define when to spawn subagents?

Answer: No. Orchestration already handles spawning.

Locked decision:
- `<AgentOrchestration>` does not define dispatch policy.
- `orchestrate.md` remains responsible for when/how to spawn subagents.

### Q9 - Conventions Gathering

Question: Should conventions gathering move entirely into alignment technical
setup?

Answer: Yes.

Locked decision:
- Alignment gathers, confirms, and writes `<ProjectConventions>`.
- Foundation Planning treats conventions as preconditions/context and does not
  ask again unless missing or incomplete.

### Q10 - Marker Completion Timing

Question: Should `alignment-complete` run after Foundation Planning or after
alignment setup?

Answer: It works just for alignment stuff. The requirement that it waits for
document production will be removed.

Locked decision:
- `alignment-complete` runs at the end of alignment.
- The marker means alignment setup complete, not initial documents complete.

### Q11 - Empty Progress After Alignment

Question: If `project-progress.md` is empty after alignment, how should a fresh
session start Foundation Planning without the setup gate blocking?

Answer: Treat `alignment-complete` plus empty progress as a special bootstrap
state.

Locked decision:
- Empty progress + `alignment-complete` routes only to Foundation Planning.

### Q12 - Foundation Planning Availability

Question: Should Foundation Planning be callable later for repairs/regeneration?

Answer: Bootstrap-only.

Locked decision:
- Foundation Planning is allowed only when progress is empty and alignment is
  complete.
- Populated progress uses normal planning/revision/SRS workflows.

### Q13 - Command Validation of Setup Blocks

Question: Should `alignment-complete` enforce required setup blocks before
flipping markers?

Answer: Yes.

Locked decision:
- Validate `<ProjectConventions>` and `<AgentOrchestration>` before completing
  alignment.

### Q14 - Which Entry Points Are Written

Question: Should alignment write setup blocks to all existing supported root
entry points or only the current agent's file?

Answer: All existing supported root entry points.

Locked decision:
- Existing `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, and `QWEN.md` receive the
  relevant blocks.
- Missing files are respected as user choice.

### Q15 - Byte Identity

Question: Should the blocks be byte-identical across supported entry points?

Answer: Yes, initially.

Locked decision later refined by Q33/Q34:
- `<ProjectConventions>` must be byte-identical across existing supported entry
  points.
- `<AgentOrchestration>` may differ by file/harness.

### Q16 - Placeholder Source

Question: Where should canonical blank/default blocks live for new scaffolds?

Answer: Focus on the new skill-based workflow.

Locked decision:
- Skill-mode templates get placeholders.
- Legacy is not the focus.

### Q17 - Placeholder Timing

Question: Should `blueprint init` scaffold placeholders or leave blocks absent
until alignment writes them?

Answer: Fine to scaffold placeholders.

Locked decision:
- Skill-mode root entry points start with placeholder blocks.

### Q18 - Placeholder Rejection

Question: Should `alignment-complete` reject placeholders?

Answer: Of course.

Locked decision:
- `alignment-complete` rejects `Alignment pending.` placeholder content.

### Q19 - Foundation Planning Before Alignment

Question: Should Foundation Planning run `alignment-complete` if it sees
`alignment-required`?

Answer: Tell the user to do alignment.

Locked decision:
- Foundation Planning hard-stops if alignment is not complete.

### Q20 - Marker Ownership

Question: Should Foundation Planning mutate alignment markers?

Answer: Exactly no.

Locked decision:
- Alignment owns marker state.
- Foundation Planning reads marker state only.

### Q21 - Foundation Completion Marker

Question: Should Foundation Planning mark itself complete anywhere else?

Answer: After all documents are done, workflow proceeds as normal.

Locked decision:
- No extra marker.
- Populated `docs/project-progress.md` unlocks normal routing.

### Q22 - SRS Requirement Strategy

Question: Does this need a new SRS requirement?

Answer: Probably not a new feature. Avoid a new MAS ID by default.

Locked decision:
- No new MAS ID by default.
- Elaborate/revise existing requirements: MAS-208, MAS-209, MAS-211, and maybe
  MAS-203.

### Q23 - Module Name

Question: What should the new module be called?

Answer: User liked "Foundation Planning."

Locked decision:
- Name: Foundation Planning.
- Skill file: `reference/foundation-planning.md`.

### Q24 - Handoff Wording

Question: Should alignment handoff say to invoke the skill with foundation
planning intent?

Answer: No magic incantation, just a proper clear user message.

Locked decision:
- Plain handoff:
  "Alignment complete. Start a fresh session or clear context before Foundation
  Planning. The next step is Foundation Planning..."

### Q25 - Anti-Rush Rule

Question: Should Foundation Planning strengthen the one-document-at-a-time rule?

Answer: Definitely.

Locked decision:
- One artifact at a time.
- Never batch PRD/SRS/milestone/progress work.
- If context is crowded, stop and continue fresh.

### Q26 - Drafting to Disk

Question: Should Foundation Planning write only after approval, or draft to disk
first?

Answer: Draft onto disk is better; approval is required before moving on.

Locked decision:
- For each artifact: write draft to disk, present path/summary, apply targeted
  edits, get explicit approval, then move to next artifact.

### Q27 - Missing Setup Blocks in Foundation Planning

Question: Should Foundation Planning create missing conventions/orchestration
blocks?

Answer: It does not proceed. Simple as that.

Locked decision:
- If required alignment/setup blocks are missing or incomplete, Foundation
  Planning stops.

### Q28 - AgentOrchestration Shape

Question: Should technical setup use strict template shape or flexible prose?

Answer: Use strict-ish headings with flexible content.

Locked decision:
- Standard guidance headings:
  - `## Harness Capabilities`
  - `## Role Defaults`
  - `## Failure Escalation`
  - `## Skills and MCPs`
  - `## Notes`
- Planning does not require model rows because planning is not subagent/model
  orchestration.
- External skills may inform planning/interviewing style only.
- External skills never override Blueprint artifact structures.

### Q29 - External Planning Skill Influence Location

Question: Where should external planning/interviewing skill influence be
recorded?

Answer: Same place.

Locked decision:
- Record under `<AgentOrchestration>` -> `## Skills and MCPs`.

### Q30 - Skill/MCP Discovery

Question: Should alignment actively search installed skills/MCPs?

Answer: Ask only.

Locked decision:
- Do not scan installed skills/MCPs.
- Record only user-named skills/MCPs.

### Q31 - Concrete Model Names

Question: Should model defaults be generic labels or concrete model names?

Answer: Use full names as the harness supports. Split by harness in AGENTS.md
when the user wants multiple harnesses.

Locked decision:
- Use concrete full harness-supported names.
- `AGENTS.md` may include sections for Codex, OpenCode, Cursor, Pi, etc.

### Q32 - AGENTS.md Only?

Question: Should `<AgentOrchestration>` be AGENTS.md-only?

Answer: No, it is present in other agent files too.

Locked decision:
- All supported entry points may have `<AgentOrchestration>`.
- `AGENTS.md` can be the aggregate multi-harness block.
- Other files may contain only their relevant/current harness section.

### Q33 - Revised Byte Identity

Question: Does byte identity still apply to `<AgentOrchestration>`?

Answer: No; apply identity only to ProjectConventions.

Locked decision:
- `<ProjectConventions>` byte-identical.
- `<AgentOrchestration>` can differ by file.
- Shared harness sections should match approved policy.

### Q34 - Validation Equality

Question: Should `alignment-complete` enforce AgentOrchestration equality?

Answer: Validate like the refined rule.

Locked decision:
- Enforce block presence, non-placeholder, and ProjectConventions byte identity.
- Do not enforce AgentOrchestration byte identity.

### Q35 - Placeholder Identity

Question: Should skill-mode placeholders be identical in all four templates?

Answer: Same.

Locked decision:
- Same placeholders in all skill-mode entry-point templates.

### Q36 - Legacy Placeholders

Question: Should legacy templates get placeholders too?

Answer: Not legacy.

Locked decision:
- Only skill-mode templates get placeholders.

### Q37 - Migrate Placeholder Behavior

Question: Should `blueprint migrate` add placeholders through converted
skill-mode root files?

Answer: Yes.

Locked decision:
- Migration converts to skill-mode templates, so placeholders appear.

### Q38 - Smart Migration Merge

Question: Should migrate preserve/merge old conventions?

Answer: Replacement should be AI-agent driven, not through a script.

Locked decision:
- Migrate does mechanical conversion only.
- Alignment AI owns reading old content and writing confirmed real blocks.

### Q39 - Migration Marker State

Question: Should migrate preserve `alignment-complete` if converted files now
have placeholders?

Answer: No; add a legacy tag.

Locked decision:
- Converted files require fresh alignment.
- Use `alignment-required`, not preserved `alignment-complete`.

### Q40 - Legacy-Origin Marker

Question: Add a separate `blueprint-origin: legacy-migration` comment?

Answer: Yeah.

Locked decision:
- Add `<!-- blueprint-origin: legacy-migration -->`.

### Q41 - Removing Legacy-Origin

Question: Should `alignment-complete` remove the legacy-origin marker?

Answer: Yes, and instructions for handling it belong in the flow.

Locked decision:
- Successful `alignment-complete` removes `blueprint-origin: legacy-migration`.

### Q42 - Legacy-Migration Instructions Location

Question: Where should legacy-migration handling instructions live?

Answer: `alignment.md`.

Locked decision:
- Alignment owns post-migration guidance.

### Q43 - Skill Routing

Question: Should Foundation Planning be added to the Blueprint skill routing
table?

Answer: Yes.

Locked decision:
- Add Foundation Planning as a first-class skill route.

### Q44 - Legacy Routing

Question: Should legacy root ModuleRouting get Foundation Planning?

Answer: Only skill, because that is the forward path.

Locked decision:
- Skill routing only.
- No legacy ModuleRouting row.

### Q45 - docs/core Module?

Question: Should `docs/core/foundation-planning.md` exist for legacy parity?

Answer: No.

Locked decision:
- Foundation Planning is skill-only.
- No `docs/core/foundation-planning.md`.
- No `templates/docs/core/foundation-planning.md`.

### Q46 - Source of Truth

Question: Should the skill template reference be authoritative?

Answer: Of course.

Locked decision:
- Source of truth:
  `templates/skills/blueprint/reference/foundation-planning.md`
- Mirror:
  `skills/blueprint/reference/foundation-planning.md`

### Q47 - Doctor Canonical Payload

Question: Should skill-mode Doctor require the new reference file?

Answer: 100%.

Locked decision:
- Doctor skill-mode canonical payload includes
  `reference/foundation-planning.md`.

### Q48 - Release Inventory

Question: Should package/release inventory include the new skill-only reference?

Answer: 100%.

Locked decision:
- Release inventory includes both template and repo-root skill copies.

### Q49 - Loading Existing Modules

Question: Should Foundation Planning load existing planning references or inline
their content?

Answer: Load them so modules stay light.

Locked decision:
- Foundation Planning owns sequence/gates/context rules.
- It loads existing references for artifact-specific rules.

### Q50 - Plan-Test Loading

Question: Should Foundation Planning load `plan-test.md`?

Answer: No; that is another session.

Locked decision:
- No direct test planning in Foundation Planning.

### Q51 - Milestone/Phase Creation

Question: Should Foundation Planning create the first milestone or phase
document?

Answer: Just PRD and SRS; milestone document is another session.

Locked decision:
- No milestone document.
- No phase document.

### Q52 - PRD Milestones

Question: Should PRD milestones wait until milestone planning?

Answer: No. Milestone planning creates the milestone document; it does not plan
the milestones themselves.

Locked decision:
- Foundation Planning creates full PRD with milestones.

### Q53 - PRD/SRS Sequence

Question: Should Foundation Planning keep the current two-stage PRD/SRS
sequence?

Answer: Same as is.

Locked decision:
- PRD Stage 1 body.
- SRS creation.
- PRD Stage 2 milestones with SRS ID references.

### Q54 - Project Progress

Question: Should Foundation Planning populate `docs/project-progress.md`?

Answer: Yes, create it and set the first milestone as pending planning.

Locked decision:
- Foundation Planning populates project progress.
- Current Milestone: M1 / first PRD milestone.
- Current Phase: TBD / pending milestone planning.

### Q55 - Unlock Normal Routing

Question: Should populated project progress unlock normal Blueprint routing?

Answer: Yes.

Locked decision:
- Foundation Planning completion makes normal workflow available.

### Q56 - Tracker Tasks

Question: Should Foundation Planning create tracker tasks?

Answer: No.

Locked decision:
- No tracker tasks or board mutations.

### Q57 - Tracker DB Requirement / Init

Question: Should Foundation Planning require tracker DB even though it creates
no tasks?

Answer: Init/install order matters. The skill should instruct install/init
first; alignment assumes init has run.

Locked decision:
- Bootstrap order:
  1. Install Blueprint skill/CLI as needed.
  2. Run `blueprint init`.
  3. Alignment.
  4. Foundation Planning.
  5. Normal workflows.
- Foundation Planning requires tracker DB.

### Q58 - Setup Gate Before Init

Question: Should the skill setup gate route to alignment if tracker/progress is
missing?

Answer: Stop and instruct to run `blueprint init`.

Locked decision:
- If scaffold/tracker is missing, setup gate stops.
- It instructs install/init before alignment.

### Q59 - After Init: Alignment Required

Question: After init, with tracker present, empty progress, and
`alignment-required`, should setup gate route only to alignment?

Answer: Of course.

Locked decision:
- Empty progress + `alignment-required` -> alignment only.

### Q60 - After Alignment: Foundation Planning

Question: Empty progress + `alignment-complete` should route only to Foundation
Planning?

Answer: Yeah.

Locked decision:
- Empty progress + `alignment-complete` -> Foundation Planning only.

### Q61 - Populated Progress + Required Marker

Question: What if progress is populated but marker is still
`alignment-required`?

Answer: Warn/block as inconsistent.

Locked decision:
- Block normal workflows and instruct finish/rerun alignment.

### Q62 - Populated Progress + No Marker

Question: What if progress is populated and no marker exists?

Answer: Normal routing proceeds for backcompat.

Locked decision:
- Populated progress + no marker -> normal routing.

### Q63 - Empty Progress + No Marker

Question: What if progress is empty and no marker exists?

Answer: Default stop/repair guidance.

Locked decision:
- Stop with guidance: run init, doctor, or migrate depending on project state.

### Q64 - Init Project Progress Behavior

Question: Should init still scaffold empty `project-progress.md`?

Answer: Keep current behavior; not much code change.

Locked decision:
- Keep current init scaffolding.
- Interpret empty shell as bootstrap state.

### Q65 - npx skills Behavior

Question: Should `npx skills add` add placeholders or mutate root files?

Answer: Of course not. It only installs files.

Locked decision:
- `npx skills add` installs skill payload only.
- `blueprint init` creates entry points/placeholders/marker.

### Q66 - Marker Placement

Question: Should placeholders appear before the marker?

Answer: Yes, marker last.

Locked decision:
- Skill-mode root entry point shape:
  intro text, `<ProjectConventions>`, `<AgentOrchestration>`,
  then `<!-- blueprint-status: alignment-required -->`.

### Q67 - Files Scanned by alignment-complete

Question: Should `alignment-complete` scan existing supported files or only
manifest-managed files?

Answer: Same as current behavior.

Locked decision:
- Scan existing supported root files, not only manifest-managed files.

### Q68 - Partial Completion Behavior

Question: If one existing supported file is invalid and another is valid, should
the command partially flip or fail?

Answer: Fail and warn; AI agent handles the fix and reruns.

Locked decision:
- Validate all relevant existing supported files first.
- If validation fails, fail with clear warnings and flip nothing.

### Q69 - Validate Already-Complete Files

Question: Should `alignment-complete` validate already-complete files on rerun?

Answer: Yes, all of them.

Locked decision:
- Validate required, complete, and markerless existing files as applicable.

### Q70 - Markerless Files

Question: Should markerless existing files hard-fail?

Answer: Keep it simple and intuitive. The command should outline the issue.

Locked decision:
- Markerless existing files are reported with one-line fix guidance.
- They are left unchanged.
- They are not auto-repaired.
- Command failure is reserved for validation failures in files it would complete
  or already considers complete.

### Q71 - Validation Parser

Question: Strict XML parse or simple checks?

Answer: Simplish.

Locked decision:
- Use simple block extraction.
- No XML parser.
- Reject missing tags and `Alignment pending.`.
- Compare ProjectConventions across marked existing files.

### Q72 - AgentOrchestration Heading Checks

Question: Should the command enforce internal headings?

Answer: No, guidelines should enforce it. Command checks would be too deep.

Locked decision:
- Alignment guidance defines standard headings.
- Command only checks block exists and is not placeholder.

### Q73 - ProjectConventions Byte Identity Enforcement

Question: Should command enforce ProjectConventions byte identity?

Answer: Yeah.

Locked decision:
- Enforce byte-identical ProjectConventions across relevant existing entry
  points.

### Q74 - Markerless Files and Byte Identity

Question: Include markerless files in ProjectConventions comparison?

Answer: Markerless files are just reported.

Locked decision:
- Markerless existing entry points are reported and skipped from
  ProjectConventions byte-identity validation.

### Q75 - Removing Legacy-Origin

Question: Should `alignment-complete` remove `blueprint-origin:
legacy-migration` when it succeeds?

Answer: Yeah.

Locked decision:
- Successful command removes the legacy-origin marker from processed root
  entry-point files.

### Q76 - Where migrate Adds Legacy-Origin

Question: Should migrate add `blueprint-origin: legacy-migration` to all
converted root entry points or only some?

Answer: Default: all converted root entry points.

Locked decision:
- Migrate adds legacy-origin to all converted root entry points.

### Q77 - Migrate Preserving Complete Marker

Question: Should migrate preserve `alignment-complete` if alignment was
obviously done before?

Answer: No; after conversion to placeholders, require alignment again.

Locked decision:
- Converted files always get:
  - `<!-- blueprint-origin: legacy-migration -->`
  - `<!-- blueprint-status: alignment-required -->`
- Never preserve `alignment-complete` after conversion.

### Q78 - Populated Project After Migration

Question: If migrated project has populated progress and alignment-required,
should normal work block?

Answer: Rerun and block.

Locked decision:
- Populated progress + alignment-required + legacy-origin blocks normal
  workflows and requires alignment.

### Q79 - Post-Migration Alignment Fast Track

Question: Should alignment skip product discovery for post-migration projects?

Answer: Of course. There should be a fast track.

Locked decision:
- Post-migration alignment focuses only on entry-point setup:
  ProjectConventions, AgentOrchestration, and preservation of old guidance with
  user approval.

### Q80 - Other Fast Track

Question: Should populated progress + alignment-required without legacy-origin
also fast-track to setup repair?

Answer: Yes. Enough grilling; ready for impact analysis and revision phases.

Locked decision:
- Alignment includes a narrow incomplete-alignment repair fast track.

## Working Revision Shape

Current working title:

`Revision 12 - Alignment Split and Foundation Planning`

Current working scope:

- Alignment becomes setup-only: conventions, agent orchestration, and alignment
  marker completion.
- Foundation Planning becomes a skill-only module:
  PRD Stage 1 -> SRS -> PRD Stage 2 -> project-progress.
- Foundation Planning does not create milestone documents, phase documents,
  test plans, or tracker tasks.
- Setup gate gains bootstrap routing:
  - missing scaffold/tracker -> stop and instruct install/init
  - empty progress + alignment-required -> alignment only
  - empty progress + alignment-complete -> Foundation Planning only
  - populated progress + alignment-required -> block/rerun alignment
  - populated progress + no marker -> normal routing for backcompat
- `alignment-complete` remains as the AI-run finalizer command, with simple
  validation.
- `migrate` forces post-migration alignment via legacy-origin and
  alignment-required markers.
