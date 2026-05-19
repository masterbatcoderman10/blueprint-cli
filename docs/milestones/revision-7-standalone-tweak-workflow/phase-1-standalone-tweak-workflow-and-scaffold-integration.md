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

## Definition of Done

- [ ] Gate R7-1.0 acceptance criteria pass.
- [ ] Stream A, B, C, and D acceptance criteria pass.
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
