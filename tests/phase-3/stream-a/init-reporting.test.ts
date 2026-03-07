import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

import { executeScaffold } from '../../../src/init/archive-engine'
import { readManifest, MANIFEST_RELATIVE_PATH } from '../../../src/doctor/manifest'
import type { InitOptions } from '../../../src/init/types'

function createMinimalOptions(projectName: string = 'test-project'): InitOptions {
  return {
    projectName,
    git: {
      hasExistingRepository: false,
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
      selected: [],
      detectedExisting: [],
      shouldArchiveExistingAgentFiles: false,
      ensureClaudeEntryPoint: true,
    },
    confirmation: {
      confirmed: true,
    },
  }
}

describe('T-A.3.1: init summary reports manifest creation', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'init-test-'))
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  it('includes manifest in createdFiles result', async () => {
    const options = createMinimalOptions()

    const result = await executeScaffold(tempDir, options)

    expect(result.createdFiles).toContain('docs/.blueprint/manifest.json')
  })

  it('manifest exists after scaffold', async () => {
    const options = createMinimalOptions()

    await executeScaffold(tempDir, options)

    const manifestPath = path.join(tempDir, MANIFEST_RELATIVE_PATH)
    expect(fs.existsSync(manifestPath)).toBe(true)
  })
})

describe('T-A.3.2: init summary lists managed agent set', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'init-test-'))
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  it('returns managedAgents in result', async () => {
    const options = createMinimalOptions()
    options.agents.selected = ['CLAUDE.md', 'AGENTS.md', 'GEMINI.md']

    const result = await executeScaffold(tempDir, options)

    expect(result.managedAgents).toEqual(['CLAUDE.md', 'AGENTS.md', 'GEMINI.md'])
  })

  it('always includes CLAUDE.md in managedAgents', async () => {
    const options = createMinimalOptions()
    options.agents.selected = ['AGENTS.md']

    const result = await executeScaffold(tempDir, options)

    expect(result.managedAgents).toContain('CLAUDE.md')
    expect(result.managedAgents).toContain('AGENTS.md')
  })

  it('managedAgents matches manifest managedFiles', async () => {
    const options = createMinimalOptions()
    options.agents.selected = ['CLAUDE.md', 'QWEN.md']

    await executeScaffold(tempDir, options)

    const manifestState = await readManifest(tempDir)
    expect(manifestState.present).toBe(true)
    if (manifestState.present) {
      const result = await executeScaffold(tempDir, options)
      expect(result.managedAgents).toEqual(manifestState.data.managedFiles)
    }
  })

  it('reports empty managedAgents when no agents selected', async () => {
    const options = createMinimalOptions()
    options.agents.selected = []

    const result = await executeScaffold(tempDir, options)

    expect(result.managedAgents).toContain('CLAUDE.md')
  })
})
