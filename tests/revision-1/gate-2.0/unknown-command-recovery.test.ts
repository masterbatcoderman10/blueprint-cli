import { describe, it, expect } from 'vitest'
import { invokeCli } from '../../helpers/cli'

describe('T-2.0.1.1 — Unknown command recovery contract', () => {
  it('unknown command exits non-zero with generic recovery guidance', async () => {
    const result = await invokeCli(['ghost'])

    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('Unknown command: ghost')
    expect(result.stderr).toContain('init')
    expect(result.stderr).toContain('doctor')
  })

  it('recovery guidance lists only implemented commands, not placeholders', async () => {
    const result = await invokeCli(['ghost'])

    expect(result.stderr).not.toContain('link')
    expect(result.stderr).not.toContain('context')
  })

  it('recovery guidance includes root usage line', async () => {
    const result = await invokeCli(['ghost'])

    expect(result.stderr).toContain('Usage: blueprint <command>')
  })
})
