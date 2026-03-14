import { describe, expect, it } from 'vitest'

import { contextCommand, initCommand, linkCommand, placeholderCommands } from '../../src/commands'

describe('T-A.3: Placeholder command boundaries', () => {
  it('exports init, link, context, and doctor command boundaries', () => {
    expect(placeholderCommands.map((command) => command.name)).toEqual([
      'init',
      'link',
      'context',
      'doctor',
    ])
  })

  it('keeps link/context handlers as no-op boundaries', async () => {
    for (const command of [linkCommand, contextCommand]) {
      const result = await command.handler({
        commandName: command.name,
        args: [],
        rawArgv: [command.name],
      })

      expect(result).toEqual({ exitCode: 0 })
    }
  })

  it('keeps init boundary available for onboarding wiring', () => {
    expect(initCommand.name).toBe('init')
    expect(typeof initCommand.handler).toBe('function')
  })
})
