import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const commandRegisterMock = vi.hoisted(() => vi.fn())
const commandDispatchMock = vi.hoisted(() => vi.fn())
const detectProjectModeMock = vi.hoisted(() => vi.fn())
const findProjectRootMock = vi.hoisted(() => vi.fn())
const createCommandRuntimeMock = vi.hoisted(() => vi.fn())

vi.mock('../../../src/runtime', () => ({
  createCommandRuntime: createCommandRuntimeMock.mockImplementation(() => ({
    register: commandRegisterMock,
    dispatch: commandDispatchMock,
  })),
}))

vi.mock('../../../src/doctor/structure', () => ({
  detectProjectMode: detectProjectModeMock,
}))

vi.mock('../../../src/tracker/project-root', () => ({
  findProjectRoot: findProjectRootMock,
  projectRootErrorMessage: 'not in a Blueprint project — run `blueprint init` here first',
}))

import { runCli } from '../../../src/index'
import * as commandHelpModule from '../../../src/help/command'
import * as deprecationBanner from '../../../src/runtime/deprecation-banner'

describe('R11-3.0.4 runCli deprecation-banner gate', () => {
  const originalEnvValue = process.env.BLUEPRINT_SUPPRESS_DEPRECATION
  const originalParseCommandHelpInvocation = commandHelpModule.parseCommandHelpInvocation
  let parseSpy: ReturnType<typeof vi.spyOn>
  let emitSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    deprecationBanner.__resetDeprecationBannerForTesting()
    detectProjectModeMock.mockReset()
    findProjectRootMock.mockReset()
    commandDispatchMock.mockReset()
    commandRegisterMock.mockReset()
    commandDispatchMock.mockResolvedValue({
      matched: false,
      commandName: 'default',
      exitCode: 0,
      reason: 'unknown-command',
    })
    createCommandRuntimeMock.mockImplementation(() => ({
      register: commandRegisterMock,
      dispatch: commandDispatchMock,
    }))
    parseSpy = vi.spyOn(commandHelpModule, 'parseCommandHelpInvocation')
    parseSpy.mockImplementation((argv) => {
      return originalParseCommandHelpInvocation(argv)
    })
    emitSpy = vi.spyOn(deprecationBanner, 'emitDeprecationBanner')
    process.env.BLUEPRINT_SUPPRESS_DEPRECATION = '0'
    findProjectRootMock.mockReturnValue('/blueprint/project')
    detectProjectModeMock.mockResolvedValue({ mode: 'legacy' })
  })

  afterEach(() => {
    parseSpy?.mockRestore()
    emitSpy?.mockRestore()
    process.env.BLUEPRINT_SUPPRESS_DEPRECATION = originalEnvValue
    vi.clearAllMocks()
  })

  it('T-R11-3.0.4.1: emits for legacy non-root-help invocations and does so before parse/dispatch', async () => {
    const cases = [['--version'], ['doctor'], ['init', '--help']]
    for (const argv of cases) {
      const trace: string[] = []
      const seenArgvs: string[][] = []
      parseSpy.mockImplementation((inputArgv) => {
        trace.push('parse')
        return originalParseCommandHelpInvocation(inputArgv)
      })
      commandDispatchMock.mockImplementation(async (inputArgv) => {
        trace.push('dispatch')
        seenArgvs.push([...inputArgv])
        return {
          matched: false,
          exitCode: 1,
          reason: 'unknown-command',
        }
      })
      emitSpy.mockImplementation(() => {
        trace.push('emit')
      })
      await runCli(argv)

      expect(emitSpy).toHaveBeenCalledTimes(1)
      if (argv.length > 0 && argv[0] === 'init' && argv[1] === '--help') {
        expect(trace).toEqual(['emit', 'parse'])
        expect(seenArgvs).toHaveLength(0)
      } else {
        expect(trace).toEqual(['emit', 'parse', 'dispatch'])
        expect(seenArgvs).toEqual([argv])
      }

      commandDispatchMock.mockClear()
      parseSpy.mockClear()
      emitSpy.mockClear()
      detectProjectModeMock.mockResolvedValue({ mode: 'legacy' })
    }
  })

  it('T-R11-3.0.4.2: suppresses banner and strips flag for legacy invocations', async () => {
    const cases = [['--no-deprecation-banner', 'init'], ['init', '--no-deprecation-banner']]
    for (const argv of cases) {
      const seenArgvs: string[][] = []
      commandDispatchMock.mockImplementation(async (inputArgv) => {
        seenArgvs.push([...inputArgv])
        return {
          matched: false,
          exitCode: 1,
          reason: 'unknown-command',
        }
      })
      await runCli(argv)
      expect(emitSpy).not.toHaveBeenCalled()
      expect(seenArgvs).toEqual([['init']])
      commandDispatchMock.mockClear()
      emitSpy.mockClear()
      parseSpy.mockClear()
    }
  })

  it('T-R11-3.0.4.3: skips banner for skill mode, unknown cwd, root-help, and env suppression', async () => {
    const argvRootHelp = ['--help']
    commandDispatchMock.mockResolvedValue({
      matched: true,
      commandName: undefined,
      exitCode: 0,
      reason: 'root-help',
    })

    detectProjectModeMock.mockResolvedValue({ mode: 'skill', skillBase: '.claude/skills/blueprint' })
    await runCli(['doctor'])
    commandDispatchMock.mockClear()
    parseSpy.mockClear()
    emitSpy.mockClear()
    expect(emitSpy).not.toHaveBeenCalled()

    detectProjectModeMock.mockResolvedValue({ mode: 'legacy' })
    findProjectRootMock.mockImplementation(() => {
      throw new Error('not in a Blueprint project')
    })
    await runCli(['doctor'])
    expect(emitSpy).not.toHaveBeenCalled()

    commandDispatchMock.mockClear()
    parseSpy.mockClear()
    emitSpy.mockClear()
    findProjectRootMock.mockReturnValue('/blueprint/project')
    await runCli(argvRootHelp)
    expect(emitSpy).not.toHaveBeenCalled()

    commandDispatchMock.mockClear()
    parseSpy.mockClear()
    emitSpy.mockClear()
    process.env.BLUEPRINT_SUPPRESS_DEPRECATION = '1'
    await runCli(['doctor'])
    expect(emitSpy).not.toHaveBeenCalled()
  })
})
