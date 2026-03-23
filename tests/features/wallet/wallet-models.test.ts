import { act } from '@testing-library/react-native'
import {
  getMockWalletHistoryState,
  getMockWalletOverviewState,
} from '@/features/app-data/mock/wallet'
import { MOCK_API_DELAY_MS } from '@/features/app-data/mock'
import {
  formatWalletAmount,
  formatWalletPaymentAccount,
  getWalletTransactionById,
  getWalletTransactionBadgeTone,
} from '@/features/wallet/models'
import {
  getWalletHistoryFilterOptions,
  getWalletMovementBadgeLabel,
  getWalletMovementTitle,
  matchesWalletHistoryFilter,
} from '@/features/wallet/presentation'
import {
  serializeWalletTransferForm,
  getWalletTransferFormSchema,
  normalizeTransferAmountInput,
} from '@/features/wallet/forms'
import { i18n, setLocaleOverrideForTests, syncLocale } from '@/i18n'

describe('wallet models and forms', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    setLocaleOverrideForTests('pt-PT')
    syncLocale('system')
  })

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers()
    })
    jest.useRealTimers()
  })

  afterAll(() => {
    setLocaleOverrideForTests('pt-PT')
    syncLocale('system')
  })

  it('builds wallet models from backend transaction state', async () => {
    const walletPromise = getMockWalletOverviewState()
    const historyPromise = getMockWalletHistoryState()

    await act(async () => {
      jest.advanceTimersByTime(MOCK_API_DELAY_MS)
      await Promise.resolve()
    })

    const wallet = await walletPromise
    const history = await historyPromise
    const filters = getWalletHistoryFilterOptions(i18n.t.bind(i18n))

    expect(wallet.balance.amountMinor).toBe(470)
    expect(filters.map((filter) => filter.label)).toEqual([
      'Todos',
      'Créditos',
      'Transferências',
    ])
    expect(history.items[0]?.id).toBe('11111111-1111-4111-8111-111111111111')
    expect(
      getWalletTransactionById(
        '22222222-2222-4222-8222-222222222222',
        history.items,
      )?.status,
    ).toBe('processing')
    expect(
      history.items.filter((movement) =>
        matchesWalletHistoryFilter('transfer', movement),
      ),
    ).toHaveLength(2)
    expect(
      formatWalletPaymentAccount({
        ibanMasked: 'PT50************90123',
        spinEnabled: true,
      }),
    ).toBe('PT50************90123 • SPIN')
    expect(getWalletTransactionBadgeTone(history.items[1]!)).toBe('warning')
  })

  it('normalizes transfer input and serializes the backend request payload', () => {
    expect(normalizeTransferAmountInput('EUR 1,257')).toBe('1,25')
    expect(
      serializeWalletTransferForm({
        amount: '1,25',
        useSpin: true,
      }),
    ).toEqual({
      amount: {
        amountMinor: 125,
        currency: 'EUR',
      },
      payoutRail: 'spin',
    })
  })

  it('returns localized transfer validation errors for zero and over-balance amounts', () => {
    const availableBalance = formatWalletAmount(470, 'pt')
    const schema = getWalletTransferFormSchema(470, {
      amountFieldHelper: i18n.t(
        'tabScreens.wallet.transfer.amountFieldHelper',
        {
          amount: availableBalance,
        },
      ),
      exceedsBalanceError: i18n.t(
        'tabScreens.wallet.transfer.exceedsBalanceError',
        {
          amount: availableBalance,
        },
      ),
      zeroAmountError: i18n.t('tabScreens.wallet.transfer.zeroAmountError'),
    })
    const zeroResult = schema.safeParse({ amount: '0,00' })
    const overBalanceResult = schema.safeParse({ amount: '9,99' })

    expect(zeroResult.success).toBe(false)
    expect(overBalanceResult.success).toBe(false)
  })

  it('returns distinct transfer labels for pending, failed, and cancelled history items', () => {
    const t = i18n.t.bind(i18n)

    expect(
      getWalletMovementTitle(t, {
        amount: {
          amountMinor: -120,
          currency: 'EUR',
        },
        id: 'pending-transfer',
        occurredAt: '2026-03-14T13:10:00Z',
        status: 'processing',
        transferDetails: {
          requestedAt: '2026-03-14T13:10:00Z',
        },
        type: 'transfer_debit',
      }),
    ).toBe('Transferência em curso')
    expect(
      getWalletMovementBadgeLabel(t, {
        amount: {
          amountMinor: -120,
          currency: 'EUR',
        },
        id: 'failed-transfer',
        occurredAt: '2026-03-14T13:10:00Z',
        status: 'failed',
        transferDetails: {
          requestedAt: '2026-03-14T13:10:00Z',
        },
        type: 'transfer_debit',
      }),
    ).toBe('Falhou')
    expect(
      getWalletMovementBadgeLabel(t, {
        amount: {
          amountMinor: -120,
          currency: 'EUR',
        },
        id: 'cancelled-transfer',
        occurredAt: '2026-03-14T13:10:00Z',
        status: 'cancelled',
        transferDetails: {
          requestedAt: '2026-03-14T13:10:00Z',
        },
        type: 'transfer_debit',
      }),
    ).toBe('Cancelada')
  })
})
