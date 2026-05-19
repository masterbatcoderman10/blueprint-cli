import { afterEach, describe, expect, it } from 'vitest'

import BetterSqlite3 from 'better-sqlite3'

import { applySchema } from '../../../src/tracker/schema'

type TestDatabase = import('better-sqlite3').Database

let db: TestDatabase | undefined

function openMemoryDb(): TestDatabase {
  db = new BetterSqlite3(':memory:')
  db.pragma('foreign_keys = ON')
  return db
}

function tableNames(database: DatabaseSync): string[] {
  return database
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    .all()
    .map((row) => (row as { name: string }).name)
}

function columnMap(database: DatabaseSync, tableName: string): Map<string, { type: string; notnull: number }> {
  return new Map(
    database
      .prepare(`PRAGMA table_info(${tableName})`)
      .all()
      .map((row) => {
        const column = row as { name: string; type: string; notnull: number }
        return [column.name, { type: column.type, notnull: column.notnull }]
      }),
  )
}

function indexColumns(database: DatabaseSync, indexName: string): string[] {
  return database
    .prepare(`PRAGMA index_info(${indexName})`)
    .all()
    .map((row) => (row as { name: string }).name)
}

afterEach(() => {
  db?.close()
  db = undefined
})

describe('Gate R6-1.0 — tracker schema', () => {
  it('T-1.0.2.1: applySchema creates tasks, review_comments, and project_meta tables', () => {
    const database = openMemoryDb()

    applySchema(database)

    expect(tableNames(database)).toEqual(['project_meta', 'review_comments', 'tasks'])
  })

  it('T-1.0.2.2: tasks table has the documented columns and required fields', () => {
    const database = openMemoryDb()

    applySchema(database)

    const columns = columnMap(database, 'tasks')
    expect(columns).toMatchObject(
      new Map([
        ['id', { type: 'TEXT', notnull: 1 }],
        ['title', { type: 'TEXT', notnull: 1 }],
        ['description', { type: 'TEXT', notnull: 1 }],
        ['state', { type: 'TEXT', notnull: 1 }],
        ['phase', { type: 'TEXT', notnull: 1 }],
        ['stream', { type: 'TEXT', notnull: 0 }],
        ['author', { type: 'TEXT', notnull: 0 }],
        ['implementation_notes', { type: 'TEXT', notnull: 0 }],
        ['milestone', { type: 'TEXT', notnull: 1 }],
        ['created_at', { type: 'INTEGER', notnull: 1 }],
        ['updated_at', { type: 'INTEGER', notnull: 1 }],
      ]),
    )
  })

  it('T-1.0.2.3: review_comments columns and foreign keys match the contract', () => {
    const database = openMemoryDb()

    applySchema(database)

    const columns = columnMap(database, 'review_comments')
    expect(columns).toMatchObject(
      new Map([
        ['id', { type: 'TEXT', notnull: 1 }],
        ['task_id', { type: 'TEXT', notnull: 1 }],
        ['parent_id', { type: 'TEXT', notnull: 0 }],
        ['severity', { type: 'TEXT', notnull: 1 }],
        ['body', { type: 'TEXT', notnull: 1 }],
        ['author', { type: 'TEXT', notnull: 0 }],
        ['line', { type: 'TEXT', notnull: 0 }],
        ['created_at', { type: 'INTEGER', notnull: 1 }],
        ['updated_at', { type: 'INTEGER', notnull: 1 }],
      ]),
    )

    const foreignKeys = database.prepare('PRAGMA foreign_key_list(review_comments)').all()
    expect(foreignKeys).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ from: 'task_id', table: 'tasks', to: 'id', on_delete: 'CASCADE' }),
        expect.objectContaining({ from: 'parent_id', table: 'review_comments', to: 'id', on_delete: 'CASCADE' }),
      ]),
    )
  })

  it('T-1.0.2.4: state CHECK rejects invalid task states', () => {
    const database = openMemoryDb()
    applySchema(database)

    expect(() => {
      database
        .prepare(
          "INSERT INTO tasks (id, title, description, state, phase, milestone, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .run('R6-1.X.1', 'Invalid state', '', 'BOGUS', 'Phase 1', 'R6', 1, 1)
    }).toThrow(/SQLITE_CONSTRAINT_CHECK|CHECK constraint failed/)
  })

  it('T-1.0.2.5: documented indexes exist with the expected columns', () => {
    const database = openMemoryDb()

    applySchema(database)

    expect(indexColumns(database, 'idx_tasks_state')).toEqual(['state'])
    expect(indexColumns(database, 'idx_tasks_phase_stream')).toEqual(['phase', 'stream'])
    expect(indexColumns(database, 'idx_review_comments_task_id')).toEqual(['task_id'])
    expect(indexColumns(database, 'idx_review_comments_parent_id')).toEqual(['parent_id'])
  })

  it('T-1.0.2.6: applySchema is idempotent and preserves existing data', () => {
    const database = openMemoryDb()
    applySchema(database)
    database
      .prepare(
        "INSERT INTO tasks (id, title, description, state, phase, milestone, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run('R6-1.0.2', 'Schema task', 'DDL', 'IN-PROGRESS', 'Phase 1', 'R6', 1, 1)

    expect(() => applySchema(database)).not.toThrow()

    const row = database.prepare('SELECT COUNT(*) AS count FROM tasks').get() as { count: number }
    expect(row.count).toBe(1)
  })
})
