import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { describe, expect, it, vi } from 'vitest'

import {
  buildAgentArchivePromptMessage,
  buildDocsReplacementWarningMessage,
  buildConfirmationSummaryLines,
  confirmationSummaryNoteTitle,
  detectedAgentFilesNoteTitle,
  discoverMarkdownFilesForMigration,
  detectExistingAgentFiles,
  detectExistingDocsDirectory,
  detectExistingGitRepository,
  formatDiscoveredMarkdownPaths,
  markdownDiscoveryNoteTitle,
  promptAgentSelectionChoice,
  promptConfirmation,
  promptMarkdownMigrationChoice,
  promptDocsArchiveChoice,
  missingGitRepositoryWarning,
  promptGitInitializationChoice,
  validateProjectName,
} from '../../../src/init/onboarding'
import { clackPromptApi } from '../../../src/init/prompts'
import { type InitOptions } from '../../../src/init/types'

describe('Phase 2 Stream B — Interactive Onboarding Flow', () => {
  it('T-B.1.1: project name validation rejects empty string input', () => {
    expect(validateProjectName('')).toBe('Project name is required.')
    expect(validateProjectName('   ')).toBe('Project name is required.')
  })

  it('T-B.1.2: project name validation accepts valid non-empty string', () => {
    expect(validateProjectName('my-project')).toBeUndefined()
  })

  it('T-B.2.1: git detection returns true when .git directory exists', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'blueprint-stream-b-'))

    try {
      await mkdir(join(rootDir, '.git'))
      await expect(detectExistingGitRepository(rootDir)).resolves.toBe(true)
    } finally {
      await rm(rootDir, { recursive: true, force: true })
    }
  })

  it('T-B.2.2: git detection returns false when .git directory is absent', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'blueprint-stream-b-'))

    try {
      await expect(detectExistingGitRepository(rootDir)).resolves.toBe(false)
    } finally {
      await rm(rootDir, { recursive: true, force: true })
    }
  })

  it('T-B.2.3: git onboarding shows missing-repo warning before confirmation', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'blueprint-stream-b-'))
    const originalNote = clackPromptApi.note
    const originalConfirm = clackPromptApi.confirm
    const noteMock = vi.fn()
    const confirmMock = vi.fn().mockResolvedValue(true)

    clackPromptApi.note = noteMock as typeof clackPromptApi.note
    clackPromptApi.confirm = confirmMock as typeof clackPromptApi.confirm

    try {
      const choice = await promptGitInitializationChoice(rootDir)

      expect(noteMock).toHaveBeenCalledWith(missingGitRepositoryWarning, 'Git Setup')
      expect(confirmMock).toHaveBeenCalledTimes(1)
      expect(choice.warningMessage).toBe(missingGitRepositoryWarning)
      expect(choice.shouldInitialize).toBe(true)
    } finally {
      clackPromptApi.note = originalNote
      clackPromptApi.confirm = originalConfirm
      await rm(rootDir, { recursive: true, force: true })
    }
  })

  it('T-B.2.4: git onboarding skips warning/prompt when repository already exists', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'blueprint-stream-b-'))
    const originalNote = clackPromptApi.note
    const originalConfirm = clackPromptApi.confirm
    const noteMock = vi.fn()
    const confirmMock = vi.fn().mockResolvedValue(true)

    clackPromptApi.note = noteMock as typeof clackPromptApi.note
    clackPromptApi.confirm = confirmMock as typeof clackPromptApi.confirm

    try {
      await mkdir(join(rootDir, '.git'))
      const choice = await promptGitInitializationChoice(rootDir)

      expect(noteMock).not.toHaveBeenCalled()
      expect(confirmMock).not.toHaveBeenCalled()
      expect(choice.hasExistingRepository).toBe(true)
      expect(choice.shouldInitialize).toBe(false)
    } finally {
      clackPromptApi.note = originalNote
      clackPromptApi.confirm = originalConfirm
      await rm(rootDir, { recursive: true, force: true })
    }
  })

  it('T-B.3: existing docs detection identifies presence and absence of docs directory', async () => {
    const withDocs = await mkdtemp(join(tmpdir(), 'blueprint-stream-b-'))
    const withoutDocs = await mkdtemp(join(tmpdir(), 'blueprint-stream-b-'))

    try {
      await mkdir(join(withDocs, 'docs'))

      await expect(detectExistingDocsDirectory(withDocs)).resolves.toBe(true)
      await expect(detectExistingDocsDirectory(withoutDocs)).resolves.toBe(false)
    } finally {
      await rm(withDocs, { recursive: true, force: true })
      await rm(withoutDocs, { recursive: true, force: true })
    }
  })

  it('T-B.3.1: docs onboarding renders replacement warning and prompts archive choice', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'blueprint-stream-b-'))
    const originalNote = clackPromptApi.note
    const originalConfirm = clackPromptApi.confirm
    const noteMock = vi.fn()
    const confirmMock = vi.fn().mockResolvedValue(true)

    clackPromptApi.note = noteMock as typeof clackPromptApi.note
    clackPromptApi.confirm = confirmMock as typeof clackPromptApi.confirm

    try {
      await mkdir(join(rootDir, 'docs'))
      const choice = await promptDocsArchiveChoice(rootDir)

      expect(noteMock).toHaveBeenCalledWith(buildDocsReplacementWarningMessage('docs-archived'), 'Docs Setup')
      expect(confirmMock).toHaveBeenCalledTimes(1)
      expect(choice.warningMessage).toBe(buildDocsReplacementWarningMessage('docs-archived'))
      expect(choice.shouldArchiveExistingDocs).toBe(true)
    } finally {
      clackPromptApi.note = originalNote
      clackPromptApi.confirm = originalConfirm
      await rm(rootDir, { recursive: true, force: true })
    }
  })

  it('T-B.3.2: docs onboarding skips warning and prompt when docs directory is absent', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'blueprint-stream-b-'))
    const originalNote = clackPromptApi.note
    const originalConfirm = clackPromptApi.confirm
    const noteMock = vi.fn()
    const confirmMock = vi.fn().mockResolvedValue(true)

    clackPromptApi.note = noteMock as typeof clackPromptApi.note
    clackPromptApi.confirm = confirmMock as typeof clackPromptApi.confirm

    try {
      const choice = await promptDocsArchiveChoice(rootDir)

      expect(noteMock).not.toHaveBeenCalled()
      expect(confirmMock).not.toHaveBeenCalled()
      expect(choice.hasExistingDocsDirectory).toBe(false)
      expect(choice.shouldArchiveExistingDocs).toBe(false)
    } finally {
      clackPromptApi.note = originalNote
      clackPromptApi.confirm = originalConfirm
      await rm(rootDir, { recursive: true, force: true })
    }
  })

  it('T-B.4: markdown file scanner returns fixture markdown files and excludes ignored directories', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'blueprint-stream-b-'))

    try {
      await mkdir(join(rootDir, 'notes'), { recursive: true })
      await mkdir(join(rootDir, 'docs', 'nested'), { recursive: true })
      await mkdir(join(rootDir, 'node_modules', 'pkg'), { recursive: true })
      await mkdir(join(rootDir, 'dist'), { recursive: true })
      await mkdir(join(rootDir, '.git'), { recursive: true })

      await writeFile(join(rootDir, 'README.md'), '# root')
      await writeFile(join(rootDir, 'notes', 'design.md'), '# notes')
      await writeFile(join(rootDir, 'docs', 'nested', 'guide.md'), '# guide')
      await writeFile(join(rootDir, 'notes', 'todo.txt'), 'not markdown')
      await writeFile(join(rootDir, 'node_modules', 'pkg', 'ignored.md'), '# ignored')
      await writeFile(join(rootDir, 'dist', 'bundle.md'), '# ignored')
      await writeFile(join(rootDir, '.git', 'history.md'), '# ignored')

      await expect(discoverMarkdownFilesForMigration(rootDir)).resolves.toEqual([
        join(rootDir, 'README.md'),
        join(rootDir, 'docs', 'nested', 'guide.md'),
        join(rootDir, 'notes', 'design.md'),
      ])
    } finally {
      await rm(rootDir, { recursive: true, force: true })
    }
  })

  it('T-B.4.1: global markdown prompt shows discovered files before transfer mode decision', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'blueprint-stream-b-'))
    const originalNote = clackPromptApi.note
    const originalSelect = clackPromptApi.select
    const originalMultiselect = clackPromptApi.multiselect
    const noteMock = vi.fn()
    const selectMock = vi.fn().mockResolvedValueOnce('global').mockResolvedValueOnce('move')
    const multiselectMock = vi.fn()

    clackPromptApi.note = noteMock as typeof clackPromptApi.note
    clackPromptApi.select = selectMock as typeof clackPromptApi.select
    clackPromptApi.multiselect = multiselectMock as typeof clackPromptApi.multiselect

    try {
      await writeFile(join(rootDir, 'README.md'), '# readme')
      await mkdir(join(rootDir, 'notes'), { recursive: true })
      await writeFile(join(rootDir, 'notes', 'spec.md'), '# spec')

      const result = await promptMarkdownMigrationChoice(rootDir)

      const expectedPaths = [join(rootDir, 'README.md'), join(rootDir, 'notes', 'spec.md')]
      expect(noteMock).toHaveBeenCalledWith(formatDiscoveredMarkdownPaths(expectedPaths), markdownDiscoveryNoteTitle)
      expect(result.selectionScope).toBe('global')
      expect(result.transferMode).toBe('move')
      expect(result.selectedPaths).toEqual(expectedPaths)
      expect(multiselectMock).not.toHaveBeenCalled()
    } finally {
      clackPromptApi.note = originalNote
      clackPromptApi.select = originalSelect
      clackPromptApi.multiselect = originalMultiselect
      await rm(rootDir, { recursive: true, force: true })
    }
  })

  it('T-B.4.2: per-file markdown prompt uses explicit file selection', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'blueprint-stream-b-'))
    const originalNote = clackPromptApi.note
    const originalSelect = clackPromptApi.select
    const originalMultiselect = clackPromptApi.multiselect
    const noteMock = vi.fn()
    const selectMock = vi.fn().mockResolvedValueOnce('per-file').mockResolvedValueOnce('copy')
    const multiselectMock = vi.fn().mockResolvedValueOnce([join(rootDir, 'README.md')])

    clackPromptApi.note = noteMock as typeof clackPromptApi.note
    clackPromptApi.select = selectMock as typeof clackPromptApi.select
    clackPromptApi.multiselect = multiselectMock as typeof clackPromptApi.multiselect

    try {
      await writeFile(join(rootDir, 'README.md'), '# readme')
      await mkdir(join(rootDir, 'notes'), { recursive: true })
      await writeFile(join(rootDir, 'notes', 'spec.md'), '# spec')

      const result = await promptMarkdownMigrationChoice(rootDir)

      expect(result.selectionScope).toBe('per-file')
      expect(result.transferMode).toBe('copy')
      expect(result.selectedPaths).toEqual([join(rootDir, 'README.md')])
      expect(noteMock).toHaveBeenCalledTimes(1)
      expect(multiselectMock).toHaveBeenCalledTimes(1)
    } finally {
      clackPromptApi.note = originalNote
      clackPromptApi.select = originalSelect
      clackPromptApi.multiselect = originalMultiselect
      await rm(rootDir, { recursive: true, force: true })
    }
  })

  it('T-B.5.1: agent file detection identifies existing agent files at project root', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'blueprint-stream-b-'))

    try {
      await writeFile(join(rootDir, 'CLAUDE.md'), '# claude')
      await writeFile(join(rootDir, 'GEMINI.md'), '# gemini')
      await writeFile(join(rootDir, 'README.md'), '# readme')
      await mkdir(join(rootDir, 'nested'), { recursive: true })
      await writeFile(join(rootDir, 'nested', 'AGENTS.md'), '# nested')

      await expect(detectExistingAgentFiles(rootDir)).resolves.toEqual(['CLAUDE.md', 'GEMINI.md'])
    } finally {
      await rm(rootDir, { recursive: true, force: true })
    }
  })

  it('T-B.5.2: agent file detection returns empty list when no agent files exist', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'blueprint-stream-b-'))

    try {
      await writeFile(join(rootDir, 'README.md'), '# readme')
      await expect(detectExistingAgentFiles(rootDir)).resolves.toEqual([])
    } finally {
      await rm(rootDir, { recursive: true, force: true })
    }
  })

  it('T-B.5.3: agent onboarding shows detected files and explicit archive destination', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'blueprint-stream-b-'))
    const originalNote = clackPromptApi.note
    const originalConfirm = clackPromptApi.confirm
    const originalMultiselect = clackPromptApi.multiselect
    const noteMock = vi.fn()
    const confirmMock = vi.fn().mockResolvedValue(true)
    const multiselectMock = vi.fn().mockResolvedValue(['GEMINI.md'])

    clackPromptApi.note = noteMock as typeof clackPromptApi.note
    clackPromptApi.confirm = confirmMock as typeof clackPromptApi.confirm
    clackPromptApi.multiselect = multiselectMock as typeof clackPromptApi.multiselect

    try {
      await writeFile(join(rootDir, 'CLAUDE.md'), '# claude')
      await writeFile(join(rootDir, 'AGENTS.md'), '# agents')

      const result = await promptAgentSelectionChoice(rootDir)

      expect(noteMock).toHaveBeenCalledWith('- CLAUDE.md\n- AGENTS.md', detectedAgentFilesNoteTitle)
      expect(confirmMock).toHaveBeenCalledWith({
        message: buildAgentArchivePromptMessage(['CLAUDE.md', 'AGENTS.md']),
        initialValue: true,
      })
      expect(result.detectedExisting).toEqual(['CLAUDE.md', 'AGENTS.md'])
      expect(result.selected).toEqual(['CLAUDE.md', 'GEMINI.md'])
      expect(result.shouldArchiveExistingAgentFiles).toBe(true)
    } finally {
      clackPromptApi.note = originalNote
      clackPromptApi.confirm = originalConfirm
      clackPromptApi.multiselect = originalMultiselect
      await rm(rootDir, { recursive: true, force: true })
    }
  })

  it('T-B.5.4: agent onboarding skips archive confirmation when no agent files are detected', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'blueprint-stream-b-'))
    const originalNote = clackPromptApi.note
    const originalConfirm = clackPromptApi.confirm
    const originalMultiselect = clackPromptApi.multiselect
    const noteMock = vi.fn()
    const confirmMock = vi.fn()
    const multiselectMock = vi.fn().mockResolvedValue([])

    clackPromptApi.note = noteMock as typeof clackPromptApi.note
    clackPromptApi.confirm = confirmMock as typeof clackPromptApi.confirm
    clackPromptApi.multiselect = multiselectMock as typeof clackPromptApi.multiselect

    try {
      const result = await promptAgentSelectionChoice(rootDir)

      expect(noteMock).not.toHaveBeenCalled()
      expect(confirmMock).not.toHaveBeenCalled()
      expect(result.detectedExisting).toEqual([])
      expect(result.selected).toEqual(['CLAUDE.md'])
    } finally {
      clackPromptApi.note = originalNote
      clackPromptApi.confirm = originalConfirm
      clackPromptApi.multiselect = originalMultiselect
      await rm(rootDir, { recursive: true, force: true })
    }
  })

  it('T-B.6: confirmation summary generator includes planned creates, archives, moves, and git operations', () => {
    const options: InitOptions = {
      projectName: 'my-project',
      git: {
        hasExistingRepository: false,
        shouldInitialize: true,
        shouldSetMainBranch: true,
      },
      docs: {
        hasExistingDocsDirectory: true,
        shouldArchiveExistingDocs: true,
        archiveDirectoryName: 'docs-archived',
      },
      markdownMigration: {
        discoveredMarkdownPaths: ['README.md', 'notes/spec.md'],
        transferMode: 'move',
        selectedPaths: ['README.md'],
      },
      agents: {
        selected: ['CLAUDE.md', 'GEMINI.md'],
        detectedExisting: ['AGENTS.md'],
        shouldArchiveExistingAgentFiles: true,
        ensureClaudeEntryPoint: true,
      },
      confirmation: {
        confirmed: false,
      },
    }

    const summary = buildConfirmationSummaryLines(options)

    expect(summary).toContain('Create: Blueprint docs scaffold for "my-project"')
    expect(summary).toContain('Archive: docs/ -> knowledge-base/docs-archived')
    expect(summary).toContain('Archive: AGENTS.md -> knowledge-base/AGENTS.md')
    expect(summary).toContain('Move: README.md -> knowledge-base/README.md')
    expect(summary).toContain('Skip: markdown file not selected -> notes/spec.md')
    expect(summary).toContain('Git: run `git init`')
    expect(summary).toContain('Git: run `git branch -M main`')
  })

  it('T-B.6.1: confirmation summary enumerates explicit overwrite actions when archival is declined', () => {
    const options: InitOptions = {
      projectName: 'my-project',
      git: {
        hasExistingRepository: false,
        shouldInitialize: false,
        shouldSetMainBranch: false,
      },
      docs: {
        hasExistingDocsDirectory: true,
        shouldArchiveExistingDocs: false,
        archiveDirectoryName: 'docs-archived',
      },
      markdownMigration: {
        discoveredMarkdownPaths: ['README.md'],
        transferMode: 'skip',
        selectedPaths: [],
      },
      agents: {
        selected: ['CLAUDE.md'],
        detectedExisting: ['CLAUDE.md', 'GEMINI.md'],
        shouldArchiveExistingAgentFiles: false,
        ensureClaudeEntryPoint: true,
      },
      confirmation: {
        confirmed: false,
      },
    }

    const summary = buildConfirmationSummaryLines(options)

    expect(summary).toContain('Overwrite: existing docs/ will be replaced (no archive)')
    expect(summary).toContain('Overwrite: CLAUDE.md at project root (no archive)')
    expect(summary).toContain('Overwrite: GEMINI.md at project root (no archive)')
    expect(summary).toContain('Skip: markdown file -> README.md')
    expect(summary).toContain('Git: initialization declined')
  })

  it('T-B.6.2: confirmation prompt renders summary via clack note output', async () => {
    const options: InitOptions = {
      projectName: 'my-project',
      git: {
        hasExistingRepository: true,
        shouldInitialize: false,
        shouldSetMainBranch: false,
      },
      docs: {
        hasExistingDocsDirectory: false,
        shouldArchiveExistingDocs: false,
        archiveDirectoryName: 'docs-archived',
      },
      markdownMigration: {
        discoveredMarkdownPaths: [],
        transferMode: 'skip',
        selectedPaths: [],
      },
      agents: {
        selected: ['CLAUDE.md'],
        detectedExisting: [],
        shouldArchiveExistingAgentFiles: false,
        ensureClaudeEntryPoint: true,
      },
      confirmation: {
        confirmed: false,
      },
    }

    const originalNote = clackPromptApi.note
    const originalConfirm = clackPromptApi.confirm
    const noteMock = vi.fn()
    const confirmMock = vi.fn().mockResolvedValue(true)
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    clackPromptApi.note = noteMock as typeof clackPromptApi.note
    clackPromptApi.confirm = confirmMock as typeof clackPromptApi.confirm

    try {
      await expect(promptConfirmation(options)).resolves.toBe(true)

      expect(noteMock).toHaveBeenCalledTimes(1)
      expect(noteMock.mock.calls[0]?.[1]).toBe(confirmationSummaryNoteTitle)
      expect(confirmMock).toHaveBeenCalledTimes(1)
      expect(consoleSpy).not.toHaveBeenCalled()
    } finally {
      clackPromptApi.note = originalNote
      clackPromptApi.confirm = originalConfirm
      consoleSpy.mockRestore()
    }
  })
})
