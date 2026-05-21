import { execSync } from 'node:child_process'
import { resolve } from 'node:path'

export type GitResult = { ok: true; path: string } | { ok: false; code: 'no_git' }

export function getGitCommonDir(cwd: string): GitResult {
  try {
    const raw = execSync('git rev-parse --git-common-dir', {
      cwd,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim()

    const path = raw.startsWith('/') ? raw : resolve(cwd, raw)
    return { ok: true, path }
  } catch {
    return { ok: false, code: 'no_git' }
  }
}

export function getWorktreeRoot(cwd: string): GitResult {
  try {
    const path = execSync('git rev-parse --show-toplevel', {
      cwd,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim()

    return { ok: true, path }
  } catch {
    return { ok: false, code: 'no_git' }
  }
}

export const noGitContextMessage = 'This command must be run inside a git repository.'

export class NoGitContextError extends Error {
  constructor() {
    super(noGitContextMessage)
    this.name = 'NoGitContextError'
  }
}

export function requireGitContext(cwd: string): { commonDir: string; worktreeRoot: string } {
  const commonResult = getGitCommonDir(cwd)
  if (!commonResult.ok) {
    throw new NoGitContextError()
  }

  const worktreeResult = getWorktreeRoot(cwd)
  if (!worktreeResult.ok) {
    throw new NoGitContextError()
  }

  return { commonDir: commonResult.path, worktreeRoot: worktreeResult.path }
}
