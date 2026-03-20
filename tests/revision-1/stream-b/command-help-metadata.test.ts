import { describe, expect, it } from 'vitest'

import { isImplementedCommand, implementedCommands } from '../../../src/help/implemented-commands'
import { invokeCli } from '../../helpers/cli'

describe('T-B.1.1: Command-help metadata for implemented commands', () => {
  it('command-help metadata exists for init and doctor', () => {
    expect(implementedCommands).toHaveLength(2)
    expect(implementedCommands.map((c) => c.name)).toContain('init')
    expect(implementedCommands.map((c) => c.name)).toContain('doctor')
  })

  it('command-help metadata stays separate from placeholder command definitions', () => {
    expect(isImplementedCommand('init')).toBe(true)
    expect(isImplementedCommand('doctor')).toBe(true)
    expect(isImplementedCommand('link')).toBe(false)
    expect(isImplementedCommand('context')).toBe(false)
  })

  it('only implemented commands expose command-help content', async () => {
    const initResult = await invokeCli(['help', 'init'])
    expect(initResult.exitCode).toBe(0)
    expect(initResult.stdout).toContain('init')

    const doctorResult = await invokeCli(['help', 'doctor'])
    expect(doctorResult.exitCode).toBe(0)
    expect(doctorResult.stdout).toContain('doctor')

    const linkResult = await invokeCli(['help', 'link'])
    expect(linkResult.exitCode).toBe(1)
    expect(linkResult.stderr).toContain('Unknown command: link')

    const contextResult = await invokeCli(['help', 'context'])
    expect(contextResult.exitCode).toBe(1)
    expect(contextResult.stderr).toContain('Unknown command: context')
  })
})
