import { writeFile, mkdtemp, rm, mkdir, rmdir } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { describe, it, expect, afterEach } from 'vitest'

import {
  compareFileContent,
  compareTemplateVersion,
  type ContentFindingState,
  type VersionCheckResult,
} from '../../../src/doctor/comparator'
import { TEMPLATE_VERSION } from '../../../src/doctor/manifest'

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

describe('T-3.0.4.1: content comparison returns distinct finding states', () => {
  it('returns clean when project file exactly matches template content', async () => {
    const dir = await makeTempDir()
    const content = '# Health Check\n\nThis is the canonical content.\n'
    await writeFile(join(dir, 'health-check.md'), content, 'utf-8')

    const result = await compareFileContent(join(dir, 'health-check.md'), content)
    expect(result.state).toBe('clean')
  })

  it('returns missing when the project file does not exist', async () => {
    const dir = await makeTempDir()
    const result = await compareFileContent(join(dir, 'nonexistent.md'), '# Template content\n')
    expect(result.state).toBe('missing')
  })

  it('returns drifted when project file content differs from template', async () => {
    const dir = await makeTempDir()
    const templateContent = '# Health Check\n\nOriginal content.\n'
    const projectContent = '# Health Check\n\nModified content.\n'
    await writeFile(join(dir, 'health-check.md'), projectContent, 'utf-8')

    const result = await compareFileContent(join(dir, 'health-check.md'), templateContent)
    expect(result.state).toBe('drifted')
  })

  it('drifted result includes both expected and actual content', async () => {
    const dir = await makeTempDir()
    const templateContent = '# Original\n'
    const projectContent = '# Modified\n'
    await writeFile(join(dir, 'file.md'), projectContent, 'utf-8')

    const result = await compareFileContent(join(dir, 'file.md'), templateContent)
    expect(result.state).toBe('drifted')
    if (result.state === 'drifted') {
      expect(result.expected).toBe(templateContent)
      expect(result.actual).toBe(projectContent)
    }
  })

  it('treats whitespace differences as drift (exact match required)', async () => {
    const dir = await makeTempDir()
    const templateContent = '# Heading\n\nContent\n'
    const projectContent = '# Heading\n\nContent\n\n'
    await writeFile(join(dir, 'file.md'), projectContent, 'utf-8')

    const result = await compareFileContent(join(dir, 'file.md'), templateContent)
    expect(result.state).toBe('drifted')
  })

  it('throws for non-ENOENT read failures (e.g. path is a directory)', async () => {
    const dir = await makeTempDir()
    // Create a directory at the target path — readFile will fail with EISDIR, not ENOENT
    await mkdir(join(dir, 'health-check.md'))

    await expect(compareFileContent(join(dir, 'health-check.md'), '# Template\n')).rejects.toThrow()
  })
})

describe('T-3.0.4.2: version comparison detects mismatches', () => {
  it('returns matches:true when versions are identical', () => {
    const result = compareTemplateVersion('1.0.0', '1.0.0')
    expect(result.matches).toBe(true)
  })

  it('returns matches:false when project version differs from bundled version', () => {
    const result = compareTemplateVersion('0.9.0', '1.0.0')
    expect(result.matches).toBe(false)
  })

  it('mismatch result includes both versions and a recommendation string', () => {
    const result = compareTemplateVersion('0.9.0', '1.0.0')
    expect(result.matches).toBe(false)
    if (!result.matches) {
      expect(result.projectVersion).toBe('0.9.0')
      expect(result.bundledVersion).toBe('1.0.0')
      expect(typeof result.recommendation).toBe('string')
      expect(result.recommendation.length).toBeGreaterThan(0)
    }
  })

  it('recommendation does not imply remote fetch or update behavior', () => {
    const result = compareTemplateVersion('0.9.0', '1.0.0')
    if (!result.matches) {
      const rec = result.recommendation.toLowerCase()
      expect(rec).not.toContain('download')
      expect(rec).not.toContain('fetch')
      expect(rec).not.toContain('update')
    }
  })

  it('uses TEMPLATE_VERSION as the authoritative bundled version constant', () => {
    const result = compareTemplateVersion(TEMPLATE_VERSION, TEMPLATE_VERSION)
    expect(result.matches).toBe(true)
  })
})
