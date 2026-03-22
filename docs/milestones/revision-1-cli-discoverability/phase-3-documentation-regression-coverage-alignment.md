# Phase 3 — Documentation & Regression Coverage Alignment Plan

**Status**: Planning
**Milestone**: Revision 1 — CLI Discoverability & Help
**Task ID Prefix**: R1-3

---

## Goals

- Align public and maintainer-facing documentation with the discoverability/help contract implemented in Revision 1 Phases 1 and 2.
- Keep `link` and `context` visible as coming-soon commands without implying they are part of the currently supported help and recovery surface.
- Add forward-only regression coverage that protects README, release docs, source-checkout CLI flows, and packaged-artifact help behavior from drifting apart.
- Verify the installed `blueprint` executable presents the same revised help and recovery contract that the repository documentation describes.

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Revision 1 document exists and defines Phase 3 scope | Complete |
| Revision 1 Phase 1 — Root Help & Dispatch Contract is complete | Complete |
| Revision 1 Phase 2 — Incorrect Command Recovery & Command-Level Guidance is complete | Complete |
| Existing README and release docs already exist and can be revised in place | Complete |
| Existing source-checkout and packaged-artifact test fixtures are available from Milestone 1 Phase 4 | Complete |
| No new configuration, environment variables, schema changes, or migrations are required | Not Required |
| `link` and `context` should remain documented as coming soon rather than removed from the docs entirely | Confirmed |
| Packaged-artifact smoke coverage should include the revised help flows, not just installed command execution | Confirmed |

---

## Gate 3.0 — Documentation Alignment Contract

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| 3.0.1 | Define the documentation contract for the revised CLI surface: root help, command help, and unknown-command recovery actively guide users to `init` and `doctor` while `link` and `context` remain documented as future-facing commands | 0.75 | None | Independent |
| 3.0.2 | Define the release-documentation contract so README, release contract, and maintainer release guidance all describe the same current help behavior and public CLI boundary without removing coming-soon references | 0.75 | 3.0.1 | Dependent |
| 3.0.3 | Define the regression boundary for this phase: source-checkout tests, packaged-artifact smoke checks, and documentation-alignment assertions must detect drift between implemented help output and release-facing docs | 1.0 | 3.0.1, 3.0.2 | Dependent |

### Gate Acceptance Criteria

- [ ] A single documented contract exists for how current help and recovery guidance should be represented across README and release docs.
- [ ] The contract explicitly distinguishes implemented help surfaces (`init`, `doctor`) from coming-soon documentation references (`link`, `context`).
- [ ] The release-facing boundary is clear: this phase aligns docs and regression coverage to existing behavior rather than expanding the command surface.
- [ ] The regression boundary is explicit for both source-checkout execution and installed packaged-artifact execution.

---

## Stream A — Public README Alignment

> Update user-facing onboarding and command guidance so the README matches the implemented discoverability contract without removing future-facing command mentions.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| A.1 | Revise README quick-start and command-usage sections so root help, command-help entrypoints, and incorrect-command recovery are described using the implemented `init`/`doctor` guidance surface | 1.0 | Gate | Dependent |
| A.2 | Keep `link` and `context` documented as coming soon while clarifying that current guided help output surfaces only implemented commands today | 0.75 | A.1 | Dependent |
| A.3 | Tighten README examples and wording so install instructions, executable naming, release-contract link, and command examples stay consistent with the current CLI output and do not overpromise unsupported help targets | 0.75 | A.1 | Dependent |

### Stream A Acceptance Criteria

- [ ] README accurately describes the current first-run, help, and recovery experience.
- [ ] `link` and `context` remain present only as coming-soon documentation references.
- [ ] README examples align with the real `blueprint` package/executable contract and supported help entrypoints.
- [ ] README does not imply that placeholder commands currently participate in the implemented help surface.

---

## Stream B — Release Contract & Maintainer Docs Alignment

> Align maintainer-facing release docs with the implemented help surface so public release boundaries and publishing guidance stay truthful.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| B.1 | Update `docs/release-contract.md` so the public CLI boundary distinguishes implemented help-guided commands from placeholder commands that remain documented as coming soon | 0.75 | Gate | Dependent |
| B.2 | Update `docs/releasing.md` so maintainer guidance reflects the revised root-help and recovery behavior that shipped in Revision 1 Phases 1 and 2 | 0.75 | Gate | Dependent |
| B.3 | Tighten release-contract and maintainer-doc language so maintainer-facing guidance uses one consistent description of package identity, executable naming, and current CLI expectations | 0.5 | B.1, B.2 | Dependent |

### Stream B Acceptance Criteria

- [ ] Release contract language matches the implemented discoverability/help behavior.
- [ ] Maintainer release docs describe the current CLI surface truthfully without redefining the implemented command set.
- [ ] Release contract and maintainer-facing docs agree on which commands are currently guided by help output and which remain future-facing.
- [ ] Release docs continue to preserve package, executable, and publish-workflow guidance introduced in Milestone 1 Phase 4.

---

## Stream C — Regression Coverage & Packaged Help Smoke

> Protect the aligned documentation and installed CLI behavior with forward-only automated coverage across both local and packaged execution surfaces.
> **Depends on:** Stream A and Stream B

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| C.1 | Extend documentation-alignment tests so README and release docs assert the revised help contract, the preserved coming-soon references, and the explicit `init`/`doctor` guidance boundary | 1.0 | A.3, B.3 | Dependent |
| C.2 | Add source-checkout regression coverage for the revised help-entry and recovery flows where documentation examples or release-facing wording could drift from real CLI behavior | 1.0 | A.3, B.3 | Dependent |
| C.3 | Expand packaged-artifact smoke coverage so an installed `blueprint` binary verifies root help, command help, and unknown-command recovery behave consistently with the documented release surface | 1.0 | C.2 | Dependent |

### Stream C Acceptance Criteria

- [ ] Automated coverage protects README and release-doc wording relevant to the revised CLI contract.
- [ ] Source-checkout regression tests fail if documented help or recovery behavior drifts from actual CLI behavior.
- [ ] Packaged-artifact smoke coverage verifies the installed `blueprint` executable preserves the revised help and recovery surface.
- [ ] New tests remain forward-only and do not require `link` or `context` to become implemented commands.

---

## Parallelization Map

```text
Gate 3.0 (Documentation Alignment Contract) ─────────────┐
                                                         │
                ┌────────────────────────────────────────┤
                │                                        │
Stream A (Public README Alignment) ────────────────────► │
Stream B (Release Contract & Maintainer Docs) ────────► │
                │                                        │
                └── Stream C (depends on A + B) ───────► │
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
| T-3.0.1.1 | 3.0.1 | Integration | Verify the documented CLI guidance contract consistently treats `init` and `doctor` as the implemented help/recovery surface while keeping `link` and `context` out of active guided output | Documentation and tests encode one consistent implemented-command boundary |
| T-3.0.2.1 | 3.0.2 | Integration | Verify README, release contract, and maintainer docs describe the same current help behavior and public CLI boundary | Release-facing docs stay aligned on the revised CLI contract |
| T-3.0.3.1 | 3.0.3 | Integration | Verify the regression plan covers source execution, packaged execution, and documentation alignment rather than relying on a single surface | Drift across docs, local CLI, and installed CLI is detectable by automated coverage |

### Stream A Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-A.1.1 | A.1 | Integration | Verify README quick-start and command sections mention the revised root-help and command-help entrypoints in terms consistent with the implemented CLI behavior | README reflects the current discoverability surface |
| T-A.2.1 | A.2 | Integration | Verify README keeps `link` and `context` as coming-soon references while making clear that guided help output currently surfaces only implemented commands | Future-facing command mentions remain documented without misrepresenting current help output |
| T-A.3.1 | A.3 | Integration | Verify README install, executable, release-contract link, and command examples stay aligned with package metadata and current CLI behavior | README examples remain accurate and release-facing |

### Stream B Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-B.1.1 | B.1 | Integration | Verify `docs/release-contract.md` defines a public CLI boundary that matches the implemented help-guided command surface while preserving coming-soon command references appropriately | Release contract states the public CLI truthfully without implying placeholder commands are implemented guidance targets |
| T-B.2.1 | B.2 | Integration | Verify `docs/releasing.md` reflects the revised discoverability/help behavior relevant to release-facing guidance and installed executable expectations | Maintainer docs stay aligned with the shipped CLI experience |
| T-B.3.1 | B.3 | Integration | Verify README, release contract, and maintainer docs use mutually consistent language for package identity, executable name, and command-guidance boundaries | Public and maintainer docs do not drift from each other |

### Stream C Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-C.1.1 | C.1 | Integration | Verify documentation-alignment tests fail if README or release docs stop distinguishing implemented help-guided commands from coming-soon placeholders | Documentation regressions are caught automatically |
| T-C.2.1 | C.2 | End-to-End | Verify source-checkout CLI examples used by docs remain correct for `blueprint`, root help flags, `help <command>`, and unknown-command recovery | Real CLI behavior matches the documented discoverability contract |
| T-C.2.2 | C.2 | End-to-End | Verify source-checkout regression coverage fails if placeholder commands begin appearing in guided help/recovery surfaces contrary to the documented Phase 3 boundary | Placeholder commands stay out of implemented guidance output |
| T-C.3.1 | C.3 | End-to-End | Verify an installed packed artifact renders root help successfully for `blueprint`, `blueprint --help`, and `blueprint -h` | Installed binary preserves the documented root-help surface |
| T-C.3.2 | C.3 | End-to-End | Verify an installed packed artifact renders `help init`, `help doctor`, and generic unknown-command recovery consistently with source-checkout expectations | Installed binary preserves the documented command-help and recovery behavior |

### Test Summary

| Component | Total Tasks | Testable | Not Testable |
|-----------|-------------|----------|--------------|
| Gate 3.0 | 3 | 3 | 0 |
| Stream A | 3 | 3 | 0 |
| Stream B | 3 | 3 | 0 |
| Stream C | 3 | 3 | 0 |
| **Total** | **12** | **12** | **0** |

---

## Definition of Done

- [ ] Gate 3.0 acceptance criteria pass.
- [ ] Stream A acceptance criteria pass.
- [ ] Stream B acceptance criteria pass.
- [ ] Stream C acceptance criteria pass.
- [ ] README, release contract, and maintainer docs all describe the revised help and recovery surface consistently.
- [ ] `link` and `context` remain documented as coming soon without being represented as implemented help-guided commands.
- [ ] Source-checkout regression tests protect the current root-help, command-help, and unknown-command recovery behavior.
- [ ] Packaged-artifact smoke coverage verifies the installed `blueprint` executable preserves the same help and recovery contract.
- [ ] No new configuration, environment variables, migrations, or schema changes are introduced.
- [ ] No lint/typecheck errors exist in files touched by this phase.
- [ ] All tests in the Test Plan pass.

---

## Test Scenarios

### Happy Path

- [ ] README explains how users discover commands through `blueprint`, root help flags, and supported command-help flows.
- [ ] Release docs describe the current package/executable contract and the revised discoverability/help behavior consistently.
- [ ] Running the CLI from the source checkout matches the behavior described in the revised docs for root help, command help, and unknown-command recovery.
- [ ] Installing the packed artifact and invoking `blueprint` reproduces the same documented help and recovery behavior.

### Edge Cases

- [ ] `link` and `context` remain present in docs only as coming-soon references and do not appear as implemented guided commands in help or recovery output.
- [ ] Unknown-command recovery remains generic and does not drift from the wording or expectations documented for the current CLI surface.
- [ ] Packaged-artifact smoke tests fail if installed help behavior diverges from source-checkout behavior.
- [ ] Documentation alignment tests fail if any release-facing doc reintroduces the old public boundary that treated placeholder commands as fully current guided commands.

---
