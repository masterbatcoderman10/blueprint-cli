import { describe, it, expect } from 'vitest'
import { invokeCli } from '../../helpers/cli'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { installPackedCliFixture, pathExists } from '../../helpers/release'

const workspaceRoot = join(__dirname, '..', '..', '..')

describe('Stream C: Regression Coverage & Packaged Help Smoke', () => {
  describe('T-C.1.1: Documentation-alignment regression protection', () => {
    it('README distinguishes implemented commands (init, doctor) from coming-soon placeholders (link, context)', () => {
      const readme = readFileSync(join(workspaceRoot, 'README.md'), 'utf-8')

      const initSection = readme.match(/### `blueprint init`[\s\S]*?(?=###|\n##|$)/)
      const doctorSection = readme.match(/### `blueprint doctor`[\s\S]*?(?=###|\n##|$)/)
      const linkSection = readme.match(/### `blueprint link`[\s\S]*?(?=###|\n##|$)/)
      const contextSection = readme.match(/### `blueprint context`[\s\S]*?(?=###|\n##|$)/)

      expect(initSection).not.toBeNull()
      expect(doctorSection).not.toBeNull()
      expect(linkSection).not.toBeNull()
      expect(contextSection).not.toBeNull()

      expect(initSection![0]).not.toMatch(/\(coming soon\)/)
      expect(doctorSection![0]).not.toMatch(/\(coming soon\)/)
      expect(linkSection![0]).toMatch(/\(coming soon\)/)
      expect(contextSection![0]).toMatch(/\(coming soon\)/)
    })

    it('release-contract.md correctly marks public CLI boundary', () => {
      const releaseContract = readFileSync(join(workspaceRoot, 'docs', 'release-contract.md'), 'utf-8')

      expect(releaseContract).toMatch(/Public M1 CLI scope.*init.*doctor/s)
      expect(releaseContract).toMatch(/link.*context.*coming soon/s)
      expect(releaseContract).toMatch(/Help and Recovery Surface/)
    })

    it('docs/releasing.md reflects revised help behavior without implying placeholders are implemented', () => {
      const releasing = readFileSync(join(workspaceRoot, 'docs', 'releasing.md'), 'utf-8')

      expect(releasing).toMatch(/CLI Help and Recovery Behavior/)
      expect(releasing).toMatch(/implemented commands.*init.*doctor/s)
      expect(releasing).toMatch(/link.*context.*coming soon/s)
      expect(releasing).toMatch(/do not appear in runtime help/)
    })
  })

  describe('T-C.2.1: Source-checkout CLI examples match documented behavior', () => {
    it('blueprint (no args) renders help surface matching README examples', async () => {
      const readme = readFileSync(join(workspaceRoot, 'README.md'), 'utf-8')
      const result = await invokeCli([])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Usage: blueprint <command>')
      expect(result.stdout).toContain('Commands:')
      expect(result.stdout).toContain('init')
      expect(result.stdout).toContain('doctor')
      expect(readme).toMatch(/blueprint\s*(\n|$)/)
    })

    it('blueprint --help renders same output as README describes', async () => {
      const result = await invokeCli(['--help'])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Usage: blueprint <command>')
      expect(result.stdout).toContain('init')
      expect(result.stdout).toContain('doctor')
    })

    it('blueprint help init matches README help example', async () => {
      const readme = readFileSync(join(workspaceRoot, 'README.md'), 'utf-8')
      const result = await invokeCli(['help', 'init'])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('init')
      expect(readme).toMatch(/blueprint\s+help\s+init/)
    })

    it('blueprint help doctor matches README help example', async () => {
      const readme = readFileSync(join(workspaceRoot, 'README.md'), 'utf-8')
      const result = await invokeCli(['help', 'doctor'])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('doctor')
      expect(readme).toMatch(/blueprint\s+help\s+doctor/)
    })

    it('unknown command recovery matches README documented behavior', async () => {
      const readme = readFileSync(join(workspaceRoot, 'README.md'), 'utf-8')
      const result = await invokeCli(['ghost'])

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('Unknown command: ghost')
      expect(result.stderr).toContain('Usage: blueprint <command>')
      expect(result.stderr).toContain('init')
      expect(result.stderr).toContain('doctor')
      expect(readme).toMatch(/Unknown command:/)
    })
  })

  describe('T-C.2.2: Source-checkout regression fails if placeholders appear in guided output', () => {
    it('unknown command recovery does not surface link command', async () => {
      const result = await invokeCli(['ghost'])

      expect(result.stderr).not.toContain('link')
    })

    it('unknown command recovery does not surface context command', async () => {
      const result = await invokeCli(['ghost'])

      expect(result.stderr).not.toContain('context')
    })

    it('help init does not mention link or context', async () => {
      const result = await invokeCli(['help', 'init'])

      expect(result.stdout).not.toContain('link')
      expect(result.stdout).not.toContain('context')
    })

    it('help doctor does not mention link or context', async () => {
      const result = await invokeCli(['help', 'doctor'])

      expect(result.stdout).not.toContain('link')
      expect(result.stdout).not.toContain('context')
    })

    it('root help does not list link or context as available commands', async () => {
      const result = await invokeCli([])

      const lines = result.stdout.split('\n')
      const commandsSection = lines.slice(lines.findIndex(l => l.includes('Commands:')) + 1)
      const availableCommands = commandsSection.join(' ')

      expect(availableCommands).not.toContain('link')
      expect(availableCommands).not.toContain('context')
    })
  })

  describe('T-C.3.1: Packaged artifact root help smoke', () => {
    it('installed blueprint renders root help for blueprint (no args)', async () => {
      const fixture = await installPackedCliFixture()

      try {
        const result = await fixture.runBlueprint([])

        expect(result.exitCode).toBe(0)
        expect(result.stdout).toContain('Usage: blueprint <command>')
        expect(result.stdout).toContain('Commands:')
        expect(result.stdout).toContain('init')
        expect(result.stdout).toContain('doctor')
      } finally {
        await fixture.cleanup()
      }
    }, 20000)

    it('installed blueprint renders root help for blueprint --help', async () => {
      const fixture = await installPackedCliFixture()

      try {
        const result = await fixture.runBlueprint(['--help'])

        expect(result.exitCode).toBe(0)
        expect(result.stdout).toContain('Usage: blueprint <command>')
        expect(result.stdout).toContain('Commands:')
        expect(result.stdout).toContain('init')
        expect(result.stdout).toContain('doctor')
      } finally {
        await fixture.cleanup()
      }
    }, 20000)

    it('installed blueprint renders root help for blueprint -h', async () => {
      const fixture = await installPackedCliFixture()

      try {
        const result = await fixture.runBlueprint(['-h'])

        expect(result.exitCode).toBe(0)
        expect(result.stdout).toContain('Usage: blueprint <command>')
        expect(result.stdout).toContain('Commands:')
        expect(result.stdout).toContain('init')
        expect(result.stdout).toContain('doctor')
      } finally {
        await fixture.cleanup()
      }
    }, 20000)

    it('installed blueprint root help is consistent across all entrypoints', async () => {
      const fixture = await installPackedCliFixture()

      try {
        const [noArgs, helpFlag, hFlag] = await Promise.all([
          fixture.runBlueprint([]),
          fixture.runBlueprint(['--help']),
          fixture.runBlueprint(['-h']),
        ])

        expect(noArgs.stdout).toBe(helpFlag.stdout)
        expect(helpFlag.stdout).toBe(hFlag.stdout)
      } finally {
        await fixture.cleanup()
      }
    }, 20000)
  })

  describe('T-C.3.2: Packaged artifact command help and recovery smoke', () => {
    it('installed blueprint renders help for init command', async () => {
      const fixture = await installPackedCliFixture()

      try {
        const result = await fixture.runBlueprint(['help', 'init'])

        expect(result.exitCode).toBe(0)
        expect(result.stdout).toContain('init')
      } finally {
        await fixture.cleanup()
      }
    }, 20000)

    it('installed blueprint renders help for doctor command', async () => {
      const fixture = await installPackedCliFixture()

      try {
        const result = await fixture.runBlueprint(['help', 'doctor'])

        expect(result.exitCode).toBe(0)
        expect(result.stdout).toContain('doctor')
      } finally {
        await fixture.cleanup()
      }
    }, 20000)

    it('installed blueprint init --help renders same as help init', async () => {
      const fixture = await installPackedCliFixture()

      try {
        const [helpInit, initHelp] = await Promise.all([
          fixture.runBlueprint(['help', 'init']),
          fixture.runBlueprint(['init', '--help']),
        ])

        expect(helpInit.stdout).toBe(initHelp.stdout)
      } finally {
        await fixture.cleanup()
      }
    }, 20000)

    it('installed blueprint doctor --help renders same as help doctor', async () => {
      const fixture = await installPackedCliFixture()

      try {
        const [helpDoctor, doctorHelp] = await Promise.all([
          fixture.runBlueprint(['help', 'doctor']),
          fixture.runBlueprint(['doctor', '--help']),
        ])

        expect(helpDoctor.stdout).toBe(doctorHelp.stdout)
      } finally {
        await fixture.cleanup()
      }
    }, 20000)

    it('installed blueprint unknown command recovery matches source-checkout behavior', async () => {
      const fixture = await installPackedCliFixture()

      try {
        const result = await fixture.runBlueprint(['ghost'])

        expect(result.exitCode).toBe(1)
        expect(result.stderr).toContain('Unknown command: ghost')
        expect(result.stderr).toContain('Usage: blueprint <command>')
        expect(result.stderr).toContain('init')
        expect(result.stderr).toContain('doctor')
        expect(result.stderr).not.toContain('link')
        expect(result.stderr).not.toContain('context')
      } finally {
        await fixture.cleanup()
      }
    }, 20000)

    it('installed blueprint does not surface link or context in recovery output', async () => {
      const fixture = await installPackedCliFixture()

      try {
        const result = await fixture.runBlueprint(['unknowncmd'])

        expect(result.stderr).not.toContain('link')
        expect(result.stderr).not.toContain('context')
      } finally {
        await fixture.cleanup()
      }
    }, 20000)
  })
})