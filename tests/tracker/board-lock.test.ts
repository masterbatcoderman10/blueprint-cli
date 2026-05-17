import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:http'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  clearLock,
  isLockAlive,
  readLock,
  writeLock,
} from '../../src/tracker/board-lock'

function makeProjectRoot(): string {
  const dir = mkdtempSync(join(tmpdir(), 'blueprint-lock-'))
  return dir
}

let projectRoots: string[] = []
let servers: ReturnType<typeof createServer>[] = []

afterEach(() => {
  for (const server of servers) {
    server.close()
  }
  servers = []
  for (const root of projectRoots) {
    rmSync(root, { recursive: true, force: true })
  }
  projectRoots = []
})

describe('R6-2.C.4 — board-lock', () => {
  it('T-C.4.1: writeLock then readLock round-trips', async () => {
    const projectRoot = makeProjectRoot()
    projectRoots.push(projectRoot)

    const lockData = { pid: process.pid, port: 7300 }
    await writeLock(projectRoot, lockData)

    const read = await readLock(projectRoot)
    expect(read).toMatchObject({ pid: lockData.pid, port: lockData.port })
    expect(read).toHaveProperty('started_at')
  })

  it('T-C.4.2: isLockAlive true when PID alive and /project ping returns 200', async () => {
    const projectRoot = makeProjectRoot()
    projectRoots.push(projectRoot)

    const server = createServer((req, res) => {
      if (req.url === '/project') {
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ data: { name: 'Test' } }))
      } else {
        res.writeHead(404)
        res.end()
      }
    })

    await new Promise<void>((resolve) => server.listen({ host: '127.0.0.1', port: 0 }, resolve))
    servers.push(server)

    const address = server.address() as { port: number }
    const lock = { pid: process.pid, port: address.port, started_at: Date.now() }

    const alive = await isLockAlive(lock)
    expect(alive).toBe(true)
  })

  it('T-C.4.3: isLockAlive false when PID dead (mock process.kill throws ESRCH)', async () => {
    const killSpy = vi.spyOn(process, 'kill').mockImplementation((pid: number) => {
      const err = new Error('kill ESRCH') as NodeJS.ErrnoException
      err.code = 'ESRCH'
      throw err
    })

    const lock = { pid: 99999, port: 7300, started_at: Date.now() }
    const alive = await isLockAlive(lock)
    expect(alive).toBe(false)

    killSpy.mockRestore()
  })

  it('T-C.4.4: isLockAlive false when PID alive but port times out within 250ms', async () => {
    const lock = { pid: process.pid, port: 1, started_at: Date.now() }
    const alive = await isLockAlive(lock)
    expect(alive).toBe(false)
  })

  it('T-C.4.5: clearLock removes the lock file; idempotent if absent', async () => {
    const projectRoot = makeProjectRoot()
    projectRoots.push(projectRoot)

    await writeLock(projectRoot, { pid: 1, port: 7300 })
    await clearLock(projectRoot)

    const read = await readLock(projectRoot)
    expect(read).toBeNull()

    // idempotent
    await expect(clearLock(projectRoot)).resolves.toBeUndefined()
  })
})
