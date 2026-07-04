import { afterEach, describe, expect, it, vi } from 'vitest'

const promisifyCustom = Symbol.for('nodejs.util.promisify.custom')
const mockedPackLocks = new Map<string, number>()

function isMockedPackLockPath(path: unknown): boolean {
  const normalizedPath = String(path)
  return normalizedPath.includes('blueprint-pack-') && normalizedPath.endsWith('.lock')
}

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>()

  return {
    ...actual,
    mkdirSync(path: Parameters<typeof actual.mkdirSync>[0], options?: Parameters<typeof actual.mkdirSync>[1]) {
      if (isMockedPackLockPath(path)) {
        if (mockedPackLocks.has(String(path))) {
          const error = new Error(`EEXIST: file already exists, mkdir '${String(path)}'`) as Error & { code?: string }
          error.code = 'EEXIST'
          throw error
        }

        mockedPackLocks.set(String(path), Date.now())
        return undefined
      }

      return actual.mkdirSync(path, options)
    },
    rmSync(path: Parameters<typeof actual.rmSync>[0], options?: Parameters<typeof actual.rmSync>[1]) {
      if (isMockedPackLockPath(path)) {
        mockedPackLocks.delete(String(path))
        return undefined
      }

      return actual.rmSync(path, options)
    },
    statSync(path: Parameters<typeof actual.statSync>[0], options?: Parameters<typeof actual.statSync>[1]) {
      if (isMockedPackLockPath(path)) {
        return { mtimeMs: mockedPackLocks.get(String(path)) ?? Date.now() } as ReturnType<typeof actual.statSync>
      }

      return actual.statSync(path, options)
    },
    existsSync(path: Parameters<typeof actual.existsSync>[0]) {
      if (String(path).includes('better-sqlite3/build')) {
        return false
      }

      return actual.existsSync(path)
    },
  }
})

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>()

  return {
    ...actual,
    async mkdir(path: Parameters<typeof actual.mkdir>[0], options?: Parameters<typeof actual.mkdir>[1]) {
      if (isMockedPackLockPath(path)) {
        if (mockedPackLocks.has(String(path))) {
          const error = new Error(`EEXIST: file already exists, mkdir '${String(path)}'`) as Error & { code?: string }
          error.code = 'EEXIST'
          throw error
        }

        mockedPackLocks.set(String(path), Date.now())
        return undefined
      }

      return actual.mkdir(path, options)
    },
    async rm(path: Parameters<typeof actual.rm>[0], options?: Parameters<typeof actual.rm>[1]) {
      if (isMockedPackLockPath(path)) {
        mockedPackLocks.delete(String(path))
        return
      }

      return actual.rm(path, options)
    },
    async stat(path: Parameters<typeof actual.stat>[0], options?: Parameters<typeof actual.stat>[1]) {
      if (isMockedPackLockPath(path)) {
        return { mtimeMs: mockedPackLocks.get(String(path)) ?? Date.now() } as Awaited<ReturnType<typeof actual.stat>>
      }

      return actual.stat(path, options)
    },
  }
})

vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>()

  function execFileMock(
    _command: string,
    args: readonly string[],
    optionsOrCallback: unknown,
    maybeCallback?: (error: Error | null, stdout: string, stderr: string) => void,
  ): void {
    const callback =
      typeof optionsOrCallback === 'function'
        ? (optionsOrCallback as (error: Error | null, stdout: string, stderr: string) => void)
        : maybeCallback

    const subcommand = args[0]
    const delayMs = subcommand === 'pack' ? 10 : subcommand === 'init' || subcommand === 'install' ? 120 : 0
    const stdout = subcommand === 'pack' ? '[{"filename":"fixture.tgz"}]' : ''

    setTimeout(() => {
      callback?.(null, stdout, '')
    }, delayMs)
  }

  ;(execFileMock as typeof actual.execFile & { [promisifyCustom]?: unknown })[promisifyCustom] = (
    command: string,
    args: readonly string[],
    options: unknown,
  ) =>
    new Promise<{ stdout: string; stderr: string }>((resolve) => {
      execFileMock(command, args, options, (_error, stdout, stderr) => {
        resolve({ stdout, stderr })
      })
    })

  return {
    ...actual,
    execFile: execFileMock as typeof actual.execFile,
  }
})

afterEach(() => {
  mockedPackLocks.clear()
  vi.resetModules()
})

describe('release helper locking', () => {
  it('releases shared pack lock immediately after packing so isolated fixture installs can overlap', async () => {
    const { installPackedCliFixture } = await import('./release')

    const startedAt = Date.now()
    const [firstFixture, secondFixture] = await Promise.all([installPackedCliFixture(), installPackedCliFixture()])
    const elapsedMs = Date.now() - startedAt

    await Promise.all([firstFixture.cleanup(), secondFixture.cleanup()])

    expect(elapsedMs).toBeLessThan(350)
  })
})
