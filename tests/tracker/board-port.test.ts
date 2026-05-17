import { createServer } from 'node:http'
import { describe, expect, it, afterEach } from 'vitest'

import { BOARD_PORTS, findFreePort } from '../../src/tracker/board-port'

let occupiedServers: ReturnType<typeof createServer>[] = []

afterEach(async () => {
  for (const server of occupiedServers) {
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
  occupiedServers = []
})

describe('R6-2.C.3 — board-port', () => {
  it('T-C.3.1: returns 7300 when no port occupied', async () => {
    const port = await findFreePort('127.0.0.1')
    expect(port).toBe(7300)
  })

  it('T-C.3.2: occupy 7300 → findFreePort returns 7301', async () => {
    const server = createServer()
    await new Promise<void>((resolve) => server.listen({ host: '127.0.0.1', port: 7300 }, resolve))
    occupiedServers.push(server)

    const port = await findFreePort('127.0.0.1')
    expect(port).toBe(7301)
  })

  it('T-C.3.3: all 7300–7309 occupied → throws no_free_port', async () => {
    const servers: ReturnType<typeof createServer>[] = []

    for (const port of BOARD_PORTS) {
      const server = createServer()
      await new Promise<void>((resolve) => server.listen({ host: '127.0.0.1', port }, resolve))
      servers.push(server)
    }

    occupiedServers.push(...servers)

    await expect(findFreePort('127.0.0.1')).rejects.toEqual({
      code: 'no_free_port',
      tried: BOARD_PORTS,
    })
  })
})
