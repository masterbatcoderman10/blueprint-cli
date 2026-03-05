export interface CommandContext {
  commandName: string
  args: string[]
  rawArgv: string[]
}

export interface CommandHandlerResult {
  exitCode?: number
}

export type CommandHandler =
  | ((context: CommandContext) => CommandHandlerResult | void)
  | ((context: CommandContext) => Promise<CommandHandlerResult | void>)

export interface CommandDefinition {
  name: string
  handler: CommandHandler
}

export type DispatchReason = 'no-command' | 'unknown-command' | 'handled'

export interface CommandDispatchResult {
  matched: boolean
  commandName?: string
  exitCode: number
  reason: DispatchReason
}

export interface CommandRuntime {
  register(command: CommandDefinition): void
  dispatch(argv: string[]): Promise<CommandDispatchResult>
  listCommands(): string[]
}

export function createCommandRuntime(): CommandRuntime {
  const commands = new Map<string, CommandDefinition>()

  return {
    register(command) {
      if (commands.has(command.name)) {
        throw new Error(`Command already registered: ${command.name}`)
      }

      commands.set(command.name, command)
    },
    async dispatch(argv) {
      if (argv.length === 0) {
        return {
          matched: false,
          exitCode: 0,
          reason: 'no-command',
        }
      }

      const commandName = argv[0]
      const command = commands.get(commandName)

      if (!command) {
        return {
          matched: false,
          commandName,
          exitCode: 1,
          reason: 'unknown-command',
        }
      }

      const maybeResult = await command.handler({
        commandName,
        args: argv.slice(1),
        rawArgv: argv,
      })

      return {
        matched: true,
        commandName,
        exitCode: typeof maybeResult?.exitCode === 'number' ? maybeResult.exitCode : 0,
        reason: 'handled',
      }
    },
    listCommands() {
      return [...commands.keys()]
    },
  }
}
