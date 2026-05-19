# Blueprint

**Software engineering discipline for AI-aided development.** Blueprint structures planning and execution so you stay in control: phases decompose into testable tasks, agents run in parallel without conflict, and scope changes don't break your plan. Write tests first. Review code before shipping. Track progress in your repo.

[![npm version](https://img.shields.io/npm/v/@splitwireml/blueprint)](https://www.npmjs.com/package/@splitwireml/blueprint) [![Node.js >= 20.0.0](https://img.shields.io/badge/Node.js-%3E%3D20.0.0-brightgreen)](https://nodejs.org/) [![MIT License](https://img.shields.io/badge/License-MIT-blue)](#license) [![GitHub stars](https://img.shields.io/github/stars/splitwireml/blueprint)](https://github.com/splitwireml/blueprint)

## Get Started

```bash
npm install -g @splitwireml/blueprint
blueprint init
```

---

## The Task Tracker

![Blueprint Task Tracker — macOS app showing Kanban board with TO-DO, IN-PROGRESS, IN-REVIEW, and DONE columns.](docs/images/task-tracker.png)

Built-in task tracker gives you visual control over phases and streams. Manage tasks, track state, filter by milestone and assignee.

---

## Recent Updates

- **v0.2.0** — Built-in task tracker (SQLite + Svelte SPA). Kanban board for phases and streams.
- **R6 Phase 5** — Milestone Integration & Verification complete. Full test coverage, doctor command working.
- **R5** — New orchestration protocol for multi-agent parallel execution.

[See all releases →](https://github.com/splitwireml/blueprint/releases)

---

## What is Blueprint?

Most teams using AI agents build fast and accumulate risk at the same speed. Features ship untested. Agents lose context between sessions. A scope change cascades through four documents that are now out of sync. Plans become fragile.

Blueprint enforces test-driven development at the task level, not as an afterthought. Before an agent writes implementation code, it writes the test. The test fails. The agent implements until it passes. This structure is not negotiable — if a test passes before implementation, Blueprint flags it. Every task has acceptance criteria. Every phase ends at a gate where all tasks must be in DONE, all tests must pass, and the Definition of Done must be satisfied. Cross-phase regressions are caught and tracked as bugs before you move forward.

The framework also eliminates execution chaos. Phases decompose into a Gate (blocking foundation) and parallel Streams (independent work tracks). Each stream is scoped and bounded so multiple agents can execute simultaneously without stepping on each other's files or logic. Plans stay coherent when requirements change because phases are progressive — you commit to the level of detail each stage actually requires, no more and no less.

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
npm install -g @splitwireml/blueprint
```

**Requirements:** Node.js `>=20.0.0`

---

## Commands

| Command | Purpose |
|---------|---------|
| `blueprint init` | Scaffold a Blueprint project with full docs and templates |
| `blueprint doctor` | Audit and repair project structure |
| `blueprint board` | Open built-in task tracker board in browser |
| `blueprint link` | Cross-project linking *(coming soon)* |
| `blueprint context` | Cross-project context surfacing *(coming soon)* |

---

## Learn More

- **[PRD & Planning](docs/prd.md)** — Product requirements and project structure
- **[Core Workflows](docs/core/)** — Phase planning, execution, review, and troubleshooting
- **[Release Notes](https://github.com/splitwireml/blueprint/releases)** — What's new in each version
- **[Release Contract](docs/release-contract.md)** — How we version and support releases

---

## Contributing

Blueprint is open source. Found a bug? Want to contribute? [Open an issue →](https://github.com/splitwireml/blueprint/issues)

**License:** MIT — see [LICENSE](LICENSE) for details.
