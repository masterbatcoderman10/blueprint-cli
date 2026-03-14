import { mkdir } from 'node:fs/promises'
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
  })
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

      const initResult = await fixture.runInstalledNodeScript(
        `
          const { clackPromptApi } = require('@splitwireml/blueprint/dist/init/prompts.js')
          const { runCli } = require('@splitwireml/blueprint/dist/index.js')

          clackPromptApi.intro = () => {}
          clackPromptApi.note = () => {}
          clackPromptApi.outro = () => {}
          clackPromptApi.text = async () => 'smoke-project'
          clackPromptApi.multiselect = async () => ['CLAUDE.md']

          let confirmCount = 0
          clackPromptApi.confirm = async () => {
            confirmCount += 1
            return confirmCount === 1 ? false : true
          }

          runCli(['init'])
            .then((exitCode) => {
              process.exitCode = exitCode
            })
            .catch((error) => {
              console.error(error)
              process.exitCode = 1
            })
        `,
        { cwd: smokeProjectDir },
      )

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
  })
})
