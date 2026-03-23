import { z } from 'zod/v4'
import {
  devicePrivacySettingsSchema,
  getDefaultDevicePrivacySettings,
  type DevicePrivacySettings,
} from '@/features/app-data/storage/device/privacy'
import { moneySchema, toneSchema } from '@/features/app-data/models'

export const themeModeSchema = z.enum(['system', 'light', 'dark'])
export const languageModeSchema = z.enum(['system', 'pt', 'en'])
export const profilePhoneNumberSchema = z.string().regex(/^\+[1-9]\d{7,14}$/)

export const profilePersonalSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  nif: z.string().regex(/^\d{9}$/),
  phoneNumber: profilePhoneNumberSchema,
})

export const payoutAccountSchema = z.object({
  ibanMasked: z.string(),
  spinEnabled: z.boolean(),
})

export const payoutAccountInputSchema = z.object({
  iban: z.string().regex(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/),
  spinEnabled: z.boolean(),
})

export const profilePreferencesSchema = z.object({
  alertsEmail: z.string().email(),
  alertsEnabled: z.boolean(),
})

export const profilePreferencesPatchSchema = z
  .object({
    alertsEmail: z.string().email().optional(),
    alertsEnabled: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0)

export const profileSummaryMetricsSchema = z.object({
  completedTransfersCount: z.number().int().nonnegative(),
  creditsEarned: moneySchema,
  processingTransfersCount: z.number().int().nonnegative(),
  returnedPackagesCount: z.number().int().nonnegative(),
})

export const onboardingStatusSchema = z.enum([
  'not_started',
  'in_progress',
  'completed',
])

export const onboardingSchema = z.object({
  completedAt: z.string().nullable().optional(),
  status: onboardingStatusSchema,
})

export const profileResponseSchema = z.object({
  memberSince: z.string(),
  onboarding: onboardingSchema,
  payoutAccount: payoutAccountSchema,
  personal: profilePersonalSchema,
  preferences: profilePreferencesSchema,
  stats: profileSummaryMetricsSchema,
})

export const profilePatchRequestSchema = z
  .object({
    payoutAccount: payoutAccountInputSchema.optional(),
    personal: profilePersonalSchema
      .partial()
      .refine((value) => Object.keys(value).length > 0)
      .optional(),
    preferences: profilePreferencesPatchSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0)

export type ProfilePersonal = z.infer<typeof profilePersonalSchema>
export type PayoutAccount = z.infer<typeof payoutAccountSchema>
export type PayoutAccountInput = z.infer<typeof payoutAccountInputSchema>
export type ProfilePreferences = z.infer<typeof profilePreferencesSchema>
export type ProfileSummaryMetrics = z.infer<typeof profileSummaryMetricsSchema>
export type Onboarding = z.infer<typeof onboardingSchema>
export type ProfileResponse = z.infer<typeof profileResponseSchema>
export type ProfilePatchRequest = z.infer<typeof profilePatchRequestSchema>
export {
  devicePrivacySettingsSchema,
  getDefaultDevicePrivacySettings,
  type DevicePrivacySettings,
}

export const profileSummaryStatSchema = z.object({
  helper: z.string().optional(),
  label: z.string(),
  tone: toneSchema.optional(),
  value: z.string(),
})

const profileHubPreviewRowSchema = z.object({
  label: z.string(),
  value: z.string(),
})

export const profileHubSectionIdSchema = z.enum([
  'personal',
  'privacy',
  'payments',
  'appSettings',
])

export const profileHubSectionSchema = z.object({
  id: profileHubSectionIdSchema,
  previewRows: z.array(profileHubPreviewRowSchema),
  summary: z.string(),
  title: z.string(),
})

export type ProfileSummaryStat = z.infer<typeof profileSummaryStatSchema>
export type ProfileHubSection = z.infer<typeof profileHubSectionSchema>

export function getProfileMockData(): ProfileResponse {
  return profileResponseSchema.parse({
    memberSince: '2023-10-01T00:00:00',
    onboarding: {
      completedAt: '2023-10-05T12:00:00',
      status: 'completed',
    },
    payoutAccount: {
      ibanMasked: 'PT50************90123',
      spinEnabled: true,
    },
    personal: {
      email: 'joao.ferreira@sdr.pt',
      name: 'Joao Ferreira',
      nif: '234567890',
      phoneNumber: '+351912345678',
    },
    preferences: {
      alertsEmail: 'joao.ferreira@sdr.pt',
      alertsEnabled: true,
    },
    stats: {
      completedTransfersCount: 2,
      creditsEarned: {
        amountMinor: 150,
        currency: 'EUR',
      },
      processingTransfersCount: 1,
      returnedPackagesCount: 30,
    },
  })
}
