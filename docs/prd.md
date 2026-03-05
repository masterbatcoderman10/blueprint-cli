# Blueprint CLI — Product Requirements Document

## Overview

**Problem:** Teams using Blueprint face setup friction when starting a new project and lose context when related projects start later. Initialization is manual, and cross-project orientation depends on human handoff.

**Solution:** Blueprint CLI is a globally installable command-line tool that scaffolds Blueprint structure in new repositories and surfaces orientation context from linked Blueprint projects so agents and developers can start work with immediate project awareness.

**Success Criteria:**
- New projects can initialize Blueprint structure in one command.
- Teams can link related Blueprint projects and retrieve current context in one command.
- Cross-project startup time is reduced because key planning context is available without manual reconstruction.

## Target Users

Developers and technical teams who manage multiple related software projects and use Blueprint planning workflows. These users need repeatable project setup and fast orientation across repositories.

## Platform & Experience

- **Primary platform:** Desktop command line
- **Access model:** Open local CLI usage
- **Authentication:** No account required for local usage
- **Distribution model:** Open source npm package
- **License:** MIT
- **Experience constraints:** Commands should be predictable, low-friction, and readable in terminal output

## Milestones

### M1 — Project Bootstrap
> Deliver a one-command Blueprint setup flow for new repositories.
- Initialize Blueprint docs and required folder structure in the current project
- Scaffold core protocol modules and required root files
- Produce editable starting documents for project progress and product planning

---
**MVP** — Primary product objectives achieved.
---

### M2 — Cross-Project Context (Optional Post-MVP)
> Enable linked-project awareness so new sessions start with relevant context when needed.
- Link external Blueprint projects by local path and alias
- List linked projects and basic state visibility
- Load orientation context from a linked project using its alias
- Present linked project context in a terminal-friendly format

### M3 — Workflow Visibility Enhancements (Optional Future)
> Improve ongoing multi-project coordination after core workflow is stable.
- Show summarized status across linked projects
- Surface what changed in a linked project since prior checks
- Provide a one-command sync-style context refresh across links
