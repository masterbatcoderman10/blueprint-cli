/**
 * T-R10-2.C — Integration test for Stream C: Anti-Pattern Shape Unification
 * invariants across templates/.
 *
 * Three assertions:
 *   1. For each occurrence of <AntiPatterns> opener under templates/docs/core/**,
 *      the immediately preceding non-blank line is NOT ```xml.
 *   2. Zero occurrences of name="ANTI-PATTERN: in any <AntiPattern> declaration
 *      under templates/docs/core/**.
 *   3. Zero occurrences of the <TweakAntiPatterns> token (XML opener or closer)
 *      anywhere under templates/**.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const REPO_ROOT = resolve(__dirname, '..', '..', '..')
const TEMPLATES_CORE = resolve(REPO_ROOT, 'templates', 'docs', 'core')
const TEMPLATES_DIR = resolve(REPO_ROOT, 'templates')

function walkMd(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      walkMd(full, acc)
    } else if (stat.isFile() && full.endsWith('.md')) {
      acc.push(full)
    }
  }
  return acc
}

describe('T-R10-2.C — Anti-Pattern Shape Unification (templates/)', () => {
  const coreFiles = walkMd(TEMPLATES_CORE)
  const allTemplateFiles = walkMd(TEMPLATES_DIR)

  it('no <AntiPatterns> block is preceded by a ```xml fence opener', () => {
    const offenders: Array<{ file: string; line: number }> = []

    for (const file of coreFiles) {
      const content = readFileSync(file, 'utf8')
      const lines = content.split(/\r?\n/)

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('<AntiPatterns>')) {
          // Check the immediately preceding non-blank line
          let prev = i - 1
          while (prev >= 0 && lines[prev].trim() === '') prev--
          if (prev >= 0 && lines[prev].trim() === '```xml') {
            offenders.push({ file, line: i + 1 })
          }
        }
      }
    }

    expect(
      offenders,
      offenders.length > 0
        ? `Found <AntiPatterns> blocks still preceded by \`\`\`xml fence in templates/:\n${offenders
            .map((o) => `  ${o.file}:${o.line}`)
            .join('\n')}`
        : 'no offenders',
    ).toEqual([])
  })

  it('no <AntiPattern> declaration carries the ANTI-PATTERN: prefix in name=', () => {
    const offenders: Array<{ file: string; line: number; text: string }> = []

    for (const file of coreFiles) {
      const content = readFileSync(file, 'utf8')
      const lines = content.split(/\r?\n/)

      lines.forEach((line, idx) => {
        if (line.includes('name="ANTI-PATTERN:')) {
          offenders.push({ file, line: idx + 1, text: line.trim() })
        }
      })
    }

    expect(
      offenders,
      offenders.length > 0
        ? `Found <AntiPattern> entries still carrying ANTI-PATTERN: prefix in templates/:\n${offenders
            .map((o) => `  ${o.file}:${o.line} → ${o.text}`)
            .join('\n')}`
        : 'no offenders',
    ).toEqual([])
  })

  it('no <TweakAntiPatterns> XML tag exists anywhere under templates/', () => {
    const offenders: Array<{ file: string; line: number; text: string }> = []

    for (const file of allTemplateFiles) {
      const content = readFileSync(file, 'utf8')
      const lines = content.split(/\r?\n/)

      lines.forEach((line, idx) => {
        // Match standalone XML tags (not prose backtick-wrapped references)
        const trimmed = line.trim()
        if (
          trimmed === '<TweakAntiPatterns>' ||
          trimmed === '</TweakAntiPatterns>' ||
          /^\s*<TweakAntiPatterns>\s*$/.test(line) ||
          /^\s*<\/TweakAntiPatterns>\s*$/.test(line)
        ) {
          offenders.push({ file, line: idx + 1, text: line.trim() })
        }
      })
    }

    expect(
      offenders,
      offenders.length > 0
        ? `Found <TweakAntiPatterns> XML tags in templates/:\n${offenders
            .map((o) => `  ${o.file}:${o.line} → ${o.text}`)
            .join('\n')}`
        : 'no offenders',
    ).toEqual([])
  })
})
