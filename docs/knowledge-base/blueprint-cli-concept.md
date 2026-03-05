# Blueprint CLI — Concept Document

> **Status:** Idea — to be built after core Blueprint documents and module prompts are complete.
> **Purpose:** A globally installable npm CLI that handles Blueprint scaffolding and cross-project context sharing.

---

## Problem

Blueprint currently has two friction points:

1. **Setup friction** — initializing Blueprint in a new project means manually copying template files. There is no install step.
2. **Cross-project cold start** — when a dependent project starts (e.g. a frontend after the backend is built), all context from the first project lives in the human's head. There is no mechanism for a new project's agent to arrive oriented without manual reconstruction.

---

## Solution

A lightweight npm CLI written in TypeScript that acts as Blueprint's installation and coordination layer.

### Why npm + TypeScript

The CLI's workload is entirely file I/O: copying template files, reading markdown, parsing JSON config, and printing to stdout. There is no computation here that benefits from a systems language.

**Why not Rust:** The only practical gain Rust offers for a CLI is a self-contained binary with no runtime dependency. That advantage doesn't apply here — the target users are developers running `npm install -g`, meaning Node is already on their machine by definition. In exchange for that non-benefit, Rust would require cross-compilation for every target platform (Mac arm64, Mac x86, Linux, Windows) and a CI build matrix to produce release binaries. TypeScript iteration is also significantly faster during development. The cost is real; the gain is zero.

**Why TypeScript over plain JavaScript:** Type safety on file path handling and config parsing catches mistakes early, and the tooling (ts-node, tsx) is mature enough that there is no meaningful overhead.

- `npm install -g blueprint-cli` works on any machine without environment setup
- No Python virtual environments, no pip, no version conflicts
- Node's `fs` and `path` modules are sufficient for everything the CLI does
- Easy to publish, version, and distribute via `npm publish`

---

## Repository Structure

Template documents are stored in the same repository as the CLI source. The CLI and its templates must be versioned together — a breaking change to a module doc needs to ship with the CLI version that references it. Separating them into a second repo introduces a synchronization problem with no benefit.

```
blueprint-cli/
├── src/
│   ├── commands/
│   │   ├── init.ts
│   │   ├── link.ts
│   │   └── context.ts
│   └── index.ts
├── templates/
│   ├── AGENTS.md
│   └── docs/
│       ├── project-progress.md      # blank shell with template placeholders
│       ├── prd.md                   # blank shell with template placeholders
│       ├── conventions.md           # blank shell with template placeholders
│       └── core/
│           ├── planning.md
│           ├── task-management-protocol.md
│           └── ... (all core modules, copied verbatim)
├── package.json
├── tsconfig.json
└── README.md
```

`blueprint init` walks `templates/` and copies the structure into the target project. npm includes non-JS files in published packages automatically — the templates ship with the CLI at no extra configuration, provided they are not excluded by `.npmignore`.

The distinction between template types:
- `templates/docs/core/` — copied verbatim, these are the live protocol modules
- `templates/docs/project-progress.md`, `prd.md`, `conventions.md` — blank shells with placeholder text only, filled in by the user or alignment agent after scaffolding

---

## Commands

### `blueprint init`

Scaffolds Blueprint into the current project.

- Copies all core Blueprint files into `docs/`
- Creates `docs/core/`, `docs/milestones/`, required root files
- Generates a blank `docs/project-progress.md` and `docs/prd.md`
- Places `AGENTS.md` at repo root

```bash
cd my-new-project
blueprint init
```

---

### `blueprint link <path> --alias <name>`

Links another Blueprint project by local file path.

- Writes the link to `docs/.blueprint-links.json`
- Alias is used to reference the project in other commands

```bash
blueprint link ../my-backend --alias backend
```

`.blueprint-links.json` (written to `docs/`):

```json
{
  "links": [
    { "alias": "backend", "path": "../my-backend" }
  ]
}
```

---

### `blueprint context [alias]`

Reads and prints orientation context from a linked project.

- Without alias: lists all linked projects and their current phase
- With alias: prints the linked project's orientation docs to stdout

**What it loads (in order):**
1. `docs/prd.md` — what the project is and why
2. `docs/project-progress.md` — current state, decisions log
3. Current milestone doc — what is actively being built (path read from project-progress.md)

This output can be piped directly into an agent's context at session start — no manual file loading required.

```bash
blueprint context backend
```

---

## Usage Pattern — Cross-Project Session Start

When a frontend agent starts and needs backend context:

```bash
blueprint context backend
```

The agent receives:
- The backend's PRD (domain model, product intent)
- The backend's decisions log (the *why* behind architectural choices)
- The backend's current milestone (what is actively in flight)
- The backend's current phase status

This is enough to arrive oriented without any handoff document or human reconstruction.

---

## Future Commands (Post-MVP)

These are not required for the initial build but are natural extensions:

| Command | Purpose |
|---------|---------|
| `blueprint status` | Show all linked projects and their current phase |
| `blueprint diff <alias>` | Summarise what changed in a linked project since last sync |
| `blueprint sync` | Pull latest context from all linked projects before session start |

---

## Package Naming

`blueprint` is likely taken on npm. Candidates to evaluate at publish time:

- `blueprint-dev`
- `bpdev`
- Something more distinctive — TBD

---

## Scope Boundaries

The CLI is **not** responsible for:

- Task execution or kanban interaction (that is Blueprint's agent layer)
- Enforcing that contracts stay in sync (that is the orchestration layer)
- Generating handoff documents (the source files already contain the context)

The CLI is a **scaffolding and context surfacing tool**, nothing more.

---

## Build Dependencies

- Blueprint core documents must be finalized before the CLI scaffolds them
- Module prompts must be complete so `blueprint init` copies a full, working system
- The `blueprint context` command depends on `blueprint-structure.md` being stable (it uses the known file layout to find docs)

---

*Created: 2026-02-27 | Updated: 2026-03-05 | Status: Concept — pending core Blueprint completion*
