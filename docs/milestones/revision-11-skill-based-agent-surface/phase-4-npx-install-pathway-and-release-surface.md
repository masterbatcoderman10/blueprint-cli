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
| R11-4.0.1 | Introduce one shared skill-payload inventory/mapping surface used by both mirror tests and release-artifact verification. The inventory must enumerate the full 23-file payload under `templates/skills/blueprint/**` and the corresponding repo-root `skills/blueprint/**` mirror paths (1 `SKILL.md`, 20 module `reference/*.md` files, 1 shared `reference/anti-patterns.md`, 1 `scripts/load-context.mjs`). | 0.75 | None | Independent |

### Gate Acceptance Criteria

- [ ] One shared inventory defines the exact 23-file skill payload and the template-to-repo-root mirror mapping.
- [ ] The shared inventory is the only enumerated source used by Phase 4 automated mirror/release verification; no duplicated file lists drift independently.

---

## Stream A — Repo-Root Skill Mirror

> Materialize the public GitHub install surface at `skills/blueprint/**` as a byte-identical mirror of the authoritative `templates/skills/blueprint/**` payload.

| Task ID | Task | Duration | Dependencies | Type |
|---------|------|----------|--------------|------|
| R11-4.A.1 | Create the repo-root `skills/blueprint/**` tree as a byte-identical mirror of `templates/skills/blueprint/**`, covering `SKILL.md`, all 20 module `reference/*.md` files, `reference/anti-patterns.md`, and `scripts/load-context.mjs`. No content divergence is allowed; templates remain the editable source of truth. | 1.0 | Gate | Dependent |
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
| R11-4.B.3 | Add automated release-verification coverage for the new artifact contract: positive verification when the packed artifact includes the mirrored skill payload, negative verification when `skills/` is absent, and parameterized negative verification for every individual shared-inventory payload file being absent from the package surface. | 1.0 | R11-4.B.2 | Dependent |

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
| R11-4.D.1 | Perform a manual smoke in a fresh temporary directory using `npx skills add masterbatcoderman10/blueprint-cli --skill blueprint` against a public GitHub ref that contains the Phase 4 repo-root `skills/blueprint/**` payload. If the installer supports a branch/ref selector, run it after pushing the Phase 4 branch and record the exact ref. If the installer only reads the default branch, treat this as post-merge/pre-release verification and record the default-branch commit SHA in the phase-completion notes before tagging or publishing. Verify the install succeeds, creates `.claude/skills/blueprint/**` with the expected 23-file payload, and does not scaffold unrelated Blueprint project docs or tracker state. | 0.5 | R11-4.A.2, R11-4.B.3, R11-4.C.1, R11-4.C.2, R11-4.C.3 | Dependent |
| R11-4.D.2 | Run a repo-wide cross-reference audit for stale fallback-installer promises in the active docs and release contracts, and clear or rewrite every remaining Phase 4 reference so the final repo-wide story is consistent with the primary-only contract. Future-looking references to a first-party CLI install option are allowed only when they explicitly point to Revision 11 Phase 6. | 0.5 | R11-4.C.1, R11-4.C.2, R11-4.C.3 | Dependent |
| R11-4.D.3 | Transition MAS-210 in `docs/srs.md` from `approved-pending-implementation` to `active` after the Phase 4 package, docs, audit, and manual-smoke boundary are satisfied. Preserve the existing MAS-210 change log and add a completion entry that records the exact install-smoke ref or the post-merge/pre-release verification boundary used. | 0.25 | R11-4.D.1, R11-4.D.2 | Dependent |

### Stream D Acceptance Criteria

- [ ] One real GitHub-backed manual smoke has been executed successfully with `npx skills add masterbatcoderman10/blueprint-cli --skill blueprint`.
- [ ] The manual smoke proves the install lands project-locally at `.claude/skills/blueprint/**`.
- [ ] Repo-wide docs and contracts no longer contradict the primary-only install pathway.
- [ ] Any forward reference to a first-party CLI install option is clearly marked as future Revision 11 Phase 6 scope, not a Phase 4 deliverable.
- [ ] MAS-210 is active in `docs/srs.md`, with completion notes preserving the install-smoke ref or the post-merge/pre-release verification boundary.

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

## Test Plan

> Generated from task analysis and aligned to the existing Vitest release, scaffold, mirror, and doc-contract test families under `tests/`. Every task in Gate R11-4.0 and Streams A-D is represented. Tests are written before implementation (TDD) during execution. Framework: Vitest (`*.test.ts` under `tests/`, mirroring `src/`). The real GitHub-backed `npx skills add masterbatcoderman10/blueprint-cli --skill blueprint` smoke is marked not testable for automated coverage because it depends on public GitHub state and the external `vercel-labs/skills` installer; the phase keeps that verification as a required manual smoke.

### Gate R11-4.0 Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R11-4.0.1.1 | R11-4.0.1 | unit | Verify the shared skill-payload inventory exports exactly 23 entries: `SKILL.md`, 20 module `reference/*.md` files, shared `reference/anti-patterns.md`, and `scripts/load-context.mjs`, with paired `templates/skills/blueprint/**` and `skills/blueprint/**` relative paths for every entry | The inventory is complete, exact, deterministic, and encodes the authoritative template path plus repo-root mirror path for each payload file |
| T-R11-4.0.1.2 | R11-4.0.1 | unit | Verify every Phase 4 mirror and release-artifact verification helper consumes the shared inventory export rather than maintaining a separate enumerated skill file list | Mirror and package verification cannot drift through duplicated hard-coded payload lists |
| T-R11-4.0.1.3 | R11-4.0.1 | unit | Verify the shared inventory path set matches the Phase 1/2 canonical skill file contract for the template payload, including the renamed `reference/*.md` map and `scripts/load-context.mjs` | Phase 4's repo-root mirror surface stays aligned with the existing scaffold and Doctor skill canonical-set |

### Stream A Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R11-4.A.1.1 | R11-4.A.1 | unit (mirror) | Walk the shared inventory and verify every expected file exists under both `templates/skills/blueprint/**` and `skills/blueprint/**` | The repo-root discovery surface is fully materialized for all 23 skill payload files |
| T-R11-4.A.1.2 | R11-4.A.1 | unit (mirror) | Compare bytes for every inventory pair between `templates/skills/blueprint/**` and `skills/blueprint/**` | The repo-root skill payload is a byte-identical mirror of the authoritative template payload |
| T-R11-4.A.1.3 | R11-4.A.1 | unit (mirror) | Recursively list both skill payload surfaces and verify neither `templates/skills/blueprint/**` nor `skills/blueprint/**` contains an extra file outside the shared inventory | The mirror contract fails on missing files, drifted files, or out-of-contract additions on either side |
| T-R11-4.A.1.4 | R11-4.A.1 | integration | In a temporary fixture, corrupt or remove the repo-root `skills/blueprint/**` mirror while leaving `templates/skills/blueprint/**` intact, then run skill-mode scaffold and Doctor skill repair/path-resolution coverage | Scaffold and Doctor continue to source skill payload bytes from `templates/skills/blueprint/**`, proving the repo-root mirror did not become an editable source of truth |
| T-R11-4.A.2.1 | R11-4.A.2 | unit (test-contract) | Verify the parameterized mirror contract test imports the shared inventory and covers existence, byte identity, and extra-file rejection in one test family | The mirror test itself is tied to the shared inventory and protects the full intended contract |
| T-R11-4.A.2.2 | R11-4.A.2 | integration | In a temporary copy of the skill payload, delete one mirrored file, drift one mirrored file, and add one extra file; run the mirror assertion helper against each case | The mirror assertion fails for missing, drifted, and extra-file cases with actionable file-path output |

### Stream B Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R11-4.B.1.1 | R11-4.B.1 | unit | Verify `package.json` includes `skills` in the published `files` array while retaining `dist` and `templates` | The npm package surface ships the repo-root skill payload without regressing existing published surfaces |
| T-R11-4.B.1.2 | R11-4.B.1 | unit | Verify `package.json` does not add the deferred first-party installer `bin` entry | Phase 4 package metadata does not expose the deferred first-party installer surface |
| T-R11-4.B.2.1 | R11-4.B.2 | unit | Verify `src/release/package-artifact.ts` builds its required skill package entries from the shared skill-payload inventory and normalizes entries to npm-pack tarball paths | Release verification uses the same payload contract as the mirror test and compares against packed artifact paths correctly |
| T-R11-4.B.2.2 | R11-4.B.2 | integration | Feed `verify-package-artifact` a representative `npm pack --json --dry-run` file list containing `dist/`, `templates/`, and every `skills/blueprint/**` inventory file | Verification succeeds when all existing package surfaces and the complete repo-root skill payload are present |
| T-R11-4.B.2.3 | R11-4.B.2 | integration | Feed `verify-package-artifact` a package file list that keeps `dist/` and `templates/` intact but omits the entire `skills/` surface | Verification fails with a missing-skill-payload diagnostic |
| T-R11-4.B.2.4 | R11-4.B.2 | integration | Parameterize over every shared-inventory entry: feed `verify-package-artifact` a package file list that includes the rest of `skills/blueprint/**` but omits exactly that one inventory file | Verification fails for every individual missing skill payload file rather than accepting partial payloads |
| T-R11-4.B.3.1 | R11-4.B.3 | unit (test-contract) | Verify the release-artifact test suite includes a positive case for a complete packed artifact, a negative case for missing `skills/`, and a parameterized negative case for each missing shared-inventory payload file | Automated release coverage pins both success and failure sides of the Phase 4 package contract |
| T-R11-4.B.3.2 | R11-4.B.3 | integration | Run `npm run release:pack:verify` after the package surface is updated and the repo-root skill payload exists | The real release verifier passes against the local repository package surface |

### Stream C Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| T-R11-4.C.1.1 | R11-4.C.1 | unit (doc-contract) | Verify `README.md` contains distinct CLI install/run guidance and skill install guidance, including the exact recommended command `npx skills add masterbatcoderman10/blueprint-cli --skill blueprint` | README separates installing/running the Blueprint CLI from installing the Blueprint skill |
| T-R11-4.C.1.2 | R11-4.C.1 | unit (doc-contract) | Verify `README.md` recommends project-local skill install, documents the current `-g` caveat for Claude Code discovery, and does not recommend global install as the default Claude Code path | README communicates the supported install path and the global-install sharp edge accurately |
| T-R11-4.C.1.3 | R11-4.C.1 | unit (doc-contract) | Verify `README.md` contains no Phase 4 promise for a bundled fallback installer, `blueprint-skill-install`, postinstall hook, or alternate npm-bin install flow | README does not advertise unsupported or deferred Phase 4 installer behavior |
| T-R11-4.C.2.1 | R11-4.C.2 | unit (doc-contract) | Verify `docs/release-contract.md` requires `skills/blueprint/**` in the npm tarball and references the repo-root skill payload as the public `vercel-labs/skills` discovery surface | The release contract includes the new published skill payload requirement |
| T-R11-4.C.2.2 | R11-4.C.2 | unit (doc-contract) | Verify `docs/release-contract.md` records the primary `npx skills add ... --skill blueprint` contract, project-local recommendation, `-g` caveat, and manual-smoke-only status for real GitHub install verification | Release-contract docs match the Phase 4 install and verification boundary |
| T-R11-4.C.3.1 | R11-4.C.3 | unit (doc-contract) | Verify `docs/releasing.md` tells maintainers that `skills/blueprint/**` must ship, `npx skills add ... --skill blueprint` is the only Phase 4 skill install pathway, and no fallback-installer workflow is part of the phase | Maintainer release docs match the implemented package and install surface |
| T-R11-4.C.3.2 | R11-4.C.3 | unit (doc-contract) | Parameterize over `README.md`, `docs/release-contract.md`, and `docs/releasing.md` and verify all three contain the same primary install command and project-local recommendation language tokens | User-facing and maintainer-facing docs stay consistent on the supported install pathway |

### Stream D Tests

| Test ID | Task | Type | Description | Expected Result |
|---------|------|------|-------------|-----------------|
| — | R11-4.D.1 | — | Not testable as automated coverage: the required smoke uses the public GitHub repository and external `vercel-labs/skills` installer, so it must be executed manually in a fresh temporary directory against a public ref containing the Phase 4 payload and recorded in phase-completion notes. If the installer cannot target a branch/ref, this becomes post-merge/pre-release verification against the default-branch commit before tagging or publishing. | — |
| T-R11-4.D.2.1 | R11-4.D.2 | unit (doc-contract) | Run a repo-wide grep-style audit for stale Phase 4 fallback promises in the active docs and release contracts | No Phase 4 doc or release contract still promises a fallback installer |
| T-R11-4.D.2.2 | R11-4.D.2 | unit (doc-contract) | Verify any remaining future-looking first-party install references explicitly mention Revision 11 Phase 6 and are not phrased as Phase 4 deliverables | Forward references are allowed only when clearly scoped to Revision 11 Phase 6 work |
| T-R11-4.D.2.3 | R11-4.D.2 | unit (doc-contract) | Verify the audit surface includes the active Phase 4 planning doc and docs/srs.md so no active docs are exempted | The cross-reference audit prevents active docs from contradicting the primary-only Phase 4 contract while preserving intentional history where needed |
| T-R11-4.D.3.1 | R11-4.D.3 | unit (doc-contract) | Verify MAS-210 in `docs/srs.md` has status `active`, preserves its existing change-log entries, and contains a Phase 4 completion entry recording the manual-smoke ref or post-merge/pre-release verification boundary | SRS state cannot remain `approved-pending-implementation` after Phase 4 completion |

### Test Summary

| Component | Total Tasks | Testable | Not Testable |
|-----------|-------------|----------|--------------|
| Gate R11-4.0 | 1 | 1 | 0 |
| Stream A | 2 | 2 | 0 |
| Stream B | 3 | 3 | 0 |
| Stream C | 3 | 3 | 0 |
| Stream D | 3 | 2 | 1 |
| **Total** | **12** | **11** | **1** |

---

## Definition of Done

- [ ] Gate R11-4.0 acceptance criteria pass
- [ ] Stream A acceptance criteria pass
- [ ] Stream B acceptance criteria pass
- [ ] Stream C acceptance criteria pass
- [ ] Stream D acceptance criteria pass
- [ ] All tests in the Test Plan pass
- [ ] `npm test` is green
- [ ] `npm run release:pack:verify` is green
- [ ] The packaged artifact includes `dist/`, `templates/`, and `skills/`
- [ ] README and release docs all point at the same primary install command: `npx skills add masterbatcoderman10/blueprint-cli --skill blueprint`
- [ ] No repo doc or release contract still presents a Phase 4 fallback-installer workflow
- [ ] MAS-210 status is `active` in `docs/srs.md`

---

## Test Scenarios

### Happy Path

- [ ] Repo-root `skills/blueprint/**` exists and is byte-identical to `templates/skills/blueprint/**`.
- [ ] `npm run release:pack:verify` passes when the packed artifact includes the repo-root skill payload.
- [ ] README shows `npx skills add masterbatcoderman10/blueprint-cli --skill blueprint` as the recommended project-local skill install command and still preserves CLI install instructions for `blueprint init`.
- [ ] In a fresh temporary directory, `npx skills add masterbatcoderman10/blueprint-cli --skill blueprint` installs the skill to `.claude/skills/blueprint/**` successfully from a public GitHub ref that contains the Phase 4 payload; if branch/ref install is unsupported, the same smoke is recorded as post-merge/pre-release verification against the default-branch commit.
- [ ] MAS-210 is transitioned to `active` in `docs/srs.md` after Phase 4 verification, with the manual-smoke ref or post-merge/pre-release boundary recorded.

### Edge Cases

- [ ] Deleting or drifting any file under `skills/blueprint/**` causes the mirror contract test to fail.
- [ ] Removing `skills/` from the package surface causes `npm run release:pack:verify` to fail.
- [ ] Removing any single shared-inventory file from the packed `skills/blueprint/**` payload causes release verification to fail even if the top-level `skills/` directory and every other skill file exist.
- [ ] README and release docs explicitly call out the `-g` global-install caveat rather than implying global install is the recommended Claude Code path.
- [ ] Repo-wide grep finds no lingering Phase 4 fallback-installer promises after cleanup.

---
