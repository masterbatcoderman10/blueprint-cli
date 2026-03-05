import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { execSync } from 'child_process'

const root = resolve(process.cwd())

function getScripts(): Record<string, string> {
  const raw = readFileSync(resolve(root, 'package.json'), 'utf-8')
  return JSON.parse(raw).scripts ?? {}
}

describe('T-1.0.4: Core npm scripts', () => {
  it('package.json has a "build" script', () => {
    expect(getScripts().build).toBeTruthy()
  })

  it('package.json has a "typecheck" script', () => {
    expect(getScripts().typecheck).toBeTruthy()
  })

  it('package.json has a "test" script', () => {
    expect(getScripts().test).toBeTruthy()
  })

  it('package.json has a "dev" script', () => {
    expect(getScripts().dev).toBeTruthy()
  })

  it('"typecheck" script runs tsc without errors', () => {
    expect(() => {
      execSync('npm run typecheck', { cwd: root, stdio: 'pipe' })
    }).not.toThrow()
  })

  it('"test" script invokes vitest and passes baseline tests', () => {
    expect(() => {
      // Run against a specific file to avoid recursive invocation
      execSync('npm test -- tests/setup/layout.test.ts', { cwd: root, stdio: 'pipe' })
    }).not.toThrow()
  })

  it('"build" script compiles TypeScript to dist/', () => {
    execSync('npm run build', { cwd: root, stdio: 'pipe' })
    expect(existsSync(resolve(root, 'dist'))).toBe(true)
  })
})
