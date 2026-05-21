import { isLockAlive, readLock } from '../tracker/board-lock'
import { requireGitContext } from '../tracker/git-context'

function humanUptime(startedAt: number): string {
  const ms = Date.now() - startedAt
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${sec}s`
  return `${sec}s`
}

export async function runBoardStatus(): Promise<{ exitCode: number }> {
  try {
    const { commonDir } = requireGitContext(process.cwd())
    const lock = await readLock(commonDir)
    if (!lock) {
      console.log('No board running for this repo.')
      return { exitCode: 2 }
    }
    const alive = await isLockAlive(lock)
    if (!alive) {
      console.log(`Stale lock detected (pid ${lock.pid}, port ${lock.port}, worktree ${lock.worktree}). Run \`blueprint board stop\` to clear.`)
      return { exitCode: 1 }
    }
    const uptime = humanUptime(lock.started_at)
    console.log(`Board running at http://127.0.0.1:${lock.port} (pid ${lock.pid}, worktree ${lock.worktree}, uptime ${uptime}).`)
    return { exitCode: 0 }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return { exitCode: 1 }
  }
}
