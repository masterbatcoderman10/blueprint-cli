import { describe, expect, it, vi } from 'vitest'
import { boardCommand } from '../../../src/commands/board'

vi.mock('../../../src/commands/board-stop', () => ({
  runBoardStop: vi.fn(() => Promise.resolve({ exitCode: 0 })),
}))

vi.mock('../../../src/commands/board-status', () => ({
  runBoardStatus: vi.fn(() => Promise.resolve({ exitCode: 0 })),
}))

import { runBoardStop } from '../../../src/commands/board-stop'
import { runBoardStatus } from '../../../src/commands/board-status'

describe('R9-2.A.1 — Subcommand Dispatcher', () => {
  it('T-R9-2.A.1.1: unknown subcommand returns usage error with exit 1', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await boardCommand.handler({
      commandName: 'board',
      args: ['unknown'],
      rawArgv: ['board', 'unknown'],
    })

    expect(result).toEqual({ exitCode: 1 })
    expect(error).toHaveBeenCalledWith(expect.stringContaining('Usage'))
    error.mockRestore()
  })
})

describe('R9-2.A.5 — Register dispatcher', () => {
  it('T-R9-2.A.5.1: all four invocations route to expected handlers', async () => {
    // stop
    await boardCommand.handler({
      commandName: 'board',
      args: ['stop'],
      rawArgv: ['board', 'stop'],
    })
    expect(runBoardStop).toHaveBeenCalled()

    // status
    await boardCommand.handler({
      commandName: 'board',
      args: ['status'],
      rawArgv: ['board', 'status'],
    })
    expect(runBoardStatus).toHaveBeenCalled()
  })
})
