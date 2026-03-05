import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

const root = resolve(process.cwd())

describe('T-1.0.1: Baseline project layout and package manifest', () => {
  it('src/ directory exists', () => {
    expect(existsSync(resolve(root, 'src'))).toBe(true)
  })

  it('src/commands/ directory exists', () => {
    expect(existsSync(resolve(root, 'src/commands'))).toBe(true)
  })

  it('tests/ directory exists', () => {
    expect(existsSync(resolve(root, 'tests'))).toBe(true)
  })

  it('package.json is valid JSON', () => {
    const pkgPath = resolve(root, 'package.json')
    expect(existsSync(pkgPath)).toBe(true)
    const raw = readFileSync(pkgPath, 'utf-8')
    expect(() => JSON.parse(raw)).not.toThrow()
  })

  it('package.json has CLI manifest fields (name, version, bin)', () => {
    const raw = readFileSync(resolve(root, 'package.json'), 'utf-8')
    const pkg = JSON.parse(raw)
    expect(pkg.name).toBeTruthy()
    expect(pkg.version).toBeTruthy()
    expect(pkg.bin).toBeTruthy()
  })
})
