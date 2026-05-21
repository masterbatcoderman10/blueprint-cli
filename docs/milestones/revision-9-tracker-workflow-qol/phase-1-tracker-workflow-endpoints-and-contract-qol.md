# Phase 1 — Tracker Workflow Endpoints & Contract QoL Plan

**Status**: Planning
**Milestone**: Revision 9 — Tracker Workflow QoL

---

## Goals

- Add five gated workflow HTTP endpoints to the tracker server (`POST /tasks/:id/start`, `/submit`, `/resume`, `/approve`, `/reject`) with strict source-state enforcement and idempotent no-op behavior when the task is already at the destination state.
- `approve` accepts an optional `comments[]` payload (0..N entries). `reject` requires `comments[]` with at least one entry; empty array returns `400`.
- Apply state change + comment inserts atomically in one SQLite transaction. Any comment validation failure rolls the state change back. The JSON snapshot writes exactly once after the transaction commits.
- Response body for every gated endpoint is `{ task, comments }` — the updated task and the comments inserted by this call (empty array when none were supplied).
- Update `docs/core/execution.md` so the canonical implementer state transitions use `start` and `submit` instead of raw `PATCH /tasks/:id` `state` writes.
- Update `docs/core/review.md` so reviewer approval / rejection uses `approve` / `reject` with the multi-comment payload.
- Add a phase-planning anti-pattern that forbids task titles from duplicating their gate or stream name.
- Update `docs/core/orchestrate.md` references to point at the new endpoint names without changing the orchestrator contract.
- Mirror every touched live doc into `templates/docs/core/**` byte-for-byte.
- Record the MAS-204 elaboration in the SRS change log.

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Revision 6 Phase 1 — Tracker Core (SQLite tracker server with `/tasks` CRUD and `/tasks/:id/comments`) | Complete |
| Revision 6 Phase 4 — JSON snapshot hook on every mutation | Complete |
| Revision 8 Phase 1 — Tracker API-only mutation contract in execution / review / git-workflow docs | Complete |
| `better-sqlite3` available for transactional helpers | Complete |

---

## Gate R9-1.0 — Endpoint Foundation

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R9-1.0.1 | Add canonical state-transition validator covering the five verbs with strict source pairing and idempotent no-op detection | 0.5 | None | Independent |
| R9-1.0.2 | Add transactional helper that performs a state change plus N comment inserts in one SQLite transaction and surfaces a uniform result shape | 0.75 | None | Independent |
| R9-1.0.3 | Add shared request and response types in `src/tracker/types.ts` for gated endpoints and the `{task, comments}` response envelope | 0.25 | None | Independent |
| R9-1.0.4 | Confirm the existing snapshot-on-mutation hook fires exactly once per gated-endpoint transaction (no per-row writes) and add coverage if behavior differs | 0.5 | R9-1.0.2 | Dependent |

### Gate Acceptance Criteria

- [ ] Validator accepts canonical transitions only (TO-DO→IN-PROGRESS, IN-PROGRESS→IN-REVIEW, IN-REVIEW→DONE, IN-REVIEW→REWORK, REWORK→IN-PROGRESS) and returns an idempotent no-op result when source already equals destination.
- [ ] Transactional helper inserts task state change and any supplied comments atomically; comment validation failure rolls back the state change.
- [ ] Shared types are exported from `src/tracker/types.ts` and reused by Stream A and Stream B endpoint handlers.
- [ ] The JSON snapshot is written exactly once per gated-endpoint call, after the transaction commits.

---

## Stream A — Simple-Verb Endpoints

> Adds `start`, `submit`, and `resume` endpoints — the three implementer-driven transitions with no comment payload.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R9-1.A.1 | Implement `POST /tasks/:id/start` (TO-DO → IN-PROGRESS, idempotent no-op on IN-PROGRESS, `409` on any other source state) | 0.5 | Gate | Dependent |
| R9-1.A.2 | Implement `POST /tasks/:id/submit` (IN-PROGRESS → IN-REVIEW, idempotent no-op on IN-REVIEW, `409` on any other source state) | 0.5 | Gate | Dependent |
| R9-1.A.3 | Implement `POST /tasks/:id/resume` (REWORK → IN-PROGRESS, idempotent no-op on IN-PROGRESS, `409` on any other source state) | 0.5 | Gate | Dependent |

### Stream A Acceptance Criteria

- [ ] Each endpoint returns the updated task plus an empty `comments` array on success.
- [ ] Each endpoint enforces its strict source state; illegal source states return `409` with a structured error body.
- [ ] Each endpoint returns `200` with the unchanged task when the source already equals the destination (idempotent no-op).
- [ ] Unknown task ID returns `404`.

---

## Stream B — Reviewer-Verb Endpoints with Multi-Comment

> Adds `approve` and `reject` — reviewer transitions that accept comment payloads and write them atomically with the state change.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R9-1.B.1 | Implement `POST /tasks/:id/approve` (IN-REVIEW → DONE, idempotent no-op on DONE, optional `comments[]` 0..N, atomic insert via the gate helper) | 0.75 | Gate | Dependent |
| R9-1.B.2 | Implement `POST /tasks/:id/reject` (IN-REVIEW → REWORK, idempotent no-op on REWORK, required `comments[]` with ≥1 entry, `400` on empty or missing array, atomic insert via the gate helper) | 0.75 | Gate | Dependent |

### Stream B Acceptance Criteria

- [ ] `approve` accepts a request body with zero or more comments. With zero comments, it transitions state only. With N comments, it inserts each as a row in `review_comments` atomically with the state change.
- [ ] `reject` requires `comments[]` to be present with at least one entry. Missing or empty array returns `400` and no state change occurs.
- [ ] Comment rows created by these endpoints follow the existing `review_comments` schema (severity `MAJOR` | `MINOR`, body, author, optional `parent_id` and `line`).
- [ ] Each endpoint returns the updated task and the array of inserted comments.
- [ ] Illegal source state returns `409`; unknown task ID returns `404`; comment validation failure on any entry rolls back the entire transaction.

---

## Stream C — Workflow Contract Doc Updates + Templates

> Updates execution, review, phase-planning, and orchestrate docs to use the new endpoints, codifies the stream-title duplication anti-pattern, mirrors templates, and records the MAS-204 elaboration.
> **Depends on:** Stream A (verb endpoint shapes locked) and Stream B (approve/reject payload shape locked).

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R9-1.C.1 | Update `docs/core/execution.md` so canonical implementer transitions (`start`, `submit`) use the new gated endpoints; remove raw `PATCH /tasks/:id` `state` recipes for these transitions | 0.75 | R9-1.A.1, R9-1.A.2 | Dependent |
| R9-1.C.2 | Update `docs/core/review.md` so approval and rejection recipes use the `approve` / `reject` endpoints with multi-comment payload examples (1 MAJOR, 1 MAJOR + 2 MINOR, batch with replies) | 0.75 | R9-1.B.1, R9-1.B.2 | Dependent |
| R9-1.C.3 | Add the "Stream-Title Duplication in Task Titles" anti-pattern to `docs/core/phase-planning.md` (task titles must not repeat the gate or stream name they live inside) | 0.5 | None | Independent |
| R9-1.C.4 | Update `docs/core/orchestrate.md` references to point at the new endpoint names without changing the orchestrator contract | 0.25 | R9-1.A.1, R9-1.A.2, R9-1.A.3, R9-1.B.1, R9-1.B.2 | Dependent |
| R9-1.C.5 | Mirror every touched live doc into `templates/docs/core/**` byte-for-byte (`execution.md`, `review.md`, `phase-planning.md`, `orchestrate.md`) | 0.5 | R9-1.C.1, R9-1.C.2, R9-1.C.3, R9-1.C.4 | Dependent |
| R9-1.C.6 | Append the MAS-204 change-log entry recording the Revision 9 Phase 1 elaboration (gated workflow endpoints, multi-comment atomic payload, idempotent no-op semantics) | 0.25 | R9-1.A.1, R9-1.A.2, R9-1.A.3, R9-1.B.1, R9-1.B.2 | Dependent |

### Stream C Acceptance Criteria

- [ ] `execution.md` no longer instructs agents to use raw `PATCH /tasks/:id` `state` for `TO-DO → IN-PROGRESS` or `IN-PROGRESS → IN-REVIEW` transitions.
- [ ] `review.md` documents `approve` and `reject` with at least one multi-comment example each, including the `reject ≥1` requirement.
- [ ] `phase-planning.md` contains the "Stream-Title Duplication in Task Titles" anti-pattern with a bad/good example and rationale.
- [ ] `orchestrate.md` references to canonical transitions are updated to the new endpoint names; no semantic change.
- [ ] `templates/docs/core/execution.md`, `review.md`, `phase-planning.md`, and `orchestrate.md` are byte-for-byte equal to their `docs/core/` counterparts.
- [ ] `docs/srs.md` MAS-204 change log includes a dated Revision 9 Phase 1 entry noting the API deepening; meaning unchanged; ID unchanged.

---

## Parallelization Map

```
Gate R9-1.0 (Endpoint Foundation) ─────────┐
                                            │
               ┌────────────────────────────┤
               │                            │
Stream A (Simple Verbs) ──────────────────► │
Stream B (Reviewer Verbs) ────────────────► │
               │                            │
               └── Stream C (Docs + Mirror) │
                   depends on A + B ──────► │
                                            │
                                            ▼
                                  Phase R9-1 complete
```

---

## Definition of Done

- [ ] Gate R9-1.0 acceptance criteria pass.
- [ ] Stream A acceptance criteria pass.
- [ ] Stream B acceptance criteria pass.
- [ ] Stream C acceptance criteria pass.
- [ ] Full test suite is green (`npm test`).
- [ ] No lint errors in files touched by this phase.
- [ ] `templates/docs/core/**` mirrors stay byte-for-byte aligned with the live docs touched in Stream C.

---

## Test Scenarios

### Happy Path
- [ ] Implementer agent calls `start` on a TO-DO task → response `{ task: IN-PROGRESS, comments: [] }`.
- [ ] Implementer agent calls `submit` on an IN-PROGRESS task → response `{ task: IN-REVIEW, comments: [] }`.
- [ ] Reviewer calls `approve` with no body on an IN-REVIEW task → response `{ task: DONE, comments: [] }`.
- [ ] Reviewer calls `approve` with two MINOR comments → state transitions to DONE and two `review_comments` rows are written under one transaction.
- [ ] Reviewer calls `reject` with three comments (1 MAJOR, 2 MINOR) on an IN-REVIEW task → response `{ task: REWORK, comments: [3 rows] }`.
- [ ] Implementer calls `resume` on a REWORK task → response `{ task: IN-PROGRESS, comments: [] }`.

### Edge Cases
- [ ] `start` on an IN-REVIEW task → `409` with structured error indicating illegal source.
- [ ] `submit` on an IN-REVIEW task → `200` idempotent no-op with unchanged task.
- [ ] `approve` on a TO-DO task → `409`.
- [ ] `reject` with an empty `comments` array → `400`, no state change.
- [ ] `reject` with `comments` missing entirely from the body → `400`, no state change.
- [ ] `approve` with a malformed comment (invalid severity) → `400`, no state change, no comment rows persisted (rollback verified).
- [ ] Unknown task ID on any gated endpoint → `404`.
- [ ] JSON snapshot file is written exactly once per gated-endpoint call (verified by mtime or write count).
- [ ] Touched template doc is intentionally mutated in tests → mirror assertion fails (negative coverage for the mirror guard).
