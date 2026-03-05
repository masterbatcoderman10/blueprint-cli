# Planning Hierarchy

This document defines the five-level planning hierarchy used in Blueprint.
Every planning decision belongs to exactly one level. When in doubt, refer
here first.

---

## The Five Levels

```
Project
└── Milestone (M1, M2, M3...)
    └── Phase (Phase 1, Phase 2...)
        └── Gate (Gate N.0) / Stream (A, B, C...)
            └── Task (Gate task or Stream task)
```

---

## Level 1 — Project

The **Project** is the entire product or system being built. There is
exactly one project per repository or deployment. The project is never
planned in a single doc — it is the sum of all milestones.

**Defined in:** `docs/prd.md` (product vision and feature roadmap)
**Tracked in:** `docs/project-progress.md` (current state)

---

## Level 2 — Milestone

A **Milestone** represents a major product goal or version. It groups
related phases that together deliver a meaningful product increment.

| Property | Description |
|----------|-------------|
| **Naming** | `M<N> — <Name>` (e.g., `M1 — Recipe Collection`, `M2 — Collaborative Editing`) |
| **Scope** | One coherent product increment — a major capability or version |
| **Document** | `milestone-<n>-<name>.md` inside `docs/milestones/milestone-<n>-<name>/` |
| **Contents** | Phases listed with one-sentence objectives, phase dependencies, success criteria |

A milestone describes WHAT a product increment delivers. It does not
contain task breakdowns, schema definitions, or implementation detail.
Each phase is described in one sentence — the phase doc handles the rest.

### When to create a Milestone

- A new major version or product launch is starting
- The scope spans multiple phases
- A clear product goal can be stated in one sentence

---

## Level 3 — Phase

A **Phase** is a major feature area or delivery increment within a
milestone. It is the primary unit of day-to-day development planning.
This is the first level where technical detail belongs.

| Property | Description |
|----------|-------------|
| **Naming** | `Phase <N> — <Name>` (e.g., `Phase 4 — Permissions & Sharing`) |
| **Document** | `phase-<n>-<name>.md` inside its milestone folder |
| **Contents** | Goals, dependencies, gate, streams, tasks, Test Plan, DoD, test scenarios |
| **Duration** | Measured in abstract units; includes sequential and parallelized estimates |

A phase delivers a testable, reviewable increment. It always contains
a gate (blocking foundation) and one or more streams (parallel work).

### Phase Relationship to Milestones

A phase belongs to exactly one milestone. The phase document lives
inside its milestone's folder and references the milestone in its
header. The milestone document does not enumerate individual tasks —
it only describes phases at the objective level.

---

## Level 4 — Gate and Stream

Gates and Streams are the two structural elements within a phase.

| Element | Role | Naming |
|---------|------|--------|
| **Gate** | Sequential, blocking foundation that unlocks streams | `Gate N.0` |
| **Stream** | Parallel track of related work, runs after the gate | Stream A, Stream B, Stream C… |

A phase always has exactly one gate and one or more streams. Streams
are parallelizable by default. If a stream depends on another stream,
the dependency is documented explicitly in the stream header and in
the parallelization map.

---

## Level 5 — Task

A **Task** is the smallest unit of deliverable work. Tasks live inside
a gate or stream. Each task has a task ID, duration estimate,
dependencies, and acceptance criteria.

| Property | Description |
|----------|-------------|
| **Gate task ID** | `<phase>.<gate>.<seq>` (e.g., `4.0.1`, `4.0.3`) |
| **Stream task ID** | `<stream letter>.<seq>` (e.g., `A.1`, `B.3`, `C.2`) |
| **Max duration** | 2.0 units. If larger, split the task. |

Task conventions — ID formats, duration units, dependency notation —
are defined in the TaskConventions section of phase-planning.md.

---

## Naming Convention Summary

| Level | Format | Example |
|-------|--------|---------|
| Milestone | `M<N> — <Name>` | `M2 — Collaborative Editing` |
| Phase | `Phase <N> — <Name>` | `Phase 4 — Permissions & Sharing` |
| Gate | `Gate <N.0>` | `Gate 4.0` |
| Stream | `Stream <Letter> — <Label>` | `Stream A — Sharing Flow` |
| Gate Task | `<phase>.<gate>.<seq>` | `4.0.1`, `4.0.3` |
| Stream Task | `<stream>.<seq>` | `A.3`, `B.2` |

---

## Document Map

| What you're planning | Document | Location |
|----------------------|----------|----------|
| Product vision and features | `prd.md` | `docs/` root |
| Current project state | `project-progress.md` | `docs/` root |
| Project conventions | `conventions.md` | `docs/` root |
| Major product goal / version | `milestone-<n>-<name>.md` | `docs/milestones/milestone-<n>-<name>/` |
| Feature area / delivery increment | `phase-<n>-<name>.md` | `docs/milestones/milestone-<n>-<name>/` |
| Agent behaviour | `AGENTS.md` | Repo root |

---

## Enforcement Rules

1. **Phase docs live inside their milestone's folder.** No phase doc may exist outside of `docs/milestones/milestone-<n>-<name>/`.
2. **Tasks never live in milestone docs.** Milestone docs describe phases at the objective level, not the task level.
3. **Phases reference their milestone.** Every phase document states which milestone it belongs to.
4. **Gates are always blocking.** No stream may begin before the gate's acceptance criteria are met.
5. **Streams are parallelizable by default.** If a stream depends on another stream, document the dependency explicitly in the stream header and in the parallelization map.
