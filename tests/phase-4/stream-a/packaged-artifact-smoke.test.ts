import { mkdir, readFile, writeFile } from 'node:fs/promises'
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
  }, 120000)
})

describe('T-A.4.2: packed artifact includes runtime assets and supports release-critical smoke paths', () => {
  it('ships dist/templates assets, scaffolds via installed init code, and validates the result with the public doctor executable', async () => {
    const fixture = await installPackedCliFixture()

    try {
      const installedPackageRoot = join(fixture.rootDir, 'node_modules', 'blueprint-agentic-development')
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
          'let selectCallCount = 0;',
          'exports.clackPromptApi = {',
          '  intro: () => undefined,',
          '  text: async () => "smoke-project",',
          '  select: async () => { selectCallCount++; return selectCallCount === 1 ? "legacy" : "skip"; },',
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

      // The alignment marker appended by D.3 causes doctor to detect drift on agent files.
      // Strip it before running doctor so the test validates core scaffold correctness.
      const alignmentMarker = '<!-- blueprint-status: alignment-required -->'
      for (const agentFile of ['CLAUDE.md', 'AGENTS.md', 'GEMINI.md', 'QWEN.md']) {
        const agentPath = join(smokeProjectDir, agentFile)
        if (await pathExists(agentPath)) {
          const content = await readFile(agentPath, 'utf-8')
          if (content.includes(alignmentMarker)) {
            await writeFile(agentPath, content.replace(`\n${alignmentMarker}\n`, '\n'), 'utf-8')
          }
        }
      }

      const doctorResult = await fixture.runBlueprint(['doctor'], { cwd: smokeProjectDir })

      expect(doctorResult.exitCode).toBe(0)
      expect(doctorResult.stdout).toContain('Project integrity is clean. No repairs needed.')
    } finally {
      await fixture.cleanup()
    }
  }, 120000)
})
