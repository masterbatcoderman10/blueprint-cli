import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { ensureSpaBuild, hasSpaBuild } from './ensure-spa-build'

async function writeSpaOutput(rootDir: string): Promise<void> {
  const spaDir = join(rootDir, 'dist', 'spa')
  await mkdir(join(spaDir, 'assets'), { recursive: true })
  await writeFile(join(spaDir, 'index.html'), '<div id="app"></div>', 'utf-8')
  await writeFile(join(spaDir, 'assets', 'main-test.js'), 'console.log("ok")', 'utf-8')
}

describe('ensureSpaBuild', () => {
  it('serializes concurrent callers so one shared build prepares dist/spa once', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'blueprint-spa-build-'))
    let buildCalls = 0

    try {
      await Promise.all([
        ensureSpaBuild({
          rootDir,
          build: async () => {
            buildCalls += 1
            await new Promise((resolve) => setTimeout(resolve, 75))
            await writeSpaOutput(rootDir)
          },
        }),
        ensureSpaBuild({
          rootDir,
          build: async () => {
            buildCalls += 1
            await new Promise((resolve) => setTimeout(resolve, 75))
            await writeSpaOutput(rootDir)
          },
        }),
        ensureSpaBuild({
          rootDir,
          build: async () => {
            buildCalls += 1
            await new Promise((resolve) => setTimeout(resolve, 75))
            await writeSpaOutput(rootDir)
          },
        }),
      ])

      expect(buildCalls).toBe(1)
      expect(hasSpaBuild(join(rootDir, 'dist', 'spa'))).toBe(true)
    } finally {
      await rm(rootDir, { recursive: true, force: true })
    }
  })
})
