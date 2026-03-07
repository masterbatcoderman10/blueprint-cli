import { join, resolve, basename, relative, dirname } from 'node:path'
import { copyFile, mkdir, rename, unlink, stat, readdir, readFile, writeFile } from 'node:fs/promises'

import { type InitOptions, type ScaffoldResult, defaultArchiveDirectoryName } from './types'
import { safeMkdirP, moveFileSafe, copyFileSafe } from './fs-utils'

const TEMPLATES_DIR = join(__dirname, '../../templates')

async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stats = await stat(filePath)
    return stats.isFile()
  } catch {
    return false
  }
}

async function directoryExists(targetPath: string): Promise<boolean> {
  try {
    const stats = await stat(targetPath)
    return stats.isDirectory()
  } catch {
    return false
  }
}

export async function archiveDocsDirectory(
  rootDir: string,
  options: InitOptions,
): Promise<void> {
  if (!options.docs.hasExistingDocsDirectory || !options.docs.shouldArchiveExistingDocs) {
    return
  }

  const docsDir = join(resolve(rootDir), 'docs')
  const archiveDest = join(resolve(rootDir), 'knowledge-base', options.docs.archiveDirectoryName)

  if (await directoryExists(docsDir)) {
    await safeMkdirP(join(resolve(rootDir), 'knowledge-base'))
    await moveFileSafe(docsDir, archiveDest)
  }
}

export async function archiveAgentFiles(
  rootDir: string,
  options: InitOptions,
): Promise<void> {
  if (!options.agents.shouldArchiveExistingAgentFiles || options.agents.detectedExisting.length === 0) {
    return
  }

  const knowledgeBaseDir = join(resolve(rootDir), 'knowledge-base')
  await safeMkdirP(knowledgeBaseDir)

  for (const fileName of options.agents.detectedExisting) {
    const sourcePath = join(resolve(rootDir), fileName)
    const destPath = join(knowledgeBaseDir, fileName)

    if (await fileExists(sourcePath)) {
      await moveFileSafe(sourcePath, destPath)
    }
  }
}

export async function moveMarkdownFiles(
  rootDir: string,
  options: InitOptions,
): Promise<void> {
  if (options.markdownMigration.transferMode !== 'move') {
    return
  }

  const knowledgeBaseDir = join(resolve(rootDir), 'knowledge-base')
  const normalizedRootDir = resolve(rootDir)

  for (const mdPath of options.markdownMigration.selectedPaths) {
    const relativePath = relative(normalizedRootDir, mdPath)
    const destPath = join(knowledgeBaseDir, relativePath)

    if (await fileExists(mdPath)) {
      await safeMkdirP(dirname(destPath))
      await moveFileSafe(mdPath, destPath)
    }
  }
}

export async function copyMarkdownFiles(
  rootDir: string,
  options: InitOptions,
): Promise<void> {
  if (options.markdownMigration.transferMode !== 'copy') {
    return
  }

  const knowledgeBaseDir = join(resolve(rootDir), 'knowledge-base')
  const normalizedRootDir = resolve(rootDir)

  for (const mdPath of options.markdownMigration.selectedPaths) {
    const relativePath = relative(normalizedRootDir, mdPath)
    const destPath = join(knowledgeBaseDir, relativePath)

    if (await fileExists(mdPath)) {
      await safeMkdirP(dirname(destPath))
      await copyFileSafe(mdPath, destPath)
    }
  }
}

export async function scaffoldBlueprintDirectory(
  rootDir: string,
  options: InitOptions,
): Promise<void> {
  const docsDir = join(resolve(rootDir), 'docs')
  const coreDir = join(docsDir, 'core')
  const knowledgeBaseDir = join(docsDir, 'knowledge-base')
  const milestonesDir = join(docsDir, 'milestones')

  await safeMkdirP(coreDir)
  await safeMkdirP(knowledgeBaseDir)
  await safeMkdirP(milestonesDir)

  await copyCoreTemplates(rootDir, options)
  await copyEditableShells(rootDir, options)
}

export async function copyCoreTemplates(
  rootDir: string,
  options: InitOptions,
): Promise<void> {
  const coreDir = join(resolve(rootDir), 'docs', 'core')
  const templateCoreDir = join(TEMPLATES_DIR, 'docs', 'core')

  const entries = await readdir(templateCoreDir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.md')) {
      const sourcePath = join(templateCoreDir, entry.name)
      const destPath = join(coreDir, entry.name)
      await copyFileSafe(sourcePath, destPath)
    } else if (entry.isDirectory()) {
      const subDirDest = join(coreDir, entry.name)
      await safeMkdirP(subDirDest)

      const subEntries = await readdir(join(templateCoreDir, entry.name), { withFileTypes: true })
      for (const subEntry of subEntries) {
        if (subEntry.isFile() && subEntry.name.endsWith('.md')) {
          const sourcePath = join(templateCoreDir, entry.name, subEntry.name)
          const destPath = join(subDirDest, subEntry.name)
          await copyFileSafe(sourcePath, destPath)
        }
      }
    }
  }
}

export async function copyEditableShells(
  rootDir: string,
  options: InitOptions,
): Promise<void> {
  const docsDir = join(resolve(rootDir), 'docs')
  const shellFiles = ['project-progress.md', 'prd.md', 'conventions.md']

  for (const fileName of shellFiles) {
    const templatePath = join(TEMPLATES_DIR, fileName)
    const destPath = join(docsDir, fileName)

    if (await fileExists(templatePath)) {
      const content = await readFile(templatePath, 'utf-8')
      const interpolatedContent = content.replace(/\{\{project-name\}\}/g, options.projectName)
      await writeFile(destPath, interpolatedContent, 'utf-8')
    }
  }
}

export async function generateAgentFiles(
  rootDir: string,
  options: InitOptions,
): Promise<void> {
  const selectedAgents = [...options.agents.selected]

  if (!selectedAgents.includes('CLAUDE.md')) {
    selectedAgents.unshift('CLAUDE.md')
  }

  for (const fileName of selectedAgents) {
    const templatePath = join(TEMPLATES_DIR, fileName)
    const destPath = join(resolve(rootDir), fileName)

    if (await fileExists(templatePath)) {
      await copyFile(templatePath, destPath)
    }
  }
}

export async function initializeGitRepository(
  rootDir: string,
  options: InitOptions,
): Promise<void> {
  if (!options.git.shouldInitialize) {
    return
  }

  const { exec } = await import('node:child_process')
  const { promisify } = await import('node:util')
  const execAsync = promisify(exec)

  try {
    await execAsync('git init', { cwd: resolve(rootDir) })

    if (options.git.shouldSetMainBranch) {
      await execAsync('git branch -M main', { cwd: resolve(rootDir) })
    }
  } catch (error) {
    const nodeError = error as { code?: string, message?: string }
    if (nodeError.code === 'ENOENT') {
      throw new Error('Git is not installed. Please install git and try again.')
    }
    throw error
  }
}

export async function executeScaffold(
  rootDir: string,
  options: InitOptions,
): Promise<ScaffoldResult> {
  const result: ScaffoldResult = {
    createdDirectories: [],
    createdFiles: [],
    archivedPaths: [],
    movedPaths: [],
    copiedPaths: [],
    gitInitialized: false,
    mainBranchConfigured: false,
  }

  if (options.docs.hasExistingDocsDirectory && options.docs.shouldArchiveExistingDocs) {
    await archiveDocsDirectory(rootDir, options)
    result.archivedPaths.push(`docs/ -> knowledge-base/${options.docs.archiveDirectoryName}`)
  }

  if (options.agents.shouldArchiveExistingAgentFiles && options.agents.detectedExisting.length > 0) {
    await archiveAgentFiles(rootDir, options)
    for (const fileName of options.agents.detectedExisting) {
      result.archivedPaths.push(`${fileName} -> knowledge-base/${fileName}`)
    }
  }

  if (options.markdownMigration.transferMode === 'move') {
    await moveMarkdownFiles(rootDir, options)
    for (const mdPath of options.markdownMigration.selectedPaths) {
      const relativePath = relative(resolve(rootDir), mdPath)
      result.movedPaths.push(`${mdPath} -> knowledge-base/${relativePath}`)
    }
  } else if (options.markdownMigration.transferMode === 'copy') {
    await copyMarkdownFiles(rootDir, options)
    for (const mdPath of options.markdownMigration.selectedPaths) {
      const relativePath = relative(resolve(rootDir), mdPath)
      result.copiedPaths.push(`${mdPath} -> knowledge-base/${relativePath}`)
    }
  }

  await scaffoldBlueprintDirectory(rootDir, options)
  result.createdDirectories.push('docs/', 'docs/core/', 'docs/knowledge-base/', 'docs/milestones/')

  await generateAgentFiles(rootDir, options)
  const selectedAgents = [...options.agents.selected]
  if (!selectedAgents.includes('CLAUDE.md')) {
    selectedAgents.unshift('CLAUDE.md')
  }
  for (const fileName of selectedAgents) {
    result.createdFiles.push(fileName)
  }

  if (options.git.shouldInitialize) {
    await initializeGitRepository(rootDir, options)
    result.gitInitialized = true
    result.mainBranchConfigured = options.git.shouldSetMainBranch
  }

  return result
}
