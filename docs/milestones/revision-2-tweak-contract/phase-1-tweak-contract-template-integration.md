# Phase 1 — Tweak Contract & Template Integration Plan

**Status**: Planning
**Revision**: Revision 2 — Tweak Contract

---

## Goals

- Blueprint has a formal, lightweight contract for correcting completed tasks within a single phase
- Phase documents include a Tweaks section for tracking in-phase corrections
- Agents can discover and route to the tweak workflow
- Doctor validates the new core file in existing projects

---

## Dependencies

| Dependency | Status |
|------------|--------|
| M1 Phase 2 — Scaffold Engine (templates exist) | Complete |
| M1 Phase 3 — Template Integrity (Doctor exists) | Complete |

---

## Gate R2-1.0 — Tweak Module & Template Updates

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R2-1.0.1 | Create `docs/core/tweak-planning.md` — full tweak contract module defining workflow, rules, tweak section format, and boundary with revisions | 1.5 | None | Independent |
| R2-1.0.2 | Create `templates/docs/core/tweak-planning.md` — identical template copy for scaffolding | 0.25 | R2-1.0.1 | Dependent |
| R2-1.0.3 | Add Tweaks section to PhaseTemplate in `templates/docs/core/phase-planning.md` (after Test Scenarios) | 0.5 | R2-1.0.1 | Dependent |
| R2-1.0.4 | Add tweak routing row to all agent templates (`templates/AGENTS.md`, `templates/CLAUDE.md`, `templates/GEMINI.md`, `templates/QWEN.md`) and live `CLAUDE.md` | 0.5 | R2-1.0.1 | Dependent |
| R2-1.0.5 | Register `docs/core/tweak-planning.md` in `CANONICAL_CORE_FILES` in `src/doctor/structure.ts` | 0.25 | R2-1.0.2 | Dependent |
| R2-1.0.6 | Verify `npm test` passes — all existing tests green, Doctor recognizes new file | 0.25 | R2-1.0.5 | Dependent |

### Gate Acceptance Criteria

- [ ] `docs/core/tweak-planning.md` defines: trigger, scoping, tweak ID format (phase-namespaced, no hyphens), section format, execution flow, test requirements, and revision boundary rule
- [ ] `templates/docs/core/tweak-planning.md` matches the live module exactly
- [ ] Phase template includes an empty Tweaks section at the end with guidance
- [ ] All five agent files route tweak intent to `docs/core/tweak-planning.md`
- [ ] `CANONICAL_CORE_FILES` includes `docs/core/tweak-planning.md`
- [ ] Full test suite passes

---

## Parallelization Map

```
Gate R2-1.0 (sequential — module → templates → registration → verify)
  R2-1.0.1 ──► R2-1.0.2 ──► R2-1.0.5 ──► R2-1.0.6
      │
      ├──► R2-1.0.3
      └──► R2-1.0.4
```

---

## Test Plan

> Generated from task analysis. Each testable task has one or more
> tests mapped to it. Tests are written before implementation (TDD)
> during task execution.

### Gate R2-1.0 Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| — | R2-1.0.1 | — | Not testable: protocol documentation, no runtime behavior | — |
| T-R2-1.0.2.1 | R2-1.0.2 | unit | `tweak-planning.md` is included in resolved core template paths | `resolveAllCoreTemplatePaths()` returns an entry for `docs/core/tweak-planning.md` |
| T-R2-1.0.2.2 | R2-1.0.2 | unit | Template file exists and is non-empty at the expected path | File at `templates/docs/core/tweak-planning.md` exists and has content |
| T-R2-1.0.3 | R2-1.0.3 | unit | Phase-planning template contains a Tweaks section | Template content includes `## Tweaks` heading |
| T-R2-1.0.4.1 | R2-1.0.4 | unit | Each agent template contains tweak routing row | All four templates (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `QWEN.md`) contain `tweak-planning.md` reference |
| T-R2-1.0.5.1 | R2-1.0.5 | unit | `CANONICAL_CORE_FILES` includes `docs/core/tweak-planning.md` | Array contains the entry |
| T-R2-1.0.5.2 | R2-1.0.5 | integration | Doctor audit on a project missing `tweak-planning.md` produces a finding | Audit returns a finding for the missing file |
| T-R2-1.0.5.3 | R2-1.0.5 | integration | Doctor repair restores `tweak-planning.md` without affecting other files | Repair creates the file; re-audit passes clean |
| — | R2-1.0.6 | — | Not testable: meta verification step | — |

### Test Summary

| Component | Total Tasks | Testable | Not Testable |
|-----------|-------------|----------|--------------|
| Gate R2-1.0 | 6 | 4 | 2 |
| **Total** | **6** | **4** | **2** |

---

## Definition of Done

- [ ] Gate acceptance criteria pass
- [ ] All tests in the Test Plan pass
- [ ] No lint errors in files touched by this phase
- [ ] All existing tests remain green
- [ ] `blueprint doctor` detects missing `tweak-planning.md` in projects without it

---

## Test Scenarios

### Happy Path
- [ ] New Blueprint project scaffolded with `blueprint init` includes `tweak-planning.md` in `docs/core/`
- [ ] Phase documents created from template include empty Tweaks section
- [ ] Doctor audit on a project missing `tweak-planning.md` reports it as a finding

### Edge Cases
- [ ] Doctor repair restores `tweak-planning.md` without affecting other core files
- [ ] Existing projects without the Tweaks section in phase docs are not flagged (user-owned content)

---

## Tweaks

> Corrections to completed tasks within this phase are tracked here.
> Each tweak has an ID (e.g., R2-1.TW1), lists affected tasks, and includes test impact.

_None._
