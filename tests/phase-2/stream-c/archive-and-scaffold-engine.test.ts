import { mkdir, mkdtemp, rm, writeFile, readFile, access } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { execSync } from 'node:child_process'

import { describe, expect, it, beforeEach, afterEach } from 'vitest'

import {
  archiveDocsDirectory,
  archiveAgentFiles,
  moveMarkdownFiles,
  copyMarkdownFiles,
  scaffoldBlueprintDirectory,
  copyCoreTemplates,
  copyEditableShells,
  generateAgentFiles,
  initializeGitRepository,
  executeScaffold,
} from '../../../src/init/archive-engine'
import { type InitOptions, defaultArchiveDirectoryName } from '../../../src/init/types'
import { directoryExists, scanMarkdownFiles } from '../../../src/init/fs-utils'

describe('Phase 2 Stream C — Archive and Scaffold Engine', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'blueprint-stream-c-'))
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  describe('Archive Engine', () => {
    describe('T-C.1.1: Archive engine moves existing docs/ to knowledge-base/docs-archived', () => {
      it('archives docs/ directory when it exists and shouldArchiveExistingDocs is true', async () => {
        const docsDir = join(tempDir, 'docs')
        const docsContentFile = join(docsDir, 'existing-doc.md')
        
        await mkdir(docsDir, { recursive: true })
        await writeFile(docsContentFile, '# Existing Docs Content')

        const options: InitOptions = {
          projectName: 'test-project',
          git: { hasExistingRepository: true, shouldInitialize: false, shouldSetMainBranch: false },
          docs: {
            hasExistingDocsDirectory: true,
            shouldArchiveExistingDocs: true,
            archiveDirectoryName: defaultArchiveDirectoryName,
          },
          markdownMigration: { discoveredMarkdownPaths: [], transferMode: 'skip', selectedPaths: [] },
          agents: { selected: ['CLAUDE.md'], detectedExisting: [], shouldArchiveExistingAgentFiles: false, ensureClaudeEntryPoint: true },
          confirmation: { confirmed: true },
        }

        await archiveDocsDirectory(tempDir, options)

        const archivedDir = join(tempDir, 'knowledge-base', defaultArchiveDirectoryName)
        const archivedFile = join(archivedDir, 'existing-doc.md')
        
        await expect(access(archivedFile)).resolves.toBeUndefined()
        await expect(access(docsDir)).rejects.toThrow()
      })

      it('skips archiving when docs/ does not exist', async () => {
        const options: InitOptions = {
          projectName: 'test-project',
          git: { hasExistingRepository: true, shouldInitialize: false, shouldSetMainBranch: false },
          docs: {
            hasExistingDocsDirectory: false,
            shouldArchiveExistingDocs: false,
            archiveDirectoryName: defaultArchiveDirectoryName,
          },
          markdownMigration: { discoveredMarkdownPaths: [], transferMode: 'skip', selectedPaths: [] },
          agents: { selected: ['CLAUDE.md'], detectedExisting: [], shouldArchiveExistingAgentFiles: false, ensureClaudeEntryPoint: true },
          confirmation: { confirmed: true },
        }

        await expect(archiveDocsDirectory(tempDir, options)).resolves.not.toThrow()
      })

      it('skips archiving when shouldArchiveExistingDocs is false', async () => {
        const docsDir = join(tempDir, 'docs')
        await mkdir(docsDir, { recursive: true })
        await writeFile(join(docsDir, 'existing-doc.md'), '# Content')

        const options: InitOptions = {
          projectName: 'test-project',
          git: { hasExistingRepository: true, shouldInitialize: false, shouldSetMainBranch: false },
          docs: {
            hasExistingDocsDirectory: true,
            shouldArchiveExistingDocs: false,
            archiveDirectoryName: defaultArchiveDirectoryName,
          },
          markdownMigration: { discoveredMarkdownPaths: [], transferMode: 'skip', selectedPaths: [] },
          agents: { selected: ['CLAUDE.md'], detectedExisting: [], shouldArchiveExistingAgentFiles: false, ensureClaudeEntryPoint: true },
          confirmation: { confirmed: true },
        }

        await archiveDocsDirectory(tempDir, options)

        await expect(access(docsDir)).resolves.toBeUndefined()
      })
    })

    describe('T-C.1.2: Archive engine moves scattered .md files to knowledge-base/', () => {
      it('moves selected markdown files preserving relative path structure', async () => {
        const mdFile = join(tempDir, 'README.md')
        await writeFile(mdFile, '# README')

        const nestedMdFile = join(tempDir, 'docs', 'nested.md')
        await mkdir(join(tempDir, 'docs'), { recursive: true })
        await writeFile(nestedMdFile, '# Nested')

        const options: InitOptions = {
          projectName: 'test-project',
          git: { hasExistingRepository: true, shouldInitialize: false, shouldSetMainBranch: false },
          docs: { hasExistingDocsDirectory: false, shouldArchiveExistingDocs: false, archiveDirectoryName: defaultArchiveDirectoryName },
          markdownMigration: {
            discoveredMarkdownPaths: [mdFile, nestedMdFile],
            transferMode: 'move',
            selectedPaths: [mdFile, nestedMdFile],
          },
          agents: { selected: ['CLAUDE.md'], detectedExisting: [], shouldArchiveExistingAgentFiles: false, ensureClaudeEntryPoint: true },
          confirmation: { confirmed: true },
        }

        await moveMarkdownFiles(tempDir, options)

        const movedFile = join(tempDir, 'knowledge-base', 'README.md')
        const movedNestedFile = join(tempDir, 'knowledge-base', 'docs', 'nested.md')
        
        await expect(access(movedFile)).resolves.toBeUndefined()
        await expect(access(movedNestedFile)).resolves.toBeUndefined()
        await expect(access(mdFile)).rejects.toThrow()
        await expect(access(nestedMdFile)).rejects.toThrow()
      })

      it('skips moving when transferMode is skip', async () => {
        const mdFile = join(tempDir, 'README.md')
        await writeFile(mdFile, '# README')

        const options: InitOptions = {
          projectName: 'test-project',
          git: { hasExistingRepository: true, shouldInitialize: false, shouldSetMainBranch: false },
          docs: { hasExistingDocsDirectory: false, shouldArchiveExistingDocs: false, archiveDirectoryName: defaultArchiveDirectoryName },
          markdownMigration: {
            discoveredMarkdownPaths: [mdFile],
            transferMode: 'skip',
            selectedPaths: [],
          },
          agents: { selected: ['CLAUDE.md'], detectedExisting: [], shouldArchiveExistingAgentFiles: false, ensureClaudeEntryPoint: true },
          confirmation: { confirmed: true },
        }

        await moveMarkdownFiles(tempDir, options)

        await expect(access(mdFile)).resolves.toBeUndefined()
        await expect(access(join(tempDir, 'knowledge-base', 'README.md'))).rejects.toThrow()
      })

      it('preserves files with same name from different directories without collision', async () => {
        const mdFile1 = join(tempDir, 'src', 'README.md')
        const mdFile2 = join(tempDir, 'lib', 'README.md')
        
        await mkdir(join(tempDir, 'src'), { recursive: true })
        await mkdir(join(tempDir, 'lib'), { recursive: true })
        await writeFile(mdFile1, '# Src README')
        await writeFile(mdFile2, '# Lib README')

        const options: InitOptions = {
          projectName: 'test-project',
          git: { hasExistingRepository: true, shouldInitialize: false, shouldSetMainBranch: false },
          docs: { hasExistingDocsDirectory: false, shouldArchiveExistingDocs: false, archiveDirectoryName: defaultArchiveDirectoryName },
          markdownMigration: {
            discoveredMarkdownPaths: [mdFile1, mdFile2],
            transferMode: 'move',
            selectedPaths: [mdFile1, mdFile2],
          },
          agents: { selected: ['CLAUDE.md'], detectedExisting: [], shouldArchiveExistingAgentFiles: false, ensureClaudeEntryPoint: true },
          confirmation: { confirmed: true },
        }

        await moveMarkdownFiles(tempDir, options)

        const movedFile1 = join(tempDir, 'knowledge-base', 'src', 'README.md')
        const movedFile2 = join(tempDir, 'knowledge-base', 'lib', 'README.md')
        
        await expect(access(movedFile1)).resolves.toBeUndefined()
        await expect(access(movedFile2)).resolves.toBeUndefined()
        
        const content1 = await readFile(movedFile1, 'utf-8')
        const content2 = await readFile(movedFile2, 'utf-8')
        expect(content1).toBe('# Src README')
        expect(content2).toBe('# Lib README')
      })
    })

    describe('copyMarkdownFiles', () => {
      it('copies selected markdown files preserving relative path structure', async () => {
        const mdFile = join(tempDir, 'README.md')
        await writeFile(mdFile, '# README')

        const nestedMdFile = join(tempDir, 'docs', 'nested.md')
        await mkdir(join(tempDir, 'docs'), { recursive: true })
        await writeFile(nestedMdFile, '# Nested')

        const options: InitOptions = {
          projectName: 'test-project',
          git: { hasExistingRepository: true, shouldInitialize: false, shouldSetMainBranch: false },
          docs: { hasExistingDocsDirectory: false, shouldArchiveExistingDocs: false, archiveDirectoryName: defaultArchiveDirectoryName },
          markdownMigration: {
            discoveredMarkdownPaths: [mdFile, nestedMdFile],
            transferMode: 'copy',
            selectedPaths: [mdFile, nestedMdFile],
          },
          agents: { selected: ['CLAUDE.md'], detectedExisting: [], shouldArchiveExistingAgentFiles: false, ensureClaudeEntryPoint: true },
          confirmation: { confirmed: true },
        }

        await copyMarkdownFiles(tempDir, options)

        const copiedFile = join(tempDir, 'knowledge-base', 'README.md')
        const copiedNestedFile = join(tempDir, 'knowledge-base', 'docs', 'nested.md')
        
        await expect(access(copiedFile)).resolves.toBeUndefined()
        await expect(access(copiedNestedFile)).resolves.toBeUndefined()
        await expect(access(mdFile)).resolves.toBeUndefined()
        await expect(access(nestedMdFile)).resolves.toBeUndefined()
      })
    })

    describe('T-C.1.3: Archive engine moves existing agent files to knowledge-base/', () => {
      it('archives detected agent files when shouldArchiveExistingAgentFiles is true', async () => {
        const agentFile = join(tempDir, 'CLAUDE.md')
        await writeFile(agentFile, '# Existing CLAUDE.md')

        const options: InitOptions = {
          projectName: 'test-project',
          git: { hasExistingRepository: true, shouldInitialize: false, shouldSetMainBranch: false },
          docs: { hasExistingDocsDirectory: false, shouldArchiveExistingDocs: false, archiveDirectoryName: defaultArchiveDirectoryName },
          markdownMigration: { discoveredMarkdownPaths: [], transferMode: 'skip', selectedPaths: [] },
          agents: {
            selected: ['CLAUDE.md'],
            detectedExisting: ['CLAUDE.md'],
            shouldArchiveExistingAgentFiles: true,
            ensureClaudeEntryPoint: true,
          },
          confirmation: { confirmed: true },
        }

        await archiveAgentFiles(tempDir, options)

        const archivedFile = join(tempDir, 'knowledge-base', 'CLAUDE.md')
        await expect(access(archivedFile)).resolves.toBeUndefined()
      })

      it('skips archiving when no agent files detected', async () => {
        const options: InitOptions = {
          projectName: 'test-project',
          git: { hasExistingRepository: true, shouldInitialize: false, shouldSetMainBranch: false },
          docs: { hasExistingDocsDirectory: false, shouldArchiveExistingDocs: false, archiveDirectoryName: defaultArchiveDirectoryName },
          markdownMigration: { discoveredMarkdownPaths: [], transferMode: 'skip', selectedPaths: [] },
          agents: {
            selected: ['CLAUDE.md'],
            detectedExisting: [],
            shouldArchiveExistingAgentFiles: false,
            ensureClaudeEntryPoint: true,
          },
          confirmation: { confirmed: true },
        }

        await expect(archiveAgentFiles(tempDir, options)).resolves.not.toThrow()
      })
    })
  })

  describe('Scaffold Engine', () => {
    describe('T-C.2.1: Scaffold engine creates the complete Blueprint directory tree', () => {
      it('creates docs/, docs/core/, docs/knowledge-base/, docs/milestones/ directories', async () => {
        const options: InitOptions = {
          projectName: 'test-project',
          git: { hasExistingRepository: true, shouldInitialize: false, shouldSetMainBranch: false },
          docs: { hasExistingDocsDirectory: false, shouldArchiveExistingDocs: false, archiveDirectoryName: defaultArchiveDirectoryName },
          markdownMigration: { discoveredMarkdownPaths: [], transferMode: 'skip', selectedPaths: [] },
          agents: { selected: ['CLAUDE.md'], detectedExisting: [], shouldArchiveExistingAgentFiles: false, ensureClaudeEntryPoint: true },
          confirmation: { confirmed: true },
        }

        await scaffoldBlueprintDirectory(tempDir, options)

        await expect(directoryExists(join(tempDir, 'docs'))).resolves.toBe(true)
        await expect(directoryExists(join(tempDir, 'docs', 'core'))).resolves.toBe(true)
        await expect(directoryExists(join(tempDir, 'docs', 'knowledge-base'))).resolves.toBe(true)
        await expect(directoryExists(join(tempDir, 'docs', 'milestones'))).resolves.toBe(true)
      })
    })

    describe('T-C.2.2: Scaffold engine copies core protocol templates verbatim into docs/core/', () => {
      it('copies all 16 core protocol files from templates', async () => {
        const options: InitOptions = {
          projectName: 'test-project',
          git: { hasExistingRepository: true, shouldInitialize: false, shouldSetMainBranch: false },
          docs: { hasExistingDocsDirectory: false, shouldArchiveExistingDocs: false, archiveDirectoryName: defaultArchiveDirectoryName },
          markdownMigration: { discoveredMarkdownPaths: [], transferMode: 'skip', selectedPaths: [] },
          agents: { selected: ['CLAUDE.md'], detectedExisting: [], shouldArchiveExistingAgentFiles: false, ensureClaudeEntryPoint: true },
          confirmation: { confirmed: true },
        }

        await scaffoldBlueprintDirectory(tempDir, options)

        const coreDir = join(tempDir, 'docs', 'core')
        const coreFiles = await scanMarkdownFiles(coreDir)
        
        expect(coreFiles.length).toBeGreaterThanOrEqual(16)
      })

      it('core protocol files have non-zero length and start with heading', async () => {
        const options: InitOptions = {
          projectName: 'test-project',
          git: { hasExistingRepository: true, shouldInitialize: false, shouldSetMainBranch: false },
          docs: { hasExistingDocsDirectory: false, shouldArchiveExistingDocs: false, archiveDirectoryName: defaultArchiveDirectoryName },
          markdownMigration: { discoveredMarkdownPaths: [], transferMode: 'skip', selectedPaths: [] },
          agents: { selected: ['CLAUDE.md'], detectedExisting: [], shouldArchiveExistingAgentFiles: false, ensureClaudeEntryPoint: true },
          confirmation: { confirmed: true },
        }

        await scaffoldBlueprintDirectory(tempDir, options)

        const coreDir = join(tempDir, 'docs', 'core')
        const coreFiles = await scanMarkdownFiles(coreDir)
        
        for (const file of coreFiles.slice(0, 5)) {
          const content = await readFile(file, 'utf-8')
          expect(content.length).toBeGreaterThan(0)
          expect(content.trim().startsWith('#')).toBe(true)
        }
      })
    })

    describe('T-C.2.3: Scaffold engine interpolates {{project-name}} in editable shell documents', () => {
      it('replaces {{project-name}} with actual project name in project-progress.md', async () => {
        const options: InitOptions = {
          projectName: 'my-test-project',
          git: { hasExistingRepository: true, shouldInitialize: false, shouldSetMainBranch: false },
          docs: { hasExistingDocsDirectory: false, shouldArchiveExistingDocs: false, archiveDirectoryName: defaultArchiveDirectoryName },
          markdownMigration: { discoveredMarkdownPaths: [], transferMode: 'skip', selectedPaths: [] },
          agents: { selected: ['CLAUDE.md'], detectedExisting: [], shouldArchiveExistingAgentFiles: false, ensureClaudeEntryPoint: true },
          confirmation: { confirmed: true },
        }

        await scaffoldBlueprintDirectory(tempDir, options)

        const projectProgressFile = join(tempDir, 'docs', 'project-progress.md')
        const content = await readFile(projectProgressFile, 'utf-8')
        
        expect(content).toContain('my-test-project')
        expect(content).not.toContain('{{project-name}}')
      })

      it('replaces {{project-name}} in prd.md and conventions.md', async () => {
        const options: InitOptions = {
          projectName: 'another-project',
          git: { hasExistingRepository: true, shouldInitialize: false, shouldSetMainBranch: false },
          docs: { hasExistingDocsDirectory: false, shouldArchiveExistingDocs: false, archiveDirectoryName: defaultArchiveDirectoryName },
          markdownMigration: { discoveredMarkdownPaths: [], transferMode: 'skip', selectedPaths: [] },
          agents: { selected: ['CLAUDE.md'], detectedExisting: [], shouldArchiveExistingAgentFiles: false, ensureClaudeEntryPoint: true },
          confirmation: { confirmed: true },
        }

        await scaffoldBlueprintDirectory(tempDir, options)

        const prdContent = await readFile(join(tempDir, 'docs', 'prd.md'), 'utf-8')
        const conventionsContent = await readFile(join(tempDir, 'docs', 'conventions.md'), 'utf-8')
        
        expect(prdContent).toContain('another-project')
        expect(conventionsContent).toContain('another-project')
        expect(prdContent).not.toContain('{{project-name}}')
        expect(conventionsContent).not.toContain('{{project-name}}')
      })
    })
  })

  describe('Agent File Generator', () => {
    describe('T-C.3.1: Agent file generator creates files only for selected agents', () => {
      it('creates only selected agent files at project root', async () => {
        const options: InitOptions = {
          projectName: 'test-project',
          git: { hasExistingRepository: true, shouldInitialize: false, shouldSetMainBranch: false },
          docs: { hasExistingDocsDirectory: false, shouldArchiveExistingDocs: false, archiveDirectoryName: defaultArchiveDirectoryName },
          markdownMigration: { discoveredMarkdownPaths: [], transferMode: 'skip', selectedPaths: [] },
          agents: {
            selected: ['CLAUDE.md', 'GEMINI.md'],
            detectedExisting: [],
            shouldArchiveExistingAgentFiles: false,
            ensureClaudeEntryPoint: true,
          },
          confirmation: { confirmed: true },
        }

        await generateAgentFiles(tempDir, options)

        await expect(access(join(tempDir, 'CLAUDE.md'))).resolves.toBeUndefined()
        await expect(access(join(tempDir, 'GEMINI.md'))).resolves.toBeUndefined()
        await expect(access(join(tempDir, 'AGENTS.md'))).rejects.toThrow()
        await expect(access(join(tempDir, 'QWEN.md'))).rejects.toThrow()
      })
    })

    describe('T-C.3.2: Agent file generator always creates CLAUDE.md regardless of selection', () => {
      it('creates CLAUDE.md even with empty selection', async () => {
        const options: InitOptions = {
          projectName: 'test-project',
          git: { hasExistingRepository: true, shouldInitialize: false, shouldSetMainBranch: false },
          docs: { hasExistingDocsDirectory: false, shouldArchiveExistingDocs: false, archiveDirectoryName: defaultArchiveDirectoryName },
          markdownMigration: { discoveredMarkdownPaths: [], transferMode: 'skip', selectedPaths: [] },
          agents: {
            selected: [],
            detectedExisting: [],
            shouldArchiveExistingAgentFiles: false,
            ensureClaudeEntryPoint: true,
          },
          confirmation: { confirmed: true },
        }

        await generateAgentFiles(tempDir, options)

        await expect(access(join(tempDir, 'CLAUDE.md'))).resolves.toBeUndefined()
      })
    })
  })

  describe('Git Initializer', () => {
    describe('T-C.4.1: Git initializer creates .git/ directory with main branch when authorized', () => {
      it('initializes git repository when shouldInitialize is true', async () => {
        const options: InitOptions = {
          projectName: 'test-project',
          git: { hasExistingRepository: false, shouldInitialize: true, shouldSetMainBranch: true },
          docs: { hasExistingDocsDirectory: false, shouldArchiveExistingDocs: false, archiveDirectoryName: defaultArchiveDirectoryName },
          markdownMigration: { discoveredMarkdownPaths: [], transferMode: 'skip', selectedPaths: [] },
          agents: { selected: ['CLAUDE.md'], detectedExisting: [], shouldArchiveExistingAgentFiles: false, ensureClaudeEntryPoint: true },
          confirmation: { confirmed: true },
        }

        await initializeGitRepository(tempDir, options)

        await expect(directoryExists(join(tempDir, '.git'))).resolves.toBe(true)
      })

      it('skips git init when shouldInitialize is false', async () => {
        const options: InitOptions = {
          projectName: 'test-project',
          git: { hasExistingRepository: false, shouldInitialize: false, shouldSetMainBranch: false },
          docs: { hasExistingDocsDirectory: false, shouldArchiveExistingDocs: false, archiveDirectoryName: defaultArchiveDirectoryName },
          markdownMigration: { discoveredMarkdownPaths: [], transferMode: 'skip', selectedPaths: [] },
          agents: { selected: ['CLAUDE.md'], detectedExisting: [], shouldArchiveExistingAgentFiles: false, ensureClaudeEntryPoint: true },
          confirmation: { confirmed: true },
        }

        await initializeGitRepository(tempDir, options)

        await expect(directoryExists(join(tempDir, '.git'))).resolves.toBe(false)
      })
    })

    describe('T-C.4.2: Git initializer does nothing when not authorized', () => {
      it('does not create .git when git init is declined', async () => {
        const options: InitOptions = {
          projectName: 'test-project',
          git: { hasExistingRepository: false, shouldInitialize: false, shouldSetMainBranch: false },
          docs: { hasExistingDocsDirectory: false, shouldArchiveExistingDocs: false, archiveDirectoryName: defaultArchiveDirectoryName },
          markdownMigration: { discoveredMarkdownPaths: [], transferMode: 'skip', selectedPaths: [] },
          agents: { selected: ['CLAUDE.md'], detectedExisting: [], shouldArchiveExistingAgentFiles: false, ensureClaudeEntryPoint: true },
          confirmation: { confirmed: true },
        }

        await initializeGitRepository(tempDir, options)

        await expect(directoryExists(join(tempDir, '.git'))).resolves.toBe(false)
      })
    })
  })

  describe('End-to-End Integration', () => {
    describe('T-C.5: Full init command produces complete Blueprint structure', () => {
      it('executeScaffold creates complete Blueprint structure with selected agents', async () => {
        const options: InitOptions = {
          projectName: 'e2e-test-project',
          git: { hasExistingRepository: false, shouldInitialize: true, shouldSetMainBranch: true },
          docs: { hasExistingDocsDirectory: false, shouldArchiveExistingDocs: false, archiveDirectoryName: defaultArchiveDirectoryName },
          markdownMigration: { discoveredMarkdownPaths: [], transferMode: 'skip', selectedPaths: [] },
          agents: {
            selected: ['CLAUDE.md', 'GEMINI.md'],
            detectedExisting: [],
            shouldArchiveExistingAgentFiles: false,
            ensureClaudeEntryPoint: true,
          },
          confirmation: { confirmed: true },
        }

        const result = await executeScaffold(tempDir, options)

        // Verify directories created
        await expect(directoryExists(join(tempDir, 'docs'))).resolves.toBe(true)
        await expect(directoryExists(join(tempDir, 'docs', 'core'))).resolves.toBe(true)
        await expect(directoryExists(join(tempDir, 'docs', 'knowledge-base'))).resolves.toBe(true)
        await expect(directoryExists(join(tempDir, 'docs', 'milestones'))).resolves.toBe(true)

        // Verify agent files created
        await expect(access(join(tempDir, 'CLAUDE.md'))).resolves.toBeUndefined()
        await expect(access(join(tempDir, 'GEMINI.md'))).resolves.toBeUndefined()
        await expect(access(join(tempDir, 'AGENTS.md'))).rejects.toThrow()
        await expect(access(join(tempDir, 'QWEN.md'))).rejects.toThrow()

        // Verify git initialized
        await expect(directoryExists(join(tempDir, '.git'))).resolves.toBe(true)

        // Verify editable shells created
        await expect(access(join(tempDir, 'docs', 'srs.md'))).resolves.toBeUndefined()

        // Verify result tracking
        expect(result.createdFiles).toContain('CLAUDE.md')
        expect(result.createdFiles).toContain('GEMINI.md')
        expect(result.gitInitialized).toBe(true)
        expect(result.mainBranchConfigured).toBe(true)
      })

      it('executeScaffold archives existing docs and agent files before scaffold', async () => {
        const docsDir = join(tempDir, 'docs')
        const docsContentFile = join(docsDir, 'existing.md')
        const agentFile = join(tempDir, 'CLAUDE.md')
        
        await mkdir(docsDir, { recursive: true })
        await writeFile(docsContentFile, '# Existing Docs')
        await writeFile(agentFile, '# Existing CLAUDE.md')

        const options: InitOptions = {
          projectName: 'e2e-test-project',
          git: { hasExistingRepository: true, shouldInitialize: false, shouldSetMainBranch: false },
          docs: {
            hasExistingDocsDirectory: true,
            shouldArchiveExistingDocs: true,
            archiveDirectoryName: defaultArchiveDirectoryName,
          },
          markdownMigration: { discoveredMarkdownPaths: [], transferMode: 'skip', selectedPaths: [] },
          agents: {
            selected: ['CLAUDE.md'],
            detectedExisting: ['CLAUDE.md'],
            shouldArchiveExistingAgentFiles: true,
            ensureClaudeEntryPoint: true,
          },
          confirmation: { confirmed: true },
        }

        const result = await executeScaffold(tempDir, options)

        // Verify archive
        await expect(access(join(tempDir, 'knowledge-base', defaultArchiveDirectoryName, 'existing.md'))).resolves.toBeUndefined()
        await expect(access(join(tempDir, 'knowledge-base', 'CLAUDE.md'))).resolves.toBeUndefined()
        
        // Verify new scaffold
        await expect(access(join(tempDir, 'docs', 'project-progress.md'))).resolves.toBeUndefined()
        await expect(access(join(tempDir, 'CLAUDE.md'))).resolves.toBeUndefined()

        // Verify result tracking
        expect(result.archivedPaths).toContain(`docs/ -> knowledge-base/${defaultArchiveDirectoryName}`)
        expect(result.archivedPaths).toContain('CLAUDE.md -> knowledge-base/CLAUDE.md')
      })

      it('executeScaffold interpolates project name in editable shells', async () => {
        const options: InitOptions = {
          projectName: 'my-awesome-project',
          git: { hasExistingRepository: true, shouldInitialize: false, shouldSetMainBranch: false },
          docs: { hasExistingDocsDirectory: false, shouldArchiveExistingDocs: false, archiveDirectoryName: defaultArchiveDirectoryName },
          markdownMigration: { discoveredMarkdownPaths: [], transferMode: 'skip', selectedPaths: [] },
          agents: { selected: ['CLAUDE.md'], detectedExisting: [], shouldArchiveExistingAgentFiles: false, ensureClaudeEntryPoint: true },
          confirmation: { confirmed: true },
        }

        await executeScaffold(tempDir, options)

        const projectProgressContent = await readFile(join(tempDir, 'docs', 'project-progress.md'), 'utf-8')
        const prdContent = await readFile(join(tempDir, 'docs', 'prd.md'), 'utf-8')
        const conventionsContent = await readFile(join(tempDir, 'docs', 'conventions.md'), 'utf-8')
        const srsContent = await readFile(join(tempDir, 'docs', 'srs.md'), 'utf-8')

        expect(projectProgressContent).toContain('my-awesome-project')
        expect(prdContent).toContain('my-awesome-project')
        expect(conventionsContent).toContain('my-awesome-project')
        expect(srsContent).toContain('my-awesome-project')
        expect(projectProgressContent).not.toContain('{{project-name}}')
        expect(prdContent).not.toContain('{{project-name}}')
        expect(conventionsContent).not.toContain('{{project-name}}')
        expect(srsContent).not.toContain('{{project-name}}')
      })
    })
  })
})
