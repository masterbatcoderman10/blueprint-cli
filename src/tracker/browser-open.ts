import { spawn } from 'node:child_process'

export async function openUrl(url: string): Promise<void> {
  const platform = process.platform

  let command: string
  let args: string[]

  if (platform === 'darwin') {
    command = 'open'
    args = [url]
  } else if (platform === 'win32') {
    command = 'start'
    args = ['""', url]
  } else {
    command = 'xdg-open'
    args = [url]
  }

  try {
    const child = spawn(command, args, { detached: true })
    child.unref()
  } catch (error) {
    console.error(`Failed to open browser: ${error instanceof Error ? error.message : String(error)}`)
  }
}
