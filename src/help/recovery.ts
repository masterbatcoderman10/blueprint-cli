import { renderRootHelp } from './root'

export function renderUnknownCommandRecovery(commandName: string): string {
  return [`Unknown command: ${commandName}`, '', renderRootHelp()].join('\n')
}

export function writeUnknownCommandRecovery(commandName: string): void {
  process.stderr.write(`${renderUnknownCommandRecovery(commandName)}\n`)
}
