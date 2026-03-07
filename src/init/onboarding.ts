import { basename, join, resolve } from 'node:path'
import { stat } from 'node:fs/promises'

import { clackPromptApi } from './prompts'
import { directoryExists, scanMarkdownFiles } from './fs-utils'
import {
  type AgentFileName,
  type InitOptions,
  type MarkdownTransferMode,
  defaultArchiveDirectoryName,
} from './types'

export const onboardingIntroMessage = 'Blueprint init'
export const projectNamePromptMessage = 'Project name'
export const missingGitRepositoryWarning = 'No .git directory found. Blueprint can initialize git and set the main branch.'
export const gitInitializationPromptMessage = 'Initialize git repository and set branch to main?'
export const existingDocsWarningPrefix = 'Existing docs/ directory detected and will be replaced during scaffold.'
export const markdownHandlingScopePromptMessage = 'How would you like to handle discovered markdown files?'
export const markdownTransferModePromptMessage = 'Choose migration mode for markdown files'
export const markdownFileSelectionPromptMessage = 'Select markdown files to include'
export const markdownDiscoveryNoteTitle = 'Discovered Markdown Files'
export const agentSelectionPromptMessage = 'Select agent entry-point files to generate'
export const existingAgentFilesPromptMessage = 'Existing agent files were found. Archive before overwrite?'
export const detectedAgentFilesNoteTitle = 'Detected Agent Files'
export const confirmationPromptMessage = 'Proceed with these planned actions?'
export const confirmationSummaryNoteTitle = 'Planned Actions'

export function validateProjectName(value: string | undefined): string | undefined {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return 'Project name is required.'
  }

  return undefined
}

export async function promptForProjectName(): Promise<string> {
  clackPromptApi.intro(onboardingIntroMessage)

  const response = await clackPromptApi.text({
    message: projectNamePromptMessage,
    placeholder: 'my-project',
    validate: validateProjectName,
  })

  if (typeof response !== 'string') {
    throw new Error('Initialization cancelled before project name was provided.')
  }

  return response.trim()
}

export async function detectExistingGitRepository(rootDir: string): Promise<boolean> {
  return directoryExists(join(resolve(rootDir), '.git'))
}

export interface GitInitializationChoice {
  hasExistingRepository: boolean
  shouldInitialize: boolean
  shouldSetMainBranch: boolean
  warningMessage?: string
}

export interface InitOnboardingFlowResult {
  options: InitOptions
}

export async function promptGitInitializationChoice(rootDir: string): Promise<GitInitializationChoice> {
  const hasExistingRepository = await detectExistingGitRepository(rootDir)

  if (hasExistingRepository) {
    return {
      hasExistingRepository,
      shouldInitialize: false,
      shouldSetMainBranch: false,
    }
  }

  clackPromptApi.note(missingGitRepositoryWarning, 'Git Setup')

  const confirmation = await clackPromptApi.confirm({
    message: gitInitializationPromptMessage,
    initialValue: true,
  })

  if (typeof confirmation !== 'boolean') {
    throw new Error('Initialization cancelled during git setup confirmation.')
  }

  return {
    hasExistingRepository,
    shouldInitialize: confirmation,
    shouldSetMainBranch: confirmation,
    warningMessage: missingGitRepositoryWarning,
  }
}

export async function detectExistingDocsDirectory(rootDir: string): Promise<boolean> {
  return directoryExists(join(resolve(rootDir), 'docs'))
}

export interface DocsArchiveChoice {
  hasExistingDocsDirectory: boolean
  shouldArchiveExistingDocs: boolean
  archiveDirectoryName: string
  warningMessage?: string
}

export function buildDocsReplacementWarningMessage(archiveDirectoryName: string): string {
  return `${existingDocsWarningPrefix} Archive destination: knowledge-base/${archiveDirectoryName}.`
}

export async function promptDocsArchiveChoice(
  rootDir: string,
  archiveDirectoryName: string = defaultArchiveDirectoryName,
): Promise<DocsArchiveChoice> {
  const hasExistingDocsDirectory = await detectExistingDocsDirectory(rootDir)

  if (!hasExistingDocsDirectory) {
    return {
      hasExistingDocsDirectory,
      shouldArchiveExistingDocs: false,
      archiveDirectoryName,
    }
  }

  const warningMessage = buildDocsReplacementWarningMessage(archiveDirectoryName)
  clackPromptApi.note(warningMessage, 'Docs Setup')

  const confirmation = await clackPromptApi.confirm({
    message: `Archive existing docs/ to knowledge-base/${archiveDirectoryName} before scaffold?`,
    initialValue: true,
  })

  if (typeof confirmation !== 'boolean') {
    throw new Error('Initialization cancelled during docs archive confirmation.')
  }

  return {
    hasExistingDocsDirectory,
    shouldArchiveExistingDocs: confirmation,
    archiveDirectoryName,
    warningMessage,
  }
}

export async function discoverMarkdownFilesForMigration(rootDir: string): Promise<string[]> {
  return scanMarkdownFiles(rootDir)
}

export type MarkdownSelectionScope = 'global' | 'per-file'

export interface MarkdownMigrationChoice {
  discoveredMarkdownPaths: string[]
  transferMode: MarkdownTransferMode
  selectedPaths: string[]
  selectionScope: MarkdownSelectionScope
}

export function formatDiscoveredMarkdownPaths(paths: string[]): string {
  return paths.map((path) => `- ${path}`).join('\n')
}

export async function promptMarkdownMigrationChoice(rootDir: string): Promise<MarkdownMigrationChoice> {
  const discoveredMarkdownPaths = await discoverMarkdownFilesForMigration(rootDir)

  if (discoveredMarkdownPaths.length === 0) {
    return {
      discoveredMarkdownPaths,
      transferMode: 'skip',
      selectedPaths: [],
      selectionScope: 'global',
    }
  }

  clackPromptApi.note(formatDiscoveredMarkdownPaths(discoveredMarkdownPaths), markdownDiscoveryNoteTitle)

  const scopeResponse = await clackPromptApi.select({
    message: markdownHandlingScopePromptMessage,
    options: [
      { value: 'global', label: 'Use one decision for all markdown files' },
      { value: 'per-file', label: 'Select specific markdown files' },
    ],
    initialValue: 'global',
  })

  if (scopeResponse !== 'global' && scopeResponse !== 'per-file') {
    throw new Error('Initialization cancelled during markdown handling scope selection.')
  }

  const transferModeResponse = await clackPromptApi.select({
    message: markdownTransferModePromptMessage,
    options: [
      { value: 'move', label: 'Move to knowledge-base (preferred)' },
      { value: 'copy', label: 'Copy to knowledge-base' },
      { value: 'skip', label: 'Do not migrate markdown files' },
    ],
    initialValue: 'move',
  })

  if (transferModeResponse !== 'move' && transferModeResponse !== 'copy' && transferModeResponse !== 'skip') {
    throw new Error('Initialization cancelled during markdown transfer mode selection.')
  }

  if (scopeResponse === 'global' || transferModeResponse === 'skip') {
    return {
      discoveredMarkdownPaths,
      transferMode: transferModeResponse,
      selectedPaths: transferModeResponse === 'skip' ? [] : discoveredMarkdownPaths,
      selectionScope: scopeResponse,
    }
  }

  const selectedResponse = await clackPromptApi.multiselect({
    message: markdownFileSelectionPromptMessage,
    options: discoveredMarkdownPaths.map((path) => ({ value: path, label: path })),
    initialValues: discoveredMarkdownPaths,
    required: false,
  })

  if (!Array.isArray(selectedResponse) || !selectedResponse.every((item) => typeof item === 'string')) {
    throw new Error('Initialization cancelled during markdown file selection.')
  }

  return {
    discoveredMarkdownPaths,
    transferMode: transferModeResponse,
    selectedPaths: selectedResponse,
    selectionScope: scopeResponse,
  }
}

export const supportedAgentFiles: AgentFileName[] = ['CLAUDE.md', 'AGENTS.md', 'GEMINI.md', 'QWEN.md']

async function fileExists(filePath: string): Promise<boolean> {
  try {
    const fileStats = await stat(filePath)
    return fileStats.isFile()
  } catch {
    return false
  }
}

export async function detectExistingAgentFiles(rootDir: string): Promise<AgentFileName[]> {
  const normalizedRootDir = resolve(rootDir)
  const existenceResults = await Promise.all(
    supportedAgentFiles.map(async (fileName) => ({
      fileName,
      exists: await fileExists(join(normalizedRootDir, fileName)),
    })),
  )

  return existenceResults
    .filter((result) => result.exists)
    .map((result) => result.fileName)
}

export function normalizeSelectedAgentFiles(selection: AgentFileName[]): AgentFileName[] {
  const orderedUnique = Array.from(new Set(selection))
  if (!orderedUnique.includes('CLAUDE.md')) {
    return ['CLAUDE.md', ...orderedUnique]
  }

  return orderedUnique
}

export function buildAgentArchivePromptMessage(detectedExisting: AgentFileName[]): string {
  const fileList = detectedExisting.join(', ')
  return `Archive detected agent files (${fileList}) to knowledge-base/ before overwrite?`
}

export interface AgentSelectionChoice {
  selected: AgentFileName[]
  detectedExisting: AgentFileName[]
  shouldArchiveExistingAgentFiles: boolean
  ensureClaudeEntryPoint: boolean
}

export async function promptAgentSelectionChoice(rootDir: string): Promise<AgentSelectionChoice> {
  const detectedExisting = await detectExistingAgentFiles(rootDir)

  let shouldArchiveExistingAgentFiles = false
  if (detectedExisting.length > 0) {
    clackPromptApi.note(detectedExisting.map((file) => `- ${file}`).join('\n'), detectedAgentFilesNoteTitle)

    const archiveResponse = await clackPromptApi.confirm({
      message: buildAgentArchivePromptMessage(detectedExisting),
      initialValue: true,
    })

    if (typeof archiveResponse !== 'boolean') {
      throw new Error('Initialization cancelled during existing agent file archive confirmation.')
    }

    shouldArchiveExistingAgentFiles = archiveResponse
  }

  const selectedResponse = await clackPromptApi.multiselect({
    message: agentSelectionPromptMessage,
    options: supportedAgentFiles.map((fileName) => ({ value: fileName, label: fileName })),
    initialValues: ['CLAUDE.md'],
    required: false,
  })

  if (!Array.isArray(selectedResponse) || !selectedResponse.every((item) => typeof item === 'string')) {
    throw new Error('Initialization cancelled during agent selection.')
  }

  const selected = normalizeSelectedAgentFiles(
    selectedResponse.filter((item): item is AgentFileName => supportedAgentFiles.includes(item as AgentFileName)),
  )

  return {
    selected,
    detectedExisting,
    shouldArchiveExistingAgentFiles,
    ensureClaudeEntryPoint: true,
  }
}

export function buildConfirmationSummaryLines(options: InitOptions): string[] {
  const summaryLines: string[] = []
  const selectedAgentFiles = normalizeSelectedAgentFiles(options.agents.selected)

  summaryLines.push(`Create: Blueprint docs scaffold for "${options.projectName}"`)
  summaryLines.push(`Create: agent entry files -> ${selectedAgentFiles.join(', ')}`)

  if (options.docs.hasExistingDocsDirectory && options.docs.shouldArchiveExistingDocs) {
    summaryLines.push(`Archive: docs/ -> knowledge-base/${options.docs.archiveDirectoryName}`)
  } else if (options.docs.hasExistingDocsDirectory) {
    summaryLines.push('Overwrite: existing docs/ will be replaced (no archive)')
  }

  if (options.agents.shouldArchiveExistingAgentFiles && options.agents.detectedExisting.length > 0) {
    for (const fileName of options.agents.detectedExisting) {
      summaryLines.push(`Archive: ${fileName} -> knowledge-base/${fileName}`)
    }
  } else if (options.agents.detectedExisting.length > 0) {
    for (const fileName of options.agents.detectedExisting) {
      summaryLines.push(`Overwrite: ${fileName} at project root (no archive)`)
    }
  }

  const selectedMarkdownPaths = new Set(options.markdownMigration.selectedPaths)
  if (options.markdownMigration.transferMode === 'move' || options.markdownMigration.transferMode === 'copy') {
    const verb = options.markdownMigration.transferMode === 'move' ? 'Move' : 'Copy'
    for (const selectedPath of options.markdownMigration.selectedPaths) {
      summaryLines.push(`${verb}: ${selectedPath} -> knowledge-base/${basename(selectedPath)}`)
    }

    for (const discoveredPath of options.markdownMigration.discoveredMarkdownPaths) {
      if (!selectedMarkdownPaths.has(discoveredPath)) {
        summaryLines.push(`Skip: markdown file not selected -> ${discoveredPath}`)
      }
    }
  }

  if (options.markdownMigration.transferMode === 'skip') {
    for (const discoveredPath of options.markdownMigration.discoveredMarkdownPaths) {
      summaryLines.push(`Skip: markdown file -> ${discoveredPath}`)
    }
  }

  if (options.git.hasExistingRepository) {
    summaryLines.push('Git: existing repository detected, initialization skipped')
  } else if (options.git.shouldInitialize) {
    summaryLines.push('Git: run `git init`')
    if (options.git.shouldSetMainBranch) {
      summaryLines.push('Git: run `git branch -M main`')
    }
  } else {
    summaryLines.push('Git: initialization declined')
  }

  return summaryLines
}

export async function promptConfirmation(options: InitOptions): Promise<boolean> {
  const summaryLines = buildConfirmationSummaryLines(options)
  clackPromptApi.note(summaryLines.map((line) => `- ${line}`).join('\n'), confirmationSummaryNoteTitle)

  const confirmed = await clackPromptApi.confirm({
    message: confirmationPromptMessage,
    initialValue: true,
  })

  if (typeof confirmed !== 'boolean') {
    throw new Error('Initialization cancelled during final confirmation.')
  }

  if (!confirmed) {
    clackPromptApi.outro('Initialization aborted. No filesystem changes were made.')
  }

  return confirmed
}

export async function runInitOnboardingFlow(rootDir: string): Promise<InitOnboardingFlowResult> {
  const projectName = await promptForProjectName()
  const gitChoice = await promptGitInitializationChoice(rootDir)
  const docsChoice = await promptDocsArchiveChoice(rootDir)
  const markdownChoice = await promptMarkdownMigrationChoice(rootDir)
  const agentChoice = await promptAgentSelectionChoice(rootDir)

  const options: InitOptions = {
    projectName,
    git: {
      hasExistingRepository: gitChoice.hasExistingRepository,
      shouldInitialize: gitChoice.shouldInitialize,
      shouldSetMainBranch: gitChoice.shouldSetMainBranch,
    },
    docs: {
      hasExistingDocsDirectory: docsChoice.hasExistingDocsDirectory,
      shouldArchiveExistingDocs: docsChoice.shouldArchiveExistingDocs,
      archiveDirectoryName: docsChoice.archiveDirectoryName,
    },
    markdownMigration: {
      discoveredMarkdownPaths: markdownChoice.discoveredMarkdownPaths,
      transferMode: markdownChoice.transferMode,
      selectedPaths: markdownChoice.selectedPaths,
    },
    agents: {
      selected: agentChoice.selected,
      detectedExisting: agentChoice.detectedExisting,
      shouldArchiveExistingAgentFiles: agentChoice.shouldArchiveExistingAgentFiles,
      ensureClaudeEntryPoint: agentChoice.ensureClaudeEntryPoint,
    },
    confirmation: {
      confirmed: false,
    },
  }

  options.confirmation.confirmed = await promptConfirmation(options)
  return { options }
}
