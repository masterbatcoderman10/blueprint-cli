import { CommandDefinition } from '../runtime'
import { runDoctorAudit } from '../doctor/audit'
import { renderDoctorReport } from '../doctor/report'
import { createRepairPlan, renderRepairPlan } from '../doctor/repair'
import { executeRepairs, renderRepairResult } from '../doctor/executor'
import { intro, log, confirm, cancel } from '@clack/prompts'

export const doctorCommand: CommandDefinition = {
  name: 'doctor',
  handler: async () => {
    try {
      intro('Blueprint Doctor')

      const projectDir = process.cwd()

      // Step 1: Run audit
      const auditResult = await runDoctorAudit(projectDir)
      log.info(renderDoctorReport(auditResult))

      if (auditResult.isClean) {
        log.success('Project integrity is clean. No repairs needed.')
        return { exitCode: 0 }
      }

      // Step 2: Create repair plan
      const repairPlan = await createRepairPlan(auditResult.findings, projectDir)

      if (repairPlan.hasBlockingFindings) {
        cancel(`Cannot proceed with repairs: ${repairPlan.blockingReason || 'Unknown blocking issue'}`)
        return { exitCode: 1 }
      }

      if (repairPlan.actions.length === 0) {
        log.info('No repairs needed for the detected findings.')
        return { exitCode: 0 }
      }

      // Step 3: Present repair plan and ask for confirmation
      log.message(renderRepairPlan(repairPlan))

      const confirmed = await confirm({
        message: 'Apply these repairs?',
        initialValue: true,
      })

      if (confirmed !== true) {
        cancel('Repairs cancelled. No changes were made.')
        return { exitCode: 0 }
      }

      // Step 4: Execute repairs
      const repairResult = await executeRepairs(repairPlan.actions, projectDir)
      log.info(renderRepairResult(repairResult))

      if (!repairResult.success) {
        cancel('Some repairs failed. Check errors above.')
        return { exitCode: 1 }
      }

      // Step 5: Re-run validation
      const postRepairResult = await runDoctorAudit(projectDir)
      log.info(renderDoctorReport(postRepairResult))

      if (postRepairResult.isClean) {
        log.success('Project integrity is now clean. All repairs successful.')
        return { exitCode: 0 }
      } else {
        log.warn('Some integrity issues remain after repair.')
        return { exitCode: 0 }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown doctor failure'
      cancel(`Blueprint Doctor failed: ${message}`)
      return { exitCode: 1 }
    }
  },
}
