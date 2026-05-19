# Revision 6 — Built-in Task Tracker

**Status**: Planning
**Priority**: Next (do not start until Revision 5 — Orchestration Protocol completes)
**Trigger**: 2026-05-17 user request — remove the external `vibe-kanban` MCP dependency that the operational protocol currently relies on, and replace it with a built-in per-project task tracker (SQLite backend + local Svelte SPA) shipped and provisioned by the CLI itself.

---

## What Is Changing

Blueprint stops depending on the external `vibe-kanban` MCP for task tracking. In its place, the CLI ships and provisions a **per-project, single-user task tracker** with three concerns owned end-to-end:

1. **Storage** — a `node:sqlite` (Node ≥22.5 built-in, zero runtime deps) database at `docs/.blueprint/tasks.db`, created by `blueprint init` and migrated idempotently.
2. **Service** — a `node:http` CRUD server (`create`, `get`, `update`, `delete`) bound to `127.0.0.1` on a dynamic port, spawned by a new `blueprint board` command. Endpoints are documented with `curl` recipes in the protocol modules.
3. **UI** — a single-page Svelte app, pre-built and shipped under `dist/spa/` inside the npm package, served as static assets by the local server. Contract matches the **`Kanban — Board First with Task Detail`** artboard (`2YY-0`) in the `blueprint-controls` Paper file, scoped to a single project (no project switcher, no view toggle). The Task Detail rail opens on task-card click and exposes the task's status, title, description, and threaded review-comment thread (MAJOR / MINOR severity).

In parallel, every reference to `vibe-kanban` / `kanban MCP` across `docs/core/`, `templates/docs/core/`, the four templated agent entry points, the project-level `CLAUDE.md`, and field naming in `project-progress.md` is rewritten to point at the built-in tracker.

The protocol-level task state machine expands from **4 states** (TO-DO → IN-PROGRESS → IN-REVIEW → DONE) to **5 states** with the addition of **REWORK**, per the Paper design contract. `execution.md`, `review.md`, and `git-execution-workflow.md` document the REWORK transitions consistently.

## Why

- **The vibe-kanban dependency is a HARD-PROTOCOL gate.** `docs/core/health-check.md` STOPs every session if the MCP is unreachable. `execution.md`, `review.md`, `phase-completion.md`, and `bug-resolution.md` all require the MCP to function. Anyone installing Blueprint without (or unable to reach) the MCP is blocked from doing any work.
- **The dependency is documentation-driven only.** No code under `src/` calls the MCP — every interaction is an agent following a doc. Replacing the doc references and providing a local equivalent removes the dependency without disturbing the CLI's runtime surface beyond the new tracker code path.
- **Consumer projects inherit the dependency.** All of `templates/docs/core/` carries the same kanban references; every `blueprint init` propagates the external coupling. Fixing it once in this repo isn't enough — the template surface has to be rewritten in lockstep.
- **The contract changes mid-revision.** Adding REWORK as a first-class state lets the review loop distinguish "in-flight revision" (IN-PROGRESS) from "review-driven rework queue" (REWORK), which the current 4-state machine collapses.
- **Self-contained shipping matches the project ethos.** `docs/conventions.md` already warns against runtime dependencies for simple file I/O. `node:sqlite` and `node:http` are built-ins; Svelte stays dev-only via a build pipeline that ships static assets. The CLI keeps a single runtime dependency (`@clack/prompts`).

---

## SPA Scoping vs Paper Design

The reference artboard is **`Kanban — Board First with Task Detail` (`2YY-0`)** — a board surface plus a 280px right-rail Task Detail panel that opens on task-card click. The base board layout is identical to `QD-0` (single-project scoping, 5 columns, task card shape); the Task Detail panel is the addition. The Paper file is a **multi-project design surface**; the CLI ships a **single-project** board. The following elements are intentionally omitted; the rest are kept verbatim.

**Removed:**

| Element from `2YY-0` | Why removed |
|----------------------|-------------|
| Left sidebar — `Projects` list (`blueprint-controls`, `acme-dashboard`, `onboarding-flow`) | Each `blueprint board` invocation is scoped to one project (the one whose `docs/.blueprint/` it walked up to find). No cross-project switcher. |
| Header view toggle — `Explorer` / `Kanban` pill (`328-0`) | Board is the only view shipped in R6. Explorer / Gantt artboards in the Paper file are aspirational and not in scope. |
| Sidebar project-name + subtitle blocks | Project identity moves to the main header (`32D-0` block only). |

**Kept verbatim from `2YY-0` — board surface:**

| Element | Source node | Notes |
|---------|-------------|-------|
| Header: project name + tagline | `32D-0` block (`32F-0`, `32E-0`) | Project name from `docs/project-progress.md`; tagline from `docs/prd.md` overview. Returned by `GET /project`. |
| Header context summary: `N milestone · N phase · N streams` | `31X-0` group | Computed from tracker query + current phase doc. |
| Header filters: `Phase ▾`, `Stream ▾` | `31O-0` group | Bound to `GET /tasks?phase=...&stream=...` query params. |
| Five columns with live count badges | `30R-0`, `308-0`, `2ZV-0`, `2ZM-0`, `2Z1-0` | To Do / In Progress / In Review / Rework / Done. Counts refresh after every CRUD response. |
| Task card: multi-line title + stream/gate tag chip + task ID | `31A-0` and siblings | Stream chip color identifies stream (A/B/C). Gate chip uses a distinct green. Task-card click opens the Task Detail rail with the corresponding task ID. |
| Done-column collapse: `+ N more completed` | `2Z2-0` | Render first ~2 done tasks; collapse the remainder. |
| Empty-column placeholder copy (e.g. `Review rejections land here` for Rework) | `2ZN-0` / `2ZO-0` | Per-column copy adapted as appropriate. |

**Kept verbatim from `2YY-0` — Task Detail rail (`32S-0`, 280px wide):**

| Element | Source node | Notes |
|---------|-------------|-------|
| Task header — status dot + state label, then task title | `32T-0` (`32U-0` row + `32X-0` title) | Status dot color follows the column color (To Do gray, In Progress orange, In Review purple, Rework pink, Done green). |
| Description section — section label + body | `32Z-0` (`330-0`, `331-0`) | Free-form markdown-friendly body. Editable in-rail (defer edit UX detail to phase planning). |
| Review Comments section header — label + `+ MAJOR` / `+ MINOR` buttons | `33Y-0` (`33Z-0` label, `340-0` actions) | Add-comment affordances open an inline composer that posts to `POST /tasks/:id/comments` with `severity: "MAJOR" \| "MINOR"`. |
| Comment thread — severity chip (`MAJOR` red / `MINOR` amber) + line reference + body | `346-0`, `34P-0`, `353-0` and siblings | Severity drives chip color and ordering (majors first). Optional `line` reference (e.g. `Line 42`) for code-anchored comments — schema field, optional. |
| Comment replies — single-level thread of author + body | `34C-0`, `34V-0` | One level of replies; no further nesting. Each reply: author + relative timestamp + body. |
| Reply affordance | `34N-0`, `351-0`, `35A-0` | `Reply` link opens inline composer posting to the parent comment. |

The rail is **collapsible**. Default state: rail closed; board uses full width. On card click: rail opens; board flexes to remaining width. URL stays at `http://127.0.0.1:<port>/` — no router; selected-task state lives in the SPA store (and optionally in the URL hash for shareable links inside the local session — defer to phase planning).

The SPA is single-page, no router. All state is in-memory and refetched via the CRUD surface. The server injects project identity at request time — there is no build-time project baking.

---

## Deployment Architecture

The CLI sets everything up; consumers run only `blueprint init` and `blueprint board`. Three layers with distinct ownership:

### Layer 1 — `npm` package (read-only, ships with CLI)

Lives inside the installed `@splitwireml/blueprint` package. Paths resolved at runtime via `import.meta.url` / `__dirname`.

```
node_modules/@splitwireml/blueprint/
├── dist/
│   ├── index.js                # CLI entry (existing)
│   └── commands/board.js       # NEW — `blueprint board` handler
├── dist/tracker/               # NEW — compiled tracker backend
│   ├── schema.js               # SQLite DDL + migrations
│   ├── db.js                   # node:sqlite open / migrate
│   └── server.js               # node:http CRUD + static asset serving
├── dist/spa/                   # NEW — Svelte build output
│   ├── index.html
│   ├── assets/*.js             # fingerprinted bundle
│   └── assets/*.css
└── templates/                  # existing scaffold templates
```

- Pre-built SPA assets ship in the published tarball; consumers do **not** run `vite build` locally.
- `package.json` `scripts.prepack` runs the build before publish so a stale `dist/spa/` cannot be released.
- `package.json` `files` whitelist includes `dist/`, `dist/spa/`, `templates/`.

### Layer 2 — Per-project state (writable, created by `blueprint init`)

```
<project-root>/
└── docs/
    └── .blueprint/
        ├── manifest.json       # existing — CLI / template version
        └── tasks.db            # NEW — node:sqlite DB
```

- `blueprint init` creates `tasks.db` and runs the same idempotent schema migration path used by the server.
- A `.gitignore` recommendation for `docs/.blueprint/tasks.db` ships with the scaffold by default (default to ignored; commit-by-default is left as a phase-planning decision).
- No daemon, no background process — the DB file lives at rest. The server only runs while `blueprint board` is alive.

### Layer 3 — Runtime (ephemeral, spawned by `blueprint board`)

```
blueprint board
  → resolve <project-root> by walking up from cwd to find docs/.blueprint/
  → open docs/.blueprint/tasks.db (migrate if needed)
  → spawn node:http server, bind 127.0.0.1:<dynamic-port>
      → task CRUD:     POST /tasks, GET /tasks, GET /tasks/:id, PATCH /tasks/:id, DELETE /tasks/:id
      → comment CRUD:  POST /tasks/:id/comments, GET /tasks/:id/comments,
                       PATCH /tasks/:id/comments/:cid, DELETE /tasks/:id/comments/:cid
                       (comment body accepts { severity: MAJOR|MINOR, body, line?, parent_id? };
                        parent_id makes the new row a reply to an existing comment)
      → meta:          GET /project → { name, tagline, phaseCount, streamCount }
      → static:        GET / → dist/spa/index.html, GET /assets/* → dist/spa/assets/*
  → print "Board available at http://127.0.0.1:<port>"
  → open default browser via cross-platform dispatch (open / xdg-open / start)
  → wait for SIGINT, gracefully close server + DB
```

- Bound to `127.0.0.1` only — never `0.0.0.0`. No network exposure; no auth required.
- Dynamic port via `server.listen({ port: 0 })`; no port-collision risk.
- Optional advisory lock file `docs/.blueprint/board.lock` to prevent two boards on the same DB (details deferred to phase planning).
- Zero install footprint outside the project + npm package — no `~/.blueprint/`, no system services.

### Build pipeline (maintainer-side)

```
src/tracker/spa/                 # Svelte source
   App.svelte, main.ts, components/*.svelte, stores/*.ts
vite.config.ts                   # base '/', outDir → dist/spa, fingerprinted assets

npm run build:spa                # vite build → dist/spa/
npm run build                    # tsc && build:spa
npm run prepack                  # ensures build is current before publish
```

CI on push to main runs `npm run build && npm test`. Publish workflow refuses to publish if `dist/spa/index.html` is missing post-build.

---

## Impact Analysis

This revision is **hybrid: additive + modifying**.

- **Additive**: new SQLite backend, HTTP server, Svelte SPA, `blueprint board` command, two new SRS requirements (MAS-204, MAS-205).
- **Modifying**: removes `vibe-kanban` from every core protocol doc + templates + agent entry points; renames the `project-progress.md` `**Kanban**` field; rewrites `health-check.md`'s operational check; adds REWORK to the protocol-level state machine.

Framed as a single revision because the modifying surface dominates the integration risk, and the additive backend / SPA is the mechanism that makes the modifying rewrites coherent.

### Affected Milestones

- **M1 — Project Bootstrap** (Phases 2, 3, 4): scaffold templates change; Doctor's canonical-core-file list updates; tests asserting template structure update.
- **R5 — Orchestration Protocol** (after R5 completes): `docs/core/orchestrate.md` (shipped by R5) gets the same vibe-kanban → built-in tracker rewrite in R6's Phase 3.

### Affected Phases

| Phase | Impact |
|-------|--------|
| M1 Phase 2 — Scaffold Engine | Templates updated: every kanban reference rewritten; new `templates/docs/core/tracker.md` shipped if introduced. |
| M1 Phase 3 — Template Integrity | Doctor's canonical core file list updated; `tasks.db` schema check added to Doctor. |
| M1 Phase 4 — Testing & Release | Template tests update; engines bumped to Node ≥22.5; CI build pipeline gains `build:spa`. |
| R5 Phase 1 — Orchestration Module | After R5 completes, R6 Phase 3 rewrites `orchestrate.md`'s tracker references. |

### Affected Files (full rip-out list)

**Core protocol docs — HARD-PROTOCOL rewrite:**

| File | Lines | Action |
|------|-------|--------|
| `docs/core/health-check.md` | 55–62 | Replace "kanban MCP reachability" with "tracker DB present at `docs/.blueprint/tasks.db`". Field name: `kanban project name` → `tracker project id`. |
| `docs/core/alignment.md` | 148–166 | `KanbanSetup` flow → `TrackerSetup` flow. No external project creation; init provisions `tasks.db`. |
| `docs/core/execution.md` | 9–42, 53, 71–72, 112–117, 152, 206–207, 231–244, 268 | Replace all "kanban board" wording. State machine: TO-DO / IN-PROGRESS / IN-REVIEW / REWORK / DONE. Task ops documented as `curl` recipes against the local server. |
| `docs/core/review.md` | 5, 20 | Precondition swaps. Rejection path explicitly moves task to REWORK. |
| `docs/core/phase-completion.md` | 27, 40, 154, 168, 184, 200 | Task retrieval via local tracker query. Bug-task creation against local tracker. |
| `docs/core/bug-resolution.md` | 32, 38–39, 42, 102, 148, 158, 168 | PATH A and PATH B rewritten against local tracker. |
| `docs/core/git-execution-workflow.md` | 49, 129–130 | Wording: "moving task to In Progress on tracker"; REWORK state transitions documented. |
| `docs/core/tweak-planning.md` | 110, 194 | "Tracker note" instead of "kanban note". |
| `docs/core/phase-planning.md` | 336, 343 | "Full ID used on tracker, in test IDs." |
| `docs/core/scope-change.md` | 66 | "Create the tracker task per execution.md." |
| `docs/core/orchestrate.md` (after R5 ships it) | TBD | Same wording rewrite; orchestrator dispatches against the local tracker. |

**Project-level docs:**

| File | Change |
|------|--------|
| `docs/project-progress.md` | Field `**Kanban**: <name>` → `**Tracker**: <project-id>` (auto-assigned by `init`). |
| `docs/conventions.md` | Line 57: vibe-kanban removed; built-in tracker referenced; `node:sqlite` mentioned; Svelte dev-dep bullet added; "no runtime deps for simple file I/O" rule preserved verbatim. |
| `CLAUDE.md` (project root) | Replace "(vibe-kanban MCP)" wording; new `<ModuleRouting>` row for tracker ops if needed. |

**Templates (consumer-project propagation — full mirror of the above):**

| File | Change |
|------|--------|
| `templates/docs/core/{health-check,alignment,execution,review,phase-completion,bug-resolution,git-execution-workflow,tweak-planning,phase-planning,scope-change,blueprint-structure}.md` | Mirror rewrites. |
| `templates/docs/core/orchestrate.md` (after R5) | Mirror orchestrate.md rewrite. |
| `templates/{CLAUDE,AGENTS,GEMINI,QWEN}.md` | Line 8: "(vibe-kanban MCP)" → "(built-in task tracker)". |
| `templates/docs/conventions.md` | Same rewrite as project-level. |
| `templates/docs/project-progress.md` | Field rename. |

**New core doc (optional — confirm during phase planning):**

| File | Purpose |
|------|---------|
| `docs/core/tracker.md` + `templates/docs/core/tracker.md` | Single-source-of-truth contract: schema, 5-state machine, CRUD endpoints, `curl` recipes, storage location, lock-file semantics. Referenced by execution.md / review.md / phase-completion.md / bug-resolution.md instead of duplicating the contract across each. |

### Affected Code (`src/`, `tests/`)

**New code:**

- `src/tracker/schema.ts` — SQLite DDL:
  - `tasks` table: id, title, description, state (TO-DO / IN-PROGRESS / IN-REVIEW / REWORK / DONE), gate-or-stream tag, full task ID, author, implementation notes, dependencies (relation table), timestamps.
  - `review_comments` table: id, task_id (FK → tasks.id), severity (`MAJOR` | `MINOR`), body, author, line (nullable integer for code-anchored notes), parent_id (nullable self-FK for single-level reply threading), created_at, updated_at.
  - Indexes: `tasks(state)`, `tasks(phase, stream)`, `review_comments(task_id)`, `review_comments(parent_id)`.
- `src/tracker/db.ts` — `node:sqlite` open / migration / per-project connection handle.
- `src/tracker/server.ts` — `node:http` server. Routes:
  - Task CRUD: `POST /tasks`, `GET /tasks` (with `?phase=&stream=` filters), `GET /tasks/:id`, `PATCH /tasks/:id`, `DELETE /tasks/:id`.
  - Comment CRUD: `POST /tasks/:id/comments` (body: `{ severity, body, line?, parent_id? }` — `parent_id` makes the row a reply), `GET /tasks/:id/comments` (returns flat list; client builds the tree from `parent_id`), `PATCH /tasks/:id/comments/:cid`, `DELETE /tasks/:id/comments/:cid` (cascade deletes replies).
  - Meta: `GET /project`. Static asset routes for `dist/spa/`.
- `src/tracker/project-root.ts` — walk up from cwd to find `docs/.blueprint/`; actionable error message when not in a Blueprint project.
- `src/tracker/browser-open.ts` — cross-platform open / xdg-open / start dispatch with no dependency.
- `src/tracker/spa/` — Svelte source: `App.svelte`, `main.ts`, `components/{Column,TaskCard,Header,Filters,TaskDetailRail,CommentThread,CommentItem,CommentComposer}.svelte`, `stores/{tasks,selection,comments}.ts`, `lib/api.ts`.
- `vite.config.ts` — base `/`, `build.outDir` → `dist/spa/`, fingerprinted assets.
- `src/commands/board.ts` — `blueprint board` command: resolve project root, init/migrate DB, boot server, open browser, handle SIGINT.
- `src/commands/init.ts` (modified) — also create `docs/.blueprint/tasks.db` + run schema migration during init.
- Doctor extensions under `src/doctor/`: schema-current check + repair.

**Build / publish wiring:**

- `package.json` `scripts`: `build:spa` (vite), `build` (`tsc && build:spa`), `prepack` (ensure `build` ran), `dev:board` (tsx + vite dev server for SPA hot-reload during development).
- `package.json` `files`: include `dist/`, `dist/spa/`, `templates/`.
- `package.json` `engines.node`: `>=22.5.0` (`node:sqlite` requirement).
- CI: build SPA before tests; fail publish if `dist/spa/index.html` missing.

**New tests:**

- `tests/tracker/schema.test.ts` — migration roundtrip; covers both `tasks` and `review_comments` tables + FK cascade on comment deletion.
- `tests/tracker/server.test.ts` — task CRUD contract + comment CRUD contract over HTTP (severity validation, parent_id threading, cascade delete).
- `tests/commands/board.test.ts` — boot + shutdown lifecycle.
- Forward-only per `conventions.md`.

### Affected Existing Tests

| Test File | Impact |
|-----------|--------|
| `tests/stream-a/core-templates.test.ts` | Canonical core file count and name list change (vibe-kanban references purged; `tracker.md` added if introduced). Forward-only update. |
| Any test asserting `project-progress.md` `Kanban:` field name | Update to `Tracker:` field. Discover during phase planning via `rg 'Kanban' tests/`. |
| Any test asserting protocol text containing "vibe-kanban" | Forward-only update. Discover via `rg -i 'vibe-kanban' tests/`. |

These tests verify the OLD behavior and will fail after the rewrite. Updating them is part of R6 scope, not regression.

### Dependency Notes

- **Runtime deps added:** none. `node:sqlite` and `node:http` are Node built-ins.
- **Dev deps added:** `svelte`, `vite`, `@sveltejs/vite-plugin-svelte`, and a Svelte language-tools devkit equivalent. Build output ships under `dist/spa/`; no runtime impact.
- **`conventions.md` "no runtime deps for simple file I/O" rule:** preserved verbatim. The Svelte build step gets its own bullet under Libraries & Tools (dev-only).
- **R5 dependency:** R6 Phase 3 rewrites `orchestrate.md`. Starting R6 before R5 ships `orchestrate.md` would force duplicate work; R6 is gated on R5 completion.
- **No active or upcoming work depends on the current vibe-kanban references staying in place** — the MCP is documented as "currently not connected" in `conventions.md:57`. Removing it is unblocking, not breaking.

---

## SRS Implications

Classification per `revision-planning.md` `<RevisionSRSImpact>` decision test:

> "After this change, does the existing requirement still describe the same user outcome it described before?"

No existing SRS requirement (MAS-200, MAS-201, MAS-202, MAS-203) names vibe-kanban or task tracking. The vibe-kanban dependency was **convention, not requirement** — it lived in `conventions.md` and core protocol docs, not the SRS. So the SRS treatment for R6 is **purely additive (EXTENDED SCOPE — new sub-requirements)**. No supersession.

| Requirement ID | Action | Detail |
|----------------|--------|--------|
| MAS-204 (new) | Create | Title: **Built-in Task Tracker**. Priority: Must. Status: `approved-pending-implementation`. Assigned milestone: Revision 6. Source: Revision 6 Built-in Tracker. Introduced by: Revision 6. Supersedes / Superseded by: None. Captures the SQLite-backed per-project tracker, the 5-state machine, and the CRUD HTTP surface. |
| MAS-205 (new) | Create | Title: **Local Project Board UI**. Priority: Must. Status: `approved-pending-implementation`. Assigned milestone: Revision 6. Source: Revision 6 Built-in Tracker. Introduced by: Revision 6. Supersedes / Superseded by: None. Captures the `blueprint board` command and the Svelte SPA contract derived from the `blueprint-controls` `2YY-0` artboard (Board First with Task Detail), scoped to single project. Includes the Task Detail rail with threaded review comments (MAJOR / MINOR severity, single-level replies). |
| MAS-200, MAS-201, MAS-202, MAS-203 | No change | None of these requirements change meaning, assignment, or status. |

SRS entries are created alongside this revision document (per `<RevisionRules>`: identification + ID assignment is part of revision scoping; status moves to `active` upon R6 completion).

---

## Phases

This revision requires **five phases**. Phase-level breakdown (gate / stream / task) is intentionally omitted here per `revision-planning.md` anti-pattern *"Phase-Level Task Breakdown in Revision Plan"* — that belongs in each phase document produced by `phase-planning.md` when each phase is ready to execute.

| Phase | Name | Scope Summary |
|-------|------|---------------|
| 1 | Tracker Core (Schema + CRUD Server) | `src/tracker/{schema,db,server,project-root}.ts`. `node:sqlite` schema with 5-state column on `tasks` plus the `review_comments` table (severity + parent_id threading). HTTP CRUD for both surfaces (`/tasks` family + `/tasks/:id/comments` family + `/project`). Tests for schema migration, FK cascade, and CRUD contract. Engines bump to Node ≥22.5. **No protocol doc rewrites in this phase** — backend stands alone and is reachable via `curl` for early integration testing. |
| 2 | Board SPA + `blueprint board` Command | Svelte SPA matching `2YY-0` contract scoped to single project (no sidebar, no view toggle). Implements both the board surface and the Task Detail rail with threaded review comments. Vite build → `dist/spa/`. `src/commands/board.ts` resolves project root, boots server on `127.0.0.1` with dynamic port, opens browser, handles SIGINT. `prepack` script regenerates `dist/spa/` before publish. `files` whitelist updated. `browser-open.ts` cross-platform dispatch. |
| 3 | Protocol Rewrite (`docs/core/` + `templates/docs/core/`) | Coordinated rewrite of all affected core docs (and templates mirror) — 11 modules plus `orchestrate.md` (R5-shipped). Introduce optional `docs/core/tracker.md` if user confirms during this phase's planning. Insert `curl` recipes for CRUD ops. Update state machine to include REWORK. Rename `project-progress.md` field. Update conventions.md, project-root CLAUDE.md, and all 4 templated agent entry points. |
| 4 | Migration & Doctor Integration | `blueprint doctor` detects pre-R6 projects (presence of `**Kanban**:` field or absence of `docs/.blueprint/tasks.db`) and offers safe migration via existing audit / repair plan flow. Template-level project-progress scaffold updated. Doctor checks for schema currency and DB integrity. Agent-entry-point line 8 wording corrected across all 4 templates + project CLAUDE.md (in case any survived Phase 3). |
| 5 | Milestone Integration, Verification & Cleanup | Full test suite green (865 tests, 124 files). `rg -i 'vibe-kanban\|kanban mcp' docs/ templates/ src/ tests/` returns zero non-historical hits (allowing only superseded-history mentions in revision docs / decisions log, plus verification tests). SRS requirements MAS-204, MAS-205 transitioned `approved-pending-implementation` → `active`. PRD untouched. Release-readiness check passes. Schema bumped to v2 with `milestone TEXT NOT NULL` column on tasks table, idempotent v1→v2 migration, `GET /tasks?milestone=` filter, SPA Milestone dropdown, real milestone count in header, pre-P5 snapshot import back-compat via Doctor. Post-migration schema integrity validated on live project DB. |

---

## Success Criteria

- [ ] `docs/.blueprint/tasks.db` is created automatically by `blueprint init` with the new schema; migrations are idempotent.
- [ ] HTTP CRUD endpoints work via `curl` and pass contract tests:
  - Tasks: `POST/GET/PATCH/DELETE /tasks`, `GET /tasks?phase=&stream=`, `GET /tasks/:id`.
  - Comments: `POST/GET /tasks/:id/comments`, `PATCH/DELETE /tasks/:id/comments/:cid`. POST accepts `severity` (`MAJOR` | `MINOR`) and optional `parent_id` for replies; DELETE cascades replies.
  - Meta: `GET /project`.
- [ ] `blueprint board` boots a local server bound to `127.0.0.1` on a dynamic port, opens the Svelte SPA in the default browser, and shuts down cleanly on SIGINT.
- [ ] SPA matches `blueprint-controls` `2YY-0` contract scoped to a single project: 5 columns, task card (title + stream/gate tag + ID), phase + stream filters in header, Task Detail rail (status + title + description + threaded review comments), **no sidebar, no view toggle**.
- [ ] Task Detail rail: opens on card click, closes via header dismiss or background click; shows status dot + state label + title + description + comment thread with MAJOR / MINOR severity chips, single-level replies, and inline composer accessible via `+ MAJOR` / `+ MINOR` and `Reply` affordances.
- [ ] Pre-built SPA assets ship in the published npm tarball under `dist/spa/`; consumers run `blueprint board` without invoking any build step locally.
- [ ] `prepack` script regenerates `dist/spa/` before publish; CI fails if `dist/spa/index.html` is missing post-build.
- [ ] Every reference to `vibe-kanban`, `kanban MCP`, or `Kanban project` across `docs/core/`, `templates/`, `src/`, `tests/` is removed or rewritten (zero `rg` hits except in revision / decisions history).
- [ ] `docs/project-progress.md` and `templates/docs/project-progress.md` use `**Tracker**: <project-id>` field; `health-check.md` validates the new field + DB presence instead of MCP reachability.
- [ ] All 4 templated agent entry points (CLAUDE / AGENTS / GEMINI / QWEN) and the project-root `CLAUDE.md` no longer reference vibe-kanban MCP.
- [ ] `docs/core/execution.md`, `docs/core/review.md`, `docs/core/git-execution-workflow.md` document REWORK state and its transitions consistently.
- [ ] `package.json` `engines.node` `>=22.5.0`; install + test pass on Node 22.5 LTS.
- [ ] Full existing test suite remains green (post-R5 baseline + new tracker tests). Tests asserting the old 4-state machine or `Kanban:` field are updated as part of R6 scope (per `<RevisionRules>`: updating affected tests is part of revision scope, not regression).
- [ ] SRS requirements MAS-204, MAS-205 transition from `approved-pending-implementation` → `active`.
- [ ] `milestone TEXT NOT NULL` column on tasks table; `GET /tasks?milestone=` filter AND-combines with phase and stream; SPA Milestone dropdown renders; header milestone count reflects real data; pre-P5 snapshots import with milestone backfilled from task IDs; v1→v2 migration is idempotent.
- [ ] Post-migration schema integrity: `PRAGMA integrity_check` returns `'ok'`; no foreign-key orphans; `TRACKER_SCHEMA_VERSION === 2`; every row has `milestone IS NOT NULL`; indexes `idx_tasks_milestone` and `idx_tasks_milestone_phase` present.
- [ ] No regression in `blueprint init`, `blueprint doctor`, or template-integrity flows.

---

## Explicitly Not Changing

| File / Area | Reason |
|-------------|--------|
| `docs/prd.md` M1 / M2 / M3 statements | Product-level milestones describe user-facing goals; the tracker is mechanism, not goal. |
| `docs/core/revision-planning.md` | R6 uses it; does not modify it. |
| `docs/core/srs-planning.md` | Only used to add MAS-204 / 205 per existing rules; no protocol change. |
| `docs/core/planning.md`, `milestone-planning.md`, `hierarchy.md`, `prd-planning.md`, `test-planning.md` | No vibe-kanban references found. Unaffected. |
| Cross-project linking design (M2 / M3 future work) | Tracker is single-project scoped. Multi-project visibility deferred to M2 / M3 if and when those milestones are planned. |
| R5 — Orchestration Protocol scope | R5 ships `orchestrate.md` against current (vibe-kanban) wording; R6 rewrites it in Phase 3. R5 itself is unchanged by R6 planning. |
| `@clack/prompts` runtime dependency | Existing, used elsewhere; unaffected. |

---

## Sequencing & Triggers

- **Do not start R6 until R5 is complete.** R5 ships `docs/core/orchestrate.md`; R6 Phase 3 rewrites it. Starting R6 before R5 forces duplicate work and inconsistent state.
- After R5 completes, R6 surfaces at session start as a `Pending Revisions` entry with priority **Next**. The user decides exact start.
- The optional `docs/core/tracker.md` core module decision is made during Phase 3 planning, not committed in this revision document.

---

## Deferred Items

1. **`docs/core/tracker.md` introduction.** Whether to introduce a new core module that holds the tracker contract (schema, state machine, CRUD recipes, lock semantics) in one place vs. duplicating short references across each consumer doc. Decided during Phase 3 planning.
2. **`.gitignore` default for `docs/.blueprint/tasks.db`.** Default-ignore vs default-commit. Operational state argues ignore; team-sharing argues commit. Decided during Phase 1 or Phase 4 planning.
3. **Single-instance enforcement.** Advisory lock file `docs/.blueprint/board.lock` to prevent two `blueprint board` instances on the same DB; if present, print existing port and exit. Mechanism deferred to Phase 2 planning.
4. **REWORK transition semantics.** Whether addressing rework moves REWORK → IN-PROGRESS (re-execution loop) or REWORK → IN-REVIEW (direct re-review) — decided during Phase 3 planning when `execution.md` and `review.md` are rewritten.
5. **Activity / event log column.** Whether the schema includes an append-only event log (state change, edit, comment) for audit and orchestrator coordination. Decided during Phase 1 planning.
6. **Migration ergonomics for pre-R6 consumer projects.** Specific Doctor flow — interactive vs `--yes` flag, dry-run output, rollback. Decided during Phase 4 planning.
7. **Comment-thread depth.** Current scope = single level of replies (matches `2YY-0`). Whether to allow deeper nesting (replies to replies) is deferred; the schema's self-FK `parent_id` permits it without migration, but the SPA renders only one level.
8. **`line` field semantics for review comments.** The Paper artboard shows `Line 42` and `Line 88` references on comments. Whether `line` is a free-form string anchor, an integer file-line pointer, or a `{ file, line }` tuple is deferred to Phase 1 schema-detail planning.
9. **Task description edit UX in the rail.** Inline-edit vs click-to-edit vs dedicated edit mode. Deferred to Phase 2 planning.

---

## Deferred Items

_No items deferred from Phase 5._ All planned scope was delivered: milestone schema field, filter, SPA dropdown, header count, migration, snapshot back-compat, SRS activation, rg sweep, full test suite, release check, revision-doc amendment, and schema-integrity validation.
