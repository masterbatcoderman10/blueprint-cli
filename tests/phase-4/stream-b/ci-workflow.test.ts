import { describe, expect, it } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const root = resolve(process.cwd())
const ciWorkflowPath = resolve(root, '.github/workflows/ci.yml')

function readCiWorkflow(): string {
  return readFileSync(ciWorkflowPath, 'utf-8')
}

describe('T-B.2.1: CI workflow enforces the release gate on integration events', () => {
  it('CI workflow file exists', () => {
    expect(existsSync(ciWorkflowPath)).toBe(true)
  })

  it('triggers on push and pull_request events', () => {
    const raw = readCiWorkflow()
    // The on: block must include both push and pull_request triggers
    expect(raw).toMatch(/\bon:\s/)
    expect(raw).toMatch(/\bpush\b/)
    expect(raw).toMatch(/\bpull_request\b/)
  })

  it('targets the supported Node runtime (>=18)', () => {
    const raw = readCiWorkflow()
    // Must reference Node 18 or higher in node-version
    const nodeVersionMatch = raw.match(/node-version[:\s]+\[?['"]?(\d+)/)
    expect(nodeVersionMatch).not.toBeNull()
    const major = parseInt(nodeVersionMatch![1], 10)
    expect(major).toBeGreaterThanOrEqual(18)
  })

  it('runs install, typecheck, tests, build, and package verification', () => {
    const raw = readCiWorkflow()
    // The CI must invoke the shared release-check entrypoint
    // or individually run the equivalent steps
    const usesSharedCheck =
      raw.includes('release:check:ci') || raw.includes('release:check')

    if (usesSharedCheck) {
      expect(usesSharedCheck).toBe(true)
    } else {
      // Otherwise all individual steps must appear
      expect(raw).toMatch(/npm ci/)
      expect(raw).toMatch(/typecheck/)
      expect(raw).toMatch(/npm test/)
      expect(raw).toMatch(/npm run build/)
      expect(raw).toMatch(/npm pack/)
    }
  })
})

describe('T-B.2.2: CI failure in any step blocks the workflow', () => {
  it('does not use continue-on-error for release gate steps', () => {
    const raw = readCiWorkflow()
    // continue-on-error: true must not appear in the workflow
    // (it would allow failing steps to be silently ignored)
    expect(raw).not.toMatch(/continue-on-error:\s*true/)
  })

  it('each verification step runs as a separate named step for clear failure signal', () => {
    const raw = readCiWorkflow()
    // At minimum, the shared release-check must appear in a run: block,
    // or individual steps must be named
    const hasRunBlocks = raw.match(/- name:.*\n\s+run:/g)
    expect(hasRunBlocks).not.toBeNull()
    expect(hasRunBlocks!.length).toBeGreaterThanOrEqual(1)
  })
})
