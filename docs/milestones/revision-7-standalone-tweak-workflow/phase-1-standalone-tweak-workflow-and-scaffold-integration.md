# Phase 1 — Standalone Tweak Workflow & Scaffold Integration Plan

**Status**: Planning
**Milestone**: Revision 7 — Standalone Tweak Workflow
**Task ID prefix**: `R7-1`

---

## Goals

- Replace the inline phase-section tweak contract with a standalone top-level quick-change workflow rooted at `docs/tweaks/`.
- Lock the tweak document naming convention (`tweak-<n>-<slug>.md`) and the tracker `milestone` value shape (`Tweak <n> — <name>`).
- Scaffold `docs/tweaks/` (with a placeholder `README.md`) into every new and existing Blueprint project.
- Doctor validates and repairs `docs/tweaks/` and `docs/tweaks/README.md` in older projects without overwriting user content.
- Remove the `## Tweaks` section from the phase-plan template and clarify boundary rules across all related core modules and root/template agent routing.
- Deepen MAS-206 in the SRS with locked technical sub-detail; the requirement transitions to `active` on phase completion.
- Forward-only test coverage updates so the existing suite remains green and the new contract is regression-protected.

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Revision 6 — Built-in Task Tracker complete (tracker, board, milestone field, JSON snapshot) | Complete |
| Revision 2 inline tweak contract present (to be superseded) | Complete |
| MAS-206 created at `approved-pending-implementation` in `docs/srs.md` | Complete |
| `docs/milestones/revision-7-standalone-tweak-workflow/revision-7-standalone-tweak-workflow.md` committed | Complete |

---

## Gate R7-1.0 — Tweak Contract Canon & Foundation

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R7-1.0.1 | Rewrite `docs/core/tweak-planning.md` as a standalone top-level quick-change contract. Must include: (a) a prominent, detailed `<TweakDefinition>` block — what a tweak is, what it is not, characteristic shape (small, contained, single concern, no new feature, no formal test plan), with positive and negative examples; (b) lock naming `tweak-<n>-<slug>.md`, tracker `milestone` value `Tweak <n> — <name>`, lightweight phase-shaped doc structure (Goals, Dependencies, Task tables, Acceptance Criteria, Verification, DoD, Status), no formal Test Plan section; (c) explicit boundary rules vs revisions/scope-change/bug-resolution with decision guide; (d) tracker-backed execution/review/address/rereview lifecycle; (e) a `<TweakIntentClassification>` block instructing the agent to apply general intelligence to every incoming change request — assess scope, surface area, feature-ness, and test-plan need — and proactively route to tweak planning when the request qualifies, even when the user did not say "tweak"; the agent must surface the classification to the user before drafting; (f) a `<TweakReviewGate>` block making explicit user review of the drafted tweak plan **mandatory** before execution — no tracker task may move from TO-DO to IN-PROGRESS until the user has confirmed the tweak document; the agent must present the draft, wait for explicit confirmation, and re-loop on requested changes (mirrors `planning.md` STEP 4–5 review-then-commit discipline); (g) a complete worked example tweak document (e.g. a UI copy fix or a single anti-pattern addition) showing the full lightweight structure end-to-end. | 2.25 | None | Independent |
| R7-1.0.2 | Remove the `## Tweaks` section from the `<PhaseTemplate>` block in `docs/core/phase-planning.md`. Phase docs no longer own tweak entries. | 0.25 | None | Independent |
| R7-1.0.3 | Seed `docs/tweaks/README.md` placeholder: directory purpose, link to `docs/core/tweak-planning.md`, file-naming convention. | 0.5 | None | Independent |
| R7-1.0.4 | Deepen MAS-206 in `docs/srs.md` with locked sub-detail (naming convention, tracker milestone value, lightweight structure, no formal test plan, Doctor scaffold integration). Add change-log entry dated 2026-05-19. Status remains `approved-pending-implementation` until phase completion. | 0.5 | R7-1.0.1 | Dependent |

### Gate Acceptance Criteria

- [ ] `docs/core/tweak-planning.md` defines the standalone contract end-to-end: prominent detailed tweak definition (what it is / is not, with positive and negative examples), trigger, process, format with `tweak-<n>-<slug>.md` naming and `Tweak <n> — <name>` tracker milestone, boundary rules with decision guide, and explicit "no formal Test Plan" clause.
- [ ] `docs/core/tweak-planning.md` contains a `<TweakIntentClassification>` block requiring the agent to apply general intelligence to every change request, classify whether it qualifies as a tweak, surface the classification to the user, and proactively route accordingly — independent of whether the user used the word "tweak".
- [ ] `docs/core/tweak-planning.md` contains a `<TweakReviewGate>` block making user review of the drafted tweak plan **mandatory** before execution — tracker tasks cannot leave TO-DO until the user has explicitly confirmed the tweak document, with a re-loop required on requested changes.
- [ ] `docs/core/tweak-planning.md` includes a complete worked example tweak document demonstrating the lightweight structure end-to-end.
- [ ] `docs/core/phase-planning.md` `<PhaseTemplate>` contains no `## Tweaks` section.
- [ ] `docs/tweaks/README.md` exists, references `docs/core/tweak-planning.md`, and documents the naming convention.
- [ ] MAS-206 in `docs/srs.md` records the locked sub-detail in its description bullets and gains a 2026-05-19 change-log entry; ID, priority, and status are unchanged.

---

## Stream A — Scaffold Engine & Doctor Repair

> CLI scaffold creates `docs/tweaks/` for new projects, and Doctor repairs it for older projects without overwriting user content.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R7-1.A.1 | Update `src/init/archive-engine.ts` and any scaffold helpers so `blueprint init` creates `docs/tweaks/` and writes `docs/tweaks/README.md` from the template. Include the new path in the "created directories" summary report. | 0.75 | Gate | Dependent |
| R7-1.A.2 | Update `src/doctor/structure.ts` to register `docs/tweaks/` (directory) and `docs/tweaks/README.md` (file) as required canonical-structure entries. | 0.5 | Gate | Dependent |
| R7-1.A.3 | Implement Doctor repair for older projects across the full canonical-structure set: for any missing required directory or file (e.g. `docs/tweaks/`, `docs/core/orchestrate.md`, `docs/core/tracker.md`, and any other entries in the required set), Doctor creates the dir and/or copies the file from the template; if a file exists with any content, leave it untouched (no overwrite). Driven generically by the required-structure list rather than per-file branches. | 1.25 | R7-1.A.2 | Dependent |
| R7-1.A.4 | Forward-only update to `tests/phase-2/stream-c/archive-and-scaffold-engine.test.ts` so the expected scaffold output includes `docs/tweaks/README.md`. | 0.5 | R7-1.A.1 | Dependent |

### Stream A Acceptance Criteria

- [ ] `blueprint init` produces `docs/tweaks/README.md` and the directory appears in the scaffold summary.
- [ ] `docs/doctor/structure.ts` lists `docs/tweaks` and `docs/tweaks/README.md` as required.
- [ ] Doctor repair on an older project missing `docs/tweaks/` creates the dir and writes the template README byte-for-byte.
- [ ] Doctor repair never modifies an existing `docs/tweaks/README.md`, regardless of content drift.
- [ ] Scaffold archive test passes with the updated expected file set.

---

## Stream B — Core Doc Updates & R2 Test Supersession

> All non-tweak-planning core modules are updated for the new boundary, and the R2 inline tweak-contract test is rewritten to assert the standalone contract.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R7-1.B.1 | Update `docs/core/blueprint-structure.md`: add `docs/tweaks/` to canonical layout, "What Goes Where", rules, and validation checklist. | 0.75 | Gate | Dependent |
| R7-1.B.2 | Update `docs/core/hierarchy.md`: clarify tweaks as a top-level quick-change contract outside the Project → Milestone → Phase hierarchy, with optional milestone impact notes. | 0.5 | Gate | Dependent |
| R7-1.B.3 | Update `docs/core/scope-change.md` and `docs/core/revision-planning.md`: new features still route through scope-change / milestone placement; small contained non-feature work routes to tweak planning; new features, major edits, cross-cutting contract changes, formal-test-plan needs, and multi-phase work stay revision/milestone. | 1.0 | Gate | Dependent |
| R7-1.B.4 | Update `docs/core/execution.md`, `docs/core/review.md`, and `docs/core/phase-completion.md`: allow tweak documents as execution and review sources alongside phase documents; phase-completion does not own standalone tweak completion (that lives in `tweak-planning.md`). Add two explicit gates in `execution.md`: (i) a tweak-start gate — no tweak task may move from TO-DO to IN-PROGRESS until the user has explicitly confirmed the drafted tweak plan; (ii) a tweak-completion gate — the full project test suite (`npm test`) must pass before a tweak's terminal task is marked DONE. Both gates block execution on failure. | 1.5 | Gate | Dependent |
| R7-1.B.5 | Update `docs/core/test-planning.md`: tweaks do not get their own formal test plan; needing one is an escalation signal to revision/milestone planning. | 0.5 | Gate | Dependent |
| R7-1.B.6 | Update `docs/core/orchestrate.md`: orchestration may run a tweak document's gate/stream map when present, reusing the per-stream execute → review → address → rereview loop. | 0.5 | Gate | Dependent |
| R7-1.B.7 | Supersede `tests/revision-2/gate-1.0/tweak-contract.test.ts` (forward-only): replace inline phase `## Tweaks` ownership expectations with standalone-tweak-doc expectations sourced from the rewritten `tweak-planning.md`. | 1.0 | Gate | Dependent |

### Stream B Acceptance Criteria

- [ ] All six listed core docs reflect the new standalone tweak contract and the boundary between tweak / scope-change / revision / bug-resolution.
- [ ] No core module still describes tweaks as an inline phase section.
- [ ] `execution.md` defines two explicit tweak gates: (i) a tweak-start gate requiring explicit user confirmation of the tweak plan before any task leaves TO-DO; (ii) a tweak-completion gate requiring `npm test` to pass before a tweak's terminal task moves to DONE.
- [ ] The superseded R2 tweak-contract test passes and asserts standalone tweak doc behavior.

---

## Stream C — Templates Mirror & Agent Routing

> Byte-for-byte mirror live core docs into `templates/docs/core/`, update root and template agent routing, and update the mirror test.
> **Depends on:** Gate (tweak-planning + phase-planning template change) and Streams A + B (all live-doc changes settled before mirror runs).

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R7-1.C.1 | Mirror `docs/core/tweak-planning.md` to `templates/docs/core/tweak-planning.md` byte-for-byte. | 0.5 | Gate | Dependent |
| R7-1.C.2 | Mirror updated `docs/core/phase-planning.md` to `templates/docs/core/phase-planning.md` byte-for-byte (no `## Tweaks` in the template's PhaseTemplate). | 0.5 | Gate | Dependent |
| R7-1.C.3 | Mirror Stream B's updated core docs (`blueprint-structure.md`, `hierarchy.md`, `scope-change.md`, `revision-planning.md`, `execution.md`, `review.md`, `phase-completion.md`, `test-planning.md`, `orchestrate.md`) into `templates/docs/core/` byte-for-byte. | 1.0 | R7-1.B.1, R7-1.B.2, R7-1.B.3, R7-1.B.4, R7-1.B.5, R7-1.B.6 | Dependent |
| R7-1.C.4 | Update root agent routing in `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `QWEN.md`: tweak intent routes to `docs/core/tweak-planning.md` as top-level quick-change planning (not "correct completed tasks in current phase"). Routing rule must instruct the agent to actively classify incoming change requests for tweak suitability — applying general intelligence to scope, surface area, feature-ness, and test-plan need — and propose the tweak route to the user whenever the request qualifies, even if the user did not use the word "tweak". | 1.0 | Gate | Dependent |
| R7-1.C.5 | Mirror routing updates into `templates/AGENTS.md`, `templates/CLAUDE.md`, `templates/GEMINI.md`, `templates/QWEN.md`. | 0.5 | R7-1.C.4 | Dependent |
| R7-1.C.6 | Update `tests/stream-c/project-templates-mirror.test.ts` expectations to include all R7-touched paths (core docs + root agent routing) so the byte-for-byte mirror invariant is enforced. | 0.75 | R7-1.C.1, R7-1.C.2, R7-1.C.3, R7-1.C.5 | Dependent |

### Stream C Acceptance Criteria

- [ ] Every R7-touched core doc has an identical byte-for-byte copy under `templates/docs/core/`.
- [ ] Root and template agent-routing tables describe tweak intent as top-level quick-change planning.
- [ ] Mirror test passes with the expanded path set and would fail if any R7-touched live/template pair drifts.

---

## Stream D — Doctor Canonical-Structure Test & Repair Coverage

> Forward-only test coverage that locks the new canonical structure and Doctor repair behavior for older projects.
> **Depends on:** Stream A (Doctor structure + repair implementation).

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R7-1.D.1 | Update `tests/phase-3/gate-3.0/canonical-structure.test.ts`: assert `docs/tweaks/` (directory) and `docs/tweaks/README.md` (file) are required canonical entries. | 0.5 | R7-1.A.2 | Dependent |
| R7-1.D.2 | Add Doctor repair coverage — scenario 1 (broad): simulate an older project missing newer canonical files added across recent revisions — at minimum `docs/tweaks/` (R7), `docs/core/orchestrate.md` (R5), and `docs/core/tracker.md` (R6). After Doctor repair, all three are restored byte-for-byte from templates and the canonical-structure check passes. Test must be parameterized so any future canonical file added to the required-structure set is automatically covered. | 1.0 | R7-1.A.3 | Dependent |
| R7-1.D.3 | Add Doctor repair coverage — scenario 2: simulate `docs/tweaks/` present but `README.md` missing; after Doctor repair, `README.md` is restored from the template. | 0.5 | R7-1.A.3 | Dependent |
| R7-1.D.4 | Add Doctor repair coverage — scenario 3: simulate `docs/tweaks/README.md` present with arbitrary user content; after Doctor repair, content is unchanged (no overwrite). | 0.5 | R7-1.A.3 | Dependent |

### Stream D Acceptance Criteria

- [ ] Canonical-structure test enforces both `docs/tweaks/` and `docs/tweaks/README.md` as required.
- [ ] Broad repair scenario verifies Doctor restores **all** newer canonical files missing from older projects — `docs/tweaks/`, `docs/core/orchestrate.md`, `docs/core/tracker.md` (and any other entries in the required-structure set) — byte-for-byte from templates.
- [ ] Broad repair scenario is parameterized over the canonical-structure set so future additions are covered automatically.
- [ ] README-specific repair scenarios pass — missing README restored, drifted README left alone.
- [ ] Test fails clearly if any repair behavior regresses.

---

## Parallelization Map

```
Gate R7-1.0 (Tweak Contract Canon) ──────────────┐
                                                  │
              ┌───────────────────────────────────┤
              │                                   │
Stream A (Scaffold + Doctor) ───────────────────► │
Stream B (Core Docs + R2 Test) ─────────────────► │
              │                                   │
              │             ┌───────────────────► │
              │             │                     │
              └── Stream C (Templates + Routing)  │
                  depends on Gate + A + B ──────► │
              │                                   │
              └── Stream D (Doctor Tests)         │
                  depends on A ──────────────────►│
                                                  │
                                                  ▼
                                        Phase R7-1 complete
                                  (MAS-206 → active on completion)
```

---

## Test Plan

> Generated from task analysis. Each testable task has one or more tests
> mapped to it. Tests are written before implementation (TDD) during
> task execution. Test-authoring tasks (R7-1.A.4, R7-1.B.7, R7-1.C.6,
> R7-1.D.1–D.4) are marked not testable; their coverage is delivered by
> sibling implementation tests (R6 Phase 4 pattern).

### Gate R7-1.0 Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R7-1.0.1.1 | R7-1.0.1 | unit | `tweak-planning.md` contains a `<TweakDefinition>` block with both positive and negative examples | Block + examples present |
| T-R7-1.0.1.2 | R7-1.0.1 | unit | `tweak-planning.md` contains a `<TweakIntentClassification>` block instructing proactive classification regardless of user wording | Block present with classification rule |
| T-R7-1.0.1.3 | R7-1.0.1 | unit | `tweak-planning.md` contains a `<TweakReviewGate>` block making user confirmation mandatory before any task leaves TO-DO | Block present with TO-DO gate phrasing |
| T-R7-1.0.1.4 | R7-1.0.1 | unit | `tweak-planning.md` contains a complete worked example tweak document with the lightweight structure | Example section detected end-to-end |
| T-R7-1.0.1.5 | R7-1.0.1 | unit | `tweak-planning.md` locks naming `tweak-<n>-<slug>.md` and tracker milestone `Tweak <n> — <name>` | Both literal strings present |
| T-R7-1.0.1.6 | R7-1.0.1 | unit | `tweak-planning.md` has no formal Test Plan section in its template | No `## Test Plan` heading inside template region |
| T-R7-1.0.2 | R7-1.0.2 | unit | `phase-planning.md` `<PhaseTemplate>` contains no `## Tweaks` heading | Heading absent inside `<PhaseTemplate>` |
| T-R7-1.0.3 | R7-1.0.3 | unit | `docs/tweaks/README.md` exists, links to `tweak-planning.md`, documents the naming convention | File present + link + naming string |
| T-R7-1.0.4 | R7-1.0.4 | unit | `docs/srs.md` MAS-206 carries locked sub-detail bullets + 2026-05-19 change-log entry | Required bullets + dated changelog line present |

### Stream A Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R7-1.A.1.1 | R7-1.A.1 | integration | `blueprint init` scaffold produces `docs/tweaks/README.md` matching the template | File exists with template content |
| T-R7-1.A.1.2 | R7-1.A.1 | integration | `blueprint init` summary report lists `docs/tweaks/` in created directories | Output contains the path |
| T-R7-1.A.2 | R7-1.A.2 | unit | `src/doctor/structure.ts` required-structure set includes `docs/tweaks/` and `docs/tweaks/README.md` | Both entries present |
| T-R7-1.A.3.1 | R7-1.A.3 | unit | Doctor repair is driven by the canonical-structure list (generic) — adding a new required entry causes repair to attempt restoration without per-file branches | Inspection of repair routine shows list-driven behavior |
| T-R7-1.A.3.2 | R7-1.A.3 | integration | Doctor repair never overwrites an existing required file regardless of content | Existing file bytes unchanged after repair pass |
| — | R7-1.A.4 | — | Not testable: this task **is** the scaffold-archive test update; coverage delivered by T-R7-1.A.1.x | — |

### Stream B Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R7-1.B.1 | R7-1.B.1 | unit | `blueprint-structure.md` canonical layout + validation checklist include `docs/tweaks/` | Path present in both sections |
| T-R7-1.B.2 | R7-1.B.2 | unit | `hierarchy.md` describes tweaks as a top-level quick-change contract outside the Project→Milestone→Phase hierarchy | Required clause present |
| T-R7-1.B.3.1 | R7-1.B.3 | unit | `scope-change.md` routes small contained non-feature changes to tweak planning | Clause present |
| T-R7-1.B.3.2 | R7-1.B.3 | unit | `revision-planning.md` documents the revision/tweak boundary (multi-phase, features, cross-cutting → revision) | Clause present |
| T-R7-1.B.4.1 | R7-1.B.4 | unit | `execution.md` allows tweak documents as execution sources | Clause present |
| T-R7-1.B.4.2 | R7-1.B.4 | unit | `execution.md` defines the tweak-start gate (TO-DO → IN-PROGRESS requires explicit user confirmation of the tweak plan) | Gate language present |
| T-R7-1.B.4.3 | R7-1.B.4 | unit | `execution.md` defines the tweak-completion gate (`npm test` green before terminal task → DONE) | Gate language present |
| T-R7-1.B.4.4 | R7-1.B.4 | unit | `review.md` allows tweak gate/stream review through the existing loop | Clause present |
| T-R7-1.B.4.5 | R7-1.B.4 | unit | `phase-completion.md` disclaims ownership of standalone tweak completion | Clause present |
| T-R7-1.B.5 | R7-1.B.5 | unit | `test-planning.md` states tweaks do not get a formal test plan and that needing one is an escalation signal | Clause present |
| T-R7-1.B.6 | R7-1.B.6 | unit | `orchestrate.md` describes how orchestration consumes a tweak's gate/stream map when present | Clause present |
| — | R7-1.B.7 | — | Not testable: this task **is** the R2 inline-tweak-contract test supersession; coverage delivered by the rewritten R2 contract test itself | — |

### Stream C Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R7-1.C.1 | R7-1.C.1 | unit | `templates/docs/core/tweak-planning.md` matches live byte-for-byte | Equal bytes |
| T-R7-1.C.2 | R7-1.C.2 | unit | `templates/docs/core/phase-planning.md` matches live byte-for-byte | Equal bytes |
| T-R7-1.C.3 | R7-1.C.3 | unit | All nine Stream B core docs mirror byte-for-byte under `templates/docs/core/` (parameterized over the file set) | Equal bytes for every pair |
| T-R7-1.C.4.1 | R7-1.C.4 | unit | Root agent routing tables in `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `QWEN.md` route tweak intent to `docs/core/tweak-planning.md` (parameterized) | Routing row present in each file |
| T-R7-1.C.4.2 | R7-1.C.4 | unit | Same four root agent files instruct the agent to classify incoming change requests for tweak suitability, independent of user wording | Classification clause present in each |
| T-R7-1.C.5 | R7-1.C.5 | unit | `templates/AGENTS.md`, `templates/CLAUDE.md`, `templates/GEMINI.md`, `templates/QWEN.md` mirror root routing region byte-for-byte (parameterized) | Equal bytes in routing region |
| — | R7-1.C.6 | — | Not testable: this task **is** the mirror-test update; coverage delivered by T-R7-1.C.1 through T-R7-1.C.5 | — |

### Stream D Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| — | R7-1.D.1 | — | Not testable: this task **is** the canonical-structure test update; coverage delivered by T-R7-1.A.2 | — |
| — | R7-1.D.2 | — | Not testable: this task **is** the broad parameterized Doctor repair test (covers `docs/tweaks/`, `orchestrate.md`, `tracker.md`, plus any future entries); coverage delivered by T-R7-1.A.3.1 and T-R7-1.A.3.2 | — |
| — | R7-1.D.3 | — | Not testable: this task **is** the missing-README repair test; coverage delivered by T-R7-1.A.3.2 | — |
| — | R7-1.D.4 | — | Not testable: this task **is** the drifted-README-left-alone test; coverage delivered by T-R7-1.A.3.2 | — |

### Test Summary

| Component | Total Tasks | Testable | Not Testable |
|-----------|-------------|----------|--------------|
| Gate R7-1.0 | 4 | 4 | 0 |
| Stream A | 4 | 3 | 1 |
| Stream B | 7 | 6 | 1 |
| Stream C | 6 | 5 | 1 |
| Stream D | 4 | 0 | 4 |
| **Total** | **25** | **18** | **7** |

32 tests total mapped across 18 testable tasks. The 7 not-testable tasks are all test-authoring tasks whose coverage is delivered by sibling implementation tests.

---

## Definition of Done

- [ ] Gate R7-1.0 acceptance criteria pass.
- [ ] Stream A, B, C, and D acceptance criteria pass.
- [ ] All tests in the Test Plan pass.
- [ ] Full test suite green (no regressions). Existing R2 tweak-contract test passes against the standalone contract; canonical-structure, scaffold archive, and template-mirror tests pass with the expanded R7 expectations.
- [ ] No lint errors in files touched by this phase.
- [ ] `docs/tweaks/README.md` and the canonical `docs/tweaks/` directory exist in this repo and in scaffold output.
- [ ] Every R7-touched live core doc has a byte-for-byte mirror under `templates/docs/core/`.
- [ ] Root agent routing files and their template mirrors route tweak intent to `docs/core/tweak-planning.md` as top-level quick-change planning.
- [ ] MAS-206 transitions from `approved-pending-implementation` to `active` on phase completion, with a 2026-05-19 change-log entry recording the transition.
- [ ] `docs/project-progress.md` decision log records the phase completion and MAS-206 activation.

---

## Test Scenarios

### Happy Path
- [ ] An agent reading the updated routing tables and `tweak-planning.md` classifies a small UI copy change as a tweak even when the user only says "fix this wording", and proposes the tweak route before drafting.
- [ ] `blueprint init` on a fresh project creates `docs/tweaks/README.md` and the scaffold summary lists the new directory.
- [ ] `blueprint doctor` on an older project missing `docs/tweaks/` reports the gap, repairs it, and produces `docs/tweaks/README.md` matching the template.
- [ ] Routing tables in `AGENTS.md` (and mirrors) describe tweak intent as a top-level quick-change planning workflow under `docs/tweaks/`.
- [ ] `execution.md` states (and the R2 contract test asserts) that a tweak's terminal task cannot move to DONE until `npm test` passes.
- [ ] `execution.md` and `tweak-planning.md` state (and the R2 contract test asserts) that no tweak task may move from TO-DO to IN-PROGRESS until the user has explicitly confirmed the drafted tweak plan.
- [ ] Mirror test detects any drift between live `docs/core/*` and `templates/docs/core/*` for R7-touched files.

### Edge Cases
- [ ] Older project where `docs/tweaks/` exists as an empty directory: Doctor restores only the missing `README.md`.
- [ ] Older project where `docs/tweaks/README.md` has been edited by the user: Doctor leaves the file untouched and does not report drift as a failure.
- [ ] Phase-planning template loaded fresh produces a phase doc with no `## Tweaks` section.
- [ ] R2 tweak-contract test fails loudly if a future change reintroduces inline phase-section tweak ownership.
- [ ] Agent correctly declines to classify a multi-phase or new-feature request as a tweak, citing the boundary rules, and routes to revision/scope-change instead.
- [ ] Agent drafts a tweak plan, the user requests changes, agent re-loops the draft, and no tracker task leaves TO-DO until the user has explicitly confirmed the revised plan.

---
