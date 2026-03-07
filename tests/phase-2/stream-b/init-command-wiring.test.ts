import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { describe, expect, it, vi } from 'vitest'

import { initCommand } from '../../../src/commands/init'
import { clackPromptApi } from '../../../src/init/prompts'

describe('Phase 2 Stream B — Init Command Wiring', () => {
  it('T-B.6.3: init command executes onboarding sequence through final confirmation', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'blueprint-stream-b-init-'))

    const originalIntro = clackPromptApi.intro
    const originalText = clackPromptApi.text
    const originalSelect = clackPromptApi.select
    const originalMultiselect = clackPromptApi.multiselect
    const originalConfirm = clackPromptApi.confirm
    const originalNote = clackPromptApi.note
    const originalCwd = process.cwd

    const introMock = vi.fn()
    const textMock = vi.fn().mockResolvedValue('my-project')
    const selectMock = vi.fn().mockResolvedValueOnce('global').mockResolvedValueOnce('move')
    const multiselectMock = vi.fn().mockResolvedValue(['GEMINI.md'])
    const confirmMock = vi
      .fn()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
    const noteMock = vi.fn()

    clackPromptApi.intro = introMock as typeof clackPromptApi.intro
    clackPromptApi.text = textMock as typeof clackPromptApi.text
    clackPromptApi.select = selectMock as typeof clackPromptApi.select
    clackPromptApi.multiselect = multiselectMock as typeof clackPromptApi.multiselect
    clackPromptApi.confirm = confirmMock as typeof clackPromptApi.confirm
    clackPromptApi.note = noteMock as typeof clackPromptApi.note
    process.cwd = (() => rootDir) as typeof process.cwd

    try {
      await mkdir(join(rootDir, 'docs'), { recursive: true })
      await writeFile(join(rootDir, 'README.md'), '# readme')
      await writeFile(join(rootDir, 'AGENTS.md'), '# agents')

      const result = await initCommand.handler({
        commandName: 'init',
        args: [],
        rawArgv: ['init'],
      })

      expect(result).toEqual({ exitCode: 0 })
      expect(introMock).toHaveBeenCalledTimes(1)
      expect(textMock).toHaveBeenCalledTimes(1)
      expect(selectMock).toHaveBeenCalledTimes(2)
      expect(multiselectMock).toHaveBeenCalledTimes(1)
      expect(confirmMock).toHaveBeenCalledTimes(4)
      expect(noteMock).toHaveBeenCalled()
    } finally {
      clackPromptApi.intro = originalIntro
      clackPromptApi.text = originalText
      clackPromptApi.select = originalSelect
      clackPromptApi.multiselect = originalMultiselect
      clackPromptApi.confirm = originalConfirm
      clackPromptApi.note = originalNote
      process.cwd = originalCwd
      await rm(rootDir, { recursive: true, force: true })
    }
  })
})
