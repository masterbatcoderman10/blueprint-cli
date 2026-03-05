import { describe, expect, it } from 'vitest'

import { createCommandRuntime } from '../../src/runtime'
import { invokeCli } from '../helpers/cli'

describe('T-B.3: Runtime registration/dispatch contract — baseline protection', () => {
  describe('nominal dispatch paths', () => {
    it('dispatches a registered sync handler and returns exitCode 0', async () => {
      const runtime = createCommandRuntime()
      runtime.register({ name: 'ping', handler: () => ({ exitCode: 0 }) })

      const result = await runtime.dispatch(['ping'])
      expect(result).toMatchObject({ matched: true, commandName: 'ping', exitCode: 0, reason: 'handled' })
    })

    it('dispatches a registered async handler and returns its exitCode', async () => {
      const runtime = createCommandRuntime()
      runtime.register({
        name: 'async-cmd',
        handler: async () => ({ exitCode: 42 }),
      })

      const result = await runtime.dispatch(['async-cmd'])
      expect(result.exitCode).toBe(42)
      expect(result.matched).toBe(true)
    })

    it('passes args (minus command name) to the handler context', async () => {
      const runtime = createCommandRuntime()
      const captured: string[][] = []

      runtime.register({
        name: 'capture',
        handler: (ctx) => { captured.push(ctx.args) },
      })

      await runtime.dispatch(['capture', '--verbose', 'file.txt'])
      expect(captured).toEqual([['--verbose', 'file.txt']])
    })

    it('passes rawArgv unchanged to the handler context', async () => {
      const runtime = createCommandRuntime()
      let rawArgv: string[] = []

      runtime.register({
        name: 'raw',
        handler: (ctx) => { rawArgv = ctx.rawArgv },
      })

      await runtime.dispatch(['raw', '--a', '--b'])
      expect(rawArgv).toEqual(['raw', '--a', '--b'])
    })

    it('defaults exitCode to 0 when handler returns void', async () => {
      const runtime = createCommandRuntime()
      runtime.register({ name: 'noop', handler: () => {} })

      const result = await runtime.dispatch(['noop'])
      expect(result.exitCode).toBe(0)
    })

    it('listCommands returns all registered command names', () => {
      const runtime = createCommandRuntime()
      runtime.register({ name: 'alpha', handler: () => {} })
      runtime.register({ name: 'beta', handler: () => {} })

      expect(runtime.listCommands()).toEqual(expect.arrayContaining(['alpha', 'beta']))
      expect(runtime.listCommands()).toHaveLength(2)
    })
  })

  describe('error-path dispatch scenarios', () => {
    it('returns reason "no-command" and exitCode 0 for empty argv', async () => {
      const runtime = createCommandRuntime()
      const result = await runtime.dispatch([])
      expect(result).toEqual({ matched: false, exitCode: 0, reason: 'no-command' })
    })

    it('returns reason "unknown-command" and exitCode 1 for unregistered command', async () => {
      const runtime = createCommandRuntime()
      const result = await runtime.dispatch(['ghost'])
      expect(result).toMatchObject({
        matched: false,
        commandName: 'ghost',
        exitCode: 1,
        reason: 'unknown-command',
      })
    })

    it('throws when registering the same command name twice', () => {
      const runtime = createCommandRuntime()
      runtime.register({ name: 'dup', handler: () => {} })
      expect(() => runtime.register({ name: 'dup', handler: () => {} })).toThrow()
    })

    it('returns non-zero exitCode from the CLI via invokeCli for unknown command', async () => {
      const result = await invokeCli(['__contract_unknown__'])
      expect(result.exitCode).not.toBe(0)
    })

    it('runtime with no commands returns unknown-command for any input', async () => {
      const runtime = createCommandRuntime()
      const result = await runtime.dispatch(['anything'])
      expect(result.reason).toBe('unknown-command')
      expect(result.matched).toBe(false)
    })
  })

  describe('isolation — each runtime instance is independent', () => {
    it('two runtime instances do not share registrations', () => {
      const r1 = createCommandRuntime()
      const r2 = createCommandRuntime()
      r1.register({ name: 'only-in-r1', handler: () => {} })

      expect(r1.listCommands()).toContain('only-in-r1')
      expect(r2.listCommands()).not.toContain('only-in-r1')
    })
  })
})
