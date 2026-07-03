import { boardCommand } from './board'
import { contextCommand } from './context'
import { doctorCommand } from './doctor'
import { initCommand } from './init'
import { linkCommand } from './link'
import { alignmentCompleteCommand, migrateCommand } from './r11-6-foundation'

export { alignmentCompleteCommand, boardCommand, contextCommand, doctorCommand, initCommand, linkCommand, migrateCommand }

export const placeholderCommands = [
  initCommand,
  linkCommand,
  contextCommand,
  doctorCommand,
  alignmentCompleteCommand,
  migrateCommand,
]
