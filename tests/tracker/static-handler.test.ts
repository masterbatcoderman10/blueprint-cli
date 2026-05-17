import { describe, expect, it } from 'vitest'

import { serveStatic } from '../../src/tracker/static-handler'

const spaDir = new URL('./fixtures/spa', import.meta.url).pathname

function makeRequest(url: string): { method: string; url: string } {
  return { method: 'GET', url }
}

function makeResponse(): {
  statusCode: number
  headers: Record<string, string | number | string[]>
  body: string
  writeHead(code: number, headers?: Record<string, string | number | string[]>): void
  end(data?: string): void
} {
  const res = {
    statusCode: 0,
    headers: {} as Record<string, string | number | string[]>,
    body: '',
    writeHead(code: number, headers?: Record<string, string | number | string[]>) {
      this.statusCode = code
      if (headers) {
        this.headers = { ...headers }
      }
    },
    end(data?: string | Buffer) {
      this.body = data ? Buffer.isBuffer(data) ? data.toString('utf8') : data : ''
    },
  }
  return res
}

describe('R6-2.C.1 — static-handler', () => {
  it('T-C.1.1: GET / returns 200 + text/html and index.html body', async () => {
    const req = makeRequest('/')
    const res = makeResponse()
    const handled = await serveStatic(req as never, res as never, { spaDir })

    expect(handled).toBe(true)
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toBe('text/html')
    expect(res.body).toContain('<title>Board</title>')
  })

  it('T-C.1.2: GET /assets/<hash>.js returns 200 + correct MIME + immutable cache header', async () => {
    const req = makeRequest('/assets/main-abc123.js')
    const res = makeResponse()
    const handled = await serveStatic(req as never, res as never, { spaDir })

    expect(handled).toBe(true)
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toBe('application/javascript')
    expect(res.headers['cache-control']).toBe('public, max-age=31536000, immutable')
    expect(res.body).toContain("console.log('hello')")
  })

  it('T-C.1.3: GET /tasks returns false (falls through)', async () => {
    const req = makeRequest('/tasks')
    const res = makeResponse()
    const handled = await serveStatic(req as never, res as never, { spaDir })

    expect(handled).toBe(false)
    expect(res.statusCode).toBe(0)
  })

  it('T-C.1.4: path traversal is rejected', async () => {
    const req = makeRequest('/assets/../../etc/passwd')
    const res = makeResponse()
    const handled = await serveStatic(req as never, res as never, { spaDir })

    expect(handled).toBe(false)
  })
})
