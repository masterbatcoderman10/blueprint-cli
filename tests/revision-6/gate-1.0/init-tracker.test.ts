import { access, mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import BetterSqlite3 from 'better-sqlite3'

import { initCommand } from '../../../src/commands/init'
import { clackPromptApi } from '../../../src/init/prompts'

type TestDatabase = import('better-sqlite3').Database

const tempRoots: string[] = []

async function makeRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'blueprint-init-tracker-'))
  tempRoots.push(root)
  await mkdir(join(root, '.git'))
  return root
}

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

async function runInitWithTrackerInputs(root: string): Promise<string> {
  const originalCwd = process.cwd
  const originalIntro = clackPromptApi.intro
  const originalText = clackPromptApi.text
  const originalMultiselect = clackPromptApi.multiselect
  const originalConfirm = clackPromptApi.confirm
  const originalNote = clackPromptApi.note
  const originalOutro = clackPromptApi.outro

  process.cwd = (() => root) as typeof process.cwd
  clackPromptApi.intro = vi.fn()
  clackPromptApi.text = vi.fn().mockResolvedValueOnce('tracker-project').mockResolvedValueOnce('Tracker tagline')
  clackPromptApi.multiselect = vi.fn().mockResolvedValue(['CLAUDE.md'])
  clackPromptApi.confirm = vi.fn().mockResolvedValue(true)
  clackPromptApi.note = vi.fn()
  clackPromptApi.outro = vi.fn()

  try {
    const result = await initCommand.handler({ commandName: 'init', args: [], rawArgv: ['init'] })
    expect(result).toEqual({ exitCode: 0 })
    return join(root, 'docs', '.blueprint', 'tasks.db')
  } finally {
    process.cwd = originalCwd
    clackPromptApi.intro = originalIntro
    clackPromptApi.text = originalText
    clackPromptApi.multiselect = originalMultiselect
    clackPromptApi.confirm = originalConfirm
    clackPromptApi.note = originalNote
    clackPromptApi.outro = originalOutro
  }
}

describe('Gate R6-1.0 — init tracker database', () => {
  it('T-1.0.5.1: blueprint init creates tasks.db with schema applied', async () => {
    const root = await makeRoot()
    const dbPath = await runInitWithTrackerInputs(root)

    await expect(access(dbPath)).resolves.toBeUndefined()
    const db: TestDatabase = new BetterSqlite3(dbPath)
    try {
      const userVersion = db.prepare('PRAGMA user_version').get() as { user_version: number }
      expect(userVersion.user_version).toBe(2)

      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('tasks', 'review_comments', 'project_meta') ORDER BY name")
        .all()
        .map((row) => (row as { name: string }).name)
      expect(tables).toEqual(['project_meta', 'review_comments', 'tasks'])
    } finally {
      db.close()
    }
  })

  it('T-1.0.5.2: blueprint init seeds one project_meta row from onboarding inputs', async () => {
    const root = await makeRoot()
    const dbPath = await runInitWithTrackerInputs(root)

    const db: TestDatabase = new BetterSqlite3(dbPath)
    try {
      const metaRows = db.prepare('SELECT name, tagline FROM project_meta').all() as Array<{
        name: string
        tagline: string
      }>
      expect(metaRows).toEqual([{ name: 'tracker-project', tagline: 'Tracker tagline' }])
    } finally {
      db.close()
    }
  })
})
