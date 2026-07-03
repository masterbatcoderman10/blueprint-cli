# Phase 6 — Migrate & Alignment-Complete Commands Plan

**Status**: Planning
**Milestone**: Revision 11 — Skill-Based Agent Surface
**Phase ID prefix**: R11-6

---

## Goals

- Add `blueprint alignment-complete` so completed alignment can be recorded by flipping alignment markers in supported root agent files.
- Add `blueprint migrate` so legacy Blueprint projects can move to skill mode in place.
- Install the bundled skill payload during migration into both supported project-local skill roots.
- Convert existing supported root agent files to skill-mode templates during migration.
- Delete legacy `docs/core/**` during migration rather than archiving it.
- Keep Doctor, command help, and deprecation-banner behavior coherent after migration.

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Revision 11 Phase 1 — alignment marker introduced and skill-mode scaffold authored | Complete |
| Revision 11 Phase 2 — Doctor mode detection and skill canonical-set enforcement | Complete |
| Revision 11 Phase 3 — conventions sunset and legacy deprecation banner | Complete |
| Revision 11 Phase 4 — repo-root skill payload and release surface | Complete |
| Revision 11 Phase 5 — blueprint-cli repo dogfooded under skill mode | Complete |
| MAS-211 — Alignment-Complete Command | approved-pending-implementation |
| MAS-212 — In-Place Skill Migration Command | approved-pending-implementation |

---

## Gate R11-6.0 — Command Foundation

> Establish the shared project-mutation helpers and CLI command surface used by both new commands.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R11-6.0.1 | Add shared supported-agent-file and alignment-marker helpers for discovering existing root `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, and `QWEN.md` files and reading each file's marker state. | 0.5 | None | Independent |
| R11-6.0.2 | Add shared skill-mode migration helpers for copying `templates/skills/blueprint/**` into both supported skill roots, converting existing supported root agent files from `templates/skill/**`, preserving or adding alignment markers, deleting `docs/core/**`, and updating or bootstrapping the manifest. | 1.5 | R11-6.0.1 | Dependent |
| R11-6.0.3 | Register `alignment-complete` and `migrate` in the existing command runtime and add root/command help summaries without changing unrelated command behavior. | 0.5 | R11-6.0.1 | Dependent |
| R11-6.0.4 | Add temporary-project test helpers for legacy-mode, skill-mode, marker-state, manifest, and `docs/core/**` migration fixtures. | 0.75 | R11-6.0.2, R11-6.0.3 | Dependent |

### Gate Acceptance Criteria

- [ ] Supported root agent file discovery is shared by both commands.
- [ ] Alignment marker parsing has explicit states for required, complete, missing, and absent file.
- [ ] Migration helpers reuse existing template and Doctor primitives where practical.
- [ ] Both commands are visible through the same runtime/help surfaces as existing implemented commands.
- [ ] Test fixtures can build small representative Blueprint projects without duplicating full scaffold setup.

---

## Stream A — Alignment-Complete Command

> Implement MAS-211: flip alignment markers in existing supported root agent files and report marker state clearly.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R11-6.A.1 | Implement `blueprint alignment-complete`: resolve the Blueprint project root, scan existing supported root agent files, replace `alignment-required` markers with `alignment-complete`, leave already-complete files unchanged, report missing-marker files, and skip absent supported files. | 1.0 | Gate | Dependent |
| R11-6.A.2 | Add concise command output and help text covering changed, already-complete, missing-marker, skipped, and outside-project outcomes. | 0.5 | R11-6.A.1 | Dependent |
| R11-6.A.3 | Add focused command tests for multi-file marker flipping, idempotent reruns, missing-marker reporting, absent supported files, and outside-project failure. | 1.0 | R11-6.A.1 | Dependent |

### Stream A Acceptance Criteria

- [ ] `alignment-required` becomes `alignment-complete` in every existing supported root agent file that has the required marker.
- [ ] Rerunning the command on complete files exits successfully without rewriting them.
- [ ] Files with no supported marker are reported and left unchanged.
- [ ] Missing supported root files are skipped without error.
- [ ] Running outside a Blueprint project fails with an actionable message.

---

## Stream B — Migrate Command

> Implement MAS-212: convert a Blueprint project to skill mode in place and remove the legacy core-module tree.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R11-6.B.1 | Implement project-root and mode handling for `blueprint migrate`, including idempotent behavior when the project is already skill mode and clear failure outside a Blueprint project. | 0.75 | Gate | Dependent |
| R11-6.B.2 | Install or refresh the bundled skill payload into `.claude/skills/blueprint/**` and `.agents/skills/blueprint/**`, matching `templates/skills/blueprint/**`. | 0.75 | R11-6.B.1 | Dependent |
| R11-6.B.3 | Convert every supported root agent file that exists in the codebase to the corresponding skill-mode template from `templates/skill/**`, preserving any existing alignment marker state and adding `alignment-required` when no marker exists. | 1.0 | R11-6.B.1 | Dependent |
| R11-6.B.4 | Delete `docs/core/**` outright after skill payload and root entry points are in place, then update or bootstrap `docs/.blueprint/manifest.json` so `managedFiles` matches existing supported root agent files. | 0.75 | R11-6.B.2, R11-6.B.3 | Dependent |
| R11-6.B.5 | Add migration tests covering legacy-to-skill conversion, already-skill rerun, both skill install roots, root entry-point conversion, marker preservation/addition, `docs/core/**` deletion, manifest update, Doctor mode, and deprecation-banner suppression after migration. | 1.5 | R11-6.B.4 | Dependent |

### Stream B Acceptance Criteria

- [ ] Running `blueprint migrate` on a legacy Blueprint project leaves it in skill mode.
- [ ] Both `.claude/skills/blueprint/**` and `.agents/skills/blueprint/**` exist and match the bundled skill template payload.
- [ ] Existing root `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, and `QWEN.md` files are converted to skill-mode templates.
- [ ] Alignment marker state is preserved when present; missing marker state becomes explicit `alignment-required`.
- [ ] `docs/core/**` is deleted with no archive directory.
- [ ] Manifest `managedFiles` matches the supported root agent files that exist after migration.
- [ ] Doctor detects skill mode after migration and the legacy deprecation banner no longer emits.
- [ ] Rerunning migration does not recreate `docs/core/**` or damage an already migrated project.

---

## Stream C — Active Documentation & Cross-References

> Replace Phase 6 forward-looking language with current command guidance once the commands exist.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R11-6.C.1 | Update active command documentation surfaces for `alignment-complete` and `migrate`, including README, help text expectations, alignment guidance, release docs if they mention the deferred first-party path, and skill/reference mirrors where applicable. | 0.75 | R11-6.A.2, R11-6.B.4 | Dependent |
| R11-6.C.2 | Run an active-surface cross-reference audit for stale "coming in Phase 6" language, obsolete `docs/core/**` primary-routing instructions after migration, and contradictory migrate/install guidance. | 0.5 | R11-6.C.1 | Dependent |
| R11-6.C.3 | Add doc-contract coverage for active command docs and allowed archival references so future changes cannot reintroduce stale deferred-command guidance. | 0.75 | R11-6.C.2 | Dependent |

### Stream C Acceptance Criteria

- [ ] Active docs describe `blueprint alignment-complete` and `blueprint migrate` as available commands, not deferred work.
- [ ] Alignment guidance names the real `alignment-complete` command behavior and missing-marker reporting.
- [ ] Migration guidance states that `docs/core/**` is deleted during migration.
- [ ] Skill/template/source mirrors stay byte-identical where existing contracts require it.
- [ ] Historical milestone/phase references remain allowed only as archival history.

---

## Stream D — Verification & Progress Bookkeeping

> Close the revision phase with targeted command verification, full suite verification, and progress updates.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R11-6.D.1 | Run targeted Phase 6 command and doc-contract tests, then run `npm test`; fix failures attributable to Phase 6. | 1.0 | R11-6.A.3, R11-6.B.5, R11-6.C.3 | Dependent |
| R11-6.D.2 | Run `npm run release:pack:verify` as a release-surface guard because migration installs packaged skill payload surfaces. | 0.5 | R11-6.D.1 | Dependent |
| R11-6.D.3 | Update `docs/srs.md` to activate MAS-211 and MAS-212, and update `docs/project-progress.md` to mark Revision 11 Phase 6 complete with command behavior and verification evidence. | 0.5 | R11-6.D.2 | Dependent |

### Stream D Acceptance Criteria

- [ ] Targeted Phase 6 tests pass.
- [ ] `npm test` is green.
- [ ] `npm run release:pack:verify` is green or any inability to run it is recorded with the blocking reason.
- [ ] MAS-211 and MAS-212 are activated only after implementation and verification complete.
- [ ] Project progress records Phase 6 completion and the final Revision 11 status.

---

## Parallelization Map

```text
Gate R11-6.0 (command foundation) ───────────────────────────────────────────┐
                                                                              │
                 ┌────────────────────────────────────────────────────────────┤
                 │                                                            │
  Stream A (alignment-complete command) ─────────────────────────────────────►│
  Stream B (migrate command) ────────────────────────────────────────────────►│
                 │                                                            │
                 └── Stream C (active docs + cross-references)
                     depends on A + B ──────────────────────────────────────►│
                                                                              │
                     Stream D (verification + progress)
                     depends on A + B + C ──────────────────────────────────►│
                                                                              │
                                                                              ▼
                                                                Phase R11-6 complete
```

---

## Definition of Done

- [ ] Gate R11-6.0 acceptance criteria pass
- [ ] Stream A acceptance criteria pass
- [ ] Stream B acceptance criteria pass
- [ ] Stream C acceptance criteria pass
- [ ] Stream D acceptance criteria pass
- [ ] `blueprint alignment-complete` is implemented, help-documented, idempotent, and tested
- [ ] `blueprint migrate` is implemented, help-documented, idempotent, deletes `docs/core/**`, and is tested
- [ ] Doctor detects migrated projects as skill mode
- [ ] Active docs no longer describe these commands as deferred Phase 6 work
- [ ] MAS-211 and MAS-212 are active after implementation

---

## Test Scenarios

### Happy Path
- [ ] A project with all four root agent files containing `alignment-required` runs `blueprint alignment-complete`, and all four files contain `alignment-complete`.
- [ ] A legacy project with `docs/core/**` runs `blueprint migrate`, receives both local skill installs, converted root agent files, no `docs/core/**`, and a manifest matching existing supported root files.
- [ ] Running Doctor after migration reports skill mode with no legacy deprecation recommendation.

### Edge Cases
- [ ] `alignment-complete` reruns against already-complete files without changing them.
- [ ] `alignment-complete` reports root agent files that lack any supported marker.
- [ ] `migrate` preserves complete and required marker states when converting root files.
- [ ] `migrate` adds `alignment-required` to converted files that had no marker.
- [ ] `migrate` reruns on an already migrated skill-mode project without recreating `docs/core/**`.
- [ ] Both commands fail clearly outside a Blueprint project.

---
