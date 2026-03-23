import { request } from '@/features/app-data/api'
import * as Crypto from 'expo-crypto'
import type { WalletTransferRequest } from '@/features/wallet/forms'
import {
  createTransferResponseSchema,
  walletResponseSchema,
  walletTransactionListResponseSchema,
  walletTransactionResponseSchema,
  type CreateTransferResponse,
  type WalletResponse,
  type WalletTransactionListResponse,
  type WalletTransactionResponse,
} from './models'

const WALLET_HISTORY_PAGE_SIZE = 20

type FetchWalletHistoryStateOptions = {
  cursor?: string
  pageSize?: number
  signal?: AbortSignal
}

export async function fetchWalletOverviewState(signal?: AbortSignal) {
  return walletResponseSchema.parse(
    await request<WalletResponse>({
      meta: {
        feature: 'wallet',
        operation: 'overview-state',
      },
      method: 'GET',
      path: '/wallet',
      signal,
    }),
  )
}

export async function fetchWalletHistoryState({
  cursor,
  pageSize = WALLET_HISTORY_PAGE_SIZE,
  signal,
}: FetchWalletHistoryStateOptions = {}) {
  return walletTransactionListResponseSchema.parse(
    await request<WalletTransactionListResponse>({
      meta: {
        feature: 'wallet',
        operation: 'history-state',
      },
      method: 'GET',
      path: '/wallet/transactions',
      query: {
        cursor,
        pageSize,
      },
      signal,
    }),
  )
}

export async function fetchWalletMovementDetailState(
  movementId: string,
  signal?: AbortSignal,
) {
  return walletTransactionResponseSchema.parse(
    await request<WalletTransactionResponse>({
      meta: {
        feature: 'wallet',
        operation: 'movement-detail-state',
        tags: {
          hasMovementId: true,
        },
      },
      method: 'GET',
      path: `/wallet/transactions/${encodeURIComponent(movementId)}`,
      signal,
    }),
  )
}

export async function requestWalletTransfer(
  requestBody: WalletTransferRequest,
) {
  return createTransferResponseSchema.parse(
    await request<CreateTransferResponse, WalletTransferRequest>({
      body: requestBody,
      headers: {
        'Idempotency-Key': Crypto.randomUUID(),
      },
      meta: {
        feature: 'wallet',
        operation: 'request-transfer',
      },
      method: 'POST',
      path: '/wallet/transfers',
    }),
  )
}
