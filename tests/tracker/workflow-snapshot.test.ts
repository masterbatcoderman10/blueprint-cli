import type { AddressInfo } from 'node:net'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, chmodSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import BetterSqlite3 from 'better-sqlite3'

import { serializeSnapshot, writeSnapshotAtomic } from '../../src/tracker/export'
import { createServer } from '../../src/tracker/server'
import { applySchema } from '../../src/tracker/schema'

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
  const projectRoot = mkdtempSync(join(tmpdir(), 'blueprint-tracker-workflow-snapshot-'))
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

function readSnapshotJson(projectRoot: string) {
  return JSON.parse(readFileSync(snapshotPath(projectRoot), 'utf-8')) as ReturnType<typeof serializeSnapshot>
}

function getSnapshotMtime(projectRoot: string): number {
  try {
    return readFileSync(snapshotPath(projectRoot)).mtimeMs
  } catch {
    return 0
  }
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

describe('Gate R9-1.0.4 — workflow endpoint snapshot behavior', () => {
  it('T-R9-1.0.4.1: successful gated endpoint call triggers exactly one JSON snapshot write per request', async () => {
    const writeSpy = vi.spyOn(await import('../../src/tracker/export'), 'writeSnapshotAtomic')
    const running = await listen()

    await requestJson(running.origin, '/tasks', {
      method: 'POST',
      body: JSON.stringify({
        id: 'R9-1.0.4',
        title: 'Snapshot task',
        description: 'Test snapshot behavior',
        state: 'TO-DO',
        phase: 'R9-1',
        stream: '0',
      }),
    })

    const beforeCount = writeSpy.mock.calls.length

    const started = await requestJson(running.origin, '/tasks/R9-1.0.4/start', {
      method: 'POST',
    })

    expect(started.status).toBe(200)
    expect(writeSpy.mock.calls.length - beforeCount).toBe(1)
    const after = readSnapshotJson(running.projectRoot)
    expect(after.tasks).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'R9-1.0.4', state: 'IN-PROGRESS' })]),
    )
  })

  it('T-R9-1.0.4.2: failed gated call (validation error rollback) writes no snapshot', async () => {
    const writeSpy = vi.spyOn(await import('../../src/tracker/export'), 'writeSnapshotAtomic')
    const running = await listen()

    await requestJson(running.origin, '/tasks', {
      method: 'POST',
      body: JSON.stringify({
        id: 'R9-1.0.4-fail',
        title: 'Fail task',
        description: 'Test failure',
        state: 'TO-DO',
        phase: 'R9-1',
        stream: '0',
      }),
    })

    // Advance to IN-REVIEW so start becomes illegal
    await requestJson(running.origin, '/tasks/R9-1.0.4-fail', {
      method: 'PATCH',
      body: JSON.stringify({ state: 'IN-REVIEW' }),
    })

    const beforeCount = writeSpy.mock.calls.length

    const failed = await requestJson(running.origin, '/tasks/R9-1.0.4-fail/start', {
      method: 'POST',
    })

    expect(failed.status).toBe(409)
    expect(writeSpy.mock.calls.length - beforeCount).toBe(0)
  })

  it('T-R9-1.0.4.3: idempotent no-op call writes the snapshot exactly once', async () => {
    const writeSpy = vi.spyOn(await import('../../src/tracker/export'), 'writeSnapshotAtomic')
    const running = await listen()

    await requestJson(running.origin, '/tasks', {
      method: 'POST',
      body: JSON.stringify({
        id: 'R9-1.0.4-noop',
        title: 'Noop task',
        description: 'Test no-op',
        state: 'IN-PROGRESS',
        phase: 'R9-1',
        stream: '0',
      }),
    })

    const beforeCount = writeSpy.mock.calls.length

    const noop = await requestJson(running.origin, '/tasks/R9-1.0.4-noop/start', {
      method: 'POST',
    })

    expect(noop.status).toBe(200)
    expect(writeSpy.mock.calls.length - beforeCount).toBe(1)
    const after = readSnapshotJson(running.projectRoot)
    expect(after.tasks).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'R9-1.0.4-noop', state: 'IN-PROGRESS' })]),
    )
  })

  it('T-R9-1.0.4.4: snapshot write failure does NOT fail the HTTP response or roll back the database transition', async () => {
    const running = await listen()
    rmSync(join(running.projectRoot, 'docs', '.blueprint'), { recursive: true, force: true })
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await requestJson(running.origin, '/tasks', {
      method: 'POST',
      body: JSON.stringify({
        id: 'R9-1.0.4-warn',
        title: 'Warn task',
        description: 'Test snapshot failure isolation',
        state: 'TO-DO',
        phase: 'R9-1',
        stream: '0',
      }),
    })

    const started = await requestJson(running.origin, '/tasks/R9-1.0.4-warn/start', {
      method: 'POST',
    })

    expect(started.status).toBe(200)
    expect(started.body).toMatchObject({
      data: { task: expect.objectContaining({ id: 'R9-1.0.4-warn', state: 'IN-PROGRESS' }) },
    })
    expect(warnSpy).toHaveBeenCalledWith('[tracker] snapshot write failed', expect.any(Error))

    // Verify DB state persisted despite snapshot failure
    const taskRow = running.db.prepare('SELECT state FROM tasks WHERE id = ?').get('R9-1.0.4-warn') as { state: string }
    expect(taskRow.state).toBe('IN-PROGRESS')
  })

  it('T-R9-1.0.5.1: existing raw PATCH /tasks/:id still accepts arbitrary state writes for non-canonical edits', async () => {
    const running = await listen()

    await requestJson(running.origin, '/tasks', {
      method: 'POST',
      body: JSON.stringify({
        id: 'R9-1.0.4-patch',
        title: 'Patch task',
        description: 'Test raw PATCH preserved',
        state: 'TO-DO',
        phase: 'R9-1',
        stream: '0',
      }),
    })

    const patched = await requestJson(running.origin, '/tasks/R9-1.0.4-patch', {
      method: 'PATCH',
      body: JSON.stringify({ state: 'REWORK' }),
    })

    expect(patched.status).toBe(200)
    expect(patched.body).toMatchObject({
      data: expect.objectContaining({ id: 'R9-1.0.4-patch', state: 'REWORK' }),
    })
  })
})
