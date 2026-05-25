import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { emitDeprecationBanner, isDeprecationSuppressed, shouldEmitDeprecationBanner, __resetDeprecationBannerForTesting, consumeDeprecationFlag } from '../../../src/runtime/deprecation-banner'

describe('R11-3.0.1 deprecation suppression helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('T-R11-3.0.1.1: suppresses when the deprecation flag appears anywhere or env var is "1"', () => {
    expect(isDeprecationSuppressed(['--no-deprecation-banner', 'init'], process.env)).toBe(true)
    expect(isDeprecationSuppressed(['init', '--no-deprecation-banner'], process.env)).toBe(true)
    expect(isDeprecationSuppressed(['init', '--no-deprecation-banner', '--help'], process.env)).toBe(true)
    expect(isDeprecationSuppressed(['doctor'], { ...process.env, BLUEPRINT_SUPPRESS_DEPRECATION: '1' })).toBe(true)
    expect(
      isDeprecationSuppressed(
        ['--no-deprecation-banner', 'doctor'],
        { ...process.env, BLUEPRINT_SUPPRESS_DEPRECATION: '1' },
      ),
    ).toBe(true)
  })

  it('T-R11-3.0.1.2: suppresses only with the documented flag or env value', () => {
    expect(isDeprecationSuppressed(['doctor'], process.env)).toBe(false)
    expect(isDeprecationSuppressed(['doctor'], { ...process.env, BLUEPRINT_SUPPRESS_DEPRECATION: '0' })).toBe(false)
    expect(isDeprecationSuppressed(['doctor'], { ...process.env, BLUEPRINT_SUPPRESS_DEPRECATION: 'true' })).toBe(false)

    expect(
      consumeDeprecationFlag([
        '--no-deprecation-banner',
        'init',
        '--no-deprecation-banner',
        '--help',
      ]),
    ).toEqual(['init', '--help'])

    expect(consumeDeprecationFlag(['doctor', '--no-deprecation-banner', '--version'])).toEqual([
      'doctor',
      '--version',
    ])
  })
})

describe('R11-3.0.2 deprecation banner eligibility', () => {
  it('T-R11-3.0.2.1: disables banner for root-help invocation shapes', () => {
    expect(shouldEmitDeprecationBanner([])).toBe(false)
    expect(shouldEmitDeprecationBanner(['--help'])).toBe(false)
    expect(shouldEmitDeprecationBanner(['-h'])).toBe(false)
    expect(shouldEmitDeprecationBanner(['help'])).toBe(false)
  })

  it('T-R11-3.0.2.2: enables banner for version and normal dispatched invocations', () => {
    expect(shouldEmitDeprecationBanner(['--version'])).toBe(true)
    expect(shouldEmitDeprecationBanner(['doctor'])).toBe(true)
    expect(shouldEmitDeprecationBanner(['init'])).toBe(true)
    expect(shouldEmitDeprecationBanner(['init', '--help'])).toBe(true)
    expect(shouldEmitDeprecationBanner(['bogus'])).toBe(true)
  })
})

describe('R11-3.0.3 deprecation banner emitter', () => {
  afterEach(() => {
    __resetDeprecationBannerForTesting()
  })

  it('T-R11-3.0.3.1: emits exactly once per invocation and supports test reset', async () => {
    const stream = {
      write: vi.fn(() => true),
    }

    emitDeprecationBanner(stream)
    emitDeprecationBanner(stream)
    expect(stream.write).toHaveBeenCalledTimes(1)
    expect((stream.write as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBe('[deprecation] consider migrating to skill mode\n')

    __resetDeprecationBannerForTesting()
    emitDeprecationBanner(stream)
    expect(stream.write).toHaveBeenCalledTimes(2)
  })
})

