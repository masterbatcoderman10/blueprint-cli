export const RELEASE_PACKAGE_NAME = '@splitwireml/blueprint'
export const RELEASE_BIN_NAME = 'blueprint'
export const SUPPORTED_NODE_RANGE = '>=18.0.0'
export const RELEASE_TAG_PATTERN = /^v\d+\.\d+\.\d+$/

export function isReleaseTag(tag: string): boolean {
  return RELEASE_TAG_PATTERN.test(tag)
}
