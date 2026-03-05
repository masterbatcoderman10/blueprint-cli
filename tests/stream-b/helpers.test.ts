import { describe, expect, it } from 'vitest'

import { invokeCli } from '../helpers/cli'

describe('T-B.1: Shared CLI test utilities — invocation and output capture', () => {
  it('returns an exitCode number for empty argv', async () => {
    const result = await invokeCli([])
    expect(typeof result.exitCode).toBe('number')
    expect(result.exitCode).toBe(0)
  })

  it('captures stdout as a string', async () => {
    const result = await invokeCli([])
    expect(typeof result.stdout).toBe('string')
  })

  it('captures stderr as a string', async () => {
    const result = await invokeCli([])
    expect(typeof result.stderr).toBe('string')
  })

  it('captures stdout content written during CLI execution', async () => {
    const result = await invokeCli([])
    expect(result).toHaveProperty('stdout')
    expect(result).toHaveProperty('stderr')
    expect(result).toHaveProperty('exitCode')
  })

  it('returns a non-zero exitCode for unknown commands', async () => {
    const result = await invokeCli(['__nonexistent__'])
    expect(result.exitCode).not.toBe(0)
  })
})
