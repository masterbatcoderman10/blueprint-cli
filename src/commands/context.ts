import { CommandDefinition } from '../runtime'

export const contextCommand: CommandDefinition = {
  name: 'context',
  handler: async () => ({ exitCode: 0 }),
}
