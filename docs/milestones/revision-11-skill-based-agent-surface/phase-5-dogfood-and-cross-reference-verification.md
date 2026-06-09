# Phase 5 — Dogfood & Cross-Reference Verification Plan

**Status**: Planning
**Milestone**: Revision 11 — Skill-Based Agent Surface
**Phase ID prefix**: R11-5

---

## Goals

- Convert the blueprint-cli repository itself to skill mode by replacing all four root agent entry points (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `QWEN.md`) with the skill-mode entry-point surface already present under `templates/skill/**`.
- Install the Blueprint skill into this repository at `.claude/skills/blueprint/**` from the authoritative local template payload (`templates/skills/blueprint/**`).
- Prove the installed skill can run its setup gate and context loader inside this repo without falling back to legacy root `<ModuleRouting>`.
- Run one deliberately small, real dogfood tweak through the skill-mode tweak workflow. Preferred target: a stale cross-reference discovered during the audit, such as remaining `docs/conventions.md` example text in `tweak-planning` surfaces if still present at execution time.
- Sweep active docs, skill references, and tests for stale legacy-routing / deleted-conventions references that contradict the skill-mode surface.
- Verify the full test suite remains green and update project progress when Phase 5 is complete.

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Revision 11 Phase 1 — skill payload and skill-mode entry-point templates authored | Complete |
| Revision 11 Phase 2 — Doctor mode detection and skill canonical-set repair implemented | Complete |
| Revision 11 Phase 3 — conventions sunset and skill-mode `<ProjectConventions>` templates implemented | Complete |
| Revision 11 Phase 4 — repo-root `skills/blueprint/**` mirror and release surface implemented | Complete |
| MAS-208, MAS-209, MAS-210 statuses in `docs/srs.md` | Active |
| `.claude/skills/blueprint/**` installed in this repository | Pending Phase 5 implementation |
| Root `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `QWEN.md` converted to skill mode | Pending Phase 5 implementation |

---

## Gate R11-5.0 — Dogfood Baseline

> Establish the exact local surfaces Phase 5 will convert and verify before changing the repository's own agent entry points.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R11-5.0.1 | Inventory the four root entry points (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `QWEN.md`), `templates/skill/**`, `templates/skills/blueprint/**`, `skills/blueprint/**`, and current `.claude/` state. Record whether each root entry point is still legacy mode and confirm `.claude/skills/blueprint/**` is absent or ready to be replaced. | 0.25 | None | Independent |
| R11-5.0.2 | Add or identify the shared assertion helpers needed by Phase 5 tests: root entry-point skill-mode assertions, `.claude` skill-install mirror assertions, and active-doc cross-reference audit helpers. Reuse existing R11 Phase 3 / Phase 4 mirror and doc-contract helpers where possible. | 0.75 | R11-5.0.1 | Dependent |

### Gate Acceptance Criteria

- [ ] The pre-change state of all root entry points and local skill payload locations is known.
- [ ] Phase 5 automated checks can assert skill-mode root entry points, local `.claude` skill install parity, and stale cross-reference absence without duplicating large hard-coded file lists.
- [ ] No user-created or unrelated files are modified during baseline inventory.

---

## Stream A — Root Entry-Point Conversion

> Convert the blueprint-cli repo's own root agent files to the same skill-mode shape scaffolded for new skill-mode projects.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R11-5.A.1 | Replace root `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, and `QWEN.md` with the corresponding skill-mode template content from `templates/skill/**`. All four root files must instruct agents to invoke the `blueprint` skill and must carry the `<ProjectConventions>` section. | 0.75 | Gate | Dependent |
| R11-5.A.2 | Add root entry-point contract coverage asserting that all four root files are skill-mode files: they invoke the `blueprint` skill, contain `<ProjectConventions>`, do not contain `<SessionStart>`, `<HardRules>`, or `<ModuleRouting>`, and match the skill-mode template body contract. | 0.75 | R11-5.A.1 | Dependent |

### Stream A Acceptance Criteria

- [ ] Root `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, and `QWEN.md` are skill-mode entry points.
- [ ] None of the four root entry points contains the legacy `<SessionStart>`, `<HardRules>`, or `<ModuleRouting>` blocks.
- [ ] The four root entry points include the same `<ProjectConventions>` content used by skill-mode templates.
- [ ] Automated coverage fails if any root entry point drifts back toward legacy routing.

---

## Stream B — Local Skill Installation

> Install the skill into this repository from the authoritative local template payload and prove the installed copy works as the active dogfood surface.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R11-5.B.1 | Create `.claude/skills/blueprint/**` by copying the authoritative local payload from `templates/skills/blueprint/**`. The installed tree must include `SKILL.md`, all 20 `reference/*.md` module mirrors, `reference/anti-patterns.md`, and `scripts/load-context.mjs`. | 0.75 | Gate | Dependent |
| R11-5.B.2 | Add local-install mirror coverage asserting `.claude/skills/blueprint/**` exists, contains exactly the expected 23-file payload, and is byte-identical to `templates/skills/blueprint/**`. The repo-root `skills/blueprint/**` mirror remains covered by Phase 4 tests; this phase adds the dogfood install location. | 0.75 | R11-5.B.1 | Dependent |
| R11-5.B.3 | Run and, if needed, adjust `node .claude/skills/blueprint/scripts/load-context.mjs` so the installed skill can produce a current markdown context brief in this repository after the root entry points switch to skill mode. | 0.5 | R11-5.B.1 | Dependent |

### Stream B Acceptance Criteria

- [ ] `.claude/skills/blueprint/SKILL.md` exists and matches `templates/skills/blueprint/SKILL.md`.
- [ ] Every installed `.claude/skills/blueprint/reference/*.md` and script file matches the authoritative template payload byte-for-byte.
- [ ] The installed `scripts/load-context.mjs` runs successfully from this repository and reports the current project state.
- [ ] The installed skill payload is treated as a local dogfood install, not as a new editable source of truth.

---

## Stream C — Skill-Routed Dogfood Tweak

> Exercise the skill end-to-end by running one small change through the skill-mode tweak workflow after root conversion and local skill installation.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R11-5.C.1 | Run the skill setup gate manually in this repository: confirm populated `docs/project-progress.md`, initialized tracker DB, and successful context loading via `.claude/skills/blueprint/scripts/load-context.mjs`. Record the dogfood run notes in the phase completion evidence. | 0.5 | R11-5.A.2, R11-5.B.3 | Dependent |
| R11-5.C.2 | Execute one small tweak through the installed skill's tweak workflow. The tweak must be real but low-risk; preferred target is cleanup of stale `docs/conventions.md` worked-example references in `docs/core/tweak-planning.md` and mirrored skill/template surfaces if those references still exist. Follow the change-first tweak loop, verify the change, and create the next `docs/tweaks/tweak-<n>-<slug>.md` post-hoc record. | 1.5 | R11-5.C.1 | Dependent |
| R11-5.C.3 | Add focused regression coverage for the dogfood tweak target so the stale cross-reference or equivalent issue cannot reappear in the active skill-mode surface. Mirror any doc changes across `docs/core/**`, `templates/docs/core/**`, `templates/skills/blueprint/**`, `skills/blueprint/**`, and `.claude/skills/blueprint/**` as required by the owning surface. | 1.0 | R11-5.C.2 | Dependent |

### Stream C Acceptance Criteria

- [ ] The installed skill setup gate can be followed in this repository without using root legacy module routing.
- [ ] A real low-risk tweak is completed through skill-mode routing, not by falling back to the old root `<ModuleRouting>` table.
- [ ] The tweak has a post-hoc `docs/tweaks/tweak-<n>-<slug>.md` record using the next available tweak number.
- [ ] Any changed live/template/skill mirror documents remain byte-identical where their contracts require it.
- [ ] Regression coverage protects the dogfood tweak target.

---

## Stream D — Cross-Reference Verification

> Sweep the active repository surface for references that now contradict skill mode, local skill installation, or the conventions sunset.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R11-5.D.1 | Run a repo-wide cross-reference audit for stale `docs/conventions.md`, legacy `<ModuleRouting>` expectations in skill-mode surfaces, obsolete guidance that says protocols live only under `docs/core/`, and contradictory skill install instructions. Separate intentional historical references in completed phase docs from active operational surfaces. | 0.75 | R11-5.A.2, R11-5.B.2 | Dependent |
| R11-5.D.2 | Fix active-surface cross-reference gaps found by the audit. Expected active surfaces include root entry points, `docs/core/**`, `templates/docs/core/**`, `templates/skill/**`, `templates/skills/blueprint/**`, `skills/blueprint/**`, `.claude/skills/blueprint/**`, README, and release docs. Historical completed phase plans may retain old references when they are explicitly archival. | 1.0 | R11-5.D.1, R11-5.C.2 | Dependent |
| R11-5.D.3 | Add doc-contract coverage for the cross-reference audit boundary so active skill-mode surfaces do not reintroduce deleted-conventions guidance, legacy-only routing language, or install instructions that conflict with Phase 4's project-local `npx skills add ... --skill blueprint` pathway. | 0.75 | R11-5.D.2 | Dependent |

### Stream D Acceptance Criteria

- [ ] Active operational docs and skill references no longer instruct agents to load deleted `docs/conventions.md`.
- [ ] Skill-mode surfaces do not point agents back to root legacy `<ModuleRouting>` as the primary workflow.
- [ ] Install guidance remains consistent with Phase 4: project-local `npx skills add masterbatcoderman10/blueprint-cli --skill blueprint` is the recommended public path; this repo's local dogfood install comes from `templates/skills/blueprint/**`.
- [ ] Automated cross-reference coverage distinguishes active operational surfaces from archival completed phase history.

---

## Stream E — Verification & Progress Bookkeeping

> Close the phase by running the repository verification suite and updating project progress once the dogfood evidence is complete.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R11-5.E.1 | Run targeted Phase 5 tests, then run `npm test`. Run `npm run release:pack:verify` as a release-surface guard because Phase 5 touches skill payload mirrors and root packaging-adjacent surfaces. Fix failures attributable to Phase 5. | 1.0 | R11-5.C.3, R11-5.D.3 | Dependent |
| R11-5.E.2 | Update `docs/project-progress.md` for Phase 5 completion: add a decision entry with dogfood evidence, mark Revision 11 Phase 5 complete in the phase graph, and set the current milestone/phase pointer to Revision 11 Phase 6 pending planning. | 0.5 | R11-5.E.1 | Dependent |

### Stream E Acceptance Criteria

- [ ] Phase 5 targeted tests pass.
- [ ] `npm test` is green.
- [ ] `npm run release:pack:verify` is green or any inability to run it is recorded with the blocking reason.
- [ ] `docs/project-progress.md` records Phase 5 completion and points to Revision 11 Phase 6 as the next pending planning step.

---

## Parallelization Map

```text
Gate R11-5.0 (dogfood baseline) ─────────────────────────────────────────────┐
                                                                              │
                 ┌────────────────────────────────────────────────────────────┤
                 │                                                            │
  Stream A (root entry-point conversion) ────────────────────────────────────►│
  Stream B (local .claude skill install) ────────────────────────────────────►│
                 │                                                            │
                 └── Stream C (skill-routed dogfood tweak)
                     depends on A + B ──────────────────────────────────────►│
                                                                              │
                     Stream D (cross-reference verification)
                     depends on A + B and dogfood tweak findings ───────────►│
                                                                              │
                     Stream E (verification + progress)
                     depends on C + D ───────────────────────────────────────►│
                                                                              │
                                                                              ▼
                                                                Phase R11-5 complete
```

---

## Definition of Done

- [ ] Gate R11-5.0 acceptance criteria pass
- [ ] Stream A acceptance criteria pass
- [ ] Stream B acceptance criteria pass
- [ ] Stream C acceptance criteria pass
- [ ] Stream D acceptance criteria pass
- [ ] Stream E acceptance criteria pass
- [ ] Root `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, and `QWEN.md` are skill-mode entry points
- [ ] `.claude/skills/blueprint/**` is installed from and byte-identical to `templates/skills/blueprint/**`
- [ ] Installed skill context loading works in this repository
- [ ] One small dogfood tweak has been completed through the installed skill-mode workflow and recorded under `docs/tweaks/`
- [ ] Active cross-reference audit coverage passes
- [ ] No lint errors in files touched by this phase
- [ ] `npm test` is green
- [ ] `npm run release:pack:verify` is green
- [ ] `docs/project-progress.md` marks Revision 11 Phase 5 complete and points to Phase 6 pending planning

---

## Test Scenarios

### Happy Path

- [ ] An agent starts from any root entry point and is directed to invoke the `blueprint` skill rather than loading legacy root routing blocks.
- [ ] `.claude/skills/blueprint/scripts/load-context.mjs` prints a current context brief for this repository.
- [ ] The dogfood tweak is classified as tweak-sized, completed through the skill reference workflow, verified, and documented post-hoc.
- [ ] Active docs and skill references agree that conventions now live in `<ProjectConventions>`, not `docs/conventions.md`.
- [ ] Full repository tests and release package verification pass after the dogfood install and cross-reference cleanup.

### Edge Cases

- [ ] A root entry point accidentally reintroduces `<SessionStart>`, `<HardRules>`, or `<ModuleRouting>` and the root entry-point contract test fails.
- [ ] A file under `.claude/skills/blueprint/**` drifts from `templates/skills/blueprint/**` and the local-install mirror test fails.
- [ ] A stale `docs/conventions.md` reference appears in an active operational surface and the cross-reference audit fails while still allowing clearly archival phase-history references.
- [ ] The dogfood tweak touches a mirrored doc; tests fail unless the live, template, repo-root skill, and local installed skill copies are updated consistently.
- [ ] `load-context.mjs` cannot find project progress or tracker state from the installed `.claude` path and the setup-gate verification blocks completion.

---
