export const RELEASE_PACKAGE_NAME = '@splitwireml/blueprint'
export const RELEASE_BIN_NAME = 'blueprint'
export const SUPPORTED_NODE_RANGE = '>=20.0.0'
export const RELEASE_TAG_PATTERN = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/

export function isReleaseTag(tag: string): boolean {
  return RELEASE_TAG_PATTERN.test(tag)
}
