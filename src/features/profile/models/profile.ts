import { z } from 'zod/v4'
import {
  devicePrivacySettingsSchema,
  getDefaultDevicePrivacySettings,
  type DevicePrivacySettings,
} from '@/features/app-data/storage/device/privacy'
import { moneySchema, toneSchema } from '@/features/app-data/models'

export const themeModeSchema = z.enum(['system', 'light', 'dark'])
export const languageModeSchema = z.enum(['system', 'pt', 'en'])
const rawPayoutRailSchema = z.enum(['sepa', 'spin'])
export const payoutRailSchema = z.literal('sepa')
export const profilePhoneNumberSchema = z.string().regex(/^\+[1-9]\d{7,14}$/)

function normalizeOptionalPayoutAccountName(value: string | null | undefined) {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmedValue = value.trim()

  return trimmedValue.length > 0 ? trimmedValue : undefined
}

export const profilePersonalSchema = z.object({
  email: z.string().email(),
  name: z.string().nullable(),
  nif: z.string().nullable(),
  phoneNumber: profilePhoneNumberSchema.nullable(),
})

const rawPayoutAccountSchema = z.object({
  accountHolderName: z.string().nullable().optional(),
  ibanMasked: z.string(),
  rail: rawPayoutRailSchema,
  spinEnabled: z.boolean().optional(),
})

export const payoutAccountSchema = rawPayoutAccountSchema.transform(
  ({ accountHolderName, ibanMasked }) => {
    const normalizedAccountHolderName =
      normalizeOptionalPayoutAccountName(accountHolderName)

    return {
      ...(normalizedAccountHolderName
        ? {
            accountHolderName: normalizedAccountHolderName,
          }
        : {}),
      ibanMasked,
      rail: 'sepa' as const,
    }
  },
)

export const payoutAccountInputSchema = z
  .object({
    iban: z.string().regex(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/),
    rail: rawPayoutRailSchema.optional(),
    spinEnabled: z.boolean().optional(),
  })
  .transform((value) => {
    return {
      iban: value.iban,
      rail: 'sepa' as const,
    }
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

export const profileOnboardingPatchSchema = z.object({
  status: onboardingStatusSchema,
})

export const profilePersonalPatchSchema = z
  .object({
    email: z.string().email().optional(),
    name: z.string().min(2).max(120).optional(),
    nif: z
      .string()
      .regex(/^\d{9}$/)
      .optional(),
    phoneNumber: profilePhoneNumberSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0)

export const profileResponseSchema = z.object({
  memberSince: z.string(),
  onboarding: onboardingSchema,
  payoutAccount: payoutAccountSchema.nullable(),
  personal: profilePersonalSchema,
  preferences: profilePreferencesSchema.nullable(),
  stats: profileSummaryMetricsSchema,
})

export const profilePatchRequestSchema = z
  .object({
    onboarding: profileOnboardingPatchSchema.optional(),
    payoutAccount: payoutAccountInputSchema.optional(),
    personal: profilePersonalPatchSchema.optional(),
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
export type PayoutRail = z.infer<typeof payoutRailSchema>
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
