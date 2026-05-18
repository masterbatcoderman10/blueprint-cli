import type { AddressInfo } from 'node:net'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import BetterSqlite3 from 'better-sqlite3'

import { openDb } from '../../src/tracker/db'
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

afterEach(async () => {
  if (activeServer) {
    await activeServer.close()
    activeServer = undefined
  }
})

describe('Stream C — tracker HTTP server', () => {
  it('T-C.1.1: boots on 127.0.0.1 with an assigned dynamic port', async () => {
    const running = await listen(openMemoryDb())

    expect(running.origin).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/)
  })

  it('T-C.1.2: POST /tasks round-trips through to Stream A handler', async () => {
    const running = await listen(openMemoryDb())

    const created = await requestJson(running.origin, '/tasks', {
      method: 'POST',
      body: JSON.stringify({
        id: 'R6-1.C.1',
        title: 'Server task',
        description: 'Wire HTTP server',
        state: 'TO-DO',
        phase: 'Phase 1',
        stream: 'C',
        author: 'Codex',
      }),
    })
    expect(created.status).toBe(201)
    expect(created.body).toMatchObject({
      data: {
        id: 'R6-1.C.1',
        title: 'Server task',
        state: 'TO-DO',
        stream: 'C',
      },
    })
  })

  it('T-C.1.3: GET /tasks returns the list', async () => {
    const running = await listen(openMemoryDb())

    await requestJson(running.origin, '/tasks', {
      method: 'POST',
      body: JSON.stringify({
        id: 'R6-1.C.1',
        title: 'Server task',
        description: 'Wire HTTP server',
        state: 'TO-DO',
        phase: 'Phase 1',
        stream: 'C',
      }),
    })

    const list = await requestJson(running.origin, '/tasks?phase=Phase%201&stream=C')
    expect(list.status).toBe(200)
    expect(list.body).toMatchObject({ data: [{ id: 'R6-1.C.1' }] })
  })

  it('T-C.1.4: GET/PATCH/DELETE /tasks/:id dispatch correctly', async () => {
    const running = await listen(openMemoryDb())

    await requestJson(running.origin, '/tasks', {
      method: 'POST',
      body: JSON.stringify({
        id: 'R6-1.C.1',
        title: 'Server task',
        description: 'Wire HTTP server',
        state: 'TO-DO',
        phase: 'Phase 1',
      }),
    })

    const get = await requestJson(running.origin, '/tasks/R6-1.C.1')
    expect(get.status).toBe(200)
    expect(get.body).toMatchObject({ data: { id: 'R6-1.C.1' } })

    const patched = await requestJson(running.origin, '/tasks/R6-1.C.1', {
      method: 'PATCH',
      body: JSON.stringify({ state: 'IN-PROGRESS', implementation_notes: 'Covered by HTTP tests.' }),
    })
    expect(patched.status).toBe(200)
    expect(patched.body).toMatchObject({
      data: {
        id: 'R6-1.C.1',
        state: 'IN-PROGRESS',
        implementation_notes: 'Covered by HTTP tests.',
      },
    })

    const missingTask = await requestJson(running.origin, '/tasks/R6-1.C.missing')
    expect(missingTask.status).toBe(404)
    expect(missingTask.body).toMatchObject({ error: { code: 'task_not_found', message: expect.any(String) } })

    const deletedTask = await requestJson(running.origin, '/tasks/R6-1.C.1', {
      method: 'DELETE',
    })
    expect(deletedTask.status).toBe(200)
    expect(deletedTask.body).toEqual({ ok: true, data: { id: 'R6-1.C.1' } })
  })

  it('T-C.1.5: comment routes dispatch through to Stream B handlers', async () => {
    const running = await listen(openMemoryDb())

    await requestJson(running.origin, '/tasks', {
      method: 'POST',
      body: JSON.stringify({
        id: 'R6-1.C.1',
        title: 'Server task',
        description: 'Wire HTTP server',
        state: 'TO-DO',
        phase: 'Phase 1',
      }),
    })

    const createdComment = await requestJson(running.origin, '/tasks/R6-1.C.1/comments', {
      method: 'POST',
      body: JSON.stringify({
        severity: 'MAJOR',
        body: 'Route coverage required.',
        author: 'Reviewer',
        line: 'src/tracker/server.ts:1',
      }),
    })
    expect(createdComment.status).toBe(201)
    expect(createdComment.body).toMatchObject({
      data: {
        task_id: 'R6-1.C.1',
        severity: 'MAJOR',
        body: 'Route coverage required.',
      },
    })

    const commentId = createdComment.body.data.id as string
    const comments = await requestJson(running.origin, '/tasks/R6-1.C.1/comments')
    expect(comments.status).toBe(200)
    expect(comments.body).toMatchObject({ data: [{ id: commentId }] })

    const invalidComment = await requestJson(running.origin, '/tasks/R6-1.C.1/comments', {
      method: 'POST',
      body: JSON.stringify({ severity: 'BLOCKER', body: 'No.' }),
    })
    expect(invalidComment.status).toBe(400)
    expect(invalidComment.body).toMatchObject({ error: { code: 'invalid_severity', message: expect.any(String) } })

    const patchedComment = await requestJson(running.origin, `/tasks/R6-1.C.1/comments/${commentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ severity: 'MINOR', body: 'Updated.' }),
    })
    expect(patchedComment.status).toBe(200)
    expect(patchedComment.body).toMatchObject({ data: { id: commentId, severity: 'MINOR', body: 'Updated.' } })

    const deletedComment = await requestJson(running.origin, `/tasks/R6-1.C.1/comments/${commentId}`, {
      method: 'DELETE',
    })
    expect(deletedComment.status).toBe(200)
    expect(deletedComment.body).toEqual({ ok: true, data: { deleted: true } })
  })

  it('T-C.1.8: error envelopes carry correct HTTP status codes', async () => {
    const running = await listen(openMemoryDb())

    const invalidState = await requestJson(running.origin, '/tasks', {
      method: 'POST',
      body: JSON.stringify({
        id: 'R6-1.C.invalid',
        title: 'Invalid',
        description: 'Invalid state',
        state: 'BLOCKED',
        phase: 'Phase 1',
      }),
    })
    expect(invalidState.status).toBe(400)
    expect(invalidState.body).toMatchObject({ error: { code: 'invalid_state', message: expect.any(String) } })

    const missingTask = await requestJson(running.origin, '/tasks/R6-1.C.missing')
    expect(missingTask.status).toBe(404)
    expect(missingTask.body).toMatchObject({ error: { code: 'task_not_found', message: expect.any(String) } })

    await requestJson(running.origin, '/tasks', {
      method: 'POST',
      body: JSON.stringify({
        id: 'R6-1.C.dup',
        title: 'First',
        description: 'First task',
        state: 'TO-DO',
        phase: 'Phase 1',
      }),
    })

    const duplicate = await requestJson(running.origin, '/tasks', {
      method: 'POST',
      body: JSON.stringify({
        id: 'R6-1.C.dup',
        title: 'Duplicate',
        description: 'Duplicate task',
        state: 'TO-DO',
        phase: 'Phase 1',
      }),
    })
    expect(duplicate.status).toBe(409)
    expect(duplicate.body).toMatchObject({ error: { code: 'duplicate_id', message: expect.any(String) } })
  })

  it('T-C.1.6: GET /project returns project_meta', async () => {
    const running = await listen(openMemoryDb())

    const response = await requestJson(running.origin, '/project')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      ok: true,
      data: {
        name: 'Blueprint CLI',
        tagline: 'Structured software development',
        phaseCount: null,
        streamCount: null,
      },
    })
  })

  it('T-C.1.7: unknown routes return not_found envelopes', async () => {
    const running = await listen(openMemoryDb())

    const response = await requestJson(running.origin, '/nope')

    expect(response.status).toBe(404)
    expect(response.body).toMatchObject({ error: { code: 'not_found', message: expect.any(String) } })
  })

  it('T-C.1.9: server close allows the tracker DB to be reopened immediately', async () => {
    const projectRoot = mkdtempSync(join(tmpdir(), 'blueprint-server-'))
    let handle = openDb(projectRoot)
    const running = await listen(handle.db)

    await running.close()
    activeServer = undefined
    handle = openDb(projectRoot)

    expect(handle.db.prepare('SELECT COUNT(*) AS count FROM tasks').get()).toEqual({ count: 0 })
    handle.close()
    rmSync(projectRoot, { recursive: true, force: true })
  })
})
