import { describe, expect, it } from 'vitest'
import { invokeCli } from '../../helpers/cli'
import { renderUnknownCommandRecovery } from '../../../src/help/recovery'

describe('T-A.1: Shared Unknown-Command Recovery Formatter', () => {
  describe('T-A.1.1: Recovery formatter renders actionable generic output without fuzzy suggestions', () => {
    it('renders an error message for unknown command', () => {
      const output = renderUnknownCommandRecovery('ghost')
      expect(output).toContain('Unknown command: ghost')
    })

    it('renders root usage line', () => {
      const output = renderUnknownCommandRecovery('ghost')
      expect(output).toContain('Usage: blueprint <command>')
    })

    it('renders the currently available command list', () => {
      const output = renderUnknownCommandRecovery('ghost')
      expect(output).toContain('init')
      expect(output).toContain('doctor')
    })

    it('does not attempt fuzzy suggestions', () => {
      const output = renderUnknownCommandRecovery('ginit')
      expect(output).not.toContain('Did you mean')
      expect(output).not.toMatch(/did you mean/i)
    })

    it('does not include placeholder commands in the list', () => {
      const output = renderUnknownCommandRecovery('ghost')
      expect(output).not.toContain('link')
      expect(output).not.toContain('context')
    })
  })
})

describe('T-A.2: Plain Unknown Command and Help-Target Routing', () => {
  describe('T-A.2.1: Plain unknown command exits non-zero with generic recovery', () => {
    it('ghost command exits non-zero', async () => {
      const result = await invokeCli(['ghost'])
      expect(result.exitCode).toBe(1)
    })

    it('ghost command prints generic recovery guidance', async () => {
      const result = await invokeCli(['ghost'])
      expect(result.stderr).toContain('Unknown command: ghost')
      expect(result.stderr).toContain('Usage: blueprint <command>')
      expect(result.stderr).toContain('init')
      expect(result.stderr).toContain('doctor')
    })

    it('ghost command does not suggest closest match', async () => {
      const result = await invokeCli(['ghost'])
      expect(result.stderr).not.toMatch(/did you mean/i)
    })
  })

  describe('T-A.2.2: ghost --help exits non-zero and uses same recovery surface', () => {
    it('ghost --help exits non-zero', async () => {
      const result = await invokeCli(['ghost', '--help'])
      expect(result.exitCode).toBe(1)
    })

    it('ghost --help uses same recovery output as plain ghost', async () => {
      const ghostResult = await invokeCli(['ghost'])
      const ghostHelpResult = await invokeCli(['ghost', '--help'])

      expect(ghostHelpResult.exitCode).toBe(ghostResult.exitCode)
      expect(ghostHelpResult.stderr).toBe(ghostResult.stderr)
    })

    it('ghost --help recovery lists only init and doctor', async () => {
      const result = await invokeCli(['ghost', '--help'])
      expect(result.stderr).toContain('init')
      expect(result.stderr).toContain('doctor')
      expect(result.stderr).not.toContain('link')
      expect(result.stderr).not.toContain('context')
    })
  })
})

describe('T-A.3: Placeholder Commands Use Generic Recovery', () => {
  describe('T-A.3.1: Placeholder commands do not receive bespoke help pages', () => {
    it('link --help uses generic recovery, not bespoke help', async () => {
      const result = await invokeCli(['link', '--help'])
      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('Unknown command: link')
      expect(result.stderr).toContain('Usage: blueprint <command>')
    })

    it('context --help uses generic recovery, not bespoke help', async () => {
      const result = await invokeCli(['context', '--help'])
      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('Unknown command: context')
      expect(result.stderr).toContain('Usage: blueprint <command>')
    })

    it('link command itself is not intercepted by root help routing', async () => {
      const result = await invokeCli(['link'])
      expect(result.exitCode).toBe(0)
    })

    it('context command itself is not intercepted by root help routing', async () => {
      const result = await invokeCli(['context'])
      expect(result.exitCode).toBe(0)
    })

    it('recovery output for placeholder commands does not list them as available commands', async () => {
      const linkResult = await invokeCli(['link', '--help'])
      const contextResult = await invokeCli(['context', '--help'])

      const commandListSection = 'Commands:'

      for (const result of [linkResult, contextResult]) {
        const stderr = result.stderr
        const commandsIndex = stderr.indexOf(commandListSection)
        expect(commandsIndex).toBeGreaterThan(-1)
        const afterCommands = stderr.slice(commandsIndex)
        expect(afterCommands).not.toContain('link')
        expect(afterCommands).not.toContain('context')
        expect(afterCommands).toContain('init')
        expect(afterCommands).toContain('doctor')
      }
    })
  })
})
