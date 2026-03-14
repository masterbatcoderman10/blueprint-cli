import { execSync } from 'child_process'

export interface ReleaseCheckStep {
  id: string
  command: string
}

export const RELEASE_CHECK_STEPS: ReleaseCheckStep[] = [
  { id: 'install', command: 'npm ci' },
  { id: 'typecheck', command: 'npm run typecheck' },
  { id: 'test', command: 'npm test' },
  { id: 'build', command: 'npm run build' },
  { id: 'pack', command: 'npm pack --json' },
  { id: 'packaged-smoke', command: 'npm run release:pack:verify' },
]

export interface ReleaseCheckOptions {
  dryRun?: boolean
}

export function runReleaseCheck(options: ReleaseCheckOptions = {}): ReleaseCheckStep[] {
  if (options.dryRun) {
    return RELEASE_CHECK_STEPS
  }

  for (const step of RELEASE_CHECK_STEPS) {
    execSync(step.command, {
      stdio: 'inherit',
      encoding: 'utf-8',
    })
  }

  return RELEASE_CHECK_STEPS
}
