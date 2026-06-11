import { join, resolve, basename, relative, dirname } from 'node:path'
import { copyFile, rename, unlink, stat, readdir, readFile, writeFile, rm } from 'node:fs/promises'

import { type InitOptions, type ScaffoldResult, type AgentFileName, defaultArchiveDirectoryName } from './types'
import { safeMkdirP, moveFileSafe, copyFileSafe } from './fs-utils'
import { TEMPLATE_VERSION, writeManifest, getCliVersion } from '../doctor/manifest'
import { SKILL_INSTALL_BASES } from '../doctor/structure'

const TEMPLATES_DIR = join(__dirname, '../../templates')
const KNOWLEDGE_BASE_DIRECTORY_NAME = 'knowledge-base'
const KNOWLEDGE_BASE_STAGING_DIRECTORY_NAME = '.blueprint-init-staging'

function resolveKnowledgeBaseDir(rootDir: string): string {
  return join(resolve(rootDir), 'docs', KNOWLEDGE_BASE_DIRECTORY_NAME)
}

function resolveKnowledgeBaseStagingDir(rootDir: string): string {
  return join(resolve(rootDir), KNOWLEDGE_BASE_STAGING_DIRECTORY_NAME, KNOWLEDGE_BASE_DIRECTORY_NAME)
}

function resolveKnowledgeBaseStagingRoot(rootDir: string): string {
  return join(resolve(rootDir), KNOWLEDGE_BASE_STAGING_DIRECTORY_NAME)
}

export function resolveSelectedAgents(options: InitOptions): string[] {
  const selectedAgents = [...options.agents.selected]
  if (!selectedAgents.includes('CLAUDE.md')) {
    selectedAgents.unshift('CLAUDE.md')
  }
  return selectedAgents
}

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
  const archiveDest = join(resolveKnowledgeBaseStagingDir(rootDir), options.docs.archiveDirectoryName)

  if (await directoryExists(docsDir)) {
    await safeMkdirP(dirname(archiveDest))
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

  const knowledgeBaseDir = resolveKnowledgeBaseStagingDir(rootDir)
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

  const knowledgeBaseDir = resolveKnowledgeBaseStagingDir(rootDir)
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

  const knowledgeBaseDir = resolveKnowledgeBaseStagingDir(rootDir)
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
  const knowledgeBaseDir = resolveKnowledgeBaseDir(rootDir)
  const milestonesDir = join(docsDir, 'milestones')
  const tweaksDir = join(docsDir, 'tweaks')

  await safeMkdirP(knowledgeBaseDir)
  await safeMkdirP(milestonesDir)
  await safeMkdirP(tweaksDir)

  if (options.mode === 'skill') {
    await copySkillPayload(rootDir, options)
    await copyTweaksTemplate(rootDir, options)
    await copyEditableShells(rootDir, options)
  } else {
    // Legacy mode: copy docs/core/** and top-level agent templates
    const coreDir = join(docsDir, 'core')
    await safeMkdirP(coreDir)
    await copyCoreTemplates(rootDir, options)
    await copyTweaksTemplate(rootDir, options)
    await copyEditableShells(rootDir, options)
  }
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

export async function copyTweaksTemplate(
  rootDir: string,
  _options: InitOptions,
): Promise<void> {
  const tweaksDir = join(resolve(rootDir), 'docs', 'tweaks')
  const templatePath = join(TEMPLATES_DIR, 'docs', 'tweaks', 'README.md')
  const destPath = join(tweaksDir, 'README.md')

  if (await fileExists(templatePath)) {
    await copyFileSafe(templatePath, destPath)
  }
}

export async function copyEditableShells(
  rootDir: string,
  options: InitOptions,
): Promise<void> {
  const docsDir = join(resolve(rootDir), 'docs')
  const shellFiles = ['project-progress.md', 'prd.md', 'srs.md']

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
  if (options.mode === 'skill') {
    await copySkillModeAgentStubs(rootDir, options)
  } else {
    const selectedAgents = resolveSelectedAgents(options)

    for (const fileName of selectedAgents) {
      const templatePath = join(TEMPLATES_DIR, fileName)
      const destPath = join(resolve(rootDir), fileName)

      if (await fileExists(templatePath)) {
        await copyFile(templatePath, destPath)
      }
    }
  }
}

export async function generateManifest(
  rootDir: string,
  options: InitOptions,
): Promise<void> {
  const selectedAgents = resolveSelectedAgents(options)
  const cliVersion = await getCliVersion()

  await writeManifest(rootDir, {
    templateVersion: TEMPLATE_VERSION,
    cliVersion,
    managedFiles: selectedAgents,
  })
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

export async function copySkillPayload(
  rootDir: string,
  _options: InitOptions,
): Promise<void> {
  const skillSourceDir = join(TEMPLATES_DIR, 'skills', 'blueprint')

  for (const skillBase of SKILL_INSTALL_BASES) {
    const skillDestDir = join(resolve(rootDir), skillBase)

    await safeMkdirP(skillDestDir)
    await copyDirectoryRecursive(skillSourceDir, skillDestDir)
  }
}

export async function copySkillModeAgentStubs(
  rootDir: string,
  options: InitOptions,
): Promise<void> {
  const selectedAgents = resolveSelectedAgents(options)
  const skillTemplateDir = join(TEMPLATES_DIR, 'skill')

  for (const fileName of selectedAgents) {
    const templatePath = join(skillTemplateDir, fileName)
    const destPath = join(resolve(rootDir), fileName)

    if (await fileExists(templatePath)) {
      await copyFileSafe(templatePath, destPath)
    }
  }
}

export const ALIGNMENT_MARKER = '<!-- blueprint-status: alignment-required -->'

export async function writeAlignmentMarker(
  rootDir: string,
  agentFiles: AgentFileName[],
): Promise<void> {
  const normalizedRootDir = resolve(rootDir)

  for (const fileName of agentFiles) {
    const filePath = join(normalizedRootDir, fileName)

    if (!(await fileExists(filePath))) {
      continue
    }

    const content = await readFile(filePath, 'utf-8')

    // Idempotent: skip if marker already present
    if (content.includes(ALIGNMENT_MARKER)) {
      continue
    }

    const trimmed = content.endsWith('\n') ? content : content + '\n'
    await writeFile(filePath, trimmed + ALIGNMENT_MARKER + '\n', 'utf-8')
  }
}

async function copyDirectoryRecursive(sourceDir: string, destDir: string): Promise<void> {
  const entries = await readdir(sourceDir, { withFileTypes: true })

  for (const entry of entries) {
    const sourcePath = join(sourceDir, entry.name)
    const destPath = join(destDir, entry.name)

    if (entry.isDirectory()) {
      await safeMkdirP(destPath)
      await copyDirectoryRecursive(sourcePath, destPath)
    } else if (entry.isFile()) {
      await copyFileSafe(sourcePath, destPath)
    }
  }
}

async function mergeDirectoryContents(sourceDir: string, destDir: string): Promise<void> {
  const entries = await readdir(sourceDir, { withFileTypes: true })

  for (const entry of entries) {
    const sourcePath = join(sourceDir, entry.name)
    const destPath = join(destDir, entry.name)

    if (entry.isDirectory()) {
      await safeMkdirP(destPath)
      await mergeDirectoryContents(sourcePath, destPath)
      await rm(sourcePath, { recursive: true, force: true })
      continue
    }

    if (entry.isFile()) {
      await moveFileSafe(sourcePath, destPath)
    }
  }
}

async function finalizeKnowledgeBase(rootDir: string): Promise<void> {
  const knowledgeBaseStagingDir = resolveKnowledgeBaseStagingDir(rootDir)
  if (!(await directoryExists(knowledgeBaseStagingDir))) {
    return
  }

  const knowledgeBaseDir = resolveKnowledgeBaseDir(rootDir)
  await safeMkdirP(knowledgeBaseDir)
  await mergeDirectoryContents(knowledgeBaseStagingDir, knowledgeBaseDir)
  await rm(resolveKnowledgeBaseStagingRoot(rootDir), { recursive: true, force: true })
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
    managedAgents: [],
  }

  await rm(resolveKnowledgeBaseStagingRoot(rootDir), { recursive: true, force: true })

  if (options.docs.hasExistingDocsDirectory && options.docs.shouldArchiveExistingDocs) {
    await archiveDocsDirectory(rootDir, options)
    result.archivedPaths.push(`docs/ -> docs/knowledge-base/${options.docs.archiveDirectoryName}`)
  }

  if (options.agents.shouldArchiveExistingAgentFiles && options.agents.detectedExisting.length > 0) {
    await archiveAgentFiles(rootDir, options)
    for (const fileName of options.agents.detectedExisting) {
      result.archivedPaths.push(`${fileName} -> docs/knowledge-base/${fileName}`)
    }
  }

  if (options.markdownMigration.transferMode === 'move') {
    await moveMarkdownFiles(rootDir, options)
    for (const mdPath of options.markdownMigration.selectedPaths) {
      const relativePath = relative(resolve(rootDir), mdPath)
      result.movedPaths.push(`${mdPath} -> docs/knowledge-base/${relativePath}`)
    }
  } else if (options.markdownMigration.transferMode === 'copy') {
    await copyMarkdownFiles(rootDir, options)
    for (const mdPath of options.markdownMigration.selectedPaths) {
      const relativePath = relative(resolve(rootDir), mdPath)
      result.copiedPaths.push(`${mdPath} -> docs/knowledge-base/${relativePath}`)
    }
  }

  await scaffoldBlueprintDirectory(rootDir, options)
  await finalizeKnowledgeBase(rootDir)

  if (options.mode === 'skill') {
    result.createdDirectories.push(
      'docs/',
      'docs/knowledge-base/',
      'docs/milestones/',
      'docs/tweaks/',
      ...SKILL_INSTALL_BASES.map((skillBase) => `${skillBase}/`),
    )
  } else {
    result.createdDirectories.push('docs/', 'docs/core/', 'docs/knowledge-base/', 'docs/milestones/', 'docs/tweaks/')
  }
  result.createdFiles.push('docs/tweaks/README.md')

  await generateAgentFiles(rootDir, options)
  const selectedAgents = resolveSelectedAgents(options)
  for (const fileName of selectedAgents) {
    result.createdFiles.push(fileName)
  }
  result.managedAgents = selectedAgents

  // D.3: Write alignment marker to every scaffolded agent entry-point file
  await writeAlignmentMarker(rootDir, selectedAgents as AgentFileName[])

  await generateManifest(rootDir, options)
  result.createdFiles.push('docs/.blueprint/manifest.json')

  if (options.git.shouldInitialize) {
    await initializeGitRepository(rootDir, options)
    result.gitInitialized = true
    result.mainBranchConfigured = options.git.shouldSetMainBranch
  }

  return result
}
