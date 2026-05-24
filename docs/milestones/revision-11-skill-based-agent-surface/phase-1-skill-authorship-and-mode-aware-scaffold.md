# Phase 1 — Skill Authorship & Mode-Aware Scaffold Plan

**Status**: Planning
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

## Definition of Done

- [ ] Gate R11-1.0 acceptance criteria pass
- [ ] Stream A acceptance criteria pass (all 20 reference mirrors + frontmatter)
- [ ] Stream B acceptance criteria pass (`load-context.mjs` works on populated + missing-tracker projects)
- [ ] Stream C acceptance criteria pass (all 4 skill-mode entry-point stubs, no `<SessionStart>` / `<HardRules>` / `<ModuleRouting>` content)
- [ ] Stream D acceptance criteria pass (mode prompt + branched scaffold + alignment-required marker injection + idempotency + end-to-end smoke green for both modes)
- [ ] No lint errors in files touched by this phase
- [ ] Full test suite (`npm test`) green, including any pre-existing tests that depended on init prompt shape
- [ ] MAS-208 remains at `approved-pending-implementation` (activation deferred to Phase 2 per revision §2.6)

---

## Test Scenarios

> High-level sketch only. The formal Test Plan is produced separately via `docs/core/test-planning.md`.

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
