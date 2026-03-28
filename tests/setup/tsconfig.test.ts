import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { execSync } from 'child_process'

const root = resolve(process.cwd())

describe('T-1.0.2: Strict TypeScript configuration', () => {
  it('tsconfig.json exists', () => {
    expect(existsSync(resolve(root, 'tsconfig.json'))).toBe(true)
  })

  it('tsconfig.json is valid JSON', () => {
    const raw = readFileSync(resolve(root, 'tsconfig.json'), 'utf-8')
    expect(() => JSON.parse(raw)).not.toThrow()
  })

  it('tsconfig.json has strict mode enabled', () => {
    const raw = readFileSync(resolve(root, 'tsconfig.json'), 'utf-8')
    const tsconfig = JSON.parse(raw)
    expect(tsconfig.compilerOptions?.strict).toBe(true)
  })

  it('tsconfig.json targets Node CLI (CommonJS module, outDir, rootDir)', () => {
    const raw = readFileSync(resolve(root, 'tsconfig.json'), 'utf-8')
    const tsconfig = JSON.parse(raw)
    const opts = tsconfig.compilerOptions
    expect(opts?.module?.toLowerCase()).toBe('commonjs')
    expect(opts?.outDir).toBeTruthy()
    expect(opts?.rootDir).toBeTruthy()
  })

  it('tsconfig.json constrains ambient types to Node for the CLI runtime', () => {
    const raw = readFileSync(resolve(root, 'tsconfig.json'), 'utf-8')
    const tsconfig = JSON.parse(raw)
    const opts = tsconfig.compilerOptions

    expect(opts?.types).toEqual(['node'])
  })

  it('tsc --noEmit passes on baseline source tree', () => {
    expect(() => {
      execSync('npx tsc --noEmit', { cwd: root, stdio: 'pipe' })
    }).not.toThrow()
  })
})
