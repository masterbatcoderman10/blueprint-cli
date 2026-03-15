import { describe, expect, it } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { checkVersionExists } from '../../../src/release/publish-safeguards'

const root = resolve(process.cwd())
const publishWorkflowPath = resolve(root, '.github/workflows/publish.yml')
const ciWorkflowPath = resolve(root, '.github/workflows/ci.yml')

function readPublishWorkflow(): string {
  return readFileSync(publishWorkflowPath, 'utf-8')
}

function readCiWorkflow(): string {
  return readFileSync(ciWorkflowPath, 'utf-8')
}

describe('T-B.4.1: duplicate publish or existing-version attempts fail safely', () => {
  it('checkVersionExists returns already-published for a known public package version', async () => {
    // Use a well-known package that definitely exists on npm
    const result = await checkVersionExists('typescript', '5.0.2')
    expect(result.exists).toBe(true)
  })

  it('checkVersionExists returns not-found for a version that does not exist', async () => {
    // Use a version that definitely does not exist
    const result = await checkVersionExists('typescript', '999.999.999')
    expect(result.exists).toBe(false)
  })

  it('publish workflow includes a duplicate-version check step', () => {
    const raw = readPublishWorkflow()
    // Must reference the duplicate/version check before npm publish
    expect(raw).toMatch(/duplicate|version.check|version-check|publish-safeguards|already.published/)
  })

  it('duplicate-version check runs before the npm publish step', () => {
    const raw = readPublishWorkflow()
    const lines = raw.split('\n')
    const checkIdx = lines.findIndex((l) =>
      /duplicate|version.check|version-check|publish-safeguards/.test(l)
    )
    const publishIdx = lines.findIndex((l) => l.includes('npm publish'))
    expect(checkIdx).toBeGreaterThan(-1)
    expect(publishIdx).toBeGreaterThan(checkIdx)
  })
})

describe('T-B.4.2: post-pack or post-publish verification failures stop the release', () => {
  it('publish workflow runs packaged-smoke verification via release:check:publish', () => {
    const raw = readPublishWorkflow()
    // The shared release check includes packaged-smoke
    expect(raw).toMatch(/release:check:publish|release:check/)
  })

  it('publish workflow does not continue-on-error for any verification step', () => {
    const raw = readPublishWorkflow()
    expect(raw).not.toMatch(/continue-on-error:\s*true/)
  })

  it('CI workflow does not continue-on-error for any verification step', () => {
    const raw = readCiWorkflow()
    expect(raw).not.toMatch(/continue-on-error:\s*true/)
  })

  it('publish preflight step is present and precedes npm publish', () => {
    const raw = readPublishWorkflow()
    const lines = raw.split('\n')
    const preflightIdx = lines.findIndex((l) => l.includes('release:publish:preflight'))
    const publishIdx = lines.findIndex((l) => l.includes('npm publish'))
    expect(preflightIdx).toBeGreaterThan(-1)
    expect(publishIdx).toBeGreaterThan(preflightIdx)
  })
})
