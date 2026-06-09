# Release Contract

This document is the Phase 4 source of truth for the public M1 release baseline.

## Package Identity

- npm package: `blueprint-agentic-development`
- Installed executable: `blueprint`
- Supported Node.js policy: `>=18.0.0`

## Release Tags

- Release publishing is triggered only by stable semver tags in the format `vMAJOR.MINOR.PATCH`
- Examples: `v0.1.0`, `v1.2.3`
- Ineligible tags include branch names, prefixed tags such as `release/v0.1.0`, partial versions, prerelease tags such as `v0.1.0-beta.1`, and tags with leading-zero numeric identifiers such as `v01.2.3`

## Shared Release Verification

- Canonical entrypoint: `npm run release:check`
- Automation aliases: `npm run release:check:ci` and `npm run release:check:publish`
- Verification order:
  1. `npm ci`
  2. `npm run typecheck`
  3. `npm test`
  4. `npm run build`
  5. `npm pack --json --dry-run`
  6. `npm run release:pack:verify`
- The baseline package verification step confirms the packed artifact still includes compiled `dist/` output, bundled `templates/`, and the repo-root `skills/blueprint/**` payload

## Skill Install Contract

- The public GitHub repository must ship the repo-root `skills/blueprint/**` mirror in the tarball so `npx skills add masterbatcoderman10/blueprint-cli --skill blueprint` can install the Blueprint skill
- Project-local install is the recommended path because it lands in `.claude/skills/blueprint/` where Claude Code discovers the skill natively
- Avoid `-g` for the skill install path; that is the current Claude Code discovery sharp edge because global skill installs land outside the project-local discovery path
- Real GitHub install verification is a manual smoke only; automated release checks stop at the tarball contract and do not replace a fresh public-repository install test

## Publish Prerequisites

- Publish preflight entrypoint: `npm run release:publish:preflight`
- Publish preflight only applies to stable release tags that match `vMAJOR.MINOR.PATCH`
- Scoped releases must keep `package.json` configured with `publishConfig.access` set to `public`
- Release automation must provide either GitHub trusted publishing with `ACTIONS_ID_TOKEN_REQUEST_URL` available or an `NPM_TOKEN`
- Release automation must also provide `GITHUB_REPOSITORY` so failures can be traced back to the publishing repository
- Ordinary validation runs and pull-request CI must not require publish credentials when no release tag is being published

## M1 Public Boundary

- Public M1 CLI scope is limited to the currently implemented commands: `init` and `doctor`
- `blueprint link` and `blueprint context` are documented as coming soon and are not part of the current implemented guidance surface
- This release baseline does not promise unreleased milestone features, cross-project context automation, or workflow visibility features from later milestones

## Help and Recovery Surface

- Root invocation (`blueprint`, `blueprint --help`, `blueprint -h`) displays usage guidance with the implemented command list
- Command-specific help is available via `blueprint help <command>` or `<command> --help` for `init` and `doctor`
- Unknown command recovery provides generic guidance toward `init` and `doctor` without surfacing placeholder commands
- The help surface explicitly excludes `link` and `context` from guided output while preserving their coming-soon documentation references
