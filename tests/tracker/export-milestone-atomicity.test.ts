import { afterEach, describe, expect, it } from 'vitest'

import BetterSqlite3 from 'better-sqlite3'

import { importSnapshot, SnapshotImportError } from '../../src/tracker/export'
import { applySchema } from '../../src/tracker/schema'

import type { TrackerSnapshot } from '../../src/tracker/export'
import type { Task, ReviewComment } from '../../src/tracker/types'

type TestDatabase = import('better-sqlite3').Database

let db: TestDatabase | undefined

function openMemoryDb(): TestDatabase {
  db = new BetterSqlite3(':memory:')
  db.pragma('foreign_keys = ON')
  applySchema(db)
  db.prepare(
    `INSERT INTO project_meta
      (id, name, tagline, phase_count, stream_count, created_at, updated_at)
     VALUES (1, ?, ?, NULL, NULL, ?, ?)`,
  ).run('Blueprint CLI', 'Structured software development', 1, 1)
  return db
}

afterEach(() => {
  db?.close()
  db = undefined
})

function makePreP5Task(id: string, phase: string): Record<string, unknown> {
  return {
    id,
    title: `Task ${id}`,
    description: `Description for ${id}`,
    state: 'TO-DO',
    phase,
    stream: null,
    author: null,
    implementation_notes: null,
    // milestone intentionally omitted — simulating pre-P5 data
    created_at: Date.now(),
    updated_at: Date.now(),
  }
}

function makeSnapshot(rawTasks: Record<string, unknown>[]): TrackerSnapshot {
  return {
    tasks: rawTasks as unknown as Task[],
    comments: [] as ReviewComment[],
    meta: {
      id: 1,
      name: 'Blueprint CLI',
      tagline: 'Structured software development',
      phase_count: null,
      stream_count: null,
      created_at: 1,
      updated_at: 1,
    },
  }
}

describe('Stream A — snapshot import atomicity', () => {
  it('T-R6-5.A.6.1: 51-row snapshot with row 51 malformed → all 51 rows rejected, DB row count = 0', () => {
    const database = openMemoryDb()

    // 50 well-formed rows
    const tasks: Record<string, unknown>[] = []
    for (let i = 1; i <= 50; i++) {
      tasks.push(makePreP5Task(`R6-5.A.${i}`, 'R6-5'))
    }

    // Row 51: malformed ID
    tasks.push({
      id: 'orphan-task',
      title: 'Malformed task',
      description: 'Bad ID',
      state: 'TO-DO',
      phase: 'unknown',
      stream: null,
      author: null,
      implementation_notes: null,
      created_at: Date.now(),
      updated_at: Date.now(),
    })

    const snapshot = makeSnapshot(tasks)

    // Import should throw
    expect(() => importSnapshot(database, snapshot)).toThrow()

    // Transaction rolled back completely — DB row count is exactly 0
    const count = (database.prepare('SELECT COUNT(*) AS count FROM tasks').get() as { count: number }).count
    expect(count).toBe(0)
  })

  it('T-R6-5.A.6.2: error message names the offending row ID', () => {
    const database = openMemoryDb()

    const tasks: Record<string, unknown>[] = [
      makePreP5Task('R6-5.A.1', 'R6-5'),
      {
        id: 'orphan-task',
        title: 'Malformed task',
        description: 'Bad ID',
        state: 'TO-DO',
        phase: 'unknown',
        stream: null,
        author: null,
        implementation_notes: null,
        created_at: Date.now(),
        updated_at: Date.now(),
      },
    ]

    const snapshot = makeSnapshot(tasks)

    try {
      importSnapshot(database, snapshot)
      expect.unreachable('Expected importSnapshot to throw')
    } catch (error) {
      expect(error).toBeInstanceOf(SnapshotImportError)
      const message = (error as Error).message
      expect(message).toContain('orphan-task')
      expect(message).toContain('1 task(s)')
    }
  })

  it('T-R6-5.A.6.3: after failed import, DB is clean and can accept a corrected snapshot', () => {
    const database = openMemoryDb()

    // First attempt: snapshot with malformed row
    const badTasks: Record<string, unknown>[] = []
    for (let i = 1; i <= 50; i++) {
      badTasks.push(makePreP5Task(`R6-5.A.${i}`, 'R6-5'))
    }
    badTasks.push({
      id: 'orphan-task',
      title: 'Malformed',
      description: 'Bad',
      state: 'TO-DO',
      phase: 'unknown',
      stream: null,
      author: null,
      implementation_notes: null,
      created_at: Date.now(),
      updated_at: Date.now(),
    })

    const badSnapshot = makeSnapshot(badTasks)
    expect(() => importSnapshot(database, badSnapshot)).toThrow()

    // DB is clean
    let count = (database.prepare('SELECT COUNT(*) AS count FROM tasks').get() as { count: number }).count
    expect(count).toBe(0)

    // Second attempt: corrected snapshot (50 well-formed rows only)
    const goodTasks: Record<string, unknown>[] = []
    for (let i = 1; i <= 50; i++) {
      goodTasks.push(makePreP5Task(`R6-5.A.${i}`, 'R6-5'))
    }

    const goodSnapshot = makeSnapshot(goodTasks)
    importSnapshot(database, goodSnapshot)

    // All 50 rows inserted successfully
    count = (database.prepare('SELECT COUNT(*) AS count FROM tasks').get() as { count: number }).count
    expect(count).toBe(50)

    // Verify milestones are correctly derived
    const rows = database.prepare('SELECT id, milestone FROM tasks ORDER BY id LIMIT 3').all() as Array<{
      id: string
      milestone: string
    }>
    expect(rows[0]).toEqual({ id: 'R6-5.A.1', milestone: 'R6' })
    expect(rows[1]).toEqual({ id: 'R6-5.A.10', milestone: 'R6' })
    expect(rows[2]).toEqual({ id: 'R6-5.A.11', milestone: 'R6' })
  })
})
