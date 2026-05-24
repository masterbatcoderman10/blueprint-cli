---
name: tracker
description: Cheatsheet-first reference for the local task tracker HTTP API, board lifecycle, and gated transitions; routes tracker-reference intent
---
# Tracker Contract

This document defines the canonical contract for the Blueprint local task tracker. It is organized cheatsheet-first: the most common agent operations appear at the top, with deeper reference material below.

## Board lifecycle

### Start

```bash
blueprint board            # default: start the board + open browser
blueprint board start      # same as above
blueprint board --headless # start without opening the browser
```

The server binds to `127.0.0.1` on a dynamic port in the range `7300–7309`. On start it writes a **shared lock** at `<git-common-dir>/blueprint-board.lock` containing:

```json
{
  "pid": 12345,
  "port": 7300,
  "started_at": 1716012345678,
  "worktree": "/abs/path/to/worktree"
}
```

All worktrees of one repository share the same lock file because `<git-common-dir>` is identical across linked worktrees.

**Duplicate-start refusal:** If the shared lock is alive (pid is running and `/project` responds on the recorded port), a second `blueprint board` — from the same worktree or a peer worktree — refuses with a message containing the live URL and originating worktree, does **not** open the browser, and exits `1`.

**Legacy-lock migration:** On first boot under the new code, if a legacy `docs/.blueprint/board.lock` exists in the current worktree, it is deleted and a one-line migration warning is printed. Subsequent boots emit no warning.

**Agent-initiated background boot:** If `docs/.blueprint/tasks.db` exists but the board is unreachable, an agent may spawn the board in the background:

```bash
blueprint board --headless &
```

After spawning, poll `GET /project` until it succeeds before issuing further tracker requests.

### Stop

```bash
blueprint board stop
```

- No lock → prints `No board running.`, exits `0`.
- Stale lock (pid dead or port unreachable) → prints `Cleared stale lock (pid <pid>, port <port>).`, removes lock, exits `0`.
- Live lock → sends `SIGTERM`; if the process is still alive after 2 s, escalates to `SIGKILL`; verifies `/project` is unreachable for up to 1 s; removes lock; prints `Stopped board (pid <pid>, port <port>).`, exits `0`.

### Status

```bash
blueprint board status
```

| State | Output | Exit code |
|-------|--------|-----------|
| Live | `Board running at http://127.0.0.1:<port> (pid <pid>, worktree <worktree>, uptime <human>).` | `0` |
| Stale | `Stale lock detected (pid <pid>, port <port>, worktree <worktree>). Run \`blueprint board stop\` to clear.` | `1` |
| None | `No board running for this repo.` | `2` |

**Git context required:** All three subcommands require a git repository (`git rev-parse --git-common-dir` must succeed). Without git, the command refuses with a canonical no-git error message and exits `1`.

## Gated transitions

The five canonical state transitions have dedicated HTTP endpoints with source-state enforcement and idempotent no-op semantics. Always prefer these over raw `PATCH`.

### Start work — `POST /tasks/:id/start`

Transitions `TO-DO → IN-PROGRESS`. Idempotent: already `IN-PROGRESS` is a no-op.

```bash
curl -X POST http://127.0.0.1:7300/tasks/R9-2.B.1/start \
  -H "Content-Type: application/json"
```

### Submit for review — `POST /tasks/:id/submit`

Transitions `IN-PROGRESS → IN-REVIEW`. Idempotent: already `IN-REVIEW` is a no-op.

```bash
curl -X POST http://127.0.0.1:7300/tasks/R9-2.B.1/submit \
  -H "Content-Type: application/json"
```

### Approve — `POST /tasks/:id/approve`

Transitions `IN-REVIEW → DONE`. Accepts optional `comments[]` (0..N entries). Idempotent: already `DONE` is a no-op (supplied comments are **not** inserted on no-op).

```bash
# Approve with review notes
curl -X POST http://127.0.0.1:7300/tasks/R9-2.B.1/approve \
  -H "Content-Type: application/json" \
  -d '{
    "comments": [
      { "severity": "MINOR", "body": "Clean implementation.", "author": "reviewer" },
      { "severity": "MINOR", "body": "Good test coverage.", "author": "reviewer" }
    ]
  }'

# Approve without comments
curl -X POST http://127.0.0.1:7300/tasks/R9-2.B.1/approve \
  -H "Content-Type: application/json"
```

### Reject — `POST /tasks/:id/reject`

Transitions `IN-REVIEW → REWORK`. **Requires** `comments[]` with ≥1 entry (empty/missing/non-array → 400). State change + comment inserts run in a single transaction. Idempotent: already `REWORK` is a no-op (supplied comments are **not** inserted on no-op).

```bash
curl -X POST http://127.0.0.1:7300/tasks/R9-2.B.1/reject \
  -H "Content-Type: application/json" \
  -d '{
    "comments": [
      { "severity": "MAJOR", "body": "Missing error handling in the lock path.", "author": "reviewer" },
      { "severity": "MINOR", "body": "Consider extracting the loop into a helper.", "author": "reviewer" }
    ]
  }'
```

### Resume rework — `POST /tasks/:id/resume`

Transitions `REWORK → IN-PROGRESS`. Idempotent: already `IN-PROGRESS` is a no-op.

```bash
curl -X POST http://127.0.0.1:7300/tasks/R9-2.B.1/resume \
  -H "Content-Type: application/json"
```

### Error responses

All gated endpoints return:

| Code | Meaning |
|------|---------|
| `invalid_source_state` | Task is in a state that cannot reach the target via this verb. |
| `invalid_comments` | `reject` was called without a valid `comments[]` array with ≥1 entry. |
| `not_found` | Task ID does not exist. |

## Comment recipes

### Post a standalone comment

```bash
curl -X POST http://127.0.0.1:7300/tasks/R9-2.B.1/comments \
  -H "Content-Type: application/json" \
  -d '{
    "severity": "MAJOR",
    "body": "Missing state-machine diagram.",
    "author": "reviewer"
  }'
```

### Reply to a comment (threaded)

```bash
curl -X POST http://127.0.0.1:7300/tasks/R9-2.B.1/comments \
  -H "Content-Type: application/json" \
  -d '{
    "severity": "MINOR",
    "body": "Diagram added in commit abc123.",
    "author": "implementer",
    "parent_id": 42
  }'
```

### List comments for a task

```bash
curl http://127.0.0.1:7300/tasks/R9-2.B.1/comments
```

### Severity choice rules

| Severity | When to use |
|----------|-------------|
| `MAJOR` | Blocks approval. Must be addressed before the task can leave review. |
| `MINOR` | Advisory or style-level. The reviewer may approve with minor notes outstanding. |

### Multi-comment approve/reject reminders

- `approve` accepts optional `comments[]` (0..N) for final review notes applied atomically with the state change.
- `reject` **requires** `comments[]` with ≥1 entry explaining why the task was rejected. Every rejection must have at least one written reason.

## Task creation

### Create a single task — `POST /tasks`

```bash
curl -X POST http://127.0.0.1:7300/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "id": "R9-2.B.1",
    "title": "[R9-2.B.1] Rewrite tracker.md cheatsheet-first",
    "description": "Phase: R9-2\nGate/Stream: Stream B\nDuration: 1.5\nDependencies: None\n\nDetail: Rewrite docs/core/tracker.md…",
    "state": "TO-DO",
    "phase": "R9-2",
    "stream": "B"
  }'
```

### Batch creation order

When creating all tasks for a gate or stream at once, create them in the order they appear in the phase document. This ensures dependency order is preserved in the tracker. Gate/stream linkage is captured via the `phase` and `stream` fields.

### Dependency capture

Record the task IDs a task depends on in the description under a `Dependencies:` line. The tracker does not enforce dependencies at the database level — the agent respects them during execution.

### List tasks with filters — `GET /tasks?phase=&stream=`

```bash
curl "http://127.0.0.1:7300/tasks?phase=R9-2&stream=B"
```

### Get a single task — `GET /tasks/:id`

```bash
curl http://127.0.0.1:7300/tasks/R9-2.B.1
```

### Delete a task — `DELETE /tasks/:id`

```bash
curl -X DELETE http://127.0.0.1:7300/tasks/R9-2.B.1
```

---

The sections below contain deeper reference material. For day-to-day agent operation, the sections above should be sufficient.

## Storage location + on-disk layout

The tracker stores all state under `docs/.blueprint/` inside the project root:

| File | Purpose |
|------|---------|
| `docs/.blueprint/tasks.db` | SQLite database (better-sqlite3) containing tasks, comments, and project metadata. |
| `docs/.blueprint/manifest.json` | Project manifest managed by the CLI scaffold engine. |

The project root is discovered by walking upward from `process.cwd()` until a directory containing `docs/.blueprint` is found.

> **Note:** The board lock file is no longer stored under `docs/.blueprint/`. It now lives at `<git-common-dir>/blueprint-board.lock` so all worktrees of a repository share a single live board. See [Board lifecycle](#board-lifecycle) for details.

## Schema reference

The canonical schema is defined in `src/tracker/schema.ts`. Do not duplicate the DDL elsewhere; link to that file as the single source of truth.

The schema comprises three tables:

- **`tasks`** — The primary work-unit table. Columns include `id`, `title`, `description`, `state`, `phase`, `stream`, `author`, `implementation_notes`, `milestone`, `created_at`, `updated_at`.
- **`review_comments`** — Threaded review comments attached to tasks. Columns include `id`, `task_id`, `parent_id`, `severity`, `body`, `author`, `line`, `created_at`, `updated_at`. Foreign keys cascade on delete.
- **`project_meta`** — Singleton row (`id = 1`) holding project identity: `name`, `tagline`, `phase_count`, `stream_count`.

Indexes exist on `tasks(state)`, `tasks(phase, stream)`, `review_comments(task_id)`, and `review_comments(parent_id)`.

## 5-state machine + canonical transitions

Tasks move through exactly five states:

```
TO-DO → IN-PROGRESS → IN-REVIEW → REWORK → DONE
```

The canonical workflow is:

1. A task begins in **TO-DO**.
2. When work starts, move it to **IN-PROGRESS** (`POST /tasks/:id/start`).
3. When the implementer considers it complete, move it to **IN-REVIEW** (`POST /tasks/:id/submit`).
4. If review finds issues, move it to **REWORK** (`POST /tasks/:id/reject`).
5. After rework, the canonical forward transition is **REWORK → IN-PROGRESS → IN-REVIEW** (`resume` then `submit`) before it can reach **DONE**.
6. Once accepted in review, move it to **DONE** (`POST /tasks/:id/approve`).

No state outside `TO-DO`, `IN-PROGRESS`, `IN-REVIEW`, `REWORK`, `DONE` is valid.

## Lock-file semantics

The board server writes a shared lock at `<git-common-dir>/blueprint-board.lock`. The `git common dir` is resolved via `git rev-parse --git-common-dir` and is the same absolute path for all worktrees of a repository.

**Lock payload:**

```json
{
  "pid": 12345,
  "port": 7300,
  "started_at": 1716012345678,
  "worktree": "/abs/path/to/booting/worktree"
}
```

- **`pid`** — OS process ID of the running board server.
- **`port`** — The port the server bound to.
- **`started_at`** — Unix epoch timestamp in milliseconds.
- **`worktree`** — Absolute path of the worktree that started the board (captured at boot time via `git rev-parse --show-toplevel`).

**Stale lock handling:** Before starting, the CLI reads any existing lock and checks whether the PID is alive (`kill(pid, 0)`) and whether `GET /project` responds on the recorded port. If either check fails, the lock is considered stale and is removed automatically. If the lock is alive, the CLI refuses to start a second instance.

**Legacy lock (`docs/.blueprint/board.lock`):** On first boot under the new code, a legacy lock at the old per-worktree path is detected and deleted with a one-line migration warning. The new code never writes to the legacy path.

Advisory note: Agents and users should not write `blueprint-board.lock` manually. Always let the board server create it, or use the CLI `blueprint board` command.

## Full curl reference

### Tasks

#### Create a task — `POST /tasks`
```bash
curl -X POST http://127.0.0.1:7300/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "id": "R9-2.B.1",
    "title": "Rewrite tracker.md",
    "description": "Write the tracker contract doc.",
    "state": "TO-DO",
    "phase": "R9-2",
    "stream": "B"
  }'
```

#### Update a task (non-canonical state change) — `PATCH /tasks/:id`

> **⚠ Non-canonical path.** For the five canonical transitions (`TO-DO → IN-PROGRESS → IN-REVIEW → REWORK → DONE`), use the gated endpoints (`start`, `submit`, `approve`, `reject`, `resume`) documented above. Raw `PATCH` bypasses source-state validation and should only be used for uncommon transitions (e.g., an `IN-REVIEW → IN-PROGRESS` loop during review-note application).

```bash
curl -X PATCH http://127.0.0.1:7300/tasks/R9-2.B.1 \
  -H "Content-Type: application/json" \
  -d '{"state":"IN-PROGRESS"}'
```

#### List tasks with filters — `GET /tasks?phase=&stream=`
```bash
curl "http://127.0.0.1:7300/tasks?phase=R9-2&stream=B"
```

#### Get a single task — `GET /tasks/:id`
```bash
curl http://127.0.0.1:7300/tasks/R9-2.B.1
```

#### Delete a task — `DELETE /tasks/:id`
```bash
curl -X DELETE http://127.0.0.1:7300/tasks/R9-2.B.1
```

### Comments

#### Create a comment on a task — `POST /tasks/:id/comments`
```bash
curl -X POST http://127.0.0.1:7300/tasks/R9-2.B.1/comments \
  -H "Content-Type: application/json" \
  -d '{
    "severity": "MAJOR",
    "body": "Missing state-machine diagram.",
    "author": "reviewer"
  }'
```

Severity must be `MAJOR` or `MINOR`. An optional `parent_id` creates a threaded reply.

#### List comments for a task — `GET /tasks/:id/comments`
```bash
curl http://127.0.0.1:7300/tasks/R9-2.B.1/comments
```

### Project

#### Get project metadata — `GET /project`
```bash
curl http://127.0.0.1:7300/project
```

Returns the singleton row from `project_meta` (fields: `name`, `tagline`, `phaseCount`, `streamCount`).

---

## Terminology and canonical snippet table

| Term | Canonical meaning |
|------|-------------------|
| **tracker** | The local SQLite-backed task system exposed via HTTP. Not an external kanban service. |
| **tracker project id** | The value of `project_meta.name` (returned by `GET /project`). Identifies this Blueprint project to agents. |
| **REWORK** | A task state indicating it was rejected during review and must be corrected before re-entering `IN-REVIEW`. |
| **/tasks** | Collection endpoint for creating (`POST`) and listing (`GET`) tasks. |
| **/tasks/:id** | Single-task endpoint for read (`GET`), update (`PATCH`), and delete (`DELETE`). |
| **/tasks/:id/comments** | Comment collection endpoint for a specific task. `POST` to create; `GET` to list. |
| **/tasks/:id/start** | Gated endpoint: `TO-DO → IN-PROGRESS`. |
| **/tasks/:id/submit** | Gated endpoint: `IN-PROGRESS → IN-REVIEW`. |
| **/tasks/:id/approve** | Gated endpoint: `IN-REVIEW → DONE`. Accepts optional `comments[]`. |
| **/tasks/:id/reject** | Gated endpoint: `IN-REVIEW → REWORK`. Requires `comments[]` with ≥1 entry. |
| **/tasks/:id/resume** | Gated endpoint: `REWORK → IN-PROGRESS`. |
| **/project** | Singleton endpoint returning project metadata. |

### Reusable curl snippets

Use these snippets verbatim in Stream A/B docs and agent prompts.

**Start work on a task:**
```bash
curl -X POST http://127.0.0.1:7300/tasks/<id>/start \
  -H "Content-Type: application/json"
```

**Submit task for review:**
```bash
curl -X POST http://127.0.0.1:7300/tasks/<id>/submit \
  -H "Content-Type: application/json"
```

**Approve a task:**
```bash
curl -X POST http://127.0.0.1:7300/tasks/<id>/approve \
  -H "Content-Type: application/json"
```

**Reject a task with comments:**
```bash
curl -X POST http://127.0.0.1:7300/tasks/<id>/reject \
  -H "Content-Type: application/json" \
  -d '{
    "comments": [
      { "severity": "MAJOR", "body": "<reason>", "author": "reviewer" }
    ]
  }'
```

**Resume rework:**
```bash
curl -X POST http://127.0.0.1:7300/tasks/<id>/resume \
  -H "Content-Type: application/json"
```

**List tasks by phase and stream:**
```bash
curl "http://127.0.0.1:7300/tasks?phase=<phase>&stream=<stream>"
```

**Post a MAJOR review comment:**
```bash
curl -X POST http://127.0.0.1:7300/tasks/<id>/comments \
  -H "Content-Type: application/json" \
  -d '{"severity":"MAJOR","body":"<comment>","author":"<name>"}'
```

**Get project metadata:**
```bash
curl http://127.0.0.1:7300/project
```
