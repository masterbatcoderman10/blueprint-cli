import { describe, expect, it } from 'vitest'

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
  }, 30_000)
})
