import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, expect, it } from 'vitest'

const root = resolve(process.cwd())
const packageJsonPath = resolve(root, 'package.json')

interface PackFileEntry {
  path: string
}

interface PackResult {
  files?: PackFileEntry[]
}

function readPackageJson(): Record<string, unknown> {
  return JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as Record<string, unknown>
}

function readPackPaths(): string[] {
  execSync('npm run build', {
    cwd: root,
    stdio: 'pipe',
    encoding: 'utf-8',
  })
  const raw = execSync('npm pack --json --dry-run', {
    cwd: root,
    stdio: 'pipe',
    encoding: 'utf-8',
  })
  const results = JSON.parse(raw) as PackResult[]
  const files = Array.isArray(results) && Array.isArray(results[0]?.files) ? results[0].files : []
  return files.map((entry) => entry.path)
}

describe('T-C.1.1: package metadata matches the intended public release surface', () => {
  it('exposes scoped public release metadata for npm consumers', () => {
    const packageJson = readPackageJson()

    expect(packageJson.name).toBe('@splitwireml/blueprint')
    expect(packageJson.bin).toEqual({ blueprint: './dist/index.js' })
    expect(packageJson.license).toBe('MIT')
    expect(packageJson.repository).toEqual({
      type: 'git',
      url: 'git+https://github.com/masterbatcoderman10/blueprint-cli.git',
    })
    expect(packageJson.homepage).toBe('https://github.com/masterbatcoderman10/blueprint-cli#readme')
    expect(packageJson.bugs).toEqual({
      url: 'https://github.com/masterbatcoderman10/blueprint-cli/issues',
    })
    expect(packageJson.publishConfig).toEqual({ access: 'public' })
    expect(packageJson.keywords).toEqual(
      expect.arrayContaining(['blueprint', 'cli', 'project-scaffolding', 'workflow']),
    )
  })
})

describe('T-C.1.2: npm pack output stays curated for release', () => {
  it('includes only the intended published artifact surface', () => {
    const packPaths = readPackPaths()

    expect(packPaths).toContain('package.json')
    expect(packPaths).toContain('LICENSE')
    expect(packPaths.some((path) => path === 'dist' || path.startsWith('dist/'))).toBe(true)
    expect(packPaths.some((path) => path === 'templates' || path.startsWith('templates/'))).toBe(true)

    expect(packPaths.some((path) => path === 'tests' || path.startsWith('tests/'))).toBe(false)
    expect(packPaths.some((path) => path === 'docs' || path.startsWith('docs/'))).toBe(false)
    expect(packPaths).not.toContain('AGENTS.md')
    expect(packPaths).not.toContain('CLAUDE.md')
    expect(packPaths).not.toContain('GEMINI.md')
    expect(packPaths).not.toContain('QWEN.md')
  })
})
