import { z } from 'zod/v4'
import { profilePhoneNumberSchema } from '../models'
import {
  profileSetupSnapshotSchema,
  type ProfileSetupSnapshot,
} from '../models'

function normalizeNif(value: string) {
  return value.replace(/\D/g, '')
}

function normalizePhoneNumber(value: string) {
  const trimmedValue = value.trim()
  const digitsOnlyValue = trimmedValue.replace(/\D/g, '')

  return trimmedValue.startsWith('+') ? `+${digitsOnlyValue}` : digitsOnlyValue
}

function normalizeIban(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
}

function isPracticalPtIban(value: string) {
  return /^PT\d{19,23}$/.test(normalizeIban(value))
}

export type ProfileSetupFormValues = {
  accountHolderName: string
  biometricsEnabled: boolean
  email: string
  iban: string
  name: string
  nif: string
  pinEnabled: boolean
  phoneNumber: string
  pushNotificationsEnabled: boolean
}

export type ProfileSetupValidationCopy = {
  payments: {
    accountHolderNameRequired: string
    ibanInvalid: string
    ibanRequired: string
  }
  personal: {
    emailInvalid: string
    emailRequired: string
    nameRequired: string
    nifInvalid: string
    nifRequired: string
    phoneNumberInvalid: string
    phoneNumberRequired: string
  }
}

export function getProfileSetupFormSchema(
  validation: ProfileSetupValidationCopy,
) {
  return z.object({
    accountHolderName: z
      .string()
      .trim()
      .min(1, validation.payments.accountHolderNameRequired)
      .max(120),
    biometricsEnabled: z.boolean(),
    email: z
      .string()
      .trim()
      .min(1, validation.personal.emailRequired)
      .email(validation.personal.emailInvalid),
    iban: z
      .string()
      .trim()
      .min(1, validation.payments.ibanRequired)
      .refine(
        (value) => isPracticalPtIban(value),
        validation.payments.ibanInvalid,
      ),
    name: z.string().trim().min(1, validation.personal.nameRequired),
    phoneNumber: z
      .string()
      .trim()
      .min(1, validation.personal.phoneNumberRequired)
      .refine(
        (value) =>
          value.length === 0 ||
          profilePhoneNumberSchema.safeParse(normalizePhoneNumber(value))
            .success,
        validation.personal.phoneNumberInvalid,
      ),
    nif: z
      .string()
      .trim()
      .min(1, validation.personal.nifRequired)
      .refine(
        (value) => normalizeNif(value).length === 9,
        validation.personal.nifInvalid,
      ),
    pinEnabled: z.boolean(),
    pushNotificationsEnabled: z.boolean(),
  })
}

export function getProfileSetupFormDefaultValues(
  snapshot: ProfileSetupSnapshot,
): ProfileSetupFormValues {
  return {
    accountHolderName: snapshot.payments.accountHolderName,
    biometricsEnabled: snapshot.preferences.biometricsEnabled,
    email: snapshot.personal.email,
    iban: snapshot.payments.iban,
    name: snapshot.personal.name,
    nif: snapshot.personal.nif,
    pinEnabled: snapshot.preferences.pinEnabled,
    phoneNumber: snapshot.personal.phoneNumber,
    pushNotificationsEnabled: snapshot.preferences.pushNotificationsEnabled,
  }
}

export function toProfileSetupSnapshot(
  values: ProfileSetupFormValues,
): ProfileSetupSnapshot {
  return profileSetupSnapshotSchema.parse({
    payments: {
      accountHolderName: values.accountHolderName.trim(),
      iban: normalizeIban(values.iban),
    },
    personal: {
      email: values.email.trim(),
      name: values.name.trim(),
      nif: normalizeNif(values.nif),
      phoneNumber: normalizePhoneNumber(values.phoneNumber),
    },
    preferences: {
      biometricsEnabled: values.biometricsEnabled,
      pinEnabled: values.pinEnabled,
      pushNotificationsEnabled: values.pushNotificationsEnabled,
    },
  })
}
