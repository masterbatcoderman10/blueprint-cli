# Releasing Blueprint CLI

This guide is for maintainers preparing the public npm release of `@splitwireml/blueprint`.

## Package Identity

- npm package: `@splitwireml/blueprint`
- npm scope: `splitwireml`
- Installed executable: `blueprint`
- Public access requirement: `package.json` must keep `publishConfig.access` set to `public`

## Current Release Entry Points

The current repository-level release checks are script-driven:

- `npm run release:check`
- `npm run release:check:ci`
- `npm run release:check:publish`
- `npm run release:publish:preflight`

Underlying script entrypoints:

- `tsx src/release/run-release-check.ts`
- `tsx src/release/run-publish-preflight.ts`

## Release Tag Contract

- Only stable semver tags in the format `vMAJOR.MINOR.PATCH` are eligible for publish
- Examples: `v0.1.0`, `v1.2.3`
- Branch names, prefixed tags, partial versions, and prerelease tags must not publish

## npm Scope and Repository Setup

Before automated publishing is enabled, make sure the package and repository are ready:

1. Confirm the `splitwireml` npm scope exists and has permission to publish `@splitwireml/blueprint`.
2. Confirm the repository is the canonical source for the package and exposes the correct `GITHUB_REPOSITORY` value in automation.
3. Keep the package public by preserving `publishConfig.access` as `public`.
4. Keep the release contract aligned with [`docs/release-contract.md`](./release-contract.md).

## Verification Flow

Run the shared release gate before creating a release tag:

```bash
npm ci
npm run release:check
```

`npm run release:check` currently centralizes install, typecheck, tests, build, `npm pack`, and packaged artifact verification. CI and publish automation should call the same shared path through `npm run release:check:ci` and `npm run release:check:publish`.

## Publish Prerequisites

Run this preflight before any publish attempt:

```bash
npm run release:publish:preflight
```

For a release-tag publish, the preflight expects:

- `GITHUB_REPOSITORY`
- Either GitHub trusted publishing via `ACTIONS_ID_TOKEN_REQUEST_URL` or a classic `NPM_TOKEN`
- A valid release tag matching `vMAJOR.MINOR.PATCH`
- The package to remain configured for public scoped publishing

## If Publish Prerequisites Are Missing

If publish prerequisites are missing, `npm run release:publish:preflight` should fail before publish with actionable output.

Check these first:

- `publishConfig.access` is still `public`
- `GITHUB_REPOSITORY` is available in the automation environment
- `ACTIONS_ID_TOKEN_REQUEST_URL` is available for trusted publishing, or `NPM_TOKEN` is configured instead
- The tag being released matches `vMAJOR.MINOR.PATCH`

## Automation Boundary

This repository already defines the release contract and the reusable script entrypoints. GitHub Actions CI and tag-triggered publish automation are introduced separately in Stream B, and they should consume the same script contract rather than inventing new release commands.

## CLI Help and Recovery Behavior

The released `blueprint` executable provides the following help and recovery surface:

- **Root help**: Running `blueprint`, `blueprint --help`, or `blueprint -h` displays usage guidance listing only implemented commands (`init` and `doctor`)
- **Command help**: Running `blueprint help <command>` or `<command> --help` provides detailed help for `init` and `doctor`
- **Unknown command recovery**: Unrecognized commands receive generic guidance pointing users toward `init` and `doctor` without surfacing placeholder commands

The help surface intentionally excludes `link` and `context` from guided output. These commands remain documented as coming soon in release-facing documentation but do not appear in runtime help or recovery messages.
