import { describe, expect, it } from 'vitest'

import { runCli } from '../../src/index'

describe('T-A.1: CLI entrypoint argv handoff and controlled exit path', () => {
  it('returns a deterministic success exit code for empty argv', async () => {
    await expect(runCli([])).resolves.toBe(0)
  })

  it('handles arbitrary argv without throwing', async () => {
    await expect(runCli(['placeholder'])).resolves.toBeTypeOf('number')
  })
})
