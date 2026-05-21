import { mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

export interface LockData {
  pid: number
  port: number
  started_at: number
  worktree: string
}

function lockPath(commonDir: string): string {
  return join(commonDir, 'blueprint-board.lock')
}

export async function readLock(commonDir: string): Promise<LockData | null> {
  try {
    const raw = await readFile(lockPath(commonDir), 'utf8')
    const parsed = JSON.parse(raw) as LockData
    return parsed
  } catch {
    return null
  }
}

export async function writeLock(
  commonDir: string,
  data: { pid: number; port: number; worktree: string },
): Promise<void> {
  const payload: LockData = {
    pid: data.pid,
    port: data.port,
    started_at: Date.now(),
    worktree: data.worktree,
  }
  const path = lockPath(commonDir)
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, JSON.stringify(payload), 'utf8')
}

export async function clearLock(commonDir: string): Promise<void> {
  try {
    await unlink(lockPath(commonDir))
  } catch {
    // idempotent — file may already be absent
  }
}

export async function sweepLegacyLock(worktreeRoot: string): Promise<boolean> {
  const legacyPath = join(worktreeRoot, 'docs', '.blueprint', 'board.lock')
  try {
    await stat(legacyPath)
    await unlink(legacyPath)
    return true
  } catch {
    return false
  }
}

export async function isLockAlive(lock: LockData): Promise<boolean> {
  try {
    process.kill(lock.pid, 0)
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ESRCH') {
      return false
    }
    return false
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 250)

    try {
      const response = await fetch(`http://127.0.0.1:${lock.port}/project`, {
        signal: controller.signal,
      })

      return response.status === 200
    } catch {
      return false
    } finally {
      clearTimeout(timeout)
    }
  } catch {
    return false
  }
}
