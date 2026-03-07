export type MarkdownTransferMode = 'move' | 'copy' | 'skip'

export type AgentFileName = 'CLAUDE.md' | 'AGENTS.md' | 'GEMINI.md' | 'QWEN.md'

export const defaultArchiveDirectoryName = 'docs-archived'

export interface InitOptions {
  projectName: string
  git: {
    hasExistingRepository: boolean
    shouldInitialize: boolean
    shouldSetMainBranch: boolean
  }
  docs: {
    hasExistingDocsDirectory: boolean
    shouldArchiveExistingDocs: boolean
    archiveDirectoryName: string
  }
  markdownMigration: {
    discoveredMarkdownPaths: string[]
    transferMode: MarkdownTransferMode
    selectedPaths: string[]
  }
  agents: {
    selected: AgentFileName[]
    detectedExisting: AgentFileName[]
    shouldArchiveExistingAgentFiles: boolean
    ensureClaudeEntryPoint: boolean
  }
  confirmation: {
    confirmed: boolean
  }
}

export interface ScaffoldResult {
  createdDirectories: string[]
  createdFiles: string[]
  archivedPaths: string[]
  movedPaths: string[]
  copiedPaths: string[]
  gitInitialized: boolean
  mainBranchConfigured: boolean
  managedAgents: string[]
}

export interface OnboardingStep<TContext> {
  id: string
  label: string
  run(context: TContext): Promise<TContext>
}
