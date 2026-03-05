import { describe, expect, it } from 'vitest'

import { placeholderCommands } from '../../src/commands'

describe('T-A.3: Placeholder command boundaries', () => {
  it('exports init, link, and context command boundaries', () => {
    expect(placeholderCommands.map((command) => command.name)).toEqual([
      'init',
      'link',
      'context',
    ])
  })

  it('uses no-op handlers with no feature side effects', async () => {
    for (const command of placeholderCommands) {
      const result = await command.handler({
        commandName: command.name,
        args: [],
        rawArgv: [command.name],
      })

      expect(result).toEqual({ exitCode: 0 })
    }
  })
})
