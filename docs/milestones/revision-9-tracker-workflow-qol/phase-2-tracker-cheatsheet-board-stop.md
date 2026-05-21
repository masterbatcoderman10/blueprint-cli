# Phase 2 — Tracker Cheatsheet, Board Stop & Worktree-Aware Lifecycle Plan

**Status**: Planning
**Milestone**: Revision 9 — Tracker Workflow QoL

---

## Goals

- Move the board lock from the per-worktree path `docs/.blueprint/board.lock` to a single per-repo path inside the git common dir (`<git-common-dir>/blueprint-board.lock`) so all worktrees of one repository share a single live board.
- Record the originating worktree (absolute `git rev-parse --show-toplevel` at boot time) inside the lock payload so duplicate-start messages and `status` output can identify where the live board was started from.
- Require a git context (`git rev-parse --git-common-dir` must succeed) for any `blueprint board` invocation. Without git, the command refuses with a clear error and non-zero exit code.
- Refuse duplicate `blueprint board` starts (same worktree or peer worktree) whenever the shared lock is alive: print the live URL and originating worktree, do not auto-open a browser, exit `1`. The friendly auto-open behavior on duplicate start is removed.
- Detect a legacy `docs/.blueprint/board.lock` in the current worktree on first boot under the new code: print a one-line migration warning, delete it, and write the new shared lock instead.
- Ship a new `blueprint board stop` subcommand that reads the shared lock, sends `SIGTERM` to the recorded pid (escalating to `SIGKILL` after a short timeout), verifies the server is no longer reachable on the recorded port, and clears the lock. Stale-lock and missing-lock paths are silent no-op cleanups that still exit `0`.
- Ship a new `blueprint board status` subcommand that reports live / stale / none with human-readable output. Exit codes: live = `0`, stale = `1`, none = `2`.
- Rewrite `docs/core/tracker.md` cheatsheet-first with the section order **Board lifecycle → Gated transitions → Comment recipes → Task creation → deeper detail (schema, state machine, lock semantics, full curl reference)** so the most common agent calls and lifecycle recovery surface first.
- Mirror the rewritten tracker.md into `templates/docs/core/tracker.md` byte-for-byte.
- Record MAS-204 and MAS-205 same-ID change-log entries documenting the Phase 2 elaboration (board-lifecycle CLI surface for MAS-205, board command's git-context requirement noted on MAS-204 only insofar as the tracker server itself is unchanged).

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Revision 6 Phase 2 — `blueprint board` command, dynamic port binding, `board.lock` semantics | Complete |
| Revision 9 Phase 1 — Gated workflow endpoints (`start`, `submit`, `approve`, `reject`, `resume`) used in the cheatsheet | Complete |
| `git` available on `PATH` in the user's environment for `git rev-parse` calls | Available |
| Existing `tests/stream-c/project-templates-mirror.test.ts` parameterized template mirror coverage | Complete |

---

## Gate R9-2.0 — Lock Contract & Git-Common-Dir Foundation

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R9-2.0.1 | Add `src/tracker/git-context.ts` helper exposing `getGitCommonDir(cwd)` and `getWorktreeRoot(cwd)` via `git rev-parse --git-common-dir` and `git rev-parse --show-toplevel`. Return a structured `{ ok: false, code: 'no_git' }` result when git is unavailable or the cwd is not inside a git repository | 0.5 | None | Independent |
| R9-2.0.2 | Rewrite `src/tracker/board-lock.ts` so `readLock` / `writeLock` / `clearLock` operate on `<git-common-dir>/blueprint-board.lock`. Extend the `LockData` shape with a `worktree` field (absolute path captured at write time). `isLockAlive` signature unchanged | 0.75 | R9-2.0.1 | Dependent |
| R9-2.0.3 | Add `sweepLegacyLock(worktreeRoot)` helper in `board-lock.ts` that detects and removes `<worktreeRoot>/docs/.blueprint/board.lock` if present, returning a boolean indicating whether a sweep occurred (so the caller can emit the one-line migration warning) | 0.25 | R9-2.0.2 | Dependent |
| R9-2.0.4 | Add `requireGitContext(cwd)` guard helper that resolves git common dir + worktree root and returns a single `{ commonDir, worktreeRoot }` tuple or throws a typed `NoGitContextError` whose message is the standard CLI refusal text | 0.25 | R9-2.0.1 | Dependent |

### Gate Acceptance Criteria

- [ ] `getGitCommonDir` resolves the canonical git common dir for any worktree of a repository and returns the same absolute path from every worktree of that repo.
- [ ] `readLock` / `writeLock` / `clearLock` read and write `<git-common-dir>/blueprint-board.lock` only; the old `docs/.blueprint/board.lock` path is never written by the new code.
- [ ] `writeLock` persists `pid`, `port`, `started_at`, and `worktree` (absolute worktree root captured at write time).
- [ ] `sweepLegacyLock` deletes `<worktreeRoot>/docs/.blueprint/board.lock` when present and is a no-op when absent; its boolean return value lets callers emit the migration warning exactly once.
- [ ] `requireGitContext` raises `NoGitContextError` when git is unavailable or the cwd is not inside a git repository; the error message is the canonical CLI refusal string reused by all three board subcommands.

---

## Stream A — Board Command Surface (Start Refusal, Stop, Status)

> Adds the subcommand dispatcher, duplicate-start refusal in the existing `start` path, and the new `stop` and `status` subcommands. All three subcommands route through the Gate's git-context guard and shared lock.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R9-2.A.1 | Refactor `src/commands/board.ts` into a subcommand dispatcher: default / `start` → existing `runBoard`, `stop` → new `runBoardStop`, `status` → new `runBoardStatus`. Unknown subcommands return a usage error with exit `1` | 0.5 | Gate | Dependent |
| R9-2.A.2 | Update `runBoard` (the `start` path) to call `requireGitContext`, then `sweepLegacyLock` (with one-line warning if a sweep occurred), then `readLock` + `isLockAlive`. On live lock: print `Board already running at <url> (started from <worktree>). Run \`blueprint board stop\` to stop it.`, do not call `openUrl`, exit `1`. Remove the prior friendly "already running" auto-open branch | 0.75 | R9-2.A.1 | Dependent |
| R9-2.A.3 | Implement `runBoardStop` in `src/commands/board-stop.ts`: `requireGitContext` → `readLock`. Missing lock → print `No board running.`, exit `0`. Lock present but not alive → print `Cleared stale lock (pid <pid>, port <port>).`, `clearLock`, exit `0`. Lock alive → `process.kill(pid, 'SIGTERM')`, poll `isLockAlive` every 100ms up to 2s, escalate to `SIGKILL` if still alive, verify `/project` unreachable for up to 1s, `clearLock`, print `Stopped board (pid <pid>, port <port>).`, exit `0` | 1.0 | R9-2.A.1 | Dependent |
| R9-2.A.4 | Implement `runBoardStatus` in `src/commands/board-status.ts`: `requireGitContext` → `readLock`. No lock → print `No board running for this repo.`, exit `2`. Lock present but not alive → print `Stale lock detected (pid <pid>, port <port>, worktree <worktree>). Run \`blueprint board stop\` to clear.`, exit `1`. Lock alive → print `Board running at http://127.0.0.1:<port> (pid <pid>, worktree <worktree>, uptime <human>).`, exit `0` | 0.75 | R9-2.A.1 | Dependent |
| R9-2.A.5 | Register the `board` command in `src/runtime` (or equivalent dispatch surface) so `blueprint board`, `blueprint board start`, `blueprint board stop`, and `blueprint board status` all route to the new dispatcher; preserve `--headless` on `start` | 0.25 | R9-2.A.1 | Dependent |

### Stream A Acceptance Criteria

- [ ] `blueprint board` outside any git repository (no `.git` reachable from cwd) refuses with the canonical no-git refusal message and exit `1`, for all three subcommands.
- [ ] A second `blueprint board` (or `blueprint board start`) in the same worktree while the shared lock is alive exits `1`, prints the live URL and originating worktree, and does not open a browser.
- [ ] A second `blueprint board` in a peer worktree of the same repository exhibits the same refusal as same-worktree duplicate start — same message including originating worktree, same exit code, no browser auto-open.
- [ ] First `blueprint board` boot under the new code that encounters a legacy `docs/.blueprint/board.lock` in the current worktree prints exactly one migration warning, deletes the legacy file, and proceeds to write the shared lock; subsequent boots emit no warning.
- [ ] `blueprint board stop` with no lock exits `0` with the "no board running" message; with a stale lock exits `0` after cleanup; with a live lock terminates the process (SIGTERM with SIGKILL fallback after the 2s window), verifies the port is no longer reachable, clears the lock, and exits `0`.
- [ ] `blueprint board status` reports `live` (exit `0`), `stale` (exit `1`), or `none` (exit `2`) with the documented human output for each state.
- [ ] The `start` path's existing `--headless` flag and dynamic port binding (BOARD_PORTS 7300–7309) behavior are preserved unchanged.

---

## Stream B — Cheatsheet Rewrite, Template Mirror & SRS Change Log

> Rewrites `docs/core/tracker.md` cheatsheet-first with the agreed section order, mirrors the rewrite into the template tree byte-for-byte, and appends the MAS-204 and MAS-205 change-log entries for the Phase 2 elaboration.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R9-2.B.1 | Rewrite `docs/core/tracker.md` cheatsheet-first with top-of-file section order: **(1) Board lifecycle** — `blueprint board` / `start` / `stop` / `status`, duplicate-start refusal, legacy-lock migration note; **(2) Gated transitions** — canonical curl recipes for `start` / `submit` / `approve` / `reject` / `resume` from Phase 1; **(3) Comment recipes** — `POST /tasks/:id/comments` standalone, multi-comment batched approve/reject reminders, severity choice rules; **(4) Task creation** — `POST /tasks`, gate/stream linkage, dependency capture, ordering for batch creation; followed by the deeper-detail block: schema, 5-state machine diagram, lock semantics (including the new shared-lock location + worktree field), full curl reference covering raw `PATCH /tasks/:id` for uncommon transitions | 1.5 | None | Independent |
| R9-2.B.2 | Mirror the rewritten `docs/core/tracker.md` into `templates/docs/core/tracker.md` byte-for-byte; rely on the existing parameterized template-mirror test (`tests/stream-c/project-templates-mirror.test.ts`) for ongoing enforcement | 0.5 | R9-2.B.1 | Dependent |
| R9-2.B.3 | Append a MAS-205 change-log entry recording the Phase 2 lifecycle elaboration (`blueprint board stop` and `blueprint board status` subcommands, shared lock at git common dir, duplicate-start refusal, legacy lock sweep). Preserve all prior change-log entries; the MAS-205 requirement ID and meaning are unchanged | 0.25 | None | Independent |
| R9-2.B.4 | Append a MAS-204 change-log entry confirming that the tracker server surface is unchanged by Phase 2 and noting that the board lifecycle is owned by MAS-205. Preserve all prior change-log entries; the MAS-204 requirement ID and meaning are unchanged | 0.25 | None | Independent |

### Stream B Acceptance Criteria

- [ ] `docs/core/tracker.md` opens with the **Board lifecycle** section as the first content block after the file header, followed in order by **Gated transitions**, **Comment recipes**, **Task creation**, and then the deeper-detail block.
- [ ] The Board lifecycle section documents the three subcommands (`start` default / `stop` / `status`), the shared lock at `<git-common-dir>/blueprint-board.lock`, the duplicate-start refusal contract, and the legacy lock migration note.
- [ ] The Gated transitions section references the canonical `start` / `submit` / `approve` / `reject` / `resume` endpoints from Phase 1 with at least one curl example per verb.
- [ ] The deeper-detail block retains a full curl reference including raw `PATCH /tasks/:id` for uncommon transitions and explicitly marks it as the non-canonical path for the five gated transitions.
- [ ] `templates/docs/core/tracker.md` is byte-for-byte equal to `docs/core/tracker.md` and passes the existing parameterized template-mirror test without duplication of that test.
- [ ] `docs/srs.md` MAS-205 change log contains a new Phase 2 entry covering the lifecycle elaboration. Prior entries are preserved and the requirement ID is unchanged.
- [ ] `docs/srs.md` MAS-204 change log contains a Phase 2 entry confirming no server-surface change. Prior entries are preserved and the requirement ID is unchanged.

---

## Parallelization Map

```
Gate R9-2.0 (Lock Contract & Git-Common-Dir) ──┐
                                                │
                 ┌──────────────────────────────┤
                 │                              │
Stream A (Board Command Surface) ─────────────► │
Stream B (Cheatsheet + Template Mirror + SRS) ─►│
                                                │
                                                ▼
                                    Phase R9-2 complete
```

Stream A depends on the Gate (git-context resolver, shared-lock module rewrite, legacy-sweep helper). Stream B is independent of the Gate (documentation-only) and runs in parallel.

---

## Test Plan

> Generated from task analysis. Each testable task has one or more tests mapped to it. Tests are written before implementation (TDD) during task execution. Assertions favor token-based / structural matching over exact human-string equality to limit churn risk on copy edits.

### Gate R9-2.0 Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R9-2.0.1.1 | R9-2.0.1 | integration | `getGitCommonDir(cwd)` resolves the canonical git common dir for a repo root | Returns absolute path equal to `git rev-parse --git-common-dir` |
| T-R9-2.0.1.2 | R9-2.0.1 | integration | `getGitCommonDir` from a peer worktree returns the same absolute path as from the main worktree | Both calls return byte-identical absolute path |
| T-R9-2.0.1.3 | R9-2.0.1 | unit | `getGitCommonDir` outside any git repo / when git unavailable | Returns `{ ok: false, code: 'no_git' }`; no throw |
| T-R9-2.0.1.4 | R9-2.0.1 | integration | `getWorktreeRoot(cwd)` returns absolute worktree top | Equals `git rev-parse --show-toplevel` |
| T-R9-2.0.2.1 | R9-2.0.2 | integration | `writeLock` writes only to `<git-common-dir>/blueprint-board.lock`; legacy `docs/.blueprint/board.lock` is not created | Shared-lock file exists at common dir; legacy path absent |
| T-R9-2.0.2.2 | R9-2.0.2 | integration | `writeLock` payload includes `pid`, `port`, `started_at`, and `worktree` (absolute path captured at write time) | All four fields present and correctly typed |
| T-R9-2.0.2.3 | R9-2.0.2 | integration | `readLock` in peer worktree reads lock written from main worktree | Returns payload identical to the writer's |
| T-R9-2.0.2.4 | R9-2.0.2 | unit | `clearLock` removes shared-lock file; idempotent when absent | File gone; second call resolves with no throw |
| T-R9-2.0.2.5 | R9-2.0.2 | integration | Reciprocal: lock written from peer worktree readable byte-identical from main worktree | Both reads return identical payload |
| T-R9-2.0.2.6 | R9-2.0.2 | unit | `readLock` on truncated / corrupt JSON returns `null` without throwing | Graceful null; no crash; no partial-data return |
| T-R9-2.0.3.1 | R9-2.0.3 | unit | `sweepLegacyLock(worktreeRoot)` removes legacy `docs/.blueprint/board.lock` and returns `true` | File deleted; return value `true` |
| T-R9-2.0.3.2 | R9-2.0.3 | unit | `sweepLegacyLock` no-op when legacy file absent | Returns `false`; no error |
| T-R9-2.0.4.1 | R9-2.0.4 | unit | `requireGitContext` returns `{ commonDir, worktreeRoot }` inside repo | Tuple matches the two resolver helpers |
| T-R9-2.0.4.2 | R9-2.0.4 | integration | Parameterized across `start` / `stop` / `status`: outside git, each subcommand surfaces a byte-identical canonical refusal string sourced from `NoGitContextError` | All three captured outputs equal each other; error is `instanceof NoGitContextError` |

### Stream A Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R9-2.A.1.1 | R9-2.A.1 | integration | `blueprint board <unknown>` returns a usage error with exit `1` | stderr contains usage line; exit code `1` |
| T-R9-2.A.2.1 | R9-2.A.2 | integration | `blueprint board` outside any git repo refuses with canonical message, exit `1`, no lock written | Token-match canonical refusal; exit `1`; no shared lock created |
| T-R9-2.A.2.2 | R9-2.A.2 | integration | First boot with legacy `docs/.blueprint/board.lock` present: exactly one migration warning, legacy deleted, shared lock written | One warning line (count asserted = 1); legacy file gone; shared lock present |
| T-R9-2.A.2.3 | R9-2.A.2 | integration | Second `blueprint board` in same worktree while live lock → refusal contains URL + originating worktree (token-based), exit `1`, `openUrl` NOT called | Output contains URL token and worktree path token; `openUrl` mock uncalled; exit `1` |
| T-R9-2.A.2.4 | R9-2.A.2 | integration | Second `blueprint board` in **peer worktree** of same repo → same refusal; originating worktree token equals first worktree | Worktree token in output equals first worktree; exit `1` |
| T-R9-2.A.2.5 | R9-2.A.2 | integration | Concurrent boots in two peer worktrees → exactly one starts the server | One process binds port + writes lock; the other exits `1` with refusal |
| T-R9-2.A.2.6 | R9-2.A.2 | integration | `--headless` flag and BOARD_PORTS dynamic binding (7300–7309) preserved after refactor | Boot succeeds without `openUrl`; bound port within range |
| T-R9-2.A.2.7 | R9-2.A.2 | integration | Lock `worktree` field equals `git rev-parse --show-toplevel` of the **booting** worktree (peer case) — not cwd, not project root | Field equals booting worktree absolute path |
| T-R9-2.A.2.8 | R9-2.A.2 | integration | Happy-path non-headless boot: `openUrl` called exactly once with the bound URL | Mock called 1x; argument equals printed URL |
| T-R9-2.A.2.9 | R9-2.A.2 | integration | Second / subsequent boots after one-time legacy sweep emit zero migration warnings | No legacy-warning substring in output of second boot |
| T-R9-2.A.2.10 | R9-2.A.2 | integration | Post-race lock contents pin: after concurrent boot race, lock JSON parses cleanly and `pid` / `port` match the surviving server (no torn write) | Lock parses; pid + port equal the winner; not the loser's values |
| T-R9-2.A.3.1 | R9-2.A.3 | integration | `blueprint board stop` with no lock → "no board running" message, exit `0` | Message token present; exit `0` |
| T-R9-2.A.3.2 | R9-2.A.3 | integration | `blueprint board stop` with stale lock (pid-dead) → cleanup message, exit `0`, lock removed | Cleanup token present; exit `0`; lock file gone |
| T-R9-2.A.3.3 | R9-2.A.3 | integration | `blueprint board stop` against live board → SIGTERM kills process; `/project` confirmed unreachable **within 1s** post-signal; lock cleared; exit `0` | Live proc exits; `/project` fetch fails within 1s window; no lock; "Stopped board…" token |
| T-R9-2.A.3.4 | R9-2.A.3 | integration | `blueprint board stop` against SIGTERM-ignoring child: escalates to SIGKILL within the 2s–2.5s window | Child terminated; elapsed time ≥ 2.0s and ≤ 2.5s; lock cleared; exit `0` |
| T-R9-2.A.3.5 | R9-2.A.3 | integration | `blueprint board stop` against stale-by-port lock (pid alive, port unreachable) → cleanup message, exit `0`, lock cleared | Cleanup token present; exit `0`; lock file gone |
| T-R9-2.A.4.1 | R9-2.A.4 | integration | `blueprint board status` with no lock → "no board running for this repo" message, exit `2` | Message token present; exit code exactly `2` |
| T-R9-2.A.4.2 | R9-2.A.4 | integration | `blueprint board status` with stale lock → "Stale lock detected" output; hint references `blueprint board stop`; exit `1` | Both substrings present; exit code exactly `1` |
| T-R9-2.A.4.3 | R9-2.A.4 | integration | `blueprint board status` against live board → output contains URL, pid, worktree, and uptime; uptime matches `\d+[hms](?:\s\d+[ms])*`; exit `0` | All four tokens present; uptime matches regex; exit `0` |
| T-R9-2.A.5.1 | R9-2.A.5 | integration | All four invocations route through the dispatcher: `blueprint board`, `… start`, `… stop`, `… status` | Each routes to its expected handler (verified via behavior probe) |

### Stream B Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R9-2.B.1.1 | R9-2.B.1 | unit | Markdown heading-token sequence at the top of `docs/core/tracker.md` is exactly `[Board lifecycle, Gated transitions, Comment recipes, Task creation, …deeper-detail headings]` in that order | Parsed heading list matches expected prefix sequence |
| T-R9-2.B.1.2 | R9-2.B.1 | unit | Board lifecycle section documents the three subcommands (`start` default / `stop` / `status`), the shared-lock path `<git-common-dir>/blueprint-board.lock`, the duplicate-start refusal contract, and the legacy-lock migration note | All four required tokens present under the lifecycle heading scope |
| T-R9-2.B.1.3 | R9-2.B.1 | unit | Gated transitions section has at least one curl recipe per verb — each with `POST` and `/tasks/:id/<verb>` URL fragment for `start` / `submit` / `approve` / `reject` / `resume` | Five POST+URL patterns present (one per verb) |
| T-R9-2.B.1.4 | R9-2.B.1 | unit | Deeper-detail block retains a full curl reference including raw `PATCH /tasks/:id`, explicitly marked non-canonical for the five gated transitions | Both substrings present; non-canonical disclaimer in same scope |
| — | R9-2.B.2 | — | Not testable (no new test): coverage delivered by existing parameterized `tests/stream-c/project-templates-mirror.test.ts` which already enforces byte-for-byte equality of every templated core doc. | — |
| T-R9-2.B.3.1 | R9-2.B.3, R9-2.B.4 | unit | Parameterized over `[MAS-204, MAS-205]`: `docs/srs.md` contains a new Phase 2 change-log entry under that requirement covering the locked elaboration (MAS-205: lifecycle + shared lock + refusal + sweep; MAS-204: no server-surface change) and prior change-log entries are preserved | Both parameter cases pass: new entry token present; prior entries still present |

### Test Summary

| Component | Total Tasks | Testable | Not Testable | Tests |
|-----------|-------------|----------|--------------|-------|
| Gate R9-2.0 | 4 | 4 | 0 | 14 |
| Stream A | 5 | 5 | 0 | 20 |
| Stream B | 4 | 3 | 1 | 5 |
| **Total** | **13** | **12** | **1** | **39** |

---

## Definition of Done

- [ ] Gate R9-2.0 acceptance criteria pass.
- [ ] Stream A acceptance criteria pass.
- [ ] Stream B acceptance criteria pass.
- [ ] All tests in the Test Plan pass.
- [ ] No lint errors in files touched by this phase.
- [ ] Full test suite green after forward-only test additions covering the new lock path, the new subcommands, and the cheatsheet structural assertions.
- [ ] `docs/core/tracker.md` and `templates/docs/core/tracker.md` remain byte-for-byte aligned via the existing parameterized template-mirror test.

---

## Test Scenarios

### Happy Path

- [ ] `blueprint board` in a git repo with no live lock starts the server, writes `<git-common-dir>/blueprint-board.lock` with `pid` / `port` / `started_at` / `worktree`, prints the URL, and opens the browser unless `--headless`.
- [ ] `blueprint board` in a worktree containing a legacy `docs/.blueprint/board.lock` prints exactly one migration warning, deletes the legacy file, and writes the shared lock.
- [ ] `blueprint board stop` against a live board sends SIGTERM, the process exits, the port becomes unreachable, the lock is cleared, exit `0`.
- [ ] `blueprint board status` against a live board prints URL / pid / worktree / uptime and exits `0`.

### Edge Cases

- [ ] Second `blueprint board` in the same worktree while the lock is alive refuses with the URL + originating worktree message and exits `1`; no browser opens.
- [ ] Second `blueprint board` in a peer worktree of the same repo refuses with the same message and exit code; the originating worktree shown is the worktree that started the live board.
- [ ] `blueprint board` outside any git repository refuses with the canonical no-git message and exits `1`.
- [ ] `blueprint board stop` with no lock exits `0` with the "no board running" message.
- [ ] `blueprint board stop` with a stale lock (pid not running, or pid running but port unreachable) prints the cleanup message, removes the lock, and exits `0`.
- [ ] `blueprint board stop` against a process that ignores SIGTERM escalates to SIGKILL after the 2s window and still completes cleanup.
- [ ] `blueprint board status` against a stale lock exits `1` with the stale-lock recovery hint pointing at `blueprint board stop`.
- [ ] `blueprint board status` with no lock exits `2`.
- [ ] Concurrent `blueprint board` invocations across two peer worktrees: exactly one starts the server and writes the lock; the other refuses with exit `1`.

---
