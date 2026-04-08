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
    const query = useProfileQuery()
    const signal = new AbortController().signal

    expect(mockUseQuery).toHaveBeenCalledTimes(1)
    expect(query.queryKey).toEqual(appQueryKeys.profile.state())
    expect(query.enabled).toBe(true)
    expect(query.meta).toEqual({
      feature: 'profile',
      operation: 'profile-state',
    })

    await query.queryFn({
      signal,
    })

    expect(mockFetchProfileState).toHaveBeenCalledWith(signal)
  })

  it('allows the profile query to be disabled explicitly', () => {
    const query = useProfileQuery({
      enabled: false,
    })

    expect(query.enabled).toBe(false)
  })

  it('invalidates profile and barcode queries after updating personal data', async () => {
    const mutation = useUpdateProfilePersonalMutation()
    const patch = {
      personal: {
        name: 'Ana Silva',
      },
    }

    expect(mockUseMutation).toHaveBeenCalledTimes(1)
    expect(mutation.mutationKey).toEqual(
      appMutationKeys.profile.updatePersonal(),
    )
    expect(mutation.meta).toEqual({
      feature: 'profile',
      operation: 'update-personal',
      redactKeys: ['email', 'name', 'nif', 'phoneNumber'],
    })

    await mutation.mutationFn(patch)
    await mutation.onSuccess(profileState)

    expect(mockPatchProfile).toHaveBeenCalledWith(patch)
    expect(queryClient.setQueryData).toHaveBeenCalledWith(
      appQueryKeys.profile.state(),
      profileState,
    )
    expect(invalidateProfileQueries).toHaveBeenCalledWith(queryClient)
    expect(invalidateBarcodeQueries).toHaveBeenCalledWith(queryClient)
  })

  it('invalidates wallet and home queries after updating payments', async () => {
    const mutation = useUpdateProfilePaymentsMutation()
    const patch = {
      payoutAccount: {
        iban: 'PT50000201231234567890154',
        rail: 'sepa',
      },
    }

    expect(mutation.mutationKey).toEqual(
      appMutationKeys.profile.updatePayments(),
    )
    expect(mutation.meta).toEqual({
      feature: 'profile',
      operation: 'update-payments',
      redactKeys: ['iban'],
    })

    await mutation.mutationFn(patch)
    await mutation.onSuccess(profileState)

    expect(mockPatchProfile).toHaveBeenCalledWith(patch)
    expect(invalidateProfileQueries).toHaveBeenCalledWith(queryClient)
    expect(invalidateWalletQueries).toHaveBeenCalledWith(queryClient)
    expect(invalidateHomeQueries).toHaveBeenCalledWith(queryClient)
  })

  it('invalidates the profile query after updating preferences', async () => {
    const mutation = useUpdateProfilePreferencesMutation()
    const patch = {
      preferences: {
        alertsEmail: 'alerts@volta.pt',
      },
    }

    expect(mutation.mutationKey).toEqual(
      appMutationKeys.profile.updatePreferences(),
    )
    expect(mutation.meta).toEqual({
      feature: 'profile',
      operation: 'update-preferences',
      redactKeys: ['alertsEmail'],
    })

    await mutation.mutationFn(patch)
    await mutation.onSuccess(profileState)

    expect(mockPatchProfile).toHaveBeenCalledWith(patch)
    expect(invalidateProfileQueries).toHaveBeenCalledWith(queryClient)
    expect(invalidateHomeQueries).not.toHaveBeenCalled()
    expect(invalidateWalletQueries).not.toHaveBeenCalled()
    expect(invalidateBarcodeQueries).not.toHaveBeenCalled()
  })

  it('serializes setup completion and invalidates dependent queries', async () => {
    const mutation = useCompleteProfileSetupMutation()

    expect(mutation.mutationKey).toEqual(
      appMutationKeys.profile.completeSetup(),
    )
    expect(mutation.meta).toEqual({
      feature: 'profile',
      operation: 'complete-setup',
      redactKeys: ['email', 'iban', 'name', 'nif', 'phoneNumber'],
    })

    await mutation.mutationFn({
      snapshot: {
        payments: {
          iban: 'PT50000201231234567890154',
          spinEnabled: true,
        },
        personal: {
          email: 'joao@volta.pt',
          name: 'Joao Ferreira',
          nif: '123456789',
          phoneNumber: '+351912345678',
        },
        preferences: {
          biometricsEnabled: true,
          pushNotificationsEnabled: true,
        },
      },
    })
    await mutation.onSuccess(profileState)

    expect(mockPatchProfile).toHaveBeenCalledWith({
      onboarding: {
        status: 'completed',
      },
      payoutAccount: {
        iban: 'PT50000201231234567890154',
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
})
