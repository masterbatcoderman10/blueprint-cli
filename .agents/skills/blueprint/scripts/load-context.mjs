#!/usr/bin/env node

/**
 * load-context.mjs — Blueprint context loader
 *
 * Pure Node.js ESM script (no external dependencies).
 * Reads docs/project-progress.md from the current working directory,
 * parses key sections, probes docs/.blueprint/ for tracker presence,
 * and prints a markdown brief to stdout.
 *
 * Exit codes:
 *   0 — success (even with missing sections)
 *   1 — filesystem error preventing docs/project-progress.md read
 */

import { readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'

const PROGRESS_PATH = 'docs/project-progress.md'
const TASKS_DB = 'docs/.blueprint/tasks.db'
const SUPPORTED_ROOT_FILES = ['CLAUDE.md', 'AGENTS.md', 'GEMINI.md', 'QWEN.md']
const ALIGNMENT_REQUIRED_MARKER = '<!-- blueprint-status: alignment-required -->'
const ALIGNMENT_COMPLETE_MARKER = '<!-- blueprint-status: alignment-complete -->'
const LEGACY_MIGRATION_MARKER = '<!-- blueprint-origin: legacy-migration -->'

// ── Parsing helpers ──────────────────────────────────────────────

/**
 * Extract a value from a bold-labeled line like:
 *   **Project**: acme-app
 *   **Current Milestone**: Milestone 1 — Core (Phase 2 in progress)
 */
function extractField(content, label) {
  const regex = new RegExp(`\\*\\*${label}\\*\\*:\\s*(.+)`, 'i')
  const match = content.match(regex)
  return match ? match[1].trim() : null
}

/**
 * Extract the "Pending Revisions" table rows.
 * Returns an array of { revision, name, status, notes } objects,
 * or null if the section is absent.
 */
function parsePendingRevisions(content) {
  const headingIdx = content.indexOf('## Pending Revisions')
  if (headingIdx === -1) return null

  const afterHeading = content.slice(headingIdx)
  // Find the table (starts after the intro paragraph, if any)
  const tableMatch = afterHeading.match(/\n\|[^|]+\|[^|]+\|[^|]+\|[^|]+\|\n/)
  if (!tableMatch) return null

  const tableStart = afterHeading.indexOf(tableMatch[0])
  const tableSection = afterHeading.slice(tableStart)

  const lines = tableSection.split('\n')
  let dataStarted = false
  const rows = []
  for (const line of lines) {
    // Skip separator rows like |---|---|---|
    if (line.match(/^\|[\s-:|]+\|$/)) {
      dataStarted = true
      continue
    }
    const cells = line.split('|').filter(Boolean).map((c) => c.trim())
    if (cells.length >= 2) {
      // Skip the header row (comes before the separator)
      if (!dataStarted) continue
      const hasMeaningfulData = cells.some((cell) => cell.length > 0 && !/^_.*_$/.test(cell))
      if (!hasMeaningfulData) continue
      rows.push({
        revision: cells[0] || '',
        name: cells[1] || '',
        status: cells[2] || '',
        notes: cells[3] || '',
      })
    }
  }
  return rows.length > 0 ? rows : null
}

/**
 * Check if the tracker DB exists.
 */
async function probeTracker() {
  try {
    await stat(TASKS_DB)
    return true
  } catch {
    return false
  }
}

function classifyProgressState({ milestone, phase, pendingRevisions }) {
  return milestone === null && phase === null && (!pendingRevisions || pendingRevisions.length === 0)
    ? 'empty progress shell'
    : 'populated progress'
}

async function probeRootFile(fileName) {
  try {
    const content = await readFile(join(process.cwd(), fileName), 'utf-8')
    let state = 'no marker'
    if (content.includes(ALIGNMENT_REQUIRED_MARKER)) {
      state = 'alignment-required'
    } else if (content.includes(ALIGNMENT_COMPLETE_MARKER)) {
      state = 'alignment-complete'
    }

    return {
      fileName,
      state,
      hasLegacyMigration: content.includes(LEGACY_MIGRATION_MARKER),
    }
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'ENOENT') {
      return {
        fileName,
        state: 'missing',
        hasLegacyMigration: false,
      }
    }
    throw err
  }
}

async function probeRootFiles() {
  const results = []
  for (const fileName of SUPPORTED_ROOT_FILES) {
    results.push(await probeRootFile(fileName))
  }
  return results
}

// ── Main ─────────────────────────────────────────────────────────

async function main() {
  let content
  try {
    content = await readFile(join(process.cwd(), PROGRESS_PATH), 'utf-8')
  } catch (err) {
    const msg =
      err && typeof err === 'object' && 'code' in err && err.code === 'ENOENT'
        ? `Error: ${PROGRESS_PATH} not found in current directory.`
        : `Error: Could not read ${PROGRESS_PATH} — ${err instanceof Error ? err.message : String(err)}`
    process.stderr.write(msg + '\n')
    process.exit(1)
  }

  // Parse sections
  const project = extractField(content, 'Project')
  const milestone = extractField(content, 'Current Milestone')
  const phase = extractField(content, 'Current Phase')
  const pendingRevisions = parsePendingRevisions(content)
  const trackerReady = await probeTracker()
  const progressState = classifyProgressState({ milestone, phase, pendingRevisions })
  const rootFileStates = await probeRootFiles()
  const legacyMigrationFiles = rootFileStates
    .filter((entry) => entry.hasLegacyMigration)
    .map((entry) => `\`${entry.fileName}\``)

  // Build output
  const sections = []

  // ## Project
  sections.push(`## Project\n${project ?? '_not set_'}`)

  // ## Current Milestone
  sections.push(`## Current Milestone\n${milestone ?? '_not set_'}`)

  // ## Current Phase
  sections.push(`## Current Phase\n${phase ?? '_not set_'}`)

  // ## Progress State
  sections.push(`## Progress State\n${progressState}`)

  // ## Alignment Markers
  sections.push(
    `## Alignment Markers\n${rootFileStates.map((entry) => `- \`${entry.fileName}\`: ${entry.state}`).join('\n')}`,
  )

  // ## Project Origin
  sections.push(
    `## Project Origin\n${
      legacyMigrationFiles.length > 0
        ? `legacy-migration marker present in ${legacyMigrationFiles.join(', ')}`
        : 'no legacy-migration marker'
    }`,
  )

  // ## Pending Revisions
  if (pendingRevisions && pendingRevisions.length > 0) {
    const items = pendingRevisions
      .map((r) => `- **${r.revision}** ${r.name} (${r.status})${r.notes ? ' — ' + r.notes : ''}`)
      .join('\n')
    sections.push(`## Pending Revisions\n${items}`)
  } else {
    sections.push('## Pending Revisions\n_none_')
  }

  // ## Tracker
  sections.push(
    `## Tracker\n${trackerReady ? 'initialised at docs/.blueprint/tasks.db' : 'not initialised — run blueprint init'}`,
  )

  process.stdout.write(sections.join('\n\n') + '\n')
  process.exit(0)
}

main()
