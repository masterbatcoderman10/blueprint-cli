#!/usr/bin/env node

import { placeholderCommands } from './commands'
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

  const result = await runtime.dispatch(argv)
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
