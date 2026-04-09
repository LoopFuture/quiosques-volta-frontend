import { fetchProfileState, patchProfile } from '@/features/profile/api'

jest.mock('@/features/app-data/api', () => ({
  request: jest.fn(),
}))

const { request: mockRequest } = jest.requireMock(
  '@/features/app-data/api',
) as {
  request: jest.Mock
}

describe('profile api', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches the profile state with profile metadata', async () => {
    const signal = new AbortController().signal
    mockRequest.mockResolvedValue({
      memberSince: '2023-04-01',
      onboarding: {
        completedAt: null,
        status: 'in_progress',
      },
      payoutAccount: {
        ibanMasked: 'PT50************4321',
        rail: 'spin',
        spinEnabled: true,
      },
      personal: {
        email: 'joao@volta.pt',
        name: 'Joao Ferreira',
        nif: '123456789',
        phoneNumber: '+351912345678',
      },
      preferences: {
        alertsEmail: 'joao@volta.pt',
        alertsEnabled: true,
      },
      stats: {
        completedTransfersCount: 5,
        creditsEarned: {
          amountMinor: 1250,
          currency: 'EUR',
        },
        processingTransfersCount: 1,
        returnedPackagesCount: 30,
      },
    })

    await expect(fetchProfileState(signal)).resolves.toEqual({
      memberSince: '2023-04-01',
      onboarding: {
        completedAt: null,
        status: 'in_progress',
      },
      payoutAccount: {
        ibanMasked: 'PT50************4321',
        rail: 'spin',
      },
      personal: {
        email: 'joao@volta.pt',
        name: 'Joao Ferreira',
        nif: '123456789',
        phoneNumber: '+351912345678',
      },
      preferences: {
        alertsEmail: 'joao@volta.pt',
        alertsEnabled: true,
      },
      stats: {
        completedTransfersCount: 5,
        creditsEarned: {
          amountMinor: 1250,
          currency: 'EUR',
        },
        processingTransfersCount: 1,
        returnedPackagesCount: 30,
      },
    })

    expect(mockRequest).toHaveBeenCalledWith({
      meta: {
        feature: 'profile',
        operation: 'profile-state',
      },
      method: 'GET',
      path: '/api/v1/profile',
      signal,
    })
  })

  it('normalizes payout account patches before sending them to the api client', async () => {
    mockRequest.mockResolvedValue({
      memberSince: '2023-04-01',
      onboarding: {
        completedAt: '2024-01-03T09:00:00.000Z',
        status: 'completed',
      },
      payoutAccount: {
        ibanMasked: 'PT50************4321',
        rail: 'spin',
      },
      personal: {
        email: 'joao@volta.pt',
        name: 'Joao Ferreira',
        nif: '123456789',
        phoneNumber: '+351912345678',
      },
      preferences: {
        alertsEmail: 'joao@volta.pt',
        alertsEnabled: true,
      },
      stats: {
        completedTransfersCount: 5,
        creditsEarned: {
          amountMinor: 1250,
          currency: 'EUR',
        },
        processingTransfersCount: 1,
        returnedPackagesCount: 30,
      },
    })

    await patchProfile({
      payoutAccount: {
        iban: 'PT50000201231234567890154',
        rail: 'spin',
      },
    })

    expect(mockRequest).toHaveBeenCalledWith({
      body: {
        payoutAccount: {
          iban: 'PT50000201231234567890154',
          rail: 'spin',
        },
      },
      meta: {
        feature: 'profile',
        operation: 'patch-profile',
        redactKeys: ['email', 'iban', 'name', 'nif', 'phoneNumber'],
      },
      method: 'PATCH',
      path: '/api/v1/profile',
    })
  })
})
