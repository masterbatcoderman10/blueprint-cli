# Revision 10 — Health-Check Bypass & Anti-Pattern Shape Unification

**Status:** Identified — pending phase planning
**Identified:** 2026-05-22
**Type:** Modifying revision (docs / protocol only)
**Affects:** Session start protocol (all 4 agent entry points × 2 = 7 files), `docs/core/` modules with `<AntiPatterns>` blocks (12 source + 12 templates), `docs/conventions.md`, Doctor canonical-set, doc-contract tests.

---

## What is changing and why

Two related ceremony-reduction changes bundled into one revision:

1. **Health-check bypass.** Today every session begins with `docs/core/health-check.md` running structural + operational checks before any intent classification. The CLI now self-explains via `blueprint init` and the live board; the explicit health-check protocol adds friction without informational value the agent cannot already infer on demand. Remove the health-check protocol entirely from the session-start path and from every agent entry-point variant. Session start now goes directly to intent classification (current `<SessionStart>` STEP 2 becomes STEP 1). `docs/core/health-check.md` is deleted; `blueprint-structure.md` and the agent-entry-point variants are scrubbed of its references.

2. **Anti-pattern shape unification.** `<AntiPatterns>` blocks across `docs/core/` use inconsistent shapes — fenced vs unfenced, `<AntiPatterns>` vs `<TweakAntiPatterns>`, bare `name` vs `name="ANTI-PATTERN: ..."` prefix, domain-specific child tags only in `srs-planning.md`, numbered-list narrative only in `tweak-planning.md`. Pick `docs/core/srs-planning.md`'s block as the canonical exemplar (fenced ```xml block, `<AntiPatterns>` wrapper, `<AntiPattern name="X">` bare name, `<BadExample>` / optional `<BadFooExample>` domain variants / `<GoodExample>` / optional `<GoodFooExample>` and `<GoodSubFooExample>` domain variants / `<Why>`). Rewrite every divergent block to the canonical shape across source + template. Add a short canonical-shape paragraph to `docs/conventions.md` so future modules conform.

This is a soft, docs-only revision. No CLI surface change. No SRS requirement change. No code logic touched outside doc-contract tests.

---

## Impact analysis

### SRS requirements

**No SRS requirement is affected.** Active requirements MAS-200 through MAS-207 do not mandate the XML shape of anti-pattern blocks, the presence of `docs/core/health-check.md`, or the SessionStart STEP 1 health-check call. The change is presentation / protocol ergonomics, not capability.

- MAS-200 (Git Execution Workflow Core Module) names anti-pattern names (Stale Status, Unupdated Review Notes) but does not constrain XML shape — wording is preserved verbatim.
- MAS-203 (Orchestration Protocol) lives in `orchestrate.md` whose anti-pattern block is rewrapped, not rewritten — meaning preserved.
- MAS-204 / MAS-205 (Tracker / Board) reference `health-check.md`'s historical role in the R6 Phase 3 change log only; superseded by R9 changes. Removing the file does not contradict any current requirement statement.
- MAS-207 (Change-First Tweak Workflow) refers to "**Anti-patterns** explicitly forbidden in Tweak Mode" — those bullets stay in `tweak-planning.md` but get re-shaped into canonical `<AntiPattern>` entries. The forbidden list is preserved; only its XML form changes.

No supersession. No new ID. No `Supersedes` / `Superseded by` link. No SRS edits in this revision.

### PRD milestones

None directly affected. M1 is complete; M2 / M3 are not started and untouched.

### Revisions / phases (historical record — never modified per RevisionRules)

These prior revisions originated the affected modules. Their documents are preserved as historical record:

- **R3 (SRS Integration)** Phase 1 added health-check structural checks for `docs/srs.md`. The `health-check.md` it produced is now being deleted.
- **R4 (Anti-Patterns)** introduced most of the `<AntiPatterns>` blocks across core modules.
- **R5 (Orchestration Protocol)** added `orchestrate.md` with raw-XML antipatterns.
- **R6 (Built-in Task Tracker)** Phase 3 rewrote `health-check.md` for DB-presence + agent-initiated board boot. Now superseded by full deletion.
- **R7 (Standalone Tweak Workflow)** added the `<TweakAntiPatterns>` numbered-list block in `tweak-planning.md`.
- **R8 (Tweak Revamp & QoL)** layered more anti-pattern bullets into the same `<TweakAntiPatterns>` block.
- **R9 (Tracker Workflow QoL)** Phase 1 added the `phase-planning.md` anti-pattern-placement contract test.

### Affected source files

#### Phase 1 — Health-Check Bypass

Every agent entry-point variant (3 root + 4 template = 7) must stay byte-identical in the `<SessionStart>`, `<HardRules>`, and `<ModuleRouting>` blocks affected by this change:

| File | Change |
|---|---|
| `CLAUDE.md` | Remove `<SessionStart>` STEP 1 (health-check load + result handling); renumber STEP 2 → STEP 1. Remove `<HardRules>` RULE 3 (validation gate). Remove `<ModuleRouting>` row "Check project health". |
| `AGENTS.md` | Mirror byte-for-byte. |
| `GEMINI.md` | Mirror byte-for-byte. |
| `templates/CLAUDE.md` | Mirror byte-for-byte. |
| `templates/AGENTS.md` | Mirror byte-for-byte. |
| `templates/GEMINI.md` | Mirror byte-for-byte. |
| `templates/QWEN.md` | Mirror byte-for-byte. |
| `docs/core/blueprint-structure.md` | Remove `health-check.md` from the file-tree listing (around line 19). Remove the "health-check.md uses this checklist..." reference (around line 152). |
| `templates/docs/core/blueprint-structure.md` | Mirror. |
| `docs/core/health-check.md` | **Delete file.** |
| `templates/docs/core/health-check.md` | **Delete file.** |
| `src/commands/doctor` (or wherever the canonical-set lives) | Remove `health-check.md` from the canonical / required-file set if listed. Verify during phase planning. |

After Phase 1, the agent's first action on any session is intent classification (the current `<SessionStart>` STEP 2). Empty / new project handling already lives in `alignment.md` (loaded from the empty-state branch of STEP 2) — no structural validation hole opens.

#### Phase 2 — Anti-Pattern Shape Unification

Canonical exemplar = `docs/core/srs-planning.md` (already conforms; reference shape).

Source modules to rewrite to canonical shape:

| Source file | Current divergence |
|---|---|
| `docs/core/alignment.md` | Raw XML (no fence). Add ```xml fence. |
| `docs/core/execution.md` | Fenced, single entry. Already close to canonical — verify and align child tags. |
| `docs/core/git-execution-workflow.md` | Fenced. Verify child tags. |
| `docs/core/git-review-workflow.md` | Fenced. Verify child tags. |
| `docs/core/milestone-planning.md` | Fenced. Verify child tags. |
| `docs/core/orchestrate.md` | Raw XML (no fence). Add ```xml fence. |
| `docs/core/phase-completion.md` | Raw XML; `name="ANTI-PATTERN: ..."` prefix. Add ```xml fence. Strip `ANTI-PATTERN:` prefix from `name` attribute. |
| `docs/core/phase-planning.md` | Fenced. Verify `<GoodExample>` tag presence aligns with canonical. |
| `docs/core/review.md` | Raw XML. Add ```xml fence. |
| `docs/core/revision-planning.md` | Fenced. Verify child tags. |
| `docs/core/srs-planning.md` | **Canonical exemplar — no rewrite, used as the reference**. |
| `docs/core/tweak-planning.md` | Raw XML; uses non-canonical wrapper `<TweakAntiPatterns>` containing a numbered-list narrative (eight numbered paragraphs), not `<AntiPattern>` entries. Largest rewrite. Convert numbered list into eight `<AntiPattern name="...">` entries with `<BadExample>` + `<Why>`. Wrap in ```xml fence. Replace `<TweakAntiPatterns>` wrapper with `<AntiPatterns>`. |
| `docs/conventions.md` | **Add** a short Anti-Patterns convention paragraph documenting the canonical shape and pointing to `srs-planning.md` as the exemplar. |
| `templates/docs/core/<each-of-the-above>.md` (11 files) | Mirror byte-for-byte after source rewrite. |
| `templates/docs/conventions.md` | Mirror new conventions paragraph. |

**Canonical anti-pattern shape (locked):**

````
```xml
<AntiPatterns>
  <AntiPattern name="<short title, no prefix>">
    <BadExample>...</BadExample>
    <!-- optional domain-prefixed variants for context, modeled after srs-planning.md: -->
    <BadRequirementExample>...</BadRequirementExample>
    <GoodRequirementExample>...</GoodRequirementExample>
    <GoodSubRequirementExample>...</GoodSubRequirementExample>
    <!-- end domain-prefixed variants -->
    <GoodExample>...</GoodExample>
    <Why>...</Why>
  </AntiPattern>
</AntiPatterns>
```
````

Domain-prefixed `<Bad<Domain>Example>` / `<Good<Domain>Example>` / `<GoodSub<Domain>Example>` variants are allowed when they aid illustration (as `srs-planning.md` already does for requirement examples). Generic `<BadExample>` + `<GoodExample>` + `<Why>` are the universal minimum.

### Affected tests

Locked precisely during phase planning. Known overlap zones:

- **Doc-contract tests asserting `<AntiPatterns>` block shape per module:** several phase tests under `tests/docs/` and the parameterized template-mirror test. Update assertions to the canonical shape.
- **Doctor / template-integrity tests asserting `templates/docs/core/health-check.md` is in the canonical set:** remove `health-check.md` from the canonical-set fixture; remove or update the per-file repair assertion for that path.
- **`R6-3.B.1.*` doc-contract tests** (verify the content of `docs/core/health-check.md`): no longer have a target after Phase 1 — delete as part of Phase 1.
- **`R7-1.B.7.*` tweak-planning structural tests** (assert `<TweakAntiPatterns>` token): forward-update to canonical `<AntiPatterns>` token.
- **Template-mirror parameterized test:** auto-covers Phase 2 mirrors; only the canonical-set fixture needs to drop `health-check.md` for Phase 1.

Updating tests that asserted the OLD shape or the existence of `health-check.md` is part of revision scope, not a regression — old assertions verify behavior this revision deliberately changes.

### Active-work overlap

None. Revision 9 just completed; no pending revisions queued; no in-flight phase. This revision can run immediately.

---

## SRS implications

**No SRS edits in this revision.** No requirement keeps a stale ID; no requirement gets superseded; no new requirement is introduced.

If a future reviewer believes the canonical anti-pattern shape should itself be an SRS requirement (e.g. "MAS-208 — Canonical Anti-Pattern Block Shape"), that is its own scope-change / future revision; bundling it here would inflate the docs-only scope.

---

## Phases

### Phase 1 — Health-Check Bypass

**Scope:** Remove the health-check protocol from every session-start path; delete `docs/core/health-check.md` and its template mirror; scrub `blueprint-structure.md` (source + template) references; remove `health-check.md` from the Doctor canonical-set if listed; delete or update R6-3 doc-contract tests that target the deleted file. All 7 agent entry-point variants (3 root + 4 template) must remain byte-identical to each other in the SessionStart / HardRules / ModuleRouting block after the edit.

**Dependencies:** None — first phase.

**Success criteria:**
- No live module references `docs/core/health-check.md` or `templates/docs/core/health-check.md`.
- `CLAUDE.md`, `AGENTS.md`, `GEMINI.md` and their `templates/` mirrors are byte-identical in the affected blocks.
- A new session begins with intent classification; no STOP gate runs before user intent is identified.
- Full project test suite (`npm test`) is green.
- Doctor canonical-set no longer lists `health-check.md`.

### Phase 2 — Anti-Pattern Shape Unification

**Scope:** Rewrite every non-canonical `<AntiPatterns>` block across `docs/core/` to match `docs/core/srs-planning.md`'s canonical shape (fenced ```xml, `<AntiPatterns>` wrapper, bare `name=` attribute, `<BadExample>` / `<GoodExample>` / `<Why>` minimum with optional domain-prefixed variants). Convert `docs/core/tweak-planning.md`'s `<TweakAntiPatterns>` numbered-list narrative into eight canonical `<AntiPattern>` entries. Mirror every rewrite into `templates/docs/core/` byte-for-byte. Add a short canonical-shape Anti-Patterns convention paragraph to `docs/conventions.md` and mirror to `templates/docs/conventions.md`. Forward-update doc-contract tests that hardcode the old shape or `<TweakAntiPatterns>` token.

**Dependencies:** Phase 1 (independent code paths but ordering reduces churn in the template-mirror test fixture; Phase 1 settles the canonical-set first).

**Success criteria:**
- Every `<AntiPatterns>` block in `docs/core/*.md` and `templates/docs/core/*.md` matches the canonical shape locked above.
- No file uses the `<TweakAntiPatterns>` wrapper, no `name="ANTI-PATTERN: ..."` prefix, no unfenced raw-XML antipattern blocks remain.
- `docs/conventions.md` and `templates/docs/conventions.md` document the canonical anti-pattern shape and reference `srs-planning.md` as the exemplar.
- Doc-contract / template-mirror tests are forward-updated; full project test suite (`npm test`) is green.
- `tweak-planning.md`'s eight forbidden behaviors are preserved without semantic loss in canonical `<AntiPattern>` entries.

---

## Out of scope

- New SRS requirement for canonical anti-pattern shape (deferred to a possible future revision).
- Replacing health-check protocol with any alternative startup validation (deletion only — alignment.md's empty-state handling remains the sole structural fallback).
- Restructuring the prose content of any anti-pattern (semantics preserved; only XML shape changes).
- Doctor flow changes beyond removing `health-check.md` from the canonical set.
- CLI surface, tracker, board SPA, or any code outside doc-contract tests.

---

## Success criteria (revision-level)

- Both phases complete with full test suite green.
- Agent sessions no longer execute a health-check protocol before intent classification.
- `<AntiPatterns>` blocks across the codebase share one canonical shape, documented in `docs/conventions.md`.
- All 7 agent entry-point variants remain byte-identical in the affected SessionStart blocks.
- No regression in any other workflow (orchestrate, execution, review, tracker, board, tweak).
