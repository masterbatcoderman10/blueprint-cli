import { readFile, access, mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { describe, it, expect, afterEach } from 'vitest'

import {
  resolveTemplatePath,
  resolveAllCoreTemplatePaths,
  resolveAgentTemplatePaths,
  loadManifestState,
} from '../../../src/doctor/inventory'
import { CANONICAL_CORE_FILES } from '../../../src/doctor/structure'

const tmpDirs: string[] = []

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'bp-test-'))
  tmpDirs.push(dir)
  return dir
}

afterEach(async () => {
  for (const dir of tmpDirs.splice(0)) {
    await rm(dir, { recursive: true, force: true })
  }
})

describe('T-3.0.3.1: template resolver locates bundled docs/core/** templates', () => {
  it('resolves template paths for every canonical core file', () => {
    const entries = resolveAllCoreTemplatePaths()
    expect(entries).toHaveLength(CANONICAL_CORE_FILES.length)
    for (const { relativePath, absolutePath } of entries) {
      expect(absolutePath).toContain('templates')
      expect(absolutePath).toContain('docs/core')
      expect(absolutePath.endsWith('.md')).toBe(true)
      expect(relativePath).toMatch(/^docs\/core\//)
    }
  })

  it('all resolved core template paths point to readable files', async () => {
    const entries = resolveAllCoreTemplatePaths()
    for (const { absolutePath, relativePath } of entries) {
      const content = await readFile(absolutePath, 'utf-8')
      expect(content.length, `${relativePath} template should be non-empty`).toBeGreaterThan(0)
    }
  })

  it('resolveTemplatePath builds path for a specific core file', () => {
    const path = resolveTemplatePath('docs/core/execution.md')
    expect(path).toContain('templates')
    expect(path).toContain('execution.md')
  })
})

describe('T-3.0.3.2: template resolver locates bundled root agent templates', () => {
  it('resolves template paths for all supported managed agent files', () => {
    const entries = resolveAgentTemplatePaths()
    expect(entries.length).toBeGreaterThan(0)
    for (const { fileName, absolutePath } of entries) {
      expect(absolutePath).toContain('templates')
      expect(absolutePath).toContain(fileName)
    }
  })

  it('all resolved agent template paths point to readable files', async () => {
    const entries = resolveAgentTemplatePaths()
    for (const { fileName, absolutePath } of entries) {
      const content = await readFile(absolutePath, 'utf-8')
      expect(content.length, `${fileName} template should be non-empty`).toBeGreaterThan(0)
    }
  })

  it('resolveTemplatePath builds correct path for CLAUDE.md agent file', () => {
    const path = resolveTemplatePath('CLAUDE.md')
    expect(path).toContain('templates')
    expect(path).toContain('CLAUDE.md')
  })
})

describe('loadManifestState: reads manifest from project directory', () => {
  it('returns present:false for a project with no manifest file', async () => {
    const dir = await makeTempDir()
    const state = await loadManifestState(dir)
    expect(state.present).toBe(false)
  })

  it('returns present:true with data for a valid manifest', async () => {
    const dir = await makeTempDir()
    const manifestDir = join(dir, 'docs', '.blueprint')
    await mkdir(manifestDir, { recursive: true })
    const manifestData = { templateVersion: '1.0.0', cliVersion: '0.1.0', managedFiles: ['CLAUDE.md'] }
    await writeFile(join(manifestDir, 'manifest.json'), JSON.stringify(manifestData), 'utf-8')

    const state = await loadManifestState(dir)
    expect(state.present).toBe(true)
    if (state.present) {
      expect(state.data.templateVersion).toBe('1.0.0')
      expect(state.data.cliVersion).toBe('0.1.0')
      expect(state.data.managedFiles).toEqual(['CLAUDE.md'])
    }
  })

  it('throws for non-ENOENT read failures (e.g. manifest path is a directory)', async () => {
    const dir = await makeTempDir()
    const manifestDir = join(dir, 'docs', '.blueprint')
    await mkdir(manifestDir, { recursive: true })
    // Create a directory at the manifest path — readFile will fail with EISDIR, not ENOENT
    await mkdir(join(manifestDir, 'manifest.json'), { recursive: true })

    await expect(loadManifestState(dir)).rejects.toThrow()
  })
})
