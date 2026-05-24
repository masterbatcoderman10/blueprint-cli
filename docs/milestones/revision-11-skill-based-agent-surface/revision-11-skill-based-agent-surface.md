# Revision 11 — Skill-Based Agent Surface

**Status:** Identified — planning
**Identified:** 2026-05-24
**Owner milestone bucket:** Revision 11 (post-M1, post-R10)
**Type:** Hybrid — additive (new skill surface + npx pathway) and modifying (init flow, Doctor canonical-set semantics, conventions.md deletion, agent entry-point variants).

---

## 1. What is changing and why

### 1.1 Change

Blueprint's primary agent entry point migrates from `.md` core modules — loaded via root `CLAUDE.md` / `AGENTS.md` / `GEMINI.md` / `QWEN.md` `<ModuleRouting>` tables — to a single `blueprint` Claude skill installed at the canonical `.claude/skills/blueprint/` path. The skill follows the same shape as the `impeccable` reference skill: a single `SKILL.md` (frontmatter + setup gate + shared laws + commands table + routing rules) with `reference/*.md` files loaded on demand per sub-command, and `scripts/*.mjs` for context loading and npx install.

Sub-commands mirror `docs/core/*.md` **1:1**. Setup gate (mirroring impeccable's PRODUCT.md/DESIGN.md gate) requires populated `docs/project-progress.md` plus an initialised tracker (`docs/.blueprint/tasks.db` and `docs/.blueprint/` directory present). Tracker setup itself is delegated: the skill instructs the agent to install `blueprint-cli` (`npm i -g blueprint-agentic-development`) which provisions the tracker, board, and Doctor surfaces; the skill does not duplicate tracker logic.

`docs/conventions.md` is **sunsetted**. Its content (tech stack, libraries, coding standards, testing, anti-patterns, agent tools, releasing, project-specific notes) is migrated into the project's `CLAUDE.md` and `AGENTS.md` (and skill-mode `GEMINI.md` / `QWEN.md` variants) as a `<ProjectConventions>` section — the natural home, since these files are always loaded by their respective agents at session start. This eliminates one indirection and removes a file that Doctor must enforce.

Coexistence is **dual-source**: the existing `.md` core module system continues to work for projects scaffolded under it. The skill becomes the **recommended default** for new projects, surfaced via:
- `blueprint init` mode prompt (skill recommended; legacy supported but flagged not recommended)
- Doctor mode-aware report (current mode + migration recommendation if legacy)
- CLI startup banner on legacy projects (one-line `[deprecation] consider migrating to skill mode`; suppressible flag)

**Init alignment-status marker.** To simplify the post-init flow, `blueprint init` (both modes) writes a hardcoded one-line marker into every scaffolded agent entry-point file (`CLAUDE.md` / `AGENTS.md` / `GEMINI.md` / `QWEN.md`) indicating that alignment is the next required step. Default marker format: a single HTML comment line (`<!-- blueprint-status: alignment-required -->`). The alignment protocol gains a final step (documented in `docs/core/alignment.md`) instructing the agent to run a yet-to-be-built `alignment-complete` command which flips the marker to `<!-- blueprint-status: alignment-complete -->`. The command itself is **deferred** to Revision 11 Phase 6 (alongside the planned `migrate` command); only the alignment-protocol doc update and the init-side marker write land in Phase 1.

Distribution gains an **npx pathway** alongside the existing local-scaffold copy. The primary pathway uses [`vercel-labs/skills`](https://github.com/vercel-labs/skills), the community-standard skill-management CLI: users run `npx skills add masterbatcoderman10/blueprint-cli --skill blueprint`, which pulls the skill payload directly from this repo's public GitHub source and installs it project-locally into `.claude/skills/blueprint/` — the canonical path Claude Code discovers natively. No npm publication is strictly required for this pathway; the GitHub source is the install target. As a zero-dependency fallback we additionally publish a `bin` script (`blueprint-skill-install`) in the npm tarball that performs the same copy without requiring the vercel CLI. Postinstall hooks are deliberately avoided in both pathways.

For the vercel pathway to work, the skill payload must live at a path vercel-labs/skills knows how to scan in the repo (`skills/`, `.agents/skills/`, or repo root); we standardise on `skills/blueprint/` to keep the npm `files` array consistent with the bin-script fallback. Global install (`npx skills add ... -g`) is a known sharp edge today — it lands in `~/.agents/skills/` rather than `~/.claude/skills/` (vercel-labs/skills issues [#693](https://github.com/vercel-labs/skills/issues/693), [#744](https://github.com/vercel-labs/skills/issues/744), [#851](https://github.com/vercel-labs/skills/issues/851)) — so the recommended install is project-local (default). We document this caveat rather than work around it.

### 1.2 Why

- **Native discoverability.** Claude Code (and Claude Code-compatible harnesses) match skills by their frontmatter `description`. The agent does not need to read a `<ModuleRouting>` table to learn that a request maps to `phase-planning.md` — the skill's commands table and per-command frontmatter descriptions auto-route.
- **Context economy.** Today's setup loads `CLAUDE.md` + `conventions.md` + `tracker.md` + the routing target module at session start. A skill loads only its `SKILL.md` until a sub-command is invoked; the matched `reference/*.md` loads on demand.
- **Canonical path alignment.** `.claude/skills/<name>/SKILL.md` is the documented canonical path for Claude Code skill discovery. Aligning Blueprint to it removes a category of "where does this live" friction.
- **Pattern parity with proven examples.** `/impeccable` already demonstrates the SKILL.md + reference/ + commands-table pattern on a real production-grade design workflow that the user already uses successfully.
- **Reduced entry-point sprawl.** The current four root entry-point variants (CLAUDE.md / AGENTS.md / GEMINI.md / QWEN.md) all carry the same `<SessionStart>` + `<HardRules>` + `<ModuleRouting>` content (enforced byte-identical by R10 Phase 1 tests). One skill replaces four sources of drift risk.
- **Conventions consolidation.** `conventions.md` content is consumed only by agents at session start; folding it into the agent entry-point file it would have been read alongside removes an extra hop without losing any guidance.

---

## 2. Impact analysis

### 2.1 PRD milestones affected

| Milestone | Affected | Notes |
|-----------|----------|-------|
| M1 — Project Bootstrap | Yes | init, scaffold, Doctor, release-artifact surfaces all touched |
| M2 — Cross-Project Context | No | not yet started |
| M3 — Workflow Visibility | No | not yet started |

### 2.2 M1 phases affected

| Phase | Severity | Reason |
|-------|----------|--------|
| Phase 1 — CLI Foundation | Minor | startup-banner injection point added to the dispatch loop |
| Phase 2 — Scaffold Engine | Major | mode-aware scaffold (skill payload vs `docs/core/**`); mode prompt added |
| Phase 3 — Template Integrity (Doctor) | Major | mode detection, mode-aware canonical-set, mode-aware repair semantics, deprecation surfacing |
| Phase 4 — Testing Setup & Release Readiness | Moderate | npx install pathway extends release-artifact surface; new test coverage added |

### 2.3 Prior revisions whose content is ported (no behavior change)

| Revision | Module(s) | Treatment |
|----------|-----------|-----------|
| R5 — Orchestration | `orchestrate.md` | content mirrored to `skills/blueprint/reference/orchestrate.md` |
| R6 — Built-in Tracker | `tracker.md` | mirrored to `reference/tracker.md`; skill references tracker HTTP API and instructs CLI install |
| R7 / R8 — Tweak | `tweak-planning.md` | mirrored to `reference/tweak.md` (MAS-207 change-first contract preserved verbatim) |
| R9 — Tracker QoL | `tracker.md` (board lifecycle additions) | mirrored alongside R6 content |
| R10 — Anti-Pattern Shape | `srs-planning.md` exemplar shape | mirrored to `reference/anti-patterns.md` (shared laws); enforced across all `reference/*.md` |

### 2.4 Files & modules

#### New (skill payload — shipped under `skills/blueprint/` in the npm tarball, scaffolded into `.claude/skills/blueprint/`)

```
skills/blueprint/SKILL.md
skills/blueprint/reference/align.md
skills/blueprint/reference/anti-patterns.md
skills/blueprint/reference/blueprint-structure.md
skills/blueprint/reference/bug.md
skills/blueprint/reference/commit.md          (git-execution-workflow content)
skills/blueprint/reference/commit-review.md   (git-review-workflow content)
skills/blueprint/reference/execute.md
skills/blueprint/reference/hierarchy.md
skills/blueprint/reference/orchestrate.md
skills/blueprint/reference/phase-complete.md
skills/blueprint/reference/plan-milestone.md
skills/blueprint/reference/plan-phase.md
skills/blueprint/reference/plan-prd.md
skills/blueprint/reference/plan-test.md
skills/blueprint/reference/planning.md        (overview / progressive-planning content)
skills/blueprint/reference/review.md
skills/blueprint/reference/revision.md
skills/blueprint/reference/scope-change.md
skills/blueprint/reference/srs.md
skills/blueprint/reference/tracker.md
skills/blueprint/reference/tweak.md
skills/blueprint/scripts/load-context.mjs
skills/blueprint/scripts/install.mjs          (or bin/blueprint-skill-install.js)
```

20 reference files mirror the current 20 `docs/core/*.md` modules 1:1 (plus the shared `anti-patterns.md` laws file). One-to-one mapping is the explicit decision; no consolidation.

#### Changed

- `src/init/prompts.ts`, `src/init/types.ts`, `src/init/onboarding.ts`, `src/init/archive-engine.ts` — `Mode = 'skill' | 'legacy'`; mode prompt (skill recommended); branched scaffold paths; post-scaffold step that writes the `<!-- blueprint-status: alignment-required -->` marker to every scaffolded agent entry-point file (CLAUDE / AGENTS / GEMINI / QWEN)
- `docs/core/alignment.md` and `templates/docs/core/alignment.md` (byte-identical mirror) — final alignment step added: instruct the agent to run the `alignment-complete` command (deferred to Phase 6) to flip the entry-point file's `<!-- blueprint-status: alignment-required -->` marker to `<!-- blueprint-status: alignment-complete -->`
- `src/index.ts` — CLI startup hook: detect project mode, print suppressible deprecation banner on legacy
- `src/doctor/structure.ts` — `CANONICAL_CORE_FILES` becomes mode-aware (legacy projects keep current set; skill projects swap to skill canonical-set: `.claude/skills/blueprint/SKILL.md` + every `reference/*.md`)
- `src/doctor/inventory.ts`, `src/doctor/repair.ts`, `src/doctor/comparator.ts`, `src/doctor/findings.ts`, `src/doctor/report.ts` — mode detection (presence of `.claude/skills/blueprint/SKILL.md`); mode-aware repair; mode + deprecation surfaced in report
- `templates/CLAUDE.md`, `templates/AGENTS.md`, `templates/GEMINI.md`, `templates/QWEN.md` — gain skill-mode variants (drop `<ModuleRouting>` and `<HardRules>` Module-Before-Action / Minimal-Loading rules since the skill handles routing; retain a `<ProjectConventions>` section that absorbs sunsetted `conventions.md` content); legacy variants kept side-by-side
- `docs/core/blueprint-structure.md` and `templates/docs/core/blueprint-structure.md` — describe dual-source layout (skill payload + legacy `docs/core/`)
- `package.json` — `bin` entry for `blueprint-skill-install`; `files` array gains `skills/`
- `src/release/package-artifact.ts`, `src/release/verify-package-artifact.ts`, `docs/release-contract.md`, `docs/releasing.md` — verify `skills/` ships in tarball; bin script registered
- Root `CLAUDE.md` / `AGENTS.md` / `GEMINI.md` of **this** repo (blueprint-cli itself) — converted to skill mode in Phase 5 (dogfood)

#### Deleted

- `docs/conventions.md`
- `templates/conventions.md`
- `templates/docs/conventions.md`
- (Conventions content migrates into agent entry-point files' `<ProjectConventions>` section in skill-mode variants. Legacy-mode entry-point variants retain their current `conventions.md` reference for back-compat.)

### 2.5 Tests affected (will fail or need rewrite)

Tests that asserted the OLD canonical surface and will need updating as part of R11 phases (per `<RevisionRules>`: this is expected, not regression):

- `tests/stream-a/srs-surface-contract.test.ts` — canonical-set assertions become mode-aware
- The parameterized canonical-set Doctor-repair probe (R7-1.A.3 lineage) — mode-aware reflection across legacy and skill canonical sets
- R10 Phase 1 Stream A block-identity test across 7 entry-point variants — extended to cover skill-mode variants
- The template-mirror parameterized test — extended to cover `templates/skills/blueprint/**` ↔ `skills/blueprint/**` mirror
- Any test path-referencing `docs/conventions.md` — drop or relocate
- R10 Phase 2 anti-pattern-shape test set — extended to apply to every `skills/blueprint/reference/*.md` that contains an `<AntiPatterns>` block

### 2.6 SRS requirements affected

#### New requirements introduced by Revision 11

| ID | Title | Status | Phase that activates it |
|----|-------|--------|-------------------------|
| MAS-208 | Skill-Based Agent Surface | approved-pending-implementation | Phase 1 |
| MAS-209 | Dual-Source Deprecation Path | approved-pending-implementation | Phase 3 |
| MAS-210 | NPX Skill Install Pathway | approved-pending-implementation | Phase 4 |

**MAS-208 — Skill-Based Agent Surface** (draft body):
> The system must provide a single `blueprint` Claude skill installed at the canonical `.claude/skills/blueprint/` path as the recommended primary agent surface.
>
> - The skill must consist of `SKILL.md` (frontmatter `name`, `description`; setup gate; shared laws; commands table; routing rules), one `reference/*.md` file per `docs/core/*.md` module (1:1 mapping), and `scripts/load-context.mjs` for project-state context loading.
> - The setup gate must require populated `docs/project-progress.md`, an initialised tracker (`docs/.blueprint/tasks.db` and `docs/.blueprint/` directory present), and must instruct the agent to install `blueprint-cli` if the tracker is missing.
> - Sub-commands must mirror `docs/core/*.md` 1:1 by name, with no consolidation.
> - The skill must ship in the published npm tarball under `skills/blueprint/` and be scaffolded into new projects by `blueprint init` when the user selects skill mode.
> - `<AntiPatterns>` blocks within `reference/*.md` must conform to the canonical shape established by Revision 10 Phase 2.

**MAS-209 — Dual-Source Deprecation Path** (draft body):
> The system must support both skill mode and legacy `.md` core module mode as a transition strategy, with the skill mode recommended and the legacy mode deprecated but functional.
>
> - `blueprint init` must prompt the user to choose a mode, with skill mode marked recommended and legacy mode marked not recommended.
> - Doctor must detect the project's mode by the presence of `.claude/skills/blueprint/SKILL.md` and report the detected mode in its output, with a migration recommendation when the project is in legacy mode.
> - Every CLI invocation on a legacy-mode project must print a one-line suppressible deprecation banner (`[deprecation] consider migrating to skill mode`).
> - Suppression must be controllable via a flag (e.g., `--no-deprecation-banner`) and a long-form override (e.g., env var `BLUEPRINT_SUPPRESS_DEPRECATION=1`).
> - No automatic in-place migration. Migration is user-initiated by re-running `blueprint init` and selecting skill mode (or a future `blueprint migrate` command, out of scope for R11).

**MAS-210 — NPX Skill Install Pathway** (draft body):
> The system must support two npx install pathways for the `blueprint` skill, both targeting the canonical project-local `.claude/skills/blueprint/` directory:
>
> **Primary — vercel-labs/skills compatibility.** The skill payload must live at `skills/blueprint/` in the repository root so that the community-standard `vercel-labs/skills` CLI can locate it. Users must be able to install the skill into a project by running:
>
> ```bash
> npx skills add masterbatcoderman10/blueprint-cli --skill blueprint
> ```
>
> This pathway requires no additional code from us — only that `skills/blueprint/` exists in the repo's default branch and the skill metadata (frontmatter `name`, `description`) is valid. The README must document this command as the recommended install.
>
> **Fallback — bundled bin script.** The system must also publish a `bin` entry (`blueprint-skill-install`) in the npm tarball that copies the bundled `skills/blueprint/` payload into the cwd's `.claude/skills/blueprint/`, independent of the vercel CLI:
>
> ```bash
> npx blueprint-skill-install
> ```
>
> - Invocation must take no required arguments; target directory overridable via flag.
> - The script must be idempotent: re-running over an existing skill directory must offer to overwrite, abort, or merge (default: prompt).
> - No npm `postinstall` hook may be used to perform this copy implicitly.
> - The script must work standalone (the user need not have run `blueprint init` nor installed `vercel-labs/skills`).
> - The release-artifact verifier must confirm `skills/blueprint/` is present in the published tarball and the bin entry is registered in `package.json`.
>
> **Documentation.** README and `docs/releasing.md` must call out the global-install sharp edge (`-g` installs to `~/.agents/skills/`, which Claude Code does not natively discover) and recommend project-local install for both pathways.

#### Same-ID elaboration (meaning unchanged; surface broadened to include skill mirror)

| ID | Title | Treatment |
|----|-------|-----------|
| MAS-200 | Git Execution Workflow Core Module | git-execution content additionally surfaced via `reference/commit.md`; original module retained; change-log entry added |
| MAS-203 | Agent Orchestration Protocol Module | orchestrate content additionally surfaced via `reference/orchestrate.md`; original module retained; change-log entry added |
| MAS-204 | Built-in Task Tracker | tracker contract additionally surfaced via `reference/tracker.md` which instructs CLI install; behavior unchanged; change-log entry added |
| MAS-205 | Local Project Board UI | board behavior unchanged; surfaced in `reference/tracker.md`; change-log entry added |
| MAS-207 | Change-First Tweak Workflow | tweak content additionally surfaced via `reference/tweak.md`; original module retained; change-log entry added |
| MAS-201, MAS-202 | SRS structural rules | additionally enforced via `reference/srs.md`; canonical text remains in `docs/core/srs-planning.md`; change-log entries added |

No supersessions. No requirement's user-facing meaning changes.

### 2.7 Conflicts with active or upcoming work

None. Revision 10 complete. No pending revisions. No active phase work. Clean slate for execution.

---

## 3. Phases (high-level only)

Per `<AntiPattern name="Phase-Level Task Breakdown in Revision Plan">`, phase-level gate / stream / task breakdown is intentionally omitted here. Each phase is planned in detail when its turn comes via `docs/core/phase-planning.md`.

### Phase 1 — Skill Authorship & Mode-Aware Scaffold
Author `SKILL.md` (frontmatter + setup gate + shared laws + commands table + routing rules) and all 20 `reference/*.md` files as 1:1 mirrors of current `docs/core/*.md`. Author `scripts/load-context.mjs`. Add `Mode` to init types; add mode prompt to init flow (skill recommended); branch scaffold engine to emit skill payload when skill mode is selected and the legacy `docs/core/**` payload when legacy mode is selected. Update `docs/core/alignment.md` (and its template mirror) to add the final `alignment-complete` step (command implementation deferred to Phase 6). Add a post-scaffold init step that writes the `<!-- blueprint-status: alignment-required -->` marker into every scaffolded agent entry-point file in both modes. Create SRS requirement MAS-208 (status `approved-pending-implementation`).

### Phase 2 — Doctor Mode Awareness & Dual-Source Repair
Add mode detection to Doctor (presence of `.claude/skills/blueprint/SKILL.md` ⇒ skill mode). Make `CANONICAL_CORE_FILES` mode-aware so Doctor enforces the skill canonical-set on skill-mode projects and the existing `docs/core/**` set on legacy-mode projects. Update repair semantics, inventory, comparator, findings, and report to surface the detected mode. Activate MAS-208.

### Phase 3 — CLI Deprecation Banner & Conventions Sunset
Add CLI startup banner emitted on every command invocation in a legacy-mode project (one line; suppressible). Delete `docs/conventions.md`, `templates/conventions.md`, `templates/docs/conventions.md`. Add `<ProjectConventions>` section to skill-mode variants of `CLAUDE.md` / `AGENTS.md` / `GEMINI.md` / `QWEN.md` templates with the migrated content. Update `srs-planning.md` and `alignment.md` to stop referencing `conventions.md` in skill mode. Create and activate MAS-209.

### Phase 4 — NPX Install Pathway & Release Surface
**Primary pathway:** verify `skills/blueprint/` lives at repo root so `npx skills add masterbatcoderman10/blueprint-cli --skill blueprint` (vercel-labs/skills) works out of box; add README install section documenting this command; smoke-test the install against a tmp dir using vercel CLI. **Fallback pathway:** author `bin/blueprint-skill-install.js` (or expose `skills/blueprint/scripts/install.mjs` via bin); register bin in `package.json`; add `skills/` to the `files` array; update `src/release/package-artifact.ts` + `verify-package-artifact.ts` to enforce the new payload; update `docs/release-contract.md` and `docs/releasing.md` (including the `-g` global-install sharp-edge caveat); add npx fallback smoke tests. Create and activate MAS-210.

### Phase 5 — Dogfood & Cross-Reference Verification
Convert the root `CLAUDE.md` / `AGENTS.md` / `GEMINI.md` of the blueprint-cli repo itself to skill mode. Install the skill at `.claude/skills/blueprint/` in this repo. Run a full end-to-end Blueprint workflow exercise (a synthetic small revision or tweak) under skill mode to validate the entire surface. Fix any gaps surfaced. Verify no regression against the full test suite. Update `docs/project-progress.md` once complete.

### Phase 6 — Migrate & Alignment-Complete Commands
Implement the deferred `alignment-complete` command (flips `<!-- blueprint-status: alignment-required -->` to `<!-- blueprint-status: alignment-complete -->` in every scaffolded agent entry-point file present at project root; idempotent). Implement the related `migrate` command (legacy-mode → skill-mode in-place migration; scope locked when Phase 6 is planned). Both commands invoked directly from the CLI; both work whether the project was scaffolded in skill or legacy mode. Detailed scope (flags, idempotency rules, error semantics, smoke tests) deferred to Phase 6 planning. New SRS requirements (working IDs MAS-211 alignment-complete command and MAS-212 migrate command) to be created during Phase 6 planning.

---

## 4. Success criteria

A. The npm tarball contains `skills/blueprint/SKILL.md`, all 20 `reference/*.md` files, both scripts, and a `bin` entry for `blueprint-skill-install` — verified by `verify-package-artifact.ts`.

B. `blueprint init` on a fresh directory offers a mode choice; choosing skill mode produces a project with `.claude/skills/blueprint/` populated, no `docs/core/**`, and a `<ProjectConventions>` section in the chosen agent entry-point file; choosing legacy mode produces the current scaffold unchanged plus a "not recommended" notice.

C. Doctor on a skill-mode project enforces the skill canonical-set; on a legacy-mode project enforces the current `docs/core/**` set; reports the detected mode; recommends migration on legacy.

D. Every CLI command run inside a legacy-mode project prints the one-line deprecation banner unless suppressed; skill-mode projects print nothing extra.

E. **Primary pathway:** `npx skills add masterbatcoderman10/blueprint-cli --skill blueprint` (vercel-labs/skills) in a directory with no Blueprint footprint creates a valid project-local `.claude/skills/blueprint/` tree and exits 0 without modifying anything else. **Fallback pathway:** `npx blueprint-skill-install` from the published npm tarball produces the same result without requiring the vercel CLI. Both are smoke-tested. README documents both, recommends project-local install, and surfaces the `-g` global-install sharp edge.

F. `docs/conventions.md` and its two template mirrors are deleted; the conventions content is reachable via the `<ProjectConventions>` section of any skill-mode agent entry-point file scaffolded by `blueprint init`.

G. The full test suite is green. Pre-R11 tests that asserted the old canonical-set or the existence of `docs/conventions.md` are updated to mode-aware or removed; no test failures attributable to R11 changes remain.

H. **Regression guard:** every prior MAS requirement that R11 marks as same-ID-elaborated (MAS-200, MAS-201, MAS-202, MAS-203, MAS-204, MAS-205, MAS-207) continues to be satisfied — verified by re-running the contract tests added by R5, R6, R7, R8, R9, and R10. R11 must not change any of their underlying behavior; it only adds an alternate surface.

I. **Dogfood:** the blueprint-cli repo itself runs under skill mode end-to-end (Phase 5). A synthetic small change is executed via the skill surface without falling back to the legacy `.md` modules.

---

## 5. Open questions deferred to phase planning

Items below are intentionally deferred to the relevant phase plan rather than locked here:

- Exact wording of the deprecation banner and the suppression flag/env-var names (Phase 3).
- Exact SKILL.md frontmatter `description` string — must be specific enough to auto-trigger on planning/execution/review/revision requests without colliding with adjacent tools (Phase 1).
- Whether `scripts/load-context.mjs` returns JSON or a markdown-formatted brief (Phase 1).
- Whether the bin script supports an interactive merge mode for existing skill directories or only prompt/abort/overwrite (Phase 4).
- Whether to actively track the upstream vercel-labs/skills `-g` global-install resolution (issues [#693](https://github.com/vercel-labs/skills/issues/693), [#744](https://github.com/vercel-labs/skills/issues/744), [#851](https://github.com/vercel-labs/skills/issues/851)) and remove the README caveat once resolved (Phase 4 or follow-up).
- Whether legacy-mode entry-point variants gain any forward-compat hooks (e.g., a one-line note about the skill) or remain unchanged (Phase 3).
