import { execFile, spawn } from 'node:child_process'
import { access, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { constants } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const workspaceRoot = resolve(__dirname, '..', '..')
const npmExecutable = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const blueprintExecutable = process.platform === 'win32' ? 'blueprint.cmd' : 'blueprint'

export interface CliExecutionResult {
  exitCode: number
  stdout: string
  stderr: string
}

export interface IsolatedTempProject {
  rootDir: string
  resolvePath(relativePath: string): string
  writeFile(relativePath: string, content: string): Promise<void>
  readFile(relativePath: string): Promise<string>
  cleanup(): Promise<void>
}

export interface PackedCliFixture extends IsolatedTempProject {
  binPath: string
  runBlueprint(args: string[], options?: { cwd?: string }): Promise<CliExecutionResult>
  runBlueprintInteractive(args: string[], input: string, options?: { cwd?: string; allowNonZeroExit?: boolean }): Promise<CliExecutionResult>
  runInstalledNodeScript(script: string, options?: { cwd?: string; allowNonZeroExit?: boolean }): Promise<CliExecutionResult>
}

export async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK)
    return true
  } catch {
    return false
  }
}

export async function createIsolatedTempProject(prefix = 'blueprint-test-'): Promise<IsolatedTempProject> {
  const rootDir = await mkdtemp(join(tmpdir(), prefix))

  return {
    rootDir,
    resolvePath(relativePath) {
      return join(rootDir, relativePath)
    },
    async writeFile(relativePath, content) {
      const destination = join(rootDir, relativePath)
      await mkdir(dirname(destination), { recursive: true })
      await writeFile(destination, content, 'utf-8')
    },
    readFile(relativePath) {
      return readFile(join(rootDir, relativePath), 'utf-8')
    },
    cleanup() {
      return rm(rootDir, { recursive: true, force: true })
    },
  }
}

export async function installPackedCliFixture(): Promise<PackedCliFixture> {
  const packDir = await mkdtemp(join(tmpdir(), 'blueprint-pack-'))
  const project = await createIsolatedTempProject('blueprint-packed-cli-')

  try {
    await runCommand(npmExecutable, ['run', 'build'], { cwd: workspaceRoot })

    const packOutput = await runCommand(npmExecutable, ['pack', '--json', workspaceRoot], {
      cwd: packDir,
    })
    const packResult = JSON.parse(packOutput.stdout) as Array<{ filename?: string }>
    const tarballName = packResult[0]?.filename

    if (!tarballName) {
      throw new Error('Failed to determine packed tarball filename.')
    }

    const tarballPath = join(packDir, tarballName)

    await runCommand(npmExecutable, ['init', '-y'], { cwd: project.rootDir })
    await runCommand(npmExecutable, ['install', tarballPath], { cwd: project.rootDir })

    const binPath = join(project.rootDir, 'node_modules', '.bin', blueprintExecutable)

    return {
      ...project,
      binPath,
      async runBlueprint(args: string[], options = {}) {
        return runCommand(binPath, args, {
          cwd: options.cwd ?? project.rootDir,
          allowNonZeroExit: true,
        })
      },
      async runBlueprintInteractive(args: string[], input: string, options = {}) {
        return runInteractiveCommand(binPath, args, input, {
          cwd: options.cwd ?? project.rootDir,
          allowNonZeroExit: options.allowNonZeroExit,
        })
      },
      async runInstalledNodeScript(script: string, options = {}) {
        return runCommand(process.execPath, ['-e', script], {
          cwd: options.cwd ?? project.rootDir,
          allowNonZeroExit: options.allowNonZeroExit,
        })
      },
      async cleanup() {
        await project.cleanup()
        await rm(packDir, { recursive: true, force: true })
      },
    }
  } catch (error) {
    await project.cleanup()
    await rm(packDir, { recursive: true, force: true })
    throw error
  }
}

async function runInteractiveCommand(
  command: string,
  args: string[],
  input: string,
  options: {
    cwd: string
    allowNonZeroExit?: boolean
  },
): Promise<CliExecutionResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: {
        ...process.env,
        NO_COLOR: '1',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    child.on('error', reject)

    child.on('close', (code) => {
      const result: CliExecutionResult = {
        exitCode: typeof code === 'number' ? code : 1,
        stdout,
        stderr,
      }

      if (result.exitCode !== 0 && !options.allowNonZeroExit) {
        reject(new Error(`Command failed with exit code ${result.exitCode}\n${stderr || stdout}`))
        return
      }

      resolve(result)
    })

    child.stdin.write(input)
    child.stdin.end()
  })
}

async function runCommand(
  command: string,
  args: string[],
  options: {
    cwd: string
    allowNonZeroExit?: boolean
  },
): Promise<CliExecutionResult> {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      cwd: options.cwd,
      env: {
        ...process.env,
        NO_COLOR: '1',
      },
      encoding: 'utf-8',
    })

    return {
      exitCode: 0,
      stdout,
      stderr,
    }
  } catch (error) {
    if (!options.allowNonZeroExit) {
      throw error
    }

    const executionError = error as {
      code?: number
      stdout?: string
      stderr?: string
    }

    return {
      exitCode: typeof executionError.code === 'number' ? executionError.code : 1,
      stdout: executionError.stdout ?? '',
      stderr: executionError.stderr ?? '',
    }
  }
}
