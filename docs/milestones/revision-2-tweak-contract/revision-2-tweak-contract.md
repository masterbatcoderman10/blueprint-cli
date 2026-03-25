# Revision 2 — Tweak Contract

**Status**: Planning
**Priority**: Immediate
**Trigger**: Mid-execution self-review revealed no formal contract for small, in-phase corrections to completed tasks. The only existing pathway (full revision) is too heavyweight for minor alignment fixes.

---

## What Is Changing

Blueprint gains a new contract type — the **tweak** — for lightweight corrections to completed tasks within a single phase. This adds:

1. A new core module (`docs/core/tweak-planning.md`) defining the tweak workflow
2. A Tweaks section in the phase document template so corrections are tracked inline
3. A routing entry in all AGENTS.md variants so agents can discover the workflow
4. Doctor awareness of the new core file

## Why

During active phase execution, a user may discover that completed tasks don't align with the knowledge base or other prior context. Today the options are:

- Fix informally (no contract, no tracking — risky)
- Full revision (own subfolder, document, phases — overkill)

A tweak fills the gap: formal enough to track, light enough to not interrupt flow.

## Impact Analysis

| Area | Impact |
|------|--------|
| M1 Phase 2 (Scaffold Engine) | Templates updated — phase-planning.md gains Tweaks section |
| M1 Phase 3 (Template Integrity) | Doctor structure registry gains new core file |
| AGENTS.md routing (all variants) | New row for tweak intent |
| Existing tests | None broken — purely additive |

## Phases

This revision requires a single phase.

| Phase | Name | Scope |
|-------|------|-------|
| 1 | Tweak Contract & Template Integration | New module, template updates, routing, Doctor registration |

## Success Criteria

- [ ] `docs/core/tweak-planning.md` exists and defines the full tweak workflow
- [ ] Phase document template includes a Tweaks section
- [ ] All AGENTS.md variants route tweak intent to the new module
- [ ] Doctor's `CANONICAL_CORE_FILES` includes the new file
- [ ] `blueprint doctor` can detect and repair the missing file in existing projects
- [ ] All existing tests remain green
