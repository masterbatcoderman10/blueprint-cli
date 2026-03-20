import { describe, expect, it } from 'vitest'

import { isSupportedRootHelpInvocation } from '../../../src/help/root'
import { runCli } from '../../../src/index'
import { createCommandRuntime } from '../../../src/runtime'
import { invokeCli } from '../../helpers/cli'

describe('Gate 1.0: Root help contract', () => {
  describe('T-1.0.1: Supported root-help invocation contract', () => {
    it('recognizes blueprint, blueprint help, blueprint --help, and blueprint -h as supported root-help invocations', async () => {
      const runtime = createCommandRuntime({
        isRootHelpInvocation: isSupportedRootHelpInvocation,
        rootHelpHandler: async () => ({ exitCode: 0 }),
      })

      for (const argv of [[], ['help'], ['--help'], ['-h']]) {
        await expect(runtime.dispatch(argv)).resolves.toMatchObject({
          matched: true,
          exitCode: 0,
          reason: 'root-help',
        })
      }
    })

    it('keeps success exit behavior aligned across supported root-help invocations', async () => {
      for (const argv of [[], ['help'], ['--help'], ['-h']]) {
        await expect(runCli(argv)).resolves.toBe(0)
      }
    })
  })

  describe('T-1.0.2: Minimal root help content contract', () => {
    it('renders a usage line plus concise summaries for init and doctor', async () => {
      const result = await invokeCli([])

      expect(result.stdout).toContain('Usage: blueprint <command>')
      expect(result.stdout).toContain('init')
      expect(result.stdout).toContain('doctor')
    })

    it('omits placeholder-only commands from the surfaced command list', async () => {
      const result = await invokeCli([])

      expect(result.stdout).not.toContain('link')
      expect(result.stdout).not.toContain('context')
    })
  })

  describe('T-1.0.3: Shared root-help render/dispatch boundary', () => {
    it('routes all supported root-help aliases through one aligned output path', async () => {
      const [emptyArgv, help, longFlag, shortFlag] = await Promise.all([
        invokeCli([]),
        invokeCli(['help']),
        invokeCli(['--help']),
        invokeCli(['-h']),
      ])

      expect(help.stdout).toBe(emptyArgv.stdout)
      expect(longFlag.stdout).toBe(emptyArgv.stdout)
      expect(shortFlag.stdout).toBe(emptyArgv.stdout)
      expect(help.stderr).toBe(emptyArgv.stderr)
      expect(longFlag.stderr).toBe(emptyArgv.stderr)
      expect(shortFlag.stderr).toBe(emptyArgv.stderr)
    })
  })
})
