import { chmod, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { discoverMarkdownFilesForMigration } from '../../../src/init/onboarding'

describe.runIf(process.platform !== 'win32')('T-A.2.4: init markdown discovery tolerates unreadable directories', () => {
  it('skips unreadable subdirectories and still returns readable markdown files', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'blueprint-init-edge-'))
    const blockedDir = join(rootDir, 'blocked')

    try {
      await mkdir(join(rootDir, 'notes'), { recursive: true })
      await mkdir(blockedDir, { recursive: true })
      await writeFile(join(rootDir, 'README.md'), '# root')
      await writeFile(join(rootDir, 'notes', 'design.md'), '# notes')
      await writeFile(join(blockedDir, 'hidden.md'), '# hidden')
      await chmod(blockedDir, 0o000)

      await expect(discoverMarkdownFilesForMigration(rootDir)).resolves.toEqual([
        join(rootDir, 'README.md'),
        join(rootDir, 'notes', 'design.md'),
      ])
    } finally {
      await chmod(blockedDir, 0o755).catch(() => undefined)
      await rm(rootDir, { recursive: true, force: true })
    }
  })
})
