import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const workspaceRoot = join(__dirname, '..', '..', '..')
const releaseContractPath = join(workspaceRoot, 'docs', 'release-contract.md')
const readmePath = join(workspaceRoot, 'README.md')
const releasingPath = join(workspaceRoot, 'docs', 'releasing.md')

describe('T-3.0.2.1 — Release-facing docs aligned on CLI contract', () => {
  it('release-contract and README consistently identify implemented vs coming-soon commands', () => {
    const releaseContract = readFileSync(releaseContractPath, 'utf-8')
    const readme = readFileSync(readmePath, 'utf-8')

    const releaseContractMatch = releaseContract.match(/Public M1 CLI scope is limited to the currently implemented commands: ([^\n]+)/)
    expect(releaseContractMatch).not.toBeNull()

    const implementedCommands = releaseContractMatch![1]
    expect(implementedCommands).toContain('init')
    expect(implementedCommands).toContain('doctor')
    expect(implementedCommands).not.toContain('link')
    expect(implementedCommands).not.toContain('context')

    const readmeLinkComingSoon = readme.match(/### `blueprint link`[^]*?\(coming soon\)/)
    const readmeContextComingSoon = readme.match(/### `blueprint context`[^]*?\(coming soon\)/)

    expect(readmeLinkComingSoon).not.toBeNull()
    expect(readmeContextComingSoon).not.toBeNull()
  })

  it('releasing.md does not misidentify link or context as currently implemented', () => {
    const releasing = readFileSync(releasingPath, 'utf-8')

    const misidentificationPattern = /Public.*CLI.*scope.*link.*context.*implemented/
    expect(releasing).not.toMatch(misidentificationPattern)
  })

  it('README marks link and context as coming-soon in command section', () => {
    const readme = readFileSync(readmePath, 'utf-8')

    const readmeLinkSection = readme.match(/### `blueprint link`[\s\S]*?(?=###|\n##|$)/)
    const readmeContextSection = readme.match(/### `blueprint context`[\s\S]*?(?=###|\n##|$)/)

    expect(readmeLinkSection).not.toBeNull()
    expect(readmeContextSection).not.toBeNull()
    expect(readmeLinkSection![0]).toMatch(/\(coming soon\)/)
    expect(readmeContextSection![0]).toMatch(/\(coming soon\)/)
  })

  it('README lists init and doctor as operational commands without coming-soon qualifiers', () => {
    const readme = readFileSync(readmePath, 'utf-8')

    const initSection = readme.match(/### `blueprint init`[\s\S]*?(?=###|\n##|$)/)
    const doctorSection = readme.match(/### `blueprint doctor`[\s\S]*?(?=###|\n##|$)/)

    expect(initSection).not.toBeNull()
    expect(doctorSection).not.toBeNull()
    expect(initSection![0]).not.toMatch(/\(coming soon\)/)
    expect(doctorSection![0]).not.toMatch(/\(coming soon\)/)
  })
})
