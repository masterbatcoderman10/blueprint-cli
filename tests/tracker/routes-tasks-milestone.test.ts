import type { AddressInfo } from 'node:net'

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

describe('Stream A — milestone filter, POST validation, PATCH update', () => {
  async function seedTasks(running: RunningServer): Promise<void> {
    // R6 tasks
    await requestJson(running.origin, '/tasks', {
      method: 'POST',
      body: JSON.stringify({
        id: 'R6-3.A.1',
        title: 'R6 Phase 3 Stream A',
        description: 'Task in R6-3.A',
        state: 'TO-DO',
        phase: 'R6-3',
        stream: 'A',
        milestone: 'R6',
      }),
    })
    await requestJson(running.origin, '/tasks', {
      method: 'POST',
      body: JSON.stringify({
        id: 'R6-3.B.1',
        title: 'R6 Phase 3 Stream B',
        description: 'Task in R6-3.B',
        state: 'TO-DO',
        phase: 'R6-3',
        stream: 'B',
        milestone: 'R6',
      }),
    })
    await requestJson(running.origin, '/tasks', {
      method: 'POST',
      body: JSON.stringify({
        id: 'R6-4.A.1',
        title: 'R6 Phase 4 Stream A',
        description: 'Task in R6-4.A',
        state: 'TO-DO',
        phase: 'R6-4',
        stream: 'A',
        milestone: 'R6',
      }),
    })
    // M1 task
    await requestJson(running.origin, '/tasks', {
      method: 'POST',
      body: JSON.stringify({
        id: 'M1-1.A.1',
        title: 'M1 Phase 1 Stream A',
        description: 'Task in M1-1.A',
        state: 'TO-DO',
        phase: 'M1-1',
        stream: 'A',
        milestone: 'M1',
      }),
    })
  }

  it('T-R6-5.A.1.1: GET /tasks?milestone=R6 returns only R6 tasks', async () => {
    const running = await listen(openMemoryDb())
    await seedTasks(running)

    const response = await requestJson(running.origin, '/tasks?milestone=R6')

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ ok: true })
    const ids = (response.body as { data: Array<{ id: string }> }).data.map((t) => t.id)
    expect(ids).toEqual(expect.arrayContaining(['R6-3.A.1', 'R6-3.B.1', 'R6-4.A.1']))
    expect(ids).not.toContain('M1-1.A.1')
  })

  it('T-R6-5.A.1.2: GET /tasks?milestone=R6&phase=R6-3&stream=A AND-combines all three filters', async () => {
    const running = await listen(openMemoryDb())
    await seedTasks(running)

    const response = await requestJson(
      running.origin,
      '/tasks?milestone=R6&phase=R6-3&stream=A',
    )

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ ok: true })
    const ids = (response.body as { data: Array<{ id: string }> }).data.map((t) => t.id)
    expect(ids).toEqual(['R6-3.A.1'])
  })

  it('T-R6-5.A.1.3: GET /tasks?milestone= (empty value) returns 400', async () => {
    const running = await listen(openMemoryDb())

    const response = await requestJson(running.origin, '/tasks?milestone=')

    expect(response.status).toBe(400)
    expect(response.body).toMatchObject({
      ok: false,
      error: { code: 'invalid_milestone', message: expect.any(String) },
    })
  })

  it('T-R6-5.A.1.HTTP: success envelope has ok:true; error envelope has ok:false', async () => {
    const running = await listen(openMemoryDb())
    await seedTasks(running)

    // Success envelope
    const success = await requestJson(running.origin, '/tasks?milestone=R6')
    expect(success.body).toHaveProperty('ok', true)
    expect(success.body).toHaveProperty('data')
    expect(Array.isArray((success.body as { data: unknown }).data)).toBe(true)

    // Error envelope
    const error = await requestJson(running.origin, '/tasks?milestone=')
    expect(error.body).toHaveProperty('ok', false)
    expect(error.body).toHaveProperty('error')
    expect((error.body as { error: { code: string } }).error).toHaveProperty('code', 'invalid_milestone')
  })

  it('T-R6-5.A.2.1: POST /tasks without milestone auto-derives from a well-formed ID', async () => {
    const running = await listen(openMemoryDb())

    const response = await requestJson(running.origin, '/tasks', {
      method: 'POST',
      body: JSON.stringify({
        id: 'R6-5.A.1',
        title: 'Auto-derive milestone',
        description: 'No explicit milestone',
        state: 'TO-DO',
        phase: 'R6-5',
        stream: 'A',
      }),
    })

    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({
      ok: true,
      data: {
        id: 'R6-5.A.1',
        milestone: 'R6',
      },
    })
  })

  it('T-R6-5.A.2.2: explicit milestone in POST wins over ID-derived value', async () => {
    const running = await listen(openMemoryDb())

    const response = await requestJson(running.origin, '/tasks', {
      method: 'POST',
      body: JSON.stringify({
        id: 'R6-5.A.2',
        title: 'Explicit milestone',
        description: 'Override with M1',
        state: 'TO-DO',
        phase: 'R6-5',
        stream: 'A',
        milestone: 'M1',
      }),
    })

    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({
      ok: true,
      data: {
        id: 'R6-5.A.2',
        milestone: 'M1',
      },
    })
  })

  it('T-R6-5.A.2.3: POST /tasks rejected when milestone absent AND ID unparseable', async () => {
    const running = await listen(openMemoryDb())

    const response = await requestJson(running.origin, '/tasks', {
      method: 'POST',
      body: JSON.stringify({
        id: 'orphan-task',
        title: 'Bad ID',
        description: 'Cannot derive milestone',
        state: 'TO-DO',
        phase: 'unknown',
      }),
    })

    expect(response.status).toBe(400)
    expect(response.body).toMatchObject({
      ok: false,
      error: { code: 'invalid_milestone', message: expect.any(String) },
    })
  })

  it('T-R6-5.A.2.HTTP: POST success and error envelopes are correct', async () => {
    const running = await listen(openMemoryDb())

    // Success
    const success = await requestJson(running.origin, '/tasks', {
      method: 'POST',
      body: JSON.stringify({
        id: 'R6-5.A.http',
        title: 'Envelope test',
        description: 'Testing success envelope',
        state: 'TO-DO',
        phase: 'R6-5',
      }),
    })
    expect(success.body).toHaveProperty('ok', true)
    expect(success.body).toHaveProperty('data')

    // Error
    const error = await requestJson(running.origin, '/tasks', {
      method: 'POST',
      body: JSON.stringify({
        id: 'bad-id',
        title: 'Envelope error test',
        description: 'Testing error envelope',
        state: 'TO-DO',
        phase: 'unknown',
      }),
    })
    expect(error.body).toHaveProperty('ok', false)
    expect(error.body).toHaveProperty('error')
    expect((error.body as { error: { code: string } }).error).toHaveProperty('code', 'invalid_milestone')
  })

  it('T-R6-5.A.2.4: PATCH /tasks/:id accepts a milestone update; empty string rejected', async () => {
    const running = await listen(openMemoryDb())

    // Create a task
    await requestJson(running.origin, '/tasks', {
      method: 'POST',
      body: JSON.stringify({
        id: 'R6-5.A.4',
        title: 'Patch target',
        description: 'Will update milestone',
        state: 'TO-DO',
        phase: 'R6-5',
      }),
    })

    // PATCH with valid milestone
    const patched = await requestJson(running.origin, '/tasks/R6-5.A.4', {
      method: 'PATCH',
      body: JSON.stringify({ milestone: 'M2' }),
    })

    expect(patched.status).toBe(200)
    expect(patched.body).toMatchObject({
      ok: true,
      data: { id: 'R6-5.A.4', milestone: 'M2' },
    })

    // Verify via GET
    const fetched = await requestJson(running.origin, '/tasks/R6-5.A.4')
    expect(fetched.body).toMatchObject({
      ok: true,
      data: { milestone: 'M2' },
    })

    // PATCH with empty milestone should be rejected
    const badPatch = await requestJson(running.origin, '/tasks/R6-5.A.4', {
      method: 'PATCH',
      body: JSON.stringify({ milestone: '' }),
    })

    expect(badPatch.status).toBe(400)
    expect(badPatch.body).toMatchObject({
      ok: false,
      error: { code: 'invalid_milestone', message: expect.any(String) },
    })
  })
})
