# Phase 2 - Tweak Planning Flow Rewrite Plan

**Status**: Planning
**Milestone**: Revision 8 - Tweak Revamp and Quality of Life Changes
**Task ID prefix**: `R8-2`

---

## Goals

- Replace the Revision 7 tracker-backed tweak workflow with the change-first, user-reviewed, post-hoc documentation workflow defined by MAS-207.
- Define and lock the Tweak Workflow Contract inside this phase document so Stream A has a single source of truth to rewrite from.
- Rewrite `docs/core/tweak-planning.md` end-to-end: change-first loop, Tweak Mode anti-ceremony rule, audit-only post-hoc doc shape, code-change test gate, escalation block.
- Remove all tracker-task and tracker-milestone language from the tweak module; the new workflow makes no tracker mutations.
- Mirror the rewritten module byte-for-byte to `templates/docs/core/tweak-planning.md` and update root + template agent routing language so "Quick change / tweak" no longer implies pre-task board planning.
- Mark `docs/tweaks/tweak-5-pre-task-tweak-confirmation-gate.md` superseded by R8 Phase 2.
- Activate MAS-207 in the SRS and confirm MAS-206 remains marked superseded.
- Lock the new contract with forward-only doc-contract tests; update existing R7 and R2 tweak-contract tests to assert the new MAS-207 contract rather than the retired tracker-backed contract.

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Revision 7 - Standalone Tweak Workflow complete (MAS-206 marked superseded) | Complete |
| Revision 8 Phase 1 - Quality of Life Workflow Hardening complete | Complete |
| Revision 8 overview document defines Phase 2 scope and MAS-207 transition | Complete |
| SRS MAS-207 created at `approved-pending-implementation` | Complete |

---

## Tweak Workflow Contract

This section is the source of truth Stream A rewrites `docs/core/tweak-planning.md` from. It is not a task list. Streams B and C use it as the assertion target.

### Trigger and Routing

- ModuleRouting row "Quick change / tweak" continues to point at `docs/core/tweak-planning.md`. No rename, no new route.
- When the agent detects tweak intent (small, contained, single-concern change; not a new feature; not cross-cutting), it enters **Tweak Mode**.

### Tweak Mode (anti-ceremony)

While Tweak Mode is active:

- The agent does NOT create tracker/board tasks.
- The agent does NOT load full planning modules (phase-planning, test-planning, revision-planning, milestone-planning).
- The agent does NOT subdivide the work into gates, streams, or task tables.
- The agent does NOT scaffold a formal test plan section.
- The agent does NOT write a planning artifact in advance of the change.
- The agent does NOT detour through ModuleRouting again to reroute the tweak through another flow.

Edits are fast-paced and direct: read → restate → confirm → change → cycle. The agent treats the user as the live review loop.

### Change-First Loop

1. **Understand**: read the user request. Read only the files needed to act.
2. **Restate**: briefly state understanding back to the user.
3. **Confirm**: get explicit confirmation before changing behavior or files.
4. **Change**: make the requested change.
5. **Cycle**: present the result; iterate with the user while the user reviews.
6. **Verify (code changes only)**: when the change touches code, run `npm test`. Green required AND user approval required before doc creation. Docs-only tweaks skip the test gate.
7. **Document (post-hoc)**: after the user confirms the completed change, create the tweak document under `docs/tweaks/`.

### Post-Hoc Tweak Document Shape (audit-only)

The post-hoc tweak document contains exactly these sections, no more:

- **Status** (Complete | Superseded; tweak docs are written after the change, so the default is Complete)
- **Summary of Change** (1-3 sentences describing what changed and why)
- **Files Touched** (bullet list of paths)
- **User Acceptance Note** (one line confirming the user approved the change; reference the date)

No Goals, no Dependencies, no Task tables, no Acceptance Criteria, no Verification block, no Definition of Done, no Test Plan. The doc is an audit record, not a plan.

### Naming and Numbering

- Filename pattern: `tweak-<n>-<slug>.md`.
- Numbering is monotonically increasing across the project. Next change-first tweak after this revision uses the next free integer (tweak-6 at time of writing, given tweaks 1-5 already exist).
- Superseded tweaks retain their original number and filename.

### Escalation Rule

If mid-cycle the work grows beyond a contained change (new feature surface, cross-cutting contract change, multi-phase coordination, formal test plan required, regressive behavior change, multiple distinct concerns):

- The agent performs a **hard stop** on Tweak Mode.
- The agent surfaces the escalation to the user with a one-line explanation of why the work no longer fits the tweak shape.
- The user decides: shrink scope back into a tweak, or route through `docs/core/revision-planning.md` or `docs/core/milestone-planning.md`.
- No automatic rerouting. No partial tweak doc. No board task creation.

### Anti-Patterns

The rewritten module must explicitly list these as anti-patterns:

- Creating tracker/board tasks for a tweak.
- Writing a tweak document before the change is made.
- Loading phase/test/revision/milestone planning modules during Tweak Mode.
- Carving the tweak into gates, streams, or task tables.
- Drafting a formal test plan for a tweak.
- Skipping the change-first confirm step and editing immediately.
- Skipping `npm test` for a code-touching tweak before doc creation.
- Continuing in Tweak Mode after escalation criteria are met.

### SRS Tie-In

- MAS-207 in `docs/srs.md` carries this contract as locked sub-detail (deepened during Phase 2 planning).
- MAS-207 transitions from `approved-pending-implementation` to `active` at Phase 2 completion.
- MAS-206 remains `superseded` by MAS-207.

---

## Stream A - Live Protocol Rewrite

> Rewrite `docs/core/tweak-planning.md` end-to-end to match the Tweak Workflow Contract above. Live doc only; templates and tests are downstream.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R8-2.A.1 | Rewrite `docs/core/tweak-planning.md` to implement the change-first loop (understand → restate → confirm → change → cycle → verify → post-hoc doc). Replace the existing tracker-backed flow body. | 1.5 | None | Independent |
| R8-2.A.2 | Add an explicit **Tweak Mode** section to `docs/core/tweak-planning.md` describing anti-ceremony behavior: no tracker tasks, no module loads, no gates/streams, no formal test plan, no pre-execution planning artifact, no rerouting through ModuleRouting. | 0.75 | R8-2.A.1 | Dependent |
| R8-2.A.3 | Add the audit-only post-hoc tweak document shape to `docs/core/tweak-planning.md`: Status, Summary of Change, Files Touched, User Acceptance Note. Remove any prior Goals/Dependencies/Tasks/Acceptance/Verification/DoD scaffolding from the doc-shape guidance. | 0.75 | R8-2.A.1 | Dependent |
| R8-2.A.4 | Add the code-change test gate to `docs/core/tweak-planning.md`: `npm test` green AND user approval required before creating the tweak document; docs-only tweaks skip the test gate. | 0.5 | R8-2.A.1 | Dependent |
| R8-2.A.5 | Add the escalation block to `docs/core/tweak-planning.md`: hard stop on Tweak Mode when scope grows beyond a contained change, surface to user, user routes manually. | 0.5 | R8-2.A.1 | Dependent |
| R8-2.A.6 | Add the Anti-Patterns section to `docs/core/tweak-planning.md` listing forbidden ceremony (board tasks, pre-change doc, planning module loads, gates/streams, formal test plan, skipped confirm, skipped test gate, ignored escalation). | 0.5 | R8-2.A.2, R8-2.A.3, R8-2.A.4, R8-2.A.5 | Dependent |
| R8-2.A.7 | Remove every reference to the `Tweak <n> — <name>` tracker milestone string and any tracker-task scaffolding from `docs/core/tweak-planning.md`. | 0.5 | R8-2.A.1 | Dependent |
| R8-2.A.8 | Rewrite the worked example inside `docs/core/tweak-planning.md` to demonstrate the change-first flow end-to-end, ending with a sample post-hoc tweak document in the audit-only shape. | 0.75 | R8-2.A.2, R8-2.A.3, R8-2.A.4, R8-2.A.5 | Dependent |
| R8-2.A.9 | Deepen MAS-207 in `docs/srs.md` with locked sub-detail bullets (Tweak Mode, change-first loop, audit-only doc shape, naming, code-change test gate, escalation rule, anti-patterns). Add a change-log entry. Keep status `approved-pending-implementation` until Phase 2 completion. | 0.5 | None | Independent |

### Stream A Acceptance Criteria

- [ ] `docs/core/tweak-planning.md` describes the change-first loop in order: understand → restate → confirm → change → cycle → verify → post-hoc doc.
- [ ] A `Tweak Mode` section exists and forbids tracker tasks, module loads, gate/stream subdivision, formal test plans, pre-execution planning artifacts, and ModuleRouting detours.
- [ ] The post-hoc tweak doc shape lists exactly Status, Summary of Change, Files Touched, and User Acceptance Note.
- [ ] The code-change test gate requires `npm test` green AND user approval before tweak doc creation; docs-only tweaks are exempted.
- [ ] An escalation block hard-stops Tweak Mode and routes the decision to the user without auto-routing.
- [ ] An Anti-Patterns section lists each forbidden ceremony behavior.
- [ ] No occurrence of `Tweak <n> — <name>` tracker milestone language remains in the module.
- [ ] A worked example shows the full change-first flow and ends with a sample post-hoc tweak doc in audit-only shape.
- [ ] SRS MAS-207 carries the locked sub-detail bullets and a Phase 2 change-log entry.

---

## Stream B - Templates and Agent Routing

> Mirror the rewritten module into templates and update root/template agent routing language so the tweak intent reflects the change-first workflow.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R8-2.B.1 | Byte-mirror `docs/core/tweak-planning.md` to `templates/docs/core/tweak-planning.md` after Stream A lands. | 0.5 | R8-2.A.6, R8-2.A.7, R8-2.A.8 | Dependent |
| R8-2.B.2 | Update tweak intent language in the root `CLAUDE.md` (project agent file) and `templates/docs/CLAUDE.md` (template agent file): tweak no longer implies pre-task board planning; mention Tweak Mode and the change-first loop in the routing description or classification block where present. | 0.75 | R8-2.B.1 | Dependent |
| R8-2.B.3 | Update or add focused template-parity coverage for `templates/docs/core/tweak-planning.md` so byte parity is locked. Reuse the existing project-templates mirror harness rather than introducing a new test file. | 0.5 | R8-2.B.1 | Dependent |

### Stream B Acceptance Criteria

- [ ] `templates/docs/core/tweak-planning.md` matches `docs/core/tweak-planning.md` byte-for-byte.
- [ ] Root `CLAUDE.md` and `templates/docs/CLAUDE.md` describe tweak intent in change-first terms with no pre-task board-planning language.
- [ ] The template-parity test fails when the live and template tweak modules diverge.

---

## Stream C - Audit Marker and Doc-Contract Tests

> Mark the superseded tweak, lock the new MAS-207 contract with forward-only tests, and update R7 / R2 contract tests so they assert the MAS-207 contract rather than the retired MAS-206 contract.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R8-2.C.1 | Mark `docs/tweaks/tweak-5-pre-task-tweak-confirmation-gate.md` as **Superseded by Revision 8 Phase 2**. Add a one-line note pointing at this phase doc. | 0.25 | None | Independent |
| R8-2.C.2 | Add a forward-only doc-contract test asserting that `docs/core/tweak-planning.md` contains the change-first loop language, the Tweak Mode anti-ceremony section, the audit-only post-hoc doc shape, the code-change test gate, the escalation hard-stop, and the Anti-Patterns block. | 1.0 | R8-2.A.6 | Dependent |
| R8-2.C.3 | Update existing tests under `tests/revision-7/**` and `tests/gate-r7-1-0/**` so they assert MAS-206 supersession and the MAS-207 contract instead of the retired tracker-backed tweak contract. Keep them forward-only; do not delete history-asserting cases that still hold. | 1.0 | R8-2.A.6, R8-2.A.9 | Dependent |
| R8-2.C.4 | Update `tests/revision-2/gate-1.0/tweak-contract.test.ts` to align with MAS-207. Keep the R2 inline-tweak supersession assertion produced by Revision 7. | 0.5 | R8-2.A.6, R8-2.A.9 | Dependent |
| R8-2.C.5 | If an existing SRS contract test exists that asserts MAS-206 or MAS-207 metadata, update it for MAS-207 sub-detail bullets, the Phase 2 change-log entry, and confirmed MAS-206 supersession. Skip if no such test exists; this task is conditional on prior R6/R7 SRS test scope. | 0.5 | R8-2.A.9 | Dependent |

### Stream C Acceptance Criteria

- [ ] `docs/tweaks/tweak-5-pre-task-tweak-confirmation-gate.md` carries a Superseded marker referencing R8 Phase 2.
- [ ] A doc-contract test asserts every contract clause in `docs/core/tweak-planning.md` (change-first loop, Tweak Mode, audit-only doc shape, test gate, escalation, anti-patterns).
- [ ] R7 contract tests assert the MAS-207 contract and MAS-206 supersession.
- [ ] The R2 tweak-contract test aligns with MAS-207.
- [ ] If present, the SRS contract test reflects MAS-207 sub-detail and MAS-206 supersession.

---

## Parallelization Map

```text
Stream A (Live Protocol Rewrite) ───────────────────┐
                                                     │
                ┌────────────────────────────────────┤
                │                                    │
Stream B (Templates + Agent Routing) ───────────────►│
                │                                    │
                └── Stream C (Audit + Doc-Contract Tests) │
                    depends on Stream A outputs ────►│
                                                     │
                                                     ▼
                                          Phase R8-2 complete
                                          (MAS-207 → active)
```

Stream A runs first end-to-end because both B and C consume its outputs. Within Stream A, tasks A.2-A.8 fan out from A.1 and can be executed in parallel where dependencies allow. A.9 (SRS deepening) is independent and can run alongside A.1.

---

## Definition of Done

- [ ] Stream A, B, and C acceptance criteria pass.
- [ ] `docs/core/tweak-planning.md` and `templates/docs/core/tweak-planning.md` match byte-for-byte.
- [ ] SRS MAS-207 transitions to `active` with a Phase 2 completion change-log entry; MAS-206 remains `superseded`.
- [ ] `docs/tweaks/tweak-5-pre-task-tweak-confirmation-gate.md` carries the Superseded-by-R8-Phase-2 marker.
- [ ] Doc-contract, template-parity, R7, R2, and (if present) SRS contract tests pass under the new MAS-207 assertions.
- [ ] Full `npm test` is green.
- [ ] No lint errors in files touched by this phase.
- [ ] `docs/project-progress.md` records Phase 2 completion and Revision 8 closure when execution finishes.

---

## Test Scenarios

### Happy Path

- [ ] An agent receives a contained change request, enters Tweak Mode, restates understanding, gets user confirmation, makes the change, cycles with the user, runs `npm test` green for the code touched, gets user approval, and writes the audit-only tweak doc under `docs/tweaks/`.
- [ ] A docs-only tweak skips the `npm test` gate but still requires user approval before doc creation.
- [ ] The agent treats a "Quick change / tweak" routing intent as Tweak Mode and does not create board tasks, load planning modules, or write a pre-change plan.
- [ ] Live and template tweak modules remain byte-identical after Stream B.
- [ ] R7, R2, and doc-contract tests pass when run against the rewritten module.

### Edge Cases

- [ ] A request initially classified as a tweak grows mid-cycle (new feature surface or cross-cutting change). The agent hard-stops Tweak Mode, surfaces the escalation, and lets the user choose between scope reduction and revision/milestone routing. No partial tweak doc is created.
- [ ] A code-touching tweak whose tests fail does not produce a tweak doc; the agent loops with the user until tests pass or the work escalates.
- [ ] A docs-only tweak that touches only `docs/**` correctly skips `npm test` and proceeds to the user-approval gate.
- [ ] An agent that attempts to create a board task during Tweak Mode is flagged by the Anti-Patterns block; the doc-contract test prevents future drift by asserting the anti-pattern exists in the module.
- [ ] An older project's tweak module that still describes tracker-backed tweaks is detected by the doc-contract test (live mismatch) and by the template-parity test (template mismatch).

---
