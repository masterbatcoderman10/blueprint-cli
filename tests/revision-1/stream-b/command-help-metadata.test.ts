import { describe, expect, it } from 'vitest'

import { isImplementedCommand, implementedCommands } from '../../../src/help/implemented-commands'
import { invokeCli } from '../../helpers/cli'

describe('T-B.1.1: Command-help metadata for implemented commands', () => {
  it('command-help metadata exists for init, doctor, alignment-complete, and migrate', () => {
    expect(implementedCommands).toHaveLength(4)
    expect(implementedCommands.map((c) => c.name)).toEqual([
      'init',
      'doctor',
      'alignment-complete',
      'migrate',
    ])
  })

  it('command-help metadata stays separate from placeholder command definitions', () => {
    expect(isImplementedCommand('init')).toBe(true)
    expect(isImplementedCommand('doctor')).toBe(true)
    expect(isImplementedCommand('alignment-complete')).toBe(true)
    expect(isImplementedCommand('migrate')).toBe(true)
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

    const alignmentResult = await invokeCli(['help', 'alignment-complete'])
    expect(alignmentResult.exitCode).toBe(0)
    expect(alignmentResult.stdout).toContain('alignment-complete')

    const migrateResult = await invokeCli(['help', 'migrate'])
    expect(migrateResult.exitCode).toBe(0)
    expect(migrateResult.stdout).toContain('migrate')

    const linkResult = await invokeCli(['help', 'link'])
    expect(linkResult.exitCode).toBe(1)
    expect(linkResult.stderr).toContain('Unknown command: link')

    const contextResult = await invokeCli(['help', 'context'])
    expect(contextResult.exitCode).toBe(1)
    expect(contextResult.stderr).toContain('Unknown command: context')
  })
})

describe('T-B.2.1: blueprint help <command> renders command-level guidance', () => {
  it('blueprint help init renders command-level usage guidance', async () => {
    const result = await invokeCli(['help', 'init'])

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('Usage: blueprint init')
    expect(result.stdout).toContain('Scaffold')
    expect(result.stderr).toBe('')
  })

  it('blueprint help doctor renders command-level usage guidance', async () => {
    const result = await invokeCli(['help', 'doctor'])

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('Usage: blueprint doctor')
    expect(result.stdout).toContain('Audit')
    expect(result.stderr).toBe('')
  })
})

describe('T-B.3.1 and T-B.3.2: <command> --help renders help without executing', () => {
  it('blueprint init --help renders help without executing onboarding or scaffold', async () => {
    const result = await invokeCli(['init', '--help'])

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('Usage: blueprint init')
    expect(result.stdout).toContain('Scaffold')
    expect(result.stderr).toBe('')
    expect(result.stdout).not.toContain('project name')
    expect(result.stdout).not.toContain('Blueprint initialization complete')
  })

  it('blueprint doctor --help renders help without running audit, repair, or prompts', async () => {
    const result = await invokeCli(['doctor', '--help'])

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('Usage: blueprint doctor')
    expect(result.stdout).toContain('Audit')
    expect(result.stderr).toBe('')
    expect(result.stdout).not.toContain('Checking')
    expect(result.stdout).not.toContain('Issues found')
  })
})
