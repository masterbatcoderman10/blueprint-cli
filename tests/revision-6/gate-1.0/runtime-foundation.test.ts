import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

function parseMinimumNodeVersion(range: string): [number, number, number] {
  const match = range.match(/^>=(\d+)\.(\d+)\.(\d+)$/)
  if (!match) {
    throw new Error(`Unsupported Node engine range: ${range}`)
  }

  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

function isAtLeast(version: [number, number, number], minimum: [number, number, number]): boolean {
  for (let index = 0; index < version.length; index += 1) {
    if (version[index] > minimum[index]) {
      return true
    }

    if (version[index] < minimum[index]) {
      return false
    }
  }

  return true
}

describe('Gate R6-1.0 — runtime foundation', () => {
  it('T-1.0.1: package engines.node includes Node 22.5.0 and newer', async () => {
    const packageJson = JSON.parse(await readFile(resolve('package.json'), 'utf-8')) as {
      engines?: { node?: string }
    }

    expect(packageJson.engines?.node).toBeDefined()
    const minimum = parseMinimumNodeVersion(packageJson.engines?.node ?? '')

    expect(isAtLeast([22, 5, 0], minimum)).toBe(true)
    expect(isAtLeast([24, 13, 0], minimum)).toBe(true)
    expect(isAtLeast([22, 4, 0], minimum)).toBe(false)
  })
})
