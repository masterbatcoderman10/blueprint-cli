import { describe, it, expect } from 'vitest'
import { invokeCli } from '../../helpers/cli'

describe('Stream C: Regression Coverage & Boundary Protection', () => {
  describe('T-C.1: CLI runtime and helper-driven tests for recovery output', () => {
    describe('T-C.1: Non-zero generic recovery output for unsupported input', () => {
      it('plain unknown command exits non-zero with recovery guidance', async () => {
        const result = await invokeCli(['ghost'])

        expect(result.exitCode).toBe(1)
        expect(result.stderr).toContain('Unknown command: ghost')
        expect(result.stderr).toContain('Usage: blueprint <command>')
        expect(result.stderr).toContain('init')
        expect(result.stderr).toContain('doctor')
      })

      it('unknown command with --help flag exits non-zero with same recovery', async () => {
        const result = await invokeCli(['ghost', '--help'])

        expect(result.exitCode).toBe(1)
        expect(result.stderr).toContain('Unknown command: ghost')
      })

      it('help <unknown> exits non-zero with recovery guidance', async () => {
        const result = await invokeCli(['help', 'ghost'])

        expect(result.exitCode).toBe(1)
        expect(result.stderr).toContain('Unknown command: ghost')
      })

      it('recovery output is consistent across all unsupported input patterns', async () => {
        const plainGhost = await invokeCli(['ghost'])
        const ghostHelp = await invokeCli(['ghost', '--help'])
        const helpGhost = await invokeCli(['help', 'ghost'])

        expect(plainGhost.stderr).toBe(ghostHelp.stderr)
        expect(plainGhost.stderr).toBe(helpGhost.stderr)
      })
    })
  })

  describe('T-C.2: Implemented command-help entrypoint alignment', () => {
    describe('T-C.2: help <command> and <command> --help stay aligned', () => {
      it('blueprint help init and blueprint init --help render matching content', async () => {
        const helpInit = await invokeCli(['help', 'init'])
        const initHelp = await invokeCli(['init', '--help'])

        expect(helpInit.exitCode).toBe(0)
        expect(initHelp.exitCode).toBe(0)
        expect(helpInit.stdout).toBe(initHelp.stdout)
      })

      it('blueprint help doctor and blueprint doctor --help render matching content', async () => {
        const helpDoctor = await invokeCli(['help', 'doctor'])
        const doctorHelp = await invokeCli(['doctor', '--help'])

        expect(helpDoctor.exitCode).toBe(0)
        expect(doctorHelp.exitCode).toBe(0)
        expect(helpDoctor.stdout).toBe(doctorHelp.stdout)
      })

      it('command-help entrypoints do not execute command side effects', async () => {
        const initHelp = await invokeCli(['init', '--help'])

        expect(initHelp.exitCode).toBe(0)
        expect(initHelp.stdout).toContain('init')
      })

      it('doctor --help does not run audit, repair, or prompts', async () => {
        const doctorHelp = await invokeCli(['doctor', '--help'])

        expect(doctorHelp.exitCode).toBe(0)
        expect(doctorHelp.stdout).toContain('doctor')
      })
    })
  })

  describe('T-C.3: Boundary assertions for placeholder commands and Phase 1 root-help', () => {
    describe('T-C.3.1: link and context remain absent from surfaced guidance', () => {
      it('unknown command recovery does not list link command', async () => {
        const result = await invokeCli(['ghost'])

        expect(result.stderr).not.toContain('link')
      })

      it('unknown command recovery does not list context command', async () => {
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

      it('init --help does not mention link or context', async () => {
        const result = await invokeCli(['init', '--help'])

        expect(result.stdout).not.toContain('link')
        expect(result.stdout).not.toContain('context')
      })

      it('doctor --help does not mention link or context', async () => {
        const result = await invokeCli(['doctor', '--help'])

        expect(result.stdout).not.toContain('link')
        expect(result.stdout).not.toContain('context')
      })
    })

    describe('T-C.3.2: Phase 1 root-help contract remains intact', () => {
      it('blueprint with no args renders Phase 1 root-help surface', async () => {
        const result = await invokeCli([])

        expect(result.exitCode).toBe(0)
        expect(result.stdout).toContain('Usage: blueprint <command>')
        expect(result.stdout).toContain('Commands:')
      })

      it('blueprint help renders Phase 1 root-help surface', async () => {
        const result = await invokeCli(['help'])

        expect(result.exitCode).toBe(0)
        expect(result.stdout).toContain('Usage: blueprint <command>')
        expect(result.stdout).toContain('Commands:')
      })

      it('blueprint --help renders Phase 1 root-help surface', async () => {
        const result = await invokeCli(['--help'])

        expect(result.exitCode).toBe(0)
        expect(result.stdout).toContain('Usage: blueprint <command>')
        expect(result.stdout).toContain('Commands:')
      })

      it('blueprint -h renders Phase 1 root-help surface', async () => {
        const result = await invokeCli(['-h'])

        expect(result.exitCode).toBe(0)
        expect(result.stdout).toContain('Usage: blueprint <command>')
        expect(result.stdout).toContain('Commands:')
      })

      it('root-help output remains consistent across all root help variants', async () => {
        const [empty, help, longHelp, shortHelp] = await Promise.all([
          invokeCli([]),
          invokeCli(['help']),
          invokeCli(['--help']),
          invokeCli(['-h']),
        ])

        expect(empty.stdout).toBe(help.stdout)
        expect(help.stdout).toBe(longHelp.stdout)
        expect(longHelp.stdout).toBe(shortHelp.stdout)
      })
    })
  })
})
