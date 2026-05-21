import { clearLock, isLockAlive, readLock } from '../tracker/board-lock'
import { requireGitContext } from '../tracker/git-context'

export async function runBoardStop(): Promise<{ exitCode: number }> {
  try {
    const { commonDir } = requireGitContext(process.cwd())
    const lock = await readLock(commonDir)
    if (!lock) {
      console.log('No board running.')
      return { exitCode: 0 }
    }
    const alive = await isLockAlive(lock)
    if (!alive) {
      console.log(`Cleared stale lock (pid ${lock.pid}, port ${lock.port}).`)
      await clearLock(commonDir)
      return { exitCode: 0 }
    }
    process.kill(lock.pid, 'SIGTERM')
    const deadline = Date.now() + 2000
    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 100))
      if (!(await isLockAlive(lock))) break
    }
    if (await isLockAlive(lock)) {
      process.kill(lock.pid, 'SIGKILL')
      await new Promise(r => setTimeout(r, 500))
    }
    let portUnreachable = false
    const portDeadline = Date.now() + 1000
    while (Date.now() < portDeadline) {
      try {
        await fetch(`http://127.0.0.1:${lock.port}/project`, { signal: AbortSignal.timeout(200) })
        await new Promise(r => setTimeout(r, 100))
      } catch {
        portUnreachable = true
        break
      }
    }
    await clearLock(commonDir)
    if (portUnreachable) {
      console.log(`Stopped board (pid ${lock.pid}, port ${lock.port}).`)
    } else {
      console.log(`Stopped board (pid ${lock.pid}, port ${lock.port}). Note: port may still be briefly reachable.`)
    }
    return { exitCode: 0 }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return { exitCode: 1 }
  }
}
