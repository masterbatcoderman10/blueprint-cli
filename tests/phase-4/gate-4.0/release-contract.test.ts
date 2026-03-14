import { describe, expect, it } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

import {
  RELEASE_PACKAGE_NAME,
  RELEASE_BIN_NAME,
  SUPPORTED_NODE_RANGE,
  isReleaseTag,
} from '../../../src/release/contract'

const root = resolve(process.cwd())
const releaseContractDocPath = resolve(root, 'docs/release-contract.md')
const packageJsonPath = resolve(root, 'package.json')

function readPackageJson(): Record<string, unknown> {
  return JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as Record<string, unknown>
}

describe('T-4.0.1.1: release-tag parsing', () => {
  it('accepts valid semver release tags in the documented format', () => {
    expect(isReleaseTag('v0.1.0')).toBe(true)
    expect(isReleaseTag('v12.34.56')).toBe(true)
  })

  it('rejects malformed or ineligible tags', () => {
    expect(isReleaseTag('0.1.0')).toBe(false)
    expect(isReleaseTag('release/v0.1.0')).toBe(false)
    expect(isReleaseTag('v0.1')).toBe(false)
    expect(isReleaseTag('v0.1.0-beta.1')).toBe(false)
    expect(isReleaseTag('main')).toBe(false)
  })
})

describe('T-4.0.1.2: release contract and package metadata stay aligned', () => {
  it('keeps package identity, executable name, and supported Node policy consistent', () => {
    const packageJson = readPackageJson()
    const releaseContractDoc = readFileSync(releaseContractDocPath, 'utf-8')

    expect(packageJson.name).toBe(RELEASE_PACKAGE_NAME)
    expect(packageJson.bin).toEqual({ [RELEASE_BIN_NAME]: './dist/index.js' })
    expect(packageJson.engines).toEqual({ node: SUPPORTED_NODE_RANGE })

    expect(releaseContractDoc).toContain(RELEASE_PACKAGE_NAME)
    expect(releaseContractDoc).toContain(`\`${RELEASE_BIN_NAME}\``)
    expect(releaseContractDoc).toContain(SUPPORTED_NODE_RANGE)
  })
})
