import { createServer } from 'node:http'

export const BOARD_PORTS: readonly number[] = Object.freeze([7300, 7301, 7302, 7303, 7304, 7305, 7306, 7307, 7308, 7309])

export async function findFreePort(host: string): Promise<number> {
  for (const port of BOARD_PORTS) {
    const server = createServer()
    const bound = await new Promise<boolean>((resolve) => {
      server.once('error', () => resolve(false))
      server.listen({ host, port }, () => {
        server.close(() => resolve(true))
      })
    })

    if (bound) {
      return port
    }
  }

  throw { code: 'no_free_port', tried: BOARD_PORTS }
}
