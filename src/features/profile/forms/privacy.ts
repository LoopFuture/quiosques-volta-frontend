import { z } from 'zod/v4'
import {
  profilePreferencesSchema,
  type DevicePrivacySettings,
  type ProfilePreferences,
} from '@/features/profile/models'

export const profilePrivacyRequestSchema = z.object({
  alertsEmail: z.string().email(),
  alertsEnabled: z.boolean(),
})

export type ProfilePrivacyFormValues = DevicePrivacySettings &
  ProfilePreferences
export type ProfilePrivacyRequest = z.infer<typeof profilePrivacyRequestSchema>

export type ProfilePrivacyValidationCopy = {
  alertsEmailInvalid: string
  alertsEmailRequired: string
}

export function getProfilePrivacyFormSchema(
  _validation: ProfilePrivacyValidationCopy,
) {
  return z.object({
    alertsEmail: z.string().email(),
    alertsEnabled: z.boolean(),
    biometricsEnabled: z.boolean(),
    pushNotificationsEnabled: z.boolean(),
  })
}

export function getProfilePrivacyFormDefaultValues(
  values: ProfilePrivacyFormValues,
): ProfilePrivacyFormValues {
  return {
    alertsEmail: values.alertsEmail,
    alertsEnabled: values.alertsEnabled,
    biometricsEnabled: values.biometricsEnabled,
    pushNotificationsEnabled: values.pushNotificationsEnabled,
  }
}

export function toProfilePreferencesDraft(
  values: ProfilePrivacyFormValues,
): ProfilePreferences {
  return profilePreferencesSchema.parse({
    alertsEmail: values.alertsEmail.trim(),
    alertsEnabled: values.alertsEnabled,
  })
}

export function serializeProfilePrivacyForm(
  values: ProfilePrivacyFormValues,
): ProfilePrivacyRequest {
  return profilePrivacyRequestSchema.parse({
    alertsEmail: values.alertsEmail.trim(),
    alertsEnabled: values.alertsEnabled,
  })
}
