import { describe, expect, it, vi } from 'vitest'

import { openUrl } from '../../src/tracker/browser-open'

const spawnMock = vi.hoisted(() => vi.fn())

vi.mock('node:child_process', () => ({
  spawn: spawnMock,
}))

describe('R6-2.C.2 — browser-open', () => {
  it('T-C.2.1: on darwin dispatches spawn("open", [url], …)', async () => {
    Object.defineProperty(process, 'platform', { value: 'darwin' })
    spawnMock.mockReturnValue({ unref: vi.fn() })

    await openUrl('http://127.0.0.1:7300')

    expect(spawnMock).toHaveBeenCalledOnce()
    expect(spawnMock).toHaveBeenCalledWith('open', ['http://127.0.0.1:7300'], { detached: true })
  })

  it('T-C.2.2: on linux dispatches xdg-open; on win32 dispatches start "" url', async () => {
    Object.defineProperty(process, 'platform', { value: 'linux' })
    spawnMock.mockReturnValue({ unref: vi.fn() })

    await openUrl('http://127.0.0.1:7300')

    expect(spawnMock).toHaveBeenCalledWith('xdg-open', ['http://127.0.0.1:7300'], { detached: true })

    spawnMock.mockClear()
    Object.defineProperty(process, 'platform', { value: 'win32' })

    await openUrl('http://127.0.0.1:7300')

    expect(spawnMock).toHaveBeenCalledWith('cmd', ['/c', 'start', '""', 'http://127.0.0.1:7300'], { detached: true, windowsHide: true })
  })

  it('T-C.2.3: spawn failure is non-fatal; resolves without throwing and logs once', async () => {
    Object.defineProperty(process, 'platform', { value: 'darwin' })
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    spawnMock.mockImplementation(() => {
      throw new Error('spawn ENOENT')
    })

    await expect(openUrl('http://127.0.0.1:7300')).resolves.toBeUndefined()

    expect(consoleSpy).toHaveBeenCalledOnce()
    expect(consoleSpy.mock.calls[0][0]).toContain('spawn ENOENT')

    consoleSpy.mockRestore()
  })
})
