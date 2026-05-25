import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { join } from 'node:path'
import { mkdtemp, rm, readFile, writeFile, stat, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { writeAlignmentMarker, ALIGNMENT_MARKER } from '../../../src/init/archive-engine'
import type { AgentFileName } from '../../../src/init/types'

const MARKER_LINE = '<!-- blueprint-status: alignment-required -->'

async function createTempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'blueprint-stream-d-marker-'))
}

async function cleanupDir(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true })
}

async function fileExists(path: string): Promise<boolean> {
  try {
    const s = await stat(path)
    return s.isFile()
  } catch {
    return false
  }
}

describe('T-R11-1.D.3 — Post-scaffold alignment marker writer', () => {
  let tmpDir: string

  beforeEach(async () => {
    tmpDir = await createTempDir()
  })

  afterEach(async () => {
    await cleanupDir(tmpDir)
  })

  describe('T-R11-1.D.3.1: marker appended to every entry-point file exactly once', () => {
    it('appends marker to all present agent entry-point files', async () => {
      // Create mock agent entry-point files
      const agentFiles: AgentFileName[] = ['CLAUDE.md', 'AGENTS.md', 'GEMINI.md', 'QWEN.md']
      for (const fileName of agentFiles) {
        await writeFile(join(tmpDir, fileName), `# ${fileName}\nSome content\n`, 'utf-8')
      }

      await writeAlignmentMarker(tmpDir, agentFiles)

      for (const fileName of agentFiles) {
        const content = await readFile(join(tmpDir, fileName), 'utf-8')
        expect(content).toContain(MARKER_LINE)

        // Marker should appear exactly once
        const count = content.split(MARKER_LINE).length - 1
        expect(count).toBe(1)
      }
    })

    it('works in skill mode context (marker on skill-mode stubs)', async () => {
      // Simulate skill-mode stub content
      await writeFile(join(tmpDir, 'CLAUDE.md'), 'Invoke the blueprint skill at session start.\n', 'utf-8')

      await writeAlignmentMarker(tmpDir, ['CLAUDE.md'])

      const content = await readFile(join(tmpDir, 'CLAUDE.md'), 'utf-8')
      expect(content).toContain(MARKER_LINE)
      const count = content.split(MARKER_LINE).length - 1
      expect(count).toBe(1)
    })

    it('works in legacy mode context (marker on full agent templates)', async () => {
      // Simulate legacy full agent template
      await writeFile(
        join(tmpDir, 'CLAUDE.md'),
        '# AGENTS.md\n\n<Blueprint>\n  Full content here\n</Blueprint>\n',
        'utf-8',
      )

      await writeAlignmentMarker(tmpDir, ['CLAUDE.md'])

      const content = await readFile(join(tmpDir, 'CLAUDE.md'), 'utf-8')
      expect(content).toContain(MARKER_LINE)
      const count = content.split(MARKER_LINE).length - 1
      expect(count).toBe(1)
    })

    it('skips files that do not exist at the target root', async () => {
      // Only create CLAUDE.md, not the others
      await writeFile(join(tmpDir, 'CLAUDE.md'), 'content\n', 'utf-8')

      await writeAlignmentMarker(tmpDir, ['CLAUDE.md', 'AGENTS.md', 'GEMINI.md', 'QWEN.md'])

      // Only CLAUDE.md should have the marker
      expect(await readFile(join(tmpDir, 'CLAUDE.md'), 'utf-8')).toContain(MARKER_LINE)
      expect(await fileExists(join(tmpDir, 'AGENTS.md'))).toBe(false)
    })
  })

  describe('T-R11-1.D.3.2: idempotent — re-run does not duplicate marker', () => {
    it('running writeAlignmentMarker twice produces single marker per file', async () => {
      await writeFile(join(tmpDir, 'CLAUDE.md'), 'content\n', 'utf-8')

      await writeAlignmentMarker(tmpDir, ['CLAUDE.md'])
      await writeAlignmentMarker(tmpDir, ['CLAUDE.md'])

      const content = await readFile(join(tmpDir, 'CLAUDE.md'), 'utf-8')
      const count = content.split(MARKER_LINE).length - 1
      expect(count).toBe(1)
    })

    it('marker is not duplicated when file already contains marker before first call', async () => {
      // Pre-populate with marker
      await writeFile(join(tmpDir, 'CLAUDE.md'), `content\n${MARKER_LINE}\n`, 'utf-8')

      await writeAlignmentMarker(tmpDir, ['CLAUDE.md'])

      const content = await readFile(join(tmpDir, 'CLAUDE.md'), 'utf-8')
      const count = content.split(MARKER_LINE).length - 1
      expect(count).toBe(1)
    })

    it('third run is still idempotent', async () => {
      await writeFile(join(tmpDir, 'AGENTS.md'), 'more content\n', 'utf-8')

      await writeAlignmentMarker(tmpDir, ['AGENTS.md'])
      await writeAlignmentMarker(tmpDir, ['AGENTS.md'])
      await writeAlignmentMarker(tmpDir, ['AGENTS.md'])

      const content = await readFile(join(tmpDir, 'AGENTS.md'), 'utf-8')
      const count = content.split(MARKER_LINE).length - 1
      expect(count).toBe(1)
    })
  })
})
