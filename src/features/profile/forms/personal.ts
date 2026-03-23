import { z } from 'zod/v4'
import {
  profilePhoneNumberSchema,
  profilePersonalSchema,
  type ProfilePersonal,
} from '@/features/profile/models'

function normalizeNif(value: string) {
  return value.replace(/\D/g, '')
}

function normalizePhoneNumber(value: string) {
  const trimmedValue = value.trim()
  const digitsOnlyValue = trimmedValue.replace(/\D/g, '')

  return trimmedValue.startsWith('+') ? `+${digitsOnlyValue}` : digitsOnlyValue
}

export const profilePersonalRequestSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  nif: z.string().regex(/^\d{9}$/),
  phoneNumber: profilePhoneNumberSchema,
})

export type ProfilePersonalFormValues = ProfilePersonal
export type ProfilePersonalRequest = z.infer<
  typeof profilePersonalRequestSchema
>

export type ProfilePersonalValidationCopy = {
  emailInvalid: string
  emailRequired: string
  nameRequired: string
  nifInvalid: string
  nifRequired: string
  phoneNumberInvalid: string
  phoneNumberRequired: string
}

export function getProfilePersonalFormSchema(
  validation: ProfilePersonalValidationCopy,
) {
  return z.object({
    email: z
      .string()
      .trim()
      .min(1, validation.emailRequired)
      .email(validation.emailInvalid),
    name: z.string().trim().min(1, validation.nameRequired),
    phoneNumber: z
      .string()
      .trim()
      .min(1, validation.phoneNumberRequired)
      .refine(
        (value) =>
          value.length === 0 ||
          profilePhoneNumberSchema.safeParse(normalizePhoneNumber(value))
            .success,
        validation.phoneNumberInvalid,
      ),
    nif: z
      .string()
      .trim()
      .min(1, validation.nifRequired)
      .refine(
        (value) => normalizeNif(value).length === 9,
        validation.nifInvalid,
      ),
  })
}

export function getProfilePersonalFormDefaultValues(
  personal: ProfilePersonal,
): ProfilePersonalFormValues {
  return {
    email: personal.email,
    name: personal.name,
    nif: personal.nif,
    phoneNumber: personal.phoneNumber,
  }
}

export function toProfilePersonalDraft(
  values: ProfilePersonalFormValues,
): ProfilePersonal {
  return profilePersonalSchema.parse({
    email: values.email.trim(),
    name: values.name.trim(),
    nif: normalizeNif(values.nif),
    phoneNumber: normalizePhoneNumber(values.phoneNumber),
  })
}

export function serializeProfilePersonalForm(
  values: ProfilePersonalFormValues,
): ProfilePersonalRequest {
  return profilePersonalRequestSchema.parse({
    email: values.email.trim(),
    name: values.name.trim(),
    nif: normalizeNif(values.nif),
    phoneNumber: normalizePhoneNumber(values.phoneNumber),
  })
}
