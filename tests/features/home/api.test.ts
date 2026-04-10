import { fetchHomeScreenState } from '@/features/home/api'

jest.mock('@/features/app-data/api', () => ({
  request: jest.fn(),
}))

const { request: mockRequest } = jest.requireMock(
  '@/features/app-data/api',
) as {
  request: jest.Mock
}

describe('home api', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches the home screen state with the expected query metadata', async () => {
    const signal = new AbortController().signal
    const responseBody = {
      greeting: {
        displayName: 'Joao Filipe Ferreira',
        memberSince: '2023-04-01',
      },
      recentActivity: [
        {
          amount: {
            amountMinor: 250,
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
          amountMinor: 1250,
          currency: 'EUR',
        },
        processingTransfersCount: 1,
        returnedPackagesCount: 30,
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
      unreadNotificationsCount: 3,
      walletBalance: {
        amountMinor: 2450,
        currency: 'EUR',
      },
    }
    mockRequest.mockResolvedValue(responseBody)

    await expect(fetchHomeScreenState(signal)).resolves.toEqual({
      ...responseBody,
      greeting: {
        ...responseBody.greeting,
        displayName: 'Joao Ferreira',
      },
    })

    expect(mockRequest).toHaveBeenCalledWith({
      meta: {
        feature: 'home',
        operation: 'screen-state',
      },
      method: 'GET',
      path: '/api/v1/home',
      signal,
    })
  })

  it('keeps a single-word display name unchanged', async () => {
    mockRequest.mockResolvedValue({
      greeting: {
        displayName: 'Joao',
        memberSince: '2023-04-01',
      },
      recentActivity: [],
      stats: {
        completedTransfersCount: 0,
        creditsEarned: {
          amountMinor: 0,
          currency: 'EUR',
        },
        processingTransfersCount: 0,
        returnedPackagesCount: 0,
      },
      transferEligibility: {
        canTransfer: false,
        maximumTransfer: {
          amountMinor: 0,
          currency: 'EUR',
        },
        minimumTransfer: {
          amountMinor: 100,
          currency: 'EUR',
        },
        reason: 'below_minimum_balance',
      },
      unreadNotificationsCount: 0,
      walletBalance: {
        amountMinor: 0,
        currency: 'EUR',
      },
    })

    await expect(fetchHomeScreenState()).resolves.toEqual(
      expect.objectContaining({
        greeting: expect.objectContaining({
          displayName: 'Joao',
        }),
      }),
    )
  })
})
