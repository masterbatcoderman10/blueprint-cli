import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const ROOT_DIR = resolve(process.cwd())
const README_PATH = resolve(ROOT_DIR, 'README.md')
const RELEASE_CONTRACT_PATH = resolve(ROOT_DIR, 'docs', 'release-contract.md')
const RELEASING_PATH = resolve(ROOT_DIR, 'docs', 'releasing.md')

const PRIMARY_SKILL_INSTALL_COMMAND = 'npx skills add masterbatcoderman10/blueprint-cli --skill blueprint'
const FALLBACK_INSTALLER_TOKEN = 'blueprint-skill-install'

const DOCS_WITH_SKILL_INSTALL = [
  { id: 'README.md', path: README_PATH },
  { id: 'docs/release-contract.md', path: RELEASE_CONTRACT_PATH },
  { id: 'docs/releasing.md', path: RELEASING_PATH },
] as const

function readDoc(path: string): string {
  return readFileSync(path, 'utf-8')
}

function expectPrimarySkillInstallContract(content: string): void {
  expect(content).toContain(PRIMARY_SKILL_INSTALL_COMMAND)
  expect(content.toLowerCase()).toContain('project-local')
}

function expectNoFallbackInstallerPromise(content: string): void {
  expect(content).not.toContain(FALLBACK_INSTALLER_TOKEN)
}

describe('T-R11-4.C.1: README install/get-started contract', () => {
  it('T-R11-4.C.1.1: separates CLI install/run guidance from skill install guidance', () => {
    const readme = readDoc(README_PATH)

    expect(readme).toContain('Blueprint CLI')
    expect(readme).toContain('Blueprint skill')
    expect(readme).toContain('blueprint init')
    expect(readme).toContain('blueprint doctor')
    expect(readme).toContain(PRIMARY_SKILL_INSTALL_COMMAND)
  })

  it('T-R11-4.C.1.2: recommends project-local skill install and calls out the Claude Code -g discovery sharp edge', () => {
    const readme = readDoc(README_PATH)

    expect(readme).toContain('project-local')
    expect(readme).toContain('-g')
    expect(readme).toContain('Claude Code')
    expect(readme).toContain('discovery')
  })

  it('T-R11-4.C.1.3: does not promise a bundled fallback installer workflow', () => {
    const readme = readDoc(README_PATH)

    expectNoFallbackInstallerPromise(readme)
  })
})

describe('T-R11-4.C.2: release contract docs', () => {
  it('T-R11-4.C.2.1: requires the repo-root skill payload and npm pack dry-run contract', () => {
    const releaseContract = readDoc(RELEASE_CONTRACT_PATH)

    expect(releaseContract).toContain('skills/blueprint/**')
    expect(releaseContract).toContain('npm pack --json --dry-run')
  })

  it('T-R11-4.C.2.2: records the primary install contract, project-local recommendation, -g caveat, and manual smoke boundary', () => {
    const releaseContract = readDoc(RELEASE_CONTRACT_PATH)

    expect(releaseContract).toContain(PRIMARY_SKILL_INSTALL_COMMAND)
    expect(releaseContract).toContain('project-local')
    expect(releaseContract).toContain('-g')
    expect(releaseContract).toContain('Claude Code')
    expect(releaseContract).toContain('manual smoke')
    expect(releaseContract).toContain('GitHub')
  })
})

describe('T-R11-4.C.3: maintainer release docs contract', () => {
  it('T-R11-4.C.3.1: says the repo-root skill payload must ship and no fallback installer is promised', () => {
    const releasing = readDoc(RELEASING_PATH)

    expect(releasing).toContain('skills/blueprint/**')
    expect(releasing).toContain(PRIMARY_SKILL_INSTALL_COMMAND)
    expect(releasing).toContain('project-local')
    expect(releasing).toContain('-g')
    expectNoFallbackInstallerPromise(releasing)
  })

  it('T-R11-4.C.3.2: keeps the primary install command and project-local recommendation consistent across all release docs', () => {
    for (const { path } of DOCS_WITH_SKILL_INSTALL) {
      expectPrimarySkillInstallContract(readDoc(path))
    }
  })
})
