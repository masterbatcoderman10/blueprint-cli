import { isImplementedCommand } from './implemented-commands'

export interface CommandHelpRequest {
  targetCommand: string
  isImplemented: boolean
}

export function parseCommandHelpInvocation(argv: string[]): CommandHelpRequest | null {
  if (argv.length === 2 && argv[0] === 'help') {
    const target = argv[1]
    return { targetCommand: target, isImplemented: isImplementedCommand(target) }
  }

  if (argv.length >= 2 && argv[argv.length - 1] === '--help') {
    const target = argv[0]
    return { targetCommand: target, isImplemented: isImplementedCommand(target) }
  }

  return null
}

export function renderCommandHelp(commandName: string): string {
  if (commandName === 'init') {
    return [
      'Usage: blueprint init',
      '',
      'Scaffold a new Blueprint project in the current directory.',
      '',
      'Creates the standard Blueprint folder structure including docs/,',
      'templates, and configuration files needed to get started.',
    ].join('\n')
  }

  if (commandName === 'doctor') {
    return [
      'Usage: blueprint doctor',
      '',
      'Audit and repair the current Blueprint project.',
      '',
      'Checks project structure integrity, validates templates,',
      'and offers to fix any issues found.',
    ].join('\n')
  }

  return ''
}

export function writeCommandHelp(commandName: string): void {
  process.stdout.write(`${renderCommandHelp(commandName)}\n`)
}
