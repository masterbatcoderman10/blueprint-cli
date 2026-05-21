import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { createServer } from 'node:http'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  clearLock,
  isLockAlive,
  readLock,
  sweepLegacyLock,
  writeLock,
} from '../../../src/tracker/board-lock'

function makeCommonDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'blueprint-common-'))
  return dir
}

let commonDirs: string[] = []
let servers: ReturnType<typeof createServer>[] = []

afterEach(() => {
  for (const server of servers) {
    server.close()
  }
  servers = []
  for (const dir of commonDirs) {
    rmSync(dir, { recursive: true, force: true })
  }
  commonDirs = []
})

describe('R9-2.0.2 — shared board-lock', () => {
  it('T-R9-2.0.2.1: writeLock writes only to shared lock; legacy path is not created', async () => {
    const commonDir = makeCommonDir()
    commonDirs.push(commonDir)

    await writeLock(commonDir, { pid: 123, port: 7300, worktree: '/foo' })

    const lockPath = join(commonDir, 'blueprint-board.lock')
    expect(existsSync(lockPath)).toBe(true)
  })

  it('T-R9-2.0.2.2: writeLock payload includes pid, port, started_at, and worktree', async () => {
    const commonDir = makeCommonDir()
    commonDirs.push(commonDir)

    const worktree = '/some/worktree'
    await writeLock(commonDir, { pid: 123, port: 7300, worktree })

    const read = await readLock(commonDir)
    expect(read).toMatchObject({ pid: 123, port: 7300, worktree })
    expect(read).toHaveProperty('started_at')
  })

  it('T-R9-2.0.2.3: readLock in peer worktree reads lock written from main worktree', async () => {
    const commonDir = makeCommonDir()
    commonDirs.push(commonDir)
    const mainWorktree = '/worktrees/main'

    await writeLock(commonDir, { pid: 456, port: 7301, worktree: mainWorktree })

    // Same commonDir simulates a peer worktree reading the shared lock
    const read = await readLock(commonDir)
    expect(read).toMatchObject({ pid: 456, port: 7301, worktree: mainWorktree })
  })

  it('T-R9-2.0.2.4: clearLock removes shared-lock file; idempotent when absent', async () => {
    const commonDir = makeCommonDir()
    commonDirs.push(commonDir)

    await writeLock(commonDir, { pid: 1, port: 7300, worktree: '/foo' })
    await clearLock(commonDir)

    const read = await readLock(commonDir)
    expect(read).toBeNull()

    // idempotent
    await expect(clearLock(commonDir)).resolves.toBeUndefined()
  })

  it('T-R9-2.0.2.5: lock written from peer worktree readable byte-identical from main worktree', async () => {
    const commonDir = makeCommonDir()
    commonDirs.push(commonDir)
    const peerWorktree = '/worktrees/peer'

    // Write from peer perspective
    await writeLock(commonDir, { pid: process.pid, port: 7302, worktree: peerWorktree })

    // Read from main perspective (same commonDir)
    const read = await readLock(commonDir)
    expect(read).toMatchObject({ pid: process.pid, port: 7302, worktree: peerWorktree })
  })

  it('T-R9-2.0.2.6: readLock on truncated / corrupt JSON returns null without throwing', async () => {
    const commonDir = makeCommonDir()
    commonDirs.push(commonDir)

    writeFileSync(join(commonDir, 'blueprint-board.lock'), '{broken json', 'utf8')

    const read = await readLock(commonDir)
    expect(read).toBeNull()
  })

  // Preserve existing isLockAlive regression coverage
  it('isLockAlive true when PID alive and /project ping returns 200', async () => {
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
    const lock = { pid: process.pid, port: address.port, started_at: Date.now(), worktree: '/wt' }

    const alive = await isLockAlive(lock)
    expect(alive).toBe(true)
  })

  it('isLockAlive false when PID dead (mock process.kill throws ESRCH)', async () => {
    const killSpy = vi.spyOn(process, 'kill').mockImplementation((pid: number) => {
      const err = new Error('kill ESRCH') as NodeJS.ErrnoException
      err.code = 'ESRCH'
      throw err
    })

    const lock = { pid: 99999, port: 7300, started_at: Date.now(), worktree: '/wt' }
    const alive = await isLockAlive(lock)
    expect(alive).toBe(false)

    killSpy.mockRestore()
  })
})

describe('R9-2.0.3 — sweepLegacyLock', () => {
  it('T-R9-2.0.3.1: sweepLegacyLock removes legacy docs/.blueprint/board.lock and returns true', async () => {
    const worktreeRoot = mkdtempSync(join(tmpdir(), 'blueprint-wt-'))
    commonDirs.push(worktreeRoot)

    const legacyPath = join(worktreeRoot, 'docs', '.blueprint', 'board.lock')
    mkdirSync(dirname(legacyPath), { recursive: true })
    writeFileSync(legacyPath, JSON.stringify({ pid: 1, port: 7300, started_at: Date.now() }), 'utf8')

    const swept = await sweepLegacyLock(worktreeRoot)
    expect(swept).toBe(true)
    expect(existsSync(legacyPath)).toBe(false)
  })

  it('T-R9-2.0.3.2: sweepLegacyLock no-op when legacy file absent', async () => {
    const worktreeRoot = mkdtempSync(join(tmpdir(), 'blueprint-wt-'))
    commonDirs.push(worktreeRoot)

    const swept = await sweepLegacyLock(worktreeRoot)
    expect(swept).toBe(false)
  })
})
