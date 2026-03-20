#!/usr/bin/env node

import { placeholderCommands } from './commands'
import { parseCommandHelpInvocation, writeCommandHelp } from './help/command'
import { writeUnknownCommandRecovery } from './help/recovery'
import { isSupportedRootHelpInvocation, writeRootHelp } from './help/root'
import { createCommandRuntime } from './runtime'

declare const require:
  | {
      main?: unknown
    }
  | undefined
declare const module: unknown | undefined

function readProcessArgv(): string[] {
  const processRef = (globalThis as { process?: { argv?: string[] } }).process
  return Array.isArray(processRef?.argv) ? processRef.argv.slice(2) : []
}

function isDirectExecution(): boolean {
  if (typeof require === 'undefined' || typeof module === 'undefined') {
    return false
  }

  return require.main === module
}

export async function runCli(argv: string[]): Promise<number> {
  if (!Array.isArray(argv)) {
    return 1
  }

  const runtime = createCommandRuntime({
    isRootHelpInvocation: isSupportedRootHelpInvocation,
    rootHelpHandler: () => {
      writeRootHelp()
      return { exitCode: 0 }
    },
  })
  for (const command of placeholderCommands) {
    runtime.register(command)
  }

  const commandHelpRequest = parseCommandHelpInvocation(argv)
  if (commandHelpRequest) {
    if (commandHelpRequest.isImplemented) {
      writeCommandHelp(commandHelpRequest.targetCommand)
      return 0
    }
    writeUnknownCommandRecovery(commandHelpRequest.targetCommand)
    return 1
  }

  const result = await runtime.dispatch(argv)

  if (result.reason === 'unknown-command' && result.commandName) {
    writeUnknownCommandRecovery(result.commandName)
  }

  return result.exitCode
}

export async function main(argv: string[] = readProcessArgv()): Promise<number> {
  const exitCode = await runCli(argv)
  const processRef = (globalThis as { process?: { exitCode?: number } }).process

  if (processRef) {
    processRef.exitCode = exitCode
  }

  return exitCode
}

if (isDirectExecution()) {
  void main()
}
