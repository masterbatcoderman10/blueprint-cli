import { runCli } from '../../src/index'

export interface CliResult {
  exitCode: number
  stdout: string
  stderr: string
}

export async function invokeCli(argv: string[]): Promise<CliResult> {
  const stdoutChunks: string[] = []
  const stderrChunks: string[] = []

  const originalStdoutWrite = process.stdout.write.bind(process.stdout)
  const originalStderrWrite = process.stderr.write.bind(process.stderr)

  process.stdout.write = (chunk: string | Uint8Array, ...args: unknown[]): boolean => {
    stdoutChunks.push(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString())
    return true
  }

  process.stderr.write = (chunk: string | Uint8Array, ...args: unknown[]): boolean => {
    stderrChunks.push(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString())
    return true
  }

  try {
    const exitCode = await runCli(argv)
    return {
      exitCode,
      stdout: stdoutChunks.join(''),
      stderr: stderrChunks.join(''),
    }
  } finally {
    process.stdout.write = originalStdoutWrite
    process.stderr.write = originalStderrWrite
  }
}
