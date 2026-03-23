import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  appMutationKeys,
  appQueryKeys,
  invalidateBarcodeQueries,
  invalidateHomeQueries,
  invalidateProfileQueries,
  invalidateWalletQueries,
} from '@/features/app-data/query'
import { patchProfile, fetchProfileState } from '../api'
import type { ProfilePatchRequest } from '../models'
import type { ProfileSetupSnapshot } from '../models/setup'

export function useProfileQuery({
  enabled = true,
}: {
  enabled?: boolean
} = {}) {
  return useQuery({
    enabled,
    meta: {
      feature: 'profile',
      operation: 'profile-state',
    },
    queryFn: ({ signal }) => fetchProfileState(signal),
    queryKey: appQueryKeys.profile.state(),
  })
}

function usePatchProfileMutation({
  mutationKey,
  onSuccessInvalidate,
  operation,
  redactKeys,
}: {
  mutationKey: readonly unknown[]
  onSuccessInvalidate: (
    queryClient: ReturnType<typeof useQueryClient>,
  ) => Promise<void> | void
  operation: string
  redactKeys?: readonly string[]
}) {
  const queryClient = useQueryClient()

  return useMutation({
    meta: {
      feature: 'profile',
      operation,
      redactKeys,
    },
    mutationFn: (patch: ProfilePatchRequest) => patchProfile(patch),
    mutationKey,
    onSuccess: async (profileState) => {
      queryClient.setQueryData(appQueryKeys.profile.state(), profileState)
      await invalidateProfileQueries(queryClient)
      await onSuccessInvalidate(queryClient)
    },
  })
}

export function useUpdateProfilePersonalMutation() {
  return usePatchProfileMutation({
    mutationKey: appMutationKeys.profile.updatePersonal(),
    onSuccessInvalidate: (queryClient) => invalidateBarcodeQueries(queryClient),
    operation: 'update-personal',
    redactKeys: ['email', 'name', 'nif', 'phoneNumber'],
  })
}

export function useUpdateProfilePaymentsMutation() {
  return usePatchProfileMutation({
    mutationKey: appMutationKeys.profile.updatePayments(),
    onSuccessInvalidate: async (queryClient) => {
      await invalidateWalletQueries(queryClient)
      await invalidateHomeQueries(queryClient)
    },
    operation: 'update-payments',
    redactKeys: ['iban'],
  })
}

export function useUpdateProfilePreferencesMutation() {
  return usePatchProfileMutation({
    mutationKey: appMutationKeys.profile.updatePreferences(),
    onSuccessInvalidate: () => undefined,
    operation: 'update-preferences',
    redactKeys: ['alertsEmail'],
  })
}

export function useCompleteProfileSetupMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    meta: {
      feature: 'profile',
      operation: 'complete-setup',
      redactKeys: ['email', 'iban', 'name', 'nif', 'phoneNumber'],
    },
    mutationFn: async ({ snapshot }: { snapshot: ProfileSetupSnapshot }) =>
      patchProfile({
        payoutAccount: snapshot.payments,
        personal: snapshot.personal,
        preferences: {
          alertsEmail: snapshot.personal.email,
          alertsEnabled: true,
        },
      }),
    mutationKey: appMutationKeys.profile.completeSetup(),
    onSuccess: async (profileState) => {
      queryClient.setQueryData(appQueryKeys.profile.state(), profileState)
      await invalidateProfileQueries(queryClient)
      await invalidateHomeQueries(queryClient)
      await invalidateWalletQueries(queryClient)
      await invalidateBarcodeQueries(queryClient)
    },
  })
}
