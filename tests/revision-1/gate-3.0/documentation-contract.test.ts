import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const workspaceRoot = join(__dirname, '..', '..', '..')
const releaseContractPath = join(workspaceRoot, 'docs', 'release-contract.md')

describe('T-3.0.1.1 — CLI guidance contract boundary', () => {
  it('release-contract lists only init and doctor as implemented commands, not link or context', () => {
    const releaseContract = readFileSync(releaseContractPath, 'utf-8')

    const implementedCommandsSection = releaseContract.match(/Public M1 CLI scope is limited to the currently implemented commands: ([^\n]+)/)

    expect(implementedCommandsSection).not.toBeNull()
    const commandList = implementedCommandsSection![1]

    expect(commandList).toContain('init')
    expect(commandList).toContain('doctor')
    expect(commandList).not.toContain('link')
    expect(commandList).not.toContain('context')
  })

  it('documentation consistently treats init and doctor as the active guidance surface', () => {
    const releaseContract = readFileSync(releaseContractPath, 'utf-8')

    const releaseContractImplementsInit = releaseContract.includes('init')
    const releaseContractImplementsDoctor = releaseContract.includes('doctor')

    expect(releaseContractImplementsInit).toBe(true)
    expect(releaseContractImplementsDoctor).toBe(true)
  })
})
