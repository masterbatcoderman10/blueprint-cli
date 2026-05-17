import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { boardCommand, deferredSpaMessage } from '../../src/commands/board'
import { runCli } from '../../src/index'
import { projectRootErrorMessage } from '../../src/tracker/project-root'

const tempDirs: string[] = []
const initialSigintListeners = new Set(process.listeners('SIGINT'))

function createTempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  tempDirs.push(dir)
  return dir
}

async function flush(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
}

afterEach(() => {
  vi.restoreAllMocks()
  for (const listener of process.listeners('SIGINT')) {
    if (!initialSigintListeners.has(listener)) {
      process.removeListener('SIGINT', listener)
    }
  }

  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('Stream C — board command', () => {
  it('T-C.2.2: default invocation prints the deferred SPA message and exits 0', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})

    const result = await boardCommand.handler({ commandName: 'board', args: [], rawArgv: ['board'] })

    expect(result).toEqual({ exitCode: 0 })
    expect(log).toHaveBeenCalledWith(deferredSpaMessage)
  })

  it('T-C.2.1: --headless boots, logs a dynamic port, and exits cleanly on SIGINT', async () => {
    const projectRoot = createTempDir('blueprint-board-')
    mkdirSync(join(projectRoot, 'docs', '.blueprint'), { recursive: true })
    vi.spyOn(process, 'cwd').mockReturnValue(projectRoot)
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})

    const run = boardCommand.handler({
      commandName: 'board',
      args: ['--headless'],
      rawArgv: ['board', '--headless'],
    })
    await vi.waitFor(() => {
      expect(log).toHaveBeenCalledWith(expect.stringMatching(/^Board available at http:\/\/127\.0\.0\.1:\d+$/))
    })

    process.emit('SIGINT', 'SIGINT')
    await expect(run).resolves.toEqual({ exitCode: 0 })
  })

  it('T-C.2.3: --headless outside a Blueprint project surfaces the project-root error', async () => {
    const outsideProject = createTempDir('blueprint-outside-')
    vi.spyOn(process, 'cwd').mockReturnValue(outsideProject)
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await boardCommand.handler({
      commandName: 'board',
      args: ['--headless'],
      rawArgv: ['board', '--headless'],
    })

    expect(result).toEqual({ exitCode: 1 })
    expect(error).toHaveBeenCalledWith(projectRootErrorMessage)
    expect(existsSync(join(outsideProject, 'docs', '.blueprint', 'tasks.db'))).toBe(false)
  })

  it('T-C.3.1: runCli dispatch reaches the registered board handler', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})

    const exitCode = await runCli(['board'])

    expect(exitCode).toBe(0)
    expect(log).toHaveBeenCalledWith(deferredSpaMessage)
  })

  it('T-C.3.1: runtime dispatch can invoke the board command definition directly', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})

    const result = await boardCommand.handler({ commandName: 'board', args: [], rawArgv: ['board'] })
    await flush()

    expect(result).toEqual({ exitCode: 0 })
    expect(log).toHaveBeenCalledWith(deferredSpaMessage)
  })
})
