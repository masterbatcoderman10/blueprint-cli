# Phase 4 - Testing Setup & Release Readiness Plan

**Status**: Planning
**Milestone**: M1 - Project Bootstrap

---

## Goals

- Expand forward-only automated coverage for existing M1 behavior with stronger edge-case and packaged-artifact verification.
- Make the repository release-ready with mandatory GitHub Actions CI and tag-based automated publishing.
- Prepare the package for a public scoped npm release as `@splitwireml/blueprint` while keeping the CLI executable name `blueprint`.
- Add release-facing documentation and README content that accurately presents the current Blueprint CLI experience, including Mermaid diagrams.

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Phase 3 - Template Integrity (`blueprint init` and `blueprint doctor` are implemented and green) | Complete |
| Existing Vitest-based test harness and build/typecheck scripts are available | Complete |
| GitHub repository is available for Actions-based CI/CD | Available |
| npm organization or publishing authority for the `splitwireml` scope is created and can grant publish access | Pending |
| Scoped package release will use the published package name `@splitwireml/blueprint` while retaining the `blueprint` bin command | Confirmed |
| Automated publishing should run only from release tags, not from ordinary branch pushes | Confirmed |

---

## Gate 4.0 - Release Contract & Verification Baseline

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| 4.0.1 | Define the release contract: semver tag trigger format, scoped package identity (`@splitwireml/blueprint`), retained `blueprint` executable, supported Node policy, and public-release boundaries for M1 | 1.0 | None | Independent |
| 4.0.2 | Define the release verification surface shared by local and automated runs: install, typecheck, tests, build, `npm pack`, packaged-install smoke checks, and publish artifact expectations | 1.0 | 4.0.1 | Dependent |
| 4.0.3 | Define the automation/auth boundary for GitHub Actions and npm publishing, including trusted publishing or equivalent repository permissions, public scoped publish settings, and failure behavior when publish prerequisites are missing | 1.0 | 4.0.1 | Dependent |

### Gate Acceptance Criteria

- [ ] The project has a single documented release contract for version tags, package identity, executable name, and supported runtime.
- [ ] Local release verification and CI/CD use the same publish-gate checks rather than diverging ad hoc commands.
- [ ] The publish workflow boundary is explicit about required repository permissions and npm scope access.
- [ ] The phase scope is limited to current M1 functionality and does not imply unreleased commands or cross-project features.

---

## Stream A - Edge-Case Coverage Expansion

> Broaden automated confidence around current CLI behavior and verify that the packaged artifact behaves the same as the local source checkout.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| A.1 | Extend test utilities and fixtures to support release-style verification, including packed tarball install/invocation and isolated temp-project scenarios | 1.0 | Gate | Dependent |
| A.2 | Add edge-case coverage for `blueprint init` around existing project state, markdown discovery/archive boundaries, agent selection outcomes, and scaffold integrity under less-common inputs | 1.5 | A.1 | Dependent |
| A.3 | Add edge-case coverage for `blueprint doctor` around malformed metadata, mixed missing-plus-drifted canonical files, declined repair flows, and post-repair revalidation stability | 1.5 | A.1 | Dependent |
| A.4 | Add packaged-artifact smoke tests that install the built tarball and verify the public `blueprint` executable works for release-critical command paths | 1.0 | A.1 | Dependent |

### Stream A Acceptance Criteria

- [ ] Automated coverage expands materially for `init` and `doctor` edge cases already in product scope.
- [ ] Test fixtures can verify both source-checkout execution and packaged-tarball execution.
- [ ] The packed CLI artifact can be installed and invoked successfully under the retained `blueprint` executable name.
- [ ] New tests remain forward-only and do not introduce brittle assertions about unimplemented commands.

---

## Stream B - CI/CD Automation

> Enforce the release gate automatically in GitHub Actions and publish from tags instead of manual local release steps.
> **Depends on:** Stream A (`A.4` packaged-artifact smoke verification) and Stream C (`C.1` scoped package metadata).

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| B.1 | Add reusable workflow entrypoints or npm release-check scripts so CI and release automation run the same install, verification, build, and package commands | 0.75 | Gate | Dependent |
| B.2 | Implement mandatory GitHub Actions CI for pushes and pull requests covering dependency install, typecheck, tests, build, and package verification on the supported Node runtime | 1.0 | B.1 | Dependent |
| B.3 | Implement tag-triggered automated publishing for `@splitwireml/blueprint`, including public scoped publish behavior and repository-to-npm authentication for GitHub Actions | 1.5 | B.1, C.1 | Dependent |
| B.4 | Add release safeguards and verification: semver-tag filtering, duplicate-publish protection, packaged-smoke reuse, and clear failure reporting when publish prerequisites or post-publish checks fail | 1.0 | A.4, B.2, B.3 | Dependent |

### Stream B Acceptance Criteria

- [ ] Pull requests and pushes cannot bypass the required release-gate checks.
- [ ] Ordinary branch pushes never publish a package.
- [ ] A valid release tag can trigger automated publication of the scoped public package when npm scope access is configured.
- [ ] Release automation fails clearly when authentication, scope setup, or artifact verification is incomplete.

---

## Stream C - Package Identity & Public Docs

> Prepare the public package surface so npm consumers see accurate metadata, installation guidance, and feature documentation.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| C.1 | Update package metadata for scoped public release: package name `@splitwireml/blueprint`, retained `blueprint` bin, repository/homepage/bugs/license metadata, keywords, publish visibility, and publish artifact curation | 1.0 | Gate | Dependent |
| C.2 | Author a release-facing `README.md` with scoped install instructions, current command usage, Mermaid diagrams, and clear boundaries around what M1 does and does not support yet | 1.5 | C.1 | Dependent |
| C.3 | Document maintainer-facing release prerequisites and workflow details, including npm scope setup, tag-based publishing expectations, and any required repository configuration for automated releases | 0.75 | C.1, C.2 | Dependent |

### Stream C Acceptance Criteria

- [ ] Package metadata matches the intended scoped public release shape.
- [ ] Public documentation accurately reflects implemented M1 functionality without overpromising future milestone features.
- [ ] `README.md` includes Mermaid diagrams that render the current CLI workflow clearly.
- [ ] Maintainers can discover the external prerequisites required to publish `@splitwireml/blueprint`.

---

## Parallelization Map

```text
Gate 4.0 (Release Contract & Verification Baseline) ─────┐
                                                          │
                 ┌────────────────────────────────────────┼──────────────┐
                 │                                        │              │
Stream A (Edge-Case Coverage Expansion) ────────────────► │              │
Stream C (Package Identity & Public Docs) ──────────────► │              │
                 │                                        │              │
                 └── Stream B (CI/CD Automation)          │              │
                     depends on A.4 + C.1 ──────────────► │              │
                                                          │              │
                                                          ▼              │
                                                Phase 4 complete ◄───────┘
```

---

## Test Plan

> Generated from task analysis. Each testable task has one or more
> tests mapped to it. Tests are written before implementation (TDD)
> during task execution.

### Gate 4.0 Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-4.0.1.1 | 4.0.1 | Unit | Verify release-tag parsing accepts the documented semver trigger format and rejects malformed or non-release tags | Only valid release tags match the contract and ineligible tags are filtered out |
| T-4.0.1.2 | 4.0.1 | Integration | Verify the documented release contract and package metadata agree on package identity `@splitwireml/blueprint`, retained `blueprint` executable, and supported Node policy | Release documentation and package metadata expose a single consistent contract |
| T-4.0.2.1 | 4.0.2 | Integration | Verify the shared release-check entrypoint runs install, typecheck, tests, build, `npm pack`, and packaged smoke verification in the documented order | Local and automated verification execute the full release gate successfully from one shared path |
| T-4.0.2.2 | 4.0.2 | Integration | Verify CI and release automation both call the same release-check entrypoint instead of duplicating divergent commands | Workflow definitions reuse the shared verification contract without ad hoc drift |
| T-4.0.3.1 | 4.0.3 | Integration | Verify publish execution fails early with actionable output when npm scope access, auth, or repository publishing prerequisites are missing | Release automation stops before publish with clear prerequisite guidance |
| T-4.0.3.2 | 4.0.3 | Integration | Verify non-publish validation runs do not require publish credentials or release-only permissions | CI validation succeeds without npm publish secrets when no release tag is involved |

### Stream A Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-A.1.1 | A.1 | Integration | Verify test helpers can create isolated temp projects and execute CLI flows without cross-test state leakage | Release-style test fixtures produce clean disposable projects for each scenario |
| T-A.1.2 | A.1 | Integration | Verify test helpers can install an `npm pack` tarball into an isolated temp project and invoke the packaged `blueprint` executable | Tarball-based fixture setup succeeds and can run packaged CLI smoke flows |
| T-A.2.1 | A.2 | End-to-End | Verify `blueprint init` handles existing Blueprint project state without silently overwriting protected user-owned files | Existing-project edge cases fail or recover with clear behavior and preserved protected files |
| T-A.2.2 | A.2 | End-to-End | Verify `blueprint init` respects markdown discovery and archive boundaries in less-common but valid project layouts | Markdown migration/archive behavior stays within intended project boundaries |
| T-A.2.3 | A.2 | End-to-End | Verify `blueprint init` preserves scaffold integrity across alternate agent selections and atypical valid inputs | Scaffolded output remains complete and internally consistent for supported input combinations |
| T-A.3.1 | A.3 | End-to-End | Verify `blueprint doctor` reports malformed metadata with actionable validation output instead of crashing | Doctor exits cleanly with a clear validation/reporting result for malformed metadata |
| T-A.3.2 | A.3 | End-to-End | Verify `blueprint doctor` handles projects containing both missing and drifted canonical files in a single analysis and repair cycle | Doctor reports and repairs combined integrity issues without losing track of either class |
| T-A.3.3 | A.3 | End-to-End | Verify declining repair leaves the project unchanged, and accepting repair yields a stable clean revalidation | No-op decline flow preserves files while repair flow ends in a clean post-repair audit |
| T-A.4.1 | A.4 | End-to-End | Verify the packed tarball installs successfully and exposes the public `blueprint` executable after installation | Packaged artifact installation produces a runnable `blueprint` command |
| T-A.4.2 | A.4 | End-to-End | Verify the packed artifact includes required runtime assets such as `dist/` output and bundled `templates/`, then supports release-critical M1 command paths | Installed tarball contains all required assets and can execute `init` and `doctor` smoke flows |

### Stream B Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-B.1.1 | B.1 | Integration | Verify the local release-check script succeeds by delegating to the shared verification entrypoint | One reusable command path drives release verification locally |
| T-B.1.2 | B.1 | Integration | Verify the shared release-check path includes package verification and packaged smoke reuse rather than CI-only special cases | Release-check logic remains centralized and package-aware |
| T-B.2.1 | B.2 | Integration | Verify the CI workflow triggers on `push` and `pull_request`, targets the supported Node runtime, and runs install, typecheck, tests, build, and package verification | GitHub Actions enforces the complete release gate on normal integration events |
| T-B.2.2 | B.2 | Integration | Verify a failure in any required gate step causes CI to fail clearly with actionable signal | Broken install, typecheck, test, build, or pack verification blocks the workflow |
| T-B.3.1 | B.3 | Integration | Verify the publish workflow triggers only from the documented semver release tags | Ordinary branch pushes and non-release tags do not start npm publication |
| T-B.3.2 | B.3 | Integration | Verify the publish workflow targets `@splitwireml/blueprint`, uses public scoped publish settings, and is wired for the chosen repository-to-npm auth mode | Release automation is configured for the correct public scoped package target |
| T-B.4.1 | B.4 | Integration | Verify duplicate publish or existing-version attempts fail safely with explicit reporting | Repeat release attempts stop cleanly without silent corruption of release state |
| T-B.4.2 | B.4 | Integration | Verify post-pack or post-publish verification failures stop the release and surface clear failure output | Release automation does not report success when artifact verification fails |

### Stream C Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-C.1.1 | C.1 | Integration | Verify `package.json` exposes the scoped package name, retained bin, repository/homepage/bugs/license metadata, keywords, and public publish configuration | Package metadata matches the intended public release surface for npm consumers |
| T-C.1.2 | C.1 | Integration | Verify `npm pack` output contains only the intended published artifact set | Packed tarball includes curated release files and excludes non-release clutter |
| T-C.2.1 | C.2 | Integration | Verify `README.md` includes scoped install instructions, current command usage, Mermaid diagrams, and explicit M1 scope boundaries | Public README content covers the implemented release surface without overpromising future features |
| T-C.2.2 | C.2 | Integration | Verify README examples stay aligned with implemented CLI commands and the actual package/bin names | Documentation examples reflect real M1 behavior and the correct install/invocation names |
| T-C.3.1 | C.3 | Integration | Verify maintainer release documentation covers npm scope setup, tag-based publishing flow, auth prerequisites, and failure guidance | Maintainers can discover the external setup and recovery steps required for release |
| T-C.3.2 | C.3 | Integration | Verify maintainer documentation stays aligned with the implemented release contract and workflow files | Release docs remain consistent with the actual CI/publish implementation surface |

### Test Summary

| Component | Total Tasks | Planned Tests | Testable | Not Testable |
|-----------|-------------|---------------|----------|--------------|
| Gate 4.0 | 3 | 6 | 3 | 0 |
| Stream A | 4 | 10 | 4 | 0 |
| Stream B | 4 | 8 | 4 | 0 |
| Stream C | 3 | 6 | 3 | 0 |
| **Total** | **14** | **30** | **14** | **0** |

---

## Definition of Done

- [ ] Gate 4.0 acceptance criteria pass.
- [ ] Stream A acceptance criteria pass.
- [ ] Stream B acceptance criteria pass.
- [ ] Stream C acceptance criteria pass.
- [ ] The package is configured for public scoped release as `@splitwireml/blueprint`.
- [ ] The CLI executable remains `blueprint` after packaging and installation.
- [ ] GitHub Actions CI enforces install, typecheck, test, build, and package verification on push and pull request workflows.
- [ ] Tag-based release automation exists and is isolated from ordinary branch pushes.
- [ ] README and maintainer documentation cover installation, usage, release flow, and publish prerequisites.
- [ ] Forward-only automated coverage includes additional edge cases for current M1 commands plus packaged-artifact smoke verification.
- [ ] Full local release verification passes for the code and workflows touched by this phase.
- [ ] All tests in the Test Plan pass.

---

## Test Scenarios

### Happy Path
- [ ] A pull request runs the required GitHub Actions checks and passes typecheck, tests, build, and package verification.
- [ ] Creating a valid semver release tag publishes `@splitwireml/blueprint` automatically and leaves the CLI executable name as `blueprint`.
- [ ] Installing the packed artifact or published scoped package exposes the `blueprint` command and supports release-critical M1 command flows.
- [ ] The public README renders correctly, including Mermaid diagrams, install steps, and current command guidance.
- [ ] `blueprint init` and `blueprint doctor` retain green behavior under expanded edge-case coverage.

### Edge Cases
- [ ] A non-release tag or non-semver tag does not trigger a package publish.
- [ ] Release automation fails with actionable output when npm scope access or repository publishing permissions are missing.
- [ ] Packaged-artifact smoke checks catch missing runtime files such as `dist/` output or bundled `templates/`.
- [ ] Scoped-package configuration publishes publicly rather than defaulting to a restricted/private package state.
- [ ] Duplicate or repeated release attempts fail safely without silently corrupting release state.
- [ ] README examples and package metadata stay aligned with implemented M1 commands and do not advertise future milestone behavior.
- [ ] Edge-case tests cover malformed manifest data, combined drift scenarios, and no-op/declined repair paths without destabilizing existing green flows.

---
