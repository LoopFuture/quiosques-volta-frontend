import { z } from 'zod/v4'
import { walletTransferRequestSchema } from '@/features/wallet/models'
export type WalletTransferFormValues = {
  amount: string
}

export type WalletTransferRequest = z.infer<typeof walletTransferRequestSchema>
export { walletTransferRequestSchema }

export type WalletTransferValidationCopy = {
  amountFieldHelper: string
  exceedsBalanceError: string
  zeroAmountError: string
}

export function normalizeTransferAmountInput(value: string) {
  let normalizedValue = ''
  let hasSeparator = false
  let decimalCount = 0

  for (const character of value.replace(/[^\d.,]/g, '')) {
    if (character === ',' || character === '.') {
      if (hasSeparator) {
        continue
      }

      hasSeparator = true
      normalizedValue = normalizedValue.length === 0 ? '0' : normalizedValue
      normalizedValue += character
      continue
    }

    if (hasSeparator) {
      if (decimalCount >= 2) {
        continue
      }

      decimalCount += 1
    }

    normalizedValue += character
  }

  return normalizedValue
}

export function parseTransferAmountCents(value: string) {
  if (value.length === 0) {
    return null
  }

  const normalizedValue = value.replace(',', '.')
  const [wholePart = '', decimalPart = ''] = normalizedValue.split('.')

  if (!/^\d*$/.test(wholePart) || !/^\d*$/.test(decimalPart)) {
    return null
  }

  const euros = Number(wholePart || '0')
  const cents = Number((decimalPart + '00').slice(0, 2))

  return euros * 100 + cents
}

export function getWalletTransferAmountError(
  value: string,
  availableBalanceCents: number,
  validation: WalletTransferValidationCopy,
) {
  if (value.length === 0) {
    return undefined
  }

  const amountCents = parseTransferAmountCents(value)

  if (amountCents === null || amountCents <= 0) {
    return validation.zeroAmountError
  }

  if (amountCents > availableBalanceCents) {
    return validation.exceedsBalanceError
  }

  return undefined
}

export function getWalletTransferFormSchema(
  availableBalanceCents: number,
  validation: WalletTransferValidationCopy,
) {
  return z.object({
    amount: z
      .string()
      .refine((value) => {
        const amountCents = parseTransferAmountCents(value)

        return amountCents !== null && amountCents > 0
      }, validation.zeroAmountError)
      .refine((value) => {
        const amountCents = parseTransferAmountCents(value)

        return amountCents !== null && amountCents <= availableBalanceCents
      }, validation.exceedsBalanceError),
  })
}

export function getWalletTransferFormDefaultValues(): WalletTransferFormValues {
  return {
    amount: '',
  }
}

export function serializeWalletTransferForm(
  values: WalletTransferFormValues,
): WalletTransferRequest {
  const amountCents = parseTransferAmountCents(values.amount)

  return walletTransferRequestSchema.parse({
    amount: {
      amountMinor: amountCents ?? 0,
      currency: 'EUR',
    },
  })
}
