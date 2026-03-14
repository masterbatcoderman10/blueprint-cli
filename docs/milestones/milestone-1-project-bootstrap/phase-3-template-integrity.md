# Phase 3 — Template Integrity Plan

**Status**: Planning
**Milestone**: M1 — Project Bootstrap

---

## Goals

- Introduce a user-facing `blueprint doctor` command that audits Blueprint project integrity in an interactive local workflow.
- Add CLI-managed template metadata via `docs/.blueprint/manifest.json` so Blueprint projects record scaffold version and selected managed agent files.
- Enforce exact content matching for canonical Blueprint files: `docs/core/**` and manifest-managed root agent files.
- Detect missing canonical files, content drift, and template-version mismatches, then repair those issues in place from the installed CLI's bundled templates.
- Preserve user-owned project documents (`docs/prd.md`, `docs/project-progress.md`, `docs/conventions.md`) as out-of-scope for exact drift enforcement in this phase.

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Phase 2 — Scaffold Engine (`blueprint init` scaffolds templates and agent files) | Complete |
| Phase 1 — CLI Foundation (command runtime supports new command registration) | Complete |
| Canonical templates exist under `templates/docs/core/` and root-level agent templates | Complete |
| Existing Blueprint projects may be pre-manifest and must remain repairable | Confirmed |
| Editable project docs remain user-owned and excluded from exact content checks | Confirmed |

---

## Gate 3.0 — Integrity Contract

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| 3.0.1 | Define Blueprint metadata contract — template version source, manifest schema at `docs/.blueprint/manifest.json`, managed agent inventory, and backward-compatibility rules for legacy projects | 0.75 | None | Independent |
| 3.0.2 | Update canonical structure rules and template expectations to recognize CLI-managed metadata plus managed root agent files | 1.0 | 3.0.1 | Dependent |
| 3.0.3 | Build integrity inventory utilities — enumerate required Blueprint paths, resolve canonical templates, and load manifest-managed agent selections | 1.0 | 3.0.1, 3.0.2 | Dependent |
| 3.0.4 | Build comparison primitives for exact content matching and template-version mismatch detection | 0.75 | 3.0.3 | Dependent |

### Gate Acceptance Criteria

- [ ] A single manifest schema defines how Blueprint template version and managed agent selections are stored.
- [ ] Canonical Blueprint paths and managed-file rules are explicit and aligned with the scaffolded structure.
- [ ] Shared utilities can resolve bundled templates and determine which files Doctor must audit.
- [ ] Exact content comparison and version mismatch detection are available for downstream command flow.
- [ ] Legacy projects without a manifest are treated as repairable rather than immediately invalid.

---

## Stream A — Manifest & Scaffold Metadata

> Ensure newly initialized Blueprint projects carry the metadata Doctor needs to validate and repair them accurately.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| A.1 | Add shared manifest reader/writer support and a single template version constant used by both `init` and `doctor` | 0.75 | Gate | Dependent |
| A.2 | Extend `blueprint init` scaffold flow to create `docs/.blueprint/manifest.json` with template version, CLI version, and selected managed agent files | 1.0 | A.1 | Dependent |
| A.3 | Update init reporting to surface manifest creation and the managed agent set recorded for the project | 0.5 | A.2 | Dependent |

### Stream A Acceptance Criteria

- [ ] Freshly scaffolded projects include `docs/.blueprint/manifest.json`.
- [ ] Manifest data records the installed template version and which root agent files are managed for that project.
- [ ] `blueprint init` output makes the managed metadata explicit to the user.

---

## Stream B — Doctor Audit & Findings

> Analyze Blueprint integrity and explain all detected issues before any repair is applied.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| B.1 | Add `blueprint doctor` command module and register it with the CLI runtime | 0.5 | Gate | Dependent |
| B.2 | Implement structure audit for required Blueprint directories/files plus missing-manifest detection that preserves legacy compatibility | 1.0 | B.1 | Dependent |
| B.3 | Implement exact content audit for `docs/core/**` and manifest-managed root agent files against bundled templates | 1.5 | B.2 | Dependent |
| B.4 | Implement findings/reporting model that classifies missing files, drifted files, missing manifest bootstrap, and template-version mismatch recommendations | 1.0 | B.3 | Dependent |

### Stream B Acceptance Criteria

- [ ] Doctor reports missing required Blueprint structure clearly.
- [ ] Doctor detects exact content drift in canonical core files and managed agent files.
- [ ] Doctor reports missing manifest as a repairable legacy condition, not a hard stop.
- [ ] Doctor compares project metadata with bundled template version and produces a clear recommendation when versions differ.
- [ ] Editable project docs are not flagged for exact content drift in this phase.

---

## Stream C — Repair & Update Flow

> Apply in-place repairs from bundled templates and verify the project is clean after the repair pass.
> **Depends on:** Stream A (`A.1` shared manifest support and `A.2` scaffold metadata contract) and Stream B (`B.4` structured findings).

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| C.1 | Build repair planner that maps findings to actions: add missing canonical files, replace drifted canonical files, and bootstrap manifest metadata for legacy projects | 1.0 | A.1, B.4 | Dependent |
| C.2 | Implement repair executor that writes canonical files from bundled templates and creates or updates `docs/.blueprint/manifest.json` in place without archive flow | 1.5 | C.1 | Dependent |
| C.3 | Wire Doctor end-to-end: analyze project, present findings, confirm repairs, execute selected fixes, rerun validation, and show final summary | 1.0 | C.2 | Dependent |

### Stream C Acceptance Criteria

- [ ] Doctor can restore missing canonical files from bundled templates.
- [ ] Doctor can replace drifted `docs/core/**` files and managed agent files in place.
- [ ] Doctor can create a manifest for older Blueprint projects that predate manifest support.
- [ ] Doctor reruns validation after repair and reports the post-repair state clearly.
- [ ] Doctor does not archive or preserve replaced canonical files in this phase.

---

## Parallelization Map

```text
Gate 3.0 (Integrity Contract) ──────────────────────┐
                                                     │
                ┌────────────────────────────────────┤
                │                                    │
Stream A (Manifest & Scaffold Metadata) ───────────► │
Stream B (Doctor Audit & Findings) ────────────────► │
                │                                    │
                └── Stream C (Repair & Update Flow)  │
                    depends on A + B ──────────────► │
                                                     │
                                                     ▼
                                           Phase 3 complete
```

---

## Test Plan

> Generated from task analysis. Each testable task has one or more
> tests mapped to it. Tests are written before implementation (TDD)
> during task execution.

### Gate 3.0 Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-3.0.1.1 | 3.0.1 | Unit | Verify manifest schema round-trips `templateVersion`, `cliVersion`, and managed agent selections without field loss | Manifest data serializes and deserializes to the same normalized shape |
| T-3.0.1.2 | 3.0.1 | Unit | Verify manifest validation rejects malformed metadata such as missing version fields or non-array agent selections | Invalid manifest data returns a clear validation failure instead of being treated as valid |
| T-3.0.1.3 | 3.0.1 | Unit | Verify legacy projects without `docs/.blueprint/manifest.json` are classified as repairable bootstrap cases | Missing manifest state is represented explicitly and does not abort integrity analysis |
| T-3.0.2.1 | 3.0.2 | Unit | Verify canonical structure inventory includes `docs/.blueprint/manifest.json`, required `docs/core/**` files, and managed root agent files | Inventory lists every managed path required by the integrity contract |
| T-3.0.2.2 | 3.0.2 | Unit | Verify editable project docs (`docs/prd.md`, `docs/project-progress.md`, `docs/conventions.md`) are excluded from exact content enforcement | Integrity rules mark editable docs as user-owned and out of scope for drift replacement |
| T-3.0.3.1 | 3.0.3 | Unit | Verify template resolver locates bundled `docs/core/**` templates from runtime code | Resolver returns readable template sources for every canonical core file |
| T-3.0.3.2 | 3.0.3 | Unit | Verify template resolver locates bundled root agent templates referenced by manifest-managed selections | Resolver returns valid template sources for each supported managed agent file |
| T-3.0.4.1 | 3.0.4 | Unit | Verify comparison helpers distinguish exact match, missing file, and drifted content states | Comparator returns distinct finding states for clean, missing, and changed content |
| T-3.0.4.2 | 3.0.4 | Unit | Verify version comparison detects mismatches between project manifest metadata and the installed bundled template version | Version check yields recommendation-ready mismatch data without requiring remote lookup |

### Stream A Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-A.1.1 | A.1 | Unit | Verify shared manifest helpers create the metadata directory and write `docs/.blueprint/manifest.json` using the canonical schema | Manifest file is persisted at the expected path with the normalized metadata shape |
| T-A.1.2 | A.1 | Unit | Verify shared manifest helpers read existing metadata consistently for both `init` and `doctor` flows | Both command paths receive the same parsed manifest object for the same project state |
| T-A.1.3 | A.1 | Unit | Verify a single template version constant is exposed to manifest writers and version-check logic | Init and Doctor derive matching template version values from one shared source |
| T-A.2.1 | A.2 | Integration | Verify `blueprint init` creates `docs/.blueprint/manifest.json` in a freshly scaffolded project | Manifest file exists after scaffold with `templateVersion`, `cliVersion`, and managed file metadata present |
| T-A.2.2 | A.2 | Integration | Verify scaffolded manifest records only the user-selected managed root agent files | Manifest agent inventory exactly matches the selected agent files and excludes unselected options |
| T-A.2.3 | A.2 | Integration | Verify `blueprint init` still succeeds when no optional managed agent files are selected beyond the required default entry point | Manifest agent inventory reflects the minimal managed set without introducing extra files |
| T-A.3.1 | A.3 | End-to-End | Verify init summary output reports manifest creation as part of the scaffold results | User-facing summary includes a manifest creation action with the expected destination path |
| T-A.3.2 | A.3 | End-to-End | Verify init summary output lists the managed agent set recorded in the manifest | Summary names the managed root agent files actually written for the project |

### Stream B Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-B.1.1 | B.1 | Integration | Verify `blueprint doctor` is registered in the CLI runtime command list | Runtime registration includes Doctor alongside existing commands |
| T-B.1.2 | B.1 | Integration | Verify CLI dispatch can invoke Doctor through `runCli(['doctor'])` | Command dispatch resolves the Doctor handler and returns a successful exit code for a valid project |
| T-B.2.1 | B.2 | Integration | Verify Doctor reports missing required Blueprint directories and files in an incomplete project | Findings include each missing canonical path with a clear missing-structure classification |
| T-B.2.2 | B.2 | Integration | Verify Doctor treats a missing manifest in a legacy Blueprint project as a repairable bootstrap finding | Audit completes and reports manifest bootstrap required without treating the project as invalid |
| T-B.2.3 | B.2 | Integration | Verify Doctor ignores editable project docs even when they differ from scaffold defaults | No exact-drift finding is emitted for `docs/prd.md`, `docs/project-progress.md`, or `docs/conventions.md` |
| T-B.3.1 | B.3 | Integration | Verify Doctor detects drift in a `docs/core` file whose contents no longer match the bundled template | Findings include the drifted core file with exact-match failure classification |
| T-B.3.2 | B.3 | Integration | Verify Doctor detects drift in a manifest-managed root agent file against its bundled template | Findings include the drifted managed agent file with a repairable drift classification |
| T-B.3.3 | B.3 | Integration | Verify Doctor ignores non-managed root agent files even when their contents differ from bundled templates | No drift finding is emitted for root agent files not recorded as managed in the manifest |
| T-B.3.4 | B.3 | Integration | Verify Doctor reports a clean result when all canonical files match bundled templates | Audit returns no integrity findings and indicates the project is already aligned |
| T-B.4.1 | B.4 | Unit | Verify findings model groups missing files, drifted files, missing manifest bootstrap, and version mismatch recommendations distinctly | Output structure preserves finding type, target path, and repairability for each issue |
| T-B.4.2 | B.4 | Unit | Verify version mismatch findings include recommendation text without implying remote template fetch/update behavior | Output presents local recommendation wording consistent with bundled-template-only operation |

### Stream C Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-C.1.1 | C.1 | Unit | Verify repair planner maps missing canonical files to create-from-template actions | Planner emits create actions for each missing `docs/core/**` or managed root file |
| T-C.1.2 | C.1 | Unit | Verify repair planner maps drifted canonical files to replace-in-place actions | Planner emits replace actions for each drifted managed file using bundled templates as the source |
| T-C.1.3 | C.1 | Unit | Verify repair planner maps missing manifest findings to bootstrap-manifest actions for legacy projects | Planner emits manifest bootstrap work without requiring archive flow |
| T-C.1.4 | C.1 | Unit | Verify repair planner leaves editable project docs and unselected root agent files untouched | Planner excludes out-of-scope files even if they appear changed in the working tree |
| T-C.2.1 | C.2 | Integration | Verify repair executor restores missing `docs/core` files from bundled templates | Missing canonical file is recreated with exact bundled template content |
| T-C.2.2 | C.2 | Integration | Verify repair executor replaces a drifted managed agent file in place without archive flow | Managed agent file matches the bundled template after repair and no archive directory is created |
| T-C.2.3 | C.2 | Integration | Verify repair executor bootstraps `docs/.blueprint/manifest.json` for a legacy project using detected managed agent files | Manifest is created with inferred managed agent inventory, current template version, and CLI version metadata |
| T-C.2.4 | C.2 | Integration | Verify repair executor can apply combined repairs for missing manifest plus drifted canonical files in one run | All planned repairs are written successfully and the project reaches a consistent post-repair state |
| T-C.2.5 | C.2 | Integration | Verify repair executor does not create unselected agent files during repair | Only manifest-managed agent files are written or replaced during the repair pass |
| T-C.3.1 | C.3 | End-to-End | Verify Doctor can analyze, repair, rerun validation, and report a clean result for a drifted legacy Blueprint project | Post-repair audit reports no canonical integrity issues and summary reflects all applied fixes |
| T-C.3.2 | C.3 | End-to-End | Verify Doctor leaves the working tree unchanged when the user declines the repair confirmation step | Findings are reported, no files are rewritten, and the final summary indicates no repair actions were applied |

### Test Summary

| Component | Total Tasks | Planned Tests | Testable | Not Testable |
|-----------|-------------|---------------|----------|--------------|
| Gate 3.0 | 4 | 9 | 4 | 0 |
| Stream A | 3 | 8 | 3 | 0 |
| Stream B | 4 | 11 | 4 | 0 |
| Stream C | 3 | 11 | 3 | 0 |
| **Total** | **14** | **39** | **14** | **0** |

---

## Definition of Done

- [ ] Gate 3.0 acceptance criteria pass.
- [ ] Stream A acceptance criteria pass.
- [ ] Stream B acceptance criteria pass.
- [ ] Stream C acceptance criteria pass.
- [ ] `blueprint init` writes manifest metadata for new Blueprint projects.
- [ ] `blueprint doctor` can audit required structure and exact canonical content for `docs/core/**` plus managed root agent files.
- [ ] Doctor can repair missing/drifted canonical files and bootstrap manifest metadata for legacy projects.
- [ ] Editable project docs remain outside exact drift enforcement and are not rewritten by Doctor.
- [ ] Doctor uses only bundled local templates; no remote template fetch/update behavior is introduced.
- [ ] No archive/backup flow is added for canonical file repairs in this phase.
- [ ] All tests in the Test Plan pass.

---

## Test Scenarios

### Happy Path
- [ ] Running `blueprint init` in a fresh project creates `docs/.blueprint/manifest.json` with the selected agent set.
- [ ] Running `blueprint init` with only the default managed entry point records the minimal managed agent set correctly.
- [ ] Running `blueprint doctor` in a clean Blueprint project reports no canonical integrity issues.
- [ ] Running Doctor on a project missing one canonical `docs/core` file offers repair and restores it from the bundled template.
- [ ] Running Doctor on a project with drifted root agent content replaces the managed file in place and reports a clean revalidation.
- [ ] Running Doctor on a legacy Blueprint project without a manifest creates the manifest and completes validation successfully.

### Edge Cases
- [ ] Doctor surfaces a validation error for malformed manifest contents instead of treating corrupt metadata as valid.
- [ ] Doctor detects a version mismatch between project metadata and bundled templates and presents a clear recommendation without remote fetching.
- [ ] Doctor ignores editable project docs even when their contents differ substantially from scaffolded templates.
- [ ] Doctor repairs only manifest-managed root agent files and does not create unselected agent files unnecessarily.
- [ ] Doctor can repair a project where both the manifest is missing and one or more canonical files have drifted.
- [ ] User declines the repair step after findings are reported, leaving the working tree unchanged.
- [ ] Projects created before manifest support remain diagnosable and repairable without failing the initial audit.

---
