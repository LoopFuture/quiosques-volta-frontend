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
    const query = useHomeScreenQuery()
    const signal = new AbortController().signal

    expect(mockUseQuery).toHaveBeenCalledTimes(1)
    expect(query.queryKey).toEqual(appQueryKeys.home.state())
    expect(query.meta).toEqual({
      feature: 'home',
      operation: 'screen-state',
    })

    await query.queryFn({
      signal,
    })

    expect(mockFetchHomeScreenState).toHaveBeenCalledWith(signal)
  })
})
