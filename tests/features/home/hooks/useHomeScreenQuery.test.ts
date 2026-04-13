import { appQueryKeys } from '@/features/app-data/query'
import { useHomeScreenQuery } from '@/features/home/hooks'

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn((options) => options),
}))

jest.mock('@/features/home/api', () => ({
  fetchHomeScreenState: jest.fn(),
}))

const { useQuery: mockUseQuery } = jest.requireMock('@tanstack/react-query')
const { fetchHomeScreenState: mockFetchHomeScreenState } = jest.requireMock(
  '@/features/home/api',
)

describe('home hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('wires the home screen query with the expected key, metadata, and signal forwarding', async () => {
    useHomeScreenQuery()
    const signal = new AbortController().signal
    const [options] = mockUseQuery.mock.calls[0]

    expect(mockUseQuery).toHaveBeenCalledTimes(1)
    expect(options.queryKey).toEqual(appQueryKeys.home.state())
    expect(options.meta).toEqual({
      feature: 'home',
      operation: 'screen-state',
    })

    await options.queryFn({
      signal,
    })

    expect(mockFetchHomeScreenState).toHaveBeenCalledWith(signal)
  })
})
