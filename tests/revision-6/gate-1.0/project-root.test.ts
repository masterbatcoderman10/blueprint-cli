import { mkdtemp, mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { findProjectRoot, projectRootErrorMessage } from '../../../src/tracker/project-root'

const tempRoots: string[] = []

async function makeTempRoot(prefix: string): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), prefix))
  tempRoots.push(root)
  return root
}

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

describe('Gate R6-1.0 — project root discovery', () => {
  it('T-1.0.4.1: findProjectRoot resolves from nested project subdirectories', async () => {
    const root = await makeTempRoot('blueprint-project-root-')
    const nested = join(root, 'src', 'deep', 'child')
    await mkdir(join(root, 'docs', '.blueprint'), { recursive: true })
    await mkdir(nested, { recursive: true })

    expect(findProjectRoot(nested)).toBe(resolve(root))
  })

  it('T-1.0.4.2: findProjectRoot throws the documented actionable error outside a project', async () => {
    const root = await makeTempRoot('blueprint-not-project-')

    expect(() => findProjectRoot(root)).toThrow(projectRootErrorMessage)
    expect(projectRootErrorMessage).toBe('not in a Blueprint project — run `blueprint init` here first')
  })
})
