import type { WalletTransferRequest } from '@/features/wallet/forms'
import { waitForMockApi } from './delay'
import {
  createWalletTransfer,
  readWalletResponse,
  readWalletTransaction,
  readWalletTransactions,
} from './state'

type MockWalletHistoryOptions = {
  cursor?: string
  pageSize?: number
}

export async function getMockWalletOverviewState() {
  await waitForMockApi()

  return readWalletResponse()
}

export async function getMockWalletHistoryState(
  options?: MockWalletHistoryOptions,
) {
  await waitForMockApi()

  return readWalletTransactions(options)
}

export async function getMockWalletMovementDetailState(movementId: string) {
  await waitForMockApi()

  return readWalletTransaction(movementId)
}

export async function requestMockWalletTransfer(
  request: WalletTransferRequest,
) {
  await waitForMockApi()

  return createWalletTransfer(request)
}
