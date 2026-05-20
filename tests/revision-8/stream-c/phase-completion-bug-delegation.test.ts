import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const ROOT_DIR = resolve(__dirname, '..', '..', '..')
const LIVE_FILE = join(ROOT_DIR, 'docs', 'core', 'phase-completion.md')
const TEMPLATE_FILE = join(ROOT_DIR, 'templates', 'docs', 'core', 'phase-completion.md')

describe('T-R8-1.C.4: Phase-completion bug delegation loop', () => {
  it('T-R8-1.C.4.1: describes the orchestrator delegating bug tasks to execution agents', async () => {
    const content = await readFile(LIVE_FILE, 'utf-8')
    expect(content).toMatch(
      /orchestrator[\s\S]*?delegates[\s\S]*?bug[\s\S]*?execution agent/i,
    )
  })

  it('T-R8-1.C.4.2: states the orchestrator re-runs phase completion after bug resolution', async () => {
    const content = await readFile(LIVE_FILE, 'utf-8')
    expect(content).toMatch(
      /re-runs[\s\S]*?phase[\s\S]*?completion/i,
    )
  })

  it('T-R8-1.C.4.3: states the loop repeats until the full test suite is green', async () => {
    const content = await readFile(LIVE_FILE, 'utf-8')
    expect(content).toMatch(
      /loop repeats[\s\S]*?full test suite is green/i,
    )
  })

  it('T-R8-1.C.4.4: references execution.md and bug-resolution.md in the delegation path', async () => {
    const content = await readFile(LIVE_FILE, 'utf-8')
    expect(content).toMatch(/execution\.md/)
    expect(content).toMatch(/bug-resolution\.md/)
  })

  it('T-R8-1.C.4.5: handles multiple bug-delegation rounds', async () => {
    const content = await readFile(LIVE_FILE, 'utf-8')
    expect(content).toMatch(/second/i)
    expect(content).toMatch(/reruns[\s\S]*?completion[\s\S]*?batch/i)
  })
})

describe('T-R8-1.C.6: Template parity for phase-completion.md', () => {
  it('T-R8-1.C.6.2: template phase-completion.md matches the live doc', async () => {
    const [liveContent, templateContent] = await Promise.all([
      readFile(LIVE_FILE, 'utf-8'),
      readFile(TEMPLATE_FILE, 'utf-8'),
    ])
    expect(templateContent).toBe(liveContent)
  })
})
