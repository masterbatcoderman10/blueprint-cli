import { isSupportedRootHelpInvocation } from '../help/root'

export const DEPRECATION_BANNER_TEXT = '[deprecation] consider migrating to skill mode'
export const DEPRECATION_FLAG = '--no-deprecation-banner'
export const DEPRECATION_ENV_VAR = 'BLUEPRINT_SUPPRESS_DEPRECATION'

let bannerEmitted = false

export function isDeprecationSuppressed(argv: string[], env: NodeJS.ProcessEnv): boolean {
  if (argv.includes(DEPRECATION_FLAG)) {
    return true
  }

  return env[DEPRECATION_ENV_VAR] === '1'
}

export function consumeDeprecationFlag(argv: string[]): string[] {
  return argv.filter((arg) => arg !== DEPRECATION_FLAG)
}

export function shouldEmitDeprecationBanner(argv: string[]): boolean {
  const normalizedArgv = consumeDeprecationFlag(argv)
  return !isSupportedRootHelpInvocation(normalizedArgv)
}

export function emitDeprecationBanner(stream: NodeJS.WritableStream = process.stderr): void {
  if (bannerEmitted) {
    return
  }

  bannerEmitted = true
  stream.write(`${DEPRECATION_BANNER_TEXT}\n`)
}

export function __resetDeprecationBannerForTesting(): void {
  bannerEmitted = false
}
