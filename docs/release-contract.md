# Release Contract

This document is the Phase 4 source of truth for the public M1 release baseline.

## Package Identity

- npm package: `@splitwireml/blueprint`
- Installed executable: `blueprint`
- Supported Node.js policy: `>=20.0.0`

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
  5. `npm pack --json`
  6. `npm run release:pack:verify`
- The baseline package verification step confirms the packed artifact still includes compiled `dist/` output and bundled `templates/`

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
