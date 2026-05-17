import { existsSync } from 'node:fs'
import { dirname, join, parse, resolve } from 'node:path'

export const projectRootErrorMessage = 'not in a Blueprint project — run `blueprint init` here first'

export function findProjectRoot(cwd: string = process.cwd()): string {
  let current = resolve(cwd)
  const root = parse(current).root

  while (true) {
    if (existsSync(join(current, 'docs', '.blueprint'))) {
      return current
    }

    if (current === root) {
      throw new Error(projectRootErrorMessage)
    }

    current = dirname(current)
  }
}
