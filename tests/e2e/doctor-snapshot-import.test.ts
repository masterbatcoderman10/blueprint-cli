import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it } from 'vitest'

import { spawn } from 'node:child_process'

import { openDb } from '../../src/tracker/db'
import { runDoctorAudit } from '../../src/doctor/audit'
import { createRepairPlan } from '../../src/doctor/repair'
import { executeRepairs } from '../../src/doctor/executor'
import { importSnapshot, type TrackerSnapshot } from '../../src/tracker/export'

const packageRoot = process.cwd()
const tsxPath = join(packageRoot, 'node_modules', '.bin', 'tsx')
const srcIndexPath = join(packageRoot, 'src', 'index.ts')

const tempDirs: string[] = []
const spawnedProcs: ReturnType<typeof spawn>[] = []

function createTempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  tempDirs.push(dir)
  return dir
}

/**
 * Create a minimal Blueprint project structure with a pre-P5 snapshot.
 * Pre-P5 snapshots have tasks WITHOUT a `milestone` field.
 */
function seedPreP5SnapshotProject(projectRoot: string): void {
  mkdirSync(join(projectRoot, 'docs', '.blueprint'), { recursive: true })
  mkdirSync(join(projectRoot, 'docs', 'core'), { recursive: true })
  mkdirSync(join(projectRoot, 'docs', 'milestones'), { recursive: true })

  // Create minimal project-progress.md so Doctor can seed project_meta
  writeFileSync(
    join(projectRoot, 'docs', 'project-progress.md'),
    `# Project Progress\n\n**Project**: E2E Doctor Test\n**Tagline**: Testing Doctor snapshot import\n`,
    'utf-8',
  )

  // Create a pre-P5 snapshot — tasks WITHOUT milestone field
  const now = Date.now()
  const snapshot: TrackerSnapshot = {
    tasks: [
      {
        id: 'R6-3.A.1',
        title: 'Draft tracker schema',
        description: 'Write tracker schema doc.',
        state: 'DONE',
        phase: 'R6-3',
        stream: 'A',
        author: 'agent',
        implementation_notes: null,
        milestone: '', // pre-P5: will be backfilled
        created_at: now - 10000,
        updated_at: now - 5000,
      },
      {
        id: 'R6-4.B.2',
        title: 'Implement migration runner',
        description: 'Write migration logic.',
        state: 'DONE',
        phase: 'R6-4',
        stream: 'B',
        author: 'agent',
        implementation_notes: null,
        milestone: '', // pre-P5: will be backfilled
        created_at: now - 8000,
        updated_at: now - 3000,
      },
      {
        id: 'R6-5.0.1',
        title: 'Update MAS-204 in SRS',
        description: 'Add milestone to schema docs.',
        state: 'TO-DO',
        phase: 'R6-5',
        stream: '0',
        author: null,
        implementation_notes: null,
        milestone: '', // pre-P5: will be backfilled
        created_at: now,
        updated_at: now,
      },
    ],
    comments: [],
    meta: {
      id: 1,
      name: 'E2E Doctor Test',
      tagline: 'Testing Doctor snapshot import',
      phase_count: null,
      stream_count: null,
      created_at: now,
      updated_at: now,
    },
  }

  writeFileSync(
    join(projectRoot, 'docs', '.blueprint', 'tasks.export.json'),
    JSON.stringify(snapshot, null, 2),
    'utf-8',
  )
}

function spawnBoard(cwd: string, args: string[] = []): ReturnType<typeof spawn> {
  const proc = spawn(tsxPath, [srcIndexPath, 'board', ...args], {
    cwd,
    env: { ...process.env, NODE_NO_WARNINGS: '1' },
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  proc.on('error', () => {
    // Swallow spawn errors.
  })
  spawnedProcs.push(proc)
  return proc
}

async function waitForOutput(
  proc: ReturnType<typeof spawn>,
  pattern: RegExp,
  timeoutMs = 8000,
): Promise<RegExpMatchArray> {
  let output = ''
  proc.stdout?.on('data', (data: Buffer) => {
    output += data.toString()
  })
  proc.stderr?.on('data', (data: Buffer) => {
    output += data.toString()
  })

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timeout waiting for pattern ${pattern}. Output: ${output}`))
    }, timeoutMs)

    const interval = setInterval(() => {
      const match = output.match(pattern)
      if (match) {
        clearTimeout(timeout)
        clearInterval(interval)
        resolve(match)
      }
    }, 50)
  })
}

async function killProc(proc: ReturnType<typeof spawn>): Promise<number> {
  if (proc.killed || proc.exitCode !== null) {
    return proc.exitCode ?? 0
  }
  return new Promise((resolve) => {
    proc.on('exit', (code) => resolve(code ?? 0))
    proc.kill('SIGINT')
  })
}

afterEach(async () => {
  const procs = spawnedProcs.splice(0)
  await Promise.all(
    procs.map(
      (proc) =>
        new Promise<void>((resolve) => {
          if (proc.killed || proc.exitCode !== null) {
            resolve()
            return
          }
          proc.kill('SIGINT')
          const timer = setTimeout(() => {
            proc.kill('SIGKILL')
            resolve()
          }, 2000)
          proc.on('exit', () => {
            clearTimeout(timer)
            resolve()
          })
        }),
    ),
  )

  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('Doctor → snapshot import → board rendering integration (B.7)', () => {
  it(
    'imports pre-P5 snapshot via Doctor repair plan, backfills milestone, and serves filtered tasks via board',
    async () => {
      // Step 1: Create a temporary project with a pre-P5 snapshot
      const projectRoot = createTempDir('blueprint-doctor-e2e-')
      seedPreP5SnapshotProject(projectRoot)

      // Step 2: Run Doctor audit — should detect missing DB
      const auditResult = await runDoctorAudit(projectRoot)
      expect(auditResult.isClean).toBe(false)
      const missingDbFinding = auditResult.findings.find((f) => f.kind === 'missing-tracker-db')
      expect(missingDbFinding).toBeDefined()

      // Step 3: Create repair plan and execute
      const repairPlan = await createRepairPlan(auditResult.findings, projectRoot)
      expect(repairPlan.hasBlockingFindings).toBe(false)
      expect(repairPlan.actions.length).toBeGreaterThan(0)

      const dbMigrationAction = repairPlan.actions.find((a) => a.type === 'migrate-tracker-db')
      expect(dbMigrationAction).toBeDefined()

      const repairResult = await executeRepairs(repairPlan.actions, projectRoot)
      expect(repairResult.success).toBe(true)
      expect(repairResult.failed).toBe(0)

      // Step 4: Verify DB has all tasks with milestone backfilled
      const dbPath = join(projectRoot, 'docs', '.blueprint', 'tasks.db')
      expect(existsSync(dbPath)).toBe(true)

      const handle = openDb(projectRoot)
      try {
        const tasks = handle.db
          .prepare('SELECT id, milestone, phase, stream FROM tasks ORDER BY id')
          .all() as Array<{ id: string; milestone: string; phase: string; stream: string | null }>

        expect(tasks.length).toBe(3)

        // Every task should have milestone backfilled from ID
        for (const task of tasks) {
          expect(task.milestone).toBe('R6')
        }

        // Verify specific tasks
        expect(tasks.find((t) => t.id === 'R6-3.A.1')).toBeDefined()
        expect(tasks.find((t) => t.id === 'R6-4.B.2')).toBeDefined()
        expect(tasks.find((t) => t.id === 'R6-5.0.1')).toBeDefined()
      } finally {
        handle.close()
      }

      // Step 5: Start board --headless and fetch GET /tasks?milestone=R6
      const proc = spawnBoard(projectRoot, ['--headless'])
      const match = await waitForOutput(proc, /Board available at (http:\/\/127\.0\.0\.1:\d+)/)
      const url = match[1]

      const response = await fetch(`${url}/tasks?milestone=R6`)
      expect(response.status).toBe(200)
      const body = (await response.json()) as {
        ok: boolean
        data: Array<{ id: string; milestone: string }>
      }

      // Step 6: Assert response envelope
      expect(body.ok).toBe(true)
      expect(Array.isArray(body.data)).toBe(true)
      expect(body.data.length).toBe(3)

      // All tasks carry the milestone field
      for (const task of body.data) {
        expect(task.milestone).toBe('R6')
      }

      // Verify the specific task IDs are present
      const taskIds = body.data.map((t) => t.id).sort()
      expect(taskIds).toEqual(['R6-3.A.1', 'R6-4.B.2', 'R6-5.0.1'])

      // Clean up board process
      const exitCode = await killProc(proc)
      expect(exitCode).toBe(0)
    },
    20000,
  )
})
