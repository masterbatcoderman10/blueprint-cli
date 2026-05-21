import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { getGitCommonDir, getWorktreeRoot, NoGitContextError, requireGitContext } from '../../../src/tracker/git-context'

const packageRoot = process.cwd()

function makeTempDir(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix))
}

describe('R9-2.0.1 — git-context helpers', () => {
  it('T-R9-2.0.1.1: getGitCommonDir resolves the canonical git common dir for a repo root', () => {
    const result = getGitCommonDir(packageRoot)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.path).toBeTruthy()
    expect(result.path).toBe(resolve(result.path))
  })

  it('T-R9-2.0.1.2: getGitCommonDir from a peer worktree returns the same absolute path as from the main worktree', () => {
    const mainResult = getGitCommonDir(packageRoot)
    const repoRoot = getWorktreeRoot(packageRoot)
    if (!repoRoot.ok) throw new Error('expected repo root')

    // Peer worktree may be nested under the repo root or a sibling of the current worktree
    const candidatePaths = [
      join(repoRoot.path, 'worktrees', 'r9-2-stream-b'),
      resolve(repoRoot.path, '..', 'r9-2-stream-b'),
    ]
    const peerWorktree = candidatePaths.find((p) => {
      try {
        return require('node:fs').existsSync(p)
      } catch {
        return false
      }
    })
    if (!peerWorktree) {
      console.log('Skipping peer-worktree test: no r9-2-stream-b worktree found')
      return
    }

    const peerResult = getGitCommonDir(peerWorktree)

    expect(mainResult.ok).toBe(true)
    expect(peerResult.ok).toBe(true)
    if (!mainResult.ok || !peerResult.ok) return

    expect(peerResult.path).toBe(mainResult.path)
    expect(peerResult.path).toBe(resolve(peerResult.path))
  })

  it("T-R9-2.0.1.3: getGitCommonDir outside any git repo returns { ok: false, code: 'no_git' }", () => {
    const outsideDir = makeTempDir('blueprint-no-git-')
    try {
      const result = getGitCommonDir(outsideDir)
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.code).toBe('no_git')
    } finally {
      rmSync(outsideDir, { recursive: true, force: true })
    }
  })

  it('T-R9-2.0.1.4: getWorktreeRoot returns absolute worktree top', () => {
    const result = getWorktreeRoot(packageRoot)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.path).toBe(resolve(packageRoot))
  })
})

describe('R9-2.0.4 — requireGitContext guard', () => {
  it('T-R9-2.0.4.1: requireGitContext returns { commonDir, worktreeRoot } inside repo', () => {
    const result = requireGitContext(packageRoot)
    expect(result.commonDir).toBeTruthy()
    expect(result.worktreeRoot).toBeTruthy()
    expect(result.commonDir).toBe(resolve(result.commonDir))
    expect(result.worktreeRoot).toBe(resolve(result.worktreeRoot))
  })

  it("T-R9-2.0.4.2: outside git, each conceptual subcommand surfaces the same NoGitContextError message", () => {
    const outsideDir = makeTempDir('blueprint-no-git-')
    try {
      const messages: string[] = []
      const errors: unknown[] = []

      for (const verb of ['start', 'stop', 'status'] as const) {
        try {
          requireGitContext(outsideDir)
        } catch (error) {
          errors.push(error)
          messages.push(error instanceof Error ? error.message : String(error))
        }
      }

      expect(errors).toHaveLength(3)
      expect(errors[0]).toBeInstanceOf(NoGitContextError)
      expect(errors[1]).toBeInstanceOf(NoGitContextError)
      expect(errors[2]).toBeInstanceOf(NoGitContextError)
      expect(messages[0]).toBe(messages[1])
      expect(messages[1]).toBe(messages[2])
    } finally {
      rmSync(outsideDir, { recursive: true, force: true })
    }
  })
})
