import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

export interface EnsureSpaBuildOptions {
  build?: () => void | Promise<void>
  lockDir?: string
  pollMs?: number
  rootDir?: string
  spaDir?: string
  timeoutMs?: number
}

export function hasSpaBuild(spaDir: string): boolean {
  const indexHtml = join(spaDir, 'index.html')
  const assetsDir = join(spaDir, 'assets')

  return existsSync(indexHtml) && existsSync(assetsDir) && readdirSync(assetsDir).length > 0
}

function tryAcquireLock(lockDir: string): boolean {
  try {
    mkdirSync(dirname(lockDir), { recursive: true })
    mkdirSync(lockDir)
    return true
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException
    if (nodeError.code === 'EEXIST') {
      return false
    }

    throw error
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function ensureSpaBuild(options: EnsureSpaBuildOptions = {}): Promise<void> {
  const rootDir = options.rootDir ?? resolve(__dirname, '../..')
  const spaDir = options.spaDir ?? join(rootDir, 'dist', 'spa')
  const lockDir = options.lockDir ?? join(rootDir, 'dist', '.spa-build.lock')
  const pollMs = options.pollMs ?? 25
  const timeoutMs = options.timeoutMs ?? 10_000
  const build = options.build ?? (() => execFileSync('npm', ['run', 'build:spa'], { cwd: rootDir, stdio: 'inherit' }))
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    if (hasSpaBuild(spaDir)) {
      return
    }

    if (tryAcquireLock(lockDir)) {
      try {
        if (!hasSpaBuild(spaDir)) {
          await build()
        }

        if (!hasSpaBuild(spaDir)) {
          throw new Error(`SPA build did not produce a ready dist/spa output at ${spaDir}.`)
        }

        return
      } finally {
        rmSync(lockDir, { recursive: true, force: true })
      }
    }

    await wait(pollMs)
  }

  throw new Error(`Timed out waiting for a ready dist/spa output at ${spaDir}.`)
}
