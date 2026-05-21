# Blueprint

**Software engineering discipline for AI-aided development.** Blueprint structures planning and execution so you stay in control: phases decompose into testable tasks, agents run in parallel without conflict, and scope changes don't break your plan. Write tests first. Review code before shipping. Track progress in your repo.

[![npm version](https://img.shields.io/npm/v/blueprint-agentic-development)](https://www.npmjs.com/package/blueprint-agentic-development) [![Node.js >= 20.0.0](https://img.shields.io/badge/Node.js-%3E%3D20.0.0-brightgreen)](https://nodejs.org/) [![MIT License](https://img.shields.io/badge/License-MIT-blue)](#license)

## Get Started

```bash
npm install -g blueprint-agentic-development
blueprint init
```

---

## Recent Updates

- **v0.2.6** — Renamed to `blueprint-agentic-development`. Unscoped npm package for better discoverability. Trusted publishing via GitHub Actions OIDC.
- **v0.2.4** — R8 Phase 2 complete: Tweak Planning Flow Rewrite. Parallel agent execution hardened. Tweak workflow elevated to first-class planning mode.
- **v0.2.3** — R7 Standalone Tweak Workflow. Tweaks are now top-level first-class quick-change workflow with dedicated plans, acceptance criteria, and verification.
- **v0.2.0** — Built-in task tracker (SQLite + Svelte SPA). Kanban board for phases and streams. Removed external `vibe-kanban` dependency.

[See full changelog →](CHANGELOG.md)

---

## What is Blueprint?

Most teams using AI agents build fast and accumulate risk at the same speed. Features ship untested. Agents lose context between sessions. A scope change cascades through four documents that are now out of sync. Plans become fragile. This is **context rot** — the quality degradation that happens as AI fills its context window without structure.

Blueprint solves this through five mechanisms:

1. **Bounded tasks** — Each task is one deliverable with acceptance criteria and tests. Small scope means full context fits in an agent's budget.

2. **External memory** — Task state, progress, blockers, and implementation notes live in a visual UI-based tracker. Agents don't need to hold project state in context.

3. **Test contracts** — Every task ships with a test. Tests become specs: future agents know exactly what "DONE" means without re-reading docs.

4. **Progressive documentation** — Plans are written only as detailed as needed. Once a phase is planned, it doesn't change unless scope shifts formally. Agents work from stable specs.

5. **Git as audit trail** — Commit messages, test files, and review notes explain every change. Sessions can end cleanly and resume later with full context from git history.

These mechanisms prevent context rot. Agents work on large phases without overflow, hand off work cleanly, and parallel sessions coordinate through the tracker instead of chaos.

---

## How It Works

1. **Plan your phase in detail** → Decompose into Gate (blocking foundation) + Streams (parallel tracks), write acceptance criteria and test plan
2. **Execute a stream** → Create tasks, set up worktree, write test (should fail), implement until it passes, move to IN-REVIEW
3. **Review the work** → Verify against spec, mark clean tasks DONE, leave structured notes on issues
4. **Address notes** → Fix each issue, respond inline, commit, return to review
5. **Resolve regressions** → Run full test suite at phase close, surface failing tests as bug tasks, fix and verify before shipping
6. **Ship the phase** → All tasks DONE, Definition of Done satisfied, full suite green, phase marked complete

For detailed workflows and command reference, see the [comprehensive guide](docs/core/) in the docs.

---

## Quick Start

```bash
blueprint init
```

Scaffolds docs (PRD, phase templates, test contracts), conventions file, and managed agent entry points so you and your AI tools share a foundation from the start.

```bash
blueprint doctor
```

Audits your project structure and repairs drift—run at any time to validate everything is in sync.

For detailed guides and command reference, see the [core documentation](docs/core/).

---

## Installation

```bash
npm install -g blueprint-agentic-development
```

**Requirements:** Node.js `>=20.0.0`

---

## Commands

| Command | Purpose |
|---------|---------|
| `blueprint init` | Scaffold a Blueprint project with full docs and templates |
| `blueprint doctor` | Audit and repair project structure |
| `blueprint board` | Open the task tracker in your browser |
| `blueprint link` | Cross-project linking *(coming soon)* |
| `blueprint context` | Cross-project context surfacing *(coming soon)* |

---

## Learn More

- **[Context & Sessions](docs/core/context-and-sessions.md)** — Preventing context rot, managing parallel work, session best practices
- **[Orchestration](docs/core/orchestrate.md)** — Multi-stream coordination, parallel execution, orchestrator responsibilities
- **[Core Workflows](docs/core/)** — Phase planning, execution, review, and troubleshooting
- **[PRD & Planning](docs/prd.md)** — Product requirements and project structure
- **[Release Notes](https://github.com/splitwireml/blueprint/releases)** — What's new in each version

---

## Contributing

Blueprint is open source. Found a bug? Want to contribute? [Open an issue →](https://github.com/splitwireml/blueprint/issues)

**License:** MIT — see [LICENSE](LICENSE) for details.
