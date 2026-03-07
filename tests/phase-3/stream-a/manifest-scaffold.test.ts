import { describe, it, expect, beforeEach, afterEach } from 'vitest'
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

describe('T-A.2.1: init creates manifest in freshly scaffolded project', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'init-test-'))
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  it('creates docs/.blueprint/manifest.json after scaffold', async () => {
    const options = createMinimalOptions()

    await executeScaffold(tempDir, options)

    const manifestPath = path.join(tempDir, MANIFEST_RELATIVE_PATH)
    expect(fs.existsSync(manifestPath)).toBe(true)

    const manifestState = await readManifest(tempDir)
    expect(manifestState.present).toBe(true)
  })

  it('manifest contains templateVersion, cliVersion, and managedFiles', async () => {
    const options = createMinimalOptions()

    await executeScaffold(tempDir, options)

    const manifestState = await readManifest(tempDir)
    expect(manifestState.present).toBe(true)
    if (manifestState.present) {
      expect(manifestState.data).toMatchObject({
        templateVersion: '1.0.0',
        cliVersion: '0.1.0',
        managedFiles: expect.any(Array),
      })
    }
  })
})

describe('T-A.2.2: manifest records user-selected managed agent files', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'init-test-'))
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  it('records selected agents in manifest', async () => {
    const options = createMinimalOptions()
    options.agents.selected = ['CLAUDE.md', 'AGENTS.md', 'GEMINI.md']

    await executeScaffold(tempDir, options)

    const manifestState = await readManifest(tempDir)
    expect(manifestState.present).toBe(true)
    if (manifestState.present) {
      expect(manifestState.data.managedFiles).toEqual(['CLAUDE.md', 'AGENTS.md', 'GEMINI.md'])
    }
  })

  it('excludes unselected agent files from manifest', async () => {
    const options = createMinimalOptions()
    options.agents.selected = ['CLAUDE.md']

    await executeScaffold(tempDir, options)

    const manifestState = await readManifest(tempDir)
    expect(manifestState.present).toBe(true)
    if (manifestState.present) {
      expect(manifestState.data.managedFiles).toEqual(['CLAUDE.md'])
    }
  })
})

describe('T-A.2.3: init succeeds with minimal managed agent set', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'init-test-'))
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  it('succeeds when only default entry point is selected', async () => {
    const options = createMinimalOptions()
    options.agents.selected = []

    const result = await executeScaffold(tempDir, options)

    expect(result.createdFiles).toContain('docs/.blueprint/manifest.json')

    const manifestState = await readManifest(tempDir)
    expect(manifestState.present).toBe(true)
    if (manifestState.present) {
      expect(manifestState.data.managedFiles).toContain('CLAUDE.md')
    }
  })

  it('always includes CLAUDE.md even if not explicitly selected', async () => {
    const options = createMinimalOptions()
    options.agents.selected = ['AGENTS.md']

    await executeScaffold(tempDir, options)

    const manifestState = await readManifest(tempDir)
    expect(manifestState.present).toBe(true)
    if (manifestState.present) {
      expect(manifestState.data.managedFiles).toContain('CLAUDE.md')
      expect(manifestState.data.managedFiles).toContain('AGENTS.md')
    }
  })
})
