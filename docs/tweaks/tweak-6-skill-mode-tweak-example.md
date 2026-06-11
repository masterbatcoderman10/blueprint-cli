## Status

Complete. Classification: tweak via the installed Blueprint skill workflow
because the change is small, contained, docs-only, non-feature, and needs no
formal test plan. User confirmation: the explicit `execute C.2` request on
2026-06-11. User-review outcome: prepared for the normal R11-5 Stream C
review handoff after this task is submitted.

---

## Summary of Change

Restatement: replace the stale `docs/conventions.md` worked example in the
tweak workflow with a current skill-mode example based on an agent entry
point's `<ProjectConventions>` section, while leaving the broader
cross-reference audit for Stream D. Selected target: the tweak workflow's
positive example, step-by-step worked example, and sample post-hoc record.
Changed mirror surfaces: live core doc, template core doc, authoritative skill
template, repo-root skill mirror, and local `.claude` installed skill mirror.
Verification commands/results: `rg` found zero remaining stale worked-example
tokens in the touched tweak surfaces; `diff -q` passed for live/template docs
and for template/repo-root/local skill mirrors. The workflow was routed through
the installed skill-mode `tweak` reference, not root `<ModuleRouting>`.

---

## Files Touched

- `docs/core/tweak-planning.md`
- `templates/docs/core/tweak-planning.md`
- `templates/skills/blueprint/reference/tweak.md`
- `skills/blueprint/reference/tweak.md`
- `.claude/skills/blueprint/reference/tweak.md`
- `docs/tweaks/tweak-6-skill-mode-tweak-example.md`

---

## User Acceptance Note

User approved execution of R11-5.C.2 on 2026-06-11 by requesting
`[$blueprint] execute C.2`; final acceptance proceeds through the R11-5
Stream C review cycle.
