import { z } from 'zod/v4'
import {
  type PayoutAccount,
  type PayoutAccountInput,
} from '@/features/profile/models'

function normalizeIban(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
}

function isPracticalPtIban(value: string) {
  return /^PT\d{19,23}$/.test(normalizeIban(value))
}

export const profilePaymentsRequestSchema = z.object({
  accountHolderName: z.string().trim().min(1).max(120),
  iban: z.string().regex(/^PT\d{19,23}$/),
})

export type ProfilePaymentsFormValues = {
  accountHolderName: string
  iban: string
}
export type ProfilePaymentsRequest = z.infer<
  typeof profilePaymentsRequestSchema
>

export type ProfilePaymentsValidationCopy = {
  accountHolderNameRequired: string
  ibanInvalid: string
  ibanRequired: string
}

export function getProfilePaymentsFormSchema(
  validation: ProfilePaymentsValidationCopy,
) {
  return z.object({
    accountHolderName: z
      .string()
      .trim()
      .min(1, validation.accountHolderNameRequired)
      .max(120),
    iban: z
      .string()
      .trim()
      .min(1, validation.ibanRequired)
      .refine((value) => isPracticalPtIban(value), validation.ibanInvalid),
  })
}

export function getProfilePaymentsFormDefaultValues(
  payments: PayoutAccount | null,
  fallbackAccountHolderName?: string | null,
): ProfilePaymentsFormValues {
  return {
    accountHolderName:
      payments?.accountHolderName ?? fallbackAccountHolderName ?? '',
    iban: '',
  }
}

export function toProfilePaymentsDraft(
  values: ProfilePaymentsFormValues,
): PayoutAccountInput {
  return {
    iban: normalizeIban(values.iban),
    rail: 'sepa',
  }
}

export function serializeProfilePaymentsForm(
  values: ProfilePaymentsFormValues,
): ProfilePaymentsRequest {
  return profilePaymentsRequestSchema.parse({
    accountHolderName: values.accountHolderName.trim(),
    iban: normalizeIban(values.iban),
  })
}
