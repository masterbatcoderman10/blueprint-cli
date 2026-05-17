import { afterEach, describe, expect, it } from 'vitest'

import BetterSqlite3 from 'better-sqlite3'

import {
  createComment,
  deleteComment,
  listComments,
  updateComment,
} from '../../src/tracker/routes/comments'
import { applySchema } from '../../src/tracker/schema'

type TestDatabase = import('better-sqlite3').Database

let db: TestDatabase | undefined

function openMemoryDb(): TestDatabase {
  db = new BetterSqlite3(':memory:')
  db.pragma('foreign_keys = ON')
  applySchema(db)
  return db
}

function insertTask(database: DatabaseSync, id: string): void {
  database
    .prepare(
      "INSERT INTO tasks (id, title, description, state, phase, stream, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .run(id, `Task ${id}`, '', 'IN-PROGRESS', 'Phase 1', 'B', 1, 1)
}

function countComments(database: DatabaseSync, taskId: string): number {
  const row = database.prepare('SELECT COUNT(*) AS count FROM review_comments WHERE task_id = ?').get(taskId) as {
    count: number
  }
  return row.count
}

afterEach(() => {
  db?.close()
  db = undefined
})

describe('Stream B — tracker comment CRUD', () => {
  it('T-B.1.1: createComment inserts and returns a MAJOR comment on an existing task', () => {
    const database = openMemoryDb()
    insertTask(database, 'R6-1.B.1')

    const result = createComment(database, 'R6-1.B.1', {
      severity: 'MAJOR',
      body: 'Missing cascade assertion.',
      author: 'Reviewer',
      line: 'tests/revision-6/stream-b/comments.test.ts:1',
    })

    expect(result).toHaveProperty('data')
    if ('error' in result) {
      throw new Error(result.error.message)
    }
    expect(result.data).toMatchObject({
      task_id: 'R6-1.B.1',
      parent_id: null,
      severity: 'MAJOR',
      body: 'Missing cascade assertion.',
      author: 'Reviewer',
      line: 'tests/revision-6/stream-b/comments.test.ts:1',
    })
    expect(typeof result.data.id).toBe('string')
    expect(result.data.created_at).toBe(result.data.updated_at)
    expect(countComments(database, 'R6-1.B.1')).toBe(1)
  })

  it('T-B.1.2: createComment rejects invalid severity before inserting', () => {
    const database = openMemoryDb()
    insertTask(database, 'R6-1.B.1')

    const result = createComment(database, 'R6-1.B.1', {
      severity: 'CRITICAL',
      body: 'Use a supported severity.',
    })

    expect(result).toEqual({
      error: {
        code: 'invalid_severity',
        message: expect.any(String),
      },
    })
    expect(countComments(database, 'R6-1.B.1')).toBe(0)
  })

  it('T-B.1.3: createComment rejects a parent_id from another task', () => {
    const database = openMemoryDb()
    insertTask(database, 'R6-1.B.1')
    insertTask(database, 'R6-1.B.2')
    const parent = createComment(database, 'R6-1.B.2', { severity: 'MINOR', body: 'Different task.' })
    if ('error' in parent) {
      throw new Error(parent.error.message)
    }

    const result = createComment(database, 'R6-1.B.1', {
      severity: 'MAJOR',
      body: 'Reply must stay inside task.',
      parent_id: parent.data.id,
    })

    expect(result).toEqual({
      error: {
        code: 'invalid_parent',
        message: expect.any(String),
      },
    })
    expect(countComments(database, 'R6-1.B.1')).toBe(0)
  })

  it('T-B.1.4: createComment returns task_not_found for a missing task', () => {
    const database = openMemoryDb()

    const result = createComment(database, 'R6-1.B.missing', { severity: 'MAJOR', body: 'No task.' })

    expect(result).toEqual({
      error: {
        code: 'task_not_found',
        message: expect.any(String),
      },
    })
  })

  it('T-B.1.5: createComment accepts a parent_id from the same task', () => {
    const database = openMemoryDb()
    insertTask(database, 'R6-1.B.1')
    const parent = createComment(database, 'R6-1.B.1', { severity: 'MAJOR', body: 'Parent.' })
    if ('error' in parent) {
      throw new Error(parent.error.message)
    }

    const reply = createComment(database, 'R6-1.B.1', {
      severity: 'MINOR',
      body: 'Reply.',
      parent_id: parent.data.id,
    })

    expect(reply).toHaveProperty('data')
    if ('error' in reply) {
      throw new Error(reply.error.message)
    }
    expect(reply.data.parent_id).toBe(parent.data.id)
  })

  it('T-B.1.6: listComments returns a flat array sorted by created_at ascending', () => {
    const database = openMemoryDb()
    insertTask(database, 'R6-1.B.1')
    const third = createComment(database, 'R6-1.B.1', { severity: 'MINOR', body: 'Third.' })
    const first = createComment(database, 'R6-1.B.1', { severity: 'MAJOR', body: 'First.' })
    const second = createComment(database, 'R6-1.B.1', { severity: 'MINOR', body: 'Second.' })
    if ('error' in first || 'error' in second || 'error' in third) {
      throw new Error('setup failed')
    }
    database.prepare('UPDATE review_comments SET created_at = ? WHERE id = ?').run(30, third.data.id)
    database.prepare('UPDATE review_comments SET created_at = ? WHERE id = ?').run(10, first.data.id)
    database.prepare('UPDATE review_comments SET created_at = ? WHERE id = ?').run(20, second.data.id)

    const result = listComments(database, 'R6-1.B.1')

    expect(result).toHaveProperty('data')
    if ('error' in result) {
      throw new Error(result.error.message)
    }
    expect(result.data.map((comment) => comment.body)).toEqual(['First.', 'Second.', 'Third.'])
    expect(result.data.every((comment) => !('children' in comment))).toBe(true)
  })

  it('T-B.1.7: updateComment mutates fields and rejects invalid severity', () => {
    const database = openMemoryDb()
    insertTask(database, 'R6-1.B.1')
    const created = createComment(database, 'R6-1.B.1', { severity: 'MINOR', body: 'Before.', line: 'old.ts:1' })
    if ('error' in created) {
      throw new Error(created.error.message)
    }

    const updated = updateComment(database, 'R6-1.B.1', created.data.id, {
      severity: 'MAJOR',
      body: 'After.',
      line: 'new.ts:2',
    })
    const invalid = updateComment(database, 'R6-1.B.1', created.data.id, { severity: 'BLOCKER' })

    expect(updated).toHaveProperty('data')
    if ('error' in updated) {
      throw new Error(updated.error.message)
    }
    expect(updated.data).toMatchObject({ severity: 'MAJOR', body: 'After.', line: 'new.ts:2' })
    expect(updated.data.updated_at).toBeGreaterThanOrEqual(created.data.updated_at)
    expect(invalid).toEqual({
      error: {
        code: 'invalid_severity',
        message: expect.any(String),
      },
    })
  })

  it('T-B.1.8: deleteComment removes the comment', () => {
    const database = openMemoryDb()
    insertTask(database, 'R6-1.B.1')
    const created = createComment(database, 'R6-1.B.1', { severity: 'MINOR', body: 'Delete me.' })
    if ('error' in created) {
      throw new Error(created.error.message)
    }

    const result = deleteComment(database, 'R6-1.B.1', created.data.id)
    const list = listComments(database, 'R6-1.B.1')

    expect(result).toEqual({ data: { deleted: true } })
    if ('error' in list) {
      throw new Error(list.error.message)
    }
    expect(list.data).toEqual([])
  })

  it('T-B.1.9: deleting a task cascades all review_comments for it', () => {
    const database = openMemoryDb()
    insertTask(database, 'R6-1.B.1')
    const parent = createComment(database, 'R6-1.B.1', { severity: 'MAJOR', body: 'Parent.' })
    if ('error' in parent) {
      throw new Error(parent.error.message)
    }
    createComment(database, 'R6-1.B.1', {
      severity: 'MINOR',
      body: 'Reply.',
      parent_id: parent.data.id,
    })

    const pragma = database.prepare('PRAGMA foreign_keys').get() as { foreign_keys: number }
    database.prepare('DELETE FROM tasks WHERE id = ?').run('R6-1.B.1')
    const list = listComments(database, 'R6-1.B.1')

    expect(pragma.foreign_keys).toBe(1)
    expect(countComments(database, 'R6-1.B.1')).toBe(0)
    expect(list).toEqual({ data: [] })
  })
})
