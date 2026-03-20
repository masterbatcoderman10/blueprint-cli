import { describe, expect, it } from 'vitest'

import { renderRootHelp } from '../../../src/help/root'
import { invokeCli } from '../../helpers/cli'

describe('Stream B: Minimal help copy & regression coverage', () => {
  describe('T-B.1: Minimal root help formatter', () => {
    it('renders concise usage guidance without advertising deferred capabilities', () => {
      const output = renderRootHelp()

      expect(output).toContain('Usage: blueprint <command>')
      expect(output).toContain('Commands:')
      expect(output.split('\n').length).toBeLessThan(10)
    })

    it('includes init and doctor but does not imply command-specific help flows yet', () => {
      const output = renderRootHelp()

      expect(output).toContain('init')
      expect(output).toContain('doctor')
      expect(output).not.toContain('--help')
      expect(output).not.toContain('help <command>')
    })
  })

  describe('T-B.2: CLI helper and smoke tests for root-help behavior', () => {
    it('captures stdout/stderr and stable exit semantics for empty argv', async () => {
      const result = await invokeCli([])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Usage: blueprint <command>')
      expect(result.stderr).toBe('')
    })

    it('captures stdout/stderr and stable exit semantics for root-help aliases', async () => {
      const results = await Promise.all([
        invokeCli(['help']),
        invokeCli(['--help']),
        invokeCli(['-h']),
      ])

      for (const result of results) {
        expect(result.exitCode).toBe(0)
        expect(result.stdout).toContain('Usage: blueprint <command>')
        expect(result.stderr).toBe('')
      }
    })

    it('produces stable output across repeated invocations', async () => {
      const [run1, run2, run3] = await Promise.all([
        invokeCli([]),
        invokeCli([]),
        invokeCli([]),
      ])

      expect(run1.stdout).toBe(run2.stdout)
      expect(run2.stdout).toBe(run3.stdout)
      expect(run1.exitCode).toBe(run2.exitCode)
      expect(run2.exitCode).toBe(run3.exitCode)
    })
  })

  describe('T-B.3: Regression assertions for omitted commands', () => {
    it('verifies root help omits link command from the meaningful command list', () => {
      const output = renderRootHelp()

      expect(output).not.toContain('link')
    })

    it('verifies root help omits context command from the meaningful command list', () => {
      const output = renderRootHelp()

      expect(output).not.toContain('context')
    })

    it('verifies root help does not overpromise Phase 2 command-specific help features', () => {
      const output = renderRootHelp()

      expect(output).not.toContain('help <command>')
      expect(output).not.toContain('<command> --help')
      expect(output).not.toContain('command-specific')
    })
  })
})
