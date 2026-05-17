import { access, mkdtemp, mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { openDb, trackerDbPath } from '../../../src/tracker/db'

const tempRoots: string[] = []

async function makeProjectRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'blueprint-tracker-db-'))
  tempRoots.push(root)
  await mkdir(join(root, 'docs', '.blueprint'), { recursive: true })
  return root
}

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

describe('Gate R6-1.0 — tracker database', () => {
  it('T-1.0.3.1: openDb creates docs/.blueprint/tasks.db and returns a working handle', async () => {
    const projectRoot = await makeProjectRoot()

    const handle = openDb(projectRoot)
    try {
      await expect(access(trackerDbPath(projectRoot))).resolves.toBeUndefined()
      const row = handle.db.prepare('SELECT 1 AS ok').get() as { ok: number }
      expect(row.ok).toBe(1)
    } finally {
      handle.close()
    }
  })

  it('T-1.0.3.2: openDb enables foreign keys', async () => {
    const projectRoot = await makeProjectRoot()

    const handle = openDb(projectRoot)
    try {
      const row = handle.db.prepare('PRAGMA foreign_keys').get() as { foreign_keys: number }
      expect(row.foreign_keys).toBe(1)
    } finally {
      handle.close()
    }
  })

  it('T-1.0.3.3: openDb preserves existing rows when called again', async () => {
    const projectRoot = await makeProjectRoot()
    const first = openDb(projectRoot)
    first.db
      .prepare(
        "INSERT INTO tasks (id, title, description, state, phase, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .run('R6-1.0.3', 'DB task', 'Open database', 'IN-PROGRESS', 'Phase 1', 1, 1)
    first.close()

    const second = openDb(projectRoot)
    try {
      const row = second.db.prepare('SELECT title FROM tasks WHERE id = ?').get('R6-1.0.3') as { title: string }
      expect(row.title).toBe('DB task')
    } finally {
      second.close()
    }
  })
})
