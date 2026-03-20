import { implementedCommands } from './implemented-commands'

const rootHelpAliases = new Set(['help', '--help', '-h'])

export function isSupportedRootHelpInvocation(argv: string[]): boolean {
  return argv.length === 0 || (argv.length === 1 && rootHelpAliases.has(argv[0]))
}

export function renderRootHelp(): string {
  const commandLines = implementedCommands.map(
    (command) => `  ${command.name.padEnd(8, ' ')}${command.summary}`,
  )

  return ['Usage: blueprint <command>', '', 'Commands:', ...commandLines].join('\n')
}

export function writeRootHelp(): void {
  process.stdout.write(`${renderRootHelp()}\n`)
}
