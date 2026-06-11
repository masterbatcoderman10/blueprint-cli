import { cp, mkdtemp, mkdir, rm, unlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import { describe, expect, it } from 'vitest'

import {
  assertLocalSkillPayloadMirror,
  getLocalSkillPayloadRelativePaths,
  listRelativeFiles,
} from '../phase-5/helpers'

const execFileAsync = promisify(execFile)

const ROOT_DIR = resolve(process.cwd())
const TEMPLATE_ROOT = join(ROOT_DIR, 'templates', 'skills', 'blueprint')
const LOCAL_ROOT = join(ROOT_DIR, '.claude', 'skills', 'blueprint')
const LOAD_CONTEXT_SCRIPT = join(LOCAL_ROOT, 'scripts', 'load-context.mjs')

describe('R11-5.B local skill install contract', () => {
  it('T-R11-5.B.1.1/T-R11-5.B.1.2 materializes exactly the expected 23-file .claude install', async () => {
    const localFiles = await listRelativeFiles(LOCAL_ROOT)

    expect(localFiles).toEqual(getLocalSkillPayloadRelativePaths().sort())
  })

  it('T-R11-5.B.2.1 keeps the local install byte-identical to templates/skills/blueprint', async () => {
    await expect(assertLocalSkillPayloadMirror(TEMPLATE_ROOT, LOCAL_ROOT)).resolves.toBeUndefined()
  })

  it('T-R11-5.B.2.2 rejects missing, drifted, and extra files in a local install fixture', async () => {
    const fixtureRoot = await mkdtemp(join(tmpdir(), 'blueprint-local-skill-'))
    const fixtureTemplateRoot = join(fixtureRoot, 'templates', 'skills', 'blueprint')
    const fixtureLocalRoot = join(fixtureRoot, '.claude', 'skills', 'blueprint')

    async function reseedFixture(): Promise<void> {
      await rm(join(fixtureRoot, 'templates'), { recursive: true, force: true })
      await rm(join(fixtureRoot, '.claude'), { recursive: true, force: true })
      await mkdir(join(fixtureRoot, 'templates', 'skills'), { recursive: true })
      await mkdir(join(fixtureRoot, '.claude', 'skills'), { recursive: true })
      await cp(TEMPLATE_ROOT, fixtureTemplateRoot, { recursive: true })
      await cp(LOCAL_ROOT, fixtureLocalRoot, { recursive: true })
    }

    try {
      await reseedFixture()
      await unlink(join(fixtureLocalRoot, 'reference', 'align.md'))
      await expect(assertLocalSkillPayloadMirror(fixtureTemplateRoot, fixtureLocalRoot)).rejects.toThrow(
        /align\.md/,
      )

      await reseedFixture()
      await writeFile(join(fixtureLocalRoot, 'reference', 'align.md'), '# drifted\n', 'utf-8')
      await expect(assertLocalSkillPayloadMirror(fixtureTemplateRoot, fixtureLocalRoot)).rejects.toThrow(
        /align\.md/,
      )

      await reseedFixture()
      await writeFile(join(fixtureLocalRoot, 'reference', 'extra.md'), '# extra\n', 'utf-8')
      await expect(assertLocalSkillPayloadMirror(fixtureTemplateRoot, fixtureLocalRoot)).rejects.toThrow(
        /extra\.md/,
      )
    } finally {
      await rm(fixtureRoot, { recursive: true, force: true })
    }
  })

  it('T-R11-5.B.3.1 runs the installed load-context script from the repository root', async () => {
    const { stdout, stderr } = await execFileAsync('node', [LOAD_CONTEXT_SCRIPT], {
      cwd: ROOT_DIR,
    })

    expect(stderr).toBe('')
    expect(stdout).toContain('## Project')
    expect(stdout).toContain('blueprint-cli')
    expect(stdout).toContain('Revision 11')
    expect(stdout).toContain('Phase 5 pending planning')
    expect(stdout).toContain('## Tracker')
    expect(stdout).toContain('initialised at docs/.blueprint/tasks.db')
  })
})
