import { execSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { runBoardStatus } from '../../../src/commands/board-status'
import { writeLock } from '../../../src/tracker/board-lock'
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

describe('R9-2.A.4 — board status', () => {
  it('T-R9-2.A.4.1: no lock → "No board running for this repo." exit 2', async () => {
    const projectRoot = createTempDir('blueprint-status-none-')
    vi.spyOn(process, 'cwd').mockReturnValue(projectRoot)
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})

    const result = await runBoardStatus()

    expect(result).toEqual({ exitCode: 2 })
    expect(log).toHaveBeenCalledWith('No board running for this repo.')
  })

  it('T-R9-2.A.4.2: stale lock → "Stale lock detected..." exit 1', async () => {
    const projectRoot = createTempDir('blueprint-status-stale-')
    vi.spyOn(process, 'cwd').mockReturnValue(projectRoot)

    const commonResult = getGitCommonDir(projectRoot)
    expect(commonResult.ok).toBe(true)
    if (!commonResult.ok) return
    const commonDir = commonResult.path

    // Write a stale lock with a dead PID
    await writeLock(commonDir, { pid: 99999, port: 1, worktree: '/fake-wt' })

    const log = vi.spyOn(console, 'log').mockImplementation(() => {})

    const result = await runBoardStatus()

    expect(result).toEqual({ exitCode: 1 })
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Stale lock detected'))
  })

  it('T-R9-2.A.4.3: live board → url/pid/worktree/uptime in output, exit 0', async () => {
    const projectRoot = createTempDir('blueprint-status-live-')
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

    await writeLock(commonDir, { pid: process.pid, port, worktree: projectRoot })

    const log = vi.spyOn(console, 'log').mockImplementation(() => {})

    const result = await runBoardStatus()

    expect(result).toEqual({ exitCode: 0 })
    const output = log.mock.calls.map((c: unknown[]) => String(c[0])).join(' ')
    expect(output).toContain(`http://127.0.0.1:${port}`)
    expect(output).toContain(`pid ${process.pid}`)
    expect(output).toContain(projectRoot)
    expect(output).toMatch(/uptime/)
  })
})
