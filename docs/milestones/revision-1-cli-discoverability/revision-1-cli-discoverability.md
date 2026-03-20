# Revision 1 — CLI Discoverability & Help

> Improve the Blueprint CLI's first-run and error-path guidance so users and agents can discover available commands from the terminal without guessing invocation patterns.

---

## What Is Changing

The current CLI runtime exits quietly when `blueprint` is invoked with no subcommand, and unknown commands return a controlled non-zero outcome without the richer recovery guidance expected from a production CLI.

This revision changes the root invocation and error-handling experience so Blueprint is self-discoverable from the command line. The goal is to make the CLI readable and recoverable for both humans and agents while preserving the existing implemented command set.

---

## Why

- Users expect `blueprint` and standard help flags to show available commands and usage guidance.
- Agents and new contributors benefit from root-level usage text instead of silent or minimal outcomes.
- Unknown or incorrect command input should explain what happened and how to recover instead of leaving the user to infer the next step.

---

## Impact Analysis

### Affected Milestones

- **M1 — Project Bootstrap**: current root command behavior, runtime dispatch outcomes, and release-facing CLI documentation all live in Milestone 1 deliverables.

### Affected Phases

- **Phase 1 — CLI Foundation**: root argv handling, runtime dispatch outcomes, and the public command registration surface are affected.
- **Phase 3 — Template Integrity**: the shared command registry already includes `doctor`, so any discoverability/help surface must stay aligned with the actual registered command set.
- **Phase 4 — Testing Setup & Release Readiness**: README examples and release-facing documentation must reflect the revised CLI help behavior.

### Affected Files and Modules

- `src/index.ts`
- `src/runtime/index.ts`
- `src/commands/index.ts`
- `src/commands/init.ts`
- `src/commands/doctor.ts`
- `README.md`
- `tests/helpers/cli.ts`
- Existing CLI runtime, smoke, and documentation-alignment tests under `tests/stream-a/`, `tests/stream-b/`, `tests/phase-3/`, and `tests/phase-4/`

### Affected Existing Tests

The following current tests verify the old behavior and are expected to be updated or replaced as part of this revision:

- `tests/stream-a/runtime-contract.test.ts`
- `tests/stream-a/command-placeholders.test.ts`
- `tests/stream-b/runtime-contract.test.ts`
- `tests/stream-b/smoke.test.ts`
- `tests/stream-b/helpers.test.ts`
- `tests/phase-3/stream-b/doctor-command.test.ts`
- `tests/phase-4/stream-c/readme.test.ts`

### Dependency Notes

- No active planned work in `project-progress.md` depends on the current silent no-command behavior.
- Regression risk is concentrated around dispatch semantics, command registration alignment, and README/example drift.

---

## Revision Phases

### Phase 1 — Root Help & Dispatch Contract

> Redefine the root CLI invocation contract so empty argv and standard root help flags render useful usage text instead of quiet exits.

- Establish the root help rendering contract for `blueprint`, `blueprint help`, `blueprint --help`, and `blueprint -h`
- Update runtime/entrypoint behavior to route empty argv and root help variants through the help surface
- Preserve controlled exit semantics while making root discoverability explicit

### Phase 2 — Incorrect Command Recovery & Command-Level Guidance

> Make incorrect or unrecognized command input actionable by pairing non-zero exits with recovery-oriented guidance.

- Render helpful recovery output for unknown commands
- Support command-targeted help variants such as `blueprint help <command>` and `<command> --help`
- Keep currently implemented commands aligned with the surfaced help content and avoid advertising unimplemented features as available now

### Phase 3 — Documentation & Regression Coverage Alignment

> Update release-facing docs and automated coverage so the revised CLI contract is explicit and protected.

- Update README command usage and first-run guidance to match the implemented help surface
- Refresh CLI helper, smoke, and runtime tests to assert the new behavior
- Add forward-only coverage for supported help-entry variants and error-path guidance

---

## Phase Dependencies

```text
Phase 1 → Phase 2 → Phase 3
```

---

## Success Criteria

- [ ] Running `blueprint` with no subcommand prints useful usage/help output instead of exiting silently.
- [ ] Root help variants (`blueprint help`, `blueprint --help`, `blueprint -h`) are supported and produce aligned guidance.
- [ ] Unknown or incorrect commands exit non-zero and print actionable recovery guidance.
- [ ] Help output reflects the actual implemented command set and does not misrepresent future commands as available.
- [ ] README and terminal-facing examples match the revised CLI behavior.
- [ ] Existing tests that encode the old no-command behavior are updated or replaced, and new regression coverage protects the discoverability surface.

---
