import {
  appMutationKeys,
  appQueryKeys,
  invalidateBarcodeQueries,
  invalidateHomeQueries,
  invalidateProfileQueries,
  invalidateWalletQueries,
} from '@/features/app-data/query'
import { profileResponseSchema } from '@/features/profile/models'
import {
  useCompleteProfileSetupMutation,
  useProfileQuery,
  useUpdateProfilePaymentsMutation,
  useUpdateProfilePersonalMutation,
  useUpdateProfilePreferencesMutation,
} from '@/features/profile/hooks'

jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn((options) => options),
  useQuery: jest.fn((options) => options),
  useQueryClient: jest.fn(),
}))

jest.mock('@/features/profile/api', () => ({
  fetchProfileState: jest.fn(),
  patchProfile: jest.fn(),
}))

jest.mock('@/features/app-data/query', () => {
  const actual = jest.requireActual('@/features/app-data/query')

  return {
    ...actual,
    invalidateBarcodeQueries: jest.fn(),
    invalidateHomeQueries: jest.fn(),
    invalidateProfileQueries: jest.fn(),
    invalidateWalletQueries: jest.fn(),
  }
})

const {
  useMutation: mockUseMutation,
  useQuery: mockUseQuery,
  useQueryClient: mockUseQueryClient,
} = jest.requireMock('@tanstack/react-query')
const {
  fetchProfileState: mockFetchProfileState,
  patchProfile: mockPatchProfile,
} = jest.requireMock('@/features/profile/api')

const profileState = profileResponseSchema.parse({
  memberSince: '2023-04-01',
  onboarding: {
    completedAt: '2023-04-02T08:00:00.000Z',
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

describe('profile hooks', () => {
  const queryClient = {
    setQueryData: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseQueryClient.mockReturnValue(queryClient)
  })

  it('wires the profile query with the expected key, metadata, and signal forwarding', async () => {
    useProfileQuery()
    const signal = new AbortController().signal
    const [options] = mockUseQuery.mock.calls[0]

    expect(mockUseQuery).toHaveBeenCalledTimes(1)
    expect(options.queryKey).toEqual(appQueryKeys.profile.state())
    expect(options.enabled).toBe(true)
    expect(options.meta).toEqual({
      feature: 'profile',
      operation: 'profile-state',
    })

    await options.queryFn({
      signal,
    })

    expect(mockFetchProfileState).toHaveBeenCalledWith(signal)
  })

  it('allows the profile query to be disabled explicitly', () => {
    useProfileQuery({
      enabled: false,
    })
    const [options] = mockUseQuery.mock.calls[0]

    expect(options.enabled).toBe(false)
  })

  it('invalidates profile and barcode queries after updating personal data', async () => {
    useUpdateProfilePersonalMutation()
    const patch = {
      personal: {
        name: 'Ana Silva',
      },
    }
    const [options] = mockUseMutation.mock.calls[0]

    expect(mockUseMutation).toHaveBeenCalledTimes(1)
    expect(options.mutationKey).toEqual(
      appMutationKeys.profile.updatePersonal(),
    )
    expect(options.meta).toEqual({
      feature: 'profile',
      operation: 'update-personal',
      redactKeys: ['email', 'name', 'nif', 'phoneNumber'],
    })

    await options.mutationFn(patch)
    await options.onSuccess(profileState)

    expect(mockPatchProfile).toHaveBeenCalledWith(patch)
    expect(queryClient.setQueryData).toHaveBeenCalledWith(
      appQueryKeys.profile.state(),
      profileState,
    )
    expect(invalidateProfileQueries).toHaveBeenCalledWith(queryClient)
    expect(invalidateBarcodeQueries).toHaveBeenCalledWith(queryClient)
  })

  it('invalidates wallet and home queries after updating payments', async () => {
    useUpdateProfilePaymentsMutation()
    const patch = {
      payoutAccount: {
        accountHolderName: 'Joao Ferreira',
        iban: 'PT50000201231234567890154',
        rail: 'sepa',
      },
    }
    const [options] = mockUseMutation.mock.calls[0]

    expect(options.mutationKey).toEqual(
      appMutationKeys.profile.updatePayments(),
    )
    expect(options.meta).toEqual({
      feature: 'profile',
      operation: 'update-payments',
      redactKeys: ['accountHolderName', 'fullName', 'iban'],
    })

    await options.mutationFn(patch)
    await options.onSuccess(profileState)

    expect(mockPatchProfile).toHaveBeenCalledWith(patch)
    expect(invalidateProfileQueries).toHaveBeenCalledWith(queryClient)
    expect(invalidateWalletQueries).toHaveBeenCalledWith(queryClient)
    expect(invalidateHomeQueries).toHaveBeenCalledWith(queryClient)
  })

  it('invalidates the profile query after updating preferences', async () => {
    useUpdateProfilePreferencesMutation()
    const patch = {
      preferences: {
        alertsEmail: 'alerts@volta.pt',
      },
    }
    const [options] = mockUseMutation.mock.calls[0]

    expect(options.mutationKey).toEqual(
      appMutationKeys.profile.updatePreferences(),
    )
    expect(options.meta).toEqual({
      feature: 'profile',
      operation: 'update-preferences',
      redactKeys: ['alertsEmail'],
    })

    await options.mutationFn(patch)
    await options.onSuccess(profileState)

    expect(mockPatchProfile).toHaveBeenCalledWith(patch)
    expect(invalidateProfileQueries).toHaveBeenCalledWith(queryClient)
    expect(invalidateHomeQueries).not.toHaveBeenCalled()
    expect(invalidateWalletQueries).not.toHaveBeenCalled()
    expect(invalidateBarcodeQueries).not.toHaveBeenCalled()
  })

  it('serializes setup completion and invalidates dependent queries', async () => {
    useCompleteProfileSetupMutation()
    const [options] = mockUseMutation.mock.calls[0]

    expect(options.mutationKey).toEqual(appMutationKeys.profile.completeSetup())
    expect(options.meta).toEqual({
      feature: 'profile',
      operation: 'complete-setup',
      redactKeys: [
        'accountHolderName',
        'email',
        'fullName',
        'iban',
        'name',
        'nif',
        'phoneNumber',
      ],
    })

    await options.mutationFn({
      snapshot: {
        payments: {
          accountHolderName: 'Joao Ferreira',
          iban: 'PT50000201231234567890154',
        },
        personal: {
          email: 'joao@volta.pt',
          name: 'Joao Ferreira',
          nif: '123456789',
          phoneNumber: '+351912345678',
        },
        preferences: {
          biometricsEnabled: true,
          pinEnabled: false,
          pushNotificationsEnabled: true,
        },
        alertsEnabled: true,
      },
    })
    await options.onSuccess(profileState)

    expect(mockPatchProfile).toHaveBeenCalledWith({
      onboarding: {
        status: 'completed',
      },
      payoutAccount: {
        accountHolderName: 'Joao Ferreira',
        iban: 'PT50000201231234567890154',
        rail: 'sepa',
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
    })
    expect(queryClient.setQueryData).toHaveBeenCalledWith(
      appQueryKeys.profile.state(),
      profileState,
    )
    expect(invalidateProfileQueries).toHaveBeenCalledWith(queryClient)
    expect(invalidateHomeQueries).toHaveBeenCalledWith(queryClient)
    expect(invalidateWalletQueries).toHaveBeenCalledWith(queryClient)
    expect(invalidateBarcodeQueries).toHaveBeenCalledWith(queryClient)
  })

  it('still sends enabled email alert preferences during setup completion', async () => {
    useCompleteProfileSetupMutation()
    const [options] = mockUseMutation.mock.calls[0]

    await options.mutationFn({
      snapshot: {
        payments: {
          accountHolderName: 'Joao Ferreira',
          iban: 'PT50000201231234567890154',
        },
        personal: {
          email: 'joao@volta.pt',
          name: 'Joao Ferreira',
          nif: '123456789',
          phoneNumber: '+351912345678',
        },
        preferences: {
          biometricsEnabled: false,
          pinEnabled: false,
          pushNotificationsEnabled: false,
        },
        alertsEnabled: false,
      },
    })

    expect(mockPatchProfile).toHaveBeenCalledWith({
      onboarding: {
        status: 'completed',
      },
      payoutAccount: {
        accountHolderName: 'Joao Ferreira',
        iban: 'PT50000201231234567890154',
        rail: 'sepa',
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
    })
  })
})
