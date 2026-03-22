import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const workspaceRoot = join(__dirname, '..', '..', '..')
const readmePath = join(workspaceRoot, 'README.md')

describe('T-A.1.1: README quick-start and command sections reflect current discoverability surface', () => {
  it('README describes root help invocation using blueprint with no arguments', () => {
    const readme = readFileSync(readmePath, 'utf-8')
    expect(readme).toMatch(/```bash[\s\S]*?\nblueprint(\s+.*)?\n[\s\S]*?```/)
  })

  it('README describes root help via --help flag', () => {
    const readme = readFileSync(readmePath, 'utf-8')
    expect(readme).toMatch(/blueprint\s+--help/)
  })

  it('README describes root help via -h flag', () => {
    const readme = readFileSync(readmePath, 'utf-8')
    expect(readme).toMatch(/blueprint\s+-h/)
  })

  it('README describes command-level help for init via blueprint help init', () => {
    const readme = readFileSync(readmePath, 'utf-8')
    expect(readme).toMatch(/blueprint\s+help\s+init/)
  })

  it('README describes command-level help for doctor via blueprint help doctor', () => {
    const readme = readFileSync(readmePath, 'utf-8')
    expect(readme).toMatch(/blueprint\s+help\s+doctor/)
  })

  it('README describes init and doctor as the currently available commands', () => {
    const readme = readFileSync(readmePath, 'utf-8')
    const initSection = readme.match(/### `blueprint init`[\s\S]*?(?=###|\n##|$)/)
    const doctorSection = readme.match(/### `blueprint doctor`[\s\S]*?(?=###|\n##|$)/)
    expect(initSection).not.toBeNull()
    expect(doctorSection).not.toBeNull()
  })

  it('README describes incorrect-command recovery behavior', () => {
    const readme = readFileSync(readmePath, 'utf-8')
    expect(readme).toMatch(/command not found/)
    expect(readme).toMatch(/Available commands:.*init.*doctor/)
  })
})

describe('T-A.2.1: README keeps link and context as coming-soon references', () => {
  it('README marks blueprint link as coming soon', () => {
    const readme = readFileSync(readmePath, 'utf-8')
    const linkSection = readme.match(/### `blueprint link`[\s\S]*?(?=###|\n##|$)/)
    expect(linkSection).not.toBeNull()
    expect(linkSection![0]).toMatch(/\(coming soon\)/)
  })

  it('README marks blueprint context as coming soon', () => {
    const readme = readFileSync(readmePath, 'utf-8')
    const contextSection = readme.match(/### `blueprint context`[\s\S]*?(?=###|\n##|$)/)
    expect(contextSection).not.toBeNull()
    expect(contextSection![0]).toMatch(/\(coming soon\)/)
  })

  it('README does not describe link or context help entrypoints as available', () => {
    const readme = readFileSync(readmePath, 'utf-8')
    expect(readme).not.toMatch(/blueprint\s+help\s+link/)
    expect(readme).not.toMatch(/blueprint\s+help\s+context/)
    expect(readme).not.toMatch(/blueprint\s+link\s+--help/)
    expect(readme).not.toMatch(/blueprint\s+context\s+--help/)
  })

  it('README does not describe link or context as implemented commands', () => {
    const readme = readFileSync(readmePath, 'utf-8')
    const linkSection = readme.match(/### `blueprint link`[\s\S]*?(?=###|\n##|$)/)
    const contextSection = readme.match(/### `blueprint context`[\s\S]*?(?=###|\n##|$)/)
    expect(linkSection![0]).not.toMatch(/\(implemented\)/i)
    expect(contextSection![0]).not.toMatch(/\(implemented\)/i)
  })
})

describe('T-A.3.1: README install, executable, and examples stay aligned with CLI contract', () => {
  it('README install command uses @splitwireml/blueprint package name', () => {
    const readme = readFileSync(readmePath, 'utf-8')
    expect(readme).toMatch(/npm\s+install\s+-g\s+@splitwireml\/blueprint/)
  })

  it('README refers to blueprint executable in Install section', () => {
    const readme = readFileSync(readmePath, 'utf-8')
    const installSection = readme.match(/## Install[\s\S]*?(?=##|\n#|$)/)
    expect(installSection).not.toBeNull()
    expect(installSection![0]).toMatch(/\bblueprint\b/)
  })

  it('README refers to blueprint executable in Release Info section', () => {
    const readme = readFileSync(readmePath, 'utf-8')
    const releaseInfoSection = readme.match(/## Release Info[\s\S]*?(?=##|\n#|$)/)
    expect(releaseInfoSection).not.toBeNull()
    expect(releaseInfoSection![0]).toMatch(/\bblueprint\b/)
  })

  it('README release-contract link points to the correct docs path', () => {
    const readme = readFileSync(readmePath, 'utf-8')
    expect(readme).toMatch(/\[Release contract\]\(docs\/release-contract\.md\)/)
  })

  it('README quick-start example uses blueprint init correctly', () => {
    const readme = readFileSync(readmePath, 'utf-8')
    expect(readme).toMatch(/```bash\s*\n\s*mkdir\s+my-project/)
    expect(readme).toMatch(/blueprint\s+init/)
  })

  it('README doctor example uses blueprint doctor correctly', () => {
    const readme = readFileSync(readmePath, 'utf-8')
    expect(readme).toMatch(/```bash\s*\n\s*blueprint\s+doctor\s*\n```/)
  })

  it('README does not overpromise by showing link or context in examples', () => {
    const readme = readFileSync(readmePath, 'utf-8')
    const examplesSection = readme.match(/## Quick Start[\s\S]*?(?=##|\n#|$)/)
    if (examplesSection) {
      expect(examplesSection[0]).not.toMatch(/blueprint\s+link\b/)
      expect(examplesSection[0]).not.toMatch(/blueprint\s+context\b/)
    }
  })
})