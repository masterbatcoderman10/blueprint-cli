import { runReleaseCheck } from './check'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')

if (dryRun) {
  process.stdout.write(`${JSON.stringify(runReleaseCheck({ dryRun: true }))}\n`)
  process.exit(0)
}

runReleaseCheck()
