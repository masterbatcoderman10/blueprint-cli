import { describe, expect, it } from 'vitest'

import { createCommandRuntime } from '../../../src/runtime'
import { isSupportedRootHelpInvocation } from '../../../src/help/root'

describe('Stream A: Root Dispatch Wiring', () => {
  describe('T-A.1: Empty argv resolves to root help', () => {
    it('dispatch([]) returns exit code 0 and root-help reason', async () => {
      const runtime = createCommandRuntime({
        isRootHelpInvocation: isSupportedRootHelpInvocation,
        rootHelpHandler: () => ({ exitCode: 0 }),
      })

      const result = await runtime.dispatch([])

      expect(result.exitCode).toBe(0)
      expect(result.reason).toBe('root-help')
    })
  })

  describe('T-A.2: Explicit root-help aliases route through shared root help path', () => {
    it('T-A.2.1: help, --help, and -h each route through root help path', async () => {
      const runtime = createCommandRuntime({
        isRootHelpInvocation: isSupportedRootHelpInvocation,
        rootHelpHandler: () => ({ exitCode: 0 }),
      })

      for (const argv of [['help'], ['--help'], ['-h']]) {
        const result = await runtime.dispatch(argv)
        expect(result.exitCode).toBe(0)
        expect(result.reason).toBe('root-help')
      }
    })

    it('T-A.2.2: root help invocations produce aligned dispatch results', async () => {
      const runtime = createCommandRuntime({
        isRootHelpInvocation: isSupportedRootHelpInvocation,
        rootHelpHandler: () => ({ exitCode: 0 }),
      })

      const results = await Promise.all([
        runtime.dispatch([]),
        runtime.dispatch(['help']),
        runtime.dispatch(['--help']),
        runtime.dispatch(['-h']),
      ])

      for (const result of results) {
        expect(result.exitCode).toBe(0)
        expect(result.reason).toBe('root-help')
      }
    })
  })

  describe('T-A.3: Normal dispatch preserved for concrete implemented commands', () => {
    it('T-A.3.1: init command name is not intercepted by root help routing', async () => {
      const runtime = createCommandRuntime({
        isRootHelpInvocation: isSupportedRootHelpInvocation,
        rootHelpHandler: () => ({ exitCode: 0 }),
      })

      const result = runtime.dispatch(['init'])

      await expect(result).resolves.toMatchObject({
        matched: false,
        reason: 'unknown-command',
      })
    })

    it('T-A.3.2: doctor command name is not intercepted by root help routing', async () => {
      const runtime = createCommandRuntime({
        isRootHelpInvocation: isSupportedRootHelpInvocation,
        rootHelpHandler: () => ({ exitCode: 0 }),
      })

      const result = runtime.dispatch(['doctor'])

      await expect(result).resolves.toMatchObject({
        matched: false,
        reason: 'unknown-command',
      })
    })

    it('T-A.3.3: init dispatch reaches handler when registered', async () => {
      const runtime = createCommandRuntime({
        isRootHelpInvocation: isSupportedRootHelpInvocation,
        rootHelpHandler: () => ({ exitCode: 0 }),
      })
      runtime.register({
        name: 'init',
        handler: async () => ({ exitCode: 0 }),
      })

      const result = await runtime.dispatch(['init'])

      expect(result.matched).toBe(true)
      expect(result.commandName).toBe('init')
      expect(result.reason).toBe('handled')
    })

    it('T-A.3.4: doctor dispatch reaches handler when registered', async () => {
      const runtime = createCommandRuntime({
        isRootHelpInvocation: isSupportedRootHelpInvocation,
        rootHelpHandler: () => ({ exitCode: 0 }),
      })
      runtime.register({
        name: 'doctor',
        handler: async () => ({ exitCode: 0 }),
      })

      const result = await runtime.dispatch(['doctor'])

      expect(result.matched).toBe(true)
      expect(result.commandName).toBe('doctor')
      expect(result.reason).toBe('handled')
    })
  })
})
