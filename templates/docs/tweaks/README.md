# Tweaks

This directory holds **standalone tweak documents** — the top-level
quick-change contract for Blueprint projects. Tweaks are small,
contained, non-feature changes that move faster than revisions while
preserving every Blueprint planning, tracker, review, and verification
guard.

For the full contract (definition, classification, review gate,
execution lifecycle, boundary rules vs revisions/scope-change/bug
resolution, and a complete worked example), see
[`docs/core/tweak-planning.md`](../core/tweak-planning.md).

## File naming convention

Every tweak document uses this exact naming pattern:

```
docs/tweaks/tweak-<n>-<slug>.md
```

- `<n>` is the next available integer (scan this directory for the
  highest existing `tweak-<n>-*.md` and increment by one).
- `<slug>` is a short, kebab-case identifier describing the change.

Examples:

- `docs/tweaks/tweak-1-execution-anti-pattern.md`
- `docs/tweaks/tweak-2-cli-error-copy.md`
- `docs/tweaks/tweak-3-conventions-acronym-rule.md`

## Tracker milestone value

Tweak tracker tasks must use this milestone string (em-dash, human
name):

```
Tweak <n> — <name>
```

## What does NOT belong here

- New features → `docs/core/scope-change.md` or revision/milestone
  planning
- Multi-phase or cross-cutting work → `docs/core/revision-planning.md`
- Reproducible defects → `docs/core/bug-resolution.md`
- Inline phase-document tweak entries (no longer supported) — phase
  templates no longer have a `## Tweaks` section

See [`docs/core/tweak-planning.md`](../core/tweak-planning.md) for the
full boundary rules and a decision guide.
