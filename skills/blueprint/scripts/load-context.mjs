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
const BLUEPRINT_DIR = 'docs/.blueprint'
const TASKS_DB = 'docs/.blueprint/tasks.db'

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

  // Build output
  const sections = []

  // ## Project
  sections.push(`## Project\n${project ?? '_not set_'}`)

  // ## Current Milestone
  sections.push(`## Current Milestone\n${milestone ?? '_not set_'}`)

  // ## Current Phase
  sections.push(`## Current Phase\n${phase ?? '_not set_'}`)

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
