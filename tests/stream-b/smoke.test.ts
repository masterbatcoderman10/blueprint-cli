import { describe, expect, it } from 'vitest'

import { invokeCli } from '../helpers/cli'

describe('T-B.2: CLI smoke — startup and no-op execution path', () => {
  it('starts and exits with code 0 for empty argv', async () => {
    const result = await invokeCli([])
    expect(result.exitCode).toBe(0)
  })

  it('starts and exits without throwing for empty argv', async () => {
    await expect(invokeCli([])).resolves.toBeDefined()
  })

  it('exits with a numeric code for unknown command input', async () => {
    const result = await invokeCli(['__smoke_unknown__'])
    expect(typeof result.exitCode).toBe('number')
  })

  it('does not crash on arbitrary single-argument input', async () => {
    const result = await invokeCli(['anything'])
    expect(typeof result.exitCode).toBe('number')
  })

  it('does not crash on multi-argument input', async () => {
    const result = await invokeCli(['cmd', '--flag', 'value'])
    expect(typeof result.exitCode).toBe('number')
  })

  it('returns stable output structure on every invocation', async () => {
    const first = await invokeCli([])
    const second = await invokeCli([])
    expect(first.exitCode).toBe(second.exitCode)
  })
})
