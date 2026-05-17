# Revision 4 — Anti-Patterns

This revision introduces a dedicated "Anti-Patterns" section to several core
Blueprint documents. These sections aim to prevent common process failures
observed during system practice and provide explicit "what-not-to-do" guidance
for agents and human maintainers.

---

## Impact Analysis

### 1. PRD Level
- **Status**: Minimal direct impact.
- **Change**: This is a meta-improvement to the Blueprint system execution
  itself. It does not change the features of the `blueprint-cli` tool, but
  improves the quality of its output and process.

### 2. Milestone Level
- **Affected Milestones**:
    - **M1 — Project Bootstrap**: Scaffolding templates in Phase 2 and 3 are
      updated.
    - **Future Milestones**: All future milestones benefit from clearer
      procedural constraints.

### 3. Phase Level
- **Affected Core Modules**:
    - `docs/core/alignment.md`: Add "Don't Rush" anti-pattern.
    - `docs/core/srs-planning.md`: Add "Flat Requirement Lists" anti-pattern.
    - `docs/core/milestone-planning.md`: Add "Milestone Bloat" and "Vague Feature Boundaries" anti-patterns.
    - `docs/core/phase-planning.md`: Add "Bulk Test Planning" and "Ignoring Dependencies" anti-patterns.
    - `docs/core/revision-planning.md`: Add "Shadow Revisions" and "Incomplete Impact Analysis" anti-patterns.
    - `docs/core/git-execution-workflow.md`: Add "Stale Status" and "Unupdated Review Notes" anti-patterns.

### 4. Test Level
- **Affected Tests**:
    - `tests/stream-a/core-templates.test.ts`: No change (files still exist).
    - `tests/stream-a/srs-surface-contract.test.ts`: May need update if content
      assertions are strict.
    - `tests/phase-3/gate-3.0/canonical-structure.test.ts`: No change.

### 5. SRS Level
- **Requirement Updates**:
    - **MAS-177 / MAS-178** (`srs-planning.md`): Materially changed meaning
      (added constraints). Will be superseded by new IDs.
    - **New Requirement (MAS-200)**: Formalize `git-execution-workflow.md`
      as a core module.
    - **Existing R3/R2 requirements**: Will be updated to reflect the new
      guidance.

---

## Success Criteria
- [ ] Core modules (live and templates) contain "Anti-Patterns" sections.
- [ ] SRS is updated with superseding requirements for documentation changes.
- [ ] Project Progress reflects Revision 4 completion.
- [ ] All existing tests pass.

---

## Phases

### Phase 1 — Structural & SRS Foundation
- **Goal**: Define the SRS impact and prepare the document structure.
- **Tasks**:
    - Update SRS with new and superseded requirements.
    - Update `project-progress.md` with Revision 4 pending.

### Phase 2 — Document Updates (Alignment, SRS, Milestone)
- **Goal**: Update `alignment.md`, `srs-planning.md`, and `milestone-planning.md`.
- **Target**: Live files and `templates/`.

### Phase 3 — Document Updates (Phase, Revision, Git Workflow)
- **Goal**: Update `phase-planning.md`, `revision-planning.md`, and `git-execution-workflow.md`.
- **Target**: Live files and `templates/`.

### Phase 4 — Verification & Cleanup
- **Goal**: Ensure all changes are consistent and tests pass.
- **Tasks**:
    - Run `npm test`.
    - Run `blueprint doctor` (via source if applicable).
