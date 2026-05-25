import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { createIsolatedTempProject, installPackedCliFixture, pathExists } from '../../helpers/release'

describe('T-A.1.1: release-style temp project fixtures', () => {
  it('creates isolated disposable projects without cross-test state leakage', async () => {
    const first = await createIsolatedTempProject('blueprint-phase4-a-')
    const second = await createIsolatedTempProject('blueprint-phase4-a-')

    try {
      await first.writeFile('README.md', '# first project\n')

      expect(await first.readFile('README.md')).toBe('# first project\n')
      await expect(second.readFile('README.md')).rejects.toThrow()
      expect(first.rootDir).not.toBe(second.rootDir)
    } finally {
      await first.cleanup()
      await second.cleanup()
    }

    expect(await pathExists(first.rootDir)).toBe(false)
    expect(await pathExists(second.rootDir)).toBe(false)
  })
})

describe('T-A.1.2: packed tarball fixture setup', () => {
  it('installs the packed CLI into an isolated project and invokes the public blueprint executable', async () => {
    const fixture = await installPackedCliFixture()

    try {
      expect(await pathExists(fixture.binPath)).toBe(true)

      const result = await fixture.runBlueprint(['__release_smoke_unknown__'])

      expect(result.exitCode).toBe(1)
      expect(result.stdout).toBeTypeOf('string')
      expect(result.stderr).toBeTypeOf('string')
    } finally {
      await fixture.cleanup()
    }

    expect(await pathExists(fixture.rootDir)).toBe(false)
  }, 120_000)
})

describe('packaged release workspace lock coverage', () => {
  it('routes workspace build and pack test callers through the shared release lock', async () => {
    const callerPaths = [
      'tests/setup/npm-scripts.test.ts',
      'tests/phase-4/stream-c/package-metadata.test.ts',
    ]

    for (const callerPath of callerPaths) {
      const source = await readFile(resolve(process.cwd(), callerPath), 'utf-8')

      expect(source).not.toMatch(/execSync\('npm run build'/)
      expect(source).not.toMatch(/execSync\('npm pack --json --dry-run'/)
      expect(source).toContain('runWorkspaceReleaseCommand')
    }
  })
})
