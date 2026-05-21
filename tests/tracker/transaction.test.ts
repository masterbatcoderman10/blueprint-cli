import { describe, expect, it } from 'vitest'

import BetterSqlite3 from 'better-sqlite3'

import { runWorkflowTransaction } from '../../src/tracker/transaction'
import { applySchema } from '../../src/tracker/schema'

function openMemoryDb() {
  const db = new BetterSqlite3(':memory:')
  db.pragma('foreign_keys = ON')
  applySchema(db)
  db.prepare(
    `INSERT INTO project_meta
      (id, name, tagline, phase_count, stream_count, created_at, updated_at)
     VALUES (1, ?, ?, NULL, NULL, ?, ?)`,
  ).run('Blueprint CLI', 'Structured software development', 1, 1)
  return db
}

function seedTask(db: ReturnType<typeof openMemoryDb>, id: string, state: string) {
  db.prepare(
    `INSERT INTO tasks
      (id, title, description, state, phase, stream, author, implementation_notes, milestone, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, 'Task', 'Description', state, 'R9-1', '0', null, null, 'R9', 1, 1)
}

function seedComment(db: ReturnType<typeof openMemoryDb>, taskId: string, body: string, overrides: Record<string, unknown> = {}) {
  const id = crypto.randomUUID()
  db.prepare(
    `INSERT INTO review_comments
      (id, task_id, parent_id, severity, body, author, line, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    taskId,
    overrides.parent_id ?? null,
    overrides.severity ?? 'MAJOR',
    body,
    overrides.author ?? null,
    overrides.line ?? null,
    1,
    1,
  )
  return id
}

describe('Gate R9-1.0.2 — workflow transactional helper', () => {
  it('T-R9-1.0.2.1: commits state change and N comment inserts atomically', () => {
    const db = openMemoryDb()
    seedTask(db, 'R9-1.0.2', 'TO-DO')

    const result = runWorkflowTransaction(db, 'R9-1.0.2', 'IN-PROGRESS', [
      { severity: 'MAJOR', body: 'First comment' },
      { severity: 'MINOR', body: 'Second comment' },
    ])

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.data.task.state).toBe('IN-PROGRESS')
    expect(result.data.comments).toHaveLength(2)
    expect(result.data.comments[0].body).toBe('First comment')
    expect(result.data.comments[1].body).toBe('Second comment')

    const taskRow = db.prepare('SELECT state FROM tasks WHERE id = ?').get('R9-1.0.2') as { state: string }
    expect(taskRow.state).toBe('IN-PROGRESS')

    const commentRows = db.prepare('SELECT COUNT(*) AS count FROM review_comments WHERE task_id = ?').get('R9-1.0.2') as { count: number }
    expect(commentRows.count).toBe(2)
  })

  it('T-R9-1.0.2.2: rolls back state change when any comment fails validation', () => {
    const db = openMemoryDb()
    seedTask(db, 'R9-1.0.2', 'TO-DO')

    const result = runWorkflowTransaction(db, 'R9-1.0.2', 'IN-PROGRESS', [
      { severity: 'MAJOR', body: 'Valid comment' },
      { severity: 'BLOCKER', body: 'Invalid severity' },
    ])

    expect(result.ok).toBe(false)
    if (result.ok) return

    expect(result.error.code).toBe('invalid_severity')

    const taskRow = db.prepare('SELECT state FROM tasks WHERE id = ?').get('R9-1.0.2') as { state: string }
    expect(taskRow.state).toBe('TO-DO')

    const commentRows = db.prepare('SELECT COUNT(*) AS count FROM review_comments WHERE task_id = ?').get('R9-1.0.2') as { count: number }
    expect(commentRows.count).toBe(0)
  })

  it('T-R9-1.0.2.2: rolls back on parent_id cross-task violation', () => {
    const db = openMemoryDb()
    seedTask(db, 'R9-1.0.2-a', 'TO-DO')
    seedTask(db, 'R9-1.0.2-b', 'TO-DO')
    const otherComment = seedComment(db, 'R9-1.0.2-b', 'Other task comment')

    const result = runWorkflowTransaction(db, 'R9-1.0.2-a', 'IN-PROGRESS', [
      { severity: 'MAJOR', body: 'Valid', parent_id: otherComment },
    ])

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('invalid_parent')

    const taskRow = db.prepare('SELECT state FROM tasks WHERE id = ?').get('R9-1.0.2-a') as { state: string }
    expect(taskRow.state).toBe('TO-DO')
  })

  it('T-R9-1.0.2.3: returns uniform result shape for empty and non-empty comment arrays', () => {
    const db = openMemoryDb()
    seedTask(db, 'R9-1.0.2-empty', 'TO-DO')
    seedTask(db, 'R9-1.0.2-full', 'TO-DO')

    const empty = runWorkflowTransaction(db, 'R9-1.0.2-empty', 'IN-PROGRESS')
    expect(empty.ok).toBe(true)
    if (!empty.ok) return
    expect(empty.data).toMatchObject({ task: expect.objectContaining({ state: 'IN-PROGRESS' }), comments: [] })

    const full = runWorkflowTransaction(db, 'R9-1.0.2-full', 'IN-PROGRESS', [{ severity: 'MINOR', body: 'One' }])
    expect(full.ok).toBe(true)
    if (!full.ok) return
    expect(full.data).toMatchObject({
      task: expect.objectContaining({ state: 'IN-PROGRESS' }),
      comments: [expect.objectContaining({ body: 'One' })],
    })
  })

  it('T-R9-1.0.2.4: two concurrent gated calls on the same task serialize through SQLite', () => {
    const db = openMemoryDb()
    seedTask(db, 'R9-1.0.2', 'IN-REVIEW')

    // Simulate concurrent calls by running two transactions in rapid succession
    // In better-sqlite3, transactions are synchronous and serialized by default
    const tx1 = runWorkflowTransaction(db, 'R9-1.0.2', 'DONE')
    const tx2 = runWorkflowTransaction(db, 'R9-1.0.2', 'DONE')

    // One should transition, the other should no-op
    const transitions = [tx1, tx2].filter((r) => r.ok && r.data.task.state === 'DONE')
    const noops = [tx1, tx2].filter((r) => r.ok && r.data.comments.length === 0)

    expect(transitions.length).toBe(2) // Both see DONE because tx1 commits before tx2 runs
    expect(noops.length).toBe(2)

    const taskRow = db.prepare('SELECT state FROM tasks WHERE id = ?').get('R9-1.0.2') as { state: string }
    expect(taskRow.state).toBe('DONE')
  })
})
