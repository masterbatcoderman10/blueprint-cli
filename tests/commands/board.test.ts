import { execSync, spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { boardCommand } from '../../src/commands/board'
import { openDb } from '../../src/tracker/db'
import { getGitCommonDir } from '../../src/tracker/git-context'
import { projectRootErrorMessage } from '../../src/tracker/project-root'
import * as browserOpen from '../../src/tracker/browser-open'

vi.mock('../../src/tracker/browser-open', () => ({
  openUrl: vi.fn(),
}))

const packageRoot = process.cwd()
const require = createRequire(import.meta.url)
const tsxPath = join(dirname(require.resolve('tsx/package.json')), 'dist', 'cli.mjs')
const srcIndexPath = join(packageRoot, 'src/index.ts')

const tempDirs: string[] = []
const spawnedProcs: ReturnType<typeof spawn>[] = []
const occupiedServers: ReturnType<typeof import('node:http').createServer>[] = []
const initialSigintListeners = new Set(process.listeners('SIGINT'))

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

function spawnBoard(cwd: string, args: string[] = []): ReturnType<typeof spawn> {
  const proc = spawn(tsxPath, [srcIndexPath, 'board', ...args], {
    cwd,
    env: { ...process.env, NODE_NO_WARNINGS: '1' },
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  proc.on('error', () => {
    // Swallow spawn errors so they don't become unhandled exceptions.
    // Tests detect failures via missing output or exit code.
  })
  spawnedProcs.push(proc)
  return proc
}

async function waitForOutput(
  proc: ReturnType<typeof spawn>,
  pattern: RegExp,
  timeoutMs = 8000,
): Promise<RegExpMatchArray> {
  let output = ''
  proc.stdout?.on('data', (data: Buffer) => {
    output += data.toString()
  })
  proc.stderr?.on('data', (data: Buffer) => {
    output += data.toString()
  })

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timeout waiting for pattern ${pattern}. Output: ${output}`))
    }, timeoutMs)

    const interval = setInterval(() => {
      const match = output.match(pattern)
      if (match) {
        clearTimeout(timeout)
        clearInterval(interval)
        resolve(match)
      }
    }, 50)
  })
}

async function killProc(proc: ReturnType<typeof spawn>): Promise<number> {
  if (proc.killed || proc.exitCode !== null) {
    return proc.exitCode ?? 0
  }
  return new Promise((resolve) => {
    proc.on('exit', (code) => resolve(code ?? 0))
    proc.kill('SIGINT')
  })
}

afterEach(async () => {
  vi.restoreAllMocks()
  for (const listener of process.listeners('SIGINT')) {
    if (!initialSigintListeners.has(listener)) {
      process.removeListener('SIGINT', listener)
    }
  }

  const procs = spawnedProcs.splice(0)
  await Promise.all(procs.map(proc => new Promise<void>((resolve) => {
    if (proc.killed || proc.exitCode !== null) {
      resolve()
      return
    }
    proc.kill('SIGINT')
    const timer = setTimeout(() => {
      proc.kill('SIGKILL')
      resolve()
    }, 2000)
    proc.on('exit', () => {
      clearTimeout(timer)
      resolve()
    })
  })))

  for (const server of occupiedServers.splice(0)) {
    server.close()
  }

  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('Stream D — board command', () => {
  it(
    'D.1: default invocation boots, writes lock, logs port, and exits cleanly on SIGINT',
    async () => {
      const projectRoot = createTempDir('blueprint-board-')
      seedProjectDb(projectRoot)
      const proc = spawnBoard(projectRoot)

      const match = await waitForOutput(proc, /Board available at (http:\/\/127\.0\.0\.1:\d+)/)
      const url = match[1]
      const port = Number(url.split(':').pop())

      const commonResult = getGitCommonDir(projectRoot)
      expect(commonResult.ok).toBe(true)
      if (!commonResult.ok) return
      const lockPath = join(commonResult.path, 'blueprint-board.lock')
      expect(existsSync(lockPath)).toBe(true)

      const lockRaw = readFileSync(lockPath, 'utf8')
      const lock = JSON.parse(lockRaw)
      expect(lock).toHaveProperty('pid')
      expect(lock).toHaveProperty('port', port)
      expect(lock).toHaveProperty('started_at')

      // Verify server is actually responding
      const response = await fetch(`${url}/project`)
      expect(response.status).toBe(200)

      const exitCode = await killProc(proc)
      expect(exitCode).toBe(0)

      // Lock should be cleared after SIGINT
      await new Promise((r) => setTimeout(r, 200))
      expect(existsSync(lockPath)).toBe(false)
    },
    15000,
  )

  it('D.2: --headless boots without calling openUrl', async () => {
    const projectRoot = createTempDir('blueprint-board-')
    seedProjectDb(projectRoot)
    vi.spyOn(process, 'cwd').mockReturnValue(projectRoot)
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})

    const run = boardCommand.handler({
      commandName: 'board',
      args: ['--headless'],
      rawArgv: ['board', '--headless'],
    })

    await vi.waitFor(() => {
      expect(log).toHaveBeenCalledWith(expect.stringMatching(/^Board available at http:\/\/127\.0\.0\.1:\d+$/))
    })

    process.emit('SIGINT', 'SIGINT')
    await expect(run).resolves.toEqual({ exitCode: 0 })
    expect(browserOpen.openUrl).not.toHaveBeenCalled()
  })

  it(
    'D.3: second invocation while live lock exits 0 with existing-URL message',
    async () => {
      const projectRoot = createTempDir('blueprint-board-')
      seedProjectDb(projectRoot)

      // First board
      const proc1 = spawnBoard(projectRoot)
      const match1 = await waitForOutput(proc1, /Board available at (http:\/\/127\.0\.0\.1:\d+)/)
      const url1 = match1[1]

      // Second board in same project
      const proc2 = spawnBoard(projectRoot)
      const match2 = await waitForOutput(proc2, /Board already running at (http:\/\/127\.0\.0\.1:\d+)/)
      const url2 = match2[1]

      expect(url2).toBe(url1)

      const exitCode2 = await new Promise<number>((resolve) => {
        proc2.on('exit', (code) => resolve(code ?? 0))
        proc2.on('error', () => resolve(1))
      })
      expect(exitCode2).toBe(0)

      await killProc(proc1)
    },
    15000,
  )

  it(
    'D.4: stale lock is removed automatically and boot proceeds',
    async () => {
      const projectRoot = createTempDir('blueprint-board-')
      seedProjectDb(projectRoot)

      // Write a stale lock with a non-existent PID and unresponsive port
      const commonResult = getGitCommonDir(projectRoot)
      expect(commonResult.ok).toBe(true)
      if (!commonResult.ok) return
      const lockPath = join(commonResult.path, 'blueprint-board.lock')
      writeFileSync(
        lockPath,
        JSON.stringify({ pid: 99999, port: 1, started_at: Date.now() }),
        'utf8',
      )

      const proc = spawnBoard(projectRoot)
      const match = await waitForOutput(proc, /Board available at (http:\/\/127\.0\.0\.1:\d+)/)
      expect(match[1]).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/)

      const lockRaw = readFileSync(lockPath, 'utf8')
      const lock = JSON.parse(lockRaw)
      expect(lock.pid).not.toBe(99999)

      await killProc(proc)
    },
    15000,
  )

  it(
    'D.5: all ports occupied → no_free_port with non-zero exit',
    async () => {
      const projectRoot = createTempDir('blueprint-board-')
      seedProjectDb(projectRoot)

      const { createServer } = await import('node:http')
      const servers: ReturnType<typeof createServer>[] = []

      try {
        let externallyOccupied = 0
        for (const port of [7300, 7301, 7302, 7303, 7304, 7305, 7306, 7307, 7308, 7309]) {
          const server = createServer()
          const bound = await new Promise<boolean>((resolve) => {
            server.once('error', () => resolve(false))
            server.listen({ host: '127.0.0.1', port }, () => resolve(true))
          })
          if (bound) {
            servers.push(server)
            occupiedServers.push(server)
          } else {
            externallyOccupied++
          }
        }

        // Skip if any port is already occupied externally (e.g. dev tracker)
        if (externallyOccupied > 0) {
          console.log(`Skipping D.5: ${externallyOccupied} port(s) already occupied externally`)
          return
        }

        const proc = spawnBoard(projectRoot, ['--headless'])
        const exitCode = await new Promise<number>((resolve) => {
          proc.on('exit', (code) => resolve(code ?? 0))
          proc.on('error', () => resolve(1))
        })

        expect(exitCode).not.toBe(0)
      } finally {
        for (const server of servers) {
          server.close()
        }
      }
    },
    15000,
  )

  it('D.6: --headless outside a Blueprint project surfaces the project-root error', async () => {
    const outsideProject = createTempDir('blueprint-outside-')
    // Remove docs/.blueprint so it's not a valid project
    rmSync(join(outsideProject, 'docs', '.blueprint'), { recursive: true, force: true })
    vi.spyOn(process, 'cwd').mockReturnValue(outsideProject)
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await boardCommand.handler({
      commandName: 'board',
      args: ['--headless'],
      rawArgv: ['board', '--headless'],
    })

    expect(result).toEqual({ exitCode: 1 })
    expect(error).toHaveBeenCalledWith(projectRootErrorMessage)
    expect(existsSync(join(outsideProject, 'docs', '.blueprint', 'tasks.db'))).toBe(false)
  })
})
