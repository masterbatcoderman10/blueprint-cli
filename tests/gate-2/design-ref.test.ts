/**
 * Gate R6-2.0 — Design reference artifacts
 * Tests: T-2.0.7.1, T-2.0.7.2, T-2.0.7.3
 */

import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync, statSync } from 'fs'
import * as path from 'path'

const ROOT = path.resolve(__dirname, '../../')
const DESIGN_DIR = path.join(ROOT, 'src/design')

// T-2.0.7.1 — All 4 design-reference files exist; PNG non-zero bytes
describe('T-2.0.7.1: design reference files exist', () => {
  it('src/design/2YY-0.jsx exists', () => {
    expect(existsSync(path.join(DESIGN_DIR, '2YY-0.jsx'))).toBe(true)
  })

  it('src/design/2YY-0.png exists and is non-zero bytes', () => {
    const pngPath = path.join(DESIGN_DIR, '2YY-0.png')
    expect(existsSync(pngPath)).toBe(true)
    const stat = statSync(pngPath)
    expect(stat.size).toBeGreaterThan(0)
  })

  it('src/design/computed-styles.json exists', () => {
    expect(existsSync(path.join(DESIGN_DIR, 'computed-styles.json'))).toBe(true)
  })

  it('src/design/font-family-info.json exists', () => {
    expect(existsSync(path.join(DESIGN_DIR, 'font-family-info.json'))).toBe(true)
  })
})

// T-2.0.7.2 — 2YY-0.jsx parses as valid JSX; JSON files parse as valid JSON
describe('T-2.0.7.2: file content validity', () => {
  it('2YY-0.jsx is non-empty text', () => {
    const content = readFileSync(path.join(DESIGN_DIR, '2YY-0.jsx'), 'utf-8')
    expect(content.trim().length).toBeGreaterThan(0)
    // Should contain JSX-like markup
    expect(content).toMatch(/<|function|const|export/)
  })

  it('computed-styles.json parses as valid JSON', () => {
    const content = readFileSync(path.join(DESIGN_DIR, 'computed-styles.json'), 'utf-8')
    expect(() => JSON.parse(content)).not.toThrow()
  })

  it('font-family-info.json parses as valid JSON', () => {
    const content = readFileSync(path.join(DESIGN_DIR, 'font-family-info.json'), 'utf-8')
    expect(() => JSON.parse(content)).not.toThrow()
  })
})

// T-2.0.7.3 — Each text file's content contains the DESIGN REFERENCE banner
describe('T-2.0.7.3: DESIGN REFERENCE banner present', () => {
  const BANNER = 'DESIGN REFERENCE'

  it('2YY-0.jsx contains DESIGN REFERENCE banner', () => {
    const content = readFileSync(path.join(DESIGN_DIR, '2YY-0.jsx'), 'utf-8')
    expect(content).toContain(BANNER)
  })

  it('computed-styles.json contains DESIGN REFERENCE banner in _banner key', () => {
    const content = readFileSync(path.join(DESIGN_DIR, 'computed-styles.json'), 'utf-8')
    const parsed = JSON.parse(content)
    expect(parsed._banner).toBeDefined()
    expect(parsed._banner).toContain(BANNER)
  })

  it('font-family-info.json contains DESIGN REFERENCE banner in _banner key', () => {
    const content = readFileSync(path.join(DESIGN_DIR, 'font-family-info.json'), 'utf-8')
    const parsed = JSON.parse(content)
    expect(parsed._banner).toBeDefined()
    expect(parsed._banner).toContain(BANNER)
  })
})
