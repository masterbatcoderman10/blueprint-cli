# Phase 1 — Skill Authorship & Mode-Aware Scaffold Plan

**Status**: Complete
**Milestone**: Revision 11 — Skill-Based Agent Surface
**Phase ID prefix**: R11-1

---

## Goals

- Ship the complete `blueprint` skill payload under `templates/skills/blueprint/**` so `blueprint init` can scaffold it into new projects.
- Provide `SKILL.md` with an ironclad-invocation frontmatter `description`, a setup gate (populated `docs/project-progress.md` + initialised tracker), a shared-laws reference to `reference/anti-patterns.md`, and an intent-keyed commands/routing table that mirrors the current root `CLAUDE.md` `<ModuleRouting>` 1:1.
- Ship 20 `reference/*.md` files as verbatim mirrors of `docs/core/*.md` modules (with locked file-rename map) plus the new shared `reference/anti-patterns.md` canonical-shape-spec laws file.
- Ship `scripts/load-context.mjs` that prints a markdown brief of current project state to stdout.
- Ship minimal one-liner skill-mode agent entry-point template variants (CLAUDE / AGENTS / GEMINI / QWEN) that point at the blueprint skill — no `<SessionStart>` / `<HardRules>` / `<ModuleRouting>` blocks. The skill owns routing.
- Add `Mode = 'skill' | 'legacy'` to the init type surface; add a mode prompt to the init flow (skill recommended/default, legacy marked "not recommended").
- Branch the scaffold engine so skill mode emits the skill payload + skill-mode entry-point stub into the target project, while legacy mode preserves current scaffold behaviour unchanged.
- Add a post-scaffold init step that writes a hardcoded `<!-- blueprint-status: alignment-required -->` marker line into every scaffolded agent entry-point file (CLAUDE / AGENTS / GEMINI / QWEN) in both modes. The corresponding `alignment-complete` command that flips this marker to `<!-- blueprint-status: alignment-complete -->` is **deferred** to Revision 11 Phase 6 (built alongside the `migrate` command); only the alignment protocol doc update and the init-side marker write land in Phase 1.
- Update `docs/core/alignment.md` (and the byte-identical mirror at `templates/docs/core/alignment.md`) to add a final alignment step instructing the agent to run the deferred `alignment-complete` command after all alignment artifacts are confirmed and committed.
- Leave MAS-208 at status `approved-pending-implementation` (the requirement was written to `docs/srs.md` as pre-phase repair during planning; Phase 2 activates it).

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Revision 11 revision document committed | Complete |
| MAS-208 written to `docs/srs.md` (status `approved-pending-implementation`) | Complete (pre-phase SRS repair, 2026-05-24) |
| Revision 10 complete (canonical `<AntiPatterns>` shape locked) | Complete |
| `docs/core/*.md` — the 20 source modules that Stream A mirrors | Complete |
| `templates/CLAUDE.md` / `AGENTS.md` / `GEMINI.md` / `QWEN.md` (legacy entry-point variants) | Complete |
| Existing `blueprint init` scaffold engine (`src/init/archive-engine.ts`, `onboarding.ts`, `prompts.ts`, `types.ts`) | Complete |

---

## Gate R11-1.0 — Foundation

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R11-1.0.1 | Extend init type surface with `Mode = 'skill' \| 'legacy'`: add `Mode` to `src/init/types.ts`, thread it into the `InitAnswers`/equivalent shape in `src/init/types.ts` + `src/init/prompts.ts`, ensure all downstream call sites compile against the new field | 0.5 | None | Independent |
| R11-1.0.2 | Author `templates/skills/blueprint/SKILL.md` — frontmatter (`name: blueprint`, ironclad-invocation `description`), setup gate (populated `docs/project-progress.md` + `docs/.blueprint/tasks.db` + instruction to install `blueprint-cli` if tracker missing), shared-laws block referencing `reference/anti-patterns.md`, intent-keyed commands/routing table mirroring root `<ModuleRouting>` 1:1 (every routable intent maps to the renamed reference file), and routing rules section | 1.0 | None | Independent |
| R11-1.0.3 | Author `templates/skills/blueprint/reference/anti-patterns.md` — canonical `<AntiPatterns>` shape spec only (drawn from `docs/conventions.md` §"Anti-Pattern Block Shape" + `docs/core/srs-planning.md` exemplar); no per-module `<AntiPattern>` registry | 0.5 | None | Independent |
| R11-1.0.4 | Update `docs/core/alignment.md` to add a final step at the end of the alignment protocol: after all alignment artifacts (PRD / SRS / project-progress) are confirmed and committed, the agent must run the `alignment-complete` command (deferred to Revision 11 Phase 6) which flips the `<!-- blueprint-status: alignment-required -->` marker in the project's agent entry-point file(s) to `<!-- blueprint-status: alignment-complete -->`. Mirror byte-identically to `templates/docs/core/alignment.md` (existing parameterized template-mirror test enforces) | 0.5 | None | Independent |

### Gate Acceptance Criteria

- [ ] `Mode = 'skill' \| 'legacy'` type exists in `src/init/types.ts` and is referenced by the init flow types; `npm run build` (or `tsc --noEmit`) passes.
- [ ] `templates/skills/blueprint/SKILL.md` exists with the required four sections (frontmatter, setup gate, shared-laws ref, commands/routing table); every row in the routing table maps to a renamed reference file path.
- [ ] `templates/skills/blueprint/reference/anti-patterns.md` exists and contains only the canonical `<AntiPatterns>` shape spec (no per-module `<AntiPattern>` entries).
- [ ] `docs/core/alignment.md` final step references the deferred `alignment-complete` command and names the marker strings verbatim (`<!-- blueprint-status: alignment-required -->` → `<!-- blueprint-status: alignment-complete -->`). `templates/docs/core/alignment.md` is byte-identical to the source per existing mirror test.

---

## Stream A — Reference File Mirrors

> Author the 20 `reference/*.md` files as verbatim mirrors of `docs/core/*.md`, each with prepended skill-style frontmatter (`name`, `description`). No content rewriting.

Each task copies a single source file verbatim into the renamed target path under `templates/skills/blueprint/reference/` and prepends a small frontmatter wrapper (`---` block with `name:` and `description:` keys). Source body remains byte-for-byte identical to the corresponding `docs/core/*.md` module. All tasks are Independent — they touch separate files and may run fully in parallel.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R11-1.A.1 | `reference/align.md` ← `docs/core/alignment.md` (verbatim + frontmatter) | 0.25 | Gate | Independent |
| R11-1.A.2 | `reference/blueprint-structure.md` ← `docs/core/blueprint-structure.md` (verbatim + frontmatter) | 0.25 | Gate | Independent |
| R11-1.A.3 | `reference/bug.md` ← `docs/core/bug-resolution.md` (verbatim + frontmatter) | 0.25 | Gate | Independent |
| R11-1.A.4 | `reference/commit.md` ← `docs/core/git-execution-workflow.md` (verbatim + frontmatter) | 0.25 | Gate | Independent |
| R11-1.A.5 | `reference/commit-review.md` ← `docs/core/git-review-workflow.md` (verbatim + frontmatter) | 0.25 | Gate | Independent |
| R11-1.A.6 | `reference/execute.md` ← `docs/core/execution.md` (verbatim + frontmatter) | 0.5 | Gate | Independent |
| R11-1.A.7 | `reference/hierarchy.md` ← `docs/core/hierarchy.md` (verbatim + frontmatter) | 0.25 | Gate | Independent |
| R11-1.A.8 | `reference/orchestrate.md` ← `docs/core/orchestrate.md` (verbatim + frontmatter) | 0.5 | Gate | Independent |
| R11-1.A.9 | `reference/phase-complete.md` ← `docs/core/phase-completion.md` (verbatim + frontmatter) | 0.25 | Gate | Independent |
| R11-1.A.10 | `reference/plan-milestone.md` ← `docs/core/milestone-planning.md` (verbatim + frontmatter) | 0.25 | Gate | Independent |
| R11-1.A.11 | `reference/plan-phase.md` ← `docs/core/phase-planning.md` (verbatim + frontmatter) | 0.5 | Gate | Independent |
| R11-1.A.12 | `reference/plan-prd.md` ← `docs/core/prd-planning.md` (verbatim + frontmatter) | 0.25 | Gate | Independent |
| R11-1.A.13 | `reference/plan-test.md` ← `docs/core/test-planning.md` (verbatim + frontmatter) | 0.25 | Gate | Independent |
| R11-1.A.14 | `reference/planning.md` ← `docs/core/planning.md` (verbatim + frontmatter) | 0.25 | Gate | Independent |
| R11-1.A.15 | `reference/review.md` ← `docs/core/review.md` (verbatim + frontmatter) | 0.5 | Gate | Independent |
| R11-1.A.16 | `reference/revision.md` ← `docs/core/revision-planning.md` (verbatim + frontmatter) | 0.5 | Gate | Independent |
| R11-1.A.17 | `reference/scope-change.md` ← `docs/core/scope-change.md` (verbatim + frontmatter) | 0.25 | Gate | Independent |
| R11-1.A.18 | `reference/srs.md` ← `docs/core/srs-planning.md` (verbatim + frontmatter) | 0.5 | Gate | Independent |
| R11-1.A.19 | `reference/tracker.md` ← `docs/core/tracker.md` (verbatim + frontmatter) | 0.5 | Gate | Independent |
| R11-1.A.20 | `reference/tweak.md` ← `docs/core/tweak-planning.md` (verbatim + frontmatter) | 0.5 | Gate | Independent |

### Stream A Acceptance Criteria

- [ ] All 20 `reference/*.md` files exist at the locked renamed paths under `templates/skills/blueprint/reference/`.
- [ ] Each file body (after stripping the prepended frontmatter block) is byte-identical to the corresponding `docs/core/*.md` module.
- [ ] Each file has a valid YAML frontmatter block with `name:` (kebab-case slug matching filename without `.md`) and `description:` (one-line summary specific enough to disambiguate the routing intent).
- [ ] Every `<AntiPatterns>` block inside any `reference/*.md` conforms to the canonical shape spec recorded in `reference/anti-patterns.md` (R10 P2 shape). No reshaping beyond what is already in the source — sources already conform after R10 Phase 2.

---

## Stream B — Context Loader Script

> Author the `scripts/load-context.mjs` script invoked by the skill setup gate to brief the agent about current project state.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R11-1.B.1 | Author `templates/skills/blueprint/scripts/load-context.mjs` — pure Node ESM script (no external deps), reads `docs/project-progress.md` and parses Project / Milestone / Phase / Status / Pending Revisions sections, probes `docs/.blueprint/` for tracker presence, prints a markdown brief to stdout in the order: `## Project`, `## Current Milestone`, `## Current Phase`, `## Pending Revisions`, `## Tracker`. Exits 0 even when sections are missing (renders `_not set_` or equivalent); exits 1 only on filesystem errors that prevent reading `docs/project-progress.md` at all | 1.0 | Gate | Dependent |

### Stream B Acceptance Criteria

- [ ] `templates/skills/blueprint/scripts/load-context.mjs` exists, executable as `node templates/skills/blueprint/scripts/load-context.mjs` from a project root.
- [ ] Running the script in a populated project prints a markdown brief with all five sections.
- [ ] Running the script in a project with no `docs/.blueprint/` directory prints the `## Tracker` section with an `unreachable` / `not initialised` marker rather than crashing.
- [ ] Running the script in a directory with no `docs/project-progress.md` exits non-zero with a clear stderr message.

---

## Stream C — Skill-Mode Entry-Point Stubs

> Author the four minimal one-liner skill-mode agent entry-point template variants. Each is a tiny file whose sole content is a one-liner instruction pointing the agent at the blueprint skill. No `<SessionStart>`, no `<HardRules>`, no `<ModuleRouting>` — the skill owns all of that.

Location convention: `templates/skill/{CLAUDE,AGENTS,GEMINI,QWEN}.md` (new sibling subdirectory to the existing top-level legacy `templates/CLAUDE.md` / `AGENTS.md` / `GEMINI.md` / `QWEN.md`). The scaffold engine selects which directory to copy from based on `Mode`.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R11-1.C.1 | Author `templates/skill/CLAUDE.md` — minimal one-liner instructing Claude Code to invoke the `blueprint` skill at session start and on any planning/execution/review/tweak/bug/revision/commit intent | 0.25 | Gate | Independent |
| R11-1.C.2 | Author `templates/skill/AGENTS.md` — same content shape as C.1, addressed at the generic AGENTS.md surface | 0.25 | Gate | Independent |
| R11-1.C.3 | Author `templates/skill/GEMINI.md` — same content shape as C.1, addressed at Gemini CLI | 0.25 | Gate | Independent |
| R11-1.C.4 | Author `templates/skill/QWEN.md` — same content shape as C.1, addressed at Qwen | 0.25 | Gate | Independent |

### Stream C Acceptance Criteria

- [ ] All four `templates/skill/{CLAUDE,AGENTS,GEMINI,QWEN}.md` files exist.
- [ ] Each file is ≤ 20 lines (intentionally minimal one-liner stubs with optional context line).
- [ ] None of the four files contain the strings `<SessionStart>`, `<HardRules>`, or `<ModuleRouting>` (negative-content guarantee).
- [ ] Each file references the `blueprint` skill by name in the body.

---

## Stream D — Scaffold Engine + Init Branch

> Wire the new templates into `blueprint init`: add the mode prompt, branch the scaffold engine on the chosen `Mode`, and verify end-to-end that skill mode emits the new payload while legacy mode is unchanged.

> **Depends on:** Stream A (reference mirrors exist), Stream B (`load-context.mjs` exists), Stream C (skill-mode entry-point stubs exist). D.1 and D.2 can start before A/B/C complete (they only need the Gate's `Mode` type), but D.3's end-to-end verification requires the full template payload.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R11-1.D.1 | Add the mode prompt to the init flow in `src/init/onboarding.ts` (and/or `src/init/prompts.ts` if the prompt-rendering layer lives there) — uses `@clack/prompts`, label "Agent surface mode?", options `skill (recommended)` [default] and `legacy (.md modules — not recommended)`, writes the chosen value into the init answers as `mode: Mode` | 0.5 | R11-1.0.1 | Dependent |
| R11-1.D.2 | Branch `src/init/archive-engine.ts` (or wherever the scaffold copy step lives) on `mode`: skill mode copies `templates/skills/blueprint/**` → `<target>/.claude/skills/blueprint/**` AND `templates/skill/{CLAUDE,AGENTS,GEMINI,QWEN}.md` → `<target>/{CLAUDE,AGENTS,GEMINI,QWEN}.md`; legacy mode keeps the existing copy paths (top-level `templates/CLAUDE.md` etc + `templates/docs/core/**`) and is byte-identical in behaviour to today | 1.0 | R11-1.0.1 | Dependent |
| R11-1.D.3 | Add a post-scaffold init step (`src/init/onboarding.ts` or `archive-engine.ts`) that, after the template copy completes, appends a hardcoded `<!-- blueprint-status: alignment-required -->` line to every scaffolded agent entry-point file present at the project root (CLAUDE.md / AGENTS.md / GEMINI.md / QWEN.md). Single code path, mode-agnostic, idempotent (skip if marker already present). | 0.5 | R11-1.D.2 | Dependent |
| R11-1.D.4 | End-to-end smoke verification: from a fresh tmp directory, run `blueprint init` selecting skill mode → assert `<target>/.claude/skills/blueprint/SKILL.md` + all 20 `reference/*.md` files + `reference/anti-patterns.md` + `scripts/load-context.mjs` + skill-mode `CLAUDE.md` stub exist AND each scaffolded agent entry-point file contains the `<!-- blueprint-status: alignment-required -->` marker exactly once; then from another fresh tmp directory, run with legacy mode → assert the existing legacy scaffold is byte-identical to a pre-R11 baseline EXCEPT for the new alignment-required marker line appended to each agent entry-point file (no `.claude/skills/`, retains `docs/core/**`) | 0.5 | R11-1.A.1..A.20, R11-1.B.1, R11-1.C.1..C.4, R11-1.D.1, R11-1.D.2, R11-1.D.3 | Dependent |

### Stream D Acceptance Criteria

- [ ] `blueprint init` displays the mode prompt before any other scaffold work; pressing return at the prompt selects skill mode.
- [ ] Selecting skill mode on a fresh directory produces `<target>/.claude/skills/blueprint/SKILL.md`, all 20 `reference/*.md` files, `reference/anti-patterns.md`, `scripts/load-context.mjs`, and the chosen agent's skill-mode entry-point stub. No `docs/core/**` is emitted in skill mode (those modules remain in the repo for legacy back-compat but are not part of the skill-mode scaffold output).
- [ ] Selecting legacy mode on a fresh directory produces the existing scaffold byte-identical to pre-R11 behaviour for non-entry-point files (existing `templates/docs/core/**` + top-level `templates/CLAUDE.md` etc).
- [ ] After scaffold in either mode, every scaffolded agent entry-point file present at project root (CLAUDE / AGENTS / GEMINI / QWEN) contains the line `<!-- blueprint-status: alignment-required -->` exactly once. Re-running `blueprint init` over the same project does not produce duplicate markers (idempotency).
- [ ] `npm run build` (or `tsc --noEmit`) passes; no type errors from the new `Mode` plumbing.

---

## Parallelization Map

```
Gate R11-1.0 (Mode type + SKILL.md + anti-patterns.md) ────────────────┐
                                                                        │
                 ┌──────────────────────────────────────────────────────┤
                 │                  │                  │                │
  Stream A (20 reference mirrors, all Independent) ────────────────────►│
  Stream B (load-context.mjs) ─────────────────────────────────────────►│
  Stream C (4 entry-point stubs, all Independent) ─────────────────────►│
                 │                  │                  │                │
                 │                  │                  │                │
                 └─ Stream D (scaffold engine + init branch)            │
                    D.1 + D.2 unblocked by Gate only;                   │
                    D.3 (alignment marker writer) requires D.2;         │
                    D.4 e2e smoke requires A + B + C + D.1..D.3 ───────►│
                                                                        │
                                                                        ▼
                                                          Phase R11-1 complete
```

---

## Test Plan

> Generated from task analysis and aligned to existing Blueprint doc-contract and scaffold verification patterns. Every listed task is represented in the plan, with multi-assertion tasks repeated where more than one test is needed. Tests are written before implementation (TDD) during execution. Framework: Vitest (`*.test.ts` under `tests/`, mirroring `src/`). Pure type-plumbing work (`R11-1.0.1`) and the dedicated smoke-verification task (`R11-1.D.4`) are marked not testable because their correctness is exercised by the compile gate and sibling integration tests rather than by standalone behavioral tests.

### Gate R11-1.0 Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| — | R11-1.0.1 | — | Not testable: pure TypeScript type-surface plumbing; correctness is enforced by `tsc --noEmit` and the downstream init-flow integration tests in Stream D | — |
| T-R11-1.0.2.1 | R11-1.0.2 | unit (doc-contract) | Verify `templates/skills/blueprint/SKILL.md` has valid frontmatter (`name: blueprint`, one-line `description`) plus the required setup gate, shared-laws reference, commands/routing table, and routing-rules sections | SKILL file exists with all required sections and valid frontmatter shape |
| T-R11-1.0.2.2 | R11-1.0.2 | unit (doc-contract) | Verify the SKILL routing table mirrors the live root `<ModuleRouting>` intents 1:1 and every route points at the locked renamed `reference/*.md` target | Every legacy routable intent is present exactly once and maps to the expected renamed file |
| T-R11-1.0.2.3 | R11-1.0.2 | unit (doc-contract) | Verify the setup gate requires populated `docs/project-progress.md`, requires tracker initialization, and instructs the agent to install `blueprint-cli` if the tracker is missing | Setup gate contains all three required constraints verbatim enough to prevent ambiguity |
| T-R11-1.0.3.1 | R11-1.0.3 | unit (doc-contract) | Verify `templates/skills/blueprint/reference/anti-patterns.md` contains the canonical `<AntiPatterns>` shape spec only: wrapper, bare `name=`, required `<BadExample>` + `<Why>`, and allowed optional nodes | Shared laws file contains the canonical shape requirements |
| T-R11-1.0.3.2 | R11-1.0.3 | unit (doc-contract) | Verify `reference/anti-patterns.md` does not introduce a per-module anti-pattern registry or unrelated behavioral guidance | File contains no module registry entries and remains shape-spec-only |
| T-R11-1.0.4.1 | R11-1.0.4 | unit (doc-contract) | Verify `docs/core/alignment.md` ends with a final step instructing the agent to run the deferred `alignment-complete` command after alignment artifacts are confirmed and committed | Final-step command reference is present in the live doc |
| T-R11-1.0.4.2 | R11-1.0.4 | unit (doc-contract) | Verify the same alignment step names both marker strings verbatim: `<!-- blueprint-status: alignment-required -->` and `<!-- blueprint-status: alignment-complete -->` | Both marker strings appear exactly as specified |
| T-R11-1.0.4.3 | R11-1.0.4 | unit (mirror) | Verify `templates/docs/core/alignment.md` remains byte-identical to `docs/core/alignment.md` after the Phase 1 update | Live/template alignment docs match byte-for-byte |

### Stream A Tests

> Stream A mirror checks are parameterized over the locked 20-file rename map. Each task below verifies that the target file exists under `templates/skills/blueprint/reference/`, has valid skill frontmatter (`name` matching the filename and a one-line `description` specific enough to disambiguate routing intent), and that the body after frontmatter is byte-identical to the corresponding `docs/core/*.md` source.

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R11-1.A.1.1 | R11-1.A.1 | unit (mirror) | Parameterized over all 20 `reference/*.md` files: verify frontmatter `description` is a single-line summary and specific enough to disambiguate the routed intent from adjacent Blueprint modules | Every reference file has filename-matched `name` and a one-line, route-specific `description` |
| T-R11-1.A.1.2 | R11-1.A.1 | unit (doc-contract) | Parameterized over every mirrored file whose body contains an `<AntiPatterns>` block: verify the mirrored block conforms to the canonical shape specified in `reference/anti-patterns.md` | Every mirrored `<AntiPatterns>` block uses the canonical wrapper, bare `name=`, and required children shape |
| T-R11-1.A.1 | R11-1.A.1 | unit (mirror) | Verify `reference/align.md` mirrors `docs/core/alignment.md` with `name: align` frontmatter | File exists; frontmatter valid; body bytes match source |
| T-R11-1.A.2 | R11-1.A.2 | unit (mirror) | Verify `reference/blueprint-structure.md` mirrors `docs/core/blueprint-structure.md` with filename-matched frontmatter | File exists; frontmatter valid; body bytes match source |
| T-R11-1.A.3 | R11-1.A.3 | unit (mirror) | Verify `reference/bug.md` mirrors `docs/core/bug-resolution.md` with `name: bug` frontmatter | File exists; frontmatter valid; body bytes match source |
| T-R11-1.A.4 | R11-1.A.4 | unit (mirror) | Verify `reference/commit.md` mirrors `docs/core/git-execution-workflow.md` with `name: commit` frontmatter | File exists; frontmatter valid; body bytes match source |
| T-R11-1.A.5 | R11-1.A.5 | unit (mirror) | Verify `reference/commit-review.md` mirrors `docs/core/git-review-workflow.md` with `name: commit-review` frontmatter | File exists; frontmatter valid; body bytes match source |
| T-R11-1.A.6 | R11-1.A.6 | unit (mirror) | Verify `reference/execute.md` mirrors `docs/core/execution.md` with `name: execute` frontmatter | File exists; frontmatter valid; body bytes match source |
| T-R11-1.A.7 | R11-1.A.7 | unit (mirror) | Verify `reference/hierarchy.md` mirrors `docs/core/hierarchy.md` with filename-matched frontmatter | File exists; frontmatter valid; body bytes match source |
| T-R11-1.A.8 | R11-1.A.8 | unit (mirror) | Verify `reference/orchestrate.md` mirrors `docs/core/orchestrate.md` with filename-matched frontmatter | File exists; frontmatter valid; body bytes match source |
| T-R11-1.A.9 | R11-1.A.9 | unit (mirror) | Verify `reference/phase-complete.md` mirrors `docs/core/phase-completion.md` with `name: phase-complete` frontmatter | File exists; frontmatter valid; body bytes match source |
| T-R11-1.A.10 | R11-1.A.10 | unit (mirror) | Verify `reference/plan-milestone.md` mirrors `docs/core/milestone-planning.md` with `name: plan-milestone` frontmatter | File exists; frontmatter valid; body bytes match source |
| T-R11-1.A.11 | R11-1.A.11 | unit (mirror) | Verify `reference/plan-phase.md` mirrors `docs/core/phase-planning.md` with `name: plan-phase` frontmatter | File exists; frontmatter valid; body bytes match source |
| T-R11-1.A.12 | R11-1.A.12 | unit (mirror) | Verify `reference/plan-prd.md` mirrors `docs/core/prd-planning.md` with `name: plan-prd` frontmatter | File exists; frontmatter valid; body bytes match source |
| T-R11-1.A.13 | R11-1.A.13 | unit (mirror) | Verify `reference/plan-test.md` mirrors `docs/core/test-planning.md` with `name: plan-test` frontmatter | File exists; frontmatter valid; body bytes match source |
| T-R11-1.A.14 | R11-1.A.14 | unit (mirror) | Verify `reference/planning.md` mirrors `docs/core/planning.md` with filename-matched frontmatter | File exists; frontmatter valid; body bytes match source |
| T-R11-1.A.15 | R11-1.A.15 | unit (mirror) | Verify `reference/review.md` mirrors `docs/core/review.md` with filename-matched frontmatter | File exists; frontmatter valid; body bytes match source |
| T-R11-1.A.16 | R11-1.A.16 | unit (mirror) | Verify `reference/revision.md` mirrors `docs/core/revision-planning.md` with `name: revision` frontmatter | File exists; frontmatter valid; body bytes match source |
| T-R11-1.A.17 | R11-1.A.17 | unit (mirror) | Verify `reference/scope-change.md` mirrors `docs/core/scope-change.md` with filename-matched frontmatter | File exists; frontmatter valid; body bytes match source |
| T-R11-1.A.18 | R11-1.A.18 | unit (mirror) | Verify `reference/srs.md` mirrors `docs/core/srs-planning.md` with `name: srs` frontmatter | File exists; frontmatter valid; body bytes match source |
| T-R11-1.A.19 | R11-1.A.19 | unit (mirror) | Verify `reference/tracker.md` mirrors `docs/core/tracker.md` with filename-matched frontmatter | File exists; frontmatter valid; body bytes match source |
| T-R11-1.A.20 | R11-1.A.20 | unit (mirror) | Verify `reference/tweak.md` mirrors `docs/core/tweak-planning.md` with `name: tweak` frontmatter | File exists; frontmatter valid; body bytes match source |

### Stream B Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R11-1.B.1.1 | R11-1.B.1 | integration | Run `node templates/skills/blueprint/scripts/load-context.mjs` in a populated project fixture and verify the markdown brief prints sections in the required order: `## Project`, `## Current Milestone`, `## Current Phase`, `## Pending Revisions`, `## Tracker` | Exit `0`; stdout contains all five sections in order with populated values |
| T-R11-1.B.1.2 | R11-1.B.1 | integration | Run the script in a fixture whose `docs/project-progress.md` omits one or more tracked fields/sections | Exit `0`; missing values render as `_not set_` (or the locked equivalent) rather than crashing |
| T-R11-1.B.1.3 | R11-1.B.1 | integration | Run the script in a fixture with no `docs/.blueprint/` directory | Exit `0`; `## Tracker` reports `unreachable` / `not initialised` rather than throwing |
| T-R11-1.B.1.4 | R11-1.B.1 | integration | Run the script in a directory with no `docs/project-progress.md` | Exit non-zero; stderr clearly states that `docs/project-progress.md` could not be read |
| T-R11-1.B.1.5 | R11-1.B.1 | unit | Verify `templates/skills/blueprint/scripts/load-context.mjs` stays pure Node ESM with no external package imports or runtime dependencies beyond Node built-ins | Script uses only ESM syntax and built-in modules; no external dependency resolution required |

### Stream C Tests

> Stream C stub checks are parameterized across `templates/skill/{CLAUDE,AGENTS,GEMINI,QWEN}.md`. Each task verifies the file stays intentionally minimal, references the `blueprint` skill by name, and omits legacy routing blocks.

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R11-1.C.1 | R11-1.C.1 | unit (doc-contract) | Verify `templates/skill/CLAUDE.md` exists, is at most 20 lines, references the `blueprint` skill, instructs invocation at session start and on planning/execution/review/tweak/bug/revision/commit intents, and contains none of `<SessionStart>`, `<HardRules>`, or `<ModuleRouting>` | Claude stub is minimal, skill-based, intent-complete, and free of legacy routing blocks |
| T-R11-1.C.2 | R11-1.C.2 | unit (doc-contract) | Verify `templates/skill/AGENTS.md` exists, is at most 20 lines, references the `blueprint` skill, instructs invocation at session start and on planning/execution/review/tweak/bug/revision/commit intents, and contains none of the forbidden legacy blocks | AGENTS stub is minimal, skill-based, intent-complete, and free of legacy routing blocks |
| T-R11-1.C.3 | R11-1.C.3 | unit (doc-contract) | Verify `templates/skill/GEMINI.md` exists, is at most 20 lines, references the `blueprint` skill, instructs invocation at session start and on planning/execution/review/tweak/bug/revision/commit intents, and contains none of the forbidden legacy blocks | Gemini stub is minimal, skill-based, intent-complete, and free of legacy routing blocks |
| T-R11-1.C.4 | R11-1.C.4 | unit (doc-contract) | Verify `templates/skill/QWEN.md` exists, is at most 20 lines, references the `blueprint` skill, instructs invocation at session start and on planning/execution/review/tweak/bug/revision/commit intents, and contains none of the forbidden legacy blocks | Qwen stub is minimal, skill-based, intent-complete, and free of legacy routing blocks |

### Stream D Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R11-1.D.1.1 | R11-1.D.1 | integration | Mock the init prompt flow and verify the new "Agent surface mode?" prompt presents `skill (recommended)` and `legacy (.md modules — not recommended)` with return-key defaulting to `skill` | Prompt text and default selection match the Phase 1 contract |
| T-R11-1.D.1.2 | R11-1.D.1 | integration | Select each option explicitly and verify the chosen value is persisted into init answers as `mode: 'skill' | 'legacy'` | Prompt output is threaded into the answers object with the expected union value |
| T-R11-1.D.2.1 | R11-1.D.2 | integration | Run `blueprint init` in skill mode and verify scaffold output includes `.claude/skills/blueprint/SKILL.md`, all 20 `reference/*.md` files, `reference/anti-patterns.md`, `scripts/load-context.mjs`, and the chosen root skill-mode entry-point stub, while omitting legacy `docs/core/**` payload | Skill-mode scaffold emits the full skill payload, includes the chosen skill-mode stub per init selection, and omits legacy core-module docs |
| T-R11-1.D.2.2 | R11-1.D.2 | integration | Run `blueprint init` in legacy mode and verify non-entry-point scaffold output remains byte-identical to the pre-R11 baseline while retaining `templates/docs/core/**` behavior and emitting no `.claude/skills/` tree | Legacy-mode scaffold preserves prior behavior outside the new marker write |
| T-R11-1.D.2.3 | R11-1.D.2 | integration | Verify the new `templates/skill/` branch logic does not collide with existing top-level template resolution or break archive copy semantics for either mode | Copy pipeline resolves the correct template roots for both modes without path collisions |
| T-R11-1.D.2.4 | R11-1.D.2 | integration | Parameterized over the supported agent-surface choices: verify the set of root agent entry-point files emitted in skill mode matches current init-selection semantics and never omits the chosen surface's stub | Root entry-point output matches the selected agent surface(s) exactly |
| T-R11-1.D.3.1 | R11-1.D.3 | integration | After scaffold in either mode, verify every root agent entry-point file that was emitted contains `<!-- blueprint-status: alignment-required -->` exactly once | Marker line is appended to every scaffolded entry-point file and never duplicated on first run |
| T-R11-1.D.3.2 | R11-1.D.3 | integration | Re-run the post-scaffold marker writer over a project that already contains the marker | Marker remains single-instance per entry-point file; second run is idempotent |
| — | R11-1.D.4 | — | Not testable: this task is the dedicated end-to-end smoke verification itself; coverage is delivered by the D.1-D.3 integration tests plus the execution-time smoke run | — |

### Test Summary

| Component | Total Tasks | Testable | Not Testable |
|-----------|-------------|----------|--------------|
| Gate R11-1.0 | 4 | 3 | 1 |
| Stream A | 20 | 20 | 0 |
| Stream B | 1 | 1 | 0 |
| Stream C | 4 | 4 | 0 |
| Stream D | 4 | 3 | 1 |
| **Total** | **33** | **31** | **2** |

---

## Definition of Done

- [ ] Gate R11-1.0 acceptance criteria pass
- [ ] Stream A acceptance criteria pass (all 20 reference mirrors + frontmatter)
- [ ] Stream B acceptance criteria pass (`load-context.mjs` works on populated + missing-tracker projects)
- [ ] Stream C acceptance criteria pass (all 4 skill-mode entry-point stubs, no `<SessionStart>` / `<HardRules>` / `<ModuleRouting>` content)
- [ ] Stream D acceptance criteria pass (mode prompt + branched scaffold + alignment-required marker injection + idempotency + end-to-end smoke green for both modes)
- [ ] All tests in the Test Plan pass
- [ ] No lint errors in files touched by this phase
- [ ] Full test suite (`npm test`) green, including any pre-existing tests that depended on init prompt shape
- [ ] MAS-208 remains at `approved-pending-implementation` (activation deferred to Phase 2 per revision §2.6)

---

## Test Scenarios

> High-level sketch only. The formal Test Plan appears above; these scenarios remain a lighter execution-oriented checklist.

### Happy Path

- [ ] `blueprint init` in a fresh directory with skill mode selected scaffolds the full skill payload under `<target>/.claude/skills/blueprint/**` and a one-liner skill-mode `CLAUDE.md` stub at the project root, with the `<!-- blueprint-status: alignment-required -->` marker present in the stub.
- [ ] `blueprint init` in a fresh directory with legacy mode selected produces a scaffold byte-identical to pre-R11 behaviour for non-entry-point files, with the alignment-required marker appended to each scaffolded agent entry-point file.
- [ ] `SKILL.md` commands/routing table contains every routable intent currently in the root `<ModuleRouting>` table, each mapped to the renamed reference file path.
- [ ] Each `reference/*.md` body (post-frontmatter) is byte-identical to the corresponding `docs/core/*.md` source.
- [ ] `scripts/load-context.mjs` run from this repo's root produces a markdown brief with Project / Milestone / Phase / Pending Revisions / Tracker sections.
- [ ] `docs/core/alignment.md` ends with a step naming the deferred `alignment-complete` command and the two marker strings verbatim.

### Edge Cases

- [ ] `blueprint init` re-run on an existing skill-mode project does not silently overwrite user-edited `reference/*.md` files (current scaffold-engine semantics for collision are preserved; behaviour matches pre-R11 collision behaviour for legacy mode).
- [ ] `blueprint init` re-run on a project that already has the `<!-- blueprint-status: alignment-required -->` marker does not append a duplicate; the marker stays single-instance per entry-point file.
- [ ] Mode prompt accepting return-key (default) selects skill mode reliably.
- [ ] `scripts/load-context.mjs` in a directory with no `docs/.blueprint/` prints the `## Tracker` section with an `unreachable` / `not initialised` marker, exits 0.
- [ ] `scripts/load-context.mjs` in a directory with no `docs/project-progress.md` exits non-zero with a clear stderr message.
- [ ] `SKILL.md` frontmatter `description` does not contain newlines or unescaped colons (YAML-valid one-liner).
- [ ] The new `templates/skill/` directory does not collide with any existing top-level templates path; legacy mode scaffolding is unaffected.

---
