# Phase 1 — CLI Foundation Plan

**Status**: Planning
**Milestone**: M1 — Project Bootstrap

---

## Goals

- Establish a framework-agnostic CLI foundation that supports command registration and execution flow without implementing product commands.
- Set up strict TypeScript project scaffolding and developer scripts for local development.
- Set up a forward-only unit testing baseline (Vitest) with initial smoke coverage for the CLI shell.

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Milestone 1 scope approved | Complete |
| Node.js LTS + npm available in dev environment | Available |
| Packaging/release wiring intentionally deferred to later phase | Confirmed |
| Concrete command surface (`init`, `link`, `context`) deferred | Confirmed |

---

## Gate 1.0 — Tooling Foundation

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| 1.0.1 | Create baseline project layout (`src/`, `src/commands/`, `tests/`) and npm package manifest foundation | 0.5 | None | Independent |
| 1.0.2 | Configure strict TypeScript (`tsconfig`) for Node CLI development and compilation | 0.75 | 1.0.1 | Dependent |
| 1.0.3 | Configure Vitest baseline for TypeScript + Node test execution | 0.75 | 1.0.2 | Dependent |
| 1.0.4 | Add core npm scripts (`dev`, `build`, `typecheck`, `test`) for iterative development | 0.5 | 1.0.2 | Dependent |

### Gate Acceptance Criteria

- [ ] Repository contains a valid TypeScript CLI project skeleton with consistent directory structure.
- [ ] Type checking and test runner commands execute successfully in a clean environment.
- [ ] Vitest runs at least one baseline test file.

---

## Stream A — CLI Runtime Skeleton

> Define the executable and runtime composition surface without implementing command behavior.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| A.1 | Create CLI entrypoint (`src/index.ts`) with process argument handoff and controlled exit path | 0.75 | Gate | Dependent |
| A.2 | Create framework-agnostic command runtime contract (registration + dispatch interfaces) | 1.0 | A.1 | Dependent |
| A.3 | Add placeholder command module boundaries (empty handlers/no-op stubs) for future phases | 0.75 | A.2 | Dependent |

### Stream A Acceptance Criteria

- [ ] CLI entrypoint exists and executes deterministically.
- [ ] Runtime contract cleanly separates parsing/dispatch concerns from command implementations.
- [ ] Placeholder command boundaries are present with no feature behavior implemented.

---

## Stream B — Test Harness Baseline

> Create a sustainable unit-test baseline around the CLI shell and runtime contracts.
> **Depends on:** Stream A (`A.1` executable entrypoint and `A.2` runtime contract).

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| B.1 | Add shared test setup utilities for CLI invocation and output capture | 0.75 | Gate | Dependent |
| B.2 | Add smoke tests for CLI startup and non-crashing no-op execution path | 0.75 | A.1 | Dependent |
| B.3 | Add contract-level tests for runtime registration/dispatch boundaries (without real commands) | 1.0 | A.2, B.1 | Dependent |

### Stream B Acceptance Criteria

- [ ] Test harness can execute CLI-shell tests in isolation.
- [ ] Smoke tests verify CLI startup behavior and stable exit handling.
- [ ] Runtime contract tests protect baseline architecture from regressions.

---

## Parallelization Map

```text
Gate 1.0 (Tooling Foundation) ──────────────┐
                                             │
                ┌────────────────────────────┤
                │                            │
Stream A (CLI Runtime Skeleton) ───────────► │
                │                            │
                └── Stream B (Test Harness)  │
                    depends on A.1 + A.2 ──► │
                                             │
                                             ▼
                                   Phase 1 complete
```

---

## Test Plan

> Generated from task analysis. Each testable task has one or more tests mapped to it.

### Gate 1.0 Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-1.0.1 | 1.0.1 | integration | Verify baseline project layout and package manifest foundation are created correctly. | Required directories/files exist and package manifest is valid for baseline CLI setup. |
| T-1.0.2 | 1.0.2 | integration | Verify strict TypeScript configuration supports Node CLI type-checking and compilation. | `tsconfig` strict settings are active and `npm run typecheck` completes successfully on baseline code. |
| T-1.0.3 | 1.0.3 | integration | Verify Vitest baseline is configured and executable for TypeScript in Node environment. | `npm test` invokes Vitest successfully and executes baseline tests. |
| T-1.0.4 | 1.0.4 | integration | Verify npm scripts (`dev`, `build`, `typecheck`, `test`) are defined and wired correctly. | Each required script exists and runs expected tooling without script/config errors. |

### Stream A Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-A.1 | A.1 | integration | Verify CLI entrypoint handles argv handoff and controlled process exit behavior. | CLI startup path executes deterministically and exits without uncaught failures. |
| T-A.2 | A.2 | integration | Verify runtime contract supports predictable command registration and dispatch boundaries. | Registered handlers resolve correctly and unknown commands return controlled outcomes. |
| T-A.3 | A.3 | unit | Verify placeholder command boundaries are present as no-op stubs without feature logic. | Stub modules are callable and produce no real command side effects. |

### Stream B Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-B.1 | B.1 | unit | Verify shared CLI test utilities provide stable invocation and output capture helpers. | Test helpers capture stdout/stderr and process outcomes consistently across tests. |
| T-B.2 | B.2 | end-to-end | Verify CLI smoke behavior for startup and no-op path under baseline inputs. | CLI starts and exits safely for no-op/empty input without crashes. |
| T-B.3 | B.3 | integration | Verify runtime registration/dispatch contract behavior is protected by baseline tests. | Contract-level tests pass for nominal and error-path dispatch scenarios. |

### Test Summary

| Component | Total Tasks | Testable | Not Testable |
|-----------|-------------|----------|--------------|
| Gate 1.0 | 4 | 4 | 0 |
| Stream A | 3 | 3 | 0 |
| Stream B | 3 | 3 | 0 |
| **Total** | **10** | **10** | **0** |

---

## Definition of Done

- [ ] Gate 1.0 acceptance criteria pass.
- [ ] Stream A acceptance criteria pass.
- [ ] Stream B acceptance criteria pass.
- [ ] All tests in the Test Plan pass.
- [ ] No lint/typecheck errors in files touched by this phase.
- [ ] No command feature behavior (`init`, `link`, `context`) is implemented in this phase.
- [ ] No packaging/release wiring is added in this phase.

---

## Test Scenarios

### Happy Path
- [ ] Running the CLI entrypoint with no feature commands executes safely and exits predictably.
- [ ] `npm test` runs Vitest and passes baseline CLI/runtime tests.
- [ ] `npm run typecheck` passes against Phase 1 code.

### Edge Cases
- [ ] Invalid or empty argument input does not crash the CLI shell.
- [ ] Runtime dispatch with no registered command handlers returns a controlled result.
- [ ] Test runner invocation in a fresh clone surfaces clear errors if setup is incomplete.

---
