import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const ROOT_DIR = resolve(__dirname, '..', '..', '..')
const LIVE_FILE = join(ROOT_DIR, 'docs', 'core', 'orchestrate.md')
const TEMPLATE_FILE = join(ROOT_DIR, 'templates', 'docs', 'core', 'orchestrate.md')

describe('T-R5-TW1: orchestrate delegation discipline guidance', () => {
  it('T-R5-TW1.1: forbids the orchestrator from acting as executor and redirects to execution.md', async () => {
    const content = await readFile(LIVE_FILE, 'utf-8')
    expect(content).toContain('<AntiPattern name="Orchestrator Acting as Executor">')
    expect(content).toMatch(/instead of delegating to an execution agent/i)
    expect(content).toMatch(
      /<AntiPattern name="Orchestrator Acting as Executor">[\s\S]*?execution\.md[\s\S]*?<\/AntiPattern>/,
    )
  })

  it('T-R5-TW1.2: forbids the orchestrator from acting as reviewer and redirects to review.md', async () => {
    const content = await readFile(LIVE_FILE, 'utf-8')
    expect(content).toContain('<AntiPattern name="Orchestrator Acting as Reviewer">')
    expect(content).toMatch(
      /<AntiPattern name="Orchestrator Acting as Reviewer">[\s\S]*?review\.md[\s\S]*?<\/AntiPattern>/,
    )
  })

  it('T-R5-TW1.3: forbids the orchestrator from diagnosing or fixing phase-completion bugs directly', async () => {
    const content = await readFile(LIVE_FILE, 'utf-8')
    expect(content).toContain('<AntiPattern name="Orchestrator Acting as Bug Fixer">')
    expect(content).toMatch(
      /<AntiPattern name="Orchestrator Acting as Bug Fixer">[\s\S]*?phase-completion\.md[\s\S]*?bug-resolution\.md[\s\S]*?<\/AntiPattern>/,
    )
  })

  it('T-R5-TW1.4: forbids oversized custom subagent prompts and constrains them to action plus stream context', async () => {
    const content = await readFile(LIVE_FILE, 'utf-8')
    expect(content).toContain('<AntiPattern name="Oversized Custom Subagent Prompts">')
    expect(content).toMatch(
      /<AntiPattern name="Oversized Custom Subagent Prompts">[\s\S]*?execute[\s\S]*?review[\s\S]*?address[\s\S]*?rereview[\s\S]*?phase completion[\s\S]*?phase\/stream context[\s\S]*?<\/AntiPattern>/i,
    )
  })

  it('T-R5-TW1.5: instructs the orchestrator to stop the board during closeout', async () => {
    const content = await readFile(LIVE_FILE, 'utf-8')
    expect(content).toContain('<OrchestrationCloseout>')
    expect(content).toMatch(/stop the board/i)
    expect(content).toMatch(/phase or stream orchestration finishes/i)
  })

  it('T-R5-TW1.6: template orchestrate module matches the live orchestration contract', async () => {
    const [liveContent, templateContent] = await Promise.all([
      readFile(LIVE_FILE, 'utf-8'),
      readFile(TEMPLATE_FILE, 'utf-8'),
    ])

    expect(templateContent).toBe(liveContent)
  })
})
