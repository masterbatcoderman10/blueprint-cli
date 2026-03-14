import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { readManifest } from '../../../src/doctor/manifest'
import { executeScaffold } from '../../../src/init/archive-engine'
import { discoverMarkdownFilesForMigration } from '../../../src/init/onboarding'
import type { InitOptions } from '../../../src/init/types'
import { createIsolatedTempProject, pathExists } from '../../helpers/release'

function buildInitOptions(projectRoot: string, overrides: Partial<InitOptions> = {}): InitOptions {
  const baseOptions: InitOptions = {
    projectName: 'phase-4-edge',
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
      confirmed: true,
    },
  }

  return {
    ...baseOptions,
    ...overrides,
    markdownMigration: {
      ...baseOptions.markdownMigration,
      ...overrides.markdownMigration,
    },
    docs: {
      ...baseOptions.docs,
      ...overrides.docs,
    },
    git: {
      ...baseOptions.git,
      ...overrides.git,
    },
    agents: {
      ...baseOptions.agents,
      ...overrides.agents,
    },
    confirmation: {
      ...baseOptions.confirmation,
      ...overrides.confirmation,
    },
  }
}

describe('T-A.2.1: init preserves unselected user-owned markdown files', () => {
  it('moves only explicitly selected markdown files into the archive boundary', async () => {
    const project = await createIsolatedTempProject('blueprint-init-edge-')

    try {
      await project.writeFile('README.md', '# selected\n')
      await project.writeFile('notes/private.md', '# keep\n')

      await executeScaffold(
        project.rootDir,
        buildInitOptions(project.rootDir, {
          markdownMigration: {
            discoveredMarkdownPaths: [
              join(project.rootDir, 'README.md'),
              join(project.rootDir, 'notes/private.md'),
            ],
            transferMode: 'move',
            selectedPaths: [join(project.rootDir, 'README.md')],
          },
        }),
      )

      expect(await pathExists(join(project.rootDir, 'README.md'))).toBe(false)
      expect(await pathExists(join(project.rootDir, 'knowledge-base', 'README.md'))).toBe(true)
      expect(await project.readFile('notes/private.md')).toBe('# keep\n')
      expect(await pathExists(join(project.rootDir, 'knowledge-base', 'notes', 'private.md'))).toBe(false)
    } finally {
      await project.cleanup()
    }
  })
})

describe('T-A.2.2: init markdown discovery respects archive boundaries', () => {
  it('ignores markdown already stored under knowledge-base while still finding active project files', async () => {
    const project = await createIsolatedTempProject('blueprint-init-edge-')

    try {
      await project.writeFile('knowledge-base/docs-archived/legacy.md', '# archived\n')
      await project.writeFile('notes/spec.md', '# active\n')
      await project.writeFile('README.md', '# root\n')

      await expect(discoverMarkdownFilesForMigration(project.rootDir)).resolves.toEqual([
        join(project.rootDir, 'README.md'),
        join(project.rootDir, 'notes/spec.md'),
      ])
    } finally {
      await project.cleanup()
    }
  })
})

describe('T-A.2.3: init scaffold integrity under atypical valid agent selections', () => {
  it('keeps the scaffold complete when a non-default agent is selected', async () => {
    const project = await createIsolatedTempProject('blueprint-init-edge-')

    try {
      await executeScaffold(
        project.rootDir,
        buildInitOptions(project.rootDir, {
          agents: {
            selected: ['QWEN.md'],
            detectedExisting: [],
            shouldArchiveExistingAgentFiles: false,
            ensureClaudeEntryPoint: true,
          },
        }),
      )

      expect(await pathExists(join(project.rootDir, 'CLAUDE.md'))).toBe(true)
      expect(await pathExists(join(project.rootDir, 'QWEN.md'))).toBe(true)
      expect(await pathExists(join(project.rootDir, 'docs', 'core', 'execution.md'))).toBe(true)

      const manifest = await readManifest(project.rootDir)
      expect(manifest.present).toBe(true)
      if (manifest.present) {
        expect(manifest.data.managedFiles).toEqual(['CLAUDE.md', 'QWEN.md'])
      }
    } finally {
      await project.cleanup()
    }
  })
})
