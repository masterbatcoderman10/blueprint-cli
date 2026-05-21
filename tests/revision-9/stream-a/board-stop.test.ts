import { execSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { runBoardStop } from '../../../src/commands/board-stop'
import { readLock, writeLock } from '../../../src/tracker/board-lock'
import { getGitCommonDir } from '../../../src/tracker/git-context'
import { createServer } from 'node:http'

const tempDirs: string[] = []
const servers: ReturnType<typeof createServer>[] = []

function createTempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  tempDirs.push(dir)
  mkdirSync(join(dir, 'docs', '.blueprint'), { recursive: true })
  execSync('git init', { cwd: dir, stdio: 'ignore' })
  execSync('git config user.email "test@example.com"', { cwd: dir, stdio: 'ignore' })
  execSync('git config user.name "Test User"', { cwd: dir, stdio: 'ignore' })
  writeFileSync(join(dir, 'init.txt'), 'init', 'utf8')
  execSync('git add init.txt', { cwd: dir, stdio: 'ignore' })
  execSync('git commit -m "init"', { cwd: dir, stdio: 'ignore' })
  return dir
}

afterEach(async () => {
  vi.restoreAllMocks()
  for (const server of servers.splice(0)) {
    server.close()
  }
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('R9-2.A.3 — board stop', () => {
  it('T-R9-2.A.3.1: no lock → "No board running." exit 0', async () => {
    const projectRoot = createTempDir('blueprint-stop-none-')
    vi.spyOn(process, 'cwd').mockReturnValue(projectRoot)
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})

    const result = await runBoardStop()

    expect(result).toEqual({ exitCode: 0 })
    expect(log).toHaveBeenCalledWith('No board running.')
  })

  it('T-R9-2.A.3.2: stale lock → cleanup message, exit 0, lock removed', async () => {
    const projectRoot = createTempDir('blueprint-stop-stale-')
    vi.spyOn(process, 'cwd').mockReturnValue(projectRoot)

    const commonResult = getGitCommonDir(projectRoot)
    expect(commonResult.ok).toBe(true)
    if (!commonResult.ok) return
    const commonDir = commonResult.path

    // Write a stale lock with dead PID
    await writeLock(commonDir, { pid: 99999, port: 1, worktree: '/fake' })

    const log = vi.spyOn(console, 'log').mockImplementation(() => {})

    const result = await runBoardStop()

    expect(result).toEqual({ exitCode: 0 })
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Cleared stale lock'))

    // Lock file should be gone
    const lockAfter = await readLock(commonDir)
    expect(lockAfter).toBeNull()
  })

  it('T-R9-2.A.3.3: live board → SIGTERM kills it, lock cleared, exit 0', async () => {
    const projectRoot = createTempDir('blueprint-stop-live-')
    vi.spyOn(process, 'cwd').mockReturnValue(projectRoot)

    // Start a real HTTP server to simulate a live board
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
    const port = (server.address() as { port: number }).port

    const commonResult = getGitCommonDir(projectRoot)
    expect(commonResult.ok).toBe(true)
    if (!commonResult.ok) return
    const commonDir = commonResult.path

    // Write a lock pointing at our real server with our own PID
    await writeLock(commonDir, { pid: process.pid, port, worktree: projectRoot })

    const log = vi.spyOn(console, 'log').mockImplementation(() => {})

    // We need to mock process.kill so it doesn't actually kill our process
    const killSpy = vi.spyOn(process, 'kill').mockImplementation(() => true)

    const result = await runBoardStop()

    expect(result).toEqual({ exitCode: 0 })
    expect(killSpy).toHaveBeenCalledWith(process.pid, 'SIGTERM')
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Stopped board'))

    // Lock should be cleared
    const lockAfter = await readLock(commonDir)
    expect(lockAfter).toBeNull()

    killSpy.mockRestore()
  })
})
