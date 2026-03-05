import { CommandDefinition } from '../runtime'

export const linkCommand: CommandDefinition = {
  name: 'link',
  handler: async () => ({ exitCode: 0 }),
}
