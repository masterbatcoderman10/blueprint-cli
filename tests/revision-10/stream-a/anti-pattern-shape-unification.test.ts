import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const DOCS_CORE = resolve(__dirname, '../../../docs/core')

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

describe('T-R10-2.A — Anti-Pattern Shape Unification (docs/core source)', () => {
  const files = walkMd(DOCS_CORE)

  it('no <AntiPatterns> block is preceded by a ```xml fence opener', () => {
    const offenders: Array<{ file: string; line: number }> = []

    for (const file of files) {
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
        ? `Found <AntiPatterns> blocks still preceded by \`\`\`xml fence:\n${offenders
            .map((o) => `  ${o.file}:${o.line}`)
            .join('\n')}`
        : 'no offenders',
    ).toEqual([])
  })

  it('no <AntiPattern> declaration carries the ANTI-PATTERN: prefix in name=', () => {
    const offenders: Array<{ file: string; line: number; text: string }> = []

    for (const file of files) {
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
        ? `Found <AntiPattern> entries still carrying ANTI-PATTERN: prefix:\n${offenders
            .map((o) => `  ${o.file}:${o.line} → ${o.text}`)
            .join('\n')}`
        : 'no offenders',
    ).toEqual([])
  })
})
