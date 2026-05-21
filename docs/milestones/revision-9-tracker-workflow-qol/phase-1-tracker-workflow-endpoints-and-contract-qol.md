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

- [ ] Each endpoint returns the updated task plus an empty `comments` array on success, wrapped in the existing `{ ok: true, data: { task, comments } }` envelope used by all tracker routes.
- [ ] Each endpoint enforces its strict source state; illegal source states return `409` with a structured error body.
- [ ] Each endpoint returns `200` with the unchanged task when the source already equals the destination (idempotent no-op).
- [ ] Simple-verb endpoints accept no request body. Any supplied body is ignored without error.
- [ ] Unknown task ID returns `404`.
- [ ] Non-`POST` methods (`GET` / `PUT` / `DELETE` / `PATCH`) on the verb path return the standard method-not-allowed response used by other tracker routes.

---

## Stream B — Reviewer-Verb Endpoints with Multi-Comment

> Adds `approve` and `reject` — reviewer transitions that accept comment payloads and write them atomically with the state change.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R9-1.B.1 | Implement `POST /tasks/:id/approve` (IN-REVIEW → DONE, idempotent no-op on DONE, optional `comments[]` 0..N, atomic insert via the gate helper) | 0.75 | Gate | Dependent |
| R9-1.B.2 | Implement `POST /tasks/:id/reject` (IN-REVIEW → REWORK, idempotent no-op on REWORK, required `comments[]` with ≥1 entry, `400` on empty or missing array, atomic insert via the gate helper) | 0.75 | Gate | Dependent |

### Stream B Acceptance Criteria

- [ ] `approve` accepts a request body with zero or more comments. With zero comments, it transitions state only. With N comments, it inserts each as a row in `review_comments` atomically with the state change.
- [ ] `reject` requires `comments[]` to be present with at least one entry. Missing or empty array (or any non-array value) returns `400` and no state change occurs.
- [ ] Comment rows created by these endpoints follow the existing `review_comments` schema (severity `MAJOR` | `MINOR`, body, author, optional `parent_id` and `line`). Author handling matches the existing `POST /tasks/:id/comments` rules.
- [ ] When `parent_id` is supplied, it must reference an existing comment on the same task; a `parent_id` belonging to a different task returns `400` and rolls the transaction back.
- [ ] **Idempotent no-op rule:** when the source state already equals the destination (DONE for `approve`, REWORK for `reject`), the endpoint returns `200` with the unchanged task and does NOT insert any supplied comments. Reviewers wanting to add comments without a transition must use `POST /tasks/:id/comments` directly.
- [ ] Each endpoint returns the updated task and the array of inserted comments, wrapped in the existing `{ ok: true, data: { task, comments } }` envelope.
- [ ] Illegal source state returns `409`; unknown task ID returns `404`; malformed JSON returns `400`; comment validation failure on any entry rolls back the entire transaction.
- [ ] Non-`POST` methods on the verb path return the standard method-not-allowed response used by other tracker routes.

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
| R9-1.C.7 | Forward-update any R6/R7/R8 doc-contract tests whose expected text references raw `PATCH /tasks/:id` `state` recipes for the canonical transitions now owned by the new endpoints | 0.5 | R9-1.C.1, R9-1.C.2 | Dependent |

### Stream C Acceptance Criteria

- [ ] `execution.md` no longer instructs agents to use raw `PATCH /tasks/:id` `state` for `TO-DO → IN-PROGRESS` or `IN-PROGRESS → IN-REVIEW` transitions.
- [ ] `review.md` documents `approve` and `reject` with at least one multi-comment example each, including the `reject ≥1` requirement.
- [ ] `phase-planning.md` contains the "Stream-Title Duplication in Task Titles" anti-pattern with a bad/good example and rationale.
- [ ] `orchestrate.md` references to canonical transitions are updated to the new endpoint names; no semantic change.
- [ ] `templates/docs/core/execution.md`, `review.md`, `phase-planning.md`, and `orchestrate.md` are byte-for-byte equal to their `docs/core/` counterparts via the existing parameterized mirror test (`tests/stream-c/project-templates-mirror.test.ts`), without duplicating it.
- [ ] `docs/srs.md` MAS-204 change log includes a dated Revision 9 Phase 1 entry noting the API deepening; the MAS-204 requirement ID and meaning are unchanged; prior change-log entries are preserved.
- [ ] Affected R6/R7/R8 doc-contract tests are updated forward-only so the full test suite is green after the doc rewrites in C.1 and C.2.

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

## Test Plan

> Generated from task analysis and tightened after a subagent gap audit. Each testable task has one or more tests mapped to it. Tests are written before implementation (TDD) during task execution. Framework: Vitest (`*.test.ts` under `tests/`, mirroring `src/` layout). Endpoint tests use the existing in-memory tracker DB helpers and assert the `{ ok, data: { task, comments } }` response envelope used by other tracker routes. Doc-contract tests use line-anchored string assertions against the live and template files. The mirror assertions integrate with `tests/stream-c/project-templates-mirror.test.ts` rather than duplicating it.

### Gate R9-1.0 Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R9-1.0.1.1 | R9-1.0.1 | unit | Validator accepts each canonical transition: TO-DO→IN-PROGRESS, IN-PROGRESS→IN-REVIEW, IN-REVIEW→DONE, IN-REVIEW→REWORK, REWORK→IN-PROGRESS | Returns `{ ok: true, kind: 'transition' }` for each pairing |
| T-R9-1.0.1.2 | R9-1.0.1 | unit | Validator detects idempotent no-op when source equals destination for each verb | Returns `{ ok: true, kind: 'noop' }` |
| T-R9-1.0.1.3 | R9-1.0.1 | unit | Validator rejects every illegal source→verb combination via full 5-state × 5-verb matrix sweep | Returns `{ ok: false, code: 'illegal_transition' }` for every illegal cell |
| T-R9-1.0.1.4 | R9-1.0.1 | unit | Validator rejects unknown verb strings and unknown source-state symbols (defensive surface for upstream tampering) | Returns `{ ok: false, code: 'unknown_verb' }` or `{ ok: false, code: 'unknown_state' }` |
| T-R9-1.0.2.1 | R9-1.0.2 | integration | Transactional helper commits state change and N comment inserts atomically | Task state updated and all comment rows visible after commit |
| T-R9-1.0.2.2 | R9-1.0.2 | integration | Helper rolls back state change when any comment fails validation (severity, parent_id-cross-task, malformed) | Task state unchanged; zero comment rows for the task |
| T-R9-1.0.2.3 | R9-1.0.2 | integration | Helper returns uniform result shape `{ task, comments }` populated from the same transaction for both empty and non-empty comment arrays | Result shape matches contract |
| T-R9-1.0.2.4 | R9-1.0.2 | integration | Two concurrent gated calls on the same task serialize through SQLite; exactly one wins the transition, the other observes the destination state and either no-ops or returns `409` per the validator | Single state change applied; no partial comment inserts; exactly one snapshot write per request |
| — | R9-1.0.3 | — | Not testable: pure TypeScript type declarations; runtime behavior is exercised through Stream A and B endpoint tests | — |
| T-R9-1.0.4.1 | R9-1.0.4 | integration | Successful gated endpoint call triggers exactly one JSON snapshot write per request, after the transaction commits | Snapshot file mtime / write counter advances by exactly 1 |
| T-R9-1.0.4.2 | R9-1.0.4 | integration | Failed gated call (validation error rollback) writes no snapshot | Snapshot mtime / counter unchanged |
| T-R9-1.0.4.3 | R9-1.0.4 | integration | Idempotent no-op call writes the snapshot exactly once (same as a transition) so observers see a consistent post-call state | Snapshot mtime / counter advances by exactly 1 |
| T-R9-1.0.4.4 | R9-1.0.4 | integration | Snapshot write failure (simulated by making `tasks.export.json` unwritable) does NOT fail the HTTP response or roll back the database transition (consistent with the R6 Phase 4 snapshot contract) | HTTP `200`; task state persisted in DB; error logged |
| T-R9-1.0.5.1 | R9-1.0.4 | integration | Regression: existing raw `PATCH /tasks/:id` route still accepts arbitrary `state` writes for non-canonical edits (no new validation imposed by R9 P1 on the legacy PATCH surface) | PATCH still returns `200` for any state value the existing route accepted before R9 |

### Stream A Tests

> A.1 fixtures are written as a parameterized sweep across `start`, `submit`, and `resume`. Tests listed under `R9-1.A.1` apply to all three verbs unless scoped otherwise. Per-verb happy paths are listed under their own task.

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R9-1.A.1.1 | R9-1.A.1 | integration | `POST /tasks/:id/start` on a TO-DO task transitions to IN-PROGRESS and returns the envelope `{ ok: true, data: { task, comments: [] } }` | `200`; task row state is IN-PROGRESS; envelope shape exact |
| T-R9-1.A.1.2 | R9-1.A.1 | integration | `start` on an IN-PROGRESS task returns idempotent no-op with unchanged task | `200`; task state unchanged |
| T-R9-1.A.1.3 | R9-1.A.1 | integration | `start` on IN-REVIEW / REWORK / DONE returns `409` with structured error | `409`; task state unchanged |
| T-R9-1.A.1.4 | R9-1.A.1 | integration | `start` on unknown task ID returns `404` | `404` |
| T-R9-1.A.1.5 | R9-1.A.1 | integration | Parameterized across all three simple verbs: response envelope is `{ ok: true, data: { task, comments: [] } }` on the happy path (no bare data leakage, no missing `ok` field) | All three verbs produce identical envelope structure |
| T-R9-1.A.1.6 | R9-1.A.1 | integration | Parameterized across all three simple verbs: non-`POST` methods (`GET` / `PUT` / `DELETE` / `PATCH`) on the verb path return the standard method-not-allowed response used by other tracker routes | Consistent `405`/`404` matching existing `methodNotFound()` behavior |
| T-R9-1.A.1.7 | R9-1.A.1 | integration | Parameterized across all three simple verbs: a request body sent to a no-body verb is ignored without error (contract locks "ignore, do not 400") | `200` with normal transition or no-op result; body silently discarded |
| T-R9-1.A.2.1 | R9-1.A.2 | integration | `POST /tasks/:id/submit` on IN-PROGRESS transitions to IN-REVIEW | `200`; task row state is IN-REVIEW |
| T-R9-1.A.2.2 | R9-1.A.2 | integration | `submit` on IN-REVIEW returns idempotent no-op | `200`; task unchanged |
| T-R9-1.A.2.3 | R9-1.A.2 | integration | `submit` on TO-DO / REWORK / DONE returns `409` | `409`; task unchanged |
| T-R9-1.A.2.4 | R9-1.A.2 | integration | `submit` on unknown task ID returns `404` | `404` |
| T-R9-1.A.3.1 | R9-1.A.3 | integration | `POST /tasks/:id/resume` on REWORK transitions to IN-PROGRESS | `200`; task row state is IN-PROGRESS |
| T-R9-1.A.3.2 | R9-1.A.3 | integration | `resume` on IN-PROGRESS returns idempotent no-op | `200`; task unchanged |
| T-R9-1.A.3.3 | R9-1.A.3 | integration | `resume` on TO-DO / IN-REVIEW / DONE returns `409` | `409`; task unchanged |
| T-R9-1.A.3.4 | R9-1.A.3 | integration | `resume` on unknown task ID returns `404` | `404` |

### Stream B Tests

> B.1 fixtures parameterize comment-payload rules across `approve` and `reject` where the rule is symmetric (author handling, malformed JSON, non-array `comments`, cross-task `parent_id`, method-not-allowed, envelope shape).

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R9-1.B.1.1 | R9-1.B.1 | integration | `POST /tasks/:id/approve` on IN-REVIEW with no body transitions to DONE with empty comments array | `200`; `{ task: DONE, comments: [] }` inside envelope |
| T-R9-1.B.1.2 | R9-1.B.1 | integration | `approve` with `comments: []` behaves identically to no body | `200`; `{ task: DONE, comments: [] }` |
| T-R9-1.B.1.3 | R9-1.B.1 | integration | `approve` with two MINOR comments transitions to DONE and persists both comment rows atomically | `200`; two rows in `review_comments` linked to the task; severity preserved |
| T-R9-1.B.1.4 | R9-1.B.1 | integration | **Idempotent no-op rule:** `approve` on DONE returns `200` with the unchanged task and does NOT insert any supplied comments (no-op contract — reviewers wanting to add comments use `POST /tasks/:id/comments`) | `200`; task unchanged; zero new `review_comments` rows; response `comments: []` |
| T-R9-1.B.1.5 | R9-1.B.1 | integration | `approve` on TO-DO / IN-PROGRESS / REWORK returns `409`; no comment rows persisted | `409`; zero new comment rows |
| T-R9-1.B.1.6 | R9-1.B.1 | integration | `approve` with a malformed comment (invalid severity, missing body, oversized body) returns `400`; state and comments rolled back | `400`; task unchanged; zero comment rows |
| T-R9-1.B.1.7 | R9-1.B.1 | integration | `approve` on unknown task ID returns `404` | `404` |
| T-R9-1.B.1.8 | R9-1.B.1 | integration | `approve` comments respect optional `parent_id` and `line` fields, threading replies to an existing comment on the same task; both fields round-trip into the persisted rows | `200`; reply rows carry the supplied `parent_id` and `line` |
| T-R9-1.B.1.9 | R9-1.B.1 | integration | Parameterized across `approve` and `reject`: comment `author` handling matches the existing `POST /tasks/:id/comments` rules — extract the existing behavior in test setup and assert equivalence (missing → same outcome; non-string → same outcome) | Behavior parity with the existing comments endpoint |
| T-R9-1.B.1.10 | R9-1.B.1 | integration | Parameterized across `approve` and `reject`: `parent_id` referencing a comment on a DIFFERENT task returns `400` and rolls back the entire transaction | `400`; task state unchanged; zero new comment rows |
| T-R9-1.B.1.11 | R9-1.B.1 | integration | Parameterized across `approve` and `reject`: malformed JSON body returns `400` (`invalid_json` code); no state change | `400`; task unchanged |
| T-R9-1.B.1.12 | R9-1.B.1 | integration | Parameterized across `approve` and `reject`: non-array `comments` value (`null`, string, object) returns `400`; no state change | `400`; task unchanged |
| T-R9-1.B.1.13 | R9-1.B.1 | integration | Parameterized across `approve` and `reject`: response envelope is `{ ok: true, data: { task, comments } }` on the happy path | Envelope shape exact |
| T-R9-1.B.1.14 | R9-1.B.1 | integration | Parameterized across `approve` and `reject`: non-`POST` methods return method-not-allowed consistent with other tracker routes | Consistent `405`/`404` |
| T-R9-1.B.2.1 | R9-1.B.2 | integration | `POST /tasks/:id/reject` on IN-REVIEW with one MAJOR comment transitions to REWORK and persists the comment | `200`; `{ task: REWORK, comments: [1 row] }` |
| T-R9-1.B.2.2 | R9-1.B.2 | integration | `reject` on IN-REVIEW with 1 MAJOR + 2 MINOR persists all three comments atomically | `200`; three rows in `review_comments`; task state REWORK |
| T-R9-1.B.2.3 | R9-1.B.2 | integration | `reject` with `comments: []` returns `400`; no state change | `400`; task unchanged; zero comment rows |
| T-R9-1.B.2.4 | R9-1.B.2 | integration | `reject` with `comments` field missing from body returns `400`; no state change | `400`; task unchanged |
| T-R9-1.B.2.5 | R9-1.B.2 | integration | **Idempotent no-op rule:** `reject` on REWORK returns `200` with the unchanged task and does NOT insert any supplied comments | `200`; task unchanged; zero new comment rows; response `comments: []` |
| T-R9-1.B.2.6 | R9-1.B.2 | integration | `reject` on TO-DO / IN-PROGRESS / DONE returns `409`; no comment rows persisted | `409`; zero new comment rows |
| T-R9-1.B.2.7 | R9-1.B.2 | integration | `reject` with a malformed comment in a batch of three returns `400`; full rollback (no partial inserts) | `400`; task unchanged; zero comment rows |
| T-R9-1.B.2.8 | R9-1.B.2 | integration | `reject` on unknown task ID returns `404` | `404` |

### Stream C Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R9-1.C.1.1 | R9-1.C.1 | unit (doc-contract) | `docs/core/execution.md` references `POST /tasks/:id/start` and `POST /tasks/:id/submit` for canonical implementer transitions, each with at least one curl recipe | Both endpoint references and recipes present |
| T-R9-1.C.1.2 | R9-1.C.1 | unit (doc-contract) | `docs/core/execution.md` no longer contains raw `PATCH /tasks/:id` recipes that set `state` to `IN-PROGRESS` or `IN-REVIEW`. The test enumerates the specific phrases that existed before the rewrite and asserts each is absent (line-anchored negative grep, not loose substring) | Every enumerated phrase absent from the file |
| T-R9-1.C.2.1 | R9-1.C.2 | unit (doc-contract) | `docs/core/review.md` documents `POST /tasks/:id/approve` and `POST /tasks/:id/reject` with at least one multi-comment example each | Both endpoints + multi-comment examples present |
| T-R9-1.C.2.2 | R9-1.C.2 | unit (doc-contract) | `docs/core/review.md` states the `reject ≥1` comment requirement explicitly | Required-comment language present near the `reject` recipe |
| T-R9-1.C.2.3 | R9-1.C.2 | unit (doc-contract) | `docs/core/review.md` no longer contains raw `PATCH /tasks/:id` recipes that set `state` to `DONE` or `REWORK`. Test enumerates the specific pre-rewrite phrases and asserts each is absent (line-anchored) | Every enumerated phrase absent from the file |
| T-R9-1.C.3.1 | R9-1.C.3 | unit (doc-contract) | Parse `docs/core/phase-planning.md`, locate the `<AntiPatterns>` block, and assert that "Stream-Title Duplication in Task Titles" appears INSIDE that block as a proper `<AntiPattern>` node with required `<BadExample>` and `<Why>` children — not anywhere else in the file | Anti-pattern XML node present inside the `<AntiPatterns>` block with required children |
| T-R9-1.C.4.1 | R9-1.C.4 | unit (doc-contract) | `docs/core/orchestrate.md` references the new endpoint names where previous tracker state-change references existed; the orchestrator contract language (gate-first, parallel streams, per-stream loop) is byte-identical apart from those references | Endpoint references updated; contract language unchanged |
| T-R9-1.C.5.1 | R9-1.C.5 | unit (mirror) | Confirm that `execution.md`, `review.md`, `phase-planning.md`, and `orchestrate.md` are already covered by the parameterized `mirrorPairs` list in `tests/stream-c/project-templates-mirror.test.ts`. Add any that are not, then run the existing parameterized test — no duplicate per-file mirror tests are added | Existing parameterized mirror test passes for all four files |
| T-R9-1.C.6.1 | R9-1.C.6 | unit (doc-contract) | `docs/srs.md` MAS-204 metadata contains a new dated Revision 9 Phase 1 change-log entry describing the gated workflow endpoints, multi-comment atomic payload, and idempotent no-op semantics; MAS-204's ID and Status are unchanged; all prior change-log entries are preserved verbatim | New change-log line present; ID and Status unchanged; prior entries preserved |
| T-R9-1.C.7.1 | R9-1.C.7 | unit (doc-contract) | After the doc rewrites in C.1 and C.2, every previously-passing R6/R7/R8 doc-contract test that referenced raw `PATCH /tasks/:id` state recipes for canonical transitions has been forward-updated to point at the new gated endpoints. Full test suite (`npm test`) is green | All previously-passing tests still pass after the forward updates |

### Test Summary

| Component | Total Tasks | Testable | Not Testable |
|-----------|-------------|----------|--------------|
| Gate R9-1.0 | 4 | 3 | 1 |
| Stream A | 3 | 3 | 0 |
| Stream B | 2 | 2 | 0 |
| Stream C | 7 | 7 | 0 |
| **Total** | **16** | **15** | **1** |

---

## Definition of Done

- [ ] Gate R9-1.0 acceptance criteria pass.
- [ ] Stream A acceptance criteria pass.
- [ ] Stream B acceptance criteria pass.
- [ ] Stream C acceptance criteria pass.
- [ ] All tests in the Test Plan pass.
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
