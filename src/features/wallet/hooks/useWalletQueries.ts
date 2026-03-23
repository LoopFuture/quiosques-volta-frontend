import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  appMutationKeys,
  appQueryKeys,
  invalidateHomeQueries,
  invalidateWalletQueries,
} from '@/features/app-data/query'
import type { WalletTransferRequest } from '@/features/wallet/forms'
import {
  fetchWalletHistoryState,
  fetchWalletMovementDetailState,
  fetchWalletOverviewState,
  requestWalletTransfer,
} from '../api'
import type { WalletTransactionListResponse } from '../models'

export function useWalletOverviewQuery() {
  return useQuery({
    meta: {
      feature: 'wallet',
      operation: 'overview-state',
    },
    queryFn: ({ signal }) => fetchWalletOverviewState(signal),
    queryKey: appQueryKeys.wallet.overview(),
  })
}

export function useWalletHistoryQuery() {
  return useInfiniteQuery<
    WalletTransactionListResponse,
    Error,
    InfiniteData<WalletTransactionListResponse>,
    ReturnType<typeof appQueryKeys.wallet.history>,
    string | undefined
  >({
    getNextPageParam: (lastPage) => lastPage.pageInfo.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    meta: {
      feature: 'wallet',
      operation: 'history-state',
    },
    queryFn: ({ pageParam, signal }) =>
      fetchWalletHistoryState({
        cursor: pageParam,
        signal,
      }),
    queryKey: appQueryKeys.wallet.history(),
  })
}

export function useWalletMovementDetailQuery(movementId?: string) {
  const normalizedMovementId = movementId ?? 'missing'

  return useQuery({
    enabled: Boolean(movementId),
    meta: {
      feature: 'wallet',
      operation: 'movement-detail-state',
      tags: {
        hasMovementId: Boolean(movementId),
      },
    },
    queryFn: ({ signal }) =>
      fetchWalletMovementDetailState(movementId as string, signal),
    queryKey: appQueryKeys.wallet.movement(normalizedMovementId),
  })
}

export function useRequestWalletTransferMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    meta: {
      feature: 'wallet',
      operation: 'request-transfer',
    },
    mutationFn: (request: WalletTransferRequest) =>
      requestWalletTransfer(request),
    mutationKey: appMutationKeys.wallet.requestTransfer(),
    onSuccess: async () => {
      await invalidateWalletQueries(queryClient)
      await invalidateHomeQueries(queryClient)
    },
  })
}
