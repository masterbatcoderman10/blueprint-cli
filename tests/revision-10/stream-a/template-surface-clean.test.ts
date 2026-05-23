import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const TEMPLATES_ROOT = resolve(__dirname, '../../../templates')

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      walk(full, acc)
    } else if (stat.isFile()) {
      acc.push(full)
    }
  }
  return acc
}

describe('T-R10-1.A — Templates surface contains no health-check artifact', () => {
  it('every file under templates/ is free of the literal "health-check" token', () => {
    const files = walk(TEMPLATES_ROOT)
    const offenders: Array<{ file: string; line: number; text: string }> = []

    for (const file of files) {
      const content = readFileSync(file, 'utf8')
      const lines = content.split(/\r?\n/)
      lines.forEach((line, idx) => {
        if (line.includes('health-check')) {
          offenders.push({ file, line: idx + 1, text: line })
        }
      })
    }

    expect(
      offenders,
      offenders.length > 0
        ? `Templates surface still references "health-check":\n${offenders
            .map((o) => `  ${o.file}:${o.line} → ${o.text}`)
            .join('\n')}`
        : 'no offenders',
    ).toEqual([])
  })

  it('templates/docs/core/health-check.md does not exist', () => {
    const target = join(TEMPLATES_ROOT, 'docs/core/health-check.md')
    expect(existsSync(target)).toBe(false)
  })
})
