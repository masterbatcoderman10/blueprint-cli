const rootHelpAliases = new Set(['help', '--help', '-h'])

const rootHelpCommands = [
  {
    name: 'init',
    summary: 'Scaffold a Blueprint project.',
  },
  {
    name: 'doctor',
    summary: 'Audit and repair the current Blueprint project.',
  },
]

export function isSupportedRootHelpInvocation(argv: string[]): boolean {
  return argv.length === 0 || (argv.length === 1 && rootHelpAliases.has(argv[0]))
}

export function renderRootHelp(): string {
  const commandLines = rootHelpCommands.map(
    (command) => `  ${command.name.padEnd(8, ' ')}${command.summary}`,
  )

  return ['Usage: blueprint <command>', '', 'Commands:', ...commandLines].join('\n')
}

export function writeRootHelp(): void {
  process.stdout.write(`${renderRootHelp()}\n`)
}
