import type { AddressInfo } from 'node:net'
import { mkdtempSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import BetterSqlite3 from 'better-sqlite3'

import { serializeSnapshot } from '../../src/tracker/export'
import { createServer } from '../../src/tracker/server'
import { applySchema, type TrackerDatabase } from '../../src/tracker/schema'

type TestDatabase = import('better-sqlite3').Database

interface RunningServer {
  db: TestDatabase
  origin: string
  projectRoot: string
  close(): Promise<void>
}

let activeServer: RunningServer | undefined
const tempRoots: string[] = []

function createProjectRoot(): string {
  const projectRoot = mkdtempSync(join(tmpdir(), 'blueprint-tracker-export-hook-'))
  mkdirSync(join(projectRoot, 'docs', '.blueprint'), { recursive: true })
  tempRoots.push(projectRoot)
  return projectRoot
}

function snapshotPath(projectRoot: string): string {
  return join(projectRoot, 'docs', '.blueprint', 'tasks.export.json')
}

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

async function listen(): Promise<RunningServer> {
  const db = openMemoryDb()
  const projectRoot = createProjectRoot()
  const server = createServer({ db, projectRoot })

  await new Promise<void>((resolve) => {
    server.listen({ host: '127.0.0.1', port: 0 }, resolve)
  })

  const address = server.address() as AddressInfo
  const running = {
    db,
    projectRoot,
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

function readSnapshotText(projectRoot: string): string {
  return readFileSync(snapshotPath(projectRoot), 'utf-8')
}

function readSnapshotJson(projectRoot: string) {
  return JSON.parse(readSnapshotText(projectRoot)) as ReturnType<typeof serializeSnapshot>
}

function expectSnapshotMatchesDb(projectRoot: string, db: TrackerDatabase): void {
  expect(readSnapshotText(projectRoot)).toBe(`${JSON.stringify(serializeSnapshot(db), null, 2)}\n`)
}

afterEach(async () => {
  vi.restoreAllMocks()

  if (activeServer) {
    await activeServer.close()
    activeServer = undefined
  }

  while (tempRoots.length > 0) {
    const root = tempRoots.pop()
    if (root) {
      rmSync(root, { recursive: true, force: true })
    }
  }
})

describe('Revision 6 Phase 4 Stream A — tracker export hook', () => {
  it('T-R6-4.A.1.1: writes tasks.export.json after POST /tasks', async () => {
    const running = await listen()

    const created = await requestJson(running.origin, '/tasks', {
      method: 'POST',
      body: JSON.stringify({
        id: 'R6-4.A.1',
        title: 'Create export hook',
        description: 'Write snapshot on mutation',
        state: 'TO-DO',
        phase: 'Phase 4',
        stream: 'A',
      }),
    })

    expect(created.status).toBe(201)
    expect(readSnapshotJson(running.projectRoot).tasks).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'R6-4.A.1', title: 'Create export hook' })]),
    )
    expectSnapshotMatchesDb(running.projectRoot, running.db)
  })

  it('T-R6-4.A.2.1: flushes the HTTP response only after the snapshot reflects the mutation', async () => {
    const running = await listen()

    const created = await requestJson(running.origin, '/tasks', {
      method: 'POST',
      body: JSON.stringify({
        id: 'R6-4.A.2',
        title: 'Ordering contract',
        description: 'Commit then snapshot then respond',
        state: 'IN-PROGRESS',
        phase: 'Phase 4',
        stream: 'A',
      }),
    })

    expect(created.status).toBe(201)
    expect(readSnapshotJson(running.projectRoot).tasks).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: created.body.data.id, state: 'IN-PROGRESS' })]),
    )
    expectSnapshotMatchesDb(running.projectRoot, running.db)
  })

  it('T-R6-4.A.1.2: rewrites tasks.export.json after PATCH /tasks/:id', async () => {
    const running = await listen()
    await requestJson(running.origin, '/tasks', {
      method: 'POST',
      body: JSON.stringify({
        id: 'R6-4.A.patch',
        title: 'Before',
        description: 'Before patch',
        state: 'TO-DO',
        phase: 'Phase 4',
        stream: 'A',
      }),
    })

    const patched = await requestJson(running.origin, '/tasks/R6-4.A.patch', {
      method: 'PATCH',
      body: JSON.stringify({
        state: 'IN-REVIEW',
        implementation_notes: 'Snapshot refreshed before response flush.',
      }),
    })

    expect(patched.status).toBe(200)
    expect(readSnapshotJson(running.projectRoot).tasks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'R6-4.A.patch',
          state: 'IN-REVIEW',
          implementation_notes: 'Snapshot refreshed before response flush.',
        }),
      ]),
    )
    expectSnapshotMatchesDb(running.projectRoot, running.db)
  })

  it('T-R6-4.A.1.3: rewrites tasks.export.json after DELETE /tasks/:id and reflects cascaded comments', async () => {
    const running = await listen()
    await requestJson(running.origin, '/tasks', {
      method: 'POST',
      body: JSON.stringify({
        id: 'R6-4.A.delete-task',
        title: 'Delete task',
        description: 'Task with comments',
        state: 'TO-DO',
        phase: 'Phase 4',
      }),
    })
    const parent = await requestJson(running.origin, '/tasks/R6-4.A.delete-task/comments', {
      method: 'POST',
      body: JSON.stringify({
        severity: 'MAJOR',
        body: 'Parent comment',
      }),
    })
    await requestJson(running.origin, '/tasks/R6-4.A.delete-task/comments', {
      method: 'POST',
      body: JSON.stringify({
        severity: 'MINOR',
        body: 'Reply comment',
        parent_id: parent.body.data.id,
      }),
    })

    const deleted = await requestJson(running.origin, '/tasks/R6-4.A.delete-task', {
      method: 'DELETE',
    })

    expect(deleted.status).toBe(200)
    const snapshot = readSnapshotJson(running.projectRoot)
    expect(snapshot.tasks.find((task) => task.id === 'R6-4.A.delete-task')).toBeUndefined()
    expect(snapshot.comments.filter((comment) => comment.task_id === 'R6-4.A.delete-task')).toEqual([])
    expectSnapshotMatchesDb(running.projectRoot, running.db)
  })

  it('T-R6-4.A.1.4: rewrites tasks.export.json after POST /tasks/:id/comments', async () => {
    const running = await listen()
    await requestJson(running.origin, '/tasks', {
      method: 'POST',
      body: JSON.stringify({
        id: 'R6-4.A.create-comment',
        title: 'Create comment',
        description: 'Task for comment create',
        state: 'TO-DO',
        phase: 'Phase 4',
      }),
    })

    const created = await requestJson(running.origin, '/tasks/R6-4.A.create-comment/comments', {
      method: 'POST',
      body: JSON.stringify({
        severity: 'MAJOR',
        body: 'Snapshot should include me.',
        author: 'Reviewer',
      }),
    })

    expect(created.status).toBe(201)
    expect(readSnapshotJson(running.projectRoot).comments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: created.body.data.id,
          task_id: 'R6-4.A.create-comment',
          body: 'Snapshot should include me.',
        }),
      ]),
    )
    expectSnapshotMatchesDb(running.projectRoot, running.db)
  })

  it('T-R6-4.A.1.5: rewrites tasks.export.json after PATCH /tasks/:id/comments/:cid', async () => {
    const running = await listen()
    await requestJson(running.origin, '/tasks', {
      method: 'POST',
      body: JSON.stringify({
        id: 'R6-4.A.update-comment',
        title: 'Update comment',
        description: 'Task for comment update',
        state: 'TO-DO',
        phase: 'Phase 4',
      }),
    })
    const created = await requestJson(running.origin, '/tasks/R6-4.A.update-comment/comments', {
      method: 'POST',
      body: JSON.stringify({
        severity: 'MINOR',
        body: 'Before update',
      }),
    })

    const patched = await requestJson(
      running.origin,
      `/tasks/R6-4.A.update-comment/comments/${created.body.data.id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          severity: 'MAJOR',
          body: 'After update',
          line: 'src/tracker/server.ts:1',
        }),
      },
    )

    expect(patched.status).toBe(200)
    expect(readSnapshotJson(running.projectRoot).comments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: created.body.data.id,
          severity: 'MAJOR',
          body: 'After update',
          line: 'src/tracker/server.ts:1',
        }),
      ]),
    )
    expectSnapshotMatchesDb(running.projectRoot, running.db)
  })

  it('T-R6-4.A.1.6: rewrites tasks.export.json after DELETE /tasks/:id/comments/:cid and reflects reply cascade', async () => {
    const running = await listen()
    await requestJson(running.origin, '/tasks', {
      method: 'POST',
      body: JSON.stringify({
        id: 'R6-4.A.delete-comment',
        title: 'Delete comment',
        description: 'Task for comment delete',
        state: 'TO-DO',
        phase: 'Phase 4',
      }),
    })
    const parent = await requestJson(running.origin, '/tasks/R6-4.A.delete-comment/comments', {
      method: 'POST',
      body: JSON.stringify({
        severity: 'MAJOR',
        body: 'Parent',
      }),
    })
    const reply = await requestJson(running.origin, '/tasks/R6-4.A.delete-comment/comments', {
      method: 'POST',
      body: JSON.stringify({
        severity: 'MINOR',
        body: 'Reply',
        parent_id: parent.body.data.id,
      }),
    })

    const deleted = await requestJson(
      running.origin,
      `/tasks/R6-4.A.delete-comment/comments/${parent.body.data.id}`,
      { method: 'DELETE' },
    )

    expect(deleted.status).toBe(200)
    const snapshot = readSnapshotJson(running.projectRoot)
    expect(snapshot.comments.find((comment) => comment.id === parent.body.data.id)).toBeUndefined()
    expect(snapshot.comments.find((comment) => comment.id === reply.body.data.id)).toBeUndefined()
    expectSnapshotMatchesDb(running.projectRoot, running.db)
  })

  it('T-R6-4.A.1.7: logs a warning and preserves the HTTP response when snapshot writing fails', async () => {
    const running = await listen()
    rmSync(join(running.projectRoot, 'docs', '.blueprint'), { recursive: true, force: true })
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const created = await requestJson(running.origin, '/tasks', {
      method: 'POST',
      body: JSON.stringify({
        id: 'R6-4.A.warn',
        title: 'Warn only',
        description: 'Snapshot write failure should not fail request',
        state: 'TO-DO',
        phase: 'Phase 4',
      }),
    })

    expect(created.status).toBe(201)
    expect(created.body).toMatchObject({
      data: {
        id: 'R6-4.A.warn',
        title: 'Warn only',
      },
    })
    expect(warnSpy).toHaveBeenCalledWith('[tracker] snapshot write failed', expect.any(Error))
  })
})
