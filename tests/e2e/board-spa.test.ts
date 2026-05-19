import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { openDb } from '../../src/tracker/db'

const packageRoot = process.cwd()
const tsxPath = join(packageRoot, 'node_modules/.bin/tsx')
const srcIndexPath = join(packageRoot, 'src/index.ts')

const tempDirs: string[] = []
const spawnedProcs: ReturnType<typeof spawn>[] = []

function createTempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  tempDirs.push(dir)
  mkdirSync(join(dir, 'docs', '.blueprint'), { recursive: true })
  return dir
}

function seedProjectDb(projectRoot: string): void {
  const handle = openDb(projectRoot)
  handle.db.prepare(
    `INSERT INTO project_meta (id, name, tagline, phase_count, stream_count, created_at, updated_at)
     VALUES (1, 'E2E Project', 'E2E tagline', NULL, NULL, ?, ?)`,
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
    // Swallow spawn errors.
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

  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('Stream D — board SPA E2E', () => {
  it(
    'D.3: serves SPA index.html, fingerprinted assets, and JSON API side-by-side',
    async () => {
      const projectRoot = createTempDir('blueprint-e2e-')
      seedProjectDb(projectRoot)

      const proc = spawnBoard(projectRoot, ['--headless'])
      const match = await waitForOutput(proc, /Board available at (http:\/\/127\.0\.0\.1:\d+)/)
      const url = match[1]

      // GET / → SPA index.html with mount node
      const indexResponse = await fetch(url)
      expect(indexResponse.status).toBe(200)
      const contentType = indexResponse.headers.get('content-type')
      expect(contentType).toContain('text/html')
      const indexBody = await indexResponse.text()
      expect(indexBody).toContain('<div id="app"></div>')

      // GET /assets/<fingerprint>.js → 200 + immutable cache header
      const spaAssetsDir = join(packageRoot, 'dist', 'spa', 'assets')
      const assets = readdirSync(spaAssetsDir)
      const jsAsset = assets.find((f) => f.endsWith('.js'))
      expect(jsAsset).toBeDefined()

      const assetResponse = await fetch(`${url}/assets/${jsAsset}`)
      expect(assetResponse.status).toBe(200)
      const assetContentType = assetResponse.headers.get('content-type')
      expect(assetContentType).toContain('javascript')
      const cacheControl = assetResponse.headers.get('cache-control')
      expect(cacheControl).toContain('immutable')

      // GET /tasks → JSON API still works
      const tasksResponse = await fetch(`${url}/tasks`)
      expect(tasksResponse.status).toBe(200)
      const tasksContentType = tasksResponse.headers.get('content-type')
      expect(tasksContentType).toContain('application/json')
      const tasksBody = await tasksResponse.json()
      expect(tasksBody).toHaveProperty('ok', true)
      expect(tasksBody).toHaveProperty('data')
      expect(Array.isArray(tasksBody.data)).toBe(true)

      // GET /project → JSON API still works
      const projectResponse = await fetch(`${url}/project`)
      expect(projectResponse.status).toBe(200)
      const projectContentType = projectResponse.headers.get('content-type')
      expect(projectContentType).toContain('application/json')
      const projectBody = await projectResponse.json()
      expect(projectBody).toEqual({
        ok: true,
        data: {
          name: 'E2E Project',
          tagline: 'E2E tagline',
          phaseCount: null,
          streamCount: null,
        },
      })

      const exitCode = await killProc(proc)
      expect(exitCode).toBe(0)
    },
    15000,
  )
})
