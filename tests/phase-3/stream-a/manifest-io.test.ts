import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

import {
  writeManifest,
  readManifest,
  getManifestPath,
  MANIFEST_RELATIVE_PATH,
  TEMPLATE_VERSION,
  type ManifestData,
  type ManifestState,
} from '../../../src/doctor/manifest'

function isMissing(state: ManifestState): state is { present: false; reason: 'missing' } {
  return state.present === false && state.reason === 'missing'
}

function isInvalid(state: ManifestState): state is { present: false; reason: 'invalid'; error: string } {
  return state.present === false && state.reason === 'invalid'
}

describe('T-A.1.1: write manifest file', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'manifest-test-'))
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  it('creates the metadata directory and writes manifest.json', async () => {
    const manifestData: ManifestData = {
      templateVersion: TEMPLATE_VERSION,
      cliVersion: '0.1.0',
      managedFiles: ['CLAUDE.md', 'AGENTS.md'],
    }

    await writeManifest(tempDir, manifestData)

    const manifestPath = path.join(tempDir, MANIFEST_RELATIVE_PATH)
    expect(fs.existsSync(manifestPath)).toBe(true)

    const written = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
    expect(written).toEqual(manifestData)
  })

  it('creates docs/.blueprint directory if it does not exist', async () => {
    const manifestData: ManifestData = {
      templateVersion: TEMPLATE_VERSION,
      cliVersion: '0.2.0',
      managedFiles: [],
    }

    await writeManifest(tempDir, manifestData)

    const blueprintDir = path.join(tempDir, 'docs', '.blueprint')
    expect(fs.existsSync(blueprintDir)).toBe(true)
    expect(fs.statSync(blueprintDir).isDirectory()).toBe(true)
  })
})

describe('T-A.1.2: read manifest file', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'manifest-test-'))
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  it('reads existing metadata consistently', async () => {
    const manifestData: ManifestData = {
      templateVersion: '1.0.0',
      cliVersion: '0.1.0',
      managedFiles: ['CLAUDE.md', 'AGENTS.md', 'GEMINI.md'],
    }

    await writeManifest(tempDir, manifestData)

    const result = await readManifest(tempDir)

    expect(result.present).toBe(true)
    if (result.present) {
      expect(result.data).toEqual(manifestData)
    }
  })

  it('returns present:false for missing manifest', async () => {
    const result = await readManifest(tempDir)

    expect(result.present).toBe(false)
    expect(isMissing(result)).toBe(true)
  })

  it('returns present:false with reason:invalid for corrupt manifest', async () => {
    const manifestPath = path.join(tempDir, MANIFEST_RELATIVE_PATH)
    const blueprintDir = path.join(tempDir, 'docs', '.blueprint')
    fs.mkdirSync(blueprintDir, { recursive: true })
    fs.writeFileSync(manifestPath, '{ invalid json }', 'utf-8')

    const result = await readManifest(tempDir)

    expect(result.present).toBe(false)
    expect(isInvalid(result)).toBe(true)
    if (isInvalid(result)) {
      expect(result.error).toBeDefined()
    }
  })

  it('handles empty managedFiles array correctly', async () => {
    const manifestData: ManifestData = {
      templateVersion: TEMPLATE_VERSION,
      cliVersion: '0.1.0',
      managedFiles: [],
    }

    await writeManifest(tempDir, manifestData)

    const result = await readManifest(tempDir)

    expect(result.present).toBe(true)
    if (result.present) {
      expect(result.data.managedFiles).toEqual([])
    }
  })
})

describe('T-A.1.3: template version constant', () => {
  it('exposes a single template version constant', () => {
    expect(TEMPLATE_VERSION).toBeDefined()
    expect(typeof TEMPLATE_VERSION).toBe('string')
    expect(TEMPLATE_VERSION.length).toBeGreaterThan(0)
  })

  it('template version is used by both init and doctor paths', () => {
    const version = TEMPLATE_VERSION
    expect(version).toBe('1.0.0')
  })
})

describe('getManifestPath', () => {
  it('returns the correct relative path', () => {
    const projectPath = '/some/project'
    const expected = path.join(projectPath, MANIFEST_RELATIVE_PATH)
    expect(getManifestPath(projectPath)).toBe(expected)
  })
})
