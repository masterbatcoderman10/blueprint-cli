import { open } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.ico': 'image/x-icon',
}

interface ServeStaticOptions {
  spaDir: string
}

export async function serveStatic(
  request: IncomingMessage,
  response: ServerResponse,
  options: ServeStaticOptions,
): Promise<boolean> {
  if (request.method !== 'GET') {
    return false
  }

  const url = new URL(request.url ?? '/', 'http://127.0.0.1')
  let pathname = url.pathname

  if (pathname === '/') {
    pathname = '/index.html'
  }

  if (!pathname.startsWith('/assets/') && pathname !== '/index.html') {
    return false
  }

  const safeRoot = resolve(options.spaDir)
  const targetPath = resolve(join(safeRoot, pathname))

  if (!targetPath.startsWith(safeRoot + '/') && targetPath !== safeRoot) {
    return false
  }

  const ext = extname(targetPath)
  const contentType = MIME_TYPES[ext] ?? 'application/octet-stream'
  const isAsset = pathname.startsWith('/assets/')

  let handle: Awaited<ReturnType<typeof open>> | undefined
  try {
    handle = await open(targetPath, 'r')
    const stats = await handle.stat()

    if (!stats.isFile()) {
      await handle.close()
      return false
    }

    const buffer = await handle.readFile()
    await handle.close()
    handle = undefined

    response.writeHead(200, {
      'content-type': contentType,
      ...(isAsset ? { 'cache-control': 'public, max-age=31536000, immutable' } : {}),
    })
    response.end(buffer)

    return true
  } catch {
    if (handle) {
      try {
        await handle.close()
      } catch {
        // ignore close errors
      }
    }
    return false
  }
}
