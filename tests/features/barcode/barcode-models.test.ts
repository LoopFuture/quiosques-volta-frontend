import {
  barcodeResponseSchema,
  getBarcodeScreenState,
} from '@/features/barcode/models'

describe('barcode models', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-03-23T12:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('builds the raw barcode screen state from validated feature data', () => {
    const barcodeScreenState = getBarcodeScreenState()

    expect(barcodeScreenState).toEqual({
      expiresAt: '2026-03-23T12:00:45.000Z',
      reference: 'VF-0001-RTM-2026',
    })
  })

  it('normalizes a backend expirationDateTime alias into expiresAt', () => {
    expect(
      barcodeResponseSchema.parse({
        expirationDateTime: '2026-03-23T12:00:30.000Z',
        reference: 'VF-1001-RTM-2026',
      }),
    ).toEqual({
      expiresAt: '2026-03-23T12:00:30.000Z',
      reference: 'VF-1001-RTM-2026',
    })
  })

  it('rejects the legacy code payload shape', () => {
    expect(
      barcodeResponseSchema.safeParse({
        code: 'JF-4829-SDR-2024',
        expiresAt: '2026-03-23T12:00:30.000Z',
      }).success,
    ).toBe(false)
  })
})
