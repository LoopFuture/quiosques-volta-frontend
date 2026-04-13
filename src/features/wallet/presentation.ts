import type { TFunction } from 'i18next'
import {
  detailItemSchema,
  timelineItemSchema,
} from '@/features/app-data/models'
import {
  formatWalletAmount,
  formatWalletCount,
  formatWalletDateTime,
  formatWalletLongDate,
  formatWalletPaymentAccount,
  getWalletTransferTimelineSteps,
  isTransferTransaction,
  type ActivityPreview,
  type WalletHistoryFilter,
  type WalletTransaction,
} from './models'

const timelineTranslationKeyMap = {
  'account-confirmed': 'accountConfirmed',
  completed: 'completed',
  received: 'received',
  sending: 'sending',
} as const

export function getWalletHistoryFilterOptions(t: TFunction) {
  return [
    { label: t('tabScreens.wallet.filters.all'), value: 'all' as const },
    { label: t('tabScreens.wallet.filters.credits'), value: 'credit' as const },
    {
      label: t('tabScreens.wallet.filters.transfers'),
      value: 'transfer' as const,
    },
  ] satisfies { label: string; value: WalletHistoryFilter }[]
}

export function matchesWalletHistoryFilter(
  filter: WalletHistoryFilter,
  transaction: WalletTransaction,
) {
  if (filter === 'all') {
    return true
  }

  if (filter === 'transfer') {
    return isTransferTransaction(transaction)
  }

  return transaction.type === 'credit'
}

export function getWalletMovementBadgeLabel(
  t: TFunction,
  movement: ActivityPreview | WalletTransaction,
) {
  if (movement.status === 'pending' || movement.status === 'processing') {
    return t('tabScreens.wallet.badges.transferProcessing')
  }

  if (movement.status === 'failed') {
    return t('tabScreens.wallet.badges.transferFailed')
  }

  if (movement.status === 'cancelled') {
    return t('tabScreens.wallet.badges.transferCancelled')
  }

  return movement.type === 'credit'
    ? t('tabScreens.wallet.badges.credit')
    : t('tabScreens.wallet.badges.transferCompleted')
}

export function getWalletMovementTitle(
  t: TFunction,
  movement: ActivityPreview | WalletTransaction,
) {
  if ('title' in movement) {
    return movement.title
  }

  if (movement.type === 'credit') {
    return movement.creditDetails?.locationName ?? movement.description ?? '-'
  }

  if (movement.status === 'pending' || movement.status === 'processing') {
    return t('tabScreens.wallet.list.transferPendingTitle')
  }

  if (movement.status === 'failed') {
    return t('tabScreens.wallet.list.transferFailedTitle')
  }

  if (movement.status === 'cancelled') {
    return t('tabScreens.wallet.list.transferCancelledTitle')
  }

  return t('tabScreens.wallet.list.transferCompletedTitle')
}

export function getWalletMovementSubtitle(
  locale: string,
  movement: ActivityPreview | WalletTransaction,
) {
  if (
    'transferDetails' in movement &&
    movement.transferDetails?.payoutAccount
  ) {
    return `${formatWalletPaymentAccount(movement.transferDetails.payoutAccount)} · ${formatWalletDateTime(movement.occurredAt, locale)}`
  }

  return formatWalletDateTime(movement.occurredAt, locale)
}

export function getWalletMovementAccessibilityHint(t: TFunction) {
  return t('tabScreens.wallet.common.openMovementHint')
}

export function getWalletMovementAccessibilityLabel(
  t: TFunction,
  locale: string,
  movement: ActivityPreview | WalletTransaction,
) {
  return [
    getWalletMovementTitle(t, movement),
    getWalletMovementBadgeLabel(t, movement),
    formatWalletAmount(movement.amount.amountMinor, locale),
    getWalletMovementSubtitle(locale, movement),
  ]
    .filter((part) => part && String(part).trim().length > 0)
    .join('. ')
}

export function getWalletMovementDateHeading(
  locale: string,
  movement: ActivityPreview | WalletTransaction,
) {
  return formatWalletLongDate(movement.occurredAt, locale)
}

export function getWalletMovementStateCopy(
  t: TFunction,
  movement: WalletTransaction,
) {
  if (movement.type === 'credit') {
    return {
      description: t('tabScreens.wallet.movementDetail.credit.description'),
      stateCardTitle: t(
        'tabScreens.wallet.movementDetail.credit.stateCardTitle',
      ),
      stateLabel: t('tabScreens.wallet.movementDetail.credit.stateLabel'),
    } as const
  }

  if (movement.status === 'completed') {
    return {
      description: t(
        'tabScreens.wallet.movementDetail.transfer.completed.description',
      ),
      stateCardTitle: t(
        'tabScreens.wallet.movementDetail.transfer.completed.stateCardTitle',
      ),
      stateLabel: t(
        'tabScreens.wallet.movementDetail.transfer.completed.stateLabel',
      ),
    } as const
  }

  if (movement.status === 'failed') {
    return {
      description: t(
        'tabScreens.wallet.movementDetail.transfer.failed.description',
      ),
      stateCardTitle: t(
        'tabScreens.wallet.movementDetail.transfer.failed.stateCardTitle',
      ),
      stateLabel: t(
        'tabScreens.wallet.movementDetail.transfer.failed.stateLabel',
      ),
    } as const
  }

  if (movement.status === 'cancelled') {
    return {
      description: t(
        'tabScreens.wallet.movementDetail.transfer.cancelled.description',
      ),
      stateCardTitle: t(
        'tabScreens.wallet.movementDetail.transfer.cancelled.stateCardTitle',
      ),
      stateLabel: t(
        'tabScreens.wallet.movementDetail.transfer.cancelled.stateLabel',
      ),
    } as const
  }

  return {
    description: t(
      'tabScreens.wallet.movementDetail.transfer.processing.description',
    ),
    footer: t('tabScreens.wallet.movementDetail.transfer.processing.footer'),
    stateCardTitle: t(
      'tabScreens.wallet.movementDetail.transfer.processing.stateCardTitle',
    ),
    stateLabel: t(
      'tabScreens.wallet.movementDetail.transfer.processing.stateLabel',
    ),
    timelineTitle: t(
      'tabScreens.wallet.movementDetail.transfer.processing.timelineTitle',
    ),
  } as const
}

export function getWalletMovementDetailItems(
  t: TFunction,
  locale: string,
  movement: WalletTransaction,
) {
  if (movement.type === 'credit') {
    return detailItemSchema.array().parse([
      {
        label: t('tabScreens.wallet.detailLabels.amountLabel'),
        tone: 'success',
        value: formatWalletAmount(movement.amount.amountMinor, locale),
      },
      {
        label: t('tabScreens.wallet.detailLabels.locationLabel'),
        value: movement.creditDetails?.locationName ?? '-',
      },
      {
        label: t('tabScreens.wallet.detailLabels.packageCountLabel'),
        value: formatWalletCount(
          movement.creditDetails?.packageCount ?? 0,
          locale,
        ),
      },
      {
        label: t('tabScreens.wallet.detailLabels.creditedAtLabel'),
        value: formatWalletDateTime(movement.occurredAt, locale),
      },
    ])
  }

  const commonItems = [
    {
      label: t('tabScreens.wallet.detailLabels.amountLabel'),
      tone: 'accent' as const,
      value: formatWalletAmount(movement.amount.amountMinor, locale),
    },
    {
      label: t('tabScreens.wallet.detailLabels.paymentAccountLabel'),
      value: movement.transferDetails?.payoutAccount
        ? formatWalletPaymentAccount(movement.transferDetails.payoutAccount)
        : '-',
    },
    {
      label: t('tabScreens.wallet.detailLabels.requestedAtLabel'),
      value: formatWalletDateTime(
        movement.transferDetails?.requestedAt ?? movement.occurredAt,
        locale,
      ),
    },
  ]

  if (movement.status === 'pending' || movement.status === 'processing') {
    return detailItemSchema.array().parse([
      ...commonItems,
      {
        label: t('tabScreens.wallet.detailLabels.expectedArrivalLabel'),
        value: movement.transferDetails?.expectedArrivalAt
          ? formatWalletDateTime(
              movement.transferDetails.expectedArrivalAt,
              locale,
            )
          : '-',
      },
      {
        label: t('tabScreens.wallet.detailLabels.updatedLabel'),
        value: formatWalletDateTime(movement.occurredAt, locale),
      },
    ])
  }

  if (movement.status === 'failed') {
    return detailItemSchema.array().parse([
      ...commonItems,
      {
        label: t('tabScreens.wallet.detailLabels.referenceLabel'),
        value: movement.id,
      },
      {
        label: t('tabScreens.wallet.detailLabels.failedAtLabel'),
        value: formatWalletDateTime(movement.occurredAt, locale),
      },
    ])
  }

  if (movement.status === 'cancelled') {
    return detailItemSchema.array().parse([
      ...commonItems,
      {
        label: t('tabScreens.wallet.detailLabels.referenceLabel'),
        value: movement.id,
      },
      {
        label: t('tabScreens.wallet.detailLabels.cancelledAtLabel'),
        value: formatWalletDateTime(movement.occurredAt, locale),
      },
    ])
  }

  return detailItemSchema.array().parse([
    ...commonItems,
    {
      label: t('tabScreens.wallet.detailLabels.referenceLabel'),
      value: movement.id,
    },
    {
      label: t('tabScreens.wallet.detailLabels.completedAtLabel'),
      value: formatWalletDateTime(movement.occurredAt, locale),
    },
  ])
}

export function getWalletMovementSummaryItems(
  t: TFunction,
  locale: string,
  movement: WalletTransaction,
) {
  if (movement.type === 'credit') {
    return detailItemSchema.array().parse([
      {
        label: t('tabScreens.wallet.detailLabels.locationLabel'),
        value: movement.creditDetails?.locationName ?? '-',
      },
      {
        label: t('tabScreens.wallet.detailLabels.packageCountLabel'),
        value: formatWalletCount(
          movement.creditDetails?.packageCount ?? 0,
          locale,
        ),
      },
      {
        label: t('tabScreens.wallet.detailLabels.creditedAtLabel'),
        value: formatWalletDateTime(movement.occurredAt, locale),
      },
    ])
  }

  if (movement.status === 'pending' || movement.status === 'processing') {
    return detailItemSchema.array().parse([
      {
        label: t('tabScreens.wallet.detailLabels.expectedArrivalLabel'),
        value: movement.transferDetails?.expectedArrivalAt
          ? formatWalletDateTime(
              movement.transferDetails.expectedArrivalAt,
              locale,
            )
          : '-',
      },
      {
        label: t('tabScreens.wallet.detailLabels.paymentAccountLabel'),
        value: movement.transferDetails?.payoutAccount
          ? formatWalletPaymentAccount(movement.transferDetails.payoutAccount)
          : '-',
      },
      {
        label: t('tabScreens.wallet.detailLabels.requestedAtLabel'),
        value: formatWalletDateTime(
          movement.transferDetails?.requestedAt ?? movement.occurredAt,
          locale,
        ),
      },
    ])
  }

  if (movement.status === 'failed') {
    return detailItemSchema.array().parse([
      {
        label: t('tabScreens.wallet.detailLabels.paymentAccountLabel'),
        value: movement.transferDetails?.payoutAccount
          ? formatWalletPaymentAccount(movement.transferDetails.payoutAccount)
          : '-',
      },
      {
        label: t('tabScreens.wallet.detailLabels.failedAtLabel'),
        value: formatWalletDateTime(movement.occurredAt, locale),
      },
      {
        label: t('tabScreens.wallet.detailLabels.referenceLabel'),
        value: movement.id,
      },
    ])
  }

  if (movement.status === 'cancelled') {
    return detailItemSchema.array().parse([
      {
        label: t('tabScreens.wallet.detailLabels.paymentAccountLabel'),
        value: movement.transferDetails?.payoutAccount
          ? formatWalletPaymentAccount(movement.transferDetails.payoutAccount)
          : '-',
      },
      {
        label: t('tabScreens.wallet.detailLabels.cancelledAtLabel'),
        value: formatWalletDateTime(movement.occurredAt, locale),
      },
      {
        label: t('tabScreens.wallet.detailLabels.referenceLabel'),
        value: movement.id,
      },
    ])
  }

  return detailItemSchema.array().parse([
    {
      label: t('tabScreens.wallet.detailLabels.paymentAccountLabel'),
      value: movement.transferDetails?.payoutAccount
        ? formatWalletPaymentAccount(movement.transferDetails.payoutAccount)
        : '-',
    },
    {
      label: t('tabScreens.wallet.detailLabels.completedAtLabel'),
      value: formatWalletDateTime(movement.occurredAt, locale),
    },
    {
      label: t('tabScreens.wallet.detailLabels.referenceLabel'),
      value: movement.id,
    },
  ])
}

export function getWalletTransferTimelineItems(
  t: TFunction,
  movement: WalletTransaction,
) {
  return timelineItemSchema.array().parse(
    getWalletTransferTimelineSteps(movement).map((step) => {
      const translationKey = timelineTranslationKeyMap[step.id]

      return {
        accessibilityStateLabel: t(
          `tabScreens.wallet.movementDetail.transfer.processing.timelineStates.${step.state}`,
        ),
        description: t(
          `tabScreens.wallet.movementDetail.transfer.processing.timeline.${translationKey}.description`,
        ),
        id: step.id,
        label: t(
          `tabScreens.wallet.movementDetail.transfer.processing.timeline.${translationKey}.label`,
        ),
        state: step.state,
      }
    }),
  )
}

export function getWalletMovementReceiptShareMessage(
  t: TFunction,
  locale: string,
  movement: WalletTransaction,
) {
  const detailLines = getWalletMovementDetailItems(t, locale, movement).map(
    (item) => `${item.label}: ${String(item.value)}`,
  )

  return [getWalletMovementTitle(t, movement), ...detailLines].join('\n')
}
