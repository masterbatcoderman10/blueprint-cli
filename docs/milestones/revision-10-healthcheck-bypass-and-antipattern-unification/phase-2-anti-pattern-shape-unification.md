# Phase 2 — Anti-Pattern Shape Unification Plan

**Status**: Planning
**Milestone**: Revision 10 — Health-Check Bypass & Anti-Pattern Shape Unification

---

## Goals

- Every `<AntiPatterns>` block across `docs/core/*.md` (and its mirror under `templates/docs/core/*.md`) shares one canonical XML shape:
  - **No ```xml fence** around the block.
  - `<AntiPatterns>` wrapper (never `<TweakAntiPatterns>` or other variants).
  - Bare `name="<short title>"` attribute on `<AntiPattern>` — no `ANTI-PATTERN:` prefix.
  - Required children: `<BadExample>` + `<Why>`.
  - Optional children: `<GoodExample>`, plus domain-prefixed `<Bad<Domain>Example>` / `<Good<Domain>Example>` / `<GoodSub<Domain>Example>` variants when they aid illustration.
- `docs/core/tweak-planning.md`'s `<TweakAntiPatterns>` numbered-list narrative is converted into eight canonical `<AntiPattern>` entries with locked names (listed in Stream B). The eight forbidden ceremony behaviors are preserved without semantic loss — prose lifted verbatim into `<BadExample>` slots.
- `docs/conventions.md` gains a new top-level section `## Anti-Pattern Block Shape` (placed immediately after the existing `## Anti-Patterns` section) that documents the canonical shape and points to `srs-planning.md` as the post-rewrite exemplar. Mirrored byte-for-byte to `templates/docs/conventions.md`.
- All `templates/docs/core/*.md` and `templates/docs/conventions.md` mirror their source counterparts byte-for-byte after this phase. The existing parameterized template-mirror test (`tests/stream-c/project-templates-mirror.test.ts`) re-asserts parity unchanged.
- Doc-contract tests are forward-updated:
  - R8 tweak-planning tests (`tests/revision-8/stream-a/tweak-planning-rewrite.test.ts`, `tests/revision-8/stream-c/tweak-planning-mas207-contract.test.ts`) swap every `<TweakAntiPatterns>` token assertion to `<AntiPatterns>` and replace bullet-counting with name-based assertions on the eight canonical entries.
  - No other R4 / R5 / R9 anti-pattern-block tests need substantive change (their `<AntiPatterns>` token + entry-name assertions continue to hold under the new shape).
- Full project test suite (`npm test`) is green.

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Revision 10 Phase 1 — Health-Check Bypass | Complete |
| `docs/core/srs-planning.md` `<AntiPatterns>` block (used as the structural reference for the canonical shape, modulo fence removal in Stream A) | Available |
| Parameterized template-mirror test (`tests/stream-c/project-templates-mirror.test.ts`) covers source ↔ template parity for every `docs/core/*.md` and `docs/conventions.md` pair | Available |

This phase touches no CLI, tracker, board, or runtime code. The only `src/` impact is none — all edits land under `docs/`, `templates/docs/`, and `tests/`.

---

## Gate R10-2.0 — Canonical-Shape Lock & R8 Test Forward-Update

> Lock the canonical-shape contract in `docs/conventions.md` (source + template), and forward-update the R8 tweak-planning doc-contract tests so the Stream B rewrite of `tweak-planning.md` lands green on first run. The canonical-shape definition is the single source of truth that Streams A, B, and C all conform to — locking it first prevents drift mid-phase.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R10-2.0.1 | Add new top-level section `## Anti-Pattern Block Shape` to `docs/conventions.md`, placed immediately after the existing `## Anti-Patterns` section and before `## Agent Tools`. Section content: a short paragraph stating that all `<AntiPatterns>` blocks in `docs/core/*.md` use the unfenced canonical XML shape (wrapper `<AntiPatterns>`, bare `name=` attribute with no `ANTI-PATTERN:` prefix, required children `<BadExample>` + `<Why>`, optional children `<GoodExample>` and domain-prefixed `<Bad<Domain>Example>` / `<Good<Domain>Example>` / `<GoodSub<Domain>Example>`), and that `docs/core/srs-planning.md` is the reference exemplar after Phase 2 lands. Include the literal canonical-shape XML block (unfenced) inside the section so future modules have a copy-paste reference. | 0.75 | None | Independent |
| R10-2.0.2 | Forward-update R8 tweak-planning doc-contract tests for the new shape. In `tests/revision-8/stream-a/tweak-planning-rewrite.test.ts`: replace every `extractBlock(content, 'TweakAntiPatterns')` call with `extractBlock(content, 'AntiPatterns')` and update the failing-assertion message strings accordingly. In `tests/revision-8/stream-c/tweak-planning-mas207-contract.test.ts`: same wrapper-name swap, and replace the "eight forbidden ceremony behaviors" bullet-counting body assertion with an assertion that the block contains exactly the eight locked `<AntiPattern name="...">` entries (names listed in Stream B description). The two test files MUST fail before Stream B lands (asserting the new shape against the old block) and pass after Stream B lands. | 1.0 | None | Independent |
| R10-2.0.3 | Mirror the `docs/conventions.md` change from R10-2.0.1 into `templates/docs/conventions.md` byte-for-byte. | 0.25 | R10-2.0.1 | Dependent |

### Gate Acceptance Criteria

- [ ] `docs/conventions.md` contains a top-level `## Anti-Pattern Block Shape` section placed immediately after `## Anti-Patterns` and before `## Agent Tools`.
- [ ] That section documents the unfenced canonical shape (wrapper, bare `name=`, required + optional children) and references `docs/core/srs-planning.md` as the exemplar.
- [ ] `templates/docs/conventions.md` mirrors `docs/conventions.md` byte-for-byte in that section.
- [ ] Both R8 tweak-planning test files (`tests/revision-8/stream-a/tweak-planning-rewrite.test.ts`, `tests/revision-8/stream-c/tweak-planning-mas207-contract.test.ts`) reference the `<AntiPatterns>` wrapper instead of `<TweakAntiPatterns>` and assert the eight locked `<AntiPattern>` entry names. These tests are expected to be RED at the end of the gate (Stream B is what makes them green); the gate's acceptance is that the test code itself is forward-updated and structurally sound.

---

## Stream A — `docs/core/*.md` Source Cleanup

> Strip the ```xml fence from every fenced `<AntiPatterns>` block under `docs/core/` and strip the `ANTI-PATTERN:` prefix from the one `name=` attribute that carries it. No content or entry restructuring. Each task touches one file independently and can run in parallel.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R10-2.A.1 | `docs/core/alignment.md` — remove the ```xml opener (line above `<AntiPatterns>` opener, currently L386) and the matching ``` closer (line below `</AntiPatterns>` closer). Block content unchanged. | 0.25 | Gate | Independent |
| R10-2.A.2 | `docs/core/execution.md` — remove ```xml opener + matching closer surrounding the `<AntiPatterns>` block. | 0.25 | Gate | Independent |
| R10-2.A.3 | `docs/core/git-execution-workflow.md` — remove ```xml opener + matching closer surrounding the `<AntiPatterns>` block. | 0.25 | Gate | Independent |
| R10-2.A.4 | `docs/core/git-review-workflow.md` — remove ```xml opener + matching closer surrounding the `<AntiPatterns>` block. | 0.25 | Gate | Independent |
| R10-2.A.5 | `docs/core/milestone-planning.md` — remove ```xml opener + matching closer surrounding the `<AntiPatterns>` block. | 0.25 | Gate | Independent |
| R10-2.A.6 | `docs/core/phase-planning.md` — remove ```xml opener + matching closer surrounding the `<AntiPatterns>` block. | 0.25 | Gate | Independent |
| R10-2.A.7 | `docs/core/review.md` — remove ```xml opener + matching closer surrounding the `<AntiPatterns>` block. | 0.25 | Gate | Independent |
| R10-2.A.8 | `docs/core/revision-planning.md` — remove ```xml opener + matching closer surrounding the `<AntiPatterns>` block. | 0.25 | Gate | Independent |
| R10-2.A.9 | `docs/core/srs-planning.md` — remove ```xml opener + matching closer surrounding the `<AntiPatterns>` block. Block content (including domain-prefixed `<BadRequirementExample>` / `<GoodRequirementExample>` / `<GoodSubRequirementExample>` children) preserved verbatim. After this edit the file becomes the canonical-shape exemplar. | 0.25 | Gate | Independent |
| R10-2.A.10 | `docs/core/phase-completion.md` — already unfenced. Edit the single `<AntiPattern>` entry at L263: change `name="ANTI-PATTERN: Not Cleaning Up Completed Stream Worktrees"` to `name="Not Cleaning Up Completed Stream Worktrees"`. No other change. | 0.25 | Gate | Independent |
| R10-2.A.11 | `docs/core/orchestrate.md` — verify-only: the block is already unfenced and all 7 `<AntiPattern>` entries already use bare `name=` attributes (no `ANTI-PATTERN:` prefix). No edit required. Task records the verification result so reviewers see why this file appears in the cleanup sweep without an associated diff. | 0.25 | Gate | Independent |

### Stream A Acceptance Criteria

- [ ] No `<AntiPatterns>` block in `docs/core/*.md` is preceded by a ```xml fence opener or followed by a ``` closer.
- [ ] No `<AntiPattern>` declaration in `docs/core/*.md` carries the `ANTI-PATTERN:` prefix in its `name=` attribute.
- [ ] Block content (entry order, entry names, `<BadExample>` / `<Why>` / `<GoodExample>` / domain-prefixed variants) is preserved verbatim across every file.
- [ ] `docs/core/srs-planning.md` matches the canonical shape and serves as the in-repo exemplar.

---

## Stream B — `tweak-planning.md` Wrapper Conversion

> Convert `docs/core/tweak-planning.md`'s `<TweakAntiPatterns>` numbered-list narrative into eight canonical `<AntiPattern>` entries inside an `<AntiPatterns>` wrapper. The block stays unfenced. Prose from each numbered bullet's bold lead sentence + supporting sentence lifts verbatim into `<BadExample>`; a one-line `<Why>` is distilled from the same prose without adding new semantics. No `<GoodExample>` slots are added (the floor is `<BadExample>` + `<Why>`).

**Locked entry names (in source order):**

1. `Creating Tracker Tasks for a Tweak`
2. `Writing Tweak Doc Before Change`
3. `Loading Planning Modules in Tweak Mode`
4. `Carving Tweak into Gates or Streams`
5. `Drafting Formal Test Plan for Tweak`
6. `Skipping Change-First Confirm Step`
7. `Skipping npm test Before Doc Creation`
8. `Continuing in Tweak Mode After Escalation`

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R10-2.B.1 | Rewrite the `<TweakAntiPatterns>` block in `docs/core/tweak-planning.md` (currently L334–L379). Replace wrapper opener `<TweakAntiPatterns>` with `<AntiPatterns>`; replace closer `</TweakAntiPatterns>` with `</AntiPatterns>`. Block remains unfenced. Replace the `PURPOSE: ...` and `ANTI-PATTERNS — each of the following is forbidden in Tweak Mode:` preamble + numbered-list with the eight canonical `<AntiPattern name="...">` entries in the order listed above. Each entry contains exactly one `<BadExample>` (prose lifted verbatim from the matching numbered bullet — bold lead sentence + supporting body sentence, concatenated with a single space and rephrased only enough to read as a behavior description rather than a directive, e.g. "The agent creates board tasks for a tweak" rather than "Creating tracker/board tasks for a tweak.") and one `<Why>` (one-line distillation from the same bullet's supporting sentence, preserving the original reasoning without adding new claims). | 1.5 | Gate | Dependent |

### Stream B Acceptance Criteria

- [ ] `docs/core/tweak-planning.md` contains exactly one `<AntiPatterns>` block (no `<TweakAntiPatterns>` token anywhere in the file).
- [ ] The block is unfenced (no ```xml opener / closer).
- [ ] The block contains exactly eight `<AntiPattern name="...">` entries in the order locked above.
- [ ] Each entry contains exactly one `<BadExample>` child and one `<Why>` child.
- [ ] The eight original forbidden behaviors are recoverable from the eight `<BadExample>` + `<Why>` pairs without semantic loss (R8 MAS-207 contract preserved).
- [ ] Both forward-updated R8 test files (`tweak-planning-rewrite.test.ts`, `tweak-planning-mas207-contract.test.ts`) pass.

---

## Stream C — Template Mirror

> Mirror every source rewrite from Streams A and B into the `templates/docs/core/` and `templates/docs/conventions.md` surface byte-for-byte. The existing parameterized mirror test (`tests/stream-c/project-templates-mirror.test.ts`) is the contract enforcer — it already covers every relevant source ↔ template pair, so no new test is added here. The stream is mechanical copy work gated on A and B landing first.

> **Depends on:** Stream A (10 source files: 9 fence-removals + 1 prefix-strip) and Stream B (`tweak-planning.md` wrapper conversion).

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R10-2.C.1 | Mirror Stream A fence-removal edits into `templates/docs/core/` (9 files): `alignment.md`, `execution.md`, `git-execution-workflow.md`, `git-review-workflow.md`, `milestone-planning.md`, `phase-planning.md`, `review.md`, `revision-planning.md`, `srs-planning.md`. Each template file's `<AntiPatterns>` block becomes byte-identical to its source. | 0.75 | R10-2.A.1, R10-2.A.2, R10-2.A.3, R10-2.A.4, R10-2.A.5, R10-2.A.6, R10-2.A.7, R10-2.A.8, R10-2.A.9 | Dependent |
| R10-2.C.2 | Mirror Stream A prefix-strip into `templates/docs/core/phase-completion.md`: change the single `<AntiPattern>` declaration's `name="ANTI-PATTERN: Not Cleaning Up Completed Stream Worktrees"` to `name="Not Cleaning Up Completed Stream Worktrees"`. | 0.25 | R10-2.A.10 | Dependent |
| R10-2.C.3 | Mirror Stream B `tweak-planning.md` rewrite into `templates/docs/core/tweak-planning.md` byte-for-byte. | 0.5 | R10-2.B.1 | Dependent |

### Stream C Acceptance Criteria

- [ ] Every source file rewritten in Streams A and B has a byte-identical mirror under `templates/docs/core/` (or `templates/docs/conventions.md` for the Gate's conventions edit, already mirrored in R10-2.0.3).
- [ ] The parameterized template-mirror test (`tests/stream-c/project-templates-mirror.test.ts`) passes unmodified.
- [ ] No `<TweakAntiPatterns>` token exists anywhere under `templates/**`.
- [ ] No ```xml fence precedes any `<AntiPatterns>` block under `templates/docs/core/**`.

---

## Parallelization Map

```
Gate R10-2.0 (Canonical-Shape Lock + R8 Test Forward-Update) ──┐
                                                                │
                 ┌──────────────────────────────────────────────┤
                 │                                              │
  Stream A (9 fence-removals + 1 prefix-strip + 1 verify) ────► │
       A.1 … A.11 are all independent and run in parallel       │
                                                                │
  Stream B (tweak-planning.md wrapper conversion) ─────────────►│
       B.1 runs in parallel with Stream A                       │
                                                                │
                 └── Stream C (template mirror)                 │
                     C.1 depends on A.1..A.9                    │
                     C.2 depends on A.10                        │
                     C.3 depends on B.1 ─────────────────────► │
                                                                │
                                                                ▼
                                                      Phase R10-2 complete
```

---

## Test Plan

> Generated from task analysis. Each testable task has one or more tests
> mapped to it. Tests are written before implementation (TDD) during task
> execution. Phase 2 is docs-only; most tasks are doc-copy or mirror work
> covered by the existing parameterized template-mirror test
> (`tests/stream-c/project-templates-mirror.test.ts`) and the existing R8
> doc-contract tests (forward-updated in Gate R10-2.0.2). New tests are
> added only at the repo-wide invariant boundary — not for every per-file
> fence-removal — to avoid meta-tests that just re-verify other tests.

### Gate R10-2.0 Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| — | R10-2.0.1 | — | Not testable: doc-copy. New `## Anti-Pattern Block Shape` section in `docs/conventions.md` is human-reviewed in the gate diff. Mirror parity is covered by the existing parameterized template-mirror test once R10-2.0.3 lands. | — |
| — | R10-2.0.2 | — | Not testable: this task IS the forward-update of two existing R8 test files (`tests/revision-8/stream-a/tweak-planning-rewrite.test.ts`, `tests/revision-8/stream-c/tweak-planning-mas207-contract.test.ts`). Writing a test that asserts these tests are correctly forward-updated would be a meta-loop. The verification is that both files are RED at end of gate and GREEN after Stream B lands. | — |
| — | R10-2.0.3 | — | Not testable individually: byte-for-byte mirror into `templates/docs/conventions.md` is covered by the existing parameterized template-mirror test (`tests/stream-c/project-templates-mirror.test.ts`). | — |

### Stream A Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R10-2.A | R10-2.A.1–R10-2.A.10 | integration | Single repo-wide invariant test covering `docs/core/**`. Two parameterized assertions across every `*.md` file under `docs/core/`: (a) for each occurrence of `<AntiPatterns>` opener, the immediately preceding non-blank line is NOT ` ```xml`; (b) zero occurrences of the literal substring `name="ANTI-PATTERN:` in any `<AntiPattern>` declaration. Both counts must be 0 after Stream A lands. Per-file fence-removal tasks A.1–A.9 and the prefix-strip task A.10 are all subsumed by this one assertion pair — no per-file tests are added. | Both invariant counts = 0 across `docs/core/**`. |
| — | R10-2.A.11 | — | Not testable: verify-only task on `docs/core/orchestrate.md` (already canonical). Result is subsumed by T-R10-2.A's zero-count assertions; the task records the verification in the phase log without producing a diff. | — |

### Stream B Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R10-2.B | R10-2.B.1 | integration | Content test on `docs/core/tweak-planning.md`. Five assertions: (1) file contains zero occurrences of the `<TweakAntiPatterns>` token (opener or closer); (2) file contains exactly one `<AntiPatterns>` block; (3) the block contains exactly 8 `<AntiPattern name="...">` entries; (4) entry names match the locked list in source order — `Creating Tracker Tasks for a Tweak`, `Writing Tweak Doc Before Change`, `Loading Planning Modules in Tweak Mode`, `Carving Tweak into Gates or Streams`, `Drafting Formal Test Plan for Tweak`, `Skipping Change-First Confirm Step`, `Skipping npm test Before Doc Creation`, `Continuing in Tweak Mode After Escalation`; (5) each of the 8 entries contains exactly one `<BadExample>` child and exactly one `<Why>` child. | All five assertions pass. |

Note: the two forward-updated R8 test files (Gate R10-2.0.2) also turn green after B.1 lands — that is implicit additional coverage but is not a new test in this plan.

### Stream C Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R10-2.C | R10-2.C.1, R10-2.C.2, R10-2.C.3 | integration | Single repo-wide invariant test covering `templates/`. Three assertions: (1) for each occurrence of `<AntiPatterns>` opener under `templates/docs/core/**`, the immediately preceding non-blank line is NOT ` ```xml`; (2) zero occurrences of `name="ANTI-PATTERN:` in any `<AntiPattern>` declaration under `templates/docs/core/**`; (3) zero occurrences of the `<TweakAntiPatterns>` token anywhere under `templates/**`. Per-file mirror tasks C.1, C.2, C.3 are all subsumed by these three invariants — no per-file mirror tests are added. The existing parameterized template-mirror test (`tests/stream-c/project-templates-mirror.test.ts`) continues to enforce byte-identical source↔template parity unchanged. | All three invariant counts = 0 across `templates/**`. |

### Test Summary

| Component | Total Tasks | Testable | Not Testable |
|-----------|-------------|----------|--------------|
| Gate R10-2.0 | 3 | 0 | 3 |
| Stream A | 11 | 10 (covered by 1 shared test) | 1 |
| Stream B | 1 | 1 | 0 |
| Stream C | 3 | 3 (covered by 1 shared test) | 0 |
| **Total** | 18 | 14 | 4 |

**3 new tests total** — `T-R10-2.A`, `T-R10-2.B`, `T-R10-2.C`. All assert content invariants on the post-rewrite repo state. None are meta-tests verifying other tests.

---

## Definition of Done

- [ ] Gate R10-2.0 acceptance criteria pass.
- [ ] Stream A acceptance criteria pass.
- [ ] Stream B acceptance criteria pass.
- [ ] Stream C acceptance criteria pass.
- [ ] No file under `docs/` or `templates/` contains the `<TweakAntiPatterns>` token.
- [ ] No `<AntiPatterns>` block under `docs/core/**` or `templates/docs/core/**` is preceded by a ```xml fence.
- [ ] No `<AntiPattern>` declaration under `docs/core/**` or `templates/docs/core/**` carries the `ANTI-PATTERN:` prefix in its `name=` attribute.
- [ ] `docs/conventions.md` and `templates/docs/conventions.md` both contain the new `## Anti-Pattern Block Shape` section, byte-identical between source and template.
- [ ] All tests in the Test Plan pass.
- [ ] Full project test suite (`npm test`) is green.

---

## Test Scenarios

### Happy Path

- [ ] Every `<AntiPatterns>` block in `docs/core/*.md` is parseable as raw XML (the surrounding markdown is no longer fenced) and contains at least one `<AntiPattern>` child with the required `<BadExample>` and `<Why>` children.
- [ ] `docs/core/tweak-planning.md` contains an `<AntiPatterns>` block with exactly eight `<AntiPattern>` entries whose names match the locked list, each with one `<BadExample>` and one `<Why>`.
- [ ] `docs/conventions.md` documents the canonical shape and references `srs-planning.md` as the exemplar; `templates/docs/conventions.md` mirrors that paragraph byte-for-byte.
- [ ] Parameterized template-mirror test passes for every source ↔ template pair affected by this phase.

### Edge Cases

- [ ] Block content (including domain-prefixed `<BadRequirementExample>` / `<GoodRequirementExample>` / `<GoodSubRequirementExample>` children in `srs-planning.md`) is preserved verbatim across fence removal.
- [ ] The R5 orchestrate delegation-discipline regex test (`tests/revision-5/gate-1.0/orchestrate-delegation-discipline.test.ts`) — which matches `<AntiPattern name="...">[\s\S]*?<\/AntiPattern>` regex spans — continues to pass because fence removal does not change the inner XML.
- [ ] The R9 doc-contract test asserting the phase-planning anti-pattern placement inside the `<AntiPatterns>` block (`tests/revision-9/stream-c/r9-1-c-doc-contract.test.ts`) continues to pass for the same reason.
- [ ] R4 anti-pattern token + entry-name tests across `tests/revision-4/**` continue to pass — their assertions are content-shape-agnostic with respect to the surrounding fence.
- [ ] The `<TweakAntiPatterns>` rewrite in `tweak-planning.md` preserves all eight forbidden behaviors without semantic loss; reviewers can recover the original numbered-list intent from the rewritten `<BadExample>` + `<Why>` pairs.

---
