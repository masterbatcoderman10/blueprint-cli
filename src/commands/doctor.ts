import { CommandDefinition } from '../runtime'
import { runDoctorAudit } from '../doctor/audit'
import { renderDoctorReport } from '../doctor/report'

export const doctorCommand: CommandDefinition = {
  name: 'doctor',
  handler: async () => {
    try {
      const result = await runDoctorAudit(process.cwd())
      process.stdout.write(`${renderDoctorReport(result)}\n`)
      return { exitCode: result.hasBlockingFindings ? 1 : 0 }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown doctor failure'
      process.stderr.write(`Blueprint Doctor failed: ${message}\n`)
      return { exitCode: 1 }
    }
  },
}
