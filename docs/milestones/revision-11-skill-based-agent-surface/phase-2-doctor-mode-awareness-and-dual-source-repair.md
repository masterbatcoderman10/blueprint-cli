# Phase 2 — Doctor Mode Awareness & Dual-Source Repair Plan

**Status**: In Progress
**Milestone**: Revision 11 — Skill-Based Agent Surface
**Phase ID prefix**: R11-2

---

## Goals

- Doctor detects project mode by probing for `SKILL.md` at the two canonical skill install bases (`.claude/skills/blueprint/` and `.agents/skills/blueprint/`); projects with neither are legacy mode.
- In skill mode, Doctor enforces the 23-file skill canonical-set (SKILL.md + 21 `reference/*.md` + `scripts/load-context.mjs`) instead of `docs/core/**`.
- In skill mode, Doctor skips `docs/core/` directory and file checks; required directories become `docs`, `docs/tweaks`, and the detected skill install base.
- Repair semantics are mode-aware: missing skill files are restored from `templates/skills/blueprint/`; drifted skill canonical files are reported only (same policy as `docs/core/**` today).
- Doctor report always opens with a `Mode:` header line; legacy mode appends a migration advisory.
- MAS-208 activated in `docs/srs.md` (done inline before phase planning; reflected here for traceability).

---

## Dependencies

| Dependency | Status |
|------------|--------|
| R11 Phase 1 — `templates/skills/blueprint/**` authored and committed | Complete |
| MAS-208 activated in `docs/srs.md` | Complete (done inline 2026-05-25) |
| `src/doctor/structure.ts` — existing `CANONICAL_CORE_FILES`, `REQUIRED_BLUEPRINT_DIRECTORIES`, `EDITABLE_PROJECT_DOCS` baseline | Complete |
| `src/doctor/inventory.ts` — existing `resolveTemplatePath`, `resolveAllCoreTemplatePaths` baseline | Complete |
| `src/doctor/findings.ts` — existing `DoctorAuditResult` interface | Complete |
| `src/doctor/audit.ts` — existing `runDoctorAudit` | Complete |
| `src/doctor/repair.ts` — existing `createRepairPlan` | Complete |
| `src/doctor/report.ts` — existing `renderDoctorReport` | Complete |

---

## Gate R11-2.0 — Mode Detection Foundation

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R11-2.0.1 | Add `ProjectMode = 'skill' \| 'legacy'` type + `SKILL_INSTALL_BASES: string[]` constant (`['.claude/skills/blueprint', '.agents/skills/blueprint']`) + `detectProjectMode(projectDir: string): Promise<{ mode: ProjectMode; skillBase?: string }>` async function to `src/doctor/structure.ts`. Detection: probe each base for `SKILL.md`; first match wins; neither → legacy. | 0.75 | None | Independent |
| R11-2.0.2 | Add `getSkillCanonicalFiles(skillBase: string): string[]` to `src/doctor/structure.ts` — returns the 23-file skill canonical list (all paths relative to projectDir): `${skillBase}/SKILL.md`, `${skillBase}/reference/align.md` … `${skillBase}/reference/tweak.md` (21 reference files matching the Phase 1 rename map), `${skillBase}/scripts/load-context.mjs`. Add `getSkillRequiredDirectories(skillBase: string): string[]` returning `['docs', 'docs/tweaks', skillBase]`. | 0.5 | R11-2.0.1 | Dependent |
| R11-2.0.3 | Update `src/doctor/inventory.ts`: extend `resolveTemplatePath` to handle skill install base paths — when `relativePath` starts with a known skill install base prefix (from `SKILL_INSTALL_BASES`), strip that prefix and remap to `join(TEMPLATES_DIR, 'skills/blueprint', remainder)` (e.g. `.claude/skills/blueprint/reference/align.md` → `templates/skills/blueprint/reference/align.md`). Add `resolveAllSkillTemplatePaths(skillBase: string): Array<{ relativePath: string; absolutePath: string }>` iterating over `getSkillCanonicalFiles(skillBase)` and applying the updated `resolveTemplatePath`. | 0.75 | R11-2.0.1, R11-2.0.2 | Dependent |
| R11-2.0.4 | Add `mode: ProjectMode` and `skillBase?: string` to `DoctorAuditResult` interface in `src/doctor/findings.ts`. | 0.25 | R11-2.0.1 | Dependent |

### Gate Acceptance Criteria

- [ ] `ProjectMode` type and `SKILL_INSTALL_BASES` constant exported from `structure.ts`.
- [ ] `detectProjectMode` returns `{ mode: 'skill', skillBase: '.claude/skills/blueprint' }` when `.claude/skills/blueprint/SKILL.md` exists; `{ mode: 'skill', skillBase: '.agents/skills/blueprint' }` when only the agents path has `SKILL.md`; `{ mode: 'legacy' }` when neither exists.
- [ ] `getSkillCanonicalFiles('.claude/skills/blueprint')` returns exactly 23 entries matching the Phase 1 rename map.
- [ ] `getSkillRequiredDirectories('.agents/skills/blueprint')` returns `['docs', 'docs/tweaks', '.agents/skills/blueprint']`.
- [ ] `resolveTemplatePath('.claude/skills/blueprint/SKILL.md')` returns the absolute path to `templates/skills/blueprint/SKILL.md`.
- [ ] `resolveTemplatePath('.agents/skills/blueprint/reference/align.md')` returns the absolute path to `templates/skills/blueprint/reference/align.md`.
- [ ] `resolveAllSkillTemplatePaths('.claude/skills/blueprint')` returns 23 entries; each `absolutePath` points to an existing file under `templates/skills/blueprint/`.
- [ ] `DoctorAuditResult` has `mode: ProjectMode` and `skillBase?: string` fields; `tsc --noEmit` passes.

---

## Stream A — Audit Mode Awareness

> Thread mode detection through `runDoctorAudit` so directory checks and file checks are mode-branched.
> **Depends on:** Gate R11-2.0 (all four gate tasks complete).

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R11-2.A.1 | Rewrite `runDoctorAudit` in `src/doctor/audit.ts`: (1) call `detectProjectMode(projectDir)` at entry; (2) use `getSkillRequiredDirectories(skillBase!)` instead of `REQUIRED_BLUEPRINT_DIRECTORIES` in skill mode (legacy keeps existing constant); (3) in skill mode, skip the `docs/core/**` file check loop and the `docs/srs.md` missing-file check — instead iterate `resolveAllSkillTemplatePaths(skillBase!)` for missing/drifted detection; (4) in legacy mode preserve all existing behaviour byte-identical; (5) populate `mode` and `skillBase` on the returned `DoctorAuditResult`. | 1.5 | Gate | Dependent |

### Stream A Acceptance Criteria

- [ ] `runDoctorAudit` on a skill-mode project (`.claude/skills/blueprint/SKILL.md` present) does not produce `missing-structure` findings for `docs/core/` directory or any `docs/core/**` file.
- [ ] `runDoctorAudit` on a skill-mode project produces `missing-structure` for any absent non-root skill canonical file (e.g. `.claude/skills/blueprint/reference/align.md` deleted) and `drifted-file` for any skill canonical file whose content differs from the bundled template.
- [ ] `runDoctorAudit` on a legacy project produces the same findings as pre-Phase-2 (regression guard).
- [ ] Returned `DoctorAuditResult` carries `mode: 'skill'` + `skillBase` for skill-mode projects; `mode: 'legacy'` + no `skillBase` for legacy projects.

---

## Stream B — Repair Mode Awareness

> Extend `createRepairPlan` to handle skill canonical files correctly; thread mode through the doctor command.
> **Depends on:** Gate R11-2.0 (all four gate tasks complete). Independent of Stream A.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R11-2.B.1 | Add `mode: ProjectMode` and `skillBase?: string` parameters to `createRepairPlan` signature in `src/doctor/repair.ts`. Update the drifted-file guard: in skill mode, skill canonical files (from `getSkillCanonicalFiles(skillBase!)`) are treated identically to `CANONICAL_CORE_FILES` in legacy mode — reported but not overwritten. Ensure `missing-structure` for a skill file uses the updated `resolveTemplatePath` (already skill-aware after Gate R11-2.0.3) to populate `templatePath` correctly. Thread the new params through `src/commands/doctor.ts`: extract `auditResult.mode` and `auditResult.skillBase` and pass to `createRepairPlan`. | 1.0 | Gate | Dependent |

### Stream B Acceptance Criteria

- [ ] `createRepairPlan` for a skill-mode project with a missing skill file generates a `create-from-template` action with `templatePath` resolving to the correct `templates/skills/blueprint/...` path.
- [ ] `createRepairPlan` for a skill-mode project with a drifted skill canonical file generates no repair action (reported only).
- [ ] `createRepairPlan` for a legacy project behaves byte-identically to pre-Phase-2 (regression guard).
- [ ] `src/commands/doctor.ts` passes `mode` and `skillBase` from `auditResult` to `createRepairPlan`; `tsc --noEmit` passes.

---

## Stream C — Report Mode Header

> Add the `Mode:` header line to `renderDoctorReport`.
> **Depends on:** Gate R11-2.0 (`DoctorAuditResult.mode` field added in R11-2.0.4). Independent of Streams A and B.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R11-2.C.1 | Update `renderDoctorReport` in `src/doctor/report.ts`: prepend a `Mode:` header line before any findings output. Format: `Mode: skill` for skill-mode projects; `Mode: legacy — consider migrating to skill mode` for legacy projects. Line is always emitted (clean or not). | 0.5 | Gate | Dependent |

### Stream C Acceptance Criteria

- [ ] `renderDoctorReport` output for a skill-mode project begins with `Mode: skill`.
- [ ] `renderDoctorReport` output for a legacy project begins with `Mode: legacy — consider migrating to skill mode`.
- [ ] Both the clean-project case and the findings case include the `Mode:` header.

---

## Parallelization Map

```
Gate R11-2.0 (structure + inventory + findings) ────────────────────────┐
                                                                        │
                 ┌──────────────────────────────────────────────────────┤
                 │                  │                  │                │
  Stream A (audit.ts threading) ────────────────────────────────────────►│
  Stream B (repair.ts + doctor.ts) ─────────────────────────────────────►│
  Stream C (report.ts mode header) ─────────────────────────────────────►│
                                                                        │
                                                                        ▼
                                                          Phase R11-2 complete
```

---

## Test Plan

> Generated from task analysis and aligned to the existing Doctor helper / audit / repair / report test families already present in `tests/`. Every task is represented. Tests are written before implementation (TDD) during execution. Framework: Vitest (`*.test.ts` under `tests/`, mirroring `src/`). Pure type-surface work in `R11-2.0.4` is marked not testable because its correctness is enforced by `tsc --noEmit` plus the downstream audit / repair / report behavior tests that consume the new fields.

### Gate R11-2.0 Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R11-2.0.1.1 | R11-2.0.1 | integration | Create temp project fixtures for the three detection states and verify `detectProjectMode(projectDir)` returns `{ mode: 'skill', skillBase: '.claude/skills/blueprint' }` when only `.claude/skills/blueprint/SKILL.md` exists, `{ mode: 'skill', skillBase: '.agents/skills/blueprint' }` when only `.agents/skills/blueprint/SKILL.md` exists, and `{ mode: 'legacy' }` when neither exists | Mode detection returns the correct shape for all three base states |
| T-R11-2.0.1.2 | R11-2.0.1 | integration | Create a fixture with both install bases present and verify first-match-wins behavior is pinned to the `SKILL_INSTALL_BASES` order | `.claude/skills/blueprint` wins over `.agents/skills/blueprint` when both contain `SKILL.md` |
| T-R11-2.0.1.3 | R11-2.0.1 | integration | Create a fixture where a skill tree exists under a supported base but `SKILL.md` itself is absent and verify detection falls back to legacy mode | `detectProjectMode(projectDir)` returns `{ mode: 'legacy' }` when the tree exists without the root probe file |
| T-R11-2.0.1.4 | R11-2.0.1 | unit | Verify `SKILL_INSTALL_BASES` exports exactly `['.claude/skills/blueprint', '.agents/skills/blueprint']` in that order | Constant remains stable and encodes the locked precedence order |
| T-R11-2.0.2.1 | R11-2.0.2 | unit | Verify `getSkillCanonicalFiles('<base>')` returns exactly 23 project-relative paths: `<base>/SKILL.md`, all 21 locked `reference/*.md` files from the Phase 1 rename map, and `<base>/scripts/load-context.mjs` | Canonical skill set is complete, exact, and contains no extra or legacy `docs/core/**` entries |
| T-R11-2.0.2.2 | R11-2.0.2 | unit | Verify `getSkillRequiredDirectories('<base>')` returns exactly `['docs', 'docs/tweaks', '<base>']` for both supported install bases | Required-directory set matches the phase contract for both install locations |
| T-R11-2.0.3.1 | R11-2.0.3 | unit | Verify `resolveTemplatePath()` remaps skill paths under both supported install bases to `templates/skills/blueprint/**` while preserving the remainder exactly | `.claude/.../SKILL.md` and `.agents/.../reference/align.md` resolve to the expected bundled skill template files |
| T-R11-2.0.3.2 | R11-2.0.3 | unit | Parameterized over both skill bases: verify `resolveAllSkillTemplatePaths(skillBase)` returns 23 entries whose `relativePath` values match `getSkillCanonicalFiles(skillBase)` and whose `absolutePath` values point to existing files under `templates/skills/blueprint/` | Full skill template inventory resolves cleanly and every mapped template file exists |
| T-R11-2.0.3.3 | R11-2.0.3 | unit | Regression guard: verify legacy `docs/core/**`, root agent-file, and editable-doc template resolution remains unchanged for the covered legacy paths after the skill-path extension | Existing non-skill template resolution behavior remains unchanged for the covered legacy paths |
| — | R11-2.0.4 | — | Not testable: pure TypeScript interface-surface expansion on `DoctorAuditResult`; correctness is enforced by `tsc --noEmit` and the runtime behavior assertions in Streams A, B, and C | — |

### Stream A Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R11-2.A.1.1 | R11-2.A.1 | integration | Parameterized over `.claude` and `.agents` skill-mode fixtures that intentionally omit the entire `docs/core/` tree and omit `docs/srs.md` while keeping the skill canonical set plus tracker/manifest prerequisites intact: run `runDoctorAudit(projectDir)` and verify the result is clean, reports `mode: 'skill'` with the chosen `skillBase`, and emits no findings for either skipped legacy surface | Clean skill-mode projects audit cleanly regardless of install base and explicitly prove `docs/core/**` plus the `docs/srs.md` missing-file check are skipped in skill mode |
| T-R11-2.A.1.2 | R11-2.A.1 | integration | In a skill-mode fixture, delete a non-root skill canonical file such as `reference/align.md` and drift another skill canonical file; run `runDoctorAudit(projectDir)` | Audit emits `missing-structure` for the missing skill file and `drifted-file` for the drifted skill file using project-relative skill paths |
| T-R11-2.A.1.3 | R11-2.A.1 | integration | In a mixed fixture with both skill install bases present, prove the chosen base is the detected one by placing a missing file only in `.agents/...` first, then only in `.claude/...` | Findings follow the `.claude` tree only; `.agents` gaps are ignored when `.claude` is present |
| T-R11-2.A.1.4 | R11-2.A.1 | integration | In a skill-mode fixture, omit `docs/tweaks/` while leaving the skill tree intact | Audit still reports `missing-structure` for `docs/tweaks/`, proving skill mode keeps shared required-directory checks |
| T-R11-2.A.1.5 | R11-2.A.1 | integration | Regression guard: run `runDoctorAudit(projectDir)` against a legacy fixture missing `docs/core/alignment.md` and `docs/srs.md` | Covered legacy-mode findings remain unchanged and the returned audit result is `{ mode: 'legacy', skillBase: undefined }` |

### Stream B Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R11-2.B.1.1 | R11-2.B.1 | integration | Parameterized over both supported skill bases: feed `createRepairPlan()` findings from a skill-mode audit where one non-root skill canonical file such as `reference/align.md` is missing | Repair plan contains a `create-from-template` action whose `targetPath` is the missing skill file and whose `templatePath` points at `templates/skills/blueprint/...` |
| T-R11-2.B.1.2 | R11-2.B.1 | integration | Feed `createRepairPlan()` findings from a skill-mode fixture with a drifted skill canonical file plus a drifted managed root agent file | Plan creates no repair action for the skill canonical drift, but still emits the normal `replace-in-place` action for the managed agent file |
| T-R11-2.B.1.3 | R11-2.B.1 | integration | Regression guard: compare legacy-mode repair planning for missing `docs/core/**` files, drifted canonical core files, and drifted managed agent files against the covered pre-Phase-2 behavior | Legacy repair semantics are preserved for the covered cases |
| T-R11-2.B.1.4 | R11-2.B.1 | unit | Mock / spy `runDoctorAudit()` and `createRepairPlan()` in `src/commands/doctor.ts` and verify the command passes `auditResult.findings`, `projectDir`, `auditResult.mode`, and `auditResult.skillBase` through to repair planning | Doctor command threads mode metadata into repair planning exactly once per run |
| T-R11-2.B.1.5 | R11-2.B.1 | end-to-end | Run the `doctor` command in a skill-mode fixture with `reference/align.md` missing and verify the command prints the `Mode: skill` header, proposes and applies the skill-template repair, and re-audits cleanly | Command flow proves audit → report → repair plan → execute → re-audit works end to end for a missing non-root skill canonical file |
| T-R11-2.B.1.6 | R11-2.B.1 | end-to-end | Run the `doctor` command in a skill-mode fixture with drifted `reference/align.md` content and verify the report includes the drift, emits no repair action for that file, and does not overwrite the drifted content | Command flow preserves the report-only policy for drifted skill canonical files |

### Stream C Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R11-2.C.1.1 | R11-2.C.1 | unit | Verify `renderDoctorReport()` prepends `Mode: skill` in both the clean-project case and a findings-present case | Skill-mode reports always begin with the required mode header line before the existing body |
| T-R11-2.C.1.2 | R11-2.C.1 | unit | Verify `renderDoctorReport()` prepends `Mode: legacy — consider migrating to skill mode` in both the clean-project case and a findings-present case | Legacy-mode reports always begin with the migration advisory header line before the existing body |

### Test Summary

| Component | Total Tasks | Testable | Not Testable |
|-----------|-------------|----------|--------------|
| Gate R11-2.0 | 4 | 3 | 1 |
| Stream A | 1 | 1 | 0 |
| Stream B | 1 | 1 | 0 |
| Stream C | 1 | 1 | 0 |
| **Total** | **7** | **6** | **1** |

---

## Definition of Done

- [ ] Gate R11-2.0 acceptance criteria pass
- [ ] Stream A acceptance criteria pass
- [ ] Stream B acceptance criteria pass
- [ ] Stream C acceptance criteria pass
- [ ] All tests in the Test Plan pass
- [ ] No lint errors in files touched by this phase
- [ ] Full test suite (`npm test`) green
- [ ] MAS-208 status is `active` in `docs/srs.md` (completed inline before phase execution)

---

## Test Scenarios

### Happy Path

- [ ] `blueprint doctor` in a skill-mode project (`.claude/skills/blueprint/SKILL.md` present, all 23 canonical files intact) prints `Mode: skill` followed by a clean finding and exits 0.
- [ ] `blueprint doctor` in a skill-mode project with a missing `reference/align.md` reports the missing file, generates a `create-from-template` repair action pointing to `templates/skills/blueprint/reference/align.md`, and applies successfully.
- [ ] `blueprint doctor` in a legacy project prints `Mode: legacy — consider migrating to skill mode` and produces findings identical to pre-Phase-2 behaviour.
- [ ] `blueprint doctor` in a skill-mode project with a drifted skill canonical file reports the drift but generates no repair action for it.

### Edge Cases

- [ ] Both `.claude/skills/blueprint/SKILL.md` and `.agents/skills/blueprint/SKILL.md` present → `.claude/` wins (first-match-wins order in `SKILL_INSTALL_BASES`).
- [ ] Neither skill install base present → legacy mode, no skill-related findings.
- [ ] Skill-mode project with `docs/core/` directory present (leftover from a mixed setup) → Doctor does not flag `docs/core/**` files as findings in skill mode.
- [ ] Skill-mode project with a missing `docs/tweaks/` directory → `missing-structure` finding still generated (required in both modes).
- [ ] Legacy project with `docs/core/alignment.md` absent → repair behaviour unchanged from pre-Phase-2.

---
