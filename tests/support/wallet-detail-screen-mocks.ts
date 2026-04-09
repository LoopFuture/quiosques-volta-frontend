import {
  walletTransactionListResponseSchema,
  walletTransactionResponseSchema,
} from '@/features/wallet/models'
import { setLocaleOverrideForTests, syncLocale } from '@/i18n'

jest.mock('expo-router', () => {
  const { createExpoRouterMock } = jest.requireActual(
    '@tests/support/expo-router-mock',
  )

  return createExpoRouterMock()
})

jest.mock('@/features/wallet/hooks', () => ({
  useWalletHistoryQuery: jest.fn(),
  useWalletMovementDetailQuery: jest.fn(),
}))

export const {
  __mockRouterBack: mockRouterBack,
  __mockRouterPush: mockRouterPush,
  __mockUseLocalSearchParams: mockUseLocalSearchParams,
} = jest.requireMock('expo-router')
export const {
  useWalletHistoryQuery: mockUseWalletHistoryQuery,
  useWalletMovementDetailQuery: mockUseWalletMovementDetailQuery,
} = jest.requireMock('@/features/wallet/hooks')
export const { __getLastFlashListRef } = jest.requireMock('@shopify/flash-list')

export const transferMovement = walletTransactionResponseSchema.parse({
  transaction: {
    amount: {
      amountMinor: -470,
      currency: 'EUR',
    },
    description: 'Transferencia para conta',
    id: 'movement-transfer-1',
    occurredAt: '2026-04-08T10:00:00.000Z',
    status: 'processing',
    transferDetails: {
      expectedArrivalAt: '2026-04-10T10:00:00.000Z',
      failureReason: null,
      payoutAccount: {
        ibanMasked: 'PT50************4321',
        rail: 'spin',
      },
      requestedAt: '2026-04-08T10:00:00.000Z',
    },
    type: 'transfer_debit',
  },
})

export const failedTransferMovement = walletTransactionResponseSchema.parse({
  transaction: {
    ...transferMovement.transaction,
    id: 'movement-transfer-2',
    status: 'failed',
    transferDetails: {
      ...transferMovement.transaction.transferDetails,
      failureReason: 'Conta indisponivel',
    },
  },
})

export const walletHistoryPage = walletTransactionListResponseSchema.parse({
  items: [
    {
      amount: {
        amountMinor: 30,
        currency: 'EUR',
      },
      creditDetails: {
        locationName: 'Pingo Doce - Afragide',
        packageCount: 6,
      },
      description: 'Credito de devolucao',
      id: 'movement-credit-1',
      occurredAt: '2026-04-08T09:00:00.000Z',
      status: 'completed',
      type: 'credit',
    },
    transferMovement.transaction,
  ],
  pageInfo: {
    endCursor: 'cursor-2',
    hasNextPage: true,
    hasPreviousPage: false,
    startCursor: null,
  },
})

export const creditOnlyWalletHistoryPage =
  walletTransactionListResponseSchema.parse({
    ...walletHistoryPage,
    items: [walletHistoryPage.items[0]!],
    pageInfo: {
      endCursor: null,
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: null,
    },
  })

export function resetWalletDetailScreenMocks() {
  jest.clearAllMocks()
  setLocaleOverrideForTests('pt-PT')
  syncLocale('system')

  mockUseLocalSearchParams.mockReturnValue({
    movementId: 'movement-transfer-1',
  })
  mockUseWalletMovementDetailQuery.mockReturnValue({
    data: transferMovement,
    isError: false,
    isPending: false,
    isRefetching: false,
    refetch: jest.fn(),
  })
  mockUseWalletHistoryQuery.mockReturnValue({
    data: {
      pageParams: [undefined],
      pages: [walletHistoryPage],
    },
    fetchNextPage: jest.fn(),
    hasNextPage: true,
    isError: false,
    isFetchingNextPage: false,
    isPending: false,
    isRefetching: false,
    refetch: jest.fn(),
  })
}

export function restoreWalletDetailScreenLocale() {
  setLocaleOverrideForTests('pt-PT')
  syncLocale('system')
}
