import { z } from 'zod/v4'
import {
  payoutAccountInputSchema,
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
  iban: z.string().regex(/^PT\d{19,23}$/),
  spinEnabled: z.boolean(),
})

export type ProfilePaymentsFormValues = PayoutAccountInput
export type ProfilePaymentsRequest = z.infer<
  typeof profilePaymentsRequestSchema
>

export type ProfilePaymentsValidationCopy = {
  ibanInvalid: string
  ibanRequired: string
}

export function getProfilePaymentsFormSchema(
  validation: ProfilePaymentsValidationCopy,
) {
  return z.object({
    iban: z
      .string()
      .trim()
      .min(1, validation.ibanRequired)
      .refine((value) => isPracticalPtIban(value), validation.ibanInvalid),
    spinEnabled: z.boolean(),
  })
}

export function getProfilePaymentsFormDefaultValues(
  payments: PayoutAccount,
): ProfilePaymentsFormValues {
  return {
    iban: '',
    spinEnabled: payments.spinEnabled,
  }
}

export function toProfilePaymentsDraft(
  values: ProfilePaymentsFormValues,
): PayoutAccountInput {
  return payoutAccountInputSchema.parse({
    iban: normalizeIban(values.iban),
    spinEnabled: values.spinEnabled,
  })
}

export function serializeProfilePaymentsForm(
  values: ProfilePaymentsFormValues,
): ProfilePaymentsRequest {
  return profilePaymentsRequestSchema.parse({
    iban: normalizeIban(values.iban),
    spinEnabled: values.spinEnabled,
  })
}
