import { z } from 'zod/v4'
import type { AppAuthIdentity } from '@/features/auth/models/identity'
import {
  devicePrivacySettingsSchema,
  getDefaultDevicePrivacySettings,
  profileResponseSchema,
  type DevicePrivacySettings,
  type ProfileResponse,
} from './profile'

const currentProfileSetupPreferencesSchema = z.object({
  biometricsEnabled: z.boolean(),
  pushNotificationsEnabled: z.boolean(),
})

const legacyProfileSetupPreferencesSchema = z.object({
  biometricsEnabled: z.boolean(),
  notificationsAccepted: z.boolean(),
})

const EMPTY_PROFILE_EMAIL = 'setup@volta.invalid'

export const profileSetupPreferencesSchema = z
  .union([
    currentProfileSetupPreferencesSchema,
    legacyProfileSetupPreferencesSchema,
  ])
  .transform((preferences) => ({
    biometricsEnabled: preferences.biometricsEnabled,
    pushNotificationsEnabled:
      'pushNotificationsEnabled' in preferences
        ? preferences.pushNotificationsEnabled
        : preferences.notificationsAccepted,
  }))

export const profileSetupSnapshotSchema = z.object({
  payments: z.object({
    accountHolderName: z.string(),
    iban: z.string(),
  }),
  personal: z.object({
    email: z.string().email(),
    name: z.string(),
    nif: z.string(),
    phoneNumber: z.string(),
  }),
  preferences: profileSetupPreferencesSchema,
})

export type ProfileSetupSnapshot = z.infer<typeof profileSetupSnapshotSchema>
export type ProfileSetupPreferences = z.infer<
  typeof profileSetupPreferencesSchema
>

function resolveIdentityEmail(
  identity?: Pick<AppAuthIdentity, 'email'> | null,
  fallbackEmail?: string,
) {
  return identity?.email ?? fallbackEmail ?? ''
}

function createEmptyProfileResponse() {
  return profileResponseSchema.parse({
    memberSince: '',
    onboarding: {
      completedAt: null,
      status: 'in_progress',
    },
    payoutAccount: null,
    personal: {
      email: EMPTY_PROFILE_EMAIL,
      name: null,
      nif: null,
      phoneNumber: null,
    },
    preferences: null,
    stats: {
      completedTransfersCount: 0,
      creditsEarned: {
        amountMinor: 0,
        currency: 'EUR',
      },
      processingTransfersCount: 0,
      returnedPackagesCount: 0,
    },
  })
}

export function getProfileSetupSeedState({
  deviceSettings = getDefaultDevicePrivacySettings(),
  identity,
  profile = createEmptyProfileResponse(),
}: {
  deviceSettings?: DevicePrivacySettings
  identity?: Pick<AppAuthIdentity, 'email' | 'name'> | null
  profile?: ProfileResponse
} = {}) {
  const resolvedEmail = resolveIdentityEmail(identity, profile.personal.email)
  const resolvedName = identity?.name ?? profile.personal.name ?? null

  return {
    deviceSettings: devicePrivacySettingsSchema.parse(deviceSettings),
    profile: profileResponseSchema.parse({
      ...profile,
      onboarding: {
        ...profile.onboarding,
        status: 'in_progress',
      },
      personal: {
        ...profile.personal,
        email: resolvedEmail,
        name: resolvedName,
      },
      preferences: {
        ...(profile.preferences ?? {
          alertsEnabled: false,
        }),
        alertsEmail: resolvedEmail,
      },
    }),
  }
}

export function getProfileSetupSnapshotFromProfile(
  profile: ProfileResponse,
  deviceSettings: DevicePrivacySettings = getDefaultDevicePrivacySettings(),
): ProfileSetupSnapshot {
  return profileSetupSnapshotSchema.parse({
    payments: {
      accountHolderName:
        profile.payoutAccount?.accountHolderName ?? profile.personal.name ?? '',
      iban: '',
    },
    personal: {
      email: profile.personal.email,
      name: profile.personal.name ?? '',
      nif: profile.personal.nif ?? '',
      phoneNumber: profile.personal.phoneNumber ?? '',
    },
    preferences: {
      biometricsEnabled: deviceSettings.biometricsEnabled,
      pushNotificationsEnabled: deviceSettings.pushNotificationsEnabled,
    },
  })
}
