import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const workspaceRoot = join(__dirname, '..', '..', '..')
const releasingPath = join(workspaceRoot, 'docs', 'releasing.md')

describe('T-3.0.2.1 — Release-facing docs aligned on CLI contract', () => {
  it('releasing.md does not misidentify link or context as currently implemented', () => {
    const releasing = readFileSync(releasingPath, 'utf-8')

    const misidentificationPattern = /Public.*CLI.*scope.*link.*context.*implemented/
    expect(releasing).not.toMatch(misidentificationPattern)
  })
})
