import { describe, expect, it } from 'vitest'
import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const root = resolve(process.cwd())

interface ReleaseCheckStep {
  id: string
  command: string
}

function readPackageJson(): Record<string, unknown> {
  const raw = readFileSync(resolve(root, 'package.json'), 'utf-8')
  return JSON.parse(raw)
}

function readDryRunPlan(): ReleaseCheckStep[] {
  const output = execSync('npm run --silent release:check -- --dry-run', {
    cwd: root,
    stdio: 'pipe',
    encoding: 'utf-8',
  })
  return JSON.parse(output) as ReleaseCheckStep[]
}

describe('T-B.1.1: local release-check delegates to shared verification entrypoint', () => {
  it('runs the shared release-check script locally and returns a valid step plan', () => {
    const steps = readDryRunPlan()

    // The script must return a non-empty array of steps
    expect(steps.length).toBeGreaterThan(0)

    // Every step has an id and a command
    for (const step of steps) {
      expect(step).toHaveProperty('id')
      expect(step).toHaveProperty('command')
      expect(typeof step.id).toBe('string')
      expect(typeof step.command).toBe('string')
    }
  })

  it('exposes release:check:ci and release:check:publish that delegate to the same entrypoint', () => {
    const scripts = (readPackageJson().scripts ?? {}) as Record<string, string>

    // CI and publish aliases must both delegate to the canonical release:check
    expect(scripts['release:check:ci']).toBe('npm run release:check')
    expect(scripts['release:check:publish']).toBe('npm run release:check')
  })
})

describe('T-B.1.2: shared release-check includes package verification and packaged smoke', () => {
  it('includes package-aware verification steps rather than CI-only special cases', () => {
    const steps = readDryRunPlan()
    const stepIds = steps.map((s) => s.id)

    // Must include the pack step for artifact creation
    expect(stepIds).toContain('pack')

    // Must include packaged-smoke for artifact verification
    expect(stepIds).toContain('packaged-smoke')

    // Pack must come after build (artifact needs compiled output)
    const buildIdx = stepIds.indexOf('build')
    const packIdx = stepIds.indexOf('pack')
    const smokeIdx = stepIds.indexOf('packaged-smoke')
    expect(packIdx).toBeGreaterThan(buildIdx)
    expect(smokeIdx).toBeGreaterThan(packIdx)
  })

  it('does not contain any CI-only or environment-specific conditional steps', () => {
    const steps = readDryRunPlan()

    // All step commands should be plain npm commands — no env var conditionals,
    // no CI-only flags, no if-else logic in commands
    for (const step of steps) {
      expect(step.command).not.toMatch(/\bif\b/)
      expect(step.command).not.toMatch(/CI=/)
      expect(step.command).not.toMatch(/--ci-only/)
    }
  })
})
