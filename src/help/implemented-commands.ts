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
]

const implementedCommandNames = new Set(implementedCommands.map((c) => c.name))

export function isImplementedCommand(name: string): boolean {
  return implementedCommandNames.has(name)
}
