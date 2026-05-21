import { execSync } from 'node:child_process'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const packageRoot = process.cwd()
const require = createRequire(import.meta.url)
const tsxPath = join(require.resolve('tsx/package.json'), '..', 'dist', 'cli.mjs')
const srcIndexPath = join(packageRoot, 'src/index.ts')

function createTempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  mkdirSync(join(dir, 'docs', '.blueprint'), { recursive: true })
  execSync('git init', { cwd: dir, stdio: 'ignore' })
  execSync('git config user.email "test@example.com"', { cwd: dir, stdio: 'ignore' })
  execSync('git config user.name "Test User"', { cwd: dir, stdio: 'ignore' })
  writeFileSync(join(dir, 'init.txt'), 'init', 'utf8')
  execSync('git add init.txt', { cwd: dir, stdio: 'ignore' })
  execSync('git commit -m "init"', { cwd: dir, stdio: 'ignore' })
  return dir
}

describe('debug integration', () => {
  it('should return 1 for unknown subcommand via spawn', async () => {
    const projectRoot = createTempDir('blueprint-board-')
    try {
      let stderr = ''
      let stdout = ''
      try {
        execSync(`node ${tsxPath} ${srcIndexPath} board unknown`, {
          cwd: projectRoot,
          env: { ...process.env, NODE_NO_WARNINGS: '1' },
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe'],
        })
      } catch (error: any) {
        stderr = error.stderr || ''
        stdout = error.stdout || ''
        expect(error.status).toBe(1)
      }
      console.log('STDOUT:', stdout)
      console.log('STDERR:', stderr)
      expect(stderr + stdout).toContain('Usage')
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })
})
