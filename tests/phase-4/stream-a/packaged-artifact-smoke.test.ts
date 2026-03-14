import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { installPackedCliFixture, pathExists } from '../../helpers/release'

describe('T-A.4.1: packed artifact install exposes the public blueprint executable', () => {
  it('installs the tarball with a runnable blueprint bin entry', async () => {
    const fixture = await installPackedCliFixture()

    try {
      expect(await pathExists(fixture.binPath)).toBe(true)

      const result = await fixture.runBlueprint([])

      expect(result.exitCode).toBe(0)
    } finally {
      await fixture.cleanup()
    }
  }, 15000)
})

describe('T-A.4.2: packed artifact includes runtime assets and supports release-critical smoke paths', () => {
  it('ships dist/templates assets, scaffolds via installed init code, and validates the result with the public doctor executable', async () => {
    const fixture = await installPackedCliFixture()

    try {
      const installedPackageRoot = join(fixture.rootDir, 'node_modules', '@splitwireml', 'blueprint')
      const smokeProjectDir = join(fixture.rootDir, 'smoke-project')

      expect(await pathExists(join(installedPackageRoot, 'dist', 'index.js'))).toBe(true)
      expect(await pathExists(join(installedPackageRoot, 'templates', 'docs', 'core', 'execution.md'))).toBe(true)

      await mkdir(smokeProjectDir, { recursive: true })
      await mkdir(join(smokeProjectDir, '.git'), { recursive: true })
      await writeFile(
        join(installedPackageRoot, 'dist', 'init', 'prompts.js'),
        [
          '"use strict";',
          'Object.defineProperty(exports, "__esModule", { value: true });',
          'exports.clackPromptApi = {',
          '  intro: () => undefined,',
          '  text: async () => "smoke-project",',
          '  select: async () => "skip",',
          '  multiselect: async () => ["CLAUDE.md"],',
          '  confirm: async () => true,',
          '  note: () => undefined,',
          '  outro: () => undefined,',
          '};',
          '',
        ].join('\n'),
        'utf-8',
      )

      const initResult = await fixture.runBlueprint(['init'], { cwd: smokeProjectDir })

      expect(initResult.exitCode).toBe(0)
      expect(await pathExists(join(smokeProjectDir, 'docs', 'core', 'execution.md'))).toBe(true)
      expect(await pathExists(join(smokeProjectDir, 'docs', '.blueprint', 'manifest.json'))).toBe(true)
      expect(await pathExists(join(smokeProjectDir, 'CLAUDE.md'))).toBe(true)

      const doctorResult = await fixture.runBlueprint(['doctor'], { cwd: smokeProjectDir })

      expect(doctorResult.exitCode).toBe(0)
      expect(doctorResult.stdout).toContain('Project integrity is clean. No repairs needed.')
    } finally {
      await fixture.cleanup()
    }
  }, 15000)
})
