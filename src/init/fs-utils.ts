import { copyFile, mkdir, readdir, rename, stat, unlink } from 'node:fs/promises'
import { dirname, extname, join, resolve } from 'node:path'

const defaultIgnoredDirectories = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'coverage',
  'knowledge-base',
  '.next',
  '.turbo',
  'out',
])

async function walkForMarkdown(rootDir: string, currentDir: string, collected: string[]): Promise<void> {
  const entries = await readdir(currentDir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (defaultIgnoredDirectories.has(entry.name)) {
        continue
      }

      await walkForMarkdown(rootDir, join(currentDir, entry.name), collected)
      continue
    }

    if (entry.isFile() && extname(entry.name).toLowerCase() === '.md') {
      collected.push(join(currentDir, entry.name))
    }
  }
}

export async function scanMarkdownFiles(rootDir: string): Promise<string[]> {
  const normalizedRootDir = resolve(rootDir)
  const collected: string[] = []

  await walkForMarkdown(normalizedRootDir, normalizedRootDir, collected)
  return collected.sort()
}

export async function directoryExists(targetPath: string): Promise<boolean> {
  try {
    const targetStats = await stat(targetPath)
    return targetStats.isDirectory()
  } catch {
    return false
  }
}

export async function safeMkdirP(targetPath: string): Promise<void> {
  await mkdir(targetPath, { recursive: true })
}

export async function copyFileSafe(sourcePath: string, destinationPath: string): Promise<void> {
  await safeMkdirP(dirname(destinationPath))
  await copyFile(sourcePath, destinationPath)
}

export async function moveFileSafe(sourcePath: string, destinationPath: string): Promise<void> {
  await safeMkdirP(dirname(destinationPath))

  try {
    await rename(sourcePath, destinationPath)
  } catch (error) {
    const nodeError = error as { code?: string }
    if (nodeError.code !== 'EXDEV') {
      throw error
    }

    await copyFile(sourcePath, destinationPath)
    await unlink(sourcePath)
  }
}
