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
  ).run(id, 'Task', 'Description', state, 'R9-1', 'A', null, null, 'R9', 1, 1)
}

afterEach(async () => {
  if (activeServer) {
    await activeServer.close()
    activeServer = undefined
  }
})

describe('Stream A — Simple-Verb Endpoints', () => {
  describe('T-R9-1.A.1 — POST /tasks/:id/start', () => {
    it('T-R9-1.A.1.1: start on TO-DO transitions to IN-PROGRESS with correct envelope', async () => {
      const running = await listen(openMemoryDb())
      seedTask(running.db, 'R9-1.A.1-1', 'TO-DO')

      const response = await requestJson(running.origin, '/tasks/R9-1.A.1-1/start', { method: 'POST' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        ok: true,
        data: {
          task: expect.objectContaining({ id: 'R9-1.A.1-1', state: 'IN-PROGRESS' }),
          comments: [],
        },
      })
    })

    it('T-R9-1.A.1.2: start on IN-PROGRESS returns idempotent no-op', async () => {
      const running = await listen(openMemoryDb())
      seedTask(running.db, 'R9-1.A.1-2', 'IN-PROGRESS')

      const response = await requestJson(running.origin, '/tasks/R9-1.A.1-2/start', { method: 'POST' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        ok: true,
        data: {
          task: expect.objectContaining({ id: 'R9-1.A.1-2', state: 'IN-PROGRESS' }),
          comments: [],
        },
      })
    })

    it('T-R9-1.A.1.3: start on IN-REVIEW / REWORK / DONE returns 409', async () => {
      const running = await listen(openMemoryDb())
      for (const state of ['IN-REVIEW', 'REWORK', 'DONE']) {
        seedTask(running.db, `R9-1.A.1-3-${state}`, state)
        const response = await requestJson(running.origin, `/tasks/R9-1.A.1-3-${state}/start`, { method: 'POST' })
        expect(response.status).toBe(409)
        expect(response.body).toMatchObject({
          ok: false,
          error: { code: 'illegal_transition', message: expect.stringContaining('start') },
        })
      }
    })

    it('T-R9-1.A.1.4: start on unknown task returns 404', async () => {
      const running = await listen(openMemoryDb())
      const response = await requestJson(running.origin, '/tasks/R9-1.A.1-missing/start', { method: 'POST' })
      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({
        ok: false,
        error: { code: 'task_not_found', message: expect.any(String) },
      })
    })
  })

  describe('T-R9-1.A.2 — POST /tasks/:id/submit', () => {
    it('T-R9-1.A.2.1: submit on IN-PROGRESS transitions to IN-REVIEW', async () => {
      const running = await listen(openMemoryDb())
      seedTask(running.db, 'R9-1.A.2-1', 'IN-PROGRESS')

      const response = await requestJson(running.origin, '/tasks/R9-1.A.2-1/submit', { method: 'POST' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        ok: true,
        data: {
          task: expect.objectContaining({ id: 'R9-1.A.2-1', state: 'IN-REVIEW' }),
          comments: [],
        },
      })
    })

    it('T-R9-1.A.2.2: submit on IN-REVIEW returns idempotent no-op', async () => {
      const running = await listen(openMemoryDb())
      seedTask(running.db, 'R9-1.A.2-2', 'IN-REVIEW')

      const response = await requestJson(running.origin, '/tasks/R9-1.A.2-2/submit', { method: 'POST' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        ok: true,
        data: {
          task: expect.objectContaining({ id: 'R9-1.A.2-2', state: 'IN-REVIEW' }),
          comments: [],
        },
      })
    })

    it('T-R9-1.A.2.3: submit on TO-DO / REWORK / DONE returns 409', async () => {
      const running = await listen(openMemoryDb())
      for (const state of ['TO-DO', 'REWORK', 'DONE']) {
        seedTask(running.db, `R9-1.A.2-3-${state}`, state)
        const response = await requestJson(running.origin, `/tasks/R9-1.A.2-3-${state}/submit`, { method: 'POST' })
        expect(response.status).toBe(409)
        expect(response.body).toMatchObject({
          ok: false,
          error: { code: 'illegal_transition', message: expect.stringContaining('submit') },
        })
      }
    })

    it('T-R9-1.A.2.4: submit on unknown task returns 404', async () => {
      const running = await listen(openMemoryDb())
      const response = await requestJson(running.origin, '/tasks/R9-1.A.2-missing/submit', { method: 'POST' })
      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({
        ok: false,
        error: { code: 'task_not_found', message: expect.any(String) },
      })
    })
  })

  describe('T-R9-1.A.3 — POST /tasks/:id/resume', () => {
    it('T-R9-1.A.3.1: resume on REWORK transitions to IN-PROGRESS', async () => {
      const running = await listen(openMemoryDb())
      seedTask(running.db, 'R9-1.A.3-1', 'REWORK')

      const response = await requestJson(running.origin, '/tasks/R9-1.A.3-1/resume', { method: 'POST' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        ok: true,
        data: {
          task: expect.objectContaining({ id: 'R9-1.A.3-1', state: 'IN-PROGRESS' }),
          comments: [],
        },
      })
    })

    it('T-R9-1.A.3.2: resume on IN-PROGRESS returns idempotent no-op', async () => {
      const running = await listen(openMemoryDb())
      seedTask(running.db, 'R9-1.A.3-2', 'IN-PROGRESS')

      const response = await requestJson(running.origin, '/tasks/R9-1.A.3-2/resume', { method: 'POST' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        ok: true,
        data: {
          task: expect.objectContaining({ id: 'R9-1.A.3-2', state: 'IN-PROGRESS' }),
          comments: [],
        },
      })
    })

    it('T-R9-1.A.3.3: resume on TO-DO / IN-REVIEW / DONE returns 409', async () => {
      const running = await listen(openMemoryDb())
      for (const state of ['TO-DO', 'IN-REVIEW', 'DONE']) {
        seedTask(running.db, `R9-1.A.3-3-${state}`, state)
        const response = await requestJson(running.origin, `/tasks/R9-1.A.3-3-${state}/resume`, { method: 'POST' })
        expect(response.status).toBe(409)
        expect(response.body).toMatchObject({
          ok: false,
          error: { code: 'illegal_transition', message: expect.stringContaining('resume') },
        })
      }
    })

    it('T-R9-1.A.3.4: resume on unknown task returns 404', async () => {
      const running = await listen(openMemoryDb())
      const response = await requestJson(running.origin, '/tasks/R9-1.A.3-missing/resume', { method: 'POST' })
      expect(response.status).toBe(404)
      expect(response.body).toMatchObject({
        ok: false,
        error: { code: 'task_not_found', message: expect.any(String) },
      })
    })
  })

  describe('Parameterized across all three simple verbs', () => {
    it('T-R9-1.A.1.5: envelope shape is { ok: true, data: { task, comments: [] } } on happy path', async () => {
      const running = await listen(openMemoryDb())
      seedTask(running.db, 'R9-1.A.1-5-start', 'TO-DO')
      seedTask(running.db, 'R9-1.A.1-5-submit', 'IN-PROGRESS')
      seedTask(running.db, 'R9-1.A.1-5-resume', 'REWORK')

      const start = await requestJson(running.origin, '/tasks/R9-1.A.1-5-start/start', { method: 'POST' })
      expect(start.body).toEqual({ ok: true, data: { task: expect.any(Object), comments: [] } })

      const submit = await requestJson(running.origin, '/tasks/R9-1.A.1-5-submit/submit', { method: 'POST' })
      expect(submit.body).toEqual({ ok: true, data: { task: expect.any(Object), comments: [] } })

      const resume = await requestJson(running.origin, '/tasks/R9-1.A.1-5-resume/resume', { method: 'POST' })
      expect(resume.body).toEqual({ ok: true, data: { task: expect.any(Object), comments: [] } })
    })

    it('T-R9-1.A.1.6: non-POST methods return method-not-allowed', async () => {
      const running = await listen(openMemoryDb())
      seedTask(running.db, 'R9-1.A.1-6', 'TO-DO')

      for (const verb of ['start', 'submit', 'resume']) {
        for (const method of ['GET', 'PUT', 'DELETE', 'PATCH']) {
          const response = await requestJson(running.origin, `/tasks/R9-1.A.1-6/${verb}`, { method })
          expect(response.status).toBe(404)
          expect(response.body).toMatchObject({
            ok: false,
            error: { code: 'not_found', message: expect.any(String) },
          })
        }
      }
    })

    it('T-R9-1.A.1.7: request body is ignored without error', async () => {
      const running = await listen(openMemoryDb())
      seedTask(running.db, 'R9-1.A.1-7-start', 'TO-DO')
      seedTask(running.db, 'R9-1.A.1-7-submit', 'IN-PROGRESS')
      seedTask(running.db, 'R9-1.A.1-7-resume', 'REWORK')

      const start = await requestJson(running.origin, '/tasks/R9-1.A.1-7-start/start', {
        method: 'POST',
        body: JSON.stringify({ ignored: true }),
      })
      expect(start.status).toBe(200)
      expect(start.body).toEqual({
        ok: true,
        data: {
          task: expect.objectContaining({ state: 'IN-PROGRESS' }),
          comments: [],
        },
      })

      const submit = await requestJson(running.origin, '/tasks/R9-1.A.1-7-submit/submit', {
        method: 'POST',
        body: JSON.stringify({ ignored: true }),
      })
      expect(submit.status).toBe(200)
      expect(submit.body).toEqual({
        ok: true,
        data: {
          task: expect.objectContaining({ state: 'IN-REVIEW' }),
          comments: [],
        },
      })

      const resume = await requestJson(running.origin, '/tasks/R9-1.A.1-7-resume/resume', {
        method: 'POST',
        body: JSON.stringify({ ignored: true }),
      })
      expect(resume.status).toBe(200)
      expect(resume.body).toEqual({
        ok: true,
        data: {
          task: expect.objectContaining({ state: 'IN-PROGRESS' }),
          comments: [],
        },
      })
    })

    it('T-R9-1.A.1.7-malformed: malformed JSON body is silently ignored without error', async () => {
      const running = await listen(openMemoryDb())
      seedTask(running.db, 'R9-1.A.1-7m-start', 'TO-DO')
      seedTask(running.db, 'R9-1.A.1-7m-submit', 'IN-PROGRESS')
      seedTask(running.db, 'R9-1.A.1-7m-resume', 'REWORK')

      const start = await fetch(`${running.origin}/tasks/R9-1.A.1-7m-start/start`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{bad json',
      })
      expect(start.status).toBe(200)
      expect(await start.json()).toEqual({
        ok: true,
        data: {
          task: expect.objectContaining({ id: 'R9-1.A.1-7m-start', state: 'IN-PROGRESS' }),
          comments: [],
        },
      })

      const submit = await fetch(`${running.origin}/tasks/R9-1.A.1-7m-submit/submit`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{bad json',
      })
      expect(submit.status).toBe(200)
      expect(await submit.json()).toEqual({
        ok: true,
        data: {
          task: expect.objectContaining({ id: 'R9-1.A.1-7m-submit', state: 'IN-REVIEW' }),
          comments: [],
        },
      })

      const resume = await fetch(`${running.origin}/tasks/R9-1.A.1-7m-resume/resume`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{bad json',
      })
      expect(resume.status).toBe(200)
      expect(await resume.json()).toEqual({
        ok: true,
        data: {
          task: expect.objectContaining({ id: 'R9-1.A.1-7m-resume', state: 'IN-PROGRESS' }),
          comments: [],
        },
      })
    })
  })
})
