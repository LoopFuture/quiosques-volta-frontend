import {
  appMutationKeys,
  appQueryKeys,
  invalidateHomeQueries,
  invalidateWalletQueries,
} from '@/features/app-data/query'
import {
  useRequestWalletTransferMutation,
  useWalletHistoryQuery,
  useWalletMovementDetailQuery,
  useWalletOverviewQuery,
} from '@/features/wallet/hooks'

jest.mock('@tanstack/react-query', () => ({
  useInfiniteQuery: jest.fn((options) => options),
  useMutation: jest.fn((options) => options),
  useQuery: jest.fn((options) => options),
  useQueryClient: jest.fn(),
}))

jest.mock('@/features/wallet/api', () => ({
  fetchWalletHistoryState: jest.fn(),
  fetchWalletMovementDetailState: jest.fn(),
  fetchWalletOverviewState: jest.fn(),
  requestWalletTransfer: jest.fn(),
}))

jest.mock('@/features/app-data/query', () => {
  const actual = jest.requireActual('@/features/app-data/query')

  return {
    ...actual,
    invalidateHomeQueries: jest.fn(),
    invalidateWalletQueries: jest.fn(),
  }
})

const {
  useInfiniteQuery: mockUseInfiniteQuery,
  useMutation: mockUseMutation,
  useQuery: mockUseQuery,
  useQueryClient: mockUseQueryClient,
} = jest.requireMock('@tanstack/react-query')
const {
  fetchWalletHistoryState: mockFetchWalletHistoryState,
  fetchWalletMovementDetailState: mockFetchWalletMovementDetailState,
  fetchWalletOverviewState: mockFetchWalletOverviewState,
  requestWalletTransfer: mockRequestWalletTransfer,
} = jest.requireMock('@/features/wallet/api')

describe('wallet hooks', () => {
  const queryClient = {
    invalidateQueries: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseQueryClient.mockReturnValue(queryClient)
  })

  it('wires the wallet overview query with the expected key, metadata, and signal forwarding', async () => {
    const query = useWalletOverviewQuery()
    const signal = new AbortController().signal

    expect(mockUseQuery).toHaveBeenCalledTimes(1)
    expect(query.queryKey).toEqual(appQueryKeys.wallet.overview())
    expect(query.meta).toEqual({
      feature: 'wallet',
      operation: 'overview-state',
    })

    await query.queryFn({
      signal,
    })

    expect(mockFetchWalletOverviewState).toHaveBeenCalledWith(signal)
  })

  it('wires the wallet history query with cursor pagination support', async () => {
    const query = useWalletHistoryQuery()
    const signal = new AbortController().signal

    expect(mockUseInfiniteQuery).toHaveBeenCalledTimes(1)
    expect(query.queryKey).toEqual(appQueryKeys.wallet.history())
    expect(query.initialPageParam).toBeUndefined()
    expect(query.meta).toEqual({
      feature: 'wallet',
      operation: 'history-state',
    })
    expect(
      query.getNextPageParam({
        pageInfo: {
          hasNextPage: true,
          nextCursor: 'cursor-2',
        },
      }),
    ).toBe('cursor-2')
    expect(
      query.getNextPageParam({
        pageInfo: {
          hasNextPage: false,
          nextCursor: null,
        },
      }),
    ).toBeUndefined()

    await query.queryFn({
      pageParam: 'cursor-1',
      signal,
    })

    expect(mockFetchWalletHistoryState).toHaveBeenCalledWith({
      cursor: 'cursor-1',
      signal,
    })
  })

  it('disables the movement detail query until a movement id is available', () => {
    const query = useWalletMovementDetailQuery()

    expect(mockUseQuery).toHaveBeenCalledTimes(1)
    expect(query.enabled).toBe(false)
    expect(query.queryKey).toEqual(appQueryKeys.wallet.movement('missing'))
    expect(query.meta).toEqual({
      feature: 'wallet',
      operation: 'movement-detail-state',
      tags: {
        hasMovementId: false,
      },
    })
  })

  it('wires the movement detail query to the requested movement id', async () => {
    const signal = new AbortController().signal
    const query = useWalletMovementDetailQuery('movement-123')

    expect(query.enabled).toBe(true)
    expect(query.queryKey).toEqual(appQueryKeys.wallet.movement('movement-123'))
    expect(query.meta).toEqual({
      feature: 'wallet',
      operation: 'movement-detail-state',
      tags: {
        hasMovementId: true,
      },
    })

    await query.queryFn({
      signal,
    })

    expect(mockFetchWalletMovementDetailState).toHaveBeenCalledWith(
      'movement-123',
      signal,
    )
  })

  it('invalidates wallet and home queries after a successful transfer request', async () => {
    const mutation = useRequestWalletTransferMutation()
    const request = {
      amount: {
        amountMinor: 470,
        currency: 'EUR',
      },
    }

    expect(mockUseMutation).toHaveBeenCalledTimes(1)
    expect(mutation.mutationKey).toEqual(
      appMutationKeys.wallet.requestTransfer(),
    )
    expect(mutation.meta).toEqual({
      feature: 'wallet',
      operation: 'request-transfer',
    })

    await mutation.mutationFn(request)
    await mutation.onSuccess()

    expect(mockRequestWalletTransfer).toHaveBeenCalledWith(request)
    expect(invalidateWalletQueries).toHaveBeenCalledWith(queryClient)
    expect(invalidateHomeQueries).toHaveBeenCalledWith(queryClient)
  })
})
