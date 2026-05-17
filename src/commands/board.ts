import type { AddressInfo } from 'node:net'

import type { CommandDefinition } from '../runtime'
import { openDb, type TrackerDbHandle } from '../tracker/db'
import { findProjectRoot } from '../tracker/project-root'
import { createServer } from '../tracker/server'

export const deferredSpaMessage =
  'SPA not yet available — Phase 2 will add the UI. Use --headless to start the API server now.'

function waitForSigint(): Promise<void> {
  return new Promise((resolve) => {
    process.once('SIGINT', () => resolve())
  })
}

async function closeServer(server: ReturnType<typeof createServer>): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error)
      else resolve()
    })
  })
}

async function runHeadlessBoard(): Promise<{ exitCode: number }> {
  let trackerDb: TrackerDbHandle | undefined
  let server: ReturnType<typeof createServer> | undefined

  try {
    const projectRoot = findProjectRoot(process.cwd())
    trackerDb = openDb(projectRoot)
    server = createServer({ db: trackerDb.db })

    await new Promise<void>((resolve) => {
      server?.listen({ host: '127.0.0.1', port: 0 }, resolve)
    })

    const address = server.address() as AddressInfo
    console.log(`Board available at http://127.0.0.1:${address.port}`)

    await waitForSigint()
    await closeServer(server)
    trackerDb.close()

    return { exitCode: 0 }
  } catch (error) {
    if (server?.listening) {
      await closeServer(server)
    }
    trackerDb?.close()

    console.error(error instanceof Error ? error.message : String(error))
    return { exitCode: 1 }
  }
}

export const boardCommand: CommandDefinition = {
  name: 'board',
  handler: async ({ args }) => {
    if (args.includes('--headless')) {
      return runHeadlessBoard()
    }

    console.log(deferredSpaMessage)
    return { exitCode: 0 }
  },
}
