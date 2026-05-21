import type { AddressInfo } from 'node:net'
import { createServer as createHttpServer } from 'node:http'
import { resolve } from 'node:path'

import type { CommandDefinition } from '../runtime'
import { runBoardStop } from './board-stop'
import { runBoardStatus } from './board-status'
import { clearLock, isLockAlive, readLock, sweepLegacyLock, writeLock } from '../tracker/board-lock'
import { BOARD_PORTS, findFreePort } from '../tracker/board-port'
import { openUrl } from '../tracker/browser-open'
import type { TrackerDbHandle } from '../tracker/db'
import { requireGitContext } from '../tracker/git-context'
import { findProjectRoot } from '../tracker/project-root'
import { createServer } from '../tracker/server'
import { serveStatic } from '../tracker/static-handler'

function waitForSigint(): Promise<void> {
  return new Promise((resolve) => {
    process.once('SIGINT', () => resolve())
  })
}

async function closeServer(server: ReturnType<typeof createHttpServer>): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error)
      else resolve()
    })
  })
}

function isNoFreePortError(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 'no_free_port'
  )
}

async function tryListen(
  server: ReturnType<typeof createHttpServer>,
  port: number,
): Promise<boolean> {
  return new Promise((resolve) => {
    const onError = (err: Error) => {
      const code = (err as NodeJS.ErrnoException).code
      if (code === 'EADDRINUSE') {
        resolve(false)
      } else {
        server.off('error', onError)
        resolve(false)
      }
    }
    server.once('error', onError)
    server.listen({ host: '127.0.0.1', port }, () => {
      server.off('error', onError)
      resolve(true)
    })
  })
}

async function bindServer(
  server: ReturnType<typeof createHttpServer>,
): Promise<number> {
  // Use findFreePort as a first guess, then try atomically binding each port.
  const firstGuess = await findFreePort('127.0.0.1').catch(() => null)
  const orderedPorts = firstGuess !== null
    ? [firstGuess, ...BOARD_PORTS.filter((p) => p !== firstGuess)]
    : [...BOARD_PORTS]

  for (const port of orderedPorts) {
    const bound = await tryListen(server, port)
    if (bound) {
      return port
    }
  }

  throw { code: 'no_free_port', tried: BOARD_PORTS }
}

async function runBoard({ headless }: { headless: boolean }): Promise<{ exitCode: number }> {
  let trackerDb: TrackerDbHandle | undefined
  let server: ReturnType<typeof createHttpServer> | undefined
  let projectRoot: string | undefined
  let commonDir: string | undefined
  let worktreeRoot: string | undefined
  let lockWritten = false

  try {
    const gitContext = requireGitContext(process.cwd())
    commonDir = gitContext.commonDir
    worktreeRoot = gitContext.worktreeRoot

    projectRoot = findProjectRoot(process.cwd())

    // Sweep legacy lock if present
    const swept = await sweepLegacyLock(worktreeRoot)
    if (swept) {
      console.log('Migrating legacy board lock to shared location.')
    }

    // Check for existing live lock
    const existingLock = await readLock(commonDir)
    if (existingLock) {
      const alive = await isLockAlive(existingLock)
      if (alive) {
        const url = `http://127.0.0.1:${existingLock.port}`
        console.log(`Board already running at ${url} (started from ${existingLock.worktree}). Run \`blueprint board stop\` to stop it.`)
        return { exitCode: 1 }
      }
      // Stale lock — remove it
      await clearLock(commonDir)
    }

    const { openDb } = await import('../tracker/db')
    trackerDb = openDb(projectRoot)

    const apiServer = createServer({ db: trackerDb.db })
    const spaDir = resolve(__dirname, '../../dist/spa')

    server = createHttpServer(async (request, response) => {
      try {
        const handled = await serveStatic(request, response, { spaDir })
        if (!handled) {
          apiServer.emit('request', request, response)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error.'
        response.writeHead(500, { 'content-type': 'text/plain' })
        response.end(message)
      }
    })

    const port = await bindServer(server)

    const address = server.address() as AddressInfo
    const url = `http://${address.address}:${address.port}`

    await writeLock(commonDir, { pid: process.pid, port: address.port, worktree: worktreeRoot })
    lockWritten = true

    console.log(`Board available at ${url}`)

    if (!headless) {
      await openUrl(url)
    }

    await waitForSigint()

    return { exitCode: 0 }
  } catch (error) {
    if (isNoFreePortError(error)) {
      console.error('No free port available for the board server.')
      return { exitCode: 1 }
    }

    console.error(error instanceof Error ? error.message : String(error))
    return { exitCode: 1 }
  } finally {
    if (server?.listening) {
      try {
        await closeServer(server)
      } catch {
        // Ignore close errors during cleanup
      }
    }
    if (trackerDb) {
      try {
        trackerDb.close()
      } catch {
        // Ignore close errors during cleanup
      }
    }
    if (lockWritten && commonDir) {
      try {
        await clearLock(commonDir)
      } catch {
        // Ignore lock-clear errors during cleanup
      }
    }
  }
}

export const boardCommand: CommandDefinition = {
  name: 'board',
  handler: async ({ args }) => {
    const flags = args.filter((a) => a.startsWith('-'))
    const positionals = args.filter((a) => !a.startsWith('-'))
    const subcommand = positionals[0]

    if (!subcommand || subcommand === 'start') {
      const headless = flags.includes('--headless')
      return runBoard({ headless })
    }

    if (subcommand === 'stop') {
      return runBoardStop()
    }

    if (subcommand === 'status') {
      return runBoardStatus()
    }

    console.error('Usage: blueprint board [start|stop|status] [--headless]')
    return { exitCode: 1 }
  },
}
