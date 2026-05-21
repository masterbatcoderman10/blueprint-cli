import type { AddressInfo } from 'node:net'
import { afterEach, describe, expect, it } from 'vitest'

import BetterSqlite3 from 'better-sqlite3'

import { createServer } from '../../src/tracker/server'
import { applySchema, type TrackerDatabase } from '../../src/tracker/schema'

type TestDatabase = import('better-sqlite3').Database

interface RunningServer {
  db: TestDatabase
  origin: string
  close(): Promise<void>
}

let activeServer: RunningServer | undefined

function openMemoryDb(): TestDatabase {
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

async function listen(db: TrackerDatabase): Promise<RunningServer> {
  const server = createServer({ db })

  await new Promise<void>((resolve) => {
    server.listen({ host: '127.0.0.1', port: 0 }, resolve)
  })

  const address = server.address() as AddressInfo
  const running = {
    db,
    origin: `http://${address.address}:${address.port}`,
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error)
          else resolve()
        })
      })
      db.close()
    },
  }
  activeServer = running
  return running
}

async function requestJson(origin: string, path: string, init: RequestInit = {}) {
  const response = await fetch(`${origin}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...init.headers,
    },
  })

  return {
    status: response.status,
    body: await response.json(),
  }
}

function seedTask(db: TestDatabase, id: string, state: string) {
  db.prepare(
    `INSERT INTO tasks
      (id, title, description, state, phase, stream, author, implementation_notes, milestone, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, 'Task', 'Description', state, 'R9-1', 'B', null, null, 'R9', 1, 1)
}

function seedComment(db: TestDatabase, taskId: string, body: string, overrides: Record<string, unknown> = {}) {
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

afterEach(async () => {
  if (activeServer) {
    await activeServer.close()
    activeServer = undefined
  }
})

describe('Stream B — reviewer-verb endpoints (approve / reject)', () => {
  // ───────────────────────── Approve ─────────────────────────

  it('T-R9-1.B.1.1: approve on IN-REVIEW with no body transitions to DONE with empty comments array', async () => {
    const db = openMemoryDb()
    seedTask(db, 'R9-1.B.1', 'IN-REVIEW')
    const running = await listen(db)

    const res = await requestJson(running.origin, '/tasks/R9-1.B.1/approve', { method: 'POST' })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      ok: true,
      data: {
        task: expect.objectContaining({ id: 'R9-1.B.1', state: 'DONE' }),
        comments: [],
      },
    })

    const row = db.prepare('SELECT state FROM tasks WHERE id = ?').get('R9-1.B.1') as { state: string }
    expect(row.state).toBe('DONE')
  })

  it('T-R9-1.B.1.2: approve with comments: [] behaves identically to no body', async () => {
    const db = openMemoryDb()
    seedTask(db, 'R9-1.B.1', 'IN-REVIEW')
    const running = await listen(db)

    const res = await requestJson(running.origin, '/tasks/R9-1.B.1/approve', {
      method: 'POST',
      body: JSON.stringify({ comments: [] }),
    })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      ok: true,
      data: {
        task: expect.objectContaining({ id: 'R9-1.B.1', state: 'DONE' }),
        comments: [],
      },
    })
  })

  it('T-R9-1.B.1.3: approve with two MINOR comments transitions to DONE and persists both atomically', async () => {
    const db = openMemoryDb()
    seedTask(db, 'R9-1.B.1', 'IN-REVIEW')
    const running = await listen(db)

    const res = await requestJson(running.origin, '/tasks/R9-1.B.1/approve', {
      method: 'POST',
      body: JSON.stringify({
        comments: [
          { severity: 'MINOR', body: 'First note' },
          { severity: 'MINOR', body: 'Second note' },
        ],
      }),
    })

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      ok: true,
      data: {
        task: expect.objectContaining({ state: 'DONE' }),
        comments: [
          expect.objectContaining({ severity: 'MINOR', body: 'First note' }),
          expect.objectContaining({ severity: 'MINOR', body: 'Second note' }),
        ],
      },
    })

    const commentRows = db
      .prepare('SELECT COUNT(*) AS count FROM review_comments WHERE task_id = ?')
      .get('R9-1.B.1') as { count: number }
    expect(commentRows.count).toBe(2)
  })

  it('T-R9-1.B.1.4: idempotent no-op on DONE returns unchanged task and does NOT insert supplied comments', async () => {
    const db = openMemoryDb()
    seedTask(db, 'R9-1.B.1', 'DONE')
    const running = await listen(db)

    const res = await requestJson(running.origin, '/tasks/R9-1.B.1/approve', {
      method: 'POST',
      body: JSON.stringify({
        comments: [{ severity: 'MINOR', body: 'Should not be inserted' }],
      }),
    })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      ok: true,
      data: {
        task: expect.objectContaining({ id: 'R9-1.B.1', state: 'DONE' }),
        comments: [],
      },
    })

    const commentRows = db
      .prepare('SELECT COUNT(*) AS count FROM review_comments WHERE task_id = ?')
      .get('R9-1.B.1') as { count: number }
    expect(commentRows.count).toBe(0)
  })

  it('T-R9-1.B.1.5: approve on TO-DO / IN-PROGRESS / REWORK returns 409; no comment rows persisted', async () => {
    const db = openMemoryDb()
    const running = await listen(db)

    for (const state of ['TO-DO', 'IN-PROGRESS', 'REWORK'] as const) {
      const id = `R9-1.B.1-${state}`
      seedTask(db, id, state)

      const res = await requestJson(running.origin, `/tasks/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ comments: [{ severity: 'MINOR', body: 'x' }] }),
      })

      expect(res.status).toBe(409)
      expect(res.body).toMatchObject({ error: { code: 'illegal_transition' } })

      const commentRows = db
        .prepare('SELECT COUNT(*) AS count FROM review_comments WHERE task_id = ?')
        .get(id) as { count: number }
      expect(commentRows.count).toBe(0)
    }
  })

  it('T-R9-1.B.1.6: approve with a malformed comment returns 400; state and comments rolled back', async () => {
    const db = openMemoryDb()
    seedTask(db, 'R9-1.B.1', 'IN-REVIEW')
    const running = await listen(db)

    const res = await requestJson(running.origin, '/tasks/R9-1.B.1/approve', {
      method: 'POST',
      body: JSON.stringify({
        comments: [
          { severity: 'MAJOR', body: 'Valid' },
          { severity: 'BLOCKER', body: 'Invalid severity' },
        ],
      }),
    })

    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({ error: { code: 'invalid_severity' } })

    const taskRow = db.prepare('SELECT state FROM tasks WHERE id = ?').get('R9-1.B.1') as { state: string }
    expect(taskRow.state).toBe('IN-REVIEW')

    const commentRows = db
      .prepare('SELECT COUNT(*) AS count FROM review_comments WHERE task_id = ?')
      .get('R9-1.B.1') as { count: number }
    expect(commentRows.count).toBe(0)
  })

  it('T-R9-1.B.1.7: approve on unknown task ID returns 404', async () => {
    const db = openMemoryDb()
    const running = await listen(db)

    const res = await requestJson(running.origin, '/tasks/R9-1.B.1-missing/approve', { method: 'POST' })

    expect(res.status).toBe(404)
    expect(res.body).toMatchObject({ error: { code: 'task_not_found' } })
  })

  it('T-R9-1.B.1.8: approve comments respect optional parent_id and line fields', async () => {
    const db = openMemoryDb()
    seedTask(db, 'R9-1.B.1', 'IN-REVIEW')
    const parentId = seedComment(db, 'R9-1.B.1', 'Parent comment')
    const running = await listen(db)

    const res = await requestJson(running.origin, '/tasks/R9-1.B.1/approve', {
      method: 'POST',
      body: JSON.stringify({
        comments: [
          { severity: 'MINOR', body: 'Reply', parent_id: parentId, line: 'src/tracker/server.ts:42' },
        ],
      }),
    })

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      ok: true,
      data: {
        comments: [
          expect.objectContaining({
            parent_id: parentId,
            line: 'src/tracker/server.ts:42',
          }),
        ],
      },
    })
  })

  // ───────────────────────── Reject ─────────────────────────

  it('T-R9-1.B.2.1: reject on IN-REVIEW with one MAJOR comment transitions to REWORK and persists the comment', async () => {
    const db = openMemoryDb()
    seedTask(db, 'R9-1.B.2', 'IN-REVIEW')
    const running = await listen(db)

    const res = await requestJson(running.origin, '/tasks/R9-1.B.2/reject', {
      method: 'POST',
      body: JSON.stringify({
        comments: [{ severity: 'MAJOR', body: 'Needs rework' }],
      }),
    })

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      ok: true,
      data: {
        task: expect.objectContaining({ state: 'REWORK' }),
        comments: [expect.objectContaining({ severity: 'MAJOR', body: 'Needs rework' })],
      },
    })

    const row = db.prepare('SELECT state FROM tasks WHERE id = ?').get('R9-1.B.2') as { state: string }
    expect(row.state).toBe('REWORK')
  })

  it('T-R9-1.B.2.2: reject on IN-REVIEW with 1 MAJOR + 2 MINOR persists all three comments atomically', async () => {
    const db = openMemoryDb()
    seedTask(db, 'R9-1.B.2', 'IN-REVIEW')
    const running = await listen(db)

    const res = await requestJson(running.origin, '/tasks/R9-1.B.2/reject', {
      method: 'POST',
      body: JSON.stringify({
        comments: [
          { severity: 'MAJOR', body: 'Critical issue' },
          { severity: 'MINOR', body: 'Nit 1' },
          { severity: 'MINOR', body: 'Nit 2' },
        ],
      }),
    })

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      ok: true,
      data: {
        task: expect.objectContaining({ state: 'REWORK' }),
        comments: [
          expect.objectContaining({ severity: 'MAJOR', body: 'Critical issue' }),
          expect.objectContaining({ severity: 'MINOR', body: 'Nit 1' }),
          expect.objectContaining({ severity: 'MINOR', body: 'Nit 2' }),
        ],
      },
    })

    const commentRows = db
      .prepare('SELECT COUNT(*) AS count FROM review_comments WHERE task_id = ?')
      .get('R9-1.B.2') as { count: number }
    expect(commentRows.count).toBe(3)
  })

  it('T-R9-1.B.2.3: reject with comments: [] returns 400; no state change', async () => {
    const db = openMemoryDb()
    seedTask(db, 'R9-1.B.2', 'IN-REVIEW')
    const running = await listen(db)

    const res = await requestJson(running.origin, '/tasks/R9-1.B.2/reject', {
      method: 'POST',
      body: JSON.stringify({ comments: [] }),
    })

    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({ error: { code: 'invalid_comments' } })

    const row = db.prepare('SELECT state FROM tasks WHERE id = ?').get('R9-1.B.2') as { state: string }
    expect(row.state).toBe('IN-REVIEW')
  })

  it('T-R9-1.B.2.4: reject with comments field missing returns 400; no state change', async () => {
    const db = openMemoryDb()
    seedTask(db, 'R9-1.B.2', 'IN-REVIEW')
    const running = await listen(db)

    const res = await requestJson(running.origin, '/tasks/R9-1.B.2/reject', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({ error: { code: 'invalid_comments' } })

    const row = db.prepare('SELECT state FROM tasks WHERE id = ?').get('R9-1.B.2') as { state: string }
    expect(row.state).toBe('IN-REVIEW')
  })

  it('T-R9-1.B.2.5: idempotent no-op on REWORK returns unchanged task and does NOT insert comments', async () => {
    const db = openMemoryDb()
    seedTask(db, 'R9-1.B.2', 'REWORK')
    const running = await listen(db)

    const res = await requestJson(running.origin, '/tasks/R9-1.B.2/reject', {
      method: 'POST',
      body: JSON.stringify({
        comments: [{ severity: 'MAJOR', body: 'Should not be inserted' }],
      }),
    })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      ok: true,
      data: {
        task: expect.objectContaining({ id: 'R9-1.B.2', state: 'REWORK' }),
        comments: [],
      },
    })

    const commentRows = db
      .prepare('SELECT COUNT(*) AS count FROM review_comments WHERE task_id = ?')
      .get('R9-1.B.2') as { count: number }
    expect(commentRows.count).toBe(0)
  })

  it('T-R9-1.B.2.6: reject on TO-DO / IN-PROGRESS / DONE returns 409; no comment rows', async () => {
    const db = openMemoryDb()
    const running = await listen(db)

    for (const state of ['TO-DO', 'IN-PROGRESS', 'DONE'] as const) {
      const id = `R9-1.B.2-${state}`
      seedTask(db, id, state)

      const res = await requestJson(running.origin, `/tasks/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ comments: [{ severity: 'MAJOR', body: 'x' }] }),
      })

      expect(res.status).toBe(409)
      expect(res.body).toMatchObject({ error: { code: 'illegal_transition' } })

      const commentRows = db
        .prepare('SELECT COUNT(*) AS count FROM review_comments WHERE task_id = ?')
        .get(id) as { count: number }
      expect(commentRows.count).toBe(0)
    }
  })

  it('T-R9-1.B.2.7: reject with a malformed comment in a batch of three returns 400; full rollback', async () => {
    const db = openMemoryDb()
    seedTask(db, 'R9-1.B.2', 'IN-REVIEW')
    const running = await listen(db)

    const res = await requestJson(running.origin, '/tasks/R9-1.B.2/reject', {
      method: 'POST',
      body: JSON.stringify({
        comments: [
          { severity: 'MAJOR', body: 'Valid 1' },
          { severity: 'MAJOR', body: 'Valid 2' },
          { severity: 'BLOCKER', body: 'Invalid' },
        ],
      }),
    })

    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({ error: { code: 'invalid_severity' } })

    const taskRow = db.prepare('SELECT state FROM tasks WHERE id = ?').get('R9-1.B.2') as { state: string }
    expect(taskRow.state).toBe('IN-REVIEW')

    const commentRows = db
      .prepare('SELECT COUNT(*) AS count FROM review_comments WHERE task_id = ?')
      .get('R9-1.B.2') as { count: number }
    expect(commentRows.count).toBe(0)
  })

  it('T-R9-1.B.2.8: reject on unknown task ID returns 404', async () => {
    const db = openMemoryDb()
    const running = await listen(db)

    const res = await requestJson(running.origin, '/tasks/R9-1.B.2-missing/reject', { method: 'POST' })

    expect(res.status).toBe(404)
    expect(res.body).toMatchObject({ error: { code: 'task_not_found' } })
  })

  // ─────────────────── Parameterized across approve + reject ───────────────────

  describe('parameterized across approve and reject', () => {
    const verbs = [
      { verb: 'approve', prep: (db: TestDatabase) => seedTask(db, 'R9-1.B.approve', 'IN-REVIEW'), taskId: 'R9-1.B.approve' },
      { verb: 'reject', prep: (db: TestDatabase) => seedTask(db, 'R9-1.B.reject', 'IN-REVIEW'), taskId: 'R9-1.B.reject' },
    ] as const

    it('T-R9-1.B.1.9: comment author handling matches existing POST /tasks/:id/comments rules', async () => {
      const db = openMemoryDb()
      const running = await listen(db)

      for (const { verb, prep, taskId } of verbs) {
        prep(db)
        const body = verb === 'reject' ? { comments: [{ severity: 'MINOR', body: 'x' }] } : undefined

        const res = await requestJson(running.origin, `/tasks/${taskId}/${verb}`, {
          method: 'POST',
          body: body ? JSON.stringify(body) : undefined,
        })

        expect(res.status).toBe(200)
        if (verb === 'reject') {
          expect(res.body.data.comments[0].author).toBeNull()
        }
      }
    })

    it('T-R9-1.B.1.10: parent_id referencing a comment on a DIFFERENT task returns 400 and rolls back', async () => {
      const db = openMemoryDb()
      seedTask(db, 'R9-1.B.a', 'IN-REVIEW')
      seedTask(db, 'R9-1.B.b', 'IN-REVIEW')
      const otherComment = seedComment(db, 'R9-1.B.b', 'Other task comment')
      const running = await listen(db)

      for (const { verb, taskId } of [
        { verb: 'approve' as const, taskId: 'R9-1.B.a' },
        { verb: 'reject' as const, taskId: 'R9-1.B.a' },
      ]) {
        const res = await requestJson(running.origin, `/tasks/${taskId}/${verb}`, {
          method: 'POST',
          body: JSON.stringify({
            comments: [{ severity: 'MAJOR', body: 'Cross-task reply', parent_id: otherComment }],
          }),
        })

        expect(res.status).toBe(400)
        expect(res.body).toMatchObject({ error: { code: 'invalid_parent' } })

        const taskRow = db.prepare('SELECT state FROM tasks WHERE id = ?').get(taskId) as { state: string }
        expect(taskRow.state).toBe('IN-REVIEW')
      }
    })

    it('T-R9-1.B.1.11: malformed JSON body returns 400', async () => {
      const db = openMemoryDb()
      seedTask(db, 'R9-1.B.json', 'IN-REVIEW')
      const running = await listen(db)

      for (const verb of ['approve', 'reject'] as const) {
        const res = await fetch(`${running.origin}/tasks/R9-1.B.json/${verb}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: '{invalid',
        })

        expect(res.status).toBe(400)
        const body = await res.json()
        expect(body).toMatchObject({ error: { code: 'invalid_json' } })
      }
    })

    it('T-R9-1.B.1.12: non-array comments value returns 400', async () => {
      const db = openMemoryDb()
      seedTask(db, 'R9-1.B.array', 'IN-REVIEW')
      const running = await listen(db)

      for (const verb of ['approve', 'reject'] as const) {
        for (const value of [null, 'string', { severity: 'MAJOR', body: 'x' }]) {
          const res = await requestJson(running.origin, `/tasks/R9-1.B.array/${verb}`, {
            method: 'POST',
            body: JSON.stringify({ comments: value }),
          })

          expect(res.status).toBe(400)
          expect(res.body).toMatchObject({ error: { code: 'invalid_comments' } })
        }
      }
    })

    it('T-R9-1.B.1.13: response envelope is { ok: true, data: { task, comments } } on happy path', async () => {
      const db = openMemoryDb()
      const running = await listen(db)

      for (const { verb, prep, taskId } of verbs) {
        prep(db)
        const body = verb === 'reject' ? { comments: [{ severity: 'MINOR', body: 'x' }] } : undefined

        const res = await requestJson(running.origin, `/tasks/${taskId}/${verb}`, {
          method: 'POST',
          body: body ? JSON.stringify(body) : undefined,
        })

        expect(res.status).toBe(200)
        expect(res.body).toMatchObject({
          ok: true,
          data: {
            task: expect.objectContaining({ id: taskId }),
            comments: expect.any(Array),
          },
        })
      }
    })

    it('T-R9-1.B.1.14: non-POST methods return method-not-allowed consistent with other tracker routes', async () => {
      const db = openMemoryDb()
      seedTask(db, 'R9-1.B.method', 'IN-REVIEW')
      const running = await listen(db)

      for (const verb of ['approve', 'reject'] as const) {
        for (const method of ['GET', 'PUT', 'DELETE', 'PATCH'] as const) {
          const res = await fetch(`${running.origin}/tasks/R9-1.B.method/${verb}`, { method })
          // Existing tracker routes return 404 for method-not-found
          expect(res.status).toBe(404)
        }
      }
    })
  })
})
