# Phase 2 — Incorrect Command Recovery & Command-Level Guidance Plan

**Status**: Planning
**Milestone**: Revision 1 — CLI Discoverability & Help
**Task ID Prefix**: R1-2

---

## Goals

- Make unsupported CLI input recoverable by returning a non-zero exit code plus generic recovery guidance that lists the currently available commands.
- Add command-level help for the implemented commands only: `init` and `doctor`.
- Keep placeholder commands such as `link` and `context` out of unknown-command recovery and command-help surfaces.
- Preserve the Phase 1 root-help contract while deferring README and release-facing copy updates to Phase 3.

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Revision 1 — CLI Discoverability & Help document exists and defines Phase 2 scope | Complete |
| Revision 1 Phase 1 — Root Help & Dispatch Contract is complete and establishes the root-help surface | Complete |
| Current runtime supports controlled `unknown-command` outcomes but does not yet render recovery guidance | Complete |
| `init` and `doctor` are the only implemented commands to expose in recovery/help content | Confirmed |
| Placeholder commands `link` and `context` must remain out of surfaced guidance until meaningful behavior exists | Confirmed |
| No new configuration, environment variables, or schema changes are required | Not Required |
| README and release-facing documentation updates are deferred to Revision 1 Phase 3 | Confirmed |

---

## Gate 2.0 — Command Guidance Contract

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| 2.0.1 | Define the generic unknown-command recovery contract, including non-zero exit behavior, error-path output, and a recovery list limited to the currently available commands | 0.75 | None | Independent |
| 2.0.2 | Define the supported command-help invocation contract for `blueprint help init`, `blueprint help doctor`, `blueprint init --help`, and `blueprint doctor --help`, plus fallback behavior for unsupported help targets | 1.0 | 2.0.1 | Dependent |
| 2.0.3 | Introduce a shared implemented-command guidance boundary so root help, command help, and unknown-command recovery all derive surfaced commands from one authoritative implemented-command list | 1.0 | 2.0.1, 2.0.2 | Dependent |

### Gate Acceptance Criteria

- [ ] A single canonical recovery contract exists for unknown commands and unsupported help targets.
- [ ] Supported command-help entrypoints are explicitly defined for `init` and `doctor` only.
- [ ] Unsupported command-help attempts such as `blueprint help ghost` and `blueprint ghost --help` are defined to use the generic unknown-command recovery path.
- [ ] Root help, command help, and recovery guidance share one authoritative implemented-command surface so placeholder commands do not leak into output.

---

## Stream A — Generic Unknown Command Recovery

> Add actionable, non-guessing recovery output for unsupported CLI input.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| A.1 | Implement a shared unknown-command recovery formatter that prints an error message, root usage, and the currently available command list without attempting fuzzy suggestions | 1.0 | Gate | Dependent |
| A.2 | Route plain unknown commands and `<unknown> --help` inputs through the shared recovery path while preserving non-zero exit behavior and stable output capture | 1.0 | A.1 | Dependent |
| A.3 | Verify unsupported help targets and placeholder command names reuse the same generic recovery output instead of receiving bespoke help pages | 0.75 | A.2 | Dependent |

### Stream A Acceptance Criteria

- [ ] Unknown commands exit non-zero and print actionable generic recovery guidance.
- [ ] Recovery guidance remains generic and does not attempt closest-match suggestions.
- [ ] Recovery output lists only `init` and `doctor` as currently available commands.
- [ ] Unsupported help-target inputs use the same recovery path as other unknown commands.

---

## Stream B — Implemented Command Help Surface

> Expose targeted help for implemented commands without executing their workflows.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| B.1 | Add shared command-help metadata/content for `init` and `doctor` so command-targeted help can be rendered without duplicating copy across handlers | 0.75 | Gate | Dependent |
| B.2 | Support `blueprint help <command>` for `init` and `doctor`, rendering command-targeted usage and summary guidance instead of executing the command flow | 1.0 | B.1 | Dependent |
| B.3 | Support `<command> --help` for `init` and `doctor` through the same command-help surface while preserving normal command execution when help is not requested | 1.0 | B.2 | Dependent |

### Stream B Acceptance Criteria

- [ ] `blueprint help init` and `blueprint help doctor` render command-level help successfully.
- [ ] `blueprint init --help` and `blueprint doctor --help` render the same command-level help without triggering onboarding, audit, or repair side effects.
- [ ] Command-help content stays aligned with the actual implemented command surface.
- [ ] Placeholder commands remain excluded from command-level help.

---

## Stream C — Regression Coverage & Boundary Protection

> Lock the new recovery/help contract in place and protect the phase boundaries.
> **Depends on:** Stream A and Stream B

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| C.1 | Update CLI runtime and helper-driven tests to assert non-zero generic recovery output for plain unknown commands and unsupported help-target inputs | 1.0 | A.2 | Dependent |
| C.2 | Add coverage for supported command-help entrypoints so `help <command>` and `<command> --help` for `init` and `doctor` stay aligned and non-executing | 1.0 | B.3 | Dependent |
| C.3 | Add boundary assertions that `link` and `context` do not appear in command-help or recovery surfaces and that Phase 1 root-help behavior remains intact | 0.75 | A.2, B.3 | Dependent |

### Stream C Acceptance Criteria

- [ ] Automated coverage protects generic unknown-command recovery and implemented command-help flows.
- [ ] Tests verify unsupported help targets stay on the unknown-command recovery path.
- [ ] Tests verify `init` and `doctor` help entrypoints do not execute command side effects.
- [ ] Tests verify `link` and `context` remain absent from surfaced recovery/help content.

---

## Parallelization Map

```text
Gate 2.0 (Command Guidance Contract) ──────────────────────┐
                                                            │
                ┌───────────────────────────────────────────┤
                │                                           │
Stream A (Generic Unknown Command Recovery) ─────────────► │
Stream B (Implemented Command Help Surface) ─────────────► │
                │                                           │
                └── Stream C (depends on A + B) ──────────► │
                                                            │
                                                            ▼
                                                  Phase 2 complete
```

---

## Test Plan

> Generated from task analysis. Each testable task has one or more
> tests mapped to it. Tests are written before implementation (TDD)
> during task execution.

### Gate 2.0 Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-2.0.1.1 | 2.0.1 | Integration | Verify unknown commands return a non-zero outcome with generic recovery guidance that lists the currently available commands | Unsupported input exits non-zero and prints recovery guidance limited to `init` and `doctor` |
| T-2.0.2.1 | 2.0.2 | Integration | Verify `blueprint help init`, `blueprint help doctor`, `blueprint init --help`, and `blueprint doctor --help` are recognized as supported command-help entrypoints | Supported implemented-command help variants enter the command-help path and exit successfully |
| T-2.0.2.2 | 2.0.2 | Integration | Verify unsupported help targets such as `blueprint help ghost` and `blueprint ghost --help` do not enter the command-help path | Unsupported help targets fall back to the generic unknown-command recovery path |
| T-2.0.3.1 | 2.0.3 | Integration | Verify root help, command help, and recovery guidance derive visible commands from one authoritative implemented-command list | All surfaced command guidance stays aligned and excludes placeholder commands |

### Stream A Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-A.1.1 | A.1 | Integration | Verify the shared recovery formatter renders an unknown-command message, root usage, and the currently available command list without fuzzy suggestions | Recovery output is actionable, generic, and suggestion-free |
| T-A.2.1 | A.2 | End-to-End | Verify a plain unknown command exits non-zero and prints generic recovery guidance instead of only returning an exit code | `invokeCli(['ghost'])` returns a non-zero exit code and recovery output |
| T-A.2.2 | A.2 | End-to-End | Verify `blueprint ghost --help` exits non-zero and uses the same recovery surface as a plain unknown command | Unsupported help-target input reuses the generic recovery output |
| T-A.3.1 | A.3 | Integration | Verify placeholder command names such as `link` and `context` do not receive bespoke help pages | Placeholder command names remain on the generic recovery path |

### Stream B Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-B.1.1 | B.1 | Integration | Verify command-help metadata exists for `init` and `doctor` and stays separate from placeholder command definitions | Only implemented commands expose command-help content |
| T-B.2.1 | B.2 | End-to-End | Verify `blueprint help init` and `blueprint help doctor` render command-level usage guidance and exit successfully | Help subcommand renders command-targeted guidance without side effects |
| T-B.3.1 | B.3 | End-to-End | Verify `blueprint init --help` renders init help without entering onboarding or scaffold execution | Init command help exits successfully and does not execute the init workflow |
| T-B.3.2 | B.3 | End-to-End | Verify `blueprint doctor --help` renders doctor help without running audit, repair, or prompts | Doctor command help exits successfully and does not execute the doctor workflow |

### Stream C Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-C.1 | C.1 | Integration | Verify CLI helper and runtime-level tests capture non-zero recovery output consistently for unsupported input | Test harness reliably observes generic unknown-command recovery |
| T-C.2 | C.2 | Integration | Verify implemented command-help entrypoints stay aligned across `help <command>` and `<command> --help` | Both help entry styles render matching command guidance for `init` and `doctor` |
| T-C.3.1 | C.3 | Integration | Verify `link` and `context` never appear in command-help or unknown-command recovery content | Placeholder commands stay hidden from surfaced guidance |
| T-C.3.2 | C.3 | Integration | Verify the Phase 1 root-help contract still renders unchanged for `blueprint`, `blueprint help`, `blueprint --help`, and `blueprint -h` | Phase 2 changes do not regress the root-help surface |

### Test Summary

| Component | Total Tasks | Testable | Not Testable |
|-----------|-------------|----------|--------------|
| Gate 2.0 | 3 | 3 | 0 |
| Stream A | 3 | 3 | 0 |
| Stream B | 3 | 3 | 0 |
| Stream C | 3 | 3 | 0 |
| **Total** | **12** | **12** | **0** |

---

## Definition of Done

- [ ] Gate 2.0 acceptance criteria pass.
- [ ] Stream A acceptance criteria pass.
- [ ] Stream B acceptance criteria pass.
- [ ] Stream C acceptance criteria pass.
- [ ] Unknown commands exit non-zero and print generic recovery guidance that lists only `init` and `doctor`.
- [ ] `blueprint help init`, `blueprint help doctor`, `blueprint init --help`, and `blueprint doctor --help` render aligned command-level guidance.
- [ ] Unsupported help targets such as `blueprint help ghost` and `blueprint ghost --help` follow the generic unknown-command recovery path.
- [ ] `link` and `context` remain absent from root help, command help, and recovery surfaces.
- [ ] `init` and `doctor` normal execution paths remain intact when help is not requested.
- [ ] No README or release-facing documentation changes are required in this phase.
- [ ] No lint/typecheck errors exist in files touched by this phase.
- [ ] All tests in the Test Plan pass.

---

## Test Scenarios

### Happy Path

- [ ] Running an unsupported command prints generic recovery guidance and lists the available commands.
- [ ] Running `blueprint help init` and `blueprint help doctor` prints command-level guidance and exits successfully.
- [ ] Running `blueprint init --help` and `blueprint doctor --help` prints command-level guidance without executing command workflows.
- [ ] Running `blueprint`, `blueprint help`, `blueprint --help`, and `blueprint -h` still prints the Phase 1 root-help surface unchanged.

### Edge Cases

- [ ] `blueprint help ghost` does not render a bespoke help page and instead uses generic unknown-command recovery.
- [ ] `blueprint ghost --help` follows the same generic recovery path as other unknown commands.
- [ ] Recovery/help output does not list placeholder commands such as `link` or `context`.
- [ ] Unknown-command recovery remains generic and does not attempt closest-match suggestions.

---
