/**
 * Gate R6-2.0 — Build Infra + App Shell
 * Tests: T-2.0.1, T-2.0.2.1, T-2.0.2.2, T-2.0.3.1, T-2.0.3.2
 */

import { beforeAll, describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import * as path from 'path'

import { ensureSpaBuild } from '../helpers/ensure-spa-build'

const ROOT = path.resolve(__dirname, '../../')
const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf-8'))

// T-2.0.1 — dev-dep keys present with correct semver ranges
describe('T-2.0.1: package.json dev-deps', () => {
  it('svelte@^5 is in devDependencies', () => {
    expect(pkg.devDependencies).toHaveProperty('svelte')
    expect(pkg.devDependencies['svelte']).toMatch(/^\^5/)
  })

  it('vite is in devDependencies', () => {
    expect(pkg.devDependencies).toHaveProperty('vite')
  })

  it('@sveltejs/vite-plugin-svelte is in devDependencies', () => {
    expect(pkg.devDependencies).toHaveProperty('@sveltejs/vite-plugin-svelte')
  })

  it('@testing-library/svelte is in devDependencies', () => {
    expect(pkg.devDependencies).toHaveProperty('@testing-library/svelte')
  })

  it('jsdom is in devDependencies', () => {
    expect(pkg.devDependencies).toHaveProperty('jsdom')
  })

  it('no new runtime dependencies added', () => {
    // svelte and vite must NOT appear in dependencies (only devDependencies)
    const runtimeDeps = pkg.dependencies ?? {}
    expect(runtimeDeps).not.toHaveProperty('svelte')
    expect(runtimeDeps).not.toHaveProperty('vite')
    expect(runtimeDeps).not.toHaveProperty('@sveltejs/vite-plugin-svelte')
    expect(runtimeDeps).not.toHaveProperty('@testing-library/svelte')
    expect(runtimeDeps).not.toHaveProperty('jsdom')
  })
})

// T-2.0.2.2 — vite.config.ts structural checks (static parse)
// Note: renamed to vite.config.mts for ESM-only @sveltejs/vite-plugin-svelte compatibility
describe('T-2.0.2.2: vite.config.ts content', () => {
  // Accept either .ts or .mts (we use .mts in this project)
  const configPath = existsSync(path.join(ROOT, 'vite.config.ts'))
    ? path.join(ROOT, 'vite.config.ts')
    : path.join(ROOT, 'vite.config.mts')

  it('vite.config.ts exists', () => {
    expect(existsSync(configPath)).toBe(true)
  })

  it("exports base '/'", () => {
    const content = readFileSync(configPath, 'utf-8')
    expect(content).toMatch(/base\s*:\s*['"]\/['"]/)
  })

  it("exports build.outDir 'dist/spa'", () => {
    const content = readFileSync(configPath, 'utf-8')
    expect(content).toMatch(/outDir\s*:\s*['"]dist\/spa['"]/)
  })

  it("exports build.assetsDir 'assets'", () => {
    const content = readFileSync(configPath, 'utf-8')
    expect(content).toMatch(/assetsDir\s*:\s*['"]assets['"]/)
  })

  it('Svelte plugin is registered', () => {
    const content = readFileSync(configPath, 'utf-8')
    expect(content).toMatch(/svelte\s*\(/)
  })
})

// T-2.0.3.1 — npm scripts present
describe('T-2.0.3.1: npm scripts', () => {
  it('build:spa script exists', () => {
    expect(pkg.scripts).toHaveProperty('build:spa')
  })

  it('build script exists', () => {
    expect(pkg.scripts).toHaveProperty('build')
  })

  it('prepack script exists', () => {
    expect(pkg.scripts).toHaveProperty('prepack')
  })

  it('dev:board script exists', () => {
    expect(pkg.scripts).toHaveProperty('dev:board')
  })

  it('build:spa uses vite build', () => {
    expect(pkg.scripts['build:spa']).toContain('vite build')
  })
})

// T-2.0.3.2 — files whitelist includes dist/, dist/spa/, templates/
describe('T-2.0.3.2: package.json files whitelist', () => {
  it('files array includes "dist/" or "dist"', () => {
    const files: string[] = pkg.files ?? []
    const hasDistVariant = files.some((f: string) => f === 'dist' || f === 'dist/' || f.startsWith('dist'))
    expect(hasDistVariant).toBe(true)
  })

  it('files array includes "dist/spa/" or "dist/spa"', () => {
    const files: string[] = pkg.files ?? []
    const hasSpa = files.some((f: string) => f === 'dist/spa' || f === 'dist/spa/')
    // dist/spa is covered if files includes dist/ recursively — allow either
    // but accept 'dist' alone as sufficient since npm includes subdirs
    const hasDistOrSpa = files.some((f: string) =>
      f === 'dist' || f === 'dist/' || f === 'dist/spa' || f === 'dist/spa/'
    )
    expect(hasDistOrSpa).toBe(true)
  })

  it('files array includes "templates/" or "templates"', () => {
    const files: string[] = pkg.files ?? []
    const hasTemplates = files.some((f: string) => f === 'templates' || f === 'templates/')
    expect(hasTemplates).toBe(true)
  })
})

// T-2.0.2.1 — build:spa produces dist/spa/index.html with hashed asset ref
// This test is marked as integration and requires the build to have been run.
// Skip in CI if dist/spa doesn't exist; verify after manual build.
describe('T-2.0.2.1: build:spa output', () => {
  const distSpa = path.join(ROOT, 'dist/spa')
  const indexHtml = path.join(distSpa, 'index.html')

  beforeAll(async () => {
    await ensureSpaBuild({ rootDir: ROOT })
  })

  it('dist/spa/index.html exists after build', () => {
    expect(existsSync(indexHtml)).toBe(true)
  })

  it('dist/spa/index.html references a hashed asset', () => {
    const html = readFileSync(indexHtml, 'utf-8')
    // Vite fingerprints assets: name-[hash].ext
    expect(html).toMatch(/assets\/.*-[A-Za-z0-9_-]{8,}\.(js|css)/)
  })

  it('dist/spa/assets/ directory is non-empty', () => {
    const assetsDir = path.join(distSpa, 'assets')
    const { readdirSync } = require('fs')
    const files = readdirSync(assetsDir)
    expect(files.length).toBeGreaterThan(0)
  })
})
