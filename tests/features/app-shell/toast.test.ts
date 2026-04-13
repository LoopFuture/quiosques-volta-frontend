import {
  APP_TOAST_DEFAULT_DURATION_MS,
  getAppToastDuration,
  getAppToastTone,
  getAppToastVariant,
} from '@/features/app-shell/toast'

describe('app-shell toast helpers', () => {
  it('returns the provided duration when present and falls back to the variant default otherwise', () => {
    expect(getAppToastDuration('error', 1234)).toBe(1234)
    expect(getAppToastDuration('hint')).toBe(APP_TOAST_DEFAULT_DURATION_MS.hint)
  })

  it('maps toast variants to the expected tones', () => {
    expect(getAppToastTone('success')).toBe('accent')
    expect(getAppToastTone('hint')).toBe('neutral')
    expect(getAppToastTone('error')).toBe('error')
  })

  it('defaults missing variants to success and preserves explicit variants', () => {
    expect(getAppToastVariant(undefined)).toBe('success')
    expect(getAppToastVariant(null)).toBe('success')
    expect(getAppToastVariant('error')).toBe('error')
  })
})
