# Phase 1 — Root Help & Dispatch Contract Plan

**Status**: Planning
**Milestone**: Revision 1 — CLI Discoverability & Help
**Task ID Prefix**: R1-1

---

## Goals

- Make root Blueprint CLI invocation self-discoverable by rendering minimal help output for empty argv and standard root help flags.
- Surface only commands with meaningful implemented behavior today, keeping root help focused on `init` and `doctor`.
- Centralize the root help path so supported root-level help variants stay aligned without introducing unknown-command recovery or command-specific help in this phase.

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Revision 1 — CLI Discoverability & Help document exists and defines Phase 1 scope | Complete |
| Existing CLI runtime and command registry are implemented in the current M1 codebase | Complete |
| `init` and `doctor` are the only commands with meaningful current behavior to advertise in minimal help | Confirmed |
| Unknown-command recovery is deferred to Revision 1 Phase 2 | Confirmed |
| Command-specific help flows such as `blueprint help init` and `blueprint init --help` are deferred to Revision 1 Phase 2 | Confirmed |
| No new configuration, environment variables, or schema changes are required | Not Required |

---

## Gate 1.0 — Root Help Contract

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| 1.0.1 | Define the supported root-help invocation contract for `blueprint`, `blueprint help`, `blueprint --help`, and `blueprint -h`, including consistent success exit behavior | 0.75 | None | Independent |
| 1.0.2 | Define the minimal root help content contract: usage line, short descriptions for `init` and `doctor`, and explicit omission of placeholder-only commands from the surfaced command list | 0.75 | 1.0.1 | Dependent |
| 1.0.3 | Introduce a shared root-help render/dispatch boundary so all supported root-help variants can flow through one path without duplicating behavior | 1.0 | 1.0.1, 1.0.2 | Dependent |

### Gate Acceptance Criteria

- [ ] A single canonical contract exists for the four supported root-help invocations.
- [ ] Root help content is explicitly limited to commands with meaningful implemented behavior today.
- [ ] A shared render/dispatch boundary exists so root help behavior does not drift across aliases.
- [ ] The phase boundary is explicit: unknown-command recovery and command-specific help are not included here.

---

## Stream A — Root Dispatch Wiring

> Route supported root-level invocations through the shared help path without interfering with real command dispatch.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| A.1 | Update root CLI invocation so empty argv resolves to the shared root help path instead of a quiet no-command outcome | 0.75 | Gate | Dependent |
| A.2 | Route `help`, `--help`, and `-h` through the same shared root help path with aligned exit behavior and output structure | 1.0 | A.1 | Dependent |
| A.3 | Verify and preserve normal dispatch for concrete implemented commands so `init` and `doctor` continue to execute rather than being intercepted by root help routing | 0.5 | A.2 | Dependent |

### Stream A Acceptance Criteria

- [ ] `blueprint`, `blueprint help`, `blueprint --help`, and `blueprint -h` all render the same root help surface.
- [ ] Supported root-help invocations exit successfully and deterministically.
- [ ] `blueprint init` and `blueprint doctor` still dispatch to their command handlers normally.
- [ ] No incorrect-command recovery behavior is introduced in this stream.

---

## Stream B — Minimal Help Copy & Regression Coverage

> Implement concise root help text and protect the new root-level contract with focused automated coverage.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| B.1 | Implement a minimal root help formatter that prints usage guidance plus concise `init` and `doctor` summaries without advertising deferred commands or richer help flows | 0.75 | Gate | Dependent |
| B.2 | Update CLI helper, smoke, and runtime tests to assert root-help output and stable exit semantics for empty argv and explicit root help aliases | 1.0 | Gate | Dependent |
| B.3 | Add regression assertions that root help omits placeholder-only commands such as `link` and `context` from the meaningful command list and does not imply command-specific help support yet | 0.75 | B.2 | Dependent |

### Stream B Acceptance Criteria

- [ ] Root help output is concise, actionable, and aligned across the supported root-help aliases.
- [ ] Automated coverage protects the new empty-argv and root-help behaviors from regression.
- [ ] Tests verify that minimal help surfaces only currently meaningful commands.
- [ ] The phase does not overpromise Phase 2 capabilities such as unknown-command recovery or per-command help pages.

---

## Parallelization Map

```text
Gate 1.0 (Root Help Contract) ─────────────────────┐
                                                    │
                ┌───────────────────────────────────┤
                │                                   │
Stream A (Root Dispatch Wiring) ──────────────────► │
Stream B (Minimal Help Copy & Regression Coverage)► │
                                                    │
                                                    ▼
                                          Phase 1 complete
```

---

## Test Plan

> Generated from task analysis. Each testable task has one or more
> tests mapped to it. Tests are written before implementation (TDD)
> during task execution.

### Gate 1.0 Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-1.0.1.1 | 1.0.1 | Integration | Verify `blueprint`, `blueprint help`, `blueprint --help`, and `blueprint -h` are all recognized as supported root-help invocations | Each supported root-help invocation returns a successful exit outcome and enters the root-help path |
| T-1.0.1.2 | 1.0.1 | Integration | Verify supported root-help invocations share the same success exit semantics rather than mixing no-command and handled outcomes unpredictably | All supported root-help invocations exit deterministically with aligned success behavior |
| T-1.0.2.1 | 1.0.2 | Integration | Verify root help output includes a usage line plus concise summaries for `init` and `doctor` | Root help renders the minimal required content contract |
| T-1.0.2.2 | 1.0.2 | Integration | Verify root help omits placeholder-only commands such as `link` and `context` from the meaningful surfaced command list | Root help advertises only currently meaningful commands |
| T-1.0.3.1 | 1.0.3 | Integration | Verify all supported root-help aliases flow through one shared render/dispatch path and produce aligned output | Root-help aliases do not drift in output shape or behavior |

### Stream A Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-A.1 | A.1 | End-to-End | Verify invoking the CLI with empty argv prints root help to stdout instead of returning the prior quiet no-command behavior | `invokeCli([])` returns exit code `0` and non-empty root help output |
| T-A.2.1 | A.2 | End-to-End | Verify `blueprint help`, `blueprint --help`, and `blueprint -h` each render root help successfully | Each explicit root-help alias produces successful root help output |
| T-A.2.2 | A.2 | Integration | Verify the explicit root-help aliases produce aligned output structure rather than separate ad hoc responses | `help`, `--help`, and `-h` return matching or intentionally normalized root-help output |
| T-A.3.1 | A.3 | Integration | Verify `blueprint init` still dispatches to the init command path rather than being intercepted by root-help routing | Init invocation reaches the init handler path and does not render root help |
| T-A.3.2 | A.3 | Integration | Verify `blueprint doctor` still dispatches to the doctor command path rather than being intercepted by root-help routing | Doctor invocation reaches the doctor handler path and does not render root help |

### Stream B Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-B.1.1 | B.1 | Integration | Verify the minimal root help formatter renders concise usage guidance without advertising deferred capabilities | Output remains short, actionable, and limited to the current phase scope |
| T-B.1.2 | B.1 | Integration | Verify root help copy includes `init` and `doctor` but does not imply command-specific help flows yet | Output reflects current capabilities without mentioning deferred command-help behavior |
| T-B.2.1 | B.2 | Integration | Verify CLI helper and smoke tests capture stdout/stderr and stable exit semantics for empty argv and root-help aliases | Existing CLI test harness can assert the revised root-help contract reliably |
| T-B.2.2 | B.2 | Integration | Verify repeated root-help invocations remain stable in exit code and output structure | Successive runs produce consistent observable behavior |
| T-B.3.1 | B.3 | Integration | Verify regression coverage explicitly fails if `link` or `context` appear in the meaningful root-help command list | Placeholder-only commands stay excluded from minimal help |
| T-B.3.2 | B.3 | Integration | Verify regression coverage explicitly fails if root help implies `blueprint help <command>` or `<command> --help` support in this phase | Root help does not overpromise Phase 2 command-specific help features |

### Test Summary

| Component | Total Tasks | Testable | Not Testable |
|-----------|-------------|----------|--------------|
| Gate 1.0 | 3 | 3 | 0 |
| Stream A | 3 | 3 | 0 |
| Stream B | 3 | 3 | 0 |
| **Total** | **9** | **9** | **0** |

---

## Definition of Done

- [ ] Gate 1.0 acceptance criteria pass.
- [ ] Stream A acceptance criteria pass.
- [ ] Stream B acceptance criteria pass.
- [ ] `blueprint`, `blueprint help`, `blueprint --help`, and `blueprint -h` render aligned root help output.
- [ ] Root help advertises only `init` and `doctor` as meaningful current commands.
- [ ] `link` and `context` are not surfaced as meaningful root-help actions in this phase.
- [ ] Existing dispatch for `init` and `doctor` remains intact.
- [ ] No unknown-command recovery behavior is introduced in this phase.
- [ ] No command-specific help flows are introduced in this phase.
- [ ] No README or release-facing documentation updates are required in this phase.
- [ ] No lint/typecheck errors exist in files touched by this phase.
- [ ] All tests in the Test Plan pass.

---

## Test Scenarios

### Happy Path

- [ ] Running `blueprint` with no subcommand prints root help with usage guidance and the current `init` and `doctor` command summaries.
- [ ] Running `blueprint help`, `blueprint --help`, and `blueprint -h` prints aligned root help output and exits successfully.
- [ ] Running `blueprint init` still enters the init flow normally after the root-help routing changes.
- [ ] Running `blueprint doctor` still enters the doctor flow normally after the root-help routing changes.

### Edge Cases

- [ ] Root help does not continue the prior quiet-success behavior for empty argv.
- [ ] Root help does not list `link` or `context` as meaningful current commands.
- [ ] Repeated root-help invocations remain stable in output structure and exit code.
- [ ] Unsupported command-specific help flows are not implied by the root help copy in this phase.

---
