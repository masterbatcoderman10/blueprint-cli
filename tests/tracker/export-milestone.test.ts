import { afterEach, describe, expect, it } from 'vitest'

import BetterSqlite3 from 'better-sqlite3'

import { importSnapshot, serializeSnapshot, SnapshotImportError } from '../../src/tracker/export'
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

function makeTask(overrides: Partial<Task> & { id: string }): Task {
  return {
    title: `Task ${overrides.id}`,
    description: 'Test task',
    state: 'TO-DO',
    phase: 'R6-5',
    stream: 'A',
    author: null,
    implementation_notes: null,
    milestone: 'R6',
    created_at: Date.now(),
    updated_at: Date.now(),
    ...overrides,
  }
}

function makeSnapshot(tasks: Task[], comments: ReviewComment[] = []): TrackerSnapshot {
  return {
    tasks,
    comments,
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

describe('Stream A — export milestone back-compat', () => {
  it('T-R6-5.A.3.1: pre-P5 snapshot (no milestone field) imports with milestone derived from IDs', () => {
    const database = openMemoryDb()

    // Construct pre-P5 snapshot: tasks without milestone field
    // We use raw objects with milestone omitted to simulate pre-P5 data
    const preP5Tasks = [
      {
        id: 'R6-3.A.1',
        title: 'Phase 3 Stream A task',
        description: 'Pre-P5 task',
        state: 'TO-DO',
        phase: 'R6-3',
        stream: 'A',
        author: null,
        implementation_notes: null,
        created_at: 1000,
        updated_at: 1000,
        // milestone intentionally omitted
      },
      {
        id: 'M1-1.A.1',
        title: 'Milestone 1 task',
        description: 'Pre-P5 task from M1',
        state: 'DONE',
        phase: 'M1-1',
        stream: 'A',
        author: null,
        implementation_notes: null,
        created_at: 2000,
        updated_at: 2000,
        // milestone intentionally omitted
      },
    ] as Task[] // Cast to bypass type check — simulating pre-P5 data

    const snapshot = makeSnapshot(preP5Tasks)
    importSnapshot(database, snapshot)

    // Verify milestones were derived from IDs
    const tasks = database.prepare('SELECT id, milestone FROM tasks ORDER BY created_at').all() as Array<{
      id: string
      milestone: string
    }>
    expect(tasks).toHaveLength(2)
    expect(tasks[0]).toEqual({ id: 'R6-3.A.1', milestone: 'R6' })
    expect(tasks[1]).toEqual({ id: 'M1-1.A.1', milestone: 'M1' })
  })

  it('T-R6-5.A.3.2: snapshot with malformed IDs surfaces aggregated error and leaves DB untouched', () => {
    const database = openMemoryDb()

    const malformedTasks = [
      { ...makeTask({ id: 'R6-5.A.1' }), milestone: undefined as unknown as string },
      { id: 'orphan-task', title: 'Bad task', description: 'Malformed ID', state: 'TO-DO', phase: 'unknown', stream: null, author: null, implementation_notes: null, milestone: undefined as unknown as string, created_at: 1000, updated_at: 1000 },
      { ...makeTask({ id: 'R6-5.A.3' }), milestone: undefined as unknown as string },
    ] as Task[]

    const snapshot = makeSnapshot(malformedTasks)

    expect(() => importSnapshot(database, snapshot)).toThrow(SnapshotImportError)

    // Error message names the offending ID
    try {
      importSnapshot(database, snapshot)
    } catch (error) {
      expect(error).toBeInstanceOf(SnapshotImportError)
      const message = (error as Error).message
      expect(message).toContain('orphan-task')
      expect(message).toContain('1 task(s)')
    }

    // DB is untouched — no rows inserted
    const count = (database.prepare('SELECT COUNT(*) AS count FROM tasks').get() as { count: number }).count
    expect(count).toBe(0)
  })

  it('T-R6-5.A.3.3: round-trip export → import preserves milestone on every row', () => {
    const database = openMemoryDb()

    // Seed tasks directly
    database.prepare(
      `INSERT INTO tasks
        (id, title, description, state, phase, stream, author, implementation_notes, milestone, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      'R6-5.A.1',
      'Task R6-5.A.1',
      'Description',
      'TO-DO',
      'R6-5',
      'A',
      null,
      null,
      'R6',
      1000,
      1000,
    )
    database.prepare(
      `INSERT INTO tasks
        (id, title, description, state, phase, stream, author, implementation_notes, milestone, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      'M1-1.A.1',
      'Task M1-1.A.1',
      'Description',
      'DONE',
      'M1-1',
      'A',
      null,
      null,
      'M1',
      2000,
      2000,
    )

    // Export
    const snapshot = serializeSnapshot(database)

    // Verify exported snapshot includes milestones
    expect(snapshot.tasks).toHaveLength(2)
    const r6Task = snapshot.tasks.find((t) => t.id === 'R6-5.A.1')
    const m1Task = snapshot.tasks.find((t) => t.id === 'M1-1.A.1')
    expect(r6Task?.milestone).toBe('R6')
    expect(m1Task?.milestone).toBe('M1')

    // Clear DB and re-import
    database.prepare('DELETE FROM tasks').run()
    expect((database.prepare('SELECT COUNT(*) AS count FROM tasks').get() as { count: number }).count).toBe(0)

    importSnapshot(database, snapshot)

    // Verify milestones preserved after round-trip
    const tasks = database.prepare('SELECT id, milestone FROM tasks ORDER BY created_at').all() as Array<{
      id: string
      milestone: string
    }>
    expect(tasks).toHaveLength(2)
    expect(tasks[0]).toEqual({ id: 'R6-5.A.1', milestone: 'R6' })
    expect(tasks[1]).toEqual({ id: 'M1-1.A.1', milestone: 'M1' })
  })

  it('T-R6-5.A.3.HTTP: snapshot export JSON has correct shape (tasks, comments, meta)', () => {
    const database = openMemoryDb()

    database.prepare(
      `INSERT INTO tasks
        (id, title, description, state, phase, stream, author, implementation_notes, milestone, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      'R6-5.A.1',
      'Snapshot shape test',
      'Description',
      'TO-DO',
      'R6-5',
      'A',
      null,
      null,
      'R6',
      1000,
      1000,
    )

    const snapshot = serializeSnapshot(database)

    // No `ok` field on snapshots — internal format
    expect(snapshot).not.toHaveProperty('ok')
    expect(snapshot).toHaveProperty('tasks')
    expect(snapshot).toHaveProperty('comments')
    expect(snapshot).toHaveProperty('meta')
    expect(Array.isArray(snapshot.tasks)).toBe(true)
    expect(Array.isArray(snapshot.comments)).toBe(true)
    expect(snapshot.meta).not.toBeNull()
  })
})
