export interface ImplementedCommand {
  name: string
  summary: string
}

export const implementedCommands: ImplementedCommand[] = [
  {
    name: 'init',
    summary: 'Scaffold a Blueprint project.',
  },
  {
    name: 'doctor',
    summary: 'Audit and repair the current Blueprint project.',
  },
  {
    name: 'alignment-complete',
    summary: 'Validate marked supported root agent files; no partial marker flips.',
  },
  {
    name: 'migrate',
    summary: 'Migrate a Blueprint project to skill mode; force fresh Alignment and never preserve alignment-complete.',
  },
]

const implementedCommandNames = new Set(implementedCommands.map((c) => c.name))

export function isImplementedCommand(name: string): boolean {
  return implementedCommandNames.has(name)
}
