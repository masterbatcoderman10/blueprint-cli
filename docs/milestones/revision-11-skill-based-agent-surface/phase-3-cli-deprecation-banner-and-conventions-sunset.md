# Phase 3 — CLI Deprecation Banner & Conventions Sunset Plan

**Status**: In Progress
**Milestone**: Revision 11 — Skill-Based Agent Surface
**Phase ID prefix**: R11-3

---

## Goals

- Every CLI invocation against a legacy-mode project emits a one-line, suppressible deprecation banner (`[deprecation] consider migrating to skill mode`) on stderr; root help (`blueprint`, `blueprint --help`, `blueprint -h`) is the only skip.
- Suppression is controllable per-invocation via `--no-deprecation-banner` and persistently via `BLUEPRINT_SUPPRESS_DEPRECATION=1`.
- `docs/conventions.md` is sunsetted: source file deleted, both template mirrors deleted, scaffold-time emission removed from `archive-engine.ts`, Doctor's legacy canonical-set drops the entry.
- The four skill-mode entry-point templates (`templates/skill/{CLAUDE,AGENTS,GEMINI,QWEN}.md`) carry a byte-identical `<ProjectConventions>` section that absorbs the sunsetted `conventions.md` content (Tech Stack, Libraries & Tools, File Structure, Coding Standards, Testing, Anti-Patterns, Anti-Pattern Block Shape, Agent Tools, Releasing, Project-Specific Notes).
- The four legacy-mode entry-point templates (`templates/{CLAUDE,AGENTS,GEMINI,QWEN}.md`) drop `Load docs/conventions.md` from `<SessionStart>` STEP 1 and gain a top-of-file one-line `<DeprecationNote>` block recommending migration; they remain byte-identical to each other.
- `docs/core/alignment.md` and its template mirror drop all `conventions.md` references; the conventions-gathering protocol is rewritten to read from and write into the `<ProjectConventions>` section of the project entry-point file.
- MAS-209 is created (done inline before phase planning, per user direction) and transitions to `active` at phase completion.

---

## Dependencies

| Dependency | Status |
|------------|--------|
| R11 Phase 1 — `templates/skill/**` minimal stubs + skill payload at `templates/skills/blueprint/**` | Complete |
| R11 Phase 2 — `detectProjectMode()` and `SKILL_INSTALL_BASES` constant in `src/doctor/structure.ts` | Complete |
| R11 Phase 2 — Doctor mode-aware canonical-set + `Mode:` header in report | Complete |
| MAS-209 created in `docs/srs.md` (status `approved-pending-implementation`) | Complete (done inline 2026-05-25) |
| `src/index.ts` — existing `runCli` / `main` dispatch surface | Complete |
| `src/runtime.ts` — existing `createCommandRuntime` + argv parsing | Complete |
| R10 Phase 1 parameterized block-identity test across 7 entry-point variants | Complete (will be split into two parallel contracts in this phase) |

---

## Gate R11-3.0 — Banner Foundation

> Wire mode detection into the CLI entry path, parse the suppression flag and env var, build a banner emitter that skips only root help, and emit before any dispatched output. No template or doc changes here.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R11-3.0.1 | Add `src/runtime/deprecation-banner.ts` exporting `DEPRECATION_BANNER_TEXT = '[deprecation] consider migrating to skill mode'`, `DEPRECATION_FLAG = '--no-deprecation-banner'`, `DEPRECATION_ENV_VAR = 'BLUEPRINT_SUPPRESS_DEPRECATION'`, `isDeprecationSuppressed(argv: string[], env: NodeJS.ProcessEnv): boolean` (true if argv contains the flag at any position OR env var is `'1'`), and `consumeDeprecationFlag(argv: string[]): string[]` (returns a copy with the flag stripped so command-level argv parsing is unaffected). | 0.75 | None | Independent |
| R11-3.0.2 | Add `shouldEmitDeprecationBanner(argv: string[]): boolean` to the same module. Returns `false` when argv (after flag strip) is empty / `['--help']` / `['-h']` / `['help']` (matches `isSupportedRootHelpInvocation` rules from `src/help/root.ts`). Returns `true` for `--version`, `<command> --help`, `doctor`, and every other dispatched form. | 0.5 | R11-3.0.1 | Dependent |
| R11-3.0.3 | Add `emitDeprecationBanner(stream: NodeJS.WritableStream = process.stderr): void` to the same module — writes `DEPRECATION_BANNER_TEXT + '\n'` exactly once per process invocation (guard with a module-level `let emitted = false` flag exposed for test reset via `__resetDeprecationBannerForTesting()`). | 0.5 | R11-3.0.1 | Dependent |
| R11-3.0.4 | Update `src/index.ts` `runCli`: after `readProcessArgv` / argv normalisation but before any help parsing or runtime dispatch, (1) detect project mode via `detectProjectMode(process.cwd())`; (2) if `mode === 'legacy'`, evaluate `isDeprecationSuppressed(argv, process.env)` — if not suppressed AND `shouldEmitDeprecationBanner(argv)` returns true, call `emitDeprecationBanner()`; (3) replace `argv` with `consumeDeprecationFlag(argv)` before continuing so downstream parsing never sees the flag. Skill mode and unknown-cwd ⇒ no banner. | 1.0 | R11-3.0.1, R11-3.0.2, R11-3.0.3 | Dependent |

### Gate Acceptance Criteria

- [ ] `src/runtime/deprecation-banner.ts` exports the documented constants and functions; `tsc --noEmit` passes.
- [ ] `isDeprecationSuppressed` returns `true` when argv contains the flag anywhere, when env var is `'1'`, or both; returns `false` otherwise.
- [ ] `consumeDeprecationFlag` strips the flag regardless of position and preserves all other argv tokens in order.
- [ ] `shouldEmitDeprecationBanner` returns `false` for the four root-help shapes (`[]`, `['--help']`, `['-h']`, `['help']`) after flag strip and `true` for `['--version']`, `['<cmd>', '--help']`, `['doctor']`, `['init']`, and every other shape exercised in test.
- [ ] `emitDeprecationBanner` writes the banner exactly once per process invocation; subsequent calls are no-ops until `__resetDeprecationBannerForTesting()` is called.
- [ ] `runCli` invokes the banner emitter exactly once on legacy-mode projects with no suppression and a non-root-help argv; never invokes it on skill-mode projects, never invokes it when suppression is active, and never invokes it on root-help argv shapes.
- [ ] Downstream command-runtime dispatch receives argv with `--no-deprecation-banner` stripped — command-level argument parsing is unaffected.

---

## Stream A — Conventions Sunset & Skill-Mode ProjectConventions Injection

> Delete `conventions.md` everywhere it lives, strip it from scaffold emission, drop it from Doctor's legacy canonical-set, and inject a byte-identical `<ProjectConventions>` block across the four skill-mode entry-point templates.
> **Depends on:** Gate R11-3.0 only nominally (no code overlap with banner module). Independent of Stream B and Stream C.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R11-3.A.1 | Delete `docs/conventions.md`, `templates/conventions.md`, and `templates/docs/conventions.md`. | 0.25 | Gate | Independent |
| R11-3.A.2 | Remove `'conventions.md'` from the `shellFiles` array in `src/init/archive-engine.ts:196`. Verify scaffold integration tests no longer assert the file's presence (update fixtures if they do). | 0.5 | Gate | Independent |
| R11-3.A.3 | Remove `'docs/conventions.md'` from `CANONICAL_CORE_FILES` in `src/doctor/structure.ts`. Verify the legacy canonical-set is now correct without the entry; the skill canonical-set was never affected. | 0.25 | Gate | Independent |
| R11-3.A.4 | Author the canonical `<ProjectConventions>` block as a single string literal in a new shared template-helper file (`templates/skill/_project-conventions.snippet.md`) holding the byte-identical content migrated from the sunsetted `conventions.md` — sections: Tech Stack, Libraries & Tools, File Structure, Coding Standards, Testing, Anti-Patterns, Anti-Pattern Block Shape, Agent Tools, Releasing, Project-Specific Notes. The snippet is the single source of truth; the four entry-point variants inline it verbatim (template-build-time, not runtime). | 0.75 | Gate | Independent |
| R11-3.A.5 | Inline the `<ProjectConventions>` snippet (R11-3.A.4) byte-for-byte into `templates/skill/CLAUDE.md`, `templates/skill/AGENTS.md`, `templates/skill/GEMINI.md`, `templates/skill/QWEN.md`. The four files must remain byte-identical to each other below their first-line title (which is the only allowed point of divergence — none today; all four are currently the same 248-byte stub). | 0.5 | R11-3.A.4 | Dependent |

### Stream A Acceptance Criteria

- [ ] `docs/conventions.md`, `templates/conventions.md`, `templates/docs/conventions.md` are absent from the working tree.
- [ ] `src/init/archive-engine.ts` `shellFiles` no longer contains `'conventions.md'`; scaffold tests pass.
- [ ] `CANONICAL_CORE_FILES` in `src/doctor/structure.ts` does not contain `'docs/conventions.md'`; legacy-mode Doctor on a project missing `docs/conventions.md` emits no finding for the file.
- [ ] `templates/skill/_project-conventions.snippet.md` exists and contains the full migrated conventions content as a `<ProjectConventions>` block.
- [ ] `templates/skill/{CLAUDE,AGENTS,GEMINI,QWEN}.md` each contain the `<ProjectConventions>` block verbatim from the snippet; the four files are byte-identical to each other.

---

## Stream B — Legacy-Mode Template Updates

> Drop the `Load docs/conventions.md` line from legacy-mode `<SessionStart>` STEP 1, add a top-of-file `<DeprecationNote>` block, and re-pin the legacy 4-variant byte-identity contract.
> **Depends on:** Gate R11-3.0 nominally; independent of Stream A and Stream C.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R11-3.B.1 | In `templates/CLAUDE.md`, `templates/AGENTS.md`, `templates/GEMINI.md`, `templates/QWEN.md`: remove the `→ Load docs/conventions.md.` line from `<SessionStart>` STEP 1's "IF project-progress.md is populated" branch. The remaining STEP 1 body keeps the `tracker.md` load and `<ModuleRouting>` GOTO unchanged. | 0.5 | Gate | Independent |
| R11-3.B.2 | In the same four files: prepend a `<DeprecationNote>` block immediately after the top `# AGENTS.md` title (before `<Blueprint>`) with content: `<DeprecationNote>\n  Legacy mode is deprecated. Consider migrating to skill mode for native Claude Code skill discovery and reduced context overhead. See README install instructions or run `blueprint migrate` (coming in Revision 11 Phase 6).\n</DeprecationNote>`. The block must be byte-identical across all four variants. | 0.5 | R11-3.B.1 | Dependent |
| R11-3.B.3 | Update the R10 Phase 1 parameterized block-identity test (location TBD during execution — likely `tests/stream-a/*` or `tests/revision-10/*`) so the legacy-mode block-identity contract now covers only the four legacy variants (`templates/{CLAUDE,AGENTS,GEMINI,QWEN}.md` plus root `CLAUDE.md` / `AGENTS.md` / `GEMINI.md` — verify which 7 the original test enumerated and reduce the assertion to the legacy subset). The skill-mode 4-variant byte-identity is covered separately by R11-3.A.5 / R11-3.C.2. | 0.5 | R11-3.B.2 | Dependent |

### Stream B Acceptance Criteria

- [ ] All four legacy-mode entry-point templates have `<SessionStart>` STEP 1 without any `conventions.md` reference; the `tracker.md` load and `<ModuleRouting>` GOTO remain intact.
- [ ] All four legacy-mode entry-point templates carry an identical top-of-file `<DeprecationNote>` block recommending migration to skill mode.
- [ ] The R10 block-identity parameterized test (post-update) passes against the legacy-mode subset; no test asserts old-style content on legacy variants.
- [ ] Legacy entry-point templates' bodies remain byte-identical to each other below the title line.

---

## Stream C — alignment.md Rewrite & Block-Identity Test for Skill Variants

> Rewrite `docs/core/alignment.md` and its template mirror to stop referencing `conventions.md`; teach the alignment protocol to read from and write into the project entry-point file's `<ProjectConventions>` section. Add a parallel byte-identity contract test for the four skill-mode entry-point templates.
> **Depends on:** Stream A (R11-3.A.5) so the skill-mode templates carry the `<ProjectConventions>` block the test asserts and the rewritten alignment protocol references.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R11-3.C.1 | Rewrite `docs/core/alignment.md` (and its byte-identical mirror `templates/docs/core/alignment.md` as a follow-on edit): drop all 12 `conventions.md` references (lines 48–51, 189, 196, 201, 216, 220, 234, 239, 297, 400 in current state); rewrite the conventions-gathering step to operate on the `<ProjectConventions>` section inside the project's entry-point file (`CLAUDE.md` / `AGENTS.md` / `GEMINI.md` / `QWEN.md`); preserve the user-approval-before-writing protocol and the anti-pattern callout (line 400) — they now apply to the entry-point file edit, not a separate doc. | 1.5 | A.5 | Dependent |
| R11-3.C.2 | Mirror R11-3.C.1 edits byte-for-byte into `templates/docs/core/alignment.md`. Verify with `diff -q`. | 0.25 | C.1 | Dependent |
| R11-3.C.3 | Add a new parameterized block-identity test covering `templates/skill/{CLAUDE,AGENTS,GEMINI,QWEN}.md`: assert all four files' bodies (after the title line) are byte-identical and that each contains the `<ProjectConventions>` block matching the canonical snippet (`templates/skill/_project-conventions.snippet.md`). Locate alongside the existing R10 block-identity test family. | 0.75 | A.5 | Dependent |

### Stream C Acceptance Criteria

- [ ] `docs/core/alignment.md` contains zero occurrences of the string `conventions.md`; the conventions-gathering step reads from and writes into the `<ProjectConventions>` section of the project entry-point file.
- [ ] `templates/docs/core/alignment.md` is byte-identical to `docs/core/alignment.md`.
- [ ] The new skill-mode 4-variant block-identity test passes; tampering with any one of the four skill-mode entry-point templates causes the test to fail.
- [ ] The user-approval anti-pattern from `alignment.md` is preserved (no silent writes to the entry-point file).

---

## Parallelization Map

```
Gate R11-3.0 (banner foundation) ──────────────────────────────────────────┐
                                                                            │
                 ┌──────────────────────────────────────────────────────────┤
                 │                                                          │
  Stream A (conventions sunset + skill ProjectConventions inject) ─────────►│
  Stream B (legacy template updates + legacy block-identity reduction) ────►│
                 │                                                          │
                 └── Stream C (alignment.md rewrite + skill block-identity) │
                     depends on A.5 ──────────────────────────────────────► │
                                                                            │
                                                                            ▼
                                                              Phase R11-3 complete
```

---

## Test Plan

> Generated from task analysis and aligned to the existing CLI runtime, scaffold, Doctor, and template/doc-contract test families already present under `tests/`. Every task in Gate R11-3.0 and Streams A-C is represented. Tests are written before implementation (TDD) during execution. Framework: Vitest (`*.test.ts` under `tests/`, mirroring `src/`). No tasks are marked not testable in this phase because even the markdown/template sunset work changes shipped scaffold and audit behavior that can be pinned through doc-contract, scaffold, and Doctor integration coverage.

### Gate R11-3.0 Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R11-3.0.1.1 | R11-3.0.1 | unit | Verify `isDeprecationSuppressed(argv, env)` returns `true` when `--no-deprecation-banner` appears at the front, middle, or end of argv, when `BLUEPRINT_SUPPRESS_DEPRECATION` is `'1'`, and when both suppression mechanisms are present together | Suppression is enabled only by the documented flag or env var contract and works regardless of argv position |
| T-R11-3.0.1.2 | R11-3.0.1 | unit | Verify `isDeprecationSuppressed(argv, env)` returns `false` when the env var is unset or set to values other than `'1'`, and verify `consumeDeprecationFlag(argv)` strips every banner flag occurrence while preserving the order of all non-flag argv tokens | Only `'1'` suppresses, and downstream argv is preserved exactly apart from flag removal |
| T-R11-3.0.2.1 | R11-3.0.2 | unit | Verify `shouldEmitDeprecationBanner(argv)` returns `false` for the four root-help shapes after flag stripping: `[]`, `['--help']`, `['-h']`, and `['help']` | Root help remains the only banner-skip surface |
| T-R11-3.0.2.2 | R11-3.0.2 | unit | Verify `shouldEmitDeprecationBanner(argv)` returns `true` for `['--version']`, `['doctor']`, `['init']`, `['init', '--help']`, and an unknown-command shape such as `['bogus']` | Version output, command help, normal commands, and other dispatched argv shapes all emit the banner |
| T-R11-3.0.3.1 | R11-3.0.3 | unit | Verify `emitDeprecationBanner()` writes exactly `[deprecation] consider migrating to skill mode\n` to the provided stream, emits only once per process invocation, and re-emits only after `__resetDeprecationBannerForTesting()` is called | Banner text is exact, single-shot, and resettable for harness reuse |
| T-R11-3.0.4.1 | R11-3.0.4 | integration | Parameterized over banner-eligible legacy-mode argv shapes `['--version']`, `['doctor']`, and `['init', '--help']`: run `runCli`, spy on the banner emitter and downstream runtime/command parser, and verify the banner is emitted before dispatch for each non-root-help branch | `runCli` proves root help is the only skip by emitting for version, normal dispatched commands, and command-level help in legacy mode |
| T-R11-3.0.4.2 | R11-3.0.4 | integration | Parameterized over `['--no-deprecation-banner', 'init']` and `['init', '--no-deprecation-banner']` in a legacy-mode fixture: run `runCli`, verify no banner is emitted, and spy on downstream parsing to confirm the received argv has the banner flag removed in both positions | Suppressed command invocations stay silent and never leak `--no-deprecation-banner` into downstream argv parsing |
| T-R11-3.0.4.3 | R11-3.0.4 | integration | Parameterized over skill-mode, non-project/unknown-cwd, root-help, and env-suppressed legacy invocations: verify `runCli` never calls the banner emitter in any of those skip cases | Banner emission is gated exactly to unsuppressed legacy-mode non-root-help invocations |

### Stream A Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R11-3.A.1.1 | R11-3.A.1 | unit (doc-contract) | Verify `docs/conventions.md`, `templates/conventions.md`, and `templates/docs/conventions.md` are absent from the working tree | The sunsetted conventions files are fully removed from live and template surfaces |
| T-R11-3.A.2.1 | R11-3.A.2 | unit | Verify the `shellFiles` collection in `src/init/archive-engine.ts` no longer includes `conventions.md` while retaining the remaining editable root docs | Scaffold root-doc registration drops only the sunsetted file |
| T-R11-3.A.2.2 | R11-3.A.2 | integration | Run scaffold/archive-engine coverage for both legacy-mode and skill-mode init flows and verify no generated project contains `docs/conventions.md` while `docs/project-progress.md`, `docs/prd.md`, and `docs/srs.md` still scaffold correctly | Init stops emitting `docs/conventions.md` without regressing the rest of the editable-root-doc surface |
| T-R11-3.A.3.1 | R11-3.A.3 | unit | Verify `CANONICAL_CORE_FILES` in `src/doctor/structure.ts` no longer contains `docs/conventions.md` | Doctor's legacy canonical-set no longer treats `docs/conventions.md` as required |
| T-R11-3.A.3.2 | R11-3.A.3 | integration | Run legacy-mode Doctor audit/command coverage against a project missing `docs/conventions.md` and verify no `missing-structure` or repair finding is produced for that file | Legacy-mode Doctor accepts post-sunset projects without a conventions file |
| T-R11-3.A.3.3 | R11-3.A.3 | integration | Run skill-mode Doctor/structure coverage against a healthy skill-mode fixture after the canonical-set edit and verify the 23-file skill canonical contract remains unchanged and produces no `docs/conventions.md`-related findings | Removing the legacy conventions file does not perturb the skill-mode canonical surface |
| T-R11-3.A.4.1 | R11-3.A.4 | unit (doc-contract) | Verify `templates/skill/_project-conventions.snippet.md` exists as a single canonical `<ProjectConventions>` block containing the migrated sections: Tech Stack, Libraries & Tools, File Structure, Coding Standards, Testing, Anti-Patterns, Anti-Pattern Block Shape, Agent Tools, Releasing, and Project-Specific Notes | The snippet is the single source of truth and carries the complete migrated conventions structure |
| T-R11-3.A.4.2 | R11-3.A.4 | unit (snapshot) | Compare the `<ProjectConventions>` snippet body against a locked exact-content snapshot derived from the pre-sunset `docs/conventions.md` content so every migrated section body, list item, and example remains intact | The migrated snippet preserves the full conventions content exactly rather than only the section headings |
| T-R11-3.A.5.1 | R11-3.A.5 | unit (mirror) | Verify `templates/skill/{CLAUDE,AGENTS,GEMINI,QWEN}.md` each contain a `<ProjectConventions>` block whose bytes match `templates/skill/_project-conventions.snippet.md` exactly | Every skill-mode entry-point template inlines the canonical snippet verbatim |
| T-R11-3.A.5.2 | R11-3.A.5 | unit (mirror) | Verify the four skill-mode entry-point templates remain byte-identical to each other below the title line after the `<ProjectConventions>` injection | Skill-mode template divergence is prevented across all four variants |

### Stream B Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R11-3.B.1.1 | R11-3.B.1 | unit (doc-contract) | Verify `templates/{CLAUDE,AGENTS,GEMINI,QWEN}.md` no longer contain `Load docs/conventions.md.` in `<SessionStart>` STEP 1 while still retaining the `tracker.md` load and `<ModuleRouting>` handoff | Legacy-mode entry-point templates remove only the conventions load and keep the rest of the bootstrap flow intact |
| T-R11-3.B.2.1 | R11-3.B.2 | unit (doc-contract) | Verify the same four legacy-mode templates prepend the exact `<DeprecationNote>` block immediately after the title line and before `<Blueprint>` | Every legacy-mode entry-point template carries the locked migration advisory in the required position |
| T-R11-3.B.2.2 | R11-3.B.2 | unit (mirror) | Verify the four legacy-mode entry-point templates remain byte-identical to each other below the title line after the `<DeprecationNote>` addition and `<SessionStart>` edit | Legacy-mode template divergence is prevented across all four variants |
| T-R11-3.B.3.1 | R11-3.B.3 | unit (test-contract) | Verify the updated legacy block-identity test enumerates only the intended legacy entry-point variants and no longer asserts the skill-mode template files | The existing R10 identity guard is correctly re-scoped to the legacy surface only |
| T-R11-3.B.3.2 | R11-3.B.3 | integration | Mutate one legacy template body in a temporary copy and run the legacy block-identity test family | The updated legacy identity test fails on legacy drift, proving the re-scoped guard still protects the intended surface |

### Stream C Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R11-3.C.1.1 | R11-3.C.1 | unit (doc-contract) | Verify `docs/core/alignment.md` contains zero occurrences of `conventions.md` and rewrites the conventions-gathering instructions to read from and write into the project entry-point file's `<ProjectConventions>` section | Alignment protocol fully sunsets `conventions.md` and points at the new source of truth |
| T-R11-3.C.1.2 | R11-3.C.1 | unit (doc-contract) | Verify the rewritten alignment protocol still preserves explicit user approval before writing and keeps the anti-pattern guidance against silent entry-point-file edits | The new alignment flow keeps the existing write-discipline and approval contract intact |
| T-R11-3.C.2.1 | R11-3.C.2 | unit (mirror) | Verify `templates/docs/core/alignment.md` is byte-identical to `docs/core/alignment.md` after the rewrite | Live and template alignment docs remain in lockstep |
| T-R11-3.C.3.1 | R11-3.C.3 | unit (test-contract) | Run the new skill-mode block-identity test and verify it asserts that `templates/skill/{CLAUDE,AGENTS,GEMINI,QWEN}.md` are byte-identical below the title line and that each contains the canonical `<ProjectConventions>` block from the snippet | The new skill-mode identity guard protects both byte identity and snippet fidelity |
| T-R11-3.C.3.2 | R11-3.C.3 | integration | Tamper with one skill-mode entry-point template body in a temporary copy and run the new skill-mode block-identity test family | The new test fails on any single-template drift, proving it will catch cross-variant divergence |

### Test Summary

| Component | Total Tasks | Testable | Not Testable |
|-----------|-------------|----------|--------------|
| Gate R11-3.0 | 4 | 4 | 0 |
| Stream A | 5 | 5 | 0 |
| Stream B | 3 | 3 | 0 |
| Stream C | 3 | 3 | 0 |
| **Total** | **15** | **15** | **0** |

---

## Definition of Done

- [ ] Gate R11-3.0 acceptance criteria pass
- [ ] Stream A acceptance criteria pass
- [ ] Stream B acceptance criteria pass
- [ ] Stream C acceptance criteria pass
- [ ] All tests in the Test Plan pass
- [ ] No lint errors in files touched by this phase
- [ ] Full test suite (`npm test`) green
- [ ] `docs/conventions.md` and its two template mirrors are absent from the tree
- [ ] Banner manual-smoke: `blueprint --version` in a legacy fixture prints the banner; the same invocation in a skill fixture does not; `BLUEPRINT_SUPPRESS_DEPRECATION=1 blueprint --version` in a legacy fixture suppresses it; `blueprint --no-deprecation-banner init` strips the flag from downstream argv
- [ ] MAS-209 status is `active` in `docs/srs.md` (transition committed as part of phase completion)

---

## Test Scenarios

### Happy Path

- [ ] `blueprint --version` in a legacy-mode project (no `.claude/skills/blueprint/SKILL.md`) prints `[deprecation] consider migrating to skill mode` on stderr followed by the version string on stdout.
- [ ] `blueprint init` in a skill-mode project (`.claude/skills/blueprint/SKILL.md` present) prints no deprecation banner; init proceeds unchanged.
- [ ] `BLUEPRINT_SUPPRESS_DEPRECATION=1 blueprint doctor` in a legacy project prints the Doctor `Mode: legacy — consider migrating to skill mode` header but no separate banner line.
- [ ] `blueprint doctor --no-deprecation-banner` in a legacy project suppresses the banner but otherwise runs identically.
- [ ] `blueprint init` (skill mode) scaffolds a project whose `CLAUDE.md` contains the `<ProjectConventions>` block migrated from the sunsetted `conventions.md`; no `docs/conventions.md` is emitted.
- [ ] `blueprint init` (legacy mode) scaffolds a project whose `CLAUDE.md` carries the `<DeprecationNote>` block and whose `<SessionStart>` STEP 1 contains no `conventions.md` reference; no `docs/conventions.md` is emitted.
- [ ] Alignment protocol on an empty project queries the user, gets approval, then writes the conventions content into the entry-point file's `<ProjectConventions>` section (not to `docs/conventions.md`).

### Edge Cases

- [ ] `blueprint` (no args) in a legacy project prints root help with no banner.
- [ ] `blueprint --help` and `blueprint -h` in a legacy project print root help with no banner.
- [ ] `blueprint init --help` in a legacy project prints the command-level help AND the banner (per-command help is not root help).
- [ ] `blueprint --no-deprecation-banner init` and `blueprint init --no-deprecation-banner` both suppress the banner; the flag never reaches the `init` command-argument parser.
- [ ] Doctor on a legacy project that already lost its `docs/conventions.md` (older scaffold) emits no `missing-structure` finding for that file (canonical-set drop in R11-3.A.3).
- [ ] Doctor on a fresh legacy-mode scaffold (post-R11-3) emits no findings related to `conventions.md`.
- [ ] Tampering with any one of the four skill-mode entry-point templates causes the new block-identity test to fail.
- [ ] `BLUEPRINT_SUPPRESS_DEPRECATION=0` (or unset) does not suppress the banner; only `'1'` does.
- [ ] Banner emitter is called once per process even if `runCli` is invoked twice in the same Node process (test harness scenario) — re-emission requires `__resetDeprecationBannerForTesting()`.

---
