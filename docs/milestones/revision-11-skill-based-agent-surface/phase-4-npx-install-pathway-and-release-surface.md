# Phase 4 — NPX Install Pathway & Release Surface Plan

**Status**: Planning
**Milestone**: Revision 11 — Skill-Based Agent Surface
**Phase ID prefix**: R11-4

---

## Goals

- Ship a repo-root `skills/blueprint/**` payload so `npx skills add masterbatcoderman10/blueprint-cli --skill blueprint` works against the public GitHub repository.
- Keep `templates/skills/blueprint/**` authoritative for scaffold and Doctor flows; enforce `skills/blueprint/**` as a byte-identical mirror rather than introducing a second editable source.
- Extend the release artifact contract so the published npm tarball includes the repo-root skill payload alongside the existing `dist/` and `templates/` surfaces.
- Update README and release-facing docs so skill installation is documented as a project-local `npx skills add ...` workflow, with the global `-g` sharp edge called out explicitly.
- Remove the previously drafted fallback installer scope from Revision 11 Phase 4. A first-party CLI install option is deferred to Revision 11 Phase 6 and is not part of this phase.
- Require one real GitHub-backed manual smoke using `npx skills add masterbatcoderman10/blueprint-cli --skill blueprint`, while keeping automated coverage local and deterministic.

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Revision 11 Phase 1 — `templates/skills/blueprint/**` authored and scaffolded in skill mode | Complete |
| Revision 11 Phase 2 — Doctor skill canonical-set and template resolution point at `templates/skills/blueprint/**` | Complete |
| Revision 11 Phase 3 — skill-mode entry-point variants and deprecation messaging landed | Complete |
| `vercel-labs/skills` install surface confirmed: repo-root `skills/` is a supported discovery path for `npx skills add ... --skill blueprint` | Complete |
| MAS-210 created in `docs/srs.md` (status `approved-pending-implementation`) | Complete (pre-phase SRS repair, 2026-06-09) |
| Existing release verifier checks only `dist/` and `templates/`; it does not yet verify repo-root `skills/` | Pending Phase 4 implementation |

---

## Gate R11-4.0 — Inventory Foundation

> The Phase 4 contract is already locked via pre-phase SRS and revision-doc updates. The gate defines one shared inventory for the skill payload so mirror tests and release-artifact verification operate over the same file set.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R11-4.0.1 | Introduce one shared skill-payload inventory/mapping surface used by both mirror tests and release-artifact verification. The inventory must enumerate the full 23-file payload under `templates/skills/blueprint/**` and the corresponding repo-root `skills/blueprint/**` mirror paths (1 `SKILL.md`, 20 `reference/*.md`, 1 shared `reference/anti-patterns.md`, 1 `scripts/load-context.mjs`). | 0.75 | None | Independent |

### Gate Acceptance Criteria

- [ ] One shared inventory defines the exact 23-file skill payload and the template-to-repo-root mirror mapping.
- [ ] The shared inventory is the only enumerated source used by Phase 4 automated mirror/release verification; no duplicated file lists drift independently.

---

## Stream A — Repo-Root Skill Mirror

> Materialize the public GitHub install surface at `skills/blueprint/**` as a byte-identical mirror of the authoritative `templates/skills/blueprint/**` payload.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R11-4.A.1 | Create the repo-root `skills/blueprint/**` tree as a byte-identical mirror of `templates/skills/blueprint/**`, covering `SKILL.md`, all 20 `reference/*.md` files, `reference/anti-patterns.md`, and `scripts/load-context.mjs`. No content divergence is allowed; templates remain the editable source of truth. | 1.0 | Gate | Dependent |
| R11-4.A.2 | Add a parameterized mirror contract test that walks the shared skill-payload inventory and asserts: every expected file exists under both `templates/skills/blueprint/**` and `skills/blueprint/**`; every mirrored file is byte-identical; neither surface contains an out-of-contract extra file. | 1.0 | R11-4.0.1, R11-4.A.1 | Dependent |

### Stream A Acceptance Criteria

- [ ] `skills/blueprint/SKILL.md` exists at repo root in the discovery shape expected by `vercel-labs/skills`.
- [ ] All 23 mirrored files exist under `skills/blueprint/**` and match the authoritative template bytes exactly.
- [ ] Automated verification fails if any mirrored file is missing, drifted, or only present on one side.
- [ ] No scaffold or Doctor behavior changes ownership away from `templates/skills/blueprint/**`.

---

## Stream B — Release Artifact Verification

> Extend the package surface and release checks so the published tarball proves it ships the repo-root skill payload.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R11-4.B.1 | Update `package.json` so the published package surface includes repo-root `skills/` alongside the existing `dist` and `templates` entries. Do not add any fallback-installer `bin` entry in this phase. | 0.5 | Gate | Dependent |
| R11-4.B.2 | Extend `src/release/package-artifact.ts` and `src/release/verify-package-artifact.ts` to verify that `npm pack --json --dry-run` includes the repo-root `skills/blueprint/**` payload defined by the shared inventory, in addition to the existing `dist/` and `templates/` checks. | 0.75 | R11-4.0.1, R11-4.B.1 | Dependent |
| R11-4.B.3 | Add automated release-verification coverage for the new artifact contract: positive verification when the packed artifact includes the mirrored skill payload, and negative verification when `skills/` or a representative mirrored file is absent from the package surface. | 1.0 | R11-4.B.2 | Dependent |

### Stream B Acceptance Criteria

- [ ] `npm pack --json --dry-run` for the repo includes `skills/blueprint/**` in the packed artifact.
- [ ] `npm run release:pack:verify` fails if the repo-root skill payload is absent or incomplete.
- [ ] No Phase 4 code or tests expect a fallback-installer `bin` surface.
- [ ] Existing release checks for `dist/` and `templates/` remain intact.

---

## Stream C — Install Docs & Release Contract

> Update user-facing and maintainer-facing documentation so the supported skill install story matches the implemented Phase 4 surface exactly.
> **Depends on:** Stream A (repo-root `skills/blueprint/**` path names) and Stream B (packed-artifact contract).

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R11-4.C.1 | Rewrite the install/get-started portions of `README.md` to distinguish CLI installation from skill installation. Document `npx skills add masterbatcoderman10/blueprint-cli --skill blueprint` as the recommended project-local skill install pathway, retain CLI global install guidance for running `blueprint init` / `doctor`, and explicitly call out the current `-g` sharp edge for Claude Code discovery. | 1.0 | R11-4.A.1, R11-4.B.2 | Dependent |
| R11-4.C.2 | Update `docs/release-contract.md` to require the repo-root skill payload in the tarball, document the primary `npx skills add ...` install contract, record project-local recommendation, and note that the real GitHub install is a manual smoke requirement rather than an automated release test. | 0.75 | R11-4.B.2 | Dependent |
| R11-4.C.3 | Update `docs/releasing.md` to mirror the same contract for maintainers: repo-root `skills/blueprint/**` must ship, `npx skills add ...` is the only Phase 4 install pathway, project-local install is recommended, `-g` caveat is documented, and no fallback-installer workflow is promised. | 0.75 | R11-4.B.2 | Dependent |

### Stream C Acceptance Criteria

- [ ] README clearly distinguishes the Blueprint CLI package from the Blueprint skill install command.
- [ ] README, `docs/release-contract.md`, and `docs/releasing.md` all agree on the same primary install command and the same project-local recommendation.
- [ ] Release-facing docs mention the `-g` caveat without promising an unsupported workaround.
- [ ] No Phase 4 doc still promises a bundled fallback installer or `blueprint-skill-install`.

---

## Stream D — GitHub Smoke & Cross-Reference Audit

> Prove the real-world GitHub install path works once, then sweep the repo for stale Phase 4 fallback language.
> **Depends on:** Stream A, Stream B, and Stream C.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R11-4.D.1 | Perform a manual smoke in a fresh temporary directory using `npx skills add masterbatcoderman10/blueprint-cli --skill blueprint`. Verify the install succeeds, creates `.claude/skills/blueprint/**` with the expected 23-file payload, and does not scaffold unrelated Blueprint project docs or tracker state. Record the verification outcome in the phase-completion notes rather than as an automated test. | 0.5 | R11-4.A.2, R11-4.B.3, R11-4.C.1, R11-4.C.2, R11-4.C.3 | Dependent |
| R11-4.D.2 | Run a repo-wide cross-reference audit for stale fallback-installer promises (`blueprint-skill-install`, bundled fallback, npm-bin fallback wording) and clear or rewrite every remaining Phase 4 reference so the final repo-wide story is consistent with the primary-only contract. Future-looking references to a first-party CLI install option are allowed only when they explicitly point to Revision 11 Phase 6. | 0.5 | R11-4.C.1, R11-4.C.2, R11-4.C.3 | Dependent |

### Stream D Acceptance Criteria

- [ ] One real GitHub-backed manual smoke has been executed successfully with `npx skills add masterbatcoderman10/blueprint-cli --skill blueprint`.
- [ ] The manual smoke proves the install lands project-locally at `.claude/skills/blueprint/**`.
- [ ] Repo-wide docs and contracts no longer contradict the primary-only install pathway.
- [ ] Any forward reference to a first-party CLI install option is clearly marked as future Phase 6 scope, not a Phase 4 deliverable.

---

## Parallelization Map

```text
Gate R11-4.0 (shared inventory) ──────────────────────────────────────────────┐
                                                                               │
                 ┌─────────────────────────────────────────────────────────────┤
                 │                                                             │
  Stream A (repo-root skills mirror + mirror contract tests) ────────────────►│
  Stream B (package surface + release artifact verification) ─────────────────►│
                 │                                                             │
                 └── Stream C (README + release docs)
                     depends on A + B ────────────────────────────────────────►│
                                                                               │
                     Stream D (manual GitHub smoke + repo audit)
                     depends on A + B + C ────────────────────────────────────►│
                                                                               │
                                                                               ▼
                                                                 Phase R11-4 complete
```

---

## Definition of Done

- [ ] Gate R11-4.0 acceptance criteria pass
- [ ] Stream A acceptance criteria pass
- [ ] Stream B acceptance criteria pass
- [ ] Stream C acceptance criteria pass
- [ ] Stream D acceptance criteria pass
- [ ] `npm test` is green
- [ ] `npm run release:pack:verify` is green
- [ ] The packaged artifact includes `dist/`, `templates/`, and `skills/`
- [ ] README and release docs all point at the same primary install command: `npx skills add masterbatcoderman10/blueprint-cli --skill blueprint`
- [ ] No repo doc or release contract still presents a Phase 4 fallback-installer workflow

---

## Test Scenarios

### Happy Path

- [ ] Repo-root `skills/blueprint/**` exists and is byte-identical to `templates/skills/blueprint/**`.
- [ ] `npm run release:pack:verify` passes when the packed artifact includes the repo-root skill payload.
- [ ] README shows `npx skills add masterbatcoderman10/blueprint-cli --skill blueprint` as the recommended project-local skill install command and still preserves CLI install instructions for `blueprint init`.
- [ ] In a fresh temporary directory, `npx skills add masterbatcoderman10/blueprint-cli --skill blueprint` installs the skill to `.claude/skills/blueprint/**` successfully.

### Edge Cases

- [ ] Deleting or drifting any file under `skills/blueprint/**` causes the mirror contract test to fail.
- [ ] Removing `skills/` from the package surface causes `npm run release:pack:verify` to fail.
- [ ] Removing a representative mirrored file such as `skills/blueprint/SKILL.md` or `skills/blueprint/reference/align.md` from the packed artifact causes release verification to fail even if the top-level `skills/` directory exists.
- [ ] README and release docs explicitly call out the `-g` global-install caveat rather than implying global install is the recommended Claude Code path.
- [ ] Repo-wide grep finds no lingering Phase 4 fallback-installer promises after cleanup.

---
