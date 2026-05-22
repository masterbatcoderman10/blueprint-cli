# Phase 1 — Health-Check Bypass Plan

**Status**: Planning
**Milestone**: Revision 10 — Health-Check Bypass & Anti-Pattern Shape Unification

---

## Goals

- A new session begins directly with intent classification. No structural / operational health-check protocol runs before user intent is identified.
- `docs/core/health-check.md` and `templates/docs/core/health-check.md` are deleted from the repo.
- All 7 agent entry-point variants (`CLAUDE.md` / `AGENTS.md` / `GEMINI.md` at root + `CLAUDE.md` / `AGENTS.md` / `GEMINI.md` / `QWEN.md` under `templates/`) are stripped of `<SessionStart>` STEP 1 (load health-check + result handling), `<HardRules>` RULE 3 (validation gate), and the `<ModuleRouting>` "Check project health" row. Affected blocks stay byte-identical across all 7 variants after the edit.
- `docs/core/blueprint-structure.md` and its template mirror no longer reference `health-check.md` in either the file-tree listing or the prose.
- Doctor's `CANONICAL_CORE_FILES` set in `src/doctor/structure.ts` no longer lists `docs/core/health-check.md`.
- Obsolete R6-3 doc-contract tests that asserted `health-check.md`'s content are deleted outright (the file the assertions target no longer exists).
- A new parameterized regression test asserts the affected `<SessionStart>` / `<HardRules>` / `<ModuleRouting>` blocks remain byte-identical across the 7 entry-point variants.
- Full project test suite (`npm test`) is green.

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Revision 9 — Tracker Workflow QoL (no in-flight phase) | Complete |
| `docs/core/alignment.md` empty-state branch handles new / unpopulated projects | Available |
| Built-in tracker (R6) provides DB existence + reachability behavior already self-evident at use time | Available |

No code logic outside `src/doctor/structure.ts` is touched. CLI surface, tracker server, board SPA, and orchestrate/execution/review paths are unaffected by this phase.

---

## Gate R10-1.0 — Canonical-Set & Obsolete-Test Foundation

> Lock the Doctor canonical-set and clear out tests that target the doomed file so the file-delete + entry-point edits in Stream A land green on first run.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R10-1.0.1 | Remove `'docs/core/health-check.md'` from `CANONICAL_CORE_FILES` in `src/doctor/structure.ts` | 0.25 | None | Independent |
| R10-1.0.2 | Delete obsolete R6-3 content-assertion tests targeting `health-check.md`: `tests/revision-6/stream-b/planning-side-docs.test.ts`, `tests/stream-b/planning-docs-rewrite.test.ts`. Drop the `health-check.md` row from the parameterized `SURFACE_CASES` table in `tests/stream-a/srs-surface-contract.test.ts` and remove the dedicated `it('health-check documents docs/srs.md and the legacy repair path', ...)` case in that file | 0.5 | None | Independent |
| R10-1.0.3 | Update canonical-set test fixtures so they no longer reference `docs/core/health-check.md` or its template mirror: drop the entry in `tests/phase-3/gate-3.0/canonical-structure.test.ts` expected list (line ~31) and remove the `isEditableProjectDoc('docs/core/health-check.md')` assertion (line ~100); drop the `'docs/core/health-check.md'` audit-target case in `tests/phase-3/stream-b/doctor-structure-audit.test.ts` (~line 41); drop `'health-check.md'` from `tests/stream-a/core-templates.test.ts` (~line 17); drop the `{ source: 'docs/core/health-check.md', template: 'templates/docs/core/health-check.md' }` pair from `tests/stream-c/project-templates-mirror.test.ts` (~line 72) | 0.5 | R10-1.0.1 | Dependent |

### Gate Acceptance Criteria

- [ ] `CANONICAL_CORE_FILES` in `src/doctor/structure.ts` no longer contains `'docs/core/health-check.md'`.
- [ ] No test file under `tests/` contains a content-assertion or canonical-set entry for `docs/core/health-check.md` or `templates/docs/core/health-check.md`.
- [ ] `npm test` runs without any failure rooted in a missing health-check file or a stale R6-3 assertion (existing pre-existing failures unrelated to this phase, if any, are still acceptable; new failures are not).
- [ ] The string `health-check` (literal token, hyphenated) does not appear in any file under `src/`, `tests/`, except where it is a generic identifier unrelated to Blueprint's removed protocol (the `tests/phase-3/gate-3.0/comparator.test.ts` fixture uses `'health-check.md'` as an opaque filename string for a generic compare-file test — that occurrence is preserved as a non-blueprint test fixture).

---

## Stream A — Entry-Point & Structure-Doc Cleanup

> Apply the mechanical edits across all 7 agent entry-point variants and the structure doc, delete the health-check source + template files, and install a byte-identity regression guard.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R10-1.A.1 | In each of `CLAUDE.md`, `AGENTS.md`, `GEMINI.md` (root): remove `<SessionStart>` STEP 1 (the `Load docs/core/health-check.md. Follow its protocol.` block and its IF/ELSE result handling); renumber STEP 2 → STEP 1; remove `<HardRules>` RULE 3 — VALIDATION GATE; remove the `\| Check project health \| docs/core/health-check.md \|` row from the `<ModuleRouting>` table. The remaining SessionStart / HardRules / ModuleRouting blocks must be byte-identical across the 3 files | 0.75 | Gate | Dependent |
| R10-1.A.2 | Mirror R10-1.A.1's edits byte-for-byte into `templates/CLAUDE.md`, `templates/AGENTS.md`, `templates/GEMINI.md`, `templates/QWEN.md`. Final state: all 7 entry-point variants share byte-identical SessionStart / HardRules / ModuleRouting blocks | 0.75 | R10-1.A.1 | Dependent |
| R10-1.A.3 | Scrub `health-check.md` references from `docs/core/blueprint-structure.md`: remove the `health-check.md` line in the file-tree listing (~line 19) and the `"health-check.md uses this checklist..."` reference paragraph (~line 152) | 0.25 | Gate | Dependent |
| R10-1.A.4 | Mirror R10-1.A.3's edits byte-for-byte into `templates/docs/core/blueprint-structure.md` | 0.25 | R10-1.A.3 | Dependent |
| R10-1.A.5 | Delete `docs/core/health-check.md` and `templates/docs/core/health-check.md` | 0.25 | R10-1.A.2, R10-1.A.4 | Dependent |
| R10-1.A.6 | Add a new parameterized regression test (suggested location: `tests/revision-10/stream-a/entry-point-block-identity.test.ts`) that loads `CLAUDE.md`, `AGENTS.md`, `GEMINI.md` (root) and `templates/CLAUDE.md`, `templates/AGENTS.md`, `templates/GEMINI.md`, `templates/QWEN.md`, extracts the `<SessionStart>...</SessionStart>`, `<HardRules>...</HardRules>`, and `<ModuleRouting>...</ModuleRouting>` blocks from each, and asserts the three block strings are byte-identical across all 7 variants. Use the source `CLAUDE.md` as the reference; assert the other 6 match it exactly | 0.75 | R10-1.A.2 | Dependent |

### Stream A Acceptance Criteria

- [ ] No occurrence of the literal `health-check` token in any of the 7 entry-point variants, in either `blueprint-structure.md` (source + template), or anywhere under `docs/core/` or `templates/docs/core/`.
- [ ] `docs/core/health-check.md` and `templates/docs/core/health-check.md` are removed from the working tree (confirmed via `git status` + `ls`).
- [ ] The parameterized block-identity test passes for all three blocks (`<SessionStart>`, `<HardRules>`, `<ModuleRouting>`) across all 7 variants.
- [ ] `<SessionStart>` in every variant now begins at STEP 1 with the project-progress branching that was previously STEP 2; no STEP 2 remains.
- [ ] `<HardRules>` in every variant contains exactly RULE 1, RULE 2, and RULE 4 — renumbered to RULE 1, RULE 2, RULE 3 (i.e. the former RULE 4 — ASK BEFORE ASSUMING is now RULE 3).
- [ ] The `<ModuleRouting>` table in every variant contains no row whose left cell is `Check project health`.

---

## Parallelization Map

```
Gate R10-1.0 (Canonical-Set & Test Foundation)
   │  R10-1.0.1 ──► R10-1.0.3
   │  R10-1.0.2 (independent of 0.1)
   ▼
Stream A (Entry-Point & Structure-Doc Cleanup)
   ├── R10-1.A.1 (root variants) ──► R10-1.A.2 (template variants) ──┐
   ├── R10-1.A.3 (structure source) ──► R10-1.A.4 (structure template)─┤
   │                                                                    │
   │   R10-1.A.5 (delete files) ◄── needs A.2 + A.4 ────────────────────┤
   │   R10-1.A.6 (block-identity test) ◄── needs A.2 ───────────────────┤
   │                                                                    │
   ▼                                                                    ▼
                                                          Phase 1 complete
```

Stream A has internal parallelism: A.1/A.2 (entry-point chain) and A.3/A.4 (structure-doc chain) are independent of each other and can run concurrently after the gate. A.5 depends on both chains completing. A.6 depends on A.2 only.

---

## Definition of Done

- [ ] Gate R10-1.0 acceptance criteria pass.
- [ ] Stream A acceptance criteria pass.
- [ ] `npm test` is green end-to-end. No regressions introduced; pre-existing unrelated failures (if any) are documented but not caused by this phase.
- [ ] `git grep "health-check"` returns hits only inside `docs/milestones/revision-10-*/` (revision documents) and `docs/project-progress.md` (Decisions log) — i.e. only historical-record contexts. No live module, template, source file, or test references the deleted protocol.
- [ ] No lint errors in files touched by this phase.
- [ ] `project-progress.md` Decisions log records Phase 1 completion.

---

## Test Scenarios

### Happy Path
- [ ] A new agent session loads `CLAUDE.md`, follows `<SessionStart>` STEP 1 (project-progress branching), and either routes via `<ModuleRouting>` or to `alignment.md` — no health-check protocol runs.
- [ ] The parameterized block-identity test passes for `<SessionStart>` / `<HardRules>` / `<ModuleRouting>` across all 7 variants.
- [ ] `npm test` completes with the previously-stable test count minus the deleted R6-3 / srs-surface health-check assertions, with zero new failures.
- [ ] `blueprint doctor`-style canonical audit (via the test fixture surrogates) no longer enforces presence of `docs/core/health-check.md`.

### Edge Cases
- [ ] A variant file that drifts in only one of the three affected blocks fails the block-identity test (verified by spot-introducing an intentional one-character drift in a scratch fixture, not in committed code).
- [ ] A new project scaffolded from `templates/` after this phase contains no `health-check.md` and no `<SessionStart>` reference to one.
- [ ] If a downstream user has a custom `CLAUDE.md` that still calls STEP 1 health-check, that is user-domain content and is not within scope; Blueprint's own variants are clean.
- [ ] Removing `health-check.md` from `CANONICAL_CORE_FILES` does not break `REQUIRED_BLUEPRINT_DIRECTORIES` checks (the file lived under `docs/core/`, which remains required).

---
