import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const workspaceRoot = join(__dirname, '..', '..', '..')
const releaseContractPath = join(workspaceRoot, 'docs', 'release-contract.md')
const readmePath = join(workspaceRoot, 'README.md')

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

  it('README marks link and context as coming-soon, not as implemented commands', () => {
    const readme = readFileSync(readmePath, 'utf-8')

    const linkSection = readme.match(/### `blueprint link`[^]*?`/)
    const contextSection = readme.match(/### `blueprint context`[^]*?`/)

    expect(linkSection).not.toBeNull()
    expect(contextSection).not.toBeNull()

    expect(linkSection![0]).toMatch(/\(coming soon\)/)
    expect(contextSection![0]).toMatch(/\(coming soon\)/)
  })

  it('README describes init and doctor without coming-soon qualifiers', () => {
    const readme = readFileSync(readmePath, 'utf-8')

    const initSection = readme.match(/### `blueprint init`[\s\S]*?(?=###|\n##|$)/)
    const doctorSection = readme.match(/### `blueprint doctor`[\s\S]*?(?=###|\n##|$)/)

    expect(initSection).not.toBeNull()
    expect(doctorSection).not.toBeNull()

    expect(initSection![0]).not.toMatch(/\(coming soon\)/)
    expect(doctorSection![0]).not.toMatch(/\(coming soon\)/)
  })

  it('documentation consistently treats init and doctor as the active guidance surface', () => {
    const releaseContract = readFileSync(releaseContractPath, 'utf-8')
    const readme = readFileSync(readmePath, 'utf-8')

    const releaseContractImplementsInit = releaseContract.includes('init')
    const releaseContractImplementsDoctor = releaseContract.includes('doctor')
    const readmeImplementsInit = readme.includes('blueprint init')
    const readmeImplementsDoctor = readme.includes('blueprint doctor')

    expect(releaseContractImplementsInit).toBe(true)
    expect(releaseContractImplementsDoctor).toBe(true)
    expect(readmeImplementsInit).toBe(true)
    expect(readmeImplementsDoctor).toBe(true)
  })
})
