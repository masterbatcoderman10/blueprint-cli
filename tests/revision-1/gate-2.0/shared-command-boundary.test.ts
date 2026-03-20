import { describe, it, expect } from 'vitest'
import { invokeCli } from '../../helpers/cli'

describe('T-2.0.3.1 — Shared implemented-command guidance boundary', () => {
  it('root help, command help, and recovery all surface the same commands', async () => {
    const rootHelp = await invokeCli(['--help'])
    const unknownRecovery = await invokeCli(['ghost'])

    // Both should list init and doctor
    expect(rootHelp.stdout).toContain('init')
    expect(rootHelp.stdout).toContain('doctor')
    expect(unknownRecovery.stderr).toContain('init')
    expect(unknownRecovery.stderr).toContain('doctor')
  })

  it('placeholder commands do not appear in any guidance surface', async () => {
    const rootHelp = await invokeCli(['--help'])
    const unknownRecovery = await invokeCli(['ghost'])
    const initHelp = await invokeCli(['help', 'init'])
    const doctorHelp = await invokeCli(['help', 'doctor'])

    for (const result of [rootHelp, unknownRecovery, initHelp, doctorHelp]) {
      const combined = result.stdout + result.stderr
      expect(combined).not.toContain('link')
      expect(combined).not.toContain('context')
    }
  })

  it('command-help recognizes exactly the same commands as root help', async () => {
    // init and doctor are implemented — help works
    const initHelp = await invokeCli(['help', 'init'])
    const doctorHelp = await invokeCli(['help', 'doctor'])
    expect(initHelp.exitCode).toBe(0)
    expect(doctorHelp.exitCode).toBe(0)

    // link and context are not implemented — falls back to recovery
    const linkHelp = await invokeCli(['help', 'link'])
    const contextHelp = await invokeCli(['help', 'context'])
    expect(linkHelp.exitCode).toBe(1)
    expect(contextHelp.exitCode).toBe(1)
  })
})
