import { appQueryKeys } from '@/features/app-data/query'
import { useBarcodeScreenQuery } from '@/features/barcode/hooks'

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn((options) => options),
}))

jest.mock('@/features/barcode/api', () => ({
  fetchBarcodeScreenState: jest.fn(),
}))

const { useQuery: mockUseQuery } = jest.requireMock('@tanstack/react-query')
const { fetchBarcodeScreenState: mockFetchBarcodeScreenState } =
  jest.requireMock('@/features/barcode/api')

describe('barcode hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('wires the barcode screen query with the expected key, metadata, and signal forwarding', async () => {
    const query = useBarcodeScreenQuery()
    const signal = new AbortController().signal

    expect(mockUseQuery).toHaveBeenCalledTimes(1)
    expect(query.queryKey).toEqual(appQueryKeys.barcode.screen())
    expect(query.meta).toEqual({
      feature: 'barcode',
      operation: 'screen-state',
    })

    await query.queryFn({
      signal,
    })

    expect(mockFetchBarcodeScreenState).toHaveBeenCalledWith(signal)
  })
})
