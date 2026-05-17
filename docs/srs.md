# blueprint-cli - Software Requirements Specification

---

## Purpose

This SRS exists for blueprint-cli to act as the persistent requirement layer between the PRD and later planning documents. It codifies the structural rules, process constraints, and system behaviors.

---

## Requirement Index

| ID | Title | Priority | Status | Assigned Milestone |
|----|-------|----------|--------|--------------------|
| MAS-177 | Flat Requirement Lists in SRS | Must | superseded | M1 |
| MAS-178 | Checklist-style SRS execution | Must | superseded | M1 |
| MAS-200 | Git Execution Workflow Core Module | Must | active | Revision 4 |
| MAS-201 | Hierarchical Requirement Structuring | Must | active | Revision 4 |
| MAS-202 | Progressive Clarification vs Checklist | Must | active | Revision 4 |

---

## Requirements

### Must Have

#### MAS-200 - Git Execution Workflow Core Module

The system must formalize `git-execution-workflow.md` as a core module and enforce constraints against "Stale Status" and "Unupdated Review Notes" anti-patterns.

- The git workflow must be integrated into the core documentation set.
- Agents must adhere to the defined workflow during execution.

#### MAS-201 - Hierarchical Requirement Structuring

The system must ensure that the SRS module (`srs-planning.md`) structurally prevents "Flat Requirement Lists".

- Requirements must be grouped and structured logically rather than listed without hierarchy.

#### MAS-202 - Progressive Clarification vs Checklist

The system must enforce that the SRS is used for progressive clarification rather than as a simplistic task checklist.

- The SRS planning module must constrain agents from treating requirement gathering as a pure checklist exercise without understanding scope and depth.

### Should Have

_None yet._

### Could Have

_None yet._

### Won't Have

_None yet._

---

## Requirement Metadata

### MAS-177
- Title: Flat Requirement Lists in SRS
- Priority: Must
- Status: superseded
- Assigned milestone: M1
- Source: Revision 3
- Introduced by: Phase Planning
- Supersedes: None
- Superseded by: MAS-201

### MAS-178
- Title: Checklist-style SRS execution
- Priority: Must
- Status: superseded
- Assigned milestone: M1
- Source: Revision 3
- Introduced by: Phase Planning
- Supersedes: None
- Superseded by: MAS-202

### MAS-200
- Title: Git Execution Workflow Core Module
- Priority: Must
- Status: active
- Assigned milestone: Revision 4
- Source: Revision 4 Anti-Patterns
- Introduced by: Revision 4
- Supersedes: None
- Superseded by: None

Change log:
- 2026-04-08 - Created from Revision 4

### MAS-201
- Title: Hierarchical Requirement Structuring
- Priority: Must
- Status: active
- Assigned milestone: Revision 4
- Source: Revision 4 Anti-Patterns
- Introduced by: Revision 4
- Supersedes: MAS-177
- Superseded by: None

Change log:
- 2026-04-08 - Created from Revision 4

### MAS-202
- Title: Progressive Clarification vs Checklist
- Priority: Must
- Status: active
- Assigned milestone: Revision 4
- Source: Revision 4 Anti-Patterns
- Introduced by: Revision 4
- Supersedes: MAS-178
- Superseded by: None

Change log:
- 2026-04-08 - Created from Revision 4

---

## Data Schema

### None
