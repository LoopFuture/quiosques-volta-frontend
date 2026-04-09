import {
  fetchWalletHistoryState,
  fetchWalletMovementDetailState,
  fetchWalletOverviewState,
  requestWalletTransfer,
} from '@/features/wallet/api'
import type { WalletTransferRequest } from '@/features/wallet/forms'

jest.mock('@/features/app-data/api', () => ({
  request: jest.fn(),
}))

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(),
}))

const { request: mockRequest } = jest.requireMock(
  '@/features/app-data/api',
) as {
  request: jest.Mock
}
const { randomUUID: mockRandomUUID } = jest.requireMock('expo-crypto') as {
  randomUUID: jest.Mock
}

const walletOverviewResponse = {
  balance: {
    amountMinor: 2450,
    currency: 'EUR',
  },
  recentTransactions: [
    {
      amount: {
        amountMinor: 1250,
        currency: 'EUR',
      },
      id: 'credit-1',
      occurredAt: '2024-01-05T10:30:00.000Z',
      status: 'completed',
      title: 'Pickup credit',
      type: 'credit',
    },
  ],
  stats: {
    completedTransfersCount: 5,
    creditsEarned: {
      amountMinor: 4200,
      currency: 'EUR',
    },
    processingTransfersCount: 1,
    returnedPackagesCount: 18,
  },
  transferEligibility: {
    canTransfer: true,
    maximumTransfer: {
      amountMinor: 2450,
      currency: 'EUR',
    },
    minimumTransfer: {
      amountMinor: 100,
      currency: 'EUR',
    },
  },
}

const walletHistoryResponse = {
  items: [
    {
      amount: {
        amountMinor: -500,
        currency: 'EUR',
      },
      id: 'transfer-1',
      occurredAt: '2024-01-06T09:00:00.000Z',
      status: 'processing',
      transferDetails: {
        requestedAt: '2024-01-06T08:45:00.000Z',
      },
      type: 'transfer_debit',
    },
  ],
  pageInfo: {
    hasNextPage: true,
    nextCursor: 'cursor-2',
  },
}

describe('wallet api', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRandomUUID.mockReturnValue('idempotency-key-123')
  })

  it('fetches the wallet overview state with the expected request metadata', async () => {
    const signal = new AbortController().signal
    mockRequest.mockResolvedValue(walletOverviewResponse)

    await expect(fetchWalletOverviewState(signal)).resolves.toEqual(
      walletOverviewResponse,
    )

    expect(mockRequest).toHaveBeenCalledWith({
      meta: {
        feature: 'wallet',
        operation: 'overview-state',
      },
      method: 'GET',
      path: '/api/v1/wallet',
      signal,
    })
  })

  it('uses the default wallet history page size when no pagination options are passed', async () => {
    mockRequest.mockResolvedValue(walletHistoryResponse)

    await expect(fetchWalletHistoryState()).resolves.toEqual(
      walletHistoryResponse,
    )

    expect(mockRequest).toHaveBeenCalledWith({
      meta: {
        feature: 'wallet',
        operation: 'history-state',
      },
      method: 'GET',
      path: '/api/v1/wallet/transactions',
      query: {
        cursor: undefined,
        limit: 20,
      },
      signal: undefined,
    })
  })

  it('forwards wallet history cursor, limit, and abort signal overrides', async () => {
    const signal = new AbortController().signal
    mockRequest.mockResolvedValue(walletHistoryResponse)

    await expect(
      fetchWalletHistoryState({
        cursor: 'cursor-1',
        limit: 10,
        signal,
      }),
    ).resolves.toEqual(walletHistoryResponse)

    expect(mockRequest).toHaveBeenCalledWith({
      meta: {
        feature: 'wallet',
        operation: 'history-state',
      },
      method: 'GET',
      path: '/api/v1/wallet/transactions',
      query: {
        cursor: 'cursor-1',
        limit: 10,
      },
      signal,
    })
  })

  it('encodes movement ids and parses payout account details in movement responses', async () => {
    mockRequest.mockResolvedValue({
      transaction: {
        amount: {
          amountMinor: -500,
          currency: 'EUR',
        },
        id: 'movement/123',
        occurredAt: '2024-01-06T09:00:00.000Z',
        status: 'completed',
        transferDetails: {
          payoutAccount: {
            ibanMasked: 'PT50************4321',
            rail: 'spin',
            spinEnabled: true,
          },
          requestedAt: '2024-01-06T08:45:00.000Z',
        },
        type: 'transfer_debit',
      },
    })

    await expect(
      fetchWalletMovementDetailState('movement/123'),
    ).resolves.toEqual({
      transaction: {
        amount: {
          amountMinor: -500,
          currency: 'EUR',
        },
        id: 'movement/123',
        occurredAt: '2024-01-06T09:00:00.000Z',
        status: 'completed',
        transferDetails: {
          payoutAccount: {
            ibanMasked: 'PT50************4321',
            rail: 'spin',
          },
          requestedAt: '2024-01-06T08:45:00.000Z',
        },
        type: 'transfer_debit',
      },
    })

    expect(mockRequest).toHaveBeenCalledWith({
      meta: {
        feature: 'wallet',
        operation: 'movement-detail-state',
        tags: {
          hasMovementId: true,
        },
      },
      method: 'GET',
      path: '/api/v1/wallet/transactions/movement%2F123',
      signal: undefined,
    })
  })

  it('adds an idempotency key when requesting a wallet transfer', async () => {
    const requestBody: WalletTransferRequest = {
      amount: {
        amountMinor: 900,
        currency: 'EUR',
      },
    }
    const responseBody = {
      balanceAfter: {
        amountMinor: 1550,
        currency: 'EUR',
      },
      createdAt: '2024-01-06T09:00:00.000Z',
      status: 'processing',
      transferId: 'transfer-123',
    }
    mockRequest.mockResolvedValue(responseBody)

    await expect(requestWalletTransfer(requestBody)).resolves.toEqual(
      responseBody,
    )

    expect(mockRandomUUID).toHaveBeenCalledTimes(1)
    expect(mockRequest).toHaveBeenCalledWith({
      body: requestBody,
      headers: {
        'Idempotency-Key': 'idempotency-key-123',
      },
      meta: {
        feature: 'wallet',
        operation: 'request-transfer',
      },
      method: 'POST',
      path: '/api/v1/wallet/transfers',
    })
  })
})
