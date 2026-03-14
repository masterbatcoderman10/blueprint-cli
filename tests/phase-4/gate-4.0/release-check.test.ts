import { describe, expect, it } from 'vitest'
import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const root = resolve(process.cwd())

interface ReleaseCheckStep {
  id: string
  command: string
}

function readScripts(): Record<string, string> {
  const raw = readFileSync(resolve(root, 'package.json'), 'utf-8')
  return JSON.parse(raw).scripts ?? {}
}

function readDryRunPlan(): ReleaseCheckStep[] {
  const output = execSync('npm run --silent release:check -- --dry-run', {
    cwd: root,
    stdio: 'pipe',
    encoding: 'utf-8',
  })

  return JSON.parse(output) as ReleaseCheckStep[]
}

describe('T-4.0.2.1: shared release-check entrypoint', () => {
  it('documents and emits the release verification steps in the expected order', () => {
    expect(readDryRunPlan()).toEqual([
      { id: 'install', command: 'npm ci' },
      { id: 'typecheck', command: 'npm run typecheck' },
      { id: 'test', command: 'npm test' },
      { id: 'build', command: 'npm run build' },
      { id: 'pack', command: 'npm pack --json' },
      { id: 'packaged-smoke', command: 'npm run release:pack:verify' },
    ])
  })
})

describe('T-4.0.2.2: automation reuses the shared release-check entrypoint', () => {
  it('keeps CI and publish verification pointed at the same release-check command', () => {
    const scripts = readScripts()

    expect(scripts['release:check']).toBe('tsx src/release/run-release-check.ts')
    expect(scripts['release:check:ci']).toBe('npm run release:check')
    expect(scripts['release:check:publish']).toBe('npm run release:check')
  })
})
