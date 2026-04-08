import {
  getWalletTransferAmountError,
  getWalletTransferFormDefaultValues,
  getWalletTransferFormSchema,
  normalizeTransferAmountInput,
  parseTransferAmountCents,
  serializeWalletTransferForm,
} from '@/features/wallet/forms'
import {
  activityPreviewSchema,
  formatWalletAmount,
  formatWalletCompactAmount,
  formatWalletCompactCount,
  formatWalletCount,
  formatWalletDateTime,
  formatWalletPaymentAccount,
  getWalletMovementStateTone,
  getWalletTransactionAmountTone,
  getWalletTransactionBadgeTone,
  getWalletTransactionById,
  getWalletTransactionDetailItemsBase,
  getWalletTransactionStateTone,
  getWalletTransferTimelineSteps,
  isTransferTransaction,
  walletTransactionSchema,
} from '@/features/wallet/models'
import {
  getWalletHistoryFilterOptions,
  getWalletMovementBadgeLabel,
  getWalletMovementDetailItems,
  getWalletMovementStateCopy,
  getWalletMovementSubtitle,
  getWalletMovementSummaryItems,
  getWalletMovementTitle,
  getWalletTransferTimelineItems,
  matchesWalletHistoryFilter,
} from '@/features/wallet/presentation'
import { i18n, setLocaleOverrideForTests, syncLocale } from '@/i18n'

const t = i18n.t.bind(i18n)

const creditMovement = walletTransactionSchema.parse({
  amount: {
    amountMinor: 470,
    currency: 'EUR',
  },
  creditDetails: {
    locationName: 'Volta Chiado',
    packageCount: 3,
  },
  description: 'Credit generated',
  id: 'credit-1',
  occurredAt: '2026-03-14T13:10:00Z',
  status: 'completed',
  type: 'credit',
})

const processingTransfer = walletTransactionSchema.parse({
  amount: {
    amountMinor: -120,
    currency: 'EUR',
  },
  id: 'transfer-processing',
  occurredAt: '2026-03-14T13:10:00Z',
  status: 'processing',
  transferDetails: {
    expectedArrivalAt: '2026-03-16T13:10:00Z',
    payoutAccount: {
      ibanMasked: 'PT50************90123',
      rail: 'spin',
    },
    requestedAt: '2026-03-14T13:10:00Z',
  },
  type: 'transfer_debit',
})

const failedTransfer = walletTransactionSchema.parse({
  ...processingTransfer,
  id: 'transfer-failed',
  status: 'failed',
  transferDetails: {
    ...processingTransfer.transferDetails,
    failureReason: 'Bank rejected transfer',
  },
})

const cancelledTransfer = walletTransactionSchema.parse({
  ...processingTransfer,
  id: 'transfer-cancelled',
  status: 'cancelled',
})

const completedTransfer = walletTransactionSchema.parse({
  ...processingTransfer,
  id: 'transfer-completed',
  status: 'completed',
})

const creditWithoutLocation = walletTransactionSchema.parse({
  ...creditMovement,
  creditDetails: undefined,
  id: 'credit-no-location',
})

const creditWithoutSummaryCopy = walletTransactionSchema.parse({
  ...creditMovement,
  creditDetails: undefined,
  description: null,
  id: 'credit-no-copy',
})

const pendingTransferWithoutOptionalDetails = walletTransactionSchema.parse({
  ...processingTransfer,
  id: 'transfer-pending-fallbacks',
  status: 'pending',
  transferDetails: {
    expectedArrivalAt: null,
    payoutAccount: undefined,
    requestedAt: '2026-03-15T10:30:00Z',
  },
})

const completedTransferWithoutDetails = walletTransactionSchema.parse({
  ...completedTransfer,
  id: 'transfer-completed-fallbacks',
  transferDetails: undefined,
})

describe('wallet models, forms, and presentation', () => {
  beforeEach(() => {
    setLocaleOverrideForTests('pt-PT')
    syncLocale('system')
  })

  afterAll(() => {
    setLocaleOverrideForTests('pt-PT')
    syncLocale('system')
  })

  it('formats wallet primitives and classifies transaction state', () => {
    expect(formatWalletAmount(470, 'pt')).toContain('4,70')
    expect(formatWalletCompactAmount(12_500, 'pt')).toContain('125')
    expect(formatWalletCount(1234, 'pt')).toMatch(/1.?234/)
    expect(formatWalletCompactCount(1200, 'pt')).toBeTruthy()
    expect(formatWalletDateTime('2026-03-14T13:10:00Z', 'pt')).toBeTruthy()
    expect(
      formatWalletPaymentAccount({
        ibanMasked: 'PT50************90123',
        rail: 'spin',
      }),
    ).toBe('PT50************90123 • SPIN')
    expect(
      formatWalletPaymentAccount({
        ibanMasked: 'PT50************90123',
        rail: 'sepa',
      }),
    ).toBe('PT50************90123')
    expect(isTransferTransaction(creditMovement)).toBe(false)
    expect(isTransferTransaction(processingTransfer)).toBe(true)
    expect(getWalletTransactionAmountTone(creditMovement)).toBe('success')
    expect(getWalletTransactionAmountTone(processingTransfer)).toBe('accent')
    expect(getWalletTransactionBadgeTone(creditMovement)).toBe('success')
    expect(getWalletTransactionBadgeTone(processingTransfer)).toBe('warning')
    expect(getWalletTransactionBadgeTone(failedTransfer)).toBe('error')
    expect(getWalletTransactionStateTone(completedTransfer)).toBe('accent')
    expect(getWalletMovementStateTone(cancelledTransfer)).toBe('error')
    expect(
      getWalletTransactionById('transfer-processing', [
        creditMovement,
        processingTransfer,
      ]),
    ).toEqual(processingTransfer)
    expect(getWalletTransferTimelineSteps(processingTransfer)).toEqual([
      { id: 'received', state: 'done' },
      { id: 'account-confirmed', state: 'done' },
      { id: 'sending', state: 'current' },
      { id: 'completed', state: 'upcoming' },
    ])
    expect(getWalletTransferTimelineSteps(completedTransfer)).toEqual([
      { id: 'received', state: 'done' },
      { id: 'account-confirmed', state: 'done' },
      { id: 'sending', state: 'done' },
      { id: 'completed', state: 'done' },
    ])
    expect(
      getWalletTransactionDetailItemsBase([
        {
          label: 'Reference',
          value: 'wallet-1',
        },
      ]),
    ).toEqual([
      {
        label: 'Reference',
        value: 'wallet-1',
      },
    ])
  })

  it('builds history filters, movement labels, detail items, and timeline copy', () => {
    const previewMovement = activityPreviewSchema.parse({
      amount: {
        amountMinor: 470,
        currency: 'EUR',
      },
      id: 'preview-credit',
      occurredAt: '2026-03-14T13:10:00Z',
      status: 'completed',
      subtitle: null,
      title: 'Preview movement',
      type: 'credit',
    })

    expect(
      getWalletHistoryFilterOptions(t).map((option) => option.label),
    ).toEqual(['Todos', 'Créditos', 'Transferências'])
    expect(matchesWalletHistoryFilter('all', processingTransfer)).toBe(true)
    expect(matchesWalletHistoryFilter('transfer', processingTransfer)).toBe(
      true,
    )
    expect(matchesWalletHistoryFilter('transfer', creditMovement)).toBe(false)
    expect(matchesWalletHistoryFilter('credit', creditMovement)).toBe(true)
    expect(getWalletMovementBadgeLabel(t, creditMovement)).toBe('Recebido')
    expect(getWalletMovementBadgeLabel(t, processingTransfer)).toBe(
      'Em processo',
    )
    expect(getWalletMovementBadgeLabel(t, failedTransfer)).toBe('Falhou')
    expect(getWalletMovementBadgeLabel(t, cancelledTransfer)).toBe('Cancelada')
    expect(getWalletMovementBadgeLabel(t, completedTransfer)).toBe('Concluída')
    expect(getWalletMovementTitle(t, previewMovement)).toBe('Preview movement')
    expect(getWalletMovementTitle(t, creditMovement)).toBe('Volta Chiado')
    expect(getWalletMovementTitle(t, processingTransfer)).toBe(
      'Transferência em curso',
    )
    expect(getWalletMovementTitle(t, failedTransfer)).toBe(
      'Transferência falhada',
    )
    expect(getWalletMovementTitle(t, cancelledTransfer)).toBe(
      'Transferência cancelada',
    )
    expect(getWalletMovementTitle(t, completedTransfer)).toBe(
      'Transferência para a conta',
    )
    expect(getWalletMovementSubtitle('pt', processingTransfer)).toContain(
      'PT50************90123 • SPIN',
    )
    expect(getWalletMovementSubtitle('pt', creditMovement)).toBeTruthy()
    expect(getWalletMovementStateCopy(t, creditMovement)).toEqual(
      expect.objectContaining({
        stateLabel: 'Crédito recebido',
      }),
    )
    expect(getWalletMovementStateCopy(t, processingTransfer)).toEqual(
      expect.objectContaining({
        footer: expect.any(String),
        timelineTitle: expect.any(String),
      }),
    )
    expect(getWalletMovementStateCopy(t, failedTransfer).stateLabel).toBe(
      'Falhou',
    )
    expect(getWalletMovementStateCopy(t, cancelledTransfer).stateLabel).toBe(
      'Cancelada',
    )
    expect(getWalletMovementStateCopy(t, completedTransfer).stateLabel).toBe(
      'Concluída',
    )
    expect(getWalletMovementDetailItems(t, 'pt', creditMovement)).toHaveLength(
      4,
    )
    expect(
      getWalletMovementDetailItems(t, 'pt', processingTransfer),
    ).toHaveLength(5)
    expect(getWalletMovementDetailItems(t, 'pt', failedTransfer)).toHaveLength(
      5,
    )
    expect(
      getWalletMovementDetailItems(t, 'pt', cancelledTransfer),
    ).toHaveLength(5)
    expect(
      getWalletMovementDetailItems(t, 'pt', completedTransfer),
    ).toHaveLength(5)
    expect(getWalletMovementSummaryItems(t, 'pt', creditMovement)).toHaveLength(
      3,
    )
    expect(
      getWalletMovementSummaryItems(t, 'pt', processingTransfer),
    ).toHaveLength(3)
    expect(getWalletMovementSummaryItems(t, 'pt', failedTransfer)).toHaveLength(
      3,
    )
    expect(
      getWalletMovementSummaryItems(t, 'pt', cancelledTransfer),
    ).toHaveLength(3)
    expect(
      getWalletMovementSummaryItems(t, 'pt', completedTransfer),
    ).toHaveLength(3)
    expect(getWalletTransferTimelineItems(t, processingTransfer)).toEqual([
      expect.objectContaining({
        id: 'received',
        state: 'done',
      }),
      expect.objectContaining({
        id: 'account-confirmed',
        state: 'done',
      }),
      expect.objectContaining({
        id: 'sending',
        state: 'current',
      }),
      expect.objectContaining({
        id: 'completed',
        state: 'upcoming',
      }),
    ])
  })

  it('falls back when credit and transfer detail fields are missing', () => {
    expect(getWalletMovementTitle(t, creditWithoutLocation)).toBe(
      'Credit generated',
    )
    expect(getWalletMovementTitle(t, creditWithoutSummaryCopy)).toBe('-')
    expect(
      getWalletMovementSubtitle('pt', completedTransferWithoutDetails),
    ).toEqual(expect.any(String))

    expect(
      getWalletMovementDetailItems(
        t,
        'pt',
        pendingTransferWithoutOptionalDetails,
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: t('tabScreens.wallet.detailLabels.paymentAccountLabel'),
          value: '-',
        }),
        expect.objectContaining({
          label: t('tabScreens.wallet.detailLabels.expectedArrivalLabel'),
          value: '-',
        }),
        expect.objectContaining({
          label: t('tabScreens.wallet.detailLabels.requestedAtLabel'),
          value: formatWalletDateTime('2026-03-15T10:30:00Z', 'pt'),
        }),
      ]),
    )

    expect(
      getWalletMovementSummaryItems(
        t,
        'pt',
        pendingTransferWithoutOptionalDetails,
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: t('tabScreens.wallet.detailLabels.expectedArrivalLabel'),
          value: '-',
        }),
        expect.objectContaining({
          label: t('tabScreens.wallet.detailLabels.paymentAccountLabel'),
          value: '-',
        }),
      ]),
    )

    expect(
      getWalletMovementSummaryItems(t, 'pt', completedTransferWithoutDetails),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: t('tabScreens.wallet.detailLabels.paymentAccountLabel'),
          value: '-',
        }),
      ]),
    )
  })

  it('normalizes transfer input, validates balances, and serializes the request payload', () => {
    const validation = {
      amountFieldHelper: 'helper',
      exceedsBalanceError: 'exceeds',
      zeroAmountError: 'zero',
    }

    expect(normalizeTransferAmountInput('EUR 1,257')).toBe('1,25')
    expect(normalizeTransferAmountInput(',,12..34')).toBe('0,12')
    expect(parseTransferAmountCents('')).toBeNull()
    expect(parseTransferAmountCents('0,99')).toBe(99)
    expect(parseTransferAmountCents('12.5')).toBe(1250)
    expect(parseTransferAmountCents('abc')).toBeNull()
    expect(getWalletTransferAmountError('', 470, validation)).toBeUndefined()
    expect(getWalletTransferAmountError('0,00', 470, validation)).toBe('zero')
    expect(getWalletTransferAmountError('9,99', 470, validation)).toBe(
      'exceeds',
    )
    expect(
      getWalletTransferAmountError('1,25', 470, validation),
    ).toBeUndefined()
    expect(getWalletTransferFormDefaultValues()).toEqual({
      amount: '',
    })
    expect(
      getWalletTransferFormSchema(470, validation).safeParse({
        amount: '0,00',
      }).success,
    ).toBe(false)
    expect(
      getWalletTransferFormSchema(470, validation).safeParse({
        amount: '9,99',
      }).success,
    ).toBe(false)
    expect(
      getWalletTransferFormSchema(470, validation).safeParse({
        amount: '1,25',
      }).success,
    ).toBe(true)
    expect(
      serializeWalletTransferForm({
        amount: '1,25',
      }),
    ).toEqual({
      amount: {
        amountMinor: 125,
        currency: 'EUR',
      },
    })
  })
})
