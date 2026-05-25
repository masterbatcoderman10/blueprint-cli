import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  promptForMode,
  modePromptMessage,
  modeSkillLabel,
  modeLegacyLabel,
} from '../../../src/init/onboarding'
import { clackPromptApi } from '../../../src/init/prompts'
import type { Mode } from '../../../src/init/types'

describe('T-R11-1.D.1 — Mode prompt in init flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('T-R11-1.D.1.1: mode prompt presents correct options with skill as default', async () => {
    const selectSpy = vi.spyOn(clackPromptApi, 'select').mockResolvedValue('skill' as Mode)

    const result = await promptForMode()

    expect(selectSpy).toHaveBeenCalledTimes(1)
    const callArgs = selectSpy.mock.calls[0][0]

    expect(callArgs.message).toBe(modePromptMessage)
    expect(callArgs.options).toHaveLength(2)

    const skillOption = callArgs.options[0] as { value: Mode; label: string; hint?: string }
    const legacyOption = callArgs.options[1] as { value: Mode; label: string; hint?: string }

    expect(skillOption.value).toBe('skill')
    expect(skillOption.label).toBe(modeSkillLabel)
    expect(legacyOption.value).toBe('legacy')
    expect(legacyOption.label).toBe(modeLegacyLabel)

    // Default should be 'skill' (first option, selected by pressing return)
    expect(callArgs.initialValue).toBe('skill')

    expect(result).toBe('skill')
  })

  it('T-R11-1.D.1.2: selecting each option threads the correct Mode value into answers', async () => {
    // Test skill selection
    vi.spyOn(clackPromptApi, 'select').mockResolvedValue('skill' as Mode)
    const skillResult = await promptForMode()
    expect(skillResult).toBe('skill')

    vi.restoreAllMocks()

    // Test legacy selection
    vi.spyOn(clackPromptApi, 'select').mockResolvedValue('legacy' as Mode)
    const legacyResult = await promptForMode()
    expect(legacyResult).toBe('legacy')
  })

  it('T-R11-1.D.1.3: throws on cancellation (symbol return)', async () => {
    vi.spyOn(clackPromptApi, 'select').mockResolvedValue(Symbol('cancel') as unknown as Mode)

    await expect(promptForMode()).rejects.toThrow('Initialization cancelled during mode selection.')
  })
})
