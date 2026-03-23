import type { QueryClient } from '@tanstack/react-query'
import { appQueryKeys } from './keys'

export function invalidateHomeQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    queryKey: appQueryKeys.home.all,
  })
}

export function invalidateBarcodeQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    queryKey: appQueryKeys.barcode.all,
  })
}

export function invalidateWalletQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    queryKey: appQueryKeys.wallet.all,
  })
}

export function invalidateProfileQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    queryKey: appQueryKeys.profile.all,
  })
}

export function invalidateNotificationsQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    queryKey: appQueryKeys.notifications.all,
  })
}
