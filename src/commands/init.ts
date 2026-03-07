import { CommandDefinition } from '../runtime'
import { runInitOnboardingFlow } from '../init/onboarding'
import { executeScaffold } from '../init/archive-engine'
import { clackPromptApi } from '../init/prompts'

export const initCommand: CommandDefinition = {
  name: 'init',
  handler: async () => {
    const { options } = await runInitOnboardingFlow(process.cwd())

    if (!options.confirmation.confirmed) {
      return { exitCode: 0 }
    }

    const result = await executeScaffold(process.cwd(), options)

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

    clackPromptApi.outro('Blueprint initialization complete!\n' + summaryLines.join('\n'))

    return { exitCode: 0 }
  },
}
