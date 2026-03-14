import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, expect, it } from 'vitest'

import { placeholderCommands } from '../../../src/commands'

const root = resolve(process.cwd())
const readmePath = resolve(root, 'README.md')

function readReadme(): string {
  return readFileSync(readmePath, 'utf-8')
}

describe('T-C.2.1: README covers the implemented public release surface', () => {
  it('includes install guidance, current command usage, Mermaid diagrams, and M1 boundaries', () => {
    const readme = readReadme()

    expect(readme).toContain('# Blueprint CLI')
    expect(readme).toContain('npm install -g @splitwireml/blueprint')
    expect(readme).toContain('```mermaid')
    expect(readme).toContain('blueprint init')
    expect(readme).toContain('blueprint doctor')
    expect(readme).toContain('Blueprint scaffolding')
    expect(readme).toContain('Phase 1')
    expect(readme).toContain('does not yet implement')
  })
})

describe('T-C.2.2: README examples stay aligned with the real CLI surface', () => {
  it('documents the correct package name, executable, and current command set', () => {
    const readme = readReadme()

    expect(readme).toContain('@splitwireml/blueprint')
    expect(readme).not.toContain('npm install -g blueprint-cli')
    expect(readme).not.toContain('npx blueprint-cli')

    for (const command of placeholderCommands) {
      expect(readme).toContain(`blueprint ${command.name}`)
    }

    expect(readme).toContain('placeholder command boundary')
    expect(readme).not.toContain('blueprint share')
    expect(readme).not.toContain('blueprint review')
  })
})
