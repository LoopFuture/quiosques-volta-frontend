import { z } from 'zod/v4'
import type { AppAuthIdentity } from '@/features/auth/models/identity'
import {
  devicePrivacySettingsSchema,
  getDefaultDevicePrivacySettings,
  getProfileMockData,
  profilePersonalSchema,
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
    iban: z.string(),
    spinEnabled: z.boolean(),
  }),
  personal: profilePersonalSchema,
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
  return identity?.email ?? fallbackEmail ?? getProfileMockData().personal.email
}

export function getProfileSetupSeedState({
  deviceSettings = getDefaultDevicePrivacySettings(),
  identity,
  profile = getProfileMockData(),
}: {
  deviceSettings?: DevicePrivacySettings
  identity?: Pick<AppAuthIdentity, 'email' | 'name'> | null
  profile?: ProfileResponse
} = {}) {
  const resolvedEmail = resolveIdentityEmail(identity, profile.personal.email)
  const resolvedName = identity?.name ?? profile.personal.name

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
        ...profile.preferences,
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
      iban: '',
      spinEnabled: profile.payoutAccount.spinEnabled,
    },
    personal: profile.personal,
    preferences: {
      biometricsEnabled: deviceSettings.biometricsEnabled,
      pushNotificationsEnabled: deviceSettings.pushNotificationsEnabled,
    },
  })
}
