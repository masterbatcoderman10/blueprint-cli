# Tracker Contract

This document defines the canonical contract for the Blueprint local task tracker. It covers on-disk storage, schema, state machine, HTTP API, lock semantics, and the board server lifecycle.

## Storage location + on-disk layout

The tracker stores all state under `docs/.blueprint/` inside the project root:

| File | Purpose |
|------|---------|
| `docs/.blueprint/tasks.db` | SQLite database (better-sqlite3) containing tasks, comments, and project metadata. |
| `docs/.blueprint/board.lock` | JSON lock file written by the board server when it starts. |
| `docs/.blueprint/manifest.json` | Project manifest managed by the CLI scaffold engine. |

The project root is discovered by walking upward from `process.cwd()` until a directory containing `docs/.blueprint` is found.

## Schema reference

The canonical schema is defined in `src/tracker/schema.ts`. Do not duplicate the DDL elsewhere; link to that file as the single source of truth.

The schema comprises three tables:

- **`tasks`** — The primary work-unit table. Columns include `id`, `title`, `description`, `state`, `phase`, `stream`, `author`, `implementation_notes`, `created_at`, `updated_at`.
- **`review_comments`** — Threaded review comments attached to tasks. Columns include `id`, `task_id`, `parent_id`, `severity`, `body`, `author`, `line`, `created_at`, `updated_at`. Foreign keys cascade on delete.
- **`project_meta`** — Singleton row (`id = 1`) holding project identity: `name`, `tagline`, `phase_count`, `stream_count`.

Indexes exist on `tasks(state)`, `tasks(phase, stream)`, `review_comments(task_id)`, and `review_comments(parent_id)`.

## 5-state machine + canonical transitions

Tasks move through exactly five states:

```
TO-DO → IN-PROGRESS → IN-REVIEW → REWORK → DONE
```

Allowed transitions are not enforced at the database level, but the canonical workflow is:

1. A task begins in **TO-DO**.
2. When work starts, move it to **IN-PROGRESS**.
3. When the implementer considers it complete, move it to **IN-REVIEW**.
4. If review finds issues, move it to **REWORK**.
5. After rework, the canonical forward transition is **REWORK → IN-PROGRESS → IN-REVIEW** before it can reach **DONE**.
6. Once accepted in review, move it to **DONE**.

No state outside `TO-DO`, `IN-PROGRESS`, `IN-REVIEW`, `REWORK`, `DONE` is valid.

## CRUD endpoints + curl recipes

The board exposes a JSON HTTP API on `127.0.0.1` (default port `7300`). All request and response bodies are JSON.

### Tasks

#### Create a task — `POST /tasks`
```bash
curl -X POST http://127.0.0.1:7300/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "id": "R6-3.0.1",
    "title": "Draft tracker.md",
    "description": "Write the tracker contract doc.",
    "state": "TO-DO",
    "phase": "R6-3",
    "stream": "0"
  }'
```

#### Update a task (state change) — `PATCH /tasks/:id`
```bash
curl -X PATCH http://127.0.0.1:7300/tasks/R6-3.0.1 \
  -H "Content-Type: application/json" \
  -d '{"state":"IN-PROGRESS"}'
```

#### List tasks with filters — `GET /tasks?phase=&stream=`
```bash
curl "http://127.0.0.1:7300/tasks?phase=R6-3&stream=0"
```

#### Get a single task — `GET /tasks/:id`
```bash
curl http://127.0.0.1:7300/tasks/R6-3.0.1
```

#### Delete a task — `DELETE /tasks/:id`
```bash
curl -X DELETE http://127.0.0.1:7300/tasks/R6-3.0.1
```

### Comments

#### Create a comment on a task — `POST /tasks/:id/comments`
```bash
curl -X POST http://127.0.0.1:7300/tasks/R6-3.0.1/comments \
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
curl http://127.0.0.1:7300/tasks/R6-3.0.1/comments
```

### Project

#### Get project metadata — `GET /project`
```bash
curl http://127.0.0.1:7300/project
```

Returns the singleton row from `project_meta` (fields: `name`, `tagline`, `phaseCount`, `streamCount`).

## Lock-file semantics

When the board server starts, it writes `docs/.blueprint/board.lock` containing:

```json
{
  "pid": 12345,
  "port": 7300,
  "started_at": 1716012345678
}
```

- **`pid`** — OS process ID of the running board server.
- **`port`** — The port the server bound to.
- **`started_at`** — Unix epoch timestamp in milliseconds.

**Stale lock handling:** Before starting, the CLI reads any existing lock and checks whether the PID is alive (`kill(pid, 0)`) and whether `GET /project` responds on the recorded port. If either check fails, the lock is considered stale and is removed automatically. If the lock is alive, the CLI prints the existing URL and exits.

Advisory note: Agents and users should not write `board.lock` manually. Always let the board server create it, or use the CLI `blueprint board` command.

## blueprint board lifecycle

### Boot

Start the board explicitly:

```bash
node dist/index.js board
# or
blueprint board
```

Add `--headless` to suppress the automatic browser open.

### Port discovery

The server attempts to bind ports in the range `7300–7309`. It first probes for a free port, then tries each port atomically. The winning port is written to `board.lock`.

If a lock already exists and is alive, the CLI reuses that instance instead of starting a second one.

### Agent-initiated background boot

If `docs/.blueprint/tasks.db` exists but the board server is unreachable (no live lock, or lock points to a dead process), an agent may spawn the board in the background:

```bash
blueprint board --headless &
```

After spawning, the agent should poll `GET /project` until it succeeds before issuing further tracker requests.

### Shutdown

The board runs until it receives `SIGINT` (Ctrl-C). On shutdown it:

1. Closes the HTTP server.
2. Closes the SQLite database.
3. Removes `board.lock`.

Cleanup happens in a `finally` block so orphaned locks are rare.

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
| **/project** | Singleton endpoint returning project metadata. |

### Reusable curl snippets

Use these snippets verbatim in Stream A/B docs and agent prompts.

**Change task state:**
```bash
curl -X PATCH http://127.0.0.1:7300/tasks/<id> \
  -H "Content-Type: application/json" \
  -d '{"state":"IN-PROGRESS"}'
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
