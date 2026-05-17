import { CommandDefinition } from '../runtime'
import { runInitOnboardingFlow } from '../init/onboarding'
import { executeScaffold } from '../init/archive-engine'
import { clackPromptApi } from '../init/prompts'
import { openDb } from '../tracker/db'

export const initCommand: CommandDefinition = {
  name: 'init',
  handler: async () => {
    const { options } = await runInitOnboardingFlow(process.cwd())

    if (!options.confirmation.confirmed) {
      return { exitCode: 0 }
    }

    const result = await executeScaffold(process.cwd(), options)
    const trackerDb = openDb(process.cwd())
    const now = Date.now()

    try {
      trackerDb.db
        .prepare(
          `INSERT OR REPLACE INTO project_meta
            (id, name, tagline, phase_count, stream_count, created_at, updated_at)
            VALUES (1, ?, ?, NULL, NULL, COALESCE((SELECT created_at FROM project_meta WHERE id = 1), ?), ?)`,
        )
        .run(options.projectName, options.projectTagline, now, now)
    } finally {
      trackerDb.close()
    }

    const summaryLines: string[] = []
    
    if (result.createdDirectories.length > 0) {
      summaryLines.push(`Created directories: ${result.createdDirectories.join(', ')}`)
    }
    
    if (result.createdFiles.length > 0) {
      summaryLines.push(`Created files: ${result.createdFiles.join(', ')}`)
    }
    
    if (result.archivedPaths.length > 0) {
      summaryLines.push(`Archived: ${result.archivedPaths.join(', ')}`)
    }
    
    if (result.movedPaths.length > 0) {
      summaryLines.push(`Moved: ${result.movedPaths.join(', ')}`)
    }
    
    if (result.copiedPaths.length > 0) {
      summaryLines.push(`Copied: ${result.copiedPaths.join(', ')}`)
    }
    
    if (result.gitInitialized) {
      summaryLines.push('Git initialized' + (result.mainBranchConfigured ? ' with main branch' : ''))
    }

    if (result.managedAgents.length > 0) {
      summaryLines.push(`Managed agents: ${result.managedAgents.join(', ')}`)
    }

    clackPromptApi.outro('Blueprint initialization complete!\n' + summaryLines.join('\n'))

    return { exitCode: 0 }
  },
}
