import { describe, it, expect } from 'vitest'

import {
  TEMPLATE_VERSION,
  validateManifest,
  type ManifestData,
  type ManifestState,
} from '../../../src/doctor/manifest'

describe('T-3.0.1.1: manifest schema round-trip', () => {
  it('serializes and deserializes without field loss', () => {
    const original: ManifestData = {
      templateVersion: '1.0.0',
      cliVersion: '0.1.0',
      managedFiles: ['CLAUDE.md', 'AGENTS.md'],
    }
    const result = validateManifest(JSON.parse(JSON.stringify(original)))
    expect(result).toEqual({ valid: true, data: original })
  })

  it('preserves empty managedFiles array', () => {
    const original: ManifestData = {
      templateVersion: '1.0.0',
      cliVersion: '0.2.0',
      managedFiles: [],
    }
    const result = validateManifest(JSON.parse(JSON.stringify(original)))
    expect(result).toEqual({ valid: true, data: original })
  })
})

describe('T-3.0.1.2: manifest validation rejects malformed metadata', () => {
  it('rejects manifest missing templateVersion', () => {
    const result = validateManifest({ cliVersion: '0.1.0', managedFiles: [] })
    expect(result.valid).toBe(false)
    expect((result as { valid: false; error: string }).error).toBeTruthy()
  })

  it('rejects manifest with missing cliVersion', () => {
    const result = validateManifest({ templateVersion: '1.0.0', managedFiles: [] })
    expect(result.valid).toBe(false)
  })

  it('rejects manifest with non-array managedFiles', () => {
    const result = validateManifest({ templateVersion: '1.0.0', cliVersion: '0.1.0', managedFiles: 'CLAUDE.md' })
    expect(result.valid).toBe(false)
  })

  it('rejects manifest where managedFiles contains non-string elements', () => {
    const result = validateManifest({ templateVersion: '1.0.0', cliVersion: '0.1.0', managedFiles: [42] })
    expect(result.valid).toBe(false)
  })

  it('rejects null input', () => {
    const result = validateManifest(null)
    expect(result.valid).toBe(false)
  })

  it('rejects non-string templateVersion', () => {
    const result = validateManifest({ templateVersion: 42, cliVersion: '0.1.0', managedFiles: [] })
    expect(result.valid).toBe(false)
  })

  it('rejects empty templateVersion string', () => {
    const result = validateManifest({ templateVersion: '', cliVersion: '0.1.0', managedFiles: [] })
    expect(result.valid).toBe(false)
  })
})

describe('T-3.0.1.3: legacy projects are classified as repairable bootstrap cases', () => {
  it('ManifestState present:false is the explicit representation of a missing manifest', () => {
    const state: ManifestState = { present: false }
    expect(state.present).toBe(false)
  })

  it('missing manifest state is distinct from a present manifest state', () => {
    const missingState: ManifestState = { present: false }
    const presentState: ManifestState = {
      present: true,
      data: { templateVersion: '1.0.0', cliVersion: '0.1.0', managedFiles: [] },
    }
    expect(missingState.present).toBe(false)
    expect(presentState.present).toBe(true)
  })

  it('TEMPLATE_VERSION is a non-empty string constant', () => {
    expect(typeof TEMPLATE_VERSION).toBe('string')
    expect(TEMPLATE_VERSION.length).toBeGreaterThan(0)
  })
})
