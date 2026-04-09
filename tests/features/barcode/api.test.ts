import { fetchBarcodeScreenState } from '@/features/barcode/api'

jest.mock('@/features/app-data/api', () => ({
  request: jest.fn(),
}))

const { request: mockRequest } = jest.requireMock(
  '@/features/app-data/api',
) as {
  request: jest.Mock
}

describe('barcode api', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches the barcode screen state with barcode metadata', async () => {
    const signal = new AbortController().signal
    const responseBody = {
      code: '1234567890',
      expiresAt: '2024-01-06T09:15:00.000Z',
    }
    mockRequest.mockResolvedValue(responseBody)

    await expect(fetchBarcodeScreenState(signal)).resolves.toEqual(responseBody)

    expect(mockRequest).toHaveBeenCalledWith({
      meta: {
        feature: 'barcode',
        operation: 'screen-state',
      },
      method: 'GET',
      path: '/api/v1/barcode',
      signal,
    })
  })
})
