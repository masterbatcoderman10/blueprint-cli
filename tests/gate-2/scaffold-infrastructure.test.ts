import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { describe, expect, it } from 'vitest'

import {
  copyFileSafe,
  directoryExists,
  moveFileSafe,
  safeMkdirP,
  scanMarkdownFiles,
} from '../../src/init/fs-utils'
import { clackPromptApi } from '../../src/init/prompts'
import { defaultArchiveDirectoryName } from '../../src/init/types'
import {
  type AgentFileName,
  type InitOptions,
  type OnboardingStep,
  type ScaffoldResult,
} from '../../src/init/types'

describe('Gate 2.0 — Scaffold Infrastructure', () => {
  it('T-2.0.1: exposes required @clack/prompts APIs', () => {
    expect(typeof clackPromptApi.intro).toBe('function')
    expect(typeof clackPromptApi.text).toBe('function')
    expect(typeof clackPromptApi.select).toBe('function')
    expect(typeof clackPromptApi.multiselect).toBe('function')
    expect(typeof clackPromptApi.confirm).toBe('function')
    expect(typeof clackPromptApi.outro).toBe('function')
  })

  it('T-2.0.2: shared init types are importable and constructible', async () => {
    const selectedAgents: AgentFileName[] = ['CLAUDE.md', 'GEMINI.md']

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
        selected: selectedAgents,
        detectedExisting: ['AGENTS.md'],
        shouldArchiveExistingAgentFiles: true,
        ensureClaudeEntryPoint: true,
      },
      confirmation: {
        confirmed: true,
      },
    }

    const step: OnboardingStep<InitOptions> = {
      id: 'confirm',
      label: 'Confirm plan',
      run: async (state) => state,
    }

    const result: ScaffoldResult = {
      createdDirectories: ['docs', 'docs/core', 'docs/knowledge-base', 'docs/milestones'],
      createdFiles: ['docs/project-progress.md'],
      archivedPaths: ['knowledge-base/docs-archived'],
      movedPaths: ['knowledge-base/README.md'],
      copiedPaths: [],
      gitInitialized: true,
      mainBranchConfigured: true,
    }

    expect(options.projectName).toBe('my-project')
    await expect(step.run(options)).resolves.toEqual(options)
    expect(result.gitInitialized).toBe(true)
    expect(defaultArchiveDirectoryName).toBe('docs-archived')
  })

  it('T-2.0.3.1: recursive markdown scanner finds markdown files in nested directories', async () => {
    const root = await mkdtemp(join(tmpdir(), 'blueprint-gate2-'))

    try {
      await mkdir(join(root, 'docs', 'nested'), { recursive: true })
      await writeFile(join(root, 'README.md'), '# Root')
      await writeFile(join(root, 'docs', 'guide.md'), '# Guide')
      await writeFile(join(root, 'docs', 'nested', 'spec.md'), '# Spec')
      await writeFile(join(root, 'docs', 'nested', 'note.txt'), 'ignore')

      const found = await scanMarkdownFiles(root)

      expect(found.sort()).toEqual(
        [join(root, 'README.md'), join(root, 'docs', 'guide.md'), join(root, 'docs', 'nested', 'spec.md')].sort(),
      )
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  it('T-2.0.3.2: recursive markdown scanner excludes ignored directories', async () => {
    const root = await mkdtemp(join(tmpdir(), 'blueprint-gate2-'))

    try {
      await mkdir(join(root, 'node_modules', 'pkg'), { recursive: true })
      await mkdir(join(root, 'dist'), { recursive: true })
      await mkdir(join(root, '.git'), { recursive: true })
      await mkdir(join(root, 'build'), { recursive: true })
      await mkdir(join(root, 'docs'), { recursive: true })

      await writeFile(join(root, 'node_modules', 'pkg', 'module.md'), 'ignored')
      await writeFile(join(root, 'dist', 'bundle.md'), 'ignored')
      await writeFile(join(root, '.git', 'history.md'), 'ignored')
      await writeFile(join(root, 'build', 'artifact.md'), 'ignored')
      await writeFile(join(root, 'docs', 'keep.md'), '# keep')

      const found = await scanMarkdownFiles(root)

      expect(found).toEqual([join(root, 'docs', 'keep.md')])
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  it('T-2.0.3.3: directoryExists reports existing and missing directories', async () => {
    const root = await mkdtemp(join(tmpdir(), 'blueprint-gate2-'))

    try {
      const existingDir = join(root, 'exists')
      const missingDir = join(root, 'missing')

      await mkdir(existingDir, { recursive: true })

      await expect(directoryExists(existingDir)).resolves.toBe(true)
      await expect(directoryExists(missingDir)).resolves.toBe(false)
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  it('T-2.0.3.4: safeMkdirP creates nested directory structures', async () => {
    const root = await mkdtemp(join(tmpdir(), 'blueprint-gate2-'))

    try {
      const nestedDir = join(root, 'docs', 'knowledge-base', 'deep')

      await safeMkdirP(nestedDir)

      const stats = await stat(nestedDir)
      expect(stats.isDirectory()).toBe(true)
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  it('T-2.0.3.5: copyFileSafe copies file content accurately', async () => {
    const root = await mkdtemp(join(tmpdir(), 'blueprint-gate2-'))

    try {
      const sourcePath = join(root, 'source.md')
      const destinationPath = join(root, 'target', 'copied.md')

      await writeFile(sourcePath, '# copied-content')
      await copyFileSafe(sourcePath, destinationPath)

      const copied = await readFile(destinationPath, 'utf8')
      expect(copied).toBe('# copied-content')
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  it('T-2.0.3.6: moveFileSafe moves file and removes source', async () => {
    const root = await mkdtemp(join(tmpdir(), 'blueprint-gate2-'))

    try {
      const sourcePath = join(root, 'source.md')
      const destinationPath = join(root, 'target', 'moved.md')

      await writeFile(sourcePath, '# moved-content')
      await moveFileSafe(sourcePath, destinationPath)

      const moved = await readFile(destinationPath, 'utf8')
      expect(moved).toBe('# moved-content')
      await expect(stat(sourcePath)).rejects.toThrow()
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})
