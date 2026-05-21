import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { boardCommand } from '../../../src/commands/board'
import { writeLock } from '../../../src/tracker/board-lock'
import { getGitCommonDir } from '../../../src/tracker/git-context'
import * as browserOpen from '../../../src/tracker/browser-open'
import { openDb } from '../../../src/tracker/db'

vi.mock('../../../src/tracker/browser-open', () => ({
  openUrl: vi.fn(),
}))

const tempDirs: string[] = []

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

function seedProjectDb(projectRoot: string): void {
  const handle = openDb(projectRoot)
  handle.db.prepare(
    `INSERT INTO project_meta (id, name, tagline, phase_count, stream_count, created_at, updated_at)
     VALUES (1, 'Test Project', 'Test tagline', NULL, NULL, ?, ?)`,
  ).run(Date.now(), Date.now())
  handle.close()
}

afterEach(() => {
  vi.restoreAllMocks()
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('R9-2.A.2 — board start behavior', () => {
  it('T-R9-2.A.2.3: live lock in same worktree → refusal with url + worktree, exit 1, openUrl NOT called', async () => {
    const projectRoot = createTempDir('blueprint-start-')
    seedProjectDb(projectRoot)
    vi.spyOn(process, 'cwd').mockReturnValue(projectRoot)

    // Write a live lock pointing at the dev tracker (port 7300) with our PID
    const commonResult = getGitCommonDir(projectRoot)
    expect(commonResult.ok).toBe(true)
    if (!commonResult.ok) return
    const commonDir = commonResult.path

    // Create a real HTTP server on a free port to satisfy isLockAlive
    const { createServer } = await import('node:http')
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
    const port = (server.address() as { port: number }).port

    await writeLock(commonDir, {
      pid: process.pid,
      port,
      worktree: projectRoot,
    })

    const log = vi.spyOn(console, 'log').mockImplementation(() => {})

    const result = await boardCommand.handler({
      commandName: 'board',
      args: ['start', '--headless'],
      rawArgv: ['board', 'start', '--headless'],
    })

    expect(result).toEqual({ exitCode: 1 })
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining(`http://127.0.0.1:${port}`),
    )
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining(projectRoot),
    )
    expect(browserOpen.openUrl).not.toHaveBeenCalled()

    server.close()
  })

  it('T-R9-2.A.2.6: --headless flag preserved — boot succeeds headless', async () => {
    const projectRoot = createTempDir('blueprint-headless-')
    seedProjectDb(projectRoot)
    vi.spyOn(process, 'cwd').mockReturnValue(projectRoot)
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})

    const run = boardCommand.handler({
      commandName: 'board',
      args: ['--headless'],
      rawArgv: ['board', '--headless'],
    })

    // Wait for the board to start
    await vi.waitFor(() => {
      expect(log).toHaveBeenCalledWith(expect.stringMatching(/^Board available at http:\/\/127\.0\.0\.1:\d+$/))
    })

    // openUrl should NOT have been called in headless mode
    expect(browserOpen.openUrl).not.toHaveBeenCalled()

    // Send SIGINT to stop the server
    process.emit('SIGINT', 'SIGINT')
    const result = await run
    expect(result).toEqual({ exitCode: 0 })
  })

  it('T-R9-2.A.2.2: legacy lock sweep → warning printed, legacy file deleted, shared lock written', async () => {
    const projectRoot = createTempDir('blueprint-sweep-')
    seedProjectDb(projectRoot)
    vi.spyOn(process, 'cwd').mockReturnValue(projectRoot)

    // Create a legacy lock file at the old location
    const legacyDir = join(projectRoot, 'docs', '.blueprint')
    const legacyPath = join(legacyDir, 'board.lock')
    writeFileSync(legacyPath, JSON.stringify({ pid: 12345, port: 7300 }), 'utf8')
    expect(existsSync(legacyPath)).toBe(true)

    const log = vi.spyOn(console, 'log').mockImplementation(() => {})

    const run = boardCommand.handler({
      commandName: 'board',
      args: ['start', '--headless'],
      rawArgv: ['board', 'start', '--headless'],
    })

    // Wait for the board to start and the migration message to appear
    await vi.waitFor(() => {
      expect(log).toHaveBeenCalledWith('Migrating legacy board lock to shared location.')
    })

    // Legacy file should be gone
    expect(existsSync(legacyPath)).toBe(false)

    // Shared lock should be written
    const commonResult = getGitCommonDir(projectRoot)
    expect(commonResult.ok).toBe(true)
    if (!commonResult.ok) return
    const sharedLockPath = join(commonResult.path, 'blueprint-board.lock')
    expect(existsSync(sharedLockPath)).toBe(true)

    // Stop the server
    process.emit('SIGINT', 'SIGINT')
    const result = await run
    expect(result).toEqual({ exitCode: 0 })
  })
})
