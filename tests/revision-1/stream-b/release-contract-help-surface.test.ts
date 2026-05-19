import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const workspaceRoot = join(__dirname, '..', '..', '..')
const releaseContractPath = join(workspaceRoot, 'docs', 'release-contract.md')
const releasingPath = join(workspaceRoot, 'docs', 'releasing.md')

describe('T-B.1.1 — Release contract defines help surface correctly', () => {
  it('release-contract.md contains Help and Recovery Surface section', () => {
    const releaseContract = readFileSync(releaseContractPath, 'utf-8')

    const helpSurfaceSection = releaseContract.match(/## Help and Recovery Surface/)
    expect(helpSurfaceSection).not.toBeNull()
  })

  it('release-contract.md documents root help entry points', () => {
    const releaseContract = readFileSync(releaseContractPath, 'utf-8')

    expect(releaseContract).toContain('blueprint')
    expect(releaseContract).toContain('blueprint --help')
    expect(releaseContract).toContain('blueprint -h')
  })

  it('release-contract.md documents command help entry points for init and doctor', () => {
    const releaseContract = readFileSync(releaseContractPath, 'utf-8')

    expect(releaseContract).toContain('blueprint help <command>')
    expect(releaseContract).toContain('init')
    expect(releaseContract).toContain('doctor')
  })

  it('release-contract.md documents unknown command recovery behavior', () => {
    const releaseContract = readFileSync(releaseContractPath, 'utf-8')

    expect(releaseContract).toMatch(/unknown.*command.*recovery/i)
    expect(releaseContract).toMatch(/guidance.*init.*doctor/i)
  })

  it('release-contract.md explicitly excludes link and context from guided output', () => {
    const releaseContract = readFileSync(releaseContractPath, 'utf-8')

    const exclusionPattern = /excludes.*link.*context.*from.*guided/i
    expect(releaseContract).toMatch(exclusionPattern)
  })

  it('release-contract.md preserves coming-soon references for placeholder commands', () => {
    const releaseContract = readFileSync(releaseContractPath, 'utf-8')

    const comingSoonPattern = /coming.*soon/i
    expect(releaseContract).toMatch(comingSoonPattern)
  })
})

describe('T-B.2.1 — Releasing.md reflects revised help behavior', () => {
  it('releasing.md contains CLI Help and Recovery Behavior section', () => {
    const releasing = readFileSync(releasingPath, 'utf-8')

    const helpBehaviorSection = releasing.match(/## CLI Help and Recovery Behavior/)
    expect(helpBehaviorSection).not.toBeNull()
  })

  it('releasing.md documents root help behavior', () => {
    const releasing = readFileSync(releasingPath, 'utf-8')

    expect(releasing).toMatch(/root.*help/i)
    expect(releasing).toContain('blueprint')
    expect(releasing).toContain('blueprint --help')
    expect(releasing).toContain('blueprint -h')
  })

  it('releasing.md documents command help behavior for init and doctor', () => {
    const releasing = readFileSync(releasingPath, 'utf-8')

    expect(releasing).toMatch(/command.*help/i)
    expect(releasing).toContain('init')
    expect(releasing).toContain('doctor')
  })

  it('releasing.md documents unknown command recovery', () => {
    const releasing = readFileSync(releasingPath, 'utf-8')

    expect(releasing).toMatch(/unknown.*command/i)
    expect(releasing).toMatch(/recovery/i)
    expect(releasing).toMatch(/guidance/i)
  })

  it('releasing.md states link and context are excluded from guided output', () => {
    const releasing = readFileSync(releasingPath, 'utf-8')

    expect(releasing).toMatch(/excludes.*link.*context/i)
    expect(releasing).toMatch(/guided.*output/i)
  })

  it('releasing.md states link and context remain documented as coming soon', () => {
    const releasing = readFileSync(releasingPath, 'utf-8')

    expect(releasing).toMatch(/coming.*soon/i)
    expect(releasing).toMatch(/documented/i)
  })
})

describe('T-B.3.1 — Release docs help surface consistency', () => {
  it('release-contract and releasing both document help surface consistently', () => {
    const releaseContract = readFileSync(releaseContractPath, 'utf-8')
    const releasing = readFileSync(releasingPath, 'utf-8')

    const releaseContractHelpSection = releaseContract.match(/## Help and Recovery Surface/)
    const releasingHelpSection = releasing.match(/## CLI Help and Recovery Behavior/)

    expect(releaseContractHelpSection).not.toBeNull()
    expect(releasingHelpSection).not.toBeNull()

    const bothDocs = [releaseContract, releasing]
    for (const doc of bothDocs) {
      expect(doc).toMatch(/root.*help/i)
      expect(doc).toMatch(/command.*help/i)
      expect(doc).toMatch(/unknown.*command/i)
      expect(doc).toMatch(/link.*context/i)
    }
  })
})
