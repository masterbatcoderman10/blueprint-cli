import { describe, it, expect } from 'vitest'
import { invokeCli } from '../../helpers/cli'

describe('T-2.0.2.1 — Supported command-help entrypoints', () => {
  it('blueprint help init enters the command-help path and exits 0', async () => {
    const result = await invokeCli(['help', 'init'])

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('init')
  })

  it('blueprint help doctor enters the command-help path and exits 0', async () => {
    const result = await invokeCli(['help', 'doctor'])

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('doctor')
  })

  it('blueprint init --help enters the command-help path and exits 0', async () => {
    const result = await invokeCli(['init', '--help'])

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('init')
  })

  it('blueprint doctor --help enters the command-help path and exits 0', async () => {
    const result = await invokeCli(['doctor', '--help'])

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('doctor')
  })
})

describe('T-2.0.2.2 — Unsupported help targets fall back to recovery', () => {
  it('blueprint help ghost falls back to unknown-command recovery', async () => {
    const result = await invokeCli(['help', 'ghost'])

    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('Unknown command: ghost')
  })

  it('blueprint ghost --help falls back to unknown-command recovery', async () => {
    const result = await invokeCli(['ghost', '--help'])

    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('Unknown command: ghost')
  })
})
