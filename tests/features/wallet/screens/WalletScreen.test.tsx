import { fireEvent, screen } from '@testing-library/react-native'
import WalletScreen from '@/features/wallet/screens/WalletScreen'
import { walletResponseSchema } from '@/features/wallet/models'
import { walletRoutes } from '@/features/wallet/routes'
import { i18n, setLocaleOverrideForTests, syncLocale } from '@/i18n'
import { renderWithProvider } from '@tests/support/test-utils'

jest.mock('expo-router', () => {
  const { createExpoRouterMock } = jest.requireActual(
    '@tests/support/expo-router-mock',
  )

  return createExpoRouterMock()
})

jest.mock('@/features/wallet/hooks', () => ({
  useWalletOverviewQuery: jest.fn(),
}))

const { __mockRouterPush: mockRouterPush } = jest.requireMock('expo-router')
const { useWalletOverviewQuery: mockUseWalletOverviewQuery } = jest.requireMock(
  '@/features/wallet/hooks',
)

const walletOverviewState = walletResponseSchema.parse({
  balance: {
    amountMinor: 470,
    currency: 'EUR',
  },
  recentTransactions: [
    {
      amount: {
        amountMinor: 30,
        currency: 'EUR',
      },
      id: '11111111-1111-4111-8111-111111111111',
      occurredAt: '2026-04-08T10:00:00.000Z',
      status: 'completed',
      subtitle: '6 embalagens',
      title: 'Pingo Doce - Afragide',
      type: 'credit',
    },
    {
      amount: {
        amountMinor: -470,
        currency: 'EUR',
      },
      id: '22222222-2222-4222-8222-222222222222',
      occurredAt: '2026-04-08T11:15:00.000Z',
      status: 'processing',
      subtitle: 'PT50************4321',
      title: 'Transferência',
      type: 'transfer_debit',
    },
  ],
  stats: {
    completedTransfersCount: 5,
    creditsEarned: {
      amountMinor: 1250,
      currency: 'EUR',
    },
    processingTransfersCount: 1,
    returnedPackagesCount: 30,
  },
  transferEligibility: {
    canTransfer: true,
    maximumTransfer: {
      amountMinor: 470,
      currency: 'EUR',
    },
    minimumTransfer: {
      amountMinor: 100,
      currency: 'EUR',
    },
    reason: null,
  },
})

const emptyWalletOverviewState = walletResponseSchema.parse({
  balance: {
    amountMinor: 0,
    currency: 'EUR',
  },
  recentTransactions: [],
  stats: {
    completedTransfersCount: 0,
    creditsEarned: {
      amountMinor: 0,
      currency: 'EUR',
    },
    processingTransfersCount: 0,
    returnedPackagesCount: 0,
  },
  transferEligibility: {
    canTransfer: false,
    maximumTransfer: {
      amountMinor: 0,
      currency: 'EUR',
    },
    minimumTransfer: {
      amountMinor: 100,
      currency: 'EUR',
    },
    reason: null,
  },
})

describe('WalletScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setLocaleOverrideForTests('pt-PT')
    syncLocale('system')
    mockUseWalletOverviewQuery.mockReturnValue({
      data: undefined,
      isError: false,
      isPending: true,
      isRefetching: false,
      refetch: jest.fn(),
    })
  })

  afterAll(() => {
    setLocaleOverrideForTests('pt-PT')
    syncLocale('system')
  })

  it('renders the loading skeleton while the query is pending', () => {
    renderWithProvider(<WalletScreen />)

    expect(screen.getByTestId('wallet-screen-skeleton')).toBeTruthy()
  })

  it('renders the error state and retries the query', () => {
    const refetch = jest.fn()

    mockUseWalletOverviewQuery.mockReturnValue({
      data: undefined,
      isError: true,
      isPending: false,
      isRefetching: false,
      refetch,
    })

    renderWithProvider(<WalletScreen />)

    expect(screen.getByTestId('wallet-screen-error-state')).toBeTruthy()

    fireEvent.press(screen.getByText(i18n.t('routes.queryError.retryLabel')))

    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('renders the overview and routes transfer, history, and movement detail actions', () => {
    mockUseWalletOverviewQuery.mockReturnValue({
      data: walletOverviewState,
      isError: false,
      isPending: false,
      isRefetching: false,
      refetch: jest.fn(),
    })

    renderWithProvider(<WalletScreen />)

    expect(screen.getByTestId('wallet-screen')).toBeTruthy()
    expect(screen.getByText('Pingo Doce - Afragide')).toBeTruthy()
    expect(screen.getByText('Transferência')).toBeTruthy()

    fireEvent.press(
      screen.getByText(
        i18n.t('tabScreens.wallet.overview.balanceCard.actionLabel'),
      ),
    )
    fireEvent.press(
      screen.getByText(
        i18n.t('tabScreens.wallet.overview.latestMovements.actionLabel'),
      ),
    )
    fireEvent.press(screen.getByLabelText('Pingo Doce - Afragide'))

    expect(mockRouterPush).toHaveBeenNthCalledWith(1, walletRoutes.transfer)
    expect(mockRouterPush).toHaveBeenNthCalledWith(2, walletRoutes.movements)
    expect(mockRouterPush).toHaveBeenNthCalledWith(
      3,
      walletRoutes.movementDetail(
        walletOverviewState.recentTransactions[0]!.id,
      ),
    )
  })

  it('renders the empty overview state when transfers are unavailable and there is no history', () => {
    mockUseWalletOverviewQuery.mockReturnValue({
      data: emptyWalletOverviewState,
      isError: false,
      isPending: false,
      isRefetching: false,
      refetch: jest.fn(),
    })

    renderWithProvider(<WalletScreen />)

    expect(
      screen.getByText(
        i18n.t('tabScreens.wallet.overview.latestMovements.emptyTitle'),
      ),
    ).toBeTruthy()
    expect(
      screen.getByText(
        i18n.t(
          'tabScreens.wallet.overview.latestMovements.emptyNoBalanceDescription',
        ),
      ),
    ).toBeTruthy()

    fireEvent.press(
      screen.getByText(
        i18n.t('tabScreens.wallet.overview.balanceCard.actionLabel'),
      ),
    )

    expect(mockRouterPush).toHaveBeenCalledWith(walletRoutes.transfer)
  })
})
