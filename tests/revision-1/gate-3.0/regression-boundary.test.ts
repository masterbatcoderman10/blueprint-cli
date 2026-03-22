import { describe, it, expect } from 'vitest'
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const workspaceRoot = join(__dirname, '..', '..', '..')

function findTestFiles(dir: string, pattern: RegExp): string[] {
  const results: string[] = []

  function walk(currentDir: string) {
    const entries = readdirSync(currentDir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name)
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        walk(fullPath)
      } else if (entry.isFile() && pattern.test(entry.name)) {
        results.push(fullPath)
      }
    }
  }

  walk(dir)
  return results
}

describe('T-3.0.3.1 — Regression boundary covers multiple surfaces', () => {
  it('source-checkout tests cover root-help, command-help, and recovery behavior', () => {
    const revision1Tests = findTestFiles(join(workspaceRoot, 'tests', 'revision-1'), /\.test\.ts$/)

    expect(revision1Tests.length).toBeGreaterThan(0)

    const sourceCheckouts = revision1Tests.filter(f =>
      f.includes('gate-1.0') ||
      f.includes('gate-2.0') ||
      f.includes('stream-a') ||
      f.includes('stream-b') ||
      f.includes('stream-c')
    )

    expect(sourceCheckouts.length).toBeGreaterThan(0)

    const rootHelpTests = findTestFiles(join(workspaceRoot, 'tests', 'revision-1'), /root.*help|help.*root/)
    const commandHelpTests = findTestFiles(join(workspaceRoot, 'tests', 'revision-1'), /command.*help|help.*command/)
    const recoveryTests = findTestFiles(join(workspaceRoot, 'tests', 'revision-1'), /recovery|unknown.*command/)

    expect(rootHelpTests.length).toBeGreaterThan(0)
    expect(commandHelpTests.length).toBeGreaterThan(0)
    expect(recoveryTests.length).toBeGreaterThan(0)
  })

  it('packaged-artifact smoke tests verify installed executable preserves help and recovery behavior', () => {
    const packedSmokeTests = findTestFiles(join(workspaceRoot, 'tests', 'phase-4', 'stream-a'), /packaged.*smoke|smoke.*packaged/)

    expect(packedSmokeTests.length).toBeGreaterThan(0)

    const smokeContent = require('node:fs').readFileSync(packedSmokeTests[0], 'utf-8')

    expect(smokeContent).toContain('blueprint')
    expect(smokeContent).toContain('init')
    expect(smokeContent).toContain('doctor')
  })

  it('documentation-alignment tests verify README and release-contract stay consistent with implemented commands', () => {
    const docTests = findTestFiles(join(workspaceRoot, 'tests', 'revision-1', 'gate-3.0'), /\.test\.ts$/)

    expect(docTests.length).toBeGreaterThan(0)

    const hasInitDoctorTest = docTests.some(f => {
      const content = require('node:fs').readFileSync(f, 'utf-8')
      return content.includes('init') && content.includes('doctor')
    })

    expect(hasInitDoctorTest).toBe(true)
  })

  it('no single surface is the only regression guard — coverage is distributed', () => {
    const sourceTests = findTestFiles(join(workspaceRoot, 'tests', 'revision-1'), /\.test\.ts$/)
    const packedTests = findTestFiles(join(workspaceRoot, 'tests', 'phase-4', 'stream-a'), /\.test\.ts$/)
    const docTests = findTestFiles(join(workspaceRoot, 'tests', 'revision-1', 'gate-3.0'), /\.test\.ts$/)

    expect(sourceTests.length).toBeGreaterThan(0)
    expect(packedTests.length).toBeGreaterThan(0)
    expect(docTests.length).toBeGreaterThan(0)
  })
})
