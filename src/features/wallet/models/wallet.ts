import { z } from 'zod/v4'
import {
  detailItemSchema,
  moneySchema,
  timelineItemStateSchema,
  toneSchema,
  pageInfoSchema,
} from '@/features/app-data/models'
import {
  formatCompactNumber,
  formatCurrencyFromCents,
  formatNumber,
  formatShortDateTime,
} from '@/i18n/format'

export const walletTransactionTypeSchema = z.enum([
  'credit',
  'transfer_debit',
  'adjustment',
])
export const walletTransactionStatusSchema = z.enum([
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
])
export const walletHistoryFilterSchema = z.enum(['all', 'credit', 'transfer'])
const rawPayoutRailSchema = z.enum(['sepa', 'spin'])
export const payoutRailSchema = z.literal('sepa')

function normalizeOptionalPayoutAccountName(value: string | null | undefined) {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmedValue = value.trim()

  return trimmedValue.length > 0 ? trimmedValue : undefined
}

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

export const transferEligibilitySchema = z.object({
  canTransfer: z.boolean(),
  maximumTransfer: moneySchema,
  minimumTransfer: moneySchema,
  reason: z.string().nullable().optional(),
})

export const activityPreviewSchema = z.object({
  amount: moneySchema,
  id: z.string(),
  occurredAt: z.string(),
  status: walletTransactionStatusSchema,
  subtitle: z.string().nullable().optional(),
  title: z.string(),
  type: walletTransactionTypeSchema,
})

export const creditDetailsSchema = z.object({
  locationName: z.string(),
  packageCount: z.number().int().nonnegative(),
})

export const transferDetailsSchema = z.object({
  expectedArrivalAt: z.string().nullable().optional(),
  failureReason: z.string().nullable().optional(),
  payoutAccount: payoutAccountSchema.optional(),
  requestedAt: z.string(),
})

export const walletTransactionSchema = z.object({
  amount: moneySchema,
  creditDetails: creditDetailsSchema.optional(),
  description: z.string().nullable().optional(),
  id: z.string(),
  occurredAt: z.string(),
  status: walletTransactionStatusSchema,
  transferDetails: transferDetailsSchema.optional(),
  type: walletTransactionTypeSchema,
})

export const walletResponseSchema = z.object({
  balance: moneySchema,
  recentTransactions: z.array(activityPreviewSchema),
  stats: z.object({
    completedTransfersCount: z.number().int().nonnegative(),
    creditsEarned: moneySchema,
    processingTransfersCount: z.number().int().nonnegative(),
    returnedPackagesCount: z.number().int().nonnegative(),
  }),
  transferEligibility: transferEligibilitySchema,
})

export const walletTransactionResponseSchema = z.object({
  transaction: walletTransactionSchema,
})

export const walletTransactionListResponseSchema = z.object({
  items: z.array(walletTransactionSchema),
  pageInfo: pageInfoSchema,
})

export const walletTransferRequestSchema = z.object({
  amount: moneySchema,
})

export const createTransferResponseSchema = z.object({
  balanceAfter: moneySchema,
  createdAt: z.string(),
  status: walletTransactionStatusSchema,
  transferId: z.string(),
})

export const walletTransferTimelineStepIdSchema = z.enum([
  'received',
  'account-confirmed',
  'sending',
  'completed',
])

export const walletTransferTimelineStepSchema = z.object({
  id: walletTransferTimelineStepIdSchema,
  state: timelineItemStateSchema,
})

export type WalletTransactionType = z.infer<typeof walletTransactionTypeSchema>
export type WalletTransactionStatus = z.infer<
  typeof walletTransactionStatusSchema
>
export type WalletHistoryFilter = z.infer<typeof walletHistoryFilterSchema>
export type ActivityPreview = z.infer<typeof activityPreviewSchema>
export type WalletTransaction = z.infer<typeof walletTransactionSchema>
export type WalletResponse = z.infer<typeof walletResponseSchema>
export type WalletTransactionResponse = z.infer<
  typeof walletTransactionResponseSchema
>
export type WalletTransactionListResponse = z.infer<
  typeof walletTransactionListResponseSchema
>
export type WalletTransferRequest = z.infer<typeof walletTransferRequestSchema>
export type CreateTransferResponse = z.infer<
  typeof createTransferResponseSchema
>
export type WalletTransferTimelineStep = z.infer<
  typeof walletTransferTimelineStepSchema
>

type Tone = z.infer<typeof toneSchema>

export function formatWalletAmount(amountMinor: number, locale: string) {
  return formatCurrencyFromCents(amountMinor, locale)
}

export function formatWalletCompactAmount(amountMinor: number, locale: string) {
  return formatCurrencyFromCents(amountMinor, locale, {
    compact: true,
  })
}

export function formatWalletCount(value: number, locale: string) {
  return formatNumber(value, locale)
}

export function formatWalletCompactCount(value: number, locale: string) {
  return formatCompactNumber(value, locale)
}

export function formatWalletDateTime(value: string, locale: string) {
  return formatShortDateTime(value, locale)
}

export function formatWalletPaymentAccount(paymentAccount: {
  accountHolderName?: string
  ibanMasked: string
  rail: z.infer<typeof payoutRailSchema>
}) {
  return paymentAccount.accountHolderName
    ? `${paymentAccount.accountHolderName} · ${paymentAccount.ibanMasked}`
    : paymentAccount.ibanMasked
}

export function isTransferTransaction(
  transaction: Pick<ActivityPreview | WalletTransaction, 'type'>,
) {
  return transaction.type === 'transfer_debit'
}

export function getWalletTransactionAmountTone(
  transaction: Pick<ActivityPreview | WalletTransaction, 'amount'>,
): Tone {
  return transaction.amount.amountMinor >= 0 ? 'success' : 'accent'
}

export function getWalletTransactionBadgeTone(
  transaction: Pick<ActivityPreview | WalletTransaction, 'status' | 'type'>,
): Tone {
  if (transaction.status === 'failed' || transaction.status === 'cancelled') {
    return 'error'
  }

  if (transaction.status === 'pending' || transaction.status === 'processing') {
    return 'warning'
  }

  return transaction.type === 'credit' ? 'success' : 'accent'
}

export function getWalletTransactionStateTone(
  transaction: Pick<WalletTransaction, 'status' | 'type'>,
): Tone {
  return getWalletTransactionBadgeTone(transaction)
}

export function getWalletMovementStateTone(
  transaction: Pick<WalletTransaction, 'status' | 'type'>,
) {
  return getWalletTransactionStateTone(transaction)
}

export function getWalletTransactionById(
  transactionId: string,
  transactions: WalletTransaction[],
) {
  return transactions.find((transaction) => transaction.id === transactionId)
}

export function getWalletTransferTimelineSteps(
  transaction: Pick<WalletTransaction, 'status'>,
) {
  const isCompleted = transaction.status === 'completed'

  return z.array(walletTransferTimelineStepSchema).parse([
    {
      id: 'received',
      state: 'done',
    },
    {
      id: 'account-confirmed',
      state: 'done',
    },
    {
      id: 'sending',
      state: isCompleted ? 'done' : 'current',
    },
    {
      id: 'completed',
      state: isCompleted ? 'done' : 'upcoming',
    },
  ])
}

export function getWalletTransactionDetailItemsBase(
  items: z.input<typeof detailItemSchema>[],
) {
  return detailItemSchema.array().parse(items)
}
