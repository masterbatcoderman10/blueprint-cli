import { createRequire } from 'node:module'

import { afterEach, describe, expect, it } from 'vitest'

import { applySchema } from '../../src/tracker/schema'
import { createTask, deleteTask, getTask, listTasks, updateTask } from '../../src/tracker/routes/tasks'

type DatabaseSync = import('node:sqlite').DatabaseSync

const require = createRequire(import.meta.url)
const { DatabaseSync } = require('node:sqlite') as typeof import('node:sqlite')

let db: DatabaseSync | undefined

function openMemoryDb(): DatabaseSync {
  db = new DatabaseSync(':memory:')
  db.exec('PRAGMA foreign_keys = ON')
  applySchema(db)
  return db
}

function createSampleTask(database: DatabaseSync, id = 'R6-1.A.1') {
  return createTask(database, {
    id,
    title: `Task ${id}`,
    description: 'Implement task CRUD',
    state: 'TO-DO',
    phase: 'Phase 1',
    stream: 'A',
    author: 'Codex',
    implementation_notes: 'TDD',
  })
}

afterEach(() => {
  db?.close()
  db = undefined
})

describe('Stream A — task CRUD route functions', () => {
  it('T-A.1.1: createTask inserts and returns the new task', () => {
    const database = openMemoryDb()

    const result = createSampleTask(database)

    expect(result).toMatchObject({
      ok: true,
      data: {
        id: 'R6-1.A.1',
        title: 'Task R6-1.A.1',
        description: 'Implement task CRUD',
        state: 'TO-DO',
        phase: 'Phase 1',
        stream: 'A',
        author: 'Codex',
        implementation_notes: 'TDD',
      },
    })
    expect(result.ok && result.data.created_at).toEqual(expect.any(Number))
    expect(result.ok && result.data.updated_at).toBe(result.ok && result.data.created_at)

    const row = database.prepare('SELECT id FROM tasks WHERE id = ?').get('R6-1.A.1')
    expect(row).toEqual({ id: 'R6-1.A.1' })
  })

  it('T-A.1.2: createTask rejects invalid state before inserting', () => {
    const database = openMemoryDb()

    const result = createTask(database, {
      id: 'R6-1.A.2',
      title: 'Invalid state',
      description: 'Should not insert',
      state: 'BOGUS',
      phase: 'Phase 1',
    })

    expect(result).toMatchObject({ ok: false, error: { code: 'invalid_state' } })
    const row = database.prepare('SELECT COUNT(*) AS count FROM tasks').get() as { count: number }
    expect(row.count).toBe(0)
  })

  it('T-A.1.3: createTask rejects duplicate IDs', () => {
    const database = openMemoryDb()
    createSampleTask(database)

    const result = createSampleTask(database)

    expect(result).toMatchObject({ ok: false, error: { code: 'duplicate_id' } })
    const row = database.prepare('SELECT COUNT(*) AS count FROM tasks WHERE id = ?').get('R6-1.A.1') as {
      count: number
    }
    expect(row.count).toBe(1)
  })

  it('T-A.1.4: getTask returns a task by ID', () => {
    const database = openMemoryDb()
    createSampleTask(database)

    const result = getTask(database, { id: 'R6-1.A.1' })

    expect(result).toMatchObject({ ok: true, data: { id: 'R6-1.A.1', title: 'Task R6-1.A.1' } })
  })

  it('T-A.1.5: getTask returns task_not_found for missing IDs', () => {
    const database = openMemoryDb()

    const result = getTask(database, { id: 'R6-1.A.404' })

    expect(result).toMatchObject({ ok: false, error: { code: 'task_not_found' } })
  })

  it('T-A.1.6: listTasks with no filter returns all tasks', () => {
    const database = openMemoryDb()
    createSampleTask(database, 'R6-1.A.1')
    createSampleTask(database, 'R6-1.A.2')

    const result = listTasks(database)

    expect(result).toMatchObject({ ok: true })
    expect(result.ok && result.data.map((task) => task.id)).toEqual(['R6-1.A.1', 'R6-1.A.2'])
  })

  it('T-A.1.7: listTasks filters by phase and stream', () => {
    const database = openMemoryDb()
    createSampleTask(database, 'R6-1.A.1')
    createTask(database, {
      id: 'R6-2.A.1',
      title: 'Later phase',
      description: 'Different phase',
      state: 'TO-DO',
      phase: 'Phase 2',
      stream: 'A',
    })
    createTask(database, {
      id: 'R6-1.B.1',
      title: 'Different stream',
      description: 'Stream B task',
      state: 'TO-DO',
      phase: 'Phase 1',
      stream: 'B',
    })

    const result = listTasks(database, { phase: 'Phase 1', stream: 'A' })

    expect(result).toMatchObject({ ok: true })
    expect(result.ok && result.data.map((task) => task.id)).toEqual(['R6-1.A.1'])
  })

  it('T-A.1.8: updateTask partially updates fields and advances updated_at', () => {
    const database = openMemoryDb()
    const created = createSampleTask(database)
    if (!created.ok) throw new Error('setup failed')

    const result = updateTask(database, {
      id: 'R6-1.A.1',
      title: 'Updated task',
      state: 'IN-PROGRESS',
      now: created.data.updated_at + 10,
    })

    expect(result).toMatchObject({
      ok: true,
      data: {
        id: 'R6-1.A.1',
        title: 'Updated task',
        description: 'Implement task CRUD',
        state: 'IN-PROGRESS',
        phase: 'Phase 1',
        stream: 'A',
      },
    })
    expect(result.ok && result.data.updated_at).toBeGreaterThan(created.data.updated_at)
  })

  it('T-A.1.9: updateTask returns task_not_found for missing IDs', () => {
    const database = openMemoryDb()

    const result = updateTask(database, { id: 'R6-1.A.404', title: 'Missing' })

    expect(result).toMatchObject({ ok: false, error: { code: 'task_not_found' } })
  })

  it('T-A.1.10: deleteTask removes a task', () => {
    const database = openMemoryDb()
    createSampleTask(database)

    const result = deleteTask(database, { id: 'R6-1.A.1' })

    expect(result).toMatchObject({ ok: true, data: { id: 'R6-1.A.1' } })
    expect(getTask(database, { id: 'R6-1.A.1' })).toMatchObject({
      ok: false,
      error: { code: 'task_not_found' },
    })
  })

  it('T-A.1.11: deleteTask returns task_not_found for missing IDs', () => {
    const database = openMemoryDb()

    const result = deleteTask(database, { id: 'R6-1.A.404' })

    expect(result).toMatchObject({ ok: false, error: { code: 'task_not_found' } })
  })
})
