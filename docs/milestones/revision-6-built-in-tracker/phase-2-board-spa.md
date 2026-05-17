# Phase 2 — Board SPA + `blueprint board` Command Plan

**Status**: Planning
**Milestone**: Revision 6 — Built-in Task Tracker
**Sequencing**: Do not start execution until Phase 1 — Tracker Core completes (Streams A + C must land) AND SRS rows MAS-204 + MAS-205 are added to `docs/srs.md`.

---

## Goals

- A Svelte 5 SPA matching the `blueprint-controls` `Kanban — Board First with Task Detail` artboard (`2YY-0`) scoped to a single project: five columns (TO-DO / IN-PROGRESS / IN-REVIEW / REWORK / DONE), header with project name + filters, task cards, and a 280px Task Detail rail with threaded review comments (MAJOR / MINOR, single-level replies).
- `blueprint board` upgrades from API-only (`--headless` in P1) to default `boot + open browser`. The `--headless` flag is retained for scripting and CI.
- A fixed port list (`7300–7309`) plus a per-project advisory lock file at `docs/.blueprint/board.lock` so a second `blueprint board` invocation in the same project redirects to the running URL instead of spawning a duplicate.
- Build/publish wiring (Vite at repo root, `dist/spa/` output, `prepack` hook, `files` whitelist) so consumers receive pre-built SPA assets in the npm tarball and never run a build step locally.
- No edits to protocol docs or templates (Phase 3 scope) and no migration/Doctor changes (Phase 4 scope). The P1 `server.ts` API contract is unchanged — static asset serving is composed in at `board.ts` level via a new `static-handler.ts`.

---

## Dependencies

| Dependency | Status |
|---|---|
| R6 Phase 1 — Tracker Core (schema + CRUD + headless server) | In progress (Gate + Stream B landed; Streams A + C pending) |
| MAS-204 + MAS-205 rows in `docs/srs.md` | Missing — must be added before execution |
| Node ≥22.5 (`engines.node`) | Set in P1 Gate task R6-1.0.1 |
| `src/tracker/{schema,db,project-root,types,server}.ts` + `routes/{tasks,comments}.ts` | From P1 |
| `docs/conventions.md` "no runtime deps for simple file I/O" rule | Preserved verbatim |
| Paper artboard `2YY-0` (`Kanban — Board First with Task Detail`) | Available as design contract |

---

## Locked Decisions

These were resolved during phase planning and must not be re-litigated during execution.

| Decision | Value |
|---|---|
| SPA framework | Svelte 5 with runes (`$state` / `$derived` / `$effect`) |
| Live refresh | Short-interval polling (default 2s, pauses on `document.visibilityState === 'hidden'`); no SSE in P2 |
| Selection state | In Svelte store **and** URL hash `#task=<full-task-id>` |
| `blueprint board` default | Boot + open browser. `--headless` flag retained for API-only boot |
| Browser open | Built-in `child_process` dispatch (`open` / `xdg-open` / `start`); no `open` npm dep |
| Port strategy | Fixed list `BOARD_PORTS = [7300, 7301, …, 7309]` — first free wins; all-occupied → `no_free_port` |
| Single-instance | Advisory `docs/.blueprint/board.lock` (`{ pid, port, started_at }`); second invocation pings the locked port's `/project`; if alive → log existing URL + open browser + exit 0; stale lock → removed automatically |
| Static asset serving | New `src/tracker/static-handler.ts` composed in by `board.ts`; P1 `server.ts` unchanged |
| Build pipeline | Vite at repo root; SPA source `src/tracker/spa/`; output `dist/spa/`; `npm run build` = `tsc && build:spa`; `prepack` regenerates `dist/spa/` |
| Comment ordering | Majors first then minors; each group chronological ascending; replies thread under parent inside each group |
| Comment composer | Top-of-thread inline composer under `+ MAJOR` / `+ MINOR` buttons; `Reply` opens an inline composer under the parent |
| Description edit UX | Click-to-edit: click body → textarea → blur or Cmd+Enter saves via `PATCH /tasks/:id`; Esc cancels; clean-blur is a no-op |
| Reply depth | Single level (matches `2YY-0`); schema's self-FK permits deeper but UI renders only one level |
| SPA tests | Vitest + `@testing-library/svelte` (jsdom). Forward-only per `conventions.md` |
| Runtime deps added | Zero. New dev-deps only: `svelte@^5`, `vite`, `@sveltejs/vite-plugin-svelte`, `@testing-library/svelte`, `jsdom` |

---

## Gate R6-2.0 — Build Infra + App Shell

> Foundation. Ships build pipeline, package wiring, the Svelte 5 entry, and the shared fetch + store skeleton that Streams A and B both import. Runtime-helper modules (Stream C) are independent and run in parallel with A/B; they do NOT belong in the Gate.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R6-2.0.1 | Add dev-deps to `package.json`: `svelte@^5`, `vite`, `@sveltejs/vite-plugin-svelte`, `@testing-library/svelte`, `jsdom`. | 0.25 | None | Independent |
| R6-2.0.2 | Author `vite.config.ts` at repo root — `base: '/'`, `build.outDir: 'dist/spa'`, `build.assetsDir: 'assets'`, fingerprinted asset filenames, Svelte plugin wired. Verify `npm run build:spa` produces `dist/spa/index.html` + `dist/spa/assets/*`. | 0.5 | R6-2.0.1 | Dependent |
| R6-2.0.3 | Add npm scripts: `build:spa` (`vite build`), `build` (`tsc && npm run build:spa`), `prepack` (`npm run build`), `dev:board` (vite dev against a running headless server). Update `files` whitelist to include `dist/`, `dist/spa/`, `templates/`. | 0.25 | R6-2.0.2 | Dependent |
| R6-2.0.4 | Author `src/tracker/spa/main.ts` (Svelte 5 mount) + `src/tracker/spa/App.svelte` (root layout: `<Board />` slot + collapsible `<TaskDetailRail />` slot driven by selection store). | 0.5 | R6-2.0.2 | Dependent |
| R6-2.0.5 | Author `src/tracker/spa/lib/api.ts` — typed fetch wrappers: `listTasks(filter)`, `getTask`, `createTask`, `updateTask`, `deleteTask`, `listComments(taskId)`, `createComment`, `updateComment`, `deleteComment`, `getProject`. Returns `Result<T, ApiError>` mirroring P1 envelope `{ error: { code, message } }`. Base URL = `window.location.origin`. | 0.75 | R6-2.0.1 | Independent |
| R6-2.0.6 | Author skeleton stores (Svelte 5 runes, `.svelte.ts`): `stores/tasks.svelte.ts` (task list state + polling driver — interval configurable, default 2s, pauses on tab hidden via `document.visibilityState`), `stores/selection.svelte.ts` (selected task ID ↔ URL hash sync), `stores/comments.svelte.ts` (per-task comment cache, invalidated on selection change). | 1.0 | R6-2.0.5 | Dependent |

### Gate Acceptance Criteria

- [ ] `npm run build:spa` produces `dist/spa/index.html` and fingerprinted assets under `dist/spa/assets/`.
- [ ] `npm run build` runs `tsc` then `vite build` and exits 0.
- [ ] `package.json` `files` whitelist includes `dist/`, `dist/spa/`, `templates/`.
- [ ] `App.svelte` renders an empty 5-column board shell + a closed rail when mounted standalone (no backend) — confirmed via a Vitest jsdom render asserting column count + rail closed by default.
- [ ] `api.ts` exposes the listed wrappers, returns `Result` unions; tests cover at least the happy path of one wrapper + one error mapping (mocked `fetch`).
- [ ] Polling driver invokes `listTasks` at the configured interval, stops on `visibilitychange → hidden`, resumes on `visibilitychange → visible` (covered by a Vitest test with faked timers + visibility).
- [ ] Selection store writes `window.location.hash` on change and re-reads on `hashchange`.

---

## Stream A — Board Surface

> Five-column board, header, filters, and task cards. Reads from the tasks store; writes go through `api.ts`. No rail dependency — selection store is consulted only to highlight the active card.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R6-2.A.1 | `components/Header.svelte` — project name + tagline (from `GET /project` via `api.getProject`, fetched once on mount), context summary `N milestone · N phase · N streams` (counts derived from current tasks store). | 0.75 | Gate | Dependent |
| R6-2.A.2 | `components/Filters.svelte` — `Phase ▾` + `Stream ▾` dropdowns. Selection feeds the tasks store's filter input, which re-issues `listTasks({ phase, stream })`. | 0.75 | Gate | Dependent |
| R6-2.A.3 | `components/TaskCard.svelte` — title (multi-line clamp), stream/gate chip (gate=green; per-letter palette for streams A/B/C/…), task ID, click handler that writes the ID to the selection store. | 0.75 | Gate | Dependent |
| R6-2.A.4 | `components/Column.svelte` — title + live count badge, ordered list of `TaskCard`, per-column empty-state copy (TO-DO / IN-PROGRESS / IN-REVIEW / REWORK / DONE adapted from `2YY-0` `2ZN-0/2ZO-0`), Done collapse: render first ~2 cards then `+ N more completed` toggle. | 1.0 | R6-2.A.3 | Dependent |
| R6-2.A.5 | `components/Board.svelte` — composes Header + Filters + 5 Columns. Subscribes to the tasks store, partitions tasks by `state`, passes the filtered slice to each Column. | 0.75 | R6-2.A.1, R6-2.A.2, R6-2.A.4 | Dependent |
| R6-2.A.6 | Tests `tests/spa/board/*.test.ts` — Header with mocked `getProject` (loading + error fallback `—`); Filters change writes to store; TaskCard click writes to selection store; Column partitioning + done-collapse behavior; Board end-to-end with a mocked tasks store seeded across all 5 states. | 1.25 | R6-2.A.5 | Dependent |

### Stream A Acceptance Criteria

- [ ] Header shows project name + tagline from `GET /project`; loading state renders skeleton text; fetch error renders silent `—` fallback.
- [ ] Filter changes re-issue `listTasks` with `?phase=&stream=` query params.
- [ ] Each column shows a live count badge that updates with the store.
- [ ] Done column collapses after 2 visible cards with a `+ N more completed` toggle that expands the full list.
- [ ] Empty columns display the documented placeholder copy.
- [ ] Clicking a card writes its task ID to the selection store (rail open behavior is Stream B).
- [ ] All Stream A tests pass.

---

## Stream B — Task Detail Rail + Comments

> The 280px right rail, comment thread, severity composers, and click-to-edit description. Reads selection store; reads/writes comments via `api.ts`. Independent of Stream A — rail renders standalone in tests with a stubbed selection.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R6-2.B.1 | `components/TaskDetailRail.svelte` — collapsible 280px rail. Open when selection non-null; closed when null. Header: status dot (column color) + state label + task title. Description section: click-to-edit textarea (blur or Cmd+Enter → `PATCH /tasks/:id`; Esc cancels; clean-blur no-op). Dismiss via header X or background click. | 1.5 | Gate | Dependent |
| R6-2.B.2 | `components/CommentComposer.svelte` — inline composer with severity preset, optional `line` text input, body textarea. Submit → `api.createComment`. Reused for top-of-thread + per-comment reply (prop `parentId?: string`). Inline error surfacing on `invalid_parent` / `invalid_severity`. | 0.75 | Gate | Dependent |
| R6-2.B.3 | `components/CommentItem.svelte` — single comment row: severity chip (MAJOR red / MINOR amber), optional line reference, body, author + relative timestamp, `Reply` link. One level of replies rendered inline beneath. | 1.0 | R6-2.B.2 | Dependent |
| R6-2.B.4 | `components/CommentThread.svelte` — groups comments by severity (MAJORs first then MINORs); within each group chronological ascending; replies thread under parent (single level) using `parent_id`. Header: `Review Comments` label + `+ MAJOR` / `+ MINOR` buttons that mount the top-of-thread composer with severity preset. | 1.0 | R6-2.B.3 | Dependent |
| R6-2.B.5 | Wire `CommentThread` into `TaskDetailRail` below the description; load comments on selection change via the comments store; refresh after composer submit. | 0.5 | R6-2.B.1, R6-2.B.4 | Dependent |
| R6-2.B.6 | Tests `tests/spa/rail/*.test.ts` — rail open/close; status dot color per state; description click-to-edit save path (mocked `fetch`, dirty-check no-op verified); composer submit (MAJOR + reply with `parent_id`); thread ordering (majors first); reply rendering under parent; dismiss flows (X + background click); URL hash updates on selection change. | 1.25 | R6-2.B.5 | Dependent |

### Stream B Acceptance Criteria

- [ ] Rail closed by default; opens on card click; closes via header X or background click; URL hash updates accordingly.
- [ ] Status dot color follows column color (TO-DO gray, IN-PROGRESS orange, IN-REVIEW purple, REWORK pink, DONE green).
- [ ] Description click swaps to a textarea; blur or Cmd+Enter saves and exits edit mode; Esc cancels; blur with no change is a no-op (no `PATCH`).
- [ ] `+ MAJOR` / `+ MINOR` opens the top-of-thread composer with severity preset; submit posts to `POST /tasks/:id/comments`.
- [ ] `Reply` link opens an inline composer below the parent comment; submit includes `parent_id`.
- [ ] Thread renders majors before minors; chronological inside each group; replies render under parent at one level.
- [ ] All Stream B tests pass.

---

## Stream C — Runtime Helpers

> Pure Node modules used by `blueprint board`. No SPA dependency — runs fully in parallel with Streams A and B.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R6-2.C.1 | `src/tracker/static-handler.ts` — `serveStatic(req, res, { spaDir })` middleware. Resolves `spaDir` via `import.meta.url` to the installed package's `dist/spa/`. Serves `index.html` for `GET /`, fingerprinted assets under `/assets/*` with appropriate `Content-Type` + `Cache-Control: public, max-age=31536000, immutable`. Returns `false` for non-static paths so `board.ts` can compose it ahead of the API handler. | 1.0 | None | Independent |
| R6-2.C.2 | `src/tracker/browser-open.ts` — `openUrl(url)` cross-platform: darwin → `open <url>`, linux → `xdg-open <url>`, win32 → `start "" <url>` via `child_process.spawn` with `detached: true` + `unref()`. Failures are non-fatal (log + continue) so a headless container still gets a working server. | 0.5 | None | Independent |
| R6-2.C.3 | `src/tracker/board-port.ts` — `BOARD_PORTS = [7300, 7301, …, 7309]` (frozen const). `findFreePort(host)` iterates the list using a probe server, returns the first port that binds, or throws `{ code: 'no_free_port', tried: BOARD_PORTS }`. | 0.5 | None | Independent |
| R6-2.C.4 | `src/tracker/board-lock.ts` — `readLock(projectRoot)`, `writeLock(projectRoot, { pid, port })`, `clearLock(projectRoot)`, `isLockAlive(lock)` (uses `process.kill(pid, 0)` for liveness + a 250ms `fetch('http://127.0.0.1:<port>/project')` ping to verify it's our server). Lock file: `docs/.blueprint/board.lock`. Stale locks (dead PID or non-responsive port) removed automatically. | 1.0 | None | Independent |
| R6-2.C.5 | Tests `tests/tracker/static-handler.test.ts`, `tests/tracker/browser-open.test.ts` (mock `child_process.spawn`), `tests/tracker/board-port.test.ts` (occupy a port then assert next-in-list is chosen), `tests/tracker/board-lock.test.ts` (round-trip; stale-lock cleanup; alive-lock detection). | 1.25 | R6-2.C.1, R6-2.C.2, R6-2.C.3, R6-2.C.4 | Dependent |

### Stream C Acceptance Criteria

- [ ] `serveStatic` serves `index.html` for `/` and `dist/spa/assets/*` for `/assets/*` with cache headers; returns `false` for other paths.
- [ ] `openUrl` dispatches the correct binary per platform; failure is non-fatal.
- [ ] `findFreePort` returns the first available port in `7300–7309`; throws `no_free_port` only when all are occupied.
- [ ] `board-lock` round-trips a lock, detects a live owner, removes a stale lock (dead PID), and ignores a lock with a non-responsive port.
- [ ] All Stream C tests pass.

---

## Stream D — `blueprint board` Command + Integration

> Replaces the P1 placeholder. Composes Gate (SPA bundle), Stream A (board surface), Stream B (rail), and Stream C (helpers) into the final command. Runs after A, B, C reach IN-REVIEW because every D task imports their modules.
>
> **Depends on:** Gate (SPA build output at `dist/spa/`), Stream A + B (compiled into that bundle), Stream C (`static-handler`, `browser-open`, `board-port`, `board-lock`).

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R6-2.D.1 | Upgrade `src/commands/board.ts` — replace P1 stub. Flow: resolve project root → `readLock` + `isLockAlive` (alive → log `Board already running at http://127.0.0.1:<port>` → `openUrl` unless `--headless` → exit 0) → `clearLock` if stale → `openDb` → `findFreePort` → `createServer({ db })` (from P1) → compose `static-handler` ahead of the API router → `listen({ host: '127.0.0.1', port })` → `writeLock` → log `Board available at http://127.0.0.1:<port>` → `openUrl` unless `--headless` → SIGINT handler: close server + DB + `clearLock` → exit 0. | 1.5 | Gate, R6-2.A.5, R6-2.B.5, R6-2.C.4 | Dependent |
| R6-2.D.2 | Tests `tests/commands/board.test.ts` (replaces / extends P1's) — default invocation boots + writes lock + logs port + holds open (verified by spawn + SIGINT); `--headless` boots without invoking `openUrl` (mocked); second invocation while live lock exists exits 0 with existing-URL message and does NOT spawn a new server; stale-lock recovery boots normally; all-ports-occupied → `no_free_port` non-zero exit. | 1.5 | R6-2.D.1 | Dependent |
| R6-2.D.3 | End-to-end test `tests/e2e/board-spa.test.ts` — boot `blueprint board --headless` against a temp project, `fetch http://127.0.0.1:<port>/` asserts SPA `index.html` is served with the expected mount node; `fetch /assets/<fingerprint>.js` asserts 200 + `Cache-Control` header; `fetch /tasks` and `/project` (existing API) still respond JSON. | 1.0 | R6-2.D.2 | Dependent |

### Stream D Acceptance Criteria

- [ ] `blueprint board` (no flag) boots the server, writes the lock, logs the URL, opens the browser, and survives until SIGINT.
- [ ] `blueprint board --headless` does everything above except `openUrl`.
- [ ] A second `blueprint board` in the same project while another is live exits 0 with `Board already running at http://127.0.0.1:<port>` and (non-headless) opens that URL.
- [ ] A stale lock (dead PID or non-responsive port) is removed automatically and boot proceeds.
- [ ] SIGINT closes the server, closes the DB, and removes the lock file.
- [ ] E2E test confirms the served SPA `index.html` plus at least one fingerprinted asset alongside untouched JSON API behavior.
- [ ] All Stream D tests pass.

---

## Parallelization Map

```
Gate R6-2.0 (vite/build wiring + App.svelte shell + api.ts + stores) ─┐
                                                                       │
                  ┌────────────────────────────────────────────────────┤
                  │                                                    │
Stream A (Board surface: Header / Filters / TaskCard / Column / Board) │
Stream B (Rail + comment thread + composer + click-to-edit desc) ────► │
Stream C (static-handler, browser-open, board-port, board-lock) ─────► │
                  │                                                    │
                  └── Stream D (blueprint board command + e2e)         │
                      depends on A + B + C ──────────────────────────► │
                                                                       │
                                                                       ▼
                                                            Phase 2 complete
```

Streams A, B, C are fully independent. A and B share only the Gate's `api.ts` + stores. C is pure Node helpers with no Svelte coupling. D wires it all together and cannot start until A, B, C reach IN-REVIEW.

---

## Out of Scope (intentional Phase 2 cuts)

- No protocol-doc rewrites (`docs/core/*.md`, templates) — Phase 3.
- No Doctor checks for `tasks.db` integrity, schema currency, or pre-R6 migration — Phase 4.
- No `.gitignore` injection for `docs/.blueprint/tasks.db` or `board.lock` — Phase 4.
- No SSE / WebSocket live-update layer — polling is sufficient for P2.
- No multi-project switcher / sidebar — single-project scope (revision-doc Removed list).
- No header view toggle (Explorer / Kanban) — board is the only view shipped in R6.
- No deeper-than-one-level comment reply nesting — schema permits it, UI doesn't.
- No mutation of P1 `server.ts` — static asset serving is composed in by `board.ts`.
- No new runtime dependencies (`conventions.md` rule preserved).
- No activity / event log table — revision-doc deferred item #5; not P2.
- No REWORK transition semantics decision — Phase 3 owns that when `execution.md` / `review.md` are rewritten.

---

## Test Plan

> Generated from task analysis per `test-planning.md`. Each testable task has one or more tests mapped to it. Tests are written BEFORE implementation (TDD) during task execution. Framework: Vitest + `@testing-library/svelte` + jsdom (per `docs/conventions.md` and phase Locked Decisions). The standalone "test artifact" tasks (R6-2.A.6, R6-2.B.6, R6-2.C.5, R6-2.D.2, R6-2.D.3) ARE the authoring of the test files listed; they appear as Not Testable rows because they have no further behavior to verify beyond producing the tests.

### Gate R6-2.0 Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-2.0.1 | R6-2.0.1 | unit | `package.json` parses; required dev-deps present with semver ranges (`svelte@^5`, `vite`, `@sveltejs/vite-plugin-svelte`, `@testing-library/svelte`, `jsdom`). | All five keys exist; semver ranges parse. |
| T-2.0.2.1 | R6-2.0.2 | integration | `npm run build:spa` exits 0 and writes `dist/spa/index.html` + at least one fingerprinted asset under `dist/spa/assets/`. | Files exist; `index.html` references the hashed asset. |
| T-2.0.2.2 | R6-2.0.2 | unit | `vite.config.ts` exports `base: '/'`, `build.outDir: 'dist/spa'`, `build.assetsDir: 'assets'`, Svelte plugin registered. | Config object matches. |
| T-2.0.3.1 | R6-2.0.3 | unit | `package.json` `scripts` contains `build:spa`, `build`, `prepack`, `dev:board` mapped as documented. | Strings match. |
| T-2.0.3.2 | R6-2.0.3 | integration | `npm pack --dry-run` tarball listing includes `dist/`, `dist/spa/`, `templates/`. | Output contains all three paths. |
| T-2.0.4.1 | R6-2.0.4 | unit | Mount `App.svelte` in jsdom → renders 5 columns; rail node has `data-open="false"`. | Column count = 5; rail closed. |
| T-2.0.5.1 | R6-2.0.5 | unit | `api.listTasks` success: mocked `fetch` returns `[{...}]` → returns `{ ok: true, data: [...] }`. | Result shape matches. |
| T-2.0.5.2 | R6-2.0.5 | unit | `api.createTask` error: mocked `fetch` returns 400 + envelope → returns `{ ok: false, error: { code, message } }`. | Envelope passed through. |
| T-2.0.5.3 | R6-2.0.5 | unit | All ten wrappers exist on the `api` export. | Named-export presence check. |
| T-2.0.6.1 | R6-2.0.6 | unit | Tasks store polling: fake-timer advance by interval → `listTasks` called once per tick. | Call count matches tick count. |
| T-2.0.6.2 | R6-2.0.6 | unit | Tasks store polling pauses on `visibilitychange → hidden`, resumes on `visible`. | No calls while hidden; resumes after visible event. |
| T-2.0.6.3 | R6-2.0.6 | unit | Selection store writes `window.location.hash` on change; reads on `hashchange`. | Hash mirrors `#task=<id>`; selection updates on hash event. |
| T-2.0.6.4 | R6-2.0.6 | unit | Comments store invalidates cache on selection change. | New `listComments` fired; previous data not retained. |

### Stream A Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-A.1.1 | R6-2.A.1 | unit | Header renders mocked `getProject` data (name + tagline). | DOM contains both strings. |
| T-A.1.2 | R6-2.A.1 | unit | Header shows skeleton on loading state. | Skeleton element present before fetch resolves. |
| T-A.1.3 | R6-2.A.1 | unit | Header shows `—` fallback on `getProject` error. | DOM contains `—`. |
| T-A.2.1 | R6-2.A.2 | unit | Filter dropdown change writes phase/stream to tasks store; store re-issues `listTasks({ phase, stream })`. | Store filter state matches; mocked `listTasks` called with query. |
| T-A.3.1 | R6-2.A.3 | unit | TaskCard renders title (clamped), chip with correct color, task ID. | DOM nodes + chip color class match. |
| T-A.3.2 | R6-2.A.3 | unit | TaskCard click writes its task ID to selection store. | Selection store value matches card ID. |
| T-A.4.1 | R6-2.A.4 | unit | Column renders title + count badge matching task array length. | Badge text = `${tasks.length}`. |
| T-A.4.2 | R6-2.A.4 | unit | Empty column renders documented placeholder copy per state. | Copy string matches expected per column. |
| T-A.4.3 | R6-2.A.4 | unit | Done column with 5 tasks renders 2 cards + `+ 3 more completed` toggle; toggle click expands to all 5. | Initial visible = 2; after click = 5. |
| T-A.5.1 | R6-2.A.5 | integration | Board with mocked tasks store seeded across 5 states partitions tasks into matching columns. | Each column receives only its state's tasks. |
| — | R6-2.A.6 | — | Not separately testable: task IS the authoring of T-A.1.x – T-A.5.x. | — |

### Stream B Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-B.1.1 | R6-2.B.1 | unit | Rail closed when selection is null; opens when selection set. | `data-open` toggles `false`→`true`. |
| T-B.1.2 | R6-2.B.1 | unit | Status dot color matches column color for each of the 5 states. | Each state maps to the documented hex/class. |
| T-B.1.3 | R6-2.B.1 | unit | Click description → textarea appears; Cmd+Enter calls mocked `api.updateTask` with new body. | `updateTask` invoked with `{ description }`. |
| T-B.1.4 | R6-2.B.1 | unit | Description blur with no change → no `updateTask` call (dirty check). | Mock call count = 0. |
| T-B.1.5 | R6-2.B.1 | unit | Esc cancels edit; original body restored. | Textarea unmounts; rendered text unchanged. |
| T-B.1.6 | R6-2.B.1 | unit | Dismiss via header X and via background click both close the rail. | `data-open` becomes `false` in both paths. |
| T-B.2.1 | R6-2.B.2 | unit | Composer with severity preset MAJOR submits → `api.createComment` called with `{ severity: 'MAJOR', body, parent_id?: undefined }`. | Mock invoked with expected args. |
| T-B.2.2 | R6-2.B.2 | unit | Composer with `parentId` prop submits with `parent_id` set. | Mock invoked with `parent_id` matching prop. |
| T-B.2.3 | R6-2.B.2 | unit | `invalid_severity` error from API surfaces inline. | Error string rendered next to composer. |
| T-B.3.1 | R6-2.B.3 | unit | CommentItem renders severity chip with correct color per `MAJOR`/`MINOR`. | Chip class matches mapping. |
| T-B.3.2 | R6-2.B.3 | unit | Reply link click reveals an inline composer under the item with `parentId` preset. | Composer rendered; prop matches comment ID. |
| T-B.4.1 | R6-2.B.4 | unit | Thread groups MAJORs above MINORs; chronological ascending within each group. | Order in DOM matches input sorted by severity then `created_at`. |
| T-B.4.2 | R6-2.B.4 | unit | Replies render under their parent comment at one level. | Reply nodes nested directly inside parent's reply container. |
| T-B.4.3 | R6-2.B.4 | unit | `+ MAJOR` / `+ MINOR` buttons mount the top-of-thread composer with correct preset. | Composer mounted; severity prop matches button. |
| T-B.5.1 | R6-2.B.5 | integration | Selection change triggers `listComments(taskId)` via comments store; results render in rail's thread. | Mocked `listComments` invoked with new ID; thread DOM updates. |
| T-B.5.2 | R6-2.B.5 | integration | After composer submit, comments store re-fetches; thread re-renders with new comment. | `listComments` called again; new comment node present. |
| — | R6-2.B.6 | — | Not separately testable: task IS the authoring of T-B.1.x – T-B.5.x. | — |

### Stream C Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-C.1.1 | R6-2.C.1 | unit | `serveStatic` for `GET /` returns 200 + `text/html` and writes `dist/spa/index.html` body. | Response matches fixture. |
| T-C.1.2 | R6-2.C.1 | unit | `serveStatic` for `GET /assets/<hash>.js` returns 200 + correct MIME + `Cache-Control: public, max-age=31536000, immutable`. | Headers + body match. |
| T-C.1.3 | R6-2.C.1 | unit | `serveStatic` for `GET /tasks` returns `false` (falls through). | Return value `false`; no response written. |
| T-C.1.4 | R6-2.C.1 | unit | `serveStatic` for `GET /assets/../../etc/passwd` rejects path traversal. | Returns 400 or `false`; never reads outside `spaDir`. |
| T-C.2.1 | R6-2.C.2 | unit | `openUrl` on darwin dispatches `spawn('open', [url], …)`. | Mocked spawn called with expected args. |
| T-C.2.2 | R6-2.C.2 | unit | `openUrl` on linux dispatches `xdg-open`; on win32 dispatches `start "" url`. | Each platform branch verified via mocked `process.platform`. |
| T-C.2.3 | R6-2.C.2 | unit | Spawn failure is non-fatal; `openUrl` resolves without throwing and logs once. | No exception; log spy invoked. |
| T-C.3.1 | R6-2.C.3 | integration | `findFreePort` returns `7300` when no port occupied. | Result = 7300. |
| T-C.3.2 | R6-2.C.3 | integration | Occupy `7300` with a probe server → `findFreePort` returns `7301`. | Result = 7301. |
| T-C.3.3 | R6-2.C.3 | integration | All `7300–7309` occupied → throws `{ code: 'no_free_port', tried: BOARD_PORTS }`. | Error matches shape. |
| T-C.4.1 | R6-2.C.4 | unit | `writeLock` then `readLock` returns identical `{ pid, port, started_at }`. | Round-trip equality. |
| T-C.4.2 | R6-2.C.4 | integration | `isLockAlive` true when PID alive and `/project` ping returns 200. | Returns `true`. |
| T-C.4.3 | R6-2.C.4 | unit | `isLockAlive` false when PID dead (mock `process.kill` throws `ESRCH`). | Returns `false`. |
| T-C.4.4 | R6-2.C.4 | integration | `isLockAlive` false when PID alive but port times out within 250ms. | Returns `false`. |
| T-C.4.5 | R6-2.C.4 | unit | `clearLock` removes the lock file; idempotent if file already absent. | File gone; second call no-op. |
| — | R6-2.C.5 | — | Not separately testable: task IS the authoring of T-C.1.x – T-C.4.x. | — |

### Stream D Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-D.1.1 | R6-2.D.1 | integration | `blueprint board` (default) boots: writes lock, logs `Board available at http://127.0.0.1:7300`, invokes mocked `openUrl`, holds open until SIGINT. | stdout + lock file + openUrl call + clean SIGINT exit. |
| T-D.1.2 | R6-2.D.1 | integration | `blueprint board --headless` boots but does NOT invoke `openUrl`. | openUrl mock call count = 0. |
| T-D.1.3 | R6-2.D.1 | integration | Second invocation while live lock exists exits 0 with `Board already running at http://127.0.0.1:<port>`; does NOT bind a new port. | No new listener; exit code 0; stdout matches. |
| T-D.1.4 | R6-2.D.1 | integration | Stale lock (dead PID) is removed; boot proceeds normally on the same port. | Lock rewritten with new PID; server listens. |
| T-D.1.5 | R6-2.D.1 | integration | All 10 ports occupied → exits non-zero with `no_free_port` error message. | Exit code ≠ 0; stderr contains `no_free_port`. |
| T-D.1.6 | R6-2.D.1 | integration | SIGINT closes server, closes DB, removes lock file. | After SIGINT: no listener; lock file absent; exit 0. |
| T-D.1.7 | R6-2.D.1 | integration | `blueprint board` outside a Blueprint project surfaces P1 project-root error; no lock created. | Stderr matches P1 message; no `docs/.blueprint/` written. |
| — | R6-2.D.2 | — | Not separately testable: task IS the authoring of T-D.1.x. | — |
| T-D.3.1 | R6-2.D.3 | end-to-end | `blueprint board --headless` against temp project: `GET /` returns SPA `index.html` containing the expected mount node selector. | Body matches. |
| T-D.3.2 | R6-2.D.3 | end-to-end | `GET /assets/<fingerprint>.js` returns 200 + `Cache-Control: public, max-age=31536000, immutable`. | Header + status match. |
| T-D.3.3 | R6-2.D.3 | end-to-end | API still works alongside static: `GET /project` returns JSON; `POST /tasks` then `GET /tasks` round-trips. | JSON envelopes intact. |

### Test Summary

| Component | Total Tasks | Testable | Not Testable | Tests Defined |
|-----------|-------------|----------|--------------|---------------|
| Gate R6-2.0 | 6 | 6 | 0 | 13 |
| Stream A | 6 | 5 | 1 | 10 |
| Stream B | 6 | 5 | 1 | 16 |
| Stream C | 5 | 4 | 1 | 15 |
| Stream D | 3 | 1 | 2 | 11 |
| **Total** | **26** | **21** | **5** | **65** |

---

## Definition of Done

- [ ] Gate R6-2.0 acceptance criteria pass.
- [ ] Stream A acceptance criteria pass.
- [ ] Stream B acceptance criteria pass.
- [ ] Stream C acceptance criteria pass.
- [ ] Stream D acceptance criteria pass.
- [ ] All 65 tests in the Test Plan pass.
- [ ] `npm run build` produces a working `dist/spa/` with fingerprinted assets.
- [ ] `npm pack` includes `dist/`, `dist/spa/`, `templates/`. Smoke install + `blueprint board` boots a working board on `127.0.0.1:7300` (or the first free port in range).
- [ ] `blueprint board` opens the SPA in the default browser on at least one of darwin / linux / win32 (CI matrix or documented manual verification).
- [ ] Polling refreshes column counts after a `curl POST /tasks` mutates the DB.
- [ ] All P2 tests pass; full pre-existing test suite (P1 + earlier) remains green.
- [ ] No lint errors in files touched by this phase.
- [ ] No runtime dependencies added (`conventions.md` rule preserved).
- [ ] No edits to `docs/core/*.md` or `templates/docs/core/*.md` (out of P2 scope — Phase 3).

---

## Test Scenarios

### Happy Path
- [ ] Fresh `blueprint init` then `blueprint board` → browser opens to `http://127.0.0.1:7300/` and renders the 5-column board with project name + tagline in the header.
- [ ] `curl POST /tasks` creates a task → within one poll interval the relevant column count badge increments and the card appears.
- [ ] Click a task card → rail opens; URL hash becomes `#task=<id>`; rail shows status dot + title + description + (empty) comment thread.
- [ ] Click description → edit textarea → Cmd+Enter → `PATCH /tasks/:id` fires; rail re-renders with the new body.
- [ ] `+ MAJOR` → composer at thread top → submit → comment appears at top of MAJOR group.
- [ ] `Reply` under a comment → inline composer → submit → reply renders under parent.

### Edge Cases
- [ ] Second `blueprint board` invocation in same project while one is live → exits 0 with `Board already running at http://127.0.0.1:<port>`; non-headless mode also opens that URL.
- [ ] Stale lock (kill -9 prior board) → next `blueprint board` removes stale lock and boots normally.
- [ ] All 10 ports in `7300–7309` occupied → `no_free_port` error with the tried list; non-zero exit.
- [ ] `blueprint board` outside a Blueprint project → P1 project-root error surfaces unchanged.
- [ ] Backend down mid-session (kill server, leave SPA open) → polling errors surface as a non-blocking inline indicator; SPA does not crash.
- [ ] Filter to a phase/stream with no matching tasks → all columns show empty-state copy with `0` count badges.
- [ ] Reply to a comment on a different task (via direct API) → P1's `invalid_parent` propagates; composer surfaces error inline.
- [ ] Click-to-edit on description, blur with no change → no `PATCH` fires (dirty-check guard).
- [ ] Network failure mid-`PATCH` → description reverts to last-known value; inline error indicator.
- [ ] Reload page with `#task=<id>` in URL → rail opens to that task on mount.
- [ ] SIGINT during open requests → server drains, DB closes cleanly, lock file removed, exit 0.

---

## Tweaks

> Corrections to completed tasks within this phase are tracked here. Each tweak has an ID (e.g., R6-2.TW1), lists affected tasks, and includes test impact. See `docs/core/tweak-planning.md` for the full tweak workflow.

_None._

---
