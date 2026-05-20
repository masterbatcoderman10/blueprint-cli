import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const ROOT_DIR = resolve(__dirname, '..', '..', '..')
const LIVE_FILE = join(ROOT_DIR, 'docs', 'core', 'orchestrate.md')
const TEMPLATE_FILE = join(ROOT_DIR, 'templates', 'docs', 'core', 'orchestrate.md')

describe('T-R8-1.C.1: Bug orchestration language in orchestrate.md', () => {
  it('T-R8-1.C.1.1: states bug-task orchestration uses the existing stream lifecycle in ORCHESTRATOR RESPONSIBILITIES', async () => {
    const content = await readFile(LIVE_FILE, 'utf-8')
    expect(content).toContain('<OrchestratorInvocation>')
    // Bug orchestration is mentioned in the responsibilities block
    expect(content).toMatch(
      /ORCHESTRATOR RESPONSIBILITIES:[\s\S]*?bug[\s\S]*?stream lifecycle[\s\S]*?execute→review→address→rereview/i,
    )
  })
})

describe('T-R8-1.C.2: Bug orchestration lifecycle reuse', () => {
  it('T-R8-1.C.2.1: contains a dedicated BugOrchestrationLifecycle section', async () => {
    const content = await readFile(LIVE_FILE, 'utf-8')
    expect(content).toContain('<BugOrchestrationLifecycle>')
    expect(content).toContain('</BugOrchestrationLifecycle>')
  })

  it('T-R8-1.C.2.2: states bug orchestration reuses the same lifecycle as planned streams', async () => {
    const content = await readFile(LIVE_FILE, 'utf-8')
    expect(content).toMatch(
      /<BugOrchestrationLifecycle>[\s\S]*?reuses the same[\s\S]*?lifecycle[\s\S]*?<\/BugOrchestrationLifecycle>/i,
    )
  })

  it('T-R8-1.C.2.3: states bug orchestration does not define a separate lifecycle', async () => {
    const content = await readFile(LIVE_FILE, 'utf-8')
    expect(content).toMatch(
      /<BugOrchestrationLifecycle>[\s\S]*?does not define a separate[\s\S]*?lifecycle[\s\S]*?<\/BugOrchestrationLifecycle>/i,
    )
  })

  it('T-R8-1.C.2.4: references bug-resolution.md in the bug lifecycle section', async () => {
    const content = await readFile(LIVE_FILE, 'utf-8')
    expect(content).toMatch(
      /<BugOrchestrationLifecycle>[\s\S]*?bug-resolution\.md[\s\S]*?<\/BugOrchestrationLifecycle>/,
    )
  })
})

describe('T-R8-1.C.3: Delegation prompt guidance', () => {
  it('T-R8-1.C.3.1: contains a dedicated DelegationPromptGuidance section', async () => {
    const content = await readFile(LIVE_FILE, 'utf-8')
    expect(content).toContain('<DelegationPromptGuidance>')
    expect(content).toContain('</DelegationPromptGuidance>')
  })

  it('T-R8-1.C.3.2: lists the required action types in delegation prompts', async () => {
    const content = await readFile(LIVE_FILE, 'utf-8')
    expect(content).toMatch(
      /<DelegationPromptGuidance>[\s\S]*?execute[\s\S]*?review[\s\S]*?address[\s\S]*?rereview[\s\S]*?phase completion[\s\S]*?<\/DelegationPromptGuidance>/i,
    )
  })

  it('T-R8-1.C.3.3: instructs not to inline workflow rules into delegation prompts', async () => {
    const content = await readFile(LIVE_FILE, 'utf-8')
    expect(content).toMatch(
      /<DelegationPromptGuidance>[\s\S]*?Do not inline[\s\S]*?<\/DelegationPromptGuidance>/,
    )
  })

  it('T-R8-1.C.3.4: includes a prompt template', async () => {
    const content = await readFile(LIVE_FILE, 'utf-8')
    expect(content).toMatch(
      /<DelegationPromptGuidance>[\s\S]*?PROMPT TEMPLATE[\s\S]*?<\/DelegationPromptGuidance>/,
    )
  })
})

describe('T-R8-1.C.5: Orchestration board shutdown', () => {
  it('T-R8-1.C.5.1: instructs to stop the board during closeout', async () => {
    const content = await readFile(LIVE_FILE, 'utf-8')
    expect(content).toContain('<OrchestrationCloseout>')
    expect(content).toMatch(/stop the board/i)
  })
})

describe('T-R8-1.C.6: Template parity for orchestrate.md', () => {
  it('T-R8-1.C.6.1: template orchestrate.md matches the live doc', async () => {
    const [liveContent, templateContent] = await Promise.all([
      readFile(LIVE_FILE, 'utf-8'),
      readFile(TEMPLATE_FILE, 'utf-8'),
    ])
    expect(templateContent).toBe(liveContent)
  })
})
