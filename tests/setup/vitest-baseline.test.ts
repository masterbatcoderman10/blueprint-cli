import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { execSync } from 'child_process'

const root = resolve(process.cwd())

describe('T-1.0.3: Vitest baseline configuration', () => {
  it('vitest.config.ts exists', () => {
    expect(existsSync(resolve(root, 'vitest.config.ts'))).toBe(true)
  })

  it('vitest.config.ts is readable', () => {
    const raw = readFileSync(resolve(root, 'vitest.config.ts'), 'utf-8')
    expect(raw.length).toBeGreaterThan(0)
  })

  it('vitest.config.ts specifies node environment', () => {
    const raw = readFileSync(resolve(root, 'vitest.config.ts'), 'utf-8')
    expect(raw).toContain('node')
  })

  it('vitest.config.ts includes tests directory pattern', () => {
    const raw = readFileSync(resolve(root, 'vitest.config.ts'), 'utf-8')
    expect(raw).toContain('tests')
  })

  it('vitest runs and executes at least one test file', () => {
    const output = execSync('npx vitest run tests/setup/layout.test.ts', {
      cwd: root,
      encoding: 'utf-8',
      stdio: 'pipe',
    })
    expect(output).toContain('passed')
  })
})
