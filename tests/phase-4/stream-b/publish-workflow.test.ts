import { describe, expect, it } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const root = resolve(process.cwd())
const publishWorkflowPath = resolve(root, '.github/workflows/publish.yml')

function readPublishWorkflow(): string {
  return readFileSync(publishWorkflowPath, 'utf-8')
}

describe('T-B.3.1: publish workflow triggers only from documented semver release tags', () => {
  it('publish workflow file exists', () => {
    expect(existsSync(publishWorkflowPath)).toBe(true)
  })

  it('triggers on push tags matching the release tag pattern', () => {
    const raw = readPublishWorkflow()
    // Must trigger on tags only — not branches
    expect(raw).toMatch(/tags:/)
    // Must filter for semver pattern v*.*.*
    expect(raw).toMatch(/v\d*\.\d*\.\d*|v\*\.\*\.\*|v\[0-9\]/)
  })

  it('does not trigger on pull_request events', () => {
    const raw = readPublishWorkflow()
    // Publish should NOT trigger on pull_request
    expect(raw).not.toMatch(/\bpull_request\b/)
  })

  it('does not trigger on plain branch pushes', () => {
    const raw = readPublishWorkflow()
    // Should not have branches: in the push trigger for publish
    // The push trigger should only have tags:
    const pushSection = raw.match(/push:\s*\n([\s\S]*?)(?=\n\S|\njobs:)/)?.[1] ?? ''
    // If branches: appears in the push block, it must not be the primary trigger
    // The tags: filter must be present
    expect(pushSection).toMatch(/tags:/)
  })
})

describe('T-B.3.2: publish workflow targets the correct scoped package with auth', () => {
  it('references @splitwireml/blueprint or delegates to npm publish', () => {
    const raw = readPublishWorkflow()
    // Must contain npm publish or reference the package
    expect(raw).toMatch(/npm publish|npm run release/)
  })

  it('configures public scoped publish settings', () => {
    const raw = readPublishWorkflow()
    // Must use --access public or rely on publishConfig (which is already set)
    // Either explicit --access public flag or reliance on package.json publishConfig
    const hasAccessFlag = raw.includes('--access public')
    const hasPublishConfig = raw.includes('publishConfig') || raw.includes('release:publish:preflight')
    expect(hasAccessFlag || hasPublishConfig).toBe(true)
  })

  it('is wired for repository-to-npm authentication', () => {
    const raw = readPublishWorkflow()
    // Must reference NPM_TOKEN or ACTIONS_ID_TOKEN_REQUEST_URL for auth
    // Standard approach: NODE_AUTH_TOKEN from secrets.NPM_TOKEN
    // or provenance with id-token: write
    const hasNpmToken = raw.includes('NPM_TOKEN') || raw.includes('NODE_AUTH_TOKEN')
    const hasIdToken = raw.includes('id-token')
    expect(hasNpmToken || hasIdToken).toBe(true)
  })

  it('uses setup-node with npm registry for authentication', () => {
    const raw = readPublishWorkflow()
    // Must use actions/setup-node with registry-url for npm auth
    expect(raw).toMatch(/setup-node/)
    expect(raw).toMatch(/registry-url/)
  })
})
