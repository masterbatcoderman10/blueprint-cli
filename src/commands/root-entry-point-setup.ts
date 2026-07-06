import { readFile, stat } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import { SUPPORTED_AGENT_FILES } from '../doctor/structure'
import type { AgentFileName } from '../init/types'

export type RootSetupBlockName = 'ProjectConventions' | 'AgentOrchestration'
export type AlignmentMarkerState = 'required' | 'complete' | 'missing-marker' | 'absent'

export type RootSetupBlockFailureCode =
  | 'missing_open_tag'
  | 'missing_close_tag'
  | 'out_of_order_tags'
  | 'duplicate_open_tag'
  | 'duplicate_close_tag'
  | 'placeholder_content'
  | 'project_conventions_mismatch'

export interface RootSetupBlockFailure {
  fileName: AgentFileName
  blockName: RootSetupBlockName
  code: RootSetupBlockFailureCode
  message: string
}

export interface SupportedRootAgentFileInspection {
  fileName: AgentFileName
  path: string
  state: AlignmentMarkerState
}

export interface AlignmentCompletionRootFileValidationResult {
  required: SupportedRootAgentFileInspection[]
  alreadyComplete: SupportedRootAgentFileInspection[]
  markerless: SupportedRootAgentFileInspection[]
  absent: SupportedRootAgentFileInspection[]
  failures: RootSetupBlockFailure[]
}

export type RootSetupBlockExtractionResult =
  | {
      ok: true
      block: string
    }
  | {
      ok: false
      failure: RootSetupBlockFailure
    }

function buildFailure(
  fileName: AgentFileName,
  blockName: RootSetupBlockName,
  code: RootSetupBlockFailureCode,
  detail: string,
): RootSetupBlockExtractionResult {
  return {
    ok: false,
    failure: {
      fileName,
      blockName,
      code,
      message: `${fileName}: invalid <${blockName}> block - ${detail}`,
    },
  }
}

export function extractRequiredRootSetupBlock(
  fileName: AgentFileName,
  content: string,
  blockName: RootSetupBlockName,
): RootSetupBlockExtractionResult {
  const startTag = `<${blockName}>`
  const endTag = `</${blockName}>`
  const startIndex = content.indexOf(startTag)
  const endIndex = content.indexOf(endTag)

  if (startIndex === -1) {
    return buildFailure(fileName, blockName, 'missing_open_tag', `missing opening tag ${startTag}`)
  }

  if (endIndex === -1) {
    return buildFailure(fileName, blockName, 'missing_close_tag', `missing closing tag ${endTag}`)
  }

  if (endIndex < startIndex) {
    return buildFailure(fileName, blockName, 'out_of_order_tags', 'closing tag appears before opening tag')
  }

  const duplicateStartIndex = content.indexOf(startTag, startIndex + startTag.length)
  if (duplicateStartIndex !== -1) {
    return buildFailure(fileName, blockName, 'duplicate_open_tag', `duplicate opening tag ${startTag}`)
  }

  const block = content.slice(startIndex, endIndex + endTag.length)
  const duplicateEndIndex = content.indexOf(endTag, endIndex + endTag.length)
  if (duplicateEndIndex !== -1) {
    return buildFailure(fileName, blockName, 'duplicate_close_tag', `duplicate closing tag ${endTag}`)
  }

  if (block.includes('Alignment pending.')) {
    return buildFailure(fileName, blockName, 'placeholder_content', 'placeholder content `Alignment pending.` is not allowed')
  }

  return {
    ok: true,
    block,
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    return (await stat(filePath)).isFile()
  } catch {
    return false
  }
}

export async function readAlignmentMarkerState(filePath: string): Promise<AlignmentMarkerState> {
  if (!(await fileExists(filePath))) {
    return 'absent'
  }

  const content = await readFile(filePath, 'utf-8')
  if (content.includes('<!-- blueprint-status: alignment-complete -->')) {
    return 'complete'
  }

  if (content.includes('<!-- blueprint-status: alignment-required -->')) {
    return 'required'
  }

  return 'missing-marker'
}

export async function inspectSupportedRootAgentFiles(
  projectRoot: string,
): Promise<SupportedRootAgentFileInspection[]> {
  const normalizedRoot = resolve(projectRoot)
  const inspected: SupportedRootAgentFileInspection[] = []

  for (const fileName of SUPPORTED_AGENT_FILES as AgentFileName[]) {
    const path = join(normalizedRoot, fileName)
    inspected.push({
      fileName,
      path,
      state: await readAlignmentMarkerState(path),
    })
  }

  return inspected
}

export async function validateAlignmentCompletionRootFiles(
  projectRoot: string,
): Promise<AlignmentCompletionRootFileValidationResult> {
  const inspected = await inspectSupportedRootAgentFiles(projectRoot)
  const result: AlignmentCompletionRootFileValidationResult = {
    required: [],
    alreadyComplete: [],
    markerless: [],
    absent: [],
    failures: [],
  }
  const validatedProjectConventions: Array<{
    fileName: AgentFileName
    projectConventionsBlock: string
  }> = []

  for (const entry of inspected) {
    if (entry.state === 'required') {
      result.required.push(entry)
    } else if (entry.state === 'complete') {
      result.alreadyComplete.push(entry)
    } else if (entry.state === 'missing-marker') {
      result.markerless.push(entry)
      continue
    } else {
      result.absent.push(entry)
      continue
    }

    const content = await readFile(entry.path, 'utf-8')
    const projectConventions = extractRequiredRootSetupBlock(entry.fileName, content, 'ProjectConventions')
    const agentOrchestration = extractRequiredRootSetupBlock(entry.fileName, content, 'AgentOrchestration')

    if (!projectConventions.ok) {
      result.failures.push(projectConventions.failure)
    }

    if (!agentOrchestration.ok) {
      result.failures.push(agentOrchestration.failure)
    }

    if (projectConventions.ok) {
      validatedProjectConventions.push({
        fileName: entry.fileName,
        projectConventionsBlock: projectConventions.block,
      })
    }
  }

  const [canonical, ...rest] = validatedProjectConventions
  if (canonical) {
    for (const entry of rest) {
      if (entry.projectConventionsBlock !== canonical.projectConventionsBlock) {
        result.failures.push({
          fileName: entry.fileName,
          blockName: 'ProjectConventions',
          code: 'project_conventions_mismatch',
          message: `${entry.fileName}: <ProjectConventions> must be byte-identical to ${canonical.fileName}`,
        })
      }
    }
  }

  return result
}
