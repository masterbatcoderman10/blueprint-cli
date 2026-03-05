import { describe, expect, it } from 'vitest'

import { createCommandRuntime } from '../../src/runtime'

describe('T-A.2: Runtime command registration and dispatch contract', () => {
  it('dispatches a registered handler with parsed args', async () => {
    const runtime = createCommandRuntime()
    const observed: string[][] = []

    runtime.register({
      name: 'demo',
      handler: async (context) => {
        observed.push(context.args)
        return { exitCode: 0 }
      },
    })

    const result = await runtime.dispatch(['demo', '--flag'])

    expect(result).toMatchObject({
      matched: true,
      commandName: 'demo',
      exitCode: 0,
      reason: 'handled',
    })
    expect(observed).toEqual([['--flag']])
  })

  it('returns a controlled outcome for unknown commands', async () => {
    const runtime = createCommandRuntime()
    const result = await runtime.dispatch(['missing'])

    expect(result).toEqual({
      matched: false,
      commandName: 'missing',
      exitCode: 1,
      reason: 'unknown-command',
    })
  })
})
