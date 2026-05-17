import type { AddressInfo } from 'node:net'
import { createServer as createHttpServer } from 'node:http'
import { resolve } from 'node:path'

import type { CommandDefinition } from '../runtime'
import { clearLock, isLockAlive, readLock, writeLock } from '../tracker/board-lock'
import { findFreePort } from '../tracker/board-port'
import { openUrl } from '../tracker/browser-open'
import { openDb, type TrackerDbHandle } from '../tracker/db'
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

async function runBoard({ headless }: { headless: boolean }): Promise<{ exitCode: number }> {
  let trackerDb: TrackerDbHandle | undefined
  let server: ReturnType<typeof createHttpServer> | undefined
  let projectRoot: string | undefined
  let lockWritten = false

  try {
    projectRoot = findProjectRoot(process.cwd())

    // Check for existing live lock
    const existingLock = await readLock(projectRoot)
    if (existingLock) {
      const alive = await isLockAlive(existingLock)
      if (alive) {
        const url = `http://127.0.0.1:${existingLock.port}`
        console.log(`Board already running at ${url}`)
        if (!headless) {
          await openUrl(url)
        }
        return { exitCode: 0 }
      }
      // Stale lock — remove it
      await clearLock(projectRoot)
    }

    trackerDb = openDb(projectRoot)
    const port = await findFreePort('127.0.0.1')

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

    await new Promise<void>((resolve, reject) => {
      server!.once('error', reject)
      server!.listen({ host: '127.0.0.1', port }, resolve)
    })

    const address = server.address() as AddressInfo
    const url = `http://${address.address}:${address.port}`

    await writeLock(projectRoot, { pid: process.pid, port: address.port })
    lockWritten = true

    console.log(`Board available at ${url}`)

    if (!headless) {
      await openUrl(url)
    }

    await waitForSigint()

    if (server?.listening) {
      await closeServer(server)
    }
    trackerDb.close()
    await clearLock(projectRoot)

    return { exitCode: 0 }
  } catch (error) {
    if (server?.listening) {
      await closeServer(server)
    }
    trackerDb?.close()

    if (lockWritten && projectRoot) {
      await clearLock(projectRoot)
    }

    if (isNoFreePortError(error)) {
      console.error('No free port available for the board server.')
      return { exitCode: 1 }
    }

    console.error(error instanceof Error ? error.message : String(error))
    return { exitCode: 1 }
  }
}

export const boardCommand: CommandDefinition = {
  name: 'board',
  handler: async ({ args }) => {
    const headless = args.includes('--headless')
    return runBoard({ headless })
  },
}
