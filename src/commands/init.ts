import { CommandDefinition } from '../runtime'

export const initCommand: CommandDefinition = {
  name: 'init',
  handler: async () => ({ exitCode: 0 }),
}
